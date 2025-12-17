import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Database, Cloud, Pause, Play, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function UploadProgress({ 
  fileName, 
  results = [], 
  isPaused = false,
  onPauseResume,
  onDownloadZip,
  canDownloadZip = false
}) {
  if (!results || results.length === 0) return null;

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const pendingCount = results.filter(r => r.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <Card className="p-6 bg-slate-50 border-slate-200">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-900">
              上傳進度：{fileName || '處理中...'}
            </h4>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && onPauseResume && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPauseResume}
                  className="h-8"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      繼續
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      暫停
                    </>
                  )}
                </Button>
              )}
              {canDownloadZip && onDownloadZip && (
                <Button
                  size="sm"
                  onClick={onDownloadZip}
                  className="h-8 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-3 h-3 mr-1" />
                  下載 ZIP
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600">
            {pendingCount > 0 ? (
              isPaused ? (
                `已暫停 (${successCount + failedCount}/${results.length})`
              ) : (
                `上傳中... (${successCount + failedCount}/${results.length})`
              )
            ) : (
              `完成：${successCount} 成功，${failedCount} 失敗`
            )}
          </p>
        </div>

        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className="space-y-2"
            >
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                {result.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : result.status === 'failed' ? (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : isPaused ? (
                  <Pause className="w-5 h-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
                )}

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {result.destination === 'base44' ? (
                    <Database className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <Cloud className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="font-medium text-slate-900 truncate">
                    {result.destinationName}
                  </span>
                </div>

                <div className="text-sm">
                  {result.status === 'success' && (
                    <span className="text-green-600 font-medium">成功</span>
                  )}
                  {result.status === 'failed' && (
                    <span className="text-red-600 font-medium">失敗</span>
                  )}
                  {result.status === 'pending' && (
                    <span className={isPaused ? "text-amber-600 font-medium" : "text-blue-600 font-medium"}>
                      {isPaused ? '已暫停' : `${result.progress || 0}%`}
                    </span>
                  )}
                </div>
              </div>
              
              {result.status === 'pending' && result.progress !== undefined && (
                <Progress value={result.progress} className="h-1" />
              )}
            </div>
          ))}
        </div>

        {results.some(r => r.status === 'failed' && r.error) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-900 mb-1">錯誤詳情：</p>
            <div className="space-y-1">
              {results
                .filter(r => r.status === 'failed' && r.error)
                .map((result, index) => (
                  <p key={index} className="text-xs text-red-700">
                    • {result.destinationName}: {result.error}
                  </p>
                ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}