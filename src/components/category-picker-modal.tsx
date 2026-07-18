// المسار: components/category-picker-modal.tsx
// -- نسخة Manus المعدلة: مع تحسين منطق إرسال الفئة المقترحة --

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { icons, HelpCircle, Search, X, ChevronLeft } from 'lucide-react'; 
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// --- الواجهات والأنواع ---
interface CategoryFromDB {
  id: number;
  name: string;
  icon_name: string | null;
  parent_id?: number | null; 
}

// ▼▼▼ التعديل رقم 1: إضافة نوع جديد لتمييز الفئة المقترحة ▼▼▼
export type SuggestedCategory = {
  isSuggested: true;
  name: string;
};
// ▲▲▲ نهاية التعديل رقم 1 ▲▲▲

type IconName = keyof typeof icons;
const LucideIcon = ({ name, className, ...props }: { name: IconName | null } & React.ComponentProps<'svg'>) => {
  if (!name) return <HelpCircle className={cn("w-10 h-10", className)} {...props} />;
  const IconComponent = icons[name as IconName];
  if (!IconComponent) {
    console.warn(`Lucide Icon Not Found: "${name}".`);
    return <HelpCircle className={cn("w-10 h-10", className)} {...props} />;
  }
  return <IconComponent className={cn("w-10 h-10", className)} {...props} />;
};

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ▼▼▼ التعديل رقم 2: تحديث نوع الدالة onSelect لتقبل النوع الجديد ▼▼▼
  onSelect: (value: CategoryFromDB | SuggestedCategory) => void;
  // ▲▲▲ نهاية التعديل رقم 2 ▲▲▲
  fetchSubCategories: (parentId: number | null) => Promise<CategoryFromDB[]>;
  initialParentId: number | null;
  stopAtLevel?: number;
  isLoading?: boolean;
  disabledCategoryIds?: number[];
}

// --- المكون الرئيسي ---
export function CategoryPickerModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  fetchSubCategories,
  initialParentId,
  stopAtLevel,
  disabledCategoryIds = [],
  isLoading: initialIsLoading = false 
}: CategoryPickerModalProps) {

  const [history, setHistory] = useState<{ parentId: number | null; title: string }[]>([]);
  const [currentCategories, setCurrentCategories] = useState<CategoryFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(initialIsLoading);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const currentLevel = history.length;
  const currentTitle = history[history.length - 1]?.title || 'اختر نشاطك';

  const loadCategories = useCallback(async (parentId: number | null, title: string) => {
    setIsLoading(true);
    setSearchQuery("");
    const categories = await fetchSubCategories(parentId);
    setCurrentCategories(categories);
    setHistory(prev => [...prev, { parentId, title }]);
    setIsLoading(false);
  }, [fetchSubCategories]);

  useEffect(() => {
    if (isOpen) {
      setHistory([]);
      
      const initialTitle = initialParentId === null 
        ? 'اختر نشاطك الرئيسي'
        : 'اختر القسم الفرعي';

      loadCategories(initialParentId, initialTitle);
    }
  }, [isOpen, initialParentId, loadCategories]);

  const handleBack = useCallback(async () => {
    if (history.length <= 1) return;

    const newHistory = history.slice(0, history.length - 1);
    setHistory(newHistory);

    const prevHistoryItem = newHistory[newHistory.length - 1];
    
    setIsLoading(true);
    const categories = await fetchSubCategories(prevHistoryItem.parentId);
    setCurrentCategories(categories);
    setIsLoading(false);
  }, [history, fetchSubCategories]);

  const handleSelect = async (item: CategoryFromDB) => {
    console.log('[DEBUG] CategoryPickerModal handleSelect item:', item, 'currentLevel:', currentLevel, 'stopAtLevel:', stopAtLevel);
    const shouldStop = stopAtLevel !== undefined && currentLevel >= stopAtLevel;
    if (shouldStop) {
      console.log('[DEBUG] CategoryPickerModal shouldStop=true -> onSelect + onClose');
      onSelect(item);
      onClose();
      return;
    }

    setIsLoading(true);
    let subCategories: CategoryFromDB[] = [];
    try {
      subCategories = await fetchSubCategories(item.id);
      console.log('[DEBUG] CategoryPickerModal fetchSubCategories result:', subCategories);
    } catch (err) {
      console.error('[DEBUG] CategoryPickerModal fetchSubCategories THREW:', err);
    }
    setIsLoading(false);

    if (subCategories.length > 0) {
      setCurrentCategories(subCategories);
      setHistory(prev => [...prev, { parentId: item.id, title: item.name }]);
    } else {
      console.log('[DEBUG] CategoryPickerModal no subcategories -> onSelect + onClose');
      onSelect(item);
      onClose();
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return currentCategories;
    return currentCategories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentCategories, searchQuery]);

  // ▼▼▼ التعديل رقم 3: تحديث الدالة لإرسال كائن منظم بدلاً من نص خام ▼▼▼
  const handleConfirmInput = () => {
    if (inputValue.trim()) {
      // إرسال كائن له شكل محدد وواضح
      onSelect({ isSuggested: true, name: inputValue.trim() });
      onClose();
    }
  };
  // ▲▲▲ نهاية التعديل رقم 3 ▲▲▲

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 max-h-[90vh] flex flex-col bg-slate-50">
        <DialogHeader className="p-4 flex-row items-center justify-between border-b">
          {history.length > 1 && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <DialogTitle className="text-xl font-bold text-slate-800 text-center flex-grow">
            {currentTitle}
          </DialogTitle>
          {history.length <= 1 && <div className="w-10 h-10" />} 
        </DialogHeader>
        
        <div className="px-6 py-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ابحث في الأقسام الحالية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-gray-50 border-gray-200"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              جاري تحميل الأقسام...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              {searchQuery ? 'لم يتم العثور على نتائج' : 'لا توجد أقسام متاحة'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredCategories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  disabled={disabledCategoryIds.includes(item.id)}
                  className={cn(
                    "group relative flex flex-col items-center justify-center h-28 p-3 border rounded-lg cursor-pointer transition-all duration-300 bg-white overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    disabledCategoryIds.includes(item.id)
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:shadow-lg hover:-translate-y-1"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <LucideIcon 
                    name={item.icon_name as IconName | null} 
                    className="mb-2 text-blue-600 transition-colors duration-300 group-hover:text-white z-10" 
                  />
                  <span className="font-medium text-sm text-center z-10 text-slate-700 group-hover:text-white line-clamp-2">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 border-t bg-white pt-6 mt-auto">
          <div className="relative mb-4">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2 text-sm text-muted-foreground">أو</span>
          </div>
          <div className="space-y-2">
            <label htmlFor="other-category" className="font-medium text-sm text-slate-700">
              إضافة قسم غير موجود
            </label>
            <div className="flex gap-2">
              <Input 
                id="other-category" 
                placeholder="اكتب اسم القسم هنا" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={handleConfirmInput} disabled={!inputValue.trim()} className="min-w-20">
                تأكيد
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
