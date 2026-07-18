// الملف: app/api/categories/route.ts
import { NextResponse } from 'next/server';
export async function GET() {
  const categories = [
    { id: 1, name: 'المنتجات', parent_id: null, icon_name: 'ShoppingBag' },
    { id: 2, name: 'الخدمات', parent_id: null, icon_name: 'Briefcase' },
    { id: 3, name: 'الإلكترونيات', parent_id: 1, icon_name: 'Smartphone' },
    { id: 4, name: 'الملابس', parent_id: 1, icon_name: 'Shirt' },
    { id: 5, name: 'التعليم', parent_id: 2, icon_name: 'BookOpen' },
    { id: 6, name: 'الصحة', parent_id: 2, icon_name: 'Heart' },
    { id: 7, name: 'الرياضة', parent_id: 1, icon_name: 'Dumbbell' },
    { id: 8, name: 'الجمال', parent_id: 1, icon_name: 'Sparkles' }
  ];
  return NextResponse.json({ 
    success: true,
    categories: categories 
  });
}
