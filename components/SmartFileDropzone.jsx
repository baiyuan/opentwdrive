import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon,
  Video,
  Music,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('zip') || fileType.includes('rar')) return Archive;
  return FileText;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 位元組';
  const k = 1024;
  const sizes = ['位元組', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function SmartFileDropzone({
  onFilesAccepted,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  multiple = true,
}) {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  const validateFileContent = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // 設定超時保護
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('檔案驗證超時'));
      }, 5000);
      
      reader.onloadend = (e) => {
        clearTimeout(timeout);
        try {
          const arr = new Uint8Array(e.target.result).subarray(0, 8);
          let header = '';
          for (let i = 0; i < arr.length; i++) {
            header += arr[i].toString(16).padStart(2, '0');
          }
          
          // 檢查常見檔案魔術數字
          const magicNumbers = {
            '89504e47': 'image/png',
            'ffd8ffe0': 'image/jpeg',
            'ffd8ffe1': 'image/jpeg',
            'ffd8ffe2': 'image/jpeg',
            'ffd8ffe8': 'image/jpeg',
            '25504446': 'application/pdf',
            '504b0304': 'application/zip',
            '504b0506': 'application/zip',
            '504b0708': 'application/zip',
            'd0cf11e0': 'application/msword',
          };
          
          const detectedType = magicNumbers[header.substring(0, 8)];
          resolve(detectedType || 'valid');
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('檔案讀取失敗'));
      };
      
      reader.readAsArrayBuffer(file.slice(0, 8));
    });
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle accepted files with content validation
    if (acceptedFiles.length > 0) {
      const validFiles = [];
      const invalidFiles = [];
      
      for (const file of acceptedFiles) {
        // 檔案名稱驗證 - 防止路徑遍歷
        const sanitizedName = file.name.replace(/[<>:"|?*\x00-\x1F]/g, '');
        if (sanitizedName !== file.name || file.name.includes('..') || file.name.startsWith('.')) {
          invalidFiles.push({
            fileName: file.name,
            messages: ['檔案名稱包含不允許的字元']
          });
          continue;
        }
        
        // 基本內容驗證
        if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.includes('zip')) {
          try {
            const detectedType = await validateFileContent(file);
            if (detectedType === 'valid' || detectedType === file.type || 
                (file.type.startsWith('image/') && detectedType?.startsWith('image/'))) {
              validFiles.push(file);
            } else {
              invalidFiles.push({
                fileName: file.name,
                messages: ['檔案內容驗證失敗']
              });
            }
          } catch (error) {
            invalidFiles.push({
              fileName: file.name,
              messages: ['檔案驗證錯誤']
            });
          }
        } else {
          validFiles.push(file);
        }
      }
      
      if (validFiles.length > 0) {
        const newFiles = validFiles.map(file => ({
          file,
          id: Math.random().toString(36).substr(2, 9),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          status: 'success',
        }));
        
        setFiles(prev => [...prev, ...newFiles]);
        setErrors(invalidFiles);
        
        if (onFilesAccepted) {
          onFilesAccepted(validFiles);
        }
      } else if (invalidFiles.length > 0) {
        setErrors(invalidFiles);
      }
    }

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => ({
        fileName: file.name,
        messages: errors.map(e => {
          if (e.code === 'file-too-large') {
            return `檔案大小超過上限`;
          }
          if (e.code === 'file-invalid-type') {
            return '不支援的檔案類型';
          }
          if (e.code === 'too-many-files') {
            return '檔案數量過多';
          }
          return '上傳失敗';
        }),
      }));
      setErrors(newErrors);
    }
  }, [maxSize, maxFiles, onFilesAccepted]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    accept: acceptedFileTypes,
    multiple,
  });

  const removeFile = (fileId) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <div className="w-full space-y-6">
      {/* Dropzone Area */}
      <motion.div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
          "min-h-[280px] flex flex-col items-center justify-center p-8",
          isDragActive && !isDragReject && "border-emerald-500 bg-emerald-50/50 scale-[1.02]",
          isDragReject && "border-rose-500 bg-rose-50/50",
          !isDragActive && "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
        )}
        whileHover={{ scale: isDragActive ? 1.02 : 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <input {...getInputProps()} />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="dragging"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-4 z-10"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: isDragReject ? [0, -5, 5, 0] : 0
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center",
                  isDragReject ? "bg-rose-100" : "bg-emerald-100"
                )}
              >
                {isDragReject ? (
                  <AlertCircle className="w-10 h-10 text-rose-600" />
                ) : (
                  <Upload className="w-10 h-10 text-emerald-600" />
                )}
              </motion.div>
              <div className="text-center">
                <p className={cn(
                  "text-lg font-semibold",
                  isDragReject ? "text-rose-700" : "text-emerald-700"
                )}>
                  {isDragReject ? '不支援的檔案類型' : '將檔案放置此處'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {isDragReject ? '請檢查檔案格式要求' : '放開以開始上傳'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-4 z-10 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Upload className="w-10 h-10 text-slate-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  拖曳檔案至此處
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  或點選以從裝置中選擇檔案
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                  檔案大小上限 {formatFileSize(maxSize)}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                  最多 {maxFiles} 個檔案
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-rose-900">
                    上傳失敗，共 {errors.length} 個檔案
                  </p>
                  {errors.map((error, idx) => (
                    <div key={idx} className="text-sm text-rose-700">
                      <span className="font-medium">{error.fileName}:</span>{' '}
                      {error.messages.join('，')}
                    </div>
                  ))}
                </div>
                <button
                  onClick={clearErrors}
                  className="text-rose-400 hover:text-rose-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                已上傳的檔案 ({files.length})
              </h3>
              {files.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    files.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
                    setFiles([]);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  全部清除
                </Button>
              )}
            </div>
            
            <div className="grid gap-3">
              {files.map((fileItem) => {
                const FileIcon = getFileIcon(fileItem.file.type);
                
                return (
                  <motion.div
                    key={fileItem.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                    className="group relative rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {/* File Icon/Preview */}
                      <div className="relative flex-shrink-0">
                        {fileItem.preview ? (
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100">
                            <img
                              src={fileItem.preview}
                              alt={fileItem.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <FileIcon className="w-7 h-7 text-slate-600" />
                          </div>
                        )}
                        
                        {/* Success Badge */}
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {fileItem.file.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-slate-500">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {fileItem.file.type.split('/')[1]?.toUpperCase() || '檔案'}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}