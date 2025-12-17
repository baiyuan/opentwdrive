import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SmartFileDropzone from '../components/SmartFileDropzone';
import MultiDestinationSelector from '../components/upload/MultiDestinationSelector';
import UploadProgress from '../components/upload/UploadProgress';
import ZipDownloadDialog from '../components/upload/ZipDownloadDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, Sparkles, Shield, Zap, FileText, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { S3Client, PutObjectCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createPageUrl } from '../utils';

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState(['base44']);
  const [currentFile, setCurrentFile] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [completedFiles, setCompletedFiles] = useState([]);
  const [showZipDialog, setShowZipDialog] = useState(false);
  const uploadControllersRef = useRef([]);

  const { data: storageAccounts = [] } = useQuery({
    queryKey: ['storageAccounts'],
    queryFn: () => base44.entities.StorageAccount.list('-created_date'),
  });

  useEffect(() => {
    // 設置頁面標題
    document.title = 'OpenTWDrive';
    
    // 載入用戶上次的選擇
    const loadLastSelection = async () => {
      try {
        const user = await base44.auth.me();
        if (user.last_selected_storage_accounts && user.last_selected_storage_accounts.length > 0) {
          setSelectedAccounts(user.last_selected_storage_accounts);
        }
      } catch (error) {
        // 靜默處理，不顯示錯誤
      }
    };
    loadLastSelection();
  }, []);

  const createUploadLog = async (logData) => {
    try {
      await base44.entities.UploadLog.create(logData);
    } catch (error) {
      // 日誌記錄失敗不影響用戶體驗
    }
  };

  const sanitizeFileName = (fileName) => {
    // 移除潛在的路徑遍歷字元和特殊字元
    return fileName
      .replace(/[<>:"|?*\x00-\x1F]/g, '')
      .replace(/^\.+/, '')
      .replace(/\.\./g, '')
      .substring(0, 255);
  };

  const uploadToIDrive = async (file, account, onProgress) => {
    try {
      const regionMatch = account.endpoint.match(/s3\.([^.]+)\.idrivee2/);
      const region = regionMatch ? regionMatch[1] : 'us-east-1';
      
      // 驗證 endpoint 格式
      if (!account.endpoint.match(/^https?:\/\/.+\.idrivee2\.com$/)) {
        throw new Error('無效的儲存服務端點');
      }
      
      const s3Client = new S3Client({
        endpoint: account.endpoint,
        region: region,
        credentials: {
          accessKeyId: account.access_key_id,
          secretAccessKey: account.secret_access_key,
        },
        forcePathStyle: true,
        requestHandler: {
          connectionTimeout: 30000,
          socketTimeout: 30000,
        },
      });

      // 淨化檔案名稱以防止路徑遍歷攻擊
      const sanitizedName = sanitizeFileName(file.name);
      const key = `${Date.now()}-${sanitizedName}`;
      
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: account.bucket_name,
          Key: key,
          Body: file,
          ContentType: file.type,
          ServerSideEncryption: 'AES256',
        },
      });

      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          onProgress?.(percentage);
        }
      });

      await upload.done();
      
      const endpointUrl = account.endpoint.replace(/\/$/, '');
      return {
        url: `${endpointUrl}/${account.bucket_name}/${key}`,
        controller: upload,
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('上傳已取消');
      }
      // 避免洩漏詳細錯誤資訊
      console.error('[Security] Upload error occurred');
      throw new Error('上傳失敗，請稍後再試');
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      // 暫停所有上傳
      uploadControllersRef.current.forEach(controller => {
        if (controller?.abort) {
          controller.abort();
        }
      });
      toast.info('上傳已暫停');
    } else {
      toast.info('上傳已恢復');
    }
  };

  const handleFilesAccepted = async (acceptedFiles) => {
    if (selectedAccounts.length === 0) {
      toast.error('請至少選擇一個上傳目的地');
      return;
    }

    // 防止重複上傳
    if (uploading) {
      toast.warning('請等待當前上傳完成');
      return;
    }

    setUploading(true);
    setIsPaused(false);
    uploadControllersRef.current = [];
    const allCompletedFiles = [];
    
    for (const file of acceptedFiles) {
      if (isPaused) break;
      
      setCurrentFile(file.name);
      const startTime = Date.now();
      
      // 初始化進度
      const initialResults = selectedAccounts.map(accountId => ({
        destination: accountId,
        destinationName: accountId === 'base44' 
          ? 'Base44' 
          : storageAccounts.find(a => a.id === accountId)?.name || 'Unknown',
        status: 'pending',
        progress: 0
      }));
      setUploadResults(initialResults);

      // 並行上傳到所有目的地
      const uploadPromises = selectedAccounts.map(async (accountId, index) => {
        try {
          let url;
          
          if (accountId === 'base44') {
            // Base44 上傳不支援進度追蹤
            setUploadResults(prev => prev.map((r, i) => 
              i === index ? { ...r, progress: 50 } : r
            ));
            const result = await base44.integrations.Core.UploadFile({ file });
            url = result.file_url;
            setUploadResults(prev => prev.map((r, i) => 
              i === index ? { ...r, progress: 100 } : r
            ));
          } else {
            const account = storageAccounts.find(a => a.id === accountId);
            if (!account) throw new Error('找不到儲存帳號');
            
            const result = await uploadToIDrive(file, account, (progress) => {
              setUploadResults(prev => prev.map((r, i) => 
                i === index ? { ...r, progress } : r
              ));
            });
            url = result.url;
            uploadControllersRef.current.push(result.controller);
          }

          // 更新成功狀態
          setUploadResults(prev => prev.map((r, i) => 
            i === index ? { ...r, status: 'success', url, progress: 100 } : r
          ));

          return { 
            destination: accountId, 
            status: 'success', 
            url 
          };
        } catch (error) {
          // 更新失敗狀態
          setUploadResults(prev => prev.map((r, i) => 
            i === index ? { ...r, status: 'failed', error: error.message, progress: 0 } : r
          ));

          return { 
            destination: accountId, 
            status: 'failed', 
            error_message: error.message 
          };
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      const uploadResultsData = results.map(r => 
        r.status === 'fulfilled' ? r.value : { status: 'failed', error_message: r.reason?.message }
      );

      // 記錄成功上傳的檔案
      uploadResultsData
        .filter(r => r.status === 'success' && r.url)
        .forEach(r => {
          allCompletedFiles.push({
            fileName: file.name,
            url: r.url,
            destination: r.destination
          });
        });

      // 記錄上傳日誌
      const duration = Date.now() - startTime;
      await createUploadLog({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        destinations: selectedAccounts,
        upload_results: uploadResultsData,
        upload_duration_ms: duration
      });

      const successCount = uploadResultsData.filter(r => r.status === 'success').length;
      const failedCount = uploadResultsData.filter(r => r.status === 'failed').length;

      if (successCount > 0) {
        toast.success(`${file.name} 成功上傳到 ${successCount} 個目的地`);
      }
      if (failedCount > 0) {
        toast.error(`${file.name} 有 ${failedCount} 個目的地上傳失敗`);
      }
    }

    setCompletedFiles(allCompletedFiles);

    // 儲存這次的選擇
    try {
      await base44.auth.updateMe({
        last_selected_storage_accounts: selectedAccounts
      });
    } catch (error) {
      // 偏好設定儲存失敗不影響功能
    }

    setUploading(false);
    setCurrentFile(null);
    setIsPaused(false);
    uploadControllersRef.current = [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '48px 48px'
          }} />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">OpenTWDrive</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
              拖曳．放下．完成
            </h1>

            <div className="flex justify-center gap-2 mb-6">
              <Link to={createPageUrl('StorageAccounts')}>
                <Button variant="outline" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Settings className="w-4 h-4" />
                  帳號管理
                </Button>
              </Link>
              <Link to={createPageUrl('UploadLogs')}>
                <Button variant="outline" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <FileText className="w-4 h-4" />
                  查看日誌
                </Button>
              </Link>
            </div>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              體驗新世代的檔案上傳技術，具備智慧驗證、即時回饋與流暢動畫效果
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <MultiDestinationSelector
              accounts={storageAccounts}
              selectedIds={selectedAccounts}
              onSelectionChange={setSelectedAccounts}
            />

            <div className="mt-6">
              <SmartFileDropzone
                onFilesAccepted={handleFilesAccepted}
                maxFiles={10}
                maxSize={15 * 1024 * 1024}
                acceptedFileTypes={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                  'text/plain': ['.txt'],
                  'application/zip': ['.zip'],
                }}
                multiple={true}
              />

              {uploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-center"
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-50 border border-blue-200">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-blue-700">
                      正在上傳至 {selectedAccounts.length} 個目的地...
                    </span>
                  </div>
                </motion.div>
              )}

              <UploadProgress
                fileName={currentFile}
                results={uploadResults}
                isPaused={isPaused}
                onPauseResume={uploading ? handlePauseResume : null}
                onDownloadZip={() => setShowZipDialog(true)}
                canDownloadZip={!uploading && completedFiles.length > 0}
              />
            </div>
          </Card>
        </motion.div>

        <ZipDownloadDialog
          open={showZipDialog}
          onOpenChange={setShowZipDialog}
          uploadedFiles={completedFiles}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6"
        >
          <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">💡 操作提示</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-900 mb-1">📊 即時進度</p>
                  <p>清晰顯示每個檔案的上傳百分比</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">⏸️ 暫停恢復</p>
                  <p>上傳過程中可隨時暫停與恢復</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">🔐 下載打包</p>
                  <p>完成後可下載加密 ZIP 壓縮檔</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mt-12"
        >
          {[
            {
              icon: Zap,
              title: '極速上傳',
              description: '經過效能最佳化，提供即時視覺回饋與平行上傳功能',
              color: 'emerald'
            },
            {
              icon: Shield,
              title: '智慧驗證',
              description: '自動檢查檔案類型與大小，並提供清楚的錯誤訊息',
              color: 'blue'
            },
            {
              icon: FileUp,
              title: '多元格式',
              description: '支援圖片、文件、壓縮檔等多種檔案格式',
              color: 'purple'
            }
          ].map((feature, idx) => (
            <Card
              key={idx}
              className="p-6 border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </motion.div>

        {/* Technical Specs */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <Card className="p-8 border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <h3 className="text-2xl font-bold mb-6">技術規格</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-slate-400 mb-2">檔案大小上限</p>
                <p className="font-semibold">每個檔案 15 MB</p>
              </div>
              <div>
                <p className="text-slate-400 mb-2">檔案數量上限</p>
                <p className="font-semibold">每次上傳 10 個檔案</p>
              </div>
              <div>
                <p className="text-slate-400 mb-2">支援格式</p>
                <p className="font-semibold">圖片、PDF、DOC、DOCX、TXT、ZIP</p>
              </div>
              <div>
                <p className="text-slate-400 mb-2">驗證機制</p>
                <p className="font-semibold">即時檔案類型與大小檢查</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-400">
            OpenTWDrive <span className="font-mono text-slate-500">v2.0.0</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-slate-500">開源智慧檔案上傳系統</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}