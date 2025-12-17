import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cloud, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

export default function AccountList({ accounts, onEdit, onDelete, onToggleActive, onTest }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>尚未新增任何儲存帳號</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {accounts.map((account, index) => (
        <motion.div
          key={account.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Cloud className="w-6 h-6 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {account.name}
                    </h3>
                    {account.is_active && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        啟用中
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-2">
                    Bucket: <span className="font-mono">{account.bucket_name}</span>
                  </p>
                  
                  <p className="text-xs text-slate-500 truncate">
                    {account.endpoint}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-slate-600">啟用</span>
                  <Switch
                    checked={account.is_active}
                    onCheckedChange={() => onToggleActive(account)}
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTest(account)}
                  title="測試連線"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(account)}
                  title="編輯"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(account)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="刪除"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}