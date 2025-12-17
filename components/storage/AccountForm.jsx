import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Key, Server, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export default function AccountForm({ open, onOpenChange, onSave, account = null }) {
  const [name, setName] = useState(account?.name || '');
  const [accessKeyId, setAccessKeyId] = useState(account?.access_key_id || '');
  const [secretAccessKey, setSecretAccessKey] = useState(account?.secret_access_key || '');
  const [endpoint, setEndpoint] = useState(account?.endpoint || '');
  const [bucketName, setBucketName] = useState(account?.bucket_name || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const extractRegion = (endpointUrl) => {
    const regionMatch = endpointUrl.match(/s3\.([^.]+)\.idrivee2/);
    return regionMatch ? regionMatch[1] : 'us-east-1';
  };

  const testConnection = async () => {
    if (!accessKeyId || !secretAccessKey || !endpoint) {
      toast.error('請先填寫 Access Key、Secret Key 和 Endpoint');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      let finalEndpoint = endpoint.trim();
      if (!finalEndpoint.startsWith('http://') && !finalEndpoint.startsWith('https://')) {
        finalEndpoint = `https://${finalEndpoint}`;
      }

      // 驗證 endpoint 格式
      if (!finalEndpoint.match(/^https?:\/\/.+\.idrivee2\.com$/)) {
        toast.error('無效的 IDrive e2 端點格式');
        setTestResult('error');
        return;
      }

      const s3Client = new S3Client({
        endpoint: finalEndpoint,
        region: extractRegion(finalEndpoint),
        credentials: {
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
        },
        forcePathStyle: true,
        requestHandler: {
          connectionTimeout: 10000,
          socketTimeout: 10000,
        },
      });

      await s3Client.send(new ListBucketsCommand({}));
      
      setTestResult('success');
      toast.success('連線測試成功！憑證有效');
    } catch (error) {
      setTestResult('error');
      // 避免洩漏詳細錯誤資訊
      toast.error('連線測試失敗，請檢查憑證設定');
      console.error('[Security] Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!name || !accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
      toast.error('請填寫所有欄位');
      return;
    }

    // 驗證帳號名稱長度
    if (name.trim().length < 2 || name.trim().length > 50) {
      toast.error('帳號名稱長度需為 2-50 個字元');
      return;
    }

    // 驗證 Access Key 格式
    if (accessKeyId.trim().length < 16) {
      toast.error('Access Key ID 格式不正確');
      return;
    }

    // 驗證 Secret Key 格式
    if (secretAccessKey.trim().length < 32) {
      toast.error('Secret Access Key 格式不正確');
      return;
    }

    let finalEndpoint = endpoint.trim();
    if (!finalEndpoint.startsWith('http://') && !finalEndpoint.startsWith('https://')) {
      finalEndpoint = `https://${finalEndpoint}`;
    }

    // 驗證 endpoint 格式
    if (!finalEndpoint.match(/^https?:\/\/.+\.idrivee2\.com$/)) {
      toast.error('無效的 IDrive e2 端點格式');
      return;
    }

    // 驗證 bucket 名稱
    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucketName.trim())) {
      toast.error('Bucket 名稱格式不正確 (需為小寫字母、數字或連字符)');
      return;
    }

    const accountData = {
      name: name.trim(),
      access_key_id: accessKeyId.trim(),
      secret_access_key: secretAccessKey.trim(),
      endpoint: finalEndpoint,
      bucket_name: bucketName.trim(),
      is_active: true,
    };

    onSave(accountData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="w-5 h-5 text-blue-600" />
            {account ? '編輯儲存帳號' : '新增儲存帳號'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">帳號名稱</Label>
            <Input
              id="name"
              placeholder="例如：工作專用、個人備份"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessKeyId" className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-500" />
              Access Key ID
            </Label>
            <Input
              id="accessKeyId"
              type="text"
              placeholder="輸入 Access Key ID"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretAccessKey" className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              Secret Access Key
            </Label>
            <Input
              id="secretAccessKey"
              type="password"
              placeholder="輸入 Secret Access Key"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint" className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-500" />
              Endpoint URL
            </Label>
            <Input
              id="endpoint"
              type="text"
              placeholder="例如：s3.ap-southeast-1.idrivee2.com"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
            <p className="text-xs text-slate-500">系統會自動加上 https:// 前綴</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bucketName">Bucket 名稱</Label>
            <Input
              id="bucketName"
              type="text"
              placeholder="輸入 Bucket 名稱"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            onClick={testConnection}
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                測試中...
              </>
            ) : testResult === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                連線測試成功
              </>
            ) : testResult === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                連線測試失敗
              </>
            ) : (
              '測試連線'
            )}
          </Button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            儲存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}