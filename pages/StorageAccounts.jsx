import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Cloud, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AccountForm from '../components/storage/AccountForm';
import AccountList from '../components/storage/AccountList';
import SecurityNotice from '../components/security/SecurityNotice';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export default function StorageAccounts() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['storageAccounts'],
    queryFn: () => base44.entities.StorageAccount.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StorageAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageAccounts'] });
      toast.success('儲存帳號已新增');
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StorageAccount.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageAccounts'] });
      toast.success('儲存帳號已更新');
      setEditingAccount(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StorageAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storageAccounts'] });
      toast.success('儲存帳號已刪除');
    },
  });

  const handleSave = (accountData) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data: accountData });
    } else {
      createMutation.mutate(accountData);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = async (account) => {
    if (confirm(`確定要刪除「${account.name}」嗎？`)) {
      deleteMutation.mutate(account.id);
    }
  };

  const handleToggleActive = (account) => {
    updateMutation.mutate({
      id: account.id,
      data: { is_active: !account.is_active }
    });
  };

  const handleTest = async (account) => {
    const testToast = toast.loading('測試連線中...');
    
    try {
      const regionMatch = account.endpoint.match(/s3\.([^.]+)\.idrivee2/);
      const region = regionMatch ? regionMatch[1] : 'us-east-1';

      const s3Client = new S3Client({
        endpoint: account.endpoint,
        region: region,
        credentials: {
          accessKeyId: account.access_key_id,
          secretAccessKey: account.secret_access_key,
        },
        forcePathStyle: true,
      });

      await s3Client.send(new ListBucketsCommand({}));
      
      toast.success(`「${account.name}」連線測試成功！`, { id: testToast });
    } catch (error) {
      toast.error(`「${account.name}」連線測試失敗，請檢查憑證設定`, { id: testToast });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
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
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Cloud className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bold">儲存帳號管理</h1>
            </div>
            <p className="text-slate-300 text-lg">
              管理您的 IDrive e2 儲存帳號，支援多帳號同時上傳
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <SecurityNotice />

          <Card className="p-6 shadow-xl bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                我的儲存帳號
              </h2>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增帳號
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <AccountList
                accounts={accounts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onTest={handleTest}
              />
            )}
          </Card>
        </motion.div>
      </div>

      <AccountForm
        open={showForm}
        onOpenChange={handleFormClose}
        onSave={handleSave}
        account={editingAccount}
      />
    </div>
  );
}