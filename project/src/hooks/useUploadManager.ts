import { useCallback } from 'react';
import { uploadManager, UploadType, UploadAction } from '@/lib/utils/upload-manager';

export function useUploadManager() {
  const startUpload = useCallback((
    type: UploadType,
    action: UploadAction,
    entityName: string,
    entityId?: string,
    data?: any
  ) => {
    return uploadManager.startUpload({
      type,
      action,
      entityName,
      entityId,
      data,
    });
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    uploadManager.updateProgress(id, progress);
  }, []);

  const finishUpload = useCallback((id: string, success: boolean, message?: string) => {
    uploadManager.finishUpload(id, success, message);
  }, []);

  return {
    startUpload,
    updateProgress,
    finishUpload,
    getActiveUploads: uploadManager.getActiveUploads.bind(uploadManager),
  };
}