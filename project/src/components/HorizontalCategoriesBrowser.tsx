// الملف: /components/HorizontalCategoriesBrowser.tsx
"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CategoriesBrowserProps {
  onNavigationStart: () => void;
  allCategories: Category[];
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  icon_name: string | null;
}

export default function HorizontalCategoriesBrowser({ 
  onNavigationStart, 
  allCategories 
}: CategoriesBrowserProps) {
  const router = useRouter();

  // 🔥 عرض فقط الأقسام الرئيسية مباشرة
  const mainCategories = React.useMemo(() => {
    if (!allCategories || allCategories.length === 0) return [];

    console.log('📦 جميع الأقسام المستلمة:', allCategories);
    
    // الأقسام الرئيسية الثابتة
    const staticMainCategories = [
      { id: 1, name: 'المنتجات', parent_id: null, icon_name: 'ShoppingBag' },
      { id: 2, name: 'الخدمات', parent_id: null, icon_name: 'Briefcase' }
    ];

    // إضافة أي أقسام رئيسية أخرى من البيانات
    const dynamicMainCategories = allCategories.filter(cat => 
      cat.parent_id === null && cat.id !== 1 && cat.id !== 2
    );

    const result = [...staticMainCategories, ...dynamicMainCategories];
    console.log('🎯 الأقسام الرئيسية المعروضة:', result);
    return result;

  }, [allCategories]);

  const handleCategoryClick = (categoryId: number, categoryName: string) => {
    console.log('🎯 الضغط على القسم:', categoryName, 'ID:', categoryId);
    onNavigationStart();
    
    const params = new URLSearchParams();
    
    // جميع الأقسام هنا رئيسية
    params.set('main_category_id', categoryId.toString());
    
    console.log('🔄 الانتقال إلى:', `/search?${params.toString()}`);
    router.push(`/search?${params.toString()}`);
  };

  const handleShowAll = () => {
    console.log('👁️ عرض جميع المنتجات');
    onNavigationStart();
    router.push('/search');
  };

  if (!allCategories || allCategories.length === 0) {
    return (
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-bold text-gray-800 mb-3">تصفح الأقسام:</h3>
        <div className="text-gray-500 text-sm">جاري تحميل الأقسام...</div>
      </div>
    );
  }

  // 🔥 إذا لم توجد أقسام رئيسية، عرض رسالة
  if (mainCategories.length === 0) {
    return (
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-bold text-gray-800 mb-3">تصفح الأقسام:</h3>
        <div className="text-gray-500 text-sm">لا توجد أقسام رئيسية</div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b bg-gray-50">
      <h3 className="font-bold text-gray-800 mb-3">تصفح الأقسام:</h3>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        
        {/* زر الكل */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShowAll}
          className="rounded-full flex-shrink-0 h-8 px-4 text-sm bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          الكل
        </Button>

        {/* 🔥 عرض فقط الأقسام الرئيسية */}
        {mainCategories.map((category) => (
          <Button
            key={category.id}
            variant="outline"
            size="sm"
            onClick={() => handleCategoryClick(category.id, category.name)}
            className="rounded-full flex-shrink-0 h-8 px-4 text-sm bg-white hover:bg-blue-50 border-gray-200 whitespace-nowrap"
          >
            {category.name}
          </Button>
        ))}
        
      </div>
    </div>
  );
}