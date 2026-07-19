"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export function CategoryBrowser() {
  // بيانات تجريبية للأقسام
  const categories = [
    { name: "الملابس والأزياء", icon: "👕" },
    { name: "الإلكترونيات", icon: "📱" },
    { name: "المنزل والأثاث", icon: "🛋️" },
    { name: "الجمال والعناية", icon: "💄" },
    { name: "الرياضة", icon: "⚽" },
    { name: "الطعام والمطاعم", icon: "🍔" },
    { name: "السيارات", icon: "🚗" },
    { name: "العقارات", icon: "🏢" },
    { name: "الزراعة", icon: "🌱" },
    { name: "التعليم", icon: "📚" },
    { name: "السياحة والسفر", icon: "✈️" },
    { name: "الصناعة", icon: "🏭" },
    { name: "المال والبنوك", icon: "💰" },
  ]

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">تصفح حسب القسم</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-4 space-x-reverse p-4">
          {categories.map((category, index) => (
            <CategoryCard key={index} name={category.name} icon={category.icon} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

function CategoryCard({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="flex flex-col items-center space-y-2 cursor-pointer group">
      <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white shadow-sm border transition-all group-hover:shadow-md group-hover:scale-105">
        <span className="text-3xl">{icon}</span>
      </div>
      <span className="text-sm font-medium text-center">{name}</span>
    </div>
  )
}
