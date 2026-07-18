// المسار: hooks/use-modal.ts
// النسخة المعدلة: تم إضافة 'emailSignUp' إلى قائمة الأنواع المعروفة.

import { create } from 'zustand';

// --- بداية التعديل الطفيف ---
// الخطوة 1: أضفنا "emailSignUp" وبعض الأنواع الأخرى من هيكل مشروعك
// لنجعل هذا الملف هو المتحكم المركزي بكل النوافذ.
export type ModalType = 
  | "publicProductView" 
  | "sellerProfile" 
  | "videoPlayer"
  | "emailSignUp" // <--- تمت إضافته هنا
  | "testModal"   // (من هيكل مشروعك)
  | "addProduct"  // (من هيكل مشروعك)
  | "editProduct" // (من هيكل مشروعك)
  | "deleteProduct"; // (من هيكل مشروعك)
// --- نهاية التعديل الطفيف ---


// الخطوة 2: أضفنا "videoUrl" و "actionText" إلى البيانات التي يمكن تمريرها
interface ModalData {
  productId?: string;
  sellerId?: string;
  videoUrl?: string;
  actionText?: string; // لإظهار رسالة مثل "للإعجاب بالمنتج"
  // يمكنك إضافة أي بيانات أخرى تحتاجها النوافذ هنا
}

// تعريف شكل عنصر واحد في المكدس
interface ModalInstance {
  type: ModalType;
  data: ModalData;
}

// واجهة المتجر تبقى كما هي
interface ModalStore {
  modalStack: ModalInstance[];
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
  closeAll: () => void;
}

export const useModal_v2= create<ModalStore>((set) => ({
  // باقي الكود يبقى كما هو تمامًا
  modalStack: [],

  onOpen: (type, data = {}) => 
    set((state) => ({
      modalStack: [...state.modalStack, { type, data }],
    })),

  onClose: () =>
    set((state) => ({
      modalStack: state.modalStack.slice(0, -1),
    })),
  
  closeAll: () => 
    set({ modalStack: [] }),
}));
