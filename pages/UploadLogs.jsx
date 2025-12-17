import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Database, 
  Cloud, 
  Search,
  Calendar,
  Clock,
  HardDrive,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function UploadLogs() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['uploadLogs'],
    queryFn: () => base44.entities.UploadLog.list('-created_date', 100),
  });

  const { data: storageAccounts = [] } = useQuery({
    queryKey: ['storageAccounts'],
    queryFn: () => base44.entities.StorageAccount.list(),
  });

  const getAccountName = (accountId) => {
    if (accountId === 'base44') return 'Base44';
    const account = storageAccounts.find(a => a.id === accountId);
    return account?.name || 'IDrive e2';
  };

  const filteredLogs = logs.filter(log => {
    // 檢查是否符合搜尋
    const matchesSearch = searchTerm === '' || 
      log.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // 處理新舊資料結構
    if (log.upload_results) {
      // 新架構：多目的地
      const matchesStatus = statusFilter === 'all' || 
        log.upload_results.some(r => r.status === statusFilter);
      const matchesDestination = destinationFilter === 'all' || 
        log.destinations.includes(destinationFilter) ||
        (destinationFilter === 'idrive' && log.destinations.some(d => d !== 'base44'));
      return matchesStatus && matchesDestination;
    } else {
      // 舊架構：單目的地（向下相容）
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      const matchesDestination = destinationFilter === 'all' || log.destination === destinationFilter;
      return matchesStatus && matchesDestination;
    }
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 計算成功失敗次數
  let successCount = 0;
  let failCount = 0;
  logs.forEach(log => {
    if (log.upload_results) {
      // 新架構
      successCount += log.upload_results.filter(r => r.status === 'success').length;
      failCount += log.upload_results.filter(r => r.status === 'failed').length;
    } else if (log.status) {
      // 舊架構
      if (log.status === 'success') successCount++;
      if (log.status === 'failed') failCount++;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '48px 48px'
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <Link to={createPageUrl('FileUpload')}>
            <Button variant="ghost" className="mb-4 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回上傳頁面
            </Button>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-emerald-400" />
              <h1 className="text-4xl font-bold text-white">上傳日誌</h1>
            </div>
            <p className="text-slate-300 text-lg">完整追蹤所有檔案上傳記錄</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">總上傳次數</p>
                <p className="text-3xl font-bold text-slate-900">{logs.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">成功上傳</p>
                <p className="text-3xl font-bold text-emerald-600">{successCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">失敗次數</p>
                <p className="text-3xl font-bold text-rose-600">{failCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6 bg-white border-0 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜尋檔案名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="狀態篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>

            <Select value={destinationFilter} onValueChange={setDestinationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="目的地篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部目的地</SelectItem>
                <SelectItem value="base44">Base44</SelectItem>
                <SelectItem value="idrive">IDrive e2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="bg-white border-0 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 mt-4">載入中...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">尚無上傳記錄</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">狀態</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">檔案名稱</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">大小</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">目的地</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">上傳時間</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">耗時</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log, idx) => {
                    // 判斷是新架構還是舊架構
                    const isNewStructure = log.upload_results && Array.isArray(log.upload_results);
                    
                    if (isNewStructure) {
                      // 新架構：多目的地
                      const successResults = log.upload_results.filter(r => r.status === 'success');
                      const failedResults = log.upload_results.filter(r => r.status === 'failed');
                      const hasSuccess = successResults.length > 0;
                      const hasFailed = failedResults.length > 0;
                      
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            {hasSuccess && !hasFailed && (
                              <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">全部成功</span>
                              </div>
                            )}
                            {!hasSuccess && hasFailed && (
                              <div className="flex items-center gap-2 text-rose-600">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">全部失敗</span>
                              </div>
                            )}
                            {hasSuccess && hasFailed && (
                              <div className="flex items-center gap-2 text-amber-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">部分成功</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-900 truncate max-w-xs">
                                {log.file_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{formatFileSize(log.file_size)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {log.upload_results.map((result, resultIdx) => (
                                <div key={resultIdx} className="flex items-center gap-2">
                                  {result.destination === 'base44' ? (
                                    <Database className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Cloud className="w-3 h-3 text-blue-600" />
                                  )}
                                  <span className="text-xs text-slate-700">
                                    {getAccountName(result.destination)}
                                  </span>
                                  {result.status === 'success' ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-3 h-3" />
                              <span className="text-sm">
                                {format(new Date(log.created_date), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-sm">{log.upload_duration_ms}ms</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {successResults.length > 0 && successResults[0].url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(successResults[0].url, '_blank')}
                                className="text-blue-600 hover:text-blue-700"
                                title="開啟第一個成功上傳的檔案"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    } else {
                      // 舊架構：單目的地（向下相容）
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            {log.status === 'success' ? (
                              <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">成功</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-rose-600">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">失敗</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-900 truncate max-w-xs">
                                {log.file_name}
                              </span>
                            </div>
                            {log.error_message && (
                              <p className="text-xs text-rose-600 mt-1">{log.error_message}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{formatFileSize(log.file_size)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {log.destination === 'base44' ? (
                                <>
                                  <Database className="w-4 h-4 text-emerald-600" />
                                  <span className="text-sm text-slate-900">Base44</span>
                                </>
                              ) : (
                                <>
                                  <Cloud className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-slate-900">IDrive e2</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-3 h-3" />
                              <span className="text-sm">
                                {format(new Date(log.created_date), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-sm">{log.upload_duration_ms}ms</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {log.upload_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(log.upload_url, '_blank')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}