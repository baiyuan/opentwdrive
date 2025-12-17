import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SecurityNotice() {
  return (
    <Card className="border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-amber-900">⚠️ 安全性提醒</p>
          <ul className="text-amber-800 space-y-1 text-xs">
            <li>• 儲存帳號憑證目前以加密方式儲存在資料庫中</li>
            <li>• 檔案上傳使用 AES-256 伺服器端加密</li>
            <li>• 建議定期更換存取金鑰以提升安全性</li>
            <li>• 請勿在公共場所或不安全的網路環境下操作</li>
            <li>• ZIP 下載密碼請使用強密碼（至少 8 字元，包含大小寫、數字、符號）</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}