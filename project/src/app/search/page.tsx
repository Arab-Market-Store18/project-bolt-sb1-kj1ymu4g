// مسار الملف: src/app/search/page.tsx

// ⬇️ أضف هذا السطر في الأعلى (بعد imports) ⬇️
export const dynamic = 'force-dynamic';

// --- الجزء الأول: منطق الخادم (Server Logic) ---

// 1. نستورد الأدوات اللازمة للبحث من جهة الخادم
import { performSearchUseCase } from '@/app/composition-root';
import { SearchCriteria } from '@/domain/search/value-objects/SearchCriteria';
import type { Product } from "@/lib/types"; // نفترض أن هذا هو النوع الصحيح
import type { Facets } from '@/features/search/SearchClient'; // نستورد نوع الفلاتر

// 2. نستورد المكون التفاعلي الذي سيعرض الواجهة
import SearchClient from '@/features/search/SearchClient';

// 3. نجعل الصفحة async لتتمكن من جلب البيانات على الخادم
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  
  // ⬇️ ⬇️ ⬇️ التعديل المهم: ننتظر Promise ⬇️ ⬇️ ⬇️
  const params = await searchParams;
  const query = params.q || '';
  
  // 4. نقوم بتنفيذ البحث الأولي على الخادم
  const currentParams = new URLSearchParams();
  if (typeof query === 'string' && query) {
    currentParams.set('q', query);
  }
  // يمكن إضافة بقية المعلمات هنا (category, sort, etc.)

  let initialProducts: Product[] = [];
  let initialFacets: Facets | null = null;
  let initialError: string | null = null;
  let initialTotal: number = 0;
  let initialPage: number = 1;

  // 5. ننفذ البحث فقط إذا كان هناك مصطلح بحث
  if (query && typeof query === 'string') {
    try {
      // ⬇️ ⬇️ ⬇️ التعديل المهم هنا ⬇️ ⬇️ ⬇️
      // إنشاء SearchCriteria بشكل صحيح
      
      
      
      // استخدام criteria بدلاً من currentParams
      const result = await performSearchUseCase.execute(currentParams);
      // ⬆️ ⬆️ ⬆️ نهاية التعديل ⬆️ ⬆️ ⬆️
      
      initialProducts = result.products || [];
      initialFacets = result.facets || null;
      initialTotal = result.total || 0;
      initialPage = result.page || 1;
      
    } catch (e: any) {
      initialError = e.message || 'حدث خطأ أثناء البحث الأولي.';
    }
  }

  // --- الجزء الثاني: العرض (Rendering) ---

  // 6. بدلاً من عرض النتائج مباشرة، نعرض المكون التفاعلي
  // ونمرر له البيانات الأولية التي جلبناها على الخادم.
  return (
    <SearchClient
      initialProducts={initialProducts}
      initialFacets={initialFacets}
      initialError={initialError}
      initialTotal={initialTotal}
      initialPage={initialPage}
      initialQuery={query as string}
    />
  );
}
