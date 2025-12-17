import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Cloud, Database, CheckSquare, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function MultiDestinationSelector({ 
  accounts = [],
  selectedIds = [],
  onSelectionChange
}) {
  const allIds = ['base44', ...(accounts?.map(a => a.id) || [])];
  const activeAccounts = accounts?.filter(a => a.is_active) || [];
  
  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allAvailableIds = ['base44', ...activeAccounts.map(a => a.id)];
    onSelectionChange(allAvailableIds);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <Card className="p-6 bg-white border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">選擇上傳目的地</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAll}
            className="text-xs"
          >
            <CheckSquare className="w-3 h-3 mr-1" />
            全選
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeselectAll}
            className="text-xs"
          >
            <Square className="w-3 h-3 mr-1" />
            全不選
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Base44 選項 */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-slate-50"
          style={{
            borderColor: selectedIds.includes('base44') ? 'rgb(16, 185, 129)' : 'rgb(226, 232, 240)',
            backgroundColor: selectedIds.includes('base44') ? 'rgb(236, 253, 245)' : 'transparent'
          }}
          onClick={() => handleToggle('base44')}
        >
          <Checkbox
            checked={selectedIds.includes('base44')}
            onCheckedChange={() => handleToggle('base44')}
            className="mt-1"
          />
          <div className="flex-1">
            <Label className="flex items-center gap-2 cursor-pointer font-medium">
              <Database className="w-4 h-4 text-emerald-600" />
              Base44 雲端儲存
            </Label>
            <p className="text-sm text-slate-500 mt-1">
              上傳至 Base44 平台的內建儲存空間
            </p>
          </div>
        </motion.div>

        {/* IDrive 帳號列表 */}
        {activeAccounts.length > 0 ? (
          activeAccounts.map((account) => (
            <motion.div
              key={account.id}
              whileHover={{ scale: 1.01 }}
              className="flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-slate-50"
              style={{
                borderColor: selectedIds.includes(account.id) ? 'rgb(37, 99, 235)' : 'rgb(226, 232, 240)',
                backgroundColor: selectedIds.includes(account.id) ? 'rgb(239, 246, 255)' : 'transparent'
              }}
              onClick={() => handleToggle(account.id)}
            >
              <Checkbox
                checked={selectedIds.includes(account.id)}
                onCheckedChange={() => handleToggle(account.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label className="flex items-center gap-2 cursor-pointer font-medium">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  {account.name}
                </Label>
                <p className="text-sm text-slate-500 mt-1">
                  Bucket: <span className="font-mono">{account.bucket_name}</span>
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg">
            <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">尚未新增 IDrive e2 帳號</p>
            <Link to={createPageUrl('StorageAccounts')}>
              <Button size="sm" variant="outline">
                前往新增
              </Button>
            </Link>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            已選擇 <span className="font-semibold text-blue-600">{selectedIds.length}</span> 個目的地
          </p>
        </div>
      )}
    </Card>
  );
}