// hooks/useUpload.ts - نسخة متوافقة مع الـ store المحسن
import { useUploadStore } from '@/store/upload-store';

interface SimpleUploadOptions {
  entityName: string;
  type?: 'product' | 'service' | 'profile';
  totalFiles?: number;
}

export const useUpload = () => {
  const store = useUploadStore();
  
  const startUpload = (entityName: string, totalFiles: number = 1) => {
    // استخدام store المحسن مع قيمة افتراضية للنوع
    const type: 'product' | 'service' | 'profile' = 'product';
    
    // إنشاء ملفات وهمية للتوافق مع الـ store الجديد
    const dummyFiles = Array.from({ length: totalFiles }, (_, i) => ({
      name: `${entityName}-${i + 1}`,
      size: 0,
      type: 'document' as const,
    }));
    
    // استخدام startUpload من الـ store المحسن
    const id = store.startUpload(entityName, type, dummyFiles);
    
    return id;
  };
  
  const updateUpload = (id: string, progress: number, fileIndex: number = 0) => {
    // البحث عن الـ upload النشط
    const upload = store.activeUploads.find(u => u.id === id);
    if (!upload) return;
    
    // تحديث تقدم الملف
    const fileId = `${id}-file-${fileIndex}`;
    store.updateFileProgress(id, fileId, progress);
  };
  
  const finishUpload = (id: string, success: boolean, message: string) => {
    if (success) {
      store.completeUpload(id, message);
    } else {
      store.failUpload(id, message);
    }
  };
  
  // دالة مساعدة للحصول على الحالة البسيطة
  const getCurrentUpload = () => {
    if (store.activeUploads.length === 0) return null;
    
    // استخدام أول upload نشط
    const currentUpload = store.activeUploads[0];
    
    return {
      id: currentUpload.id,
      status: currentUpload.status,
      progress: currentUpload.totalProgress,
      message: currentUpload.message,
    };
  };
  
  const currentUpload = getCurrentUpload();
  
  return {
    // التوافق مع الكود القديم
    startUpload,
    updateUpload,
    finishUpload,
    
    // التوافق مع الخصائص القديمة
    id: currentUpload?.id || '',
    status: currentUpload?.status || 'idle',
    progress: currentUpload?.progress || 0,
    message: currentUpload?.message || '',
    
    // التوافق مع التوابع القديمة
    isUploading: store.activeUploads.length > 0,
    uploadProgress: currentUpload?.progress || 0,
    uploadMessage: currentUpload?.message || '',
    
    // إضافة التوابع الجديدة للتوافق
    showUploadIndicator: () => store.toggleGlobalIndicator(true),
    hideUploadIndicator: () => store.toggleGlobalIndicator(false),
    resetUpload: () => {
      // إلغاء جميع الرفوعات النشطة
      store.activeUploads.forEach(upload => store.cancelUpload(upload.id));
    },
    
    // إضافة خصائص الـ store المحسن للاستخدام المتقدم
    activeUploads: store.activeUploads,
    completedUploads: store.completedUploads,
    showGlobalIndicator: store.showGlobalIndicator,
    
    // توابع الـ store المحسن
    cancelUpload: store.cancelUpload,
    removeUpload: store.removeUpload,
    clearCompleted: store.clearCompleted,
  };
};

// نسخة مبسطة للاستخدام مع الكود القديم
export const useSimpleUpload = () => {
  const {
    startUpload,
    updateUpload,
    finishUpload,
    isUploading,
    uploadProgress,
    uploadMessage,
    showUploadIndicator,
    hideUploadIndicator,
    resetUpload,
  } = useUpload();
  
  return {
    startUpload,
    updateUpload,
    finishUpload,
    isUploading,
    uploadProgress,
    uploadMessage,
    showUploadIndicator,
    hideUploadIndicator,
    resetUpload,
  };
};