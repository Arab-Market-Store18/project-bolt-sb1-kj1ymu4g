// 📍 المسار: features/service/management/actions/index.ts
// 📋 الوظيفة: ملف تجميع لتصدير جميع إجراءات إدارة الخدمات مع أنواع TypeScript المرتبطة بها.
// ملف تجميع لتصدير جميع الإجراءات
export { createService, validateServiceData } from './createService.action';
export { updateService, validateUpdateData } from './updateService.action';
export { deleteService, restoreService } from './deleteService.action';

export type { 
  CreateServiceResponse, 
  UpdateServiceResponse, 
  DeleteServiceResponse 
} from './types';
