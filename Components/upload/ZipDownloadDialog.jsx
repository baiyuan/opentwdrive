import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Lock, Loader2, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { toast } from 'sonner';

export default function ZipDownloadDialog({ open, onOpenChange, uploadedFiles = [] }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const loadingToast = toast.loading('正在打包檔案...');

    try {
      const zip = new JSZip();

      // 下載並加入所有檔案到 ZIP
      const downloadPromises = uploadedFiles.map(async (fileData) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(fileData.url, {
            signal: controller.signal,
            headers: {
              'Accept': '*/*',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error('下載失敗');
          }
          
          const blob = await response.blob();
          
          // 淨化檔案名稱
          const safeName = fileData.fileName
            .replace(/[<>:"|?*\x00-\x1F]/g, '')
            .replace(/^\.+/, '')
            .substring(0, 255);
            
          zip.file(safeName, blob);
          return true;
        } catch (error) {
          console.error('[Security] File download failed');
          return false;
        }
      });
      
      const results = await Promise.allSettled(downloadPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      if (successCount === 0) {
        throw new Error('所有檔案下載失敗');
      }

      // 生成 ZIP（注意：JSZip 不支援密碼加密，需使用其他方案）
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      // 觸發下載
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `upload-files-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`ZIP 檔案下載成功！已打包 ${successCount} 個檔案`, { id: loadingToast });
      onOpenChange(false);
    } catch (error) {
      console.error('[Security] ZIP generation failed');
      const errorMsg = error.message === '所有檔案下載失敗' 
        ? '檔案下載失敗，請檢查網路連線' 
        : '打包失敗，請稍後再試';
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            下載 ZIP 壓縮檔
          </DialogTitle>
          <DialogDescription>
            將所有成功上傳的檔案打包成 ZIP 檔案（需使用密碼作為檔案命名參考）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              將打包 {uploadedFiles.length} 個檔案
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              ⚠️ 注意：由於技術限制，目前 ZIP 檔案不支援密碼加密。如需保護檔案，建議：
            </p>
            <ul className="text-xs text-amber-700 mt-2 space-y-1 ml-4">
              <li>• 下載後使用專業壓縮軟體重新加密</li>
              <li>• 或透過其他加密工具保護檔案</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={downloading}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                打包中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                下載 ZIP
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}