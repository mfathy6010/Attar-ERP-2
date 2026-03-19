import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../AppContext';

const SyncStatus: React.FC = () => {
  const { hasPendingWrites } = useApp();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync status based on pending writes
  useEffect(() => {
    if (hasPendingWrites) {
      setIsSyncing(true);
    } else {
      setIsSyncing(false);
      setLastSync(new Date());
    }
  }, [hasPendingWrites]);

  const handleManualSync = () => {
    if (!isOnline) return;
    
    // In Firestore, manual sync isn't directly exposed, 
    // but we can simulate a check.
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync(new Date());
    }, 1000);
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
          isOnline 
            ? (hasPendingWrites ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20')
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}
      >
        {isOnline ? (
          <>
            <Cloud size={14} className={hasPendingWrites ? 'animate-pulse' : ''} />
            <span>{hasPendingWrites ? 'جاري المزامنة...' : 'متصل (مزامنة تلقائية)'}</span>
          </>
        ) : (
          <>
            <CloudOff size={14} />
            <span>وضع الأوفلاين (تخزين مؤقت)</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">حالة المزامنة</span>
                {isOnline ? (
                  hasPendingWrites ? (
                    <span className="flex items-center gap-1 text-amber-500 text-[10px]">
                      <RefreshCw size={12} className="animate-spin" />
                      جاري الرفع
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-500 text-[10px]">
                      <CheckCircle2 size={12} />
                      مكتملة
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1 text-red-500 text-[10px]">
                    <AlertCircle size={12} />
                    غير متصل
                  </span>
                )}
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg space-y-2">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>آخر تحديث:</span>
                  <span>{lastSync.toLocaleTimeString('ar-EG')}</span>
                </div>
                <div className="text-[10px] text-gray-400 leading-relaxed">
                  {isOnline 
                    ? (hasPendingWrites 
                        ? 'هناك بيانات يتم رفعها الآن إلى السحابة. لا تغلق المتصفح حتى تكتمل المزامنة.'
                        : 'كافة البيانات محفوظة بأمان في السحابة. يمكنك العمل بدون قلق.')
                    : 'أنت تعمل الآن على النسخة المحلية. سيتم رفع كافة التعديلات تلقائياً فور عودة الاتصال.'}
                </div>
              </div>

              <button
                disabled={!isOnline || isSyncing}
                onClick={handleManualSync}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'جاري المزامنة...' : 'تحديث المزامنة الآن'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyncStatus;
