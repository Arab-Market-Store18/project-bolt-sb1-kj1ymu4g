//lib/utils/upload-manager.ts
export type UploadType = 'product' | 'service' | 'profile' | 'other';
export type UploadAction = 'add' | 'update' | 'delete';
export type UploadStatus = 'uploading' | 'success' | 'error' | 'cancelled';

export interface UploadItem {
  id: string;
  type: UploadType;
  action: UploadAction;
  entityId?: string;
  entityName: string;
  progress: number;
  status: UploadStatus;
  startedAt: string;
  completedAt?: string;
  message?: string;
  data?: any;
}

class UploadManager {
  private uploads: Map<string, UploadItem> = new Map();
  private listeners: Set<(uploads: UploadItem[]) => void> = new Set();

  // بدء تحميل جديد
  startUpload(params: {
    type: UploadType;
    action: UploadAction;
    entityName: string;
    entityId?: string;
    data?: any;
  }): string {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const upload: UploadItem = {
      id,
      type: params.type,
      action: params.action,
      entityId: params.entityId,
      entityName: params.entityName,
      progress: 0,
      status: 'uploading',
      startedAt: new Date().toISOString(),
      data: params.data,
    };

    this.uploads.set(id, upload);
    this.notifyListeners();
    this.updateTabTitle();
    
    // إرسال حدث لـ GlobalUploadIndicator
    window.dispatchEvent(new CustomEvent('upload:start', { detail: upload }));
    
    return id;
  }

  // تحديث التقدم
  updateProgress(id: string, progress: number) {
    const upload = this.uploads.get(id);
    if (upload && upload.status === 'uploading') {
      upload.progress = Math.min(100, Math.max(0, progress));
      this.uploads.set(id, upload);
      this.notifyListeners();
      this.updateTabTitle();
      
      window.dispatchEvent(new CustomEvent('upload:progress', { 
        detail: { id, progress } 
      }));
    }
  }

  // إنهاء التحميل
  finishUpload(id: string, success: boolean, message?: string) {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.status = success ? 'success' : 'error';
      upload.progress = success ? 100 : upload.progress;
      upload.completedAt = new Date().toISOString();
      upload.message = message;
      this.uploads.set(id, upload);
      this.notifyListeners();
      this.updateTabTitle();
      
      window.dispatchEvent(new CustomEvent('upload:end', { 
        detail: { id, success, message } 
      }));

      // تنظيف الإشعارات الناجحة بعد وقت
      if (success) {
        setTimeout(() => this.removeUpload(id), 5000);
      }
    }
  }

  // إلغاء التحميل
  cancelUpload(id: string) {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.status = 'cancelled';
      upload.completedAt = new Date().toISOString();
      this.uploads.set(id, upload);
      this.notifyListeners();
      this.updateTabTitle();
    }
  }

  // إزالة تحميل
  removeUpload(id: string) {
    this.uploads.delete(id);
    this.notifyListeners();
    this.updateTabTitle();
  }

  // الحصول على جميع التحميلات النشطة
  getActiveUploads(): UploadItem[] {
    return Array.from(this.uploads.values()).filter(
      u => u.status === 'uploading' || u.status === 'success'
    );
  }

  // الحصول على تحميلات نوع معين
  getUploadsByType(type: UploadType): UploadItem[] {
    return Array.from(this.uploads.values()).filter(u => u.type === type);
  }

  // تحديث عنوان التبويب
  private updateTabTitle() {
    const uploading = Array.from(this.uploads.values()).filter(u => u.status === 'uploading');
    if (uploading.length > 0) {
      const totalProgress = uploading.reduce((sum, u) => sum + u.progress, 0) / uploading.length;
      document.title = `(⏳ ${Math.round(totalProgress)}%) - متجر العرب`;
    } else {
      document.title = 'متجر العرب';
    }
  }

  // المستمعين
  addListener(listener: (uploads: UploadItem[]) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (uploads: UploadItem[]) => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    const uploads = this.getActiveUploads();
    this.listeners.forEach(listener => listener(uploads));
  }
}

// نسخة واحدة عالمية
export const uploadManager = new UploadManager();