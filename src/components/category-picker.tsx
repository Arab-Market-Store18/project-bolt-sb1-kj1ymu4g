// المسار: components/category-picker.tsx
// -- مكون جديد تم تطويره بواسطة Manus لعرض واختيار الفئات بشكل ديناميكي ومتداخل --

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client'; // تأكد من صحة هذا المسار
import type { Category } from '@/lib/types'; // استيراد النوع الذي عرفناه
import { Loader2 } from 'lucide-react';

// --- دالة مساعدة لبناء الهيكل الشجري من القائمة المسطحة ---
const buildCategoryTree = (categories: Category[]): Category[] => {
  const categoryMap = new Map<number, Category>();
  const rootCategories: Category[] = [];

  // أولاً، قم بإنشاء خريطة لسهولة الوصول وأضف مصفوفة subCategories فارغة
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, subCategories: [] });
  });

  // ثانيًا، قم بربط الأبناء بالآباء
  categoryMap.forEach(category => {
    if (category.parent_id && categoryMap.has(category.parent_id)) {
      const parent = categoryMap.get(category.parent_id);
      parent?.subCategories?.push(category);
    } else {
      // إذا لم يكن له أب، فهو قسم رئيسي
      rootCategories.push(category);
    }
  });

  return rootCategories;
};


// --- تعريف Props للمكون ---
interface CategoryPickerProps {
  // دالة سيتم استدعاؤها عند اختيار القسم النهائي
  onCategorySelect: (categoryId: number) => void;
  // معرف القسم المختار مسبقًا (اختياري، مفيد في صفحات التعديل)
  initialCategoryId?: number;
}


export function CategoryPicker({ onCategorySelect, initialCategoryId }: CategoryPickerProps) {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // الحالة لتخزين مسار الاختيار (مثال: [id_الرئيسي, id_الفرعي, id_الفرعي_الفرعي])
  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  // جلب البيانات عند تحميل المكون لأول مرة
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createSupabaseBrowserClient();
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        
        setAllCategories(data || []);
      } catch (err: any) {
        setError("فشل في جلب الأقسام: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // بناء الهيكل الشجري كلما تغيرت البيانات
  const categoryTree = useMemo(() => buildCategoryTree(allCategories), [allCategories]);

  // دالة للتعامل مع تغيير الاختيار في أي قائمة منسدلة
  const handleSelectChange = (level: number, categoryId: string) => {
    const numericId = parseInt(categoryId, 10);
    if (!numericId) {
      // إذا اختار المستخدم "اختر قسم..."، قم بقطع المسار عند هذا المستوى
      const newPath = selectedPath.slice(0, level);
      setSelectedPath(newPath);
      return;
    }

    const newPath = [...selectedPath.slice(0, level), numericId];
    setSelectedPath(newPath);

    // تحقق مما إذا كان للقسم المختار أبناء
    const findCategory = (nodes: Category[], id: number): Category | undefined => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.subCategories) {
                const found = findCategory(node.subCategories, id);
                if (found) return found;
            }
        }
    };

    const selectedNode = findCategory(categoryTree, numericId);
    // إذا لم يكن للقسم المختار أبناء، فهذا هو الاختيار النهائي
    if (selectedNode && (!selectedNode.subCategories || selectedNode.subCategories.length === 0)) {
      onCategorySelect(numericId);
    }
  };

  // عرض مؤشر التحميل أو رسالة الخطأ
  if (loading) {
    return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /> <span>جاري تحميل الأقسام...</span></div>;
  }
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // حساب القوائم المنسدلة التي يجب عرضها
  const dropdownsToRender = [{ level: 0, options: categoryTree }];
  let currentLevelOptions = categoryTree;

  for (let i = 0; i < selectedPath.length; i++) {
    const parentId = selectedPath[i];
    const parentNode = currentLevelOptions.find(cat => cat.id === parentId);
    if (parentNode && parentNode.subCategories && parentNode.subCategories.length > 0) {
      dropdownsToRender.push({ level: i + 1, options: parentNode.subCategories });
      currentLevelOptions = parentNode.subCategories;
    } else {
      break; // لا توجد مستويات أخرى لعرضها
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50" dir="rtl">
        <p className="font-semibold">اختر قسم المنتج:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dropdownsToRender.map(({ level, options }) => (
                <select
                    key={level}
                    value={selectedPath[level] || ''}
                    onChange={(e) => handleSelectChange(level, e.target.value)}
                    className="w-full p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">-- اختر قسم --</option>
                    {options.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            ))}
        </div>
        {selectedPath.length > 0 && (
             <div className="pt-2 text-sm text-gray-600">
                المسار المختار: {selectedPath.join(' > ')}
             </div>
        )}
    </div>
  );
}
