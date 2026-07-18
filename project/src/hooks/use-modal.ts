// المسار: hooks/use-modal.ts

import { create } from 'zustand';
import { Product, Service } from '@/lib/types'; // تأكد من استيراد الأنواع

// ▼▼▼ بداية التعديل ▼▼▼
export type ModalType = 
  | 'emailSignUp'
  | 'sellerLogin'
  | 'videoPlayer'
  | 'sellerProfile'
  | 'sellerRegistration'
  | 'testModal'
  | 'addProduct'
  | 'editProduct'
  | 'deleteProduct'
  | 'productView'
  | 'serviceView'
  | 'addService'      // تأكد من وجود هذا
  | 'editService'     // تأكد من وجود هذا
  | 'requestBannerAd'; // <--- تمت إضافته هنا
// ▲▲▲ نهاية التعديل ▲▲▲

export interface ModalData {
  // بيانات لنافذة عرض ملف التاجر
  sellerId?: string;
  
  // بيانات لنافذة مشغل الفيديو
  videoUrl?: string;

  // بيانات لنافذة تعديل المنتج
  product?: Product;
  
  // بيانات لنافذة تعديل الخدمة
  service?: Service; // <-- إضافة هذا إن لم يكن موجوداً

  // خاصية لتحديد نوع التسجيل
  registrationType?: 'products' | 'services'; 

  // بيانات لنافذة عرض المنتج
  productId?: string;

  // بيانات لنافذة عرض الخدمة
  serviceId?: string;

  // بيانات لنوافذ إضافة وتعديل المنتجات/الخدمات
  onProductAdded?: (newProduct: Product) => void;
  onProductUpdated?: (updatedProduct: Partial<Product>) => void;
  onServiceAdded?: () => void;
  onServiceUpdated?: (updatedService: Partial<Service>) => void;
  sellerCountry?: string | null;
  sellerMainCategoryId?: any;
  sellerMainCategoryName?: string;
  allCategories?: Category[];
  productToEdit?: Product;
  serviceToEdit?: Service;
  media?: any;
  startIndex?: number;
  email?: string;
  initialProductId?: string | null;
  initialServiceId?: string | null;
}

interface ModalStore {
  type: ModalType | null;
  data?: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: undefined,
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false, data: undefined }),
}));
