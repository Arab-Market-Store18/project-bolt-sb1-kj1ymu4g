// store/useProductViewStore.ts

import { create } from 'zustand';

// واجهة تصف شكل "لوحة التحكم" الخاصة بنا
interface ProductViewState {
  // رقم المنتج الذي يجب أن تكون نافذته مفتوحة حاليًا
  selectedProductId: string | null;
  
  // رقم المنتج الذي نريد الانتقال إليه وإبرازه
  productIdToScrollTo: string | null;

  // دالة لفتح نافذة منتج معين
  openModal: (productId: string) => void;
  
  // دالة لإغلاق النافذة
  closeModal: () => void;

  // دالة لتحديد المنتج الذي نريد الانتقال إليه
  setProductIdToScrollTo: (productId: string | null) => void;
}

// إنشاء المتجر باستخدام Zustand
export const useProductViewStore = create<ProductViewState>((set) => ({
  // الحالة الأولية
  selectedProductId: null,
  productIdToScrollTo: null,

  // تعريف الدوال
  openModal: (productId) => set({ selectedProductId: productId }),
  
  closeModal: () => set({ selectedProductId: null, productIdToScrollTo: null }),

  setProductIdToScrollTo: (productId) => set({ productIdToScrollTo: productId }),
}));
