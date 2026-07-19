// lib/feature-flags.ts
export const FEATURES = {
  USE_SERVER_ACTIONS: process.env.NEXT_PUBLIC_USE_SERVER_ACTIONS === 'true',
  
  // ⭐⭐ أضف هذا السطر للخدمات فقط:
  USE_SERVER_ACTIONS_SERVICES: true,
};

// قيمة افتراضية للتطوير
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 ميزات النظام:', FEATURES);
}