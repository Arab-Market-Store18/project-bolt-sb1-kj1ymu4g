// المسار: components/DashboardProductRow.tsx
// هذا المكون مخصص لعرض منتج واحد كـ "صف" في لوحة تحكم التاجر

import React from 'react';
import Image from 'next/image';
import { Edit, Trash2, MoreVertical } from 'lucide-react'; // أيقونات للإجراءات
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // لعرض قائمة منسدلة على الهاتف

// 1. واجهة الخصائص (Props): نحدد البيانات التي سيستقبلها المكون
interface DashboardProductRowProps {
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    images: string[];
    category: string; // المسار المترجم مثل "إلكترونيات / هواتف"
  };
  onEdit: (id: string) => void;   // دالة لتنفيذ التعديل
  onDelete: (id: string) => void; // دالة لتنفيذ الحذف
}

// 2. دالة مساعدة لتنسيق السعر بشكل جميل
const formatPrice = (price: number, currency: string) => {
  if (price === null || typeof price === 'undefined') return 'عند الطلب';
  // يمكنك إضافة منطق تحويل الأرقام الكبيرة (مليون، مليار) هنا إذا أردت
  return `${price.toLocaleString('ar-EG')} ${currency}`; // استخدام ar-EG لإظهار الفواصل العربية
};

// 3. جسم المكون الرئيسي
export function DashboardProductRow({ product, onEdit, onDelete }: DashboardProductRowProps) {
  // نختار الصورة الأولى كصورة مصغرة، أو صورة افتراضية في حال عدم وجود صور
  const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : "/placeholder.svg";

  return (
    // حاوية الصف: تستخدم Flexbox لترتيب العناصر أفقيًا
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 w-full" dir="rtl">
      
      {/* القسم الأيمن: يحتوي على الصورة والمعلومات النصية */}
      <div className="flex items-center gap-4 overflow-hidden">
        {/* الصورة المصغرة */}
        <div className="relative h-16 w-16 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-md"
          />
        </div>
        {/* المعلومات: الاسم، الفئة، السعر */}
        <div className="flex flex-col justify-center overflow-hidden">
          <h3 className="text-sm font-semibold truncate" title={product.name}>
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 truncate" title={product.category}>
            {product.category}
          </p>
          <span className="text-sm font-bold text-emerald-600 mt-1">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>
      </div>

      {/* القسم الأيسر: يحتوي على أزرار الإجراءات (تعديل وحذف) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        
        {/* 4. التصميم المتجاوب للأزرار */}
        {/* على الشاشات الكبيرة (sm وما فوق): نعرض الأزرار كاملة */}
        <div className="hidden sm:flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(product.id)}>
            <Edit className="h-4 w-4 ml-1" />
            <span>تعديل</span>
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(product.id)}>
            <Trash2 className="h-4 w-4 ml-1" />
            <span>حذف</span>
          </Button>
        </div>

        {/* على الشاشات الصغيرة (الهاتف): نخفي الأزرار ونعرض قائمة منسدلة (أيقونة الثلاث نقاط) */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(product.id)}>
                <Edit className="ml-2 h-4 w-4" />
                <span>تعديل</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-red-600 focus:text-red-600">
                <Trash2 className="ml-2 h-4 w-4" />
                <span>حذف</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
