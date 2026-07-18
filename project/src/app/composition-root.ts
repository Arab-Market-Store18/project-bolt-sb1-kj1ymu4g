// المسار: src/app/composition-root.ts

import { PerformSearchUseCase } from '@/domain/search/use-cases/PerformSearch.usecase';
import { SupabaseSearchProvider } from '@/infrastructure/providers/supabase/SupabaseSearchProvider.adapter';

// ⬇️ [مهم] تأكد من أن اسم الفئة صحيح بناءً على ملفك
// إذا كان اسم الفئة في adapter هو SupabaseSearchProvider (كما في كودك السابق)
// أو إذا كان SupabaseSearchProviderAdapter

// إنشاء موفر البحث
const searchProvider = new SupabaseSearchProvider();

// إنشاء Use Case المحدث - تأكد من تطابق الأسماء
export const performSearchUseCase = new PerformSearchUseCase(searchProvider);

// [اختياري] لتصحيح الأخطاء، يمكنك إضافة:
console.log('[Composition Root] Search system initialized:', {
  hasProvider: !!searchProvider,
  providerMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(searchProvider)),
  hasUseCase: !!performSearchUseCase
});