// المسار: components/CategoryShowcase.tsx

// --- إضافة جديدة ---
"use client"; // هذا المكون سيجلب البيانات من جهة العميل، لذا نحتاج لهذه العلامة

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
// --- نهاية الإضافة ---

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton'; // --- إضافة جديدة: لاستخدامها أثناء التحميل

// 1. تعريف أنواع البيانات التي سيستقبلها المكون من قاعدة البيانات
interface CategoryFromDB {
  id: number;
  name: string;
  // سنفترض أن هناك عمودًا للصور في جدول الفئات، أو سنستخدم صورة افتراضية
  image_url: string | null; 
}

// 2. تعديل الخصائص التي يستقبلها المكون
interface CategoryShowcaseProps {
  // سيستقبل الآن 'id' الفئة الرئيسية بدلاً من قائمة الفئات الفرعية
  categoryId: number; 
  title: string;
  viewAllHref: string;
}

export const CategoryShowcase = ({ categoryId, title, viewAllHref }: CategoryShowcaseProps) => {
  // --- إضافة جديدة: حالات لتخزين البيانات والتحميل ---
  const [subCategories, setSubCategories] = useState<CategoryFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();
  // --- نهاية الإضافة ---

  // --- إضافة جديدة: دالة لجلب الفئات الفرعية ---
  useEffect(() => {
    const fetchSubCategories = async () => {
      setIsLoading(true);
      
      // استعلام لجلب الفئات التي يكون 'parent_id' الخاص بها هو 'id' الفئة الرئيسية
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, image_url') // افترضنا وجود عمود image_url
        .eq('parent_id', categoryId)
        .limit(8); // يمكن تحديد عدد الفئات المراد عرضها

      if (error) {
        console.error("Error fetching sub-categories:", error);
        setSubCategories([]); // تعيين مصفوفة فارغة في حالة الخطأ
      } else {
        setSubCategories(data);
      }
      
      setIsLoading(false);
    };

    if (categoryId) {
      fetchSubCategories();
    }
  }, [categoryId, supabase]);
  // --- نهاية الإضافة ---

  // --- إضافة جديدة: عرض هياكل عظمية (Skeletons) أثناء تحميل البيانات ---
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
          <div className="flex flex-col items-start lg:sticky lg:top-24">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex h-full items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                <Skeleton className="h-6 w-3/5" />
                <Skeleton className="h-20 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // --- نهاية الإضافة ---

  // لا تعرض أي شيء إذا لم تكن هناك فئات فرعية بعد التحميل
  if (!subCategories || subCategories.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        
        {/* العمود الجانبي: العنوان وزر "عرض الكل" */}
        <div className="flex flex-col items-start lg:sticky lg:top-24">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <Link href={viewAllHref}>
            <Button className="bg-yellow-500 text-black hover:bg-yellow-600">
              عرض الكل
            </Button>
          </Link>
        </div>

        {/* العمود الرئيسي: شبكة الفئات الفرعية */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
          {subCategories.map((category) => (
            // --- تعديل: استخدام البيانات الديناميكية ---
            <Link href={`/search?category=${category.id}`} key={category.id} className="group block">
              <div className="flex h-full items-center justify-between overflow-hidden rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 dark:bg-gray-900">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  {category.name}
                </h3>
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                  <Image
                    // استخدام الصورة من قاعدة البيانات أو صورة افتراضية
                    src={category.image_url || '/placeholder.jpg'} 
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 25vw, 10vw"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
