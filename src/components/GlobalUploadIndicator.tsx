"use client";

import { useEffect, useState, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useUploadStore, type UploadJob } from '@/store/upload-store';
import { toast } from 'sonner';

export function GlobalUploadIndicator() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState('0 KB/s');
  const [timeRemaining, setTimeRemaining] = useState('--:--');
  const lastProgressRef = useRef<{ progress: number; time: number }>({ progress: 0, time: Date.now() });

  // استخدم الـ store الجديد
  const {
    activeUploads,
    completedUploads,
    showGlobalIndicator,
    toggleGlobalIndicator,
    removeUpload,
  } = useUploadStore();

  // حساب السرعة والوقت المتبقي
  useEffect(() => {
    if (activeUploads.length === 0) return;

    const activeUpload = activeUploads[0];
    if (activeUpload.status !== 'uploading') return;

    const now = Date.now();
    const timeDiff = (now - lastProgressRef.current.time) / 1000;
    const progressDiff = activeUpload.totalProgress - lastProgressRef.current.progress;

    if (timeDiff > 0.5 && progressDiff > 0) {
      const speedPerSecond = progressDiff / timeDiff;
      const estimatedTotalSeconds = (100 - activeUpload.totalProgress) / speedPerSecond;
      const estimatedSpeedKB = (speedPerSecond * 10240) / 100;
      
      setUploadSpeed(`${Math.round(estimatedSpeedKB)} KB/s`);
      
      if (estimatedTotalSeconds > 0 && estimatedTotalSeconds < 3600) {
        const minutes = Math.floor(estimatedTotalSeconds / 60);
        const seconds = Math.floor(estimatedTotalSeconds % 60);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else if (estimatedTotalSeconds <= 0) {
        setTimeRemaining('لحظات...');
      } else {
        setTimeRemaining('> ساعة');
      }
    }

    lastProgressRef.current = { progress: activeUpload.totalProgress, time: now };
  }, [activeUploads]);

  // تحديث عنوان الصفحة
  useEffect(() => {
    if (activeUploads.length === 0) return;

    const activeUpload = activeUploads[0];
    const originalTitle = document.title;

    if (activeUpload.status === 'uploading' && activeUpload.totalProgress > 0) {
      document.title = `(⏳ ${Math.round(activeUpload.totalProgress)}%) - ${originalTitle.split(' - ')[1] || 'متجر العرب'}`;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [activeUploads]);

  // إخفاء تلقائي بعد الإكمال
  useEffect(() => {
    if (completedUploads.length > 0) {
      const timer = setTimeout(() => {
        completedUploads.forEach(upload => removeUpload(upload.id));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [completedUploads, removeUpload]);

  // إخفاء المؤشر إذا لم توجد رفعات نشطة
  if (activeUploads.length === 0) {
    return null;
  }
  
  if (!showGlobalIndicator) {
    return null;
  }

  const activeUpload = activeUploads[0];
  const completedFiles = activeUpload.files.filter(f => f.status === 'completed').length;
  const totalFiles = activeUpload.files.length;

  // النسخة المصغرة
  if (isMinimized && activeUpload.status === 'uploading') {
    return (
      <div className="fixed top-4 right-4 z-[9999]">
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-64 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm font-bold">تحميل مصغر</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsMinimized(false)} className="text-xs text-blue-600 hover:text-blue-800" title="تكبير">تكبير</button>
              <button onClick={() => toggleGlobalIndicator(false)} className="text-xs text-red-600 hover:text-red-800" title="إخفاء">إخفاء</button>
            </div>
          </div>
          <div className="text-xs text-gray-600 mb-2 truncate">{activeUpload.message}</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500" style={{ width: `${activeUpload.totalProgress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(activeUpload.totalProgress)}%</span>
            <span>ملف {completedFiles}/{totalFiles}</span>
          </div>
        </div>
      </div>
    );
  }

  // النافذة الكاملة
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-lg px-4 animate-slide-down">
      <div className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-2xl p-4">
        
        {/* الهيدر */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div className="flex items-center gap-3">
            {activeUpload.status === 'uploading' ? (
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            ) : activeUpload.status === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500" />
            )}
            <h3 className="font-bold text-lg text-gray-800 truncate max-w-xs">
              {activeUpload.message}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {activeUpload.status === 'uploading' && (
              <button onClick={() => setIsMinimized(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="تصغير">
                <Download className="h-4 w-4 rotate-180" />
              </button>
            )}
            <button onClick={() => toggleGlobalIndicator(false)} className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-full" title="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* المحتوى */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              ملف <span className="font-bold text-black">{completedFiles}</span> من <span className="font-bold text-black">{totalFiles}</span>
              <br />
              <span className="text-xs text-gray-500">{activeUpload.entityName}</span>
            </div>
            <div className="text-3xl font-bold text-blue-600" style={{fontVariantNumeric: 'tabular-nums'}}>
              {Math.round(activeUpload.totalProgress)}%
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                activeUpload.status === 'completed' ? 'bg-green-500' 
                : activeUpload.status === 'failed' ? 'bg-red-500'
                : 'bg-gradient-to-r from-blue-500 to-green-500'
              }`}
              style={{ width: `${activeUpload.totalProgress}%` }}
            ></div>
          </div>

          {/* معلومات إضافية */}
          {activeUpload.status === 'uploading' && (
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div className="bg-gray-50 p-2 rounded-lg border">
                <div className="text-gray-500">سرعة الرفع</div>
                <div className="font-bold text-green-600" style={{fontVariantNumeric: 'tabular-nums'}}>{uploadSpeed}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border">
                <div className="text-gray-500">الوقت المتبقي</div>
                <div className="font-bold text-orange-600" style={{fontVariantNumeric: 'tabular-nums'}}>{timeRemaining}</div>
              </div>
            </div>
          )}

          {/* قائمة الملفات */}
          {activeUpload.files.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">تفاصيل الملفات:</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeUpload.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        file.status === 'completed' ? 'bg-green-500' :
                        file.status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                        file.status === 'failed' ? 'bg-red-500' :
                        'bg-gray-300'
                      }`} />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {file.status === 'uploading' ? `${file.progress}%` : 
                         file.status === 'completed' ? '✅' :
                         file.status === 'failed' ? '❌' : '⏳'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* رسالة توجيهية */}
        {activeUpload.status === 'uploading' && (
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-center text-blue-700">
            💡 يمكنك تصغير أو إخفاء هذه النافذة، سيستمر الرفع في الخلفية.
          </div>
        )}
      </div>
    </div>
  );
}
