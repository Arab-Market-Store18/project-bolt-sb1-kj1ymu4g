// المسار: src/store/upload-store.ts
// الوصف: النسخة المعدلة التي تصلح منطق طبقة التوافق القديمة.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- الواجهات (تبقى كما هي) ---
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'document';
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  url?: string;
  error?: string;
}

export interface UploadJob {
  id: string;
  type: 'product' | 'service' | 'profile';
  entityName: string;
  files: UploadFile[];
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  totalProgress: number;
  message: string;
  createdAt: Date;
  completedAt?: Date;
}

interface UploadStore {
  activeUploads: UploadJob[];
  completedUploads: UploadJob[];
  showGlobalIndicator: boolean;
  
  // Actions المتقدمة
  startUpload: (entityName: string, type: 'product' | 'service' | 'profile', files: { name: string; size: number; type: 'image' | 'video' | 'document' }[]) => string;
  updateFileProgress: (uploadId: string, fileId: string, progress: number) => void;
  completeFileUpload: (uploadId: string, fileId: string, url: string) => void;
  failFileUpload: (uploadId: string, fileId: string, error: string) => void;
  completeUpload: (uploadId: string, message?: string) => void;
  failUpload: (uploadId: string, error: string) => void;
  cancelUpload: (uploadId: string) => void;
  removeUpload: (uploadId: string) => void;
  clearCompleted: () => void;
  toggleGlobalIndicator: (show: boolean) => void;
  
  // Actions البسيطة (مع تعديلها)
  start: (options: { id: string; message: string; totalFiles: number; }) => void;
  updateProgress: (options: { id: string; progress: number; fileIndex: number; }) => void; // ✅ تم إضافة id هنا
  finish: (options: { id: string; success: boolean; message: string; }) => void; // ✅ تم إضافة id هنا
  
  show: () => void;
  hide: () => void;
  reset: () => void;
  
  // Computed properties (مع تعديلها)
  id: string;
  status: 'idle' | 'uploading' | 'completed' | 'failed';
  progress: number;
  message: string;
}

export const useUploadStore = create<UploadStore>()(
  persist(
    (set, get) => ({
      // --- الحالة الأولية (تبقى كما هي) ---
      activeUploads: [],
      completedUploads: [],
      showGlobalIndicator: true,
      
      // ====== التوابع المتقدمة (تبقى كما هي، فهي سليمة) ======
      startUpload: (entityName, type, files) => {
        const uploadId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const uploadFiles: UploadFile[] = files.map((file, index) => ({
          id: `${uploadId}-file-${index}`, name: file.name, size: file.size, type: file.type, status: 'pending', progress: 0,
        }));
        const newUpload: UploadJob = {
          id: uploadId, type, entityName, files: uploadFiles, status: 'uploading', totalProgress: 0, message: `جاري رفع ${entityName}...`, createdAt: new Date(),
        };
        set((state) => ({ activeUploads: [...state.activeUploads, newUpload], showGlobalIndicator: true }));
        return uploadId;
      },
      updateFileProgress: (uploadId, fileId, progress) => {
        set((state) => ({
          activeUploads: state.activeUploads.map((upload) => {
            if (upload.id === uploadId) {
              const updatedFiles = upload.files.map((file) =>
                file.id === fileId ? { ...file, progress, status: 'uploading' as const } : file
              );
              const totalProgress = updatedFiles.reduce((sum, file) => sum + file.progress, 0) / updatedFiles.length;
              return { ...upload, files: updatedFiles, totalProgress, message: `جاري الرفع... ${Math.round(totalProgress)}%` };
            }
            return upload;
          }),
        }));
      },
      completeFileUpload: (uploadId, fileId, url) => {
        set((state) => ({
          activeUploads: state.activeUploads.map((upload) => {
            if (upload.id === uploadId) {
              const updatedFiles = upload.files.map((file) =>
                file.id === fileId ? { ...file, status: 'completed' as const, progress: 100, url } : file
              );
              const allCompleted = updatedFiles.every((file) => file.status === 'completed');
              return { ...upload, files: updatedFiles, status: allCompleted ? 'completed' : upload.status, completedAt: allCompleted ? new Date() : upload.completedAt };
            }
            return upload;
          }),
        }));
      },
      failFileUpload: (uploadId, fileId, error) => {
        set((state) => ({
          activeUploads: state.activeUploads.map((upload) => {
            if (upload.id === uploadId) {
              const updatedFiles = upload.files.map((file) =>
                file.id === fileId ? { ...file, status: 'failed' as const, error } : file
              );
              return { ...upload, files: updatedFiles };
            }
            return upload;
          }),
        }));
      },
      completeUpload: (uploadId, message = 'تم الرفع بنجاح! ✅') => {
        set((state) => {
          const uploadIndex = state.activeUploads.findIndex((u) => u.id === uploadId);
          if (uploadIndex === -1) return state;
          const completedUpload = state.activeUploads[uploadIndex];
          const updatedUpload = { ...completedUpload, status: 'completed' as const, completedAt: new Date(), message };
          const newActiveUploads = state.activeUploads.filter((u) => u.id !== uploadId);
          return { activeUploads: newActiveUploads, completedUploads: [updatedUpload, ...state.completedUploads] };
        });
      },
      failUpload: (uploadId, error) => {
        set((state) => {
          const uploadIndex = state.activeUploads.findIndex((u) => u.id === uploadId);
          if (uploadIndex === -1) return state;
          const failedUpload = state.activeUploads[uploadIndex];
          const updatedUpload = { ...failedUpload, status: 'failed' as const, completedAt: new Date(), message: `❌ ${error}` };
          const newActiveUploads = state.activeUploads.filter((u) => u.id !== uploadId);
          return { activeUploads: newActiveUploads, completedUploads: [updatedUpload, ...state.completedUploads] };
        });
      },
      cancelUpload: (uploadId) => set((state) => ({ activeUploads: state.activeUploads.filter((upload) => upload.id !== uploadId) })),
      removeUpload: (uploadId) => set((state) => ({ completedUploads: state.completedUploads.filter((upload) => upload.id !== uploadId) })),
      clearCompleted: () => set({ completedUploads: [] }),
      toggleGlobalIndicator: (show) => set({ showGlobalIndicator: show }),

      // ====== التوابع البسيطة للتوافق (النسخة المعدلة والآمنة) ======
      
      start: ({ id, message, totalFiles }) => {
        // هذا الجزء يستخدم الدالة المتقدمة داخليًا، وهو أفضل
        const files = Array.from({ length: totalFiles }, (_, i) => ({ name: `file-${i + 1}`, size: 0, type: 'document' as const }));
        get().startUpload(message.replace('جاري رفع ', '').replace('...', ''), 'product', files);
      },
      
      // ⭐️⭐️ الإصلاح الرئيسي هنا ⭐️⭐️
      updateProgress: ({ id, progress, fileIndex }) => {
        const state = get();
        // ابحث عن المهمة الصحيحة باستخدام الـ id بدلاً من افتراض أنها الأولى
        const upload = state.activeUploads.find(u => u.id === id);
        if (!upload) return; // إذا لم يتم العثور على المهمة، لا تفعل شيئًا

        const fileId = `${upload.id}-file-${fileIndex}`;
        
        // استدعاء الدالة المتقدمة والموثوقة لتنفيذ التحديث
        get().updateFileProgress(upload.id, fileId, progress);
      },
      
      finish: ({ id, success, message }) => {
        const state = get();
        const upload = state.activeUploads.find(u => u.id === id);
        if (!upload) return;

        if (success) {
          get().completeUpload(upload.id, message);
        } else {
          get().failUpload(upload.id, message);
        }
      },
      
      show: () => set({ showGlobalIndicator: true }),
      hide: () => set({ showGlobalIndicator: false }),
      reset: () => set({ activeUploads: [] }),
      
      // ====== Computed properties (تم حذفها لأنها غير آمنة) ======
      // من الأفضل دائمًا الوصول إلى البيانات مباشرة من `activeUploads`
      // بدلاً من استخدام هذه الخصائص التي تفترض وجود عنصر واحد فقط.
      id: '',
      status: 'idle',
      progress: 0,
      message: '',
    }),
    {
      name: 'upload-store-v3', // اسم جديد لمنع التعارض
      partialize: (state) => ({
        completedUploads: state.completedUploads,
        showGlobalIndicator: state.showGlobalIndicator,
      }),
    }
  )
);
