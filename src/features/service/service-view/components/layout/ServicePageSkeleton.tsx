// المسار: features/service/service-view/components/layout/ServicePageSkeleton.tsx

export const ServicePageSkeleton = () => {
  return (
    <div className="bg-background min-h-screen animate-pulse">
      {/* هيدر التحميل */}
      <div className="h-48 md:h-64 bg-gray-300"></div>
      
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الأيسر */}
          <div className="lg:col-span-1 space-y-6">
            {/* معرض الصور */}
            <div className="bg-gray-200 rounded-xl h-64"></div>
            
            {/* خدمات أخرى */}
            <div className="bg-gray-200 rounded-lg h-48"></div>
            
            {/* اقتراحات */}
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
          
          {/* العمود الأيمن */}
          <div className="lg:col-span-2 space-y-6">
            {/* العنوان */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            
            {/* التفاصيل */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
            
            {/* الأسعار */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
            
            {/* التقييمات */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
