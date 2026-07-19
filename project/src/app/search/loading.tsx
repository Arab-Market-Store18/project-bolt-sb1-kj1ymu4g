// المسار: app/search/loading.tsx
// -- تم التطوير بواسطة Manus لعرض واجهة تحميل هيكلية احترافية --
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  // نعرض شبكة من بطاقات المنتجات الهيكلية لتقليد شكل الصفحة الحقيقي
  // هذا يعطي المستخدم تجربة أفضل بكثير من شاشة فارغة.
  return (
    <div className="container mx-auto px-4 py-4">
      {/* رأس صفحة البحث الهيكلي */}
      <Skeleton className="h-20 w-full mb-4" />
      <div className="flex flex-col lg:flex-row gap-8">
        {/* قسم الفلاتر الهيكلي (للشاشات الكبيرة) */}
        <aside className="hidden lg:block lg:w-1/4 xl:w-1/5">
          <div className="sticky top-24 space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </aside>
        {/* قسم النتائج الرئيسي الهيكلي */}
        <main className="w-full lg:w-3/4 xl:w-4/5">
          {/* شريط التحكم العلوي الهيكلي */}
          <div className="bg-card border rounded-lg p-4 mb-6 flex items-center justify-between gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-44" />
          </div>
          {/* شبكة بطاقات المنتجات الهيكلية */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 
              نعرض 8 بطاقات هيكلية كقيمة مبدئية.
              يمكنك تغيير العدد ليتناسب مع عدد المنتجات في الصفحة (productsPerPage).
            */}
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
