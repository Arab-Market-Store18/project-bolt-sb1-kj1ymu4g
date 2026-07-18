// المسار: src/features/search/SearchPageSkeleton.tsx
// المهمة: عرض واجهة تحميل أنيقة تشبه التصميم النهائي.
import { Skeleton } from '@/components/ui/skeleton';
export function SearchPageSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl px-0 sm:px-4">
      {/* Header Skeleton */}
      <div className="p-4 border-b">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
      {/* Banners Skeleton */}
      <div className="p-4 flex gap-2">
        <Skeleton className="h-40 flex-grow rounded-lg" />
        <Skeleton className="h-40 w-1/3 rounded-lg" />
      </div>
      {/* Chips Skeleton */}
      <div className="px-4 flex items-center gap-3 mb-4">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      {/* ControlBar Skeleton */}
      <Skeleton className="h-12 w-full mb-4" />
      {/* Products Grid Skeleton */}
      <div className="p-3 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-2 border rounded-lg p-2">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
