// المسار: app/products/[productId]/loading.tsx

export default function Loading() {
    return (
      <div className="pb-24 pt-4 flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }