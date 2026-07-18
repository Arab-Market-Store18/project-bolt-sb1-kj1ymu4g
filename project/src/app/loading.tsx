"use client"; 
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* هيدر شاحب */}
      <div className="sticky top-0 z-50 w-full bg-background border-b">
        <div className="bg-muted/40 animate-pulse">
          <div className="container mx-auto px-4 h-10 flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
      {/* محتوى رئيسي شاحب */}
      <div className="container mx-auto px-4 py-8">
        {/* بانر رئيسي */}
        <div className="h-64 bg-gray-200 rounded-lg mb-8 animate-pulse"></div>
        {/* أقسام المنتجات */}
        <div className="space-y-12">
          {[1, 2, 3, 4].map((section) => (
            <div key={section}>
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="h-40 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
