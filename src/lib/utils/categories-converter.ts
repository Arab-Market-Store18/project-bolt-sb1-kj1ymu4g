// المسار: lib/utils/categories-converter.ts
// دالة تحول البيانات المحلية من categories.ts إلى الصيغة المطلوبة للمكونات

import { categoriesData } from '../data/categories';

export interface FlatCategory {
  id: string;
  name: string;
  icon_name: string;
  parent_id: string | null;
  level: number;
}

let flatCategoriesCache: FlatCategory[] | null = null;

export function getFlatCategories(): FlatCategory[] {
  if (flatCategoriesCache) {
    return flatCategoriesCache;
  }

  const result: FlatCategory[] = [];

  const flatten = (categories: any[], parentId: string | null = null, level: number = 0) => {
    categories.forEach((category) => {
      const categoryId = `${parentId ? parentId + '-' : ''}${category.id}`;
      
      result.push({
        id: categoryId,
        name: category.name,
        icon_name: category.icon || 'Tag',
        parent_id: parentId,
        level
      });

      if (category.subCategories && category.subCategories.length > 0) {
        flatten(category.subCategories, categoryId, level + 1);
      }
    });
  };

  flatten(categoriesData);
  flatCategoriesCache = result;
  return result;
}

export async function getSubCategories(parentId: string | null): Promise<FlatCategory[]> {
  const allCategories = getFlatCategories();
  return allCategories.filter(cat => cat.parent_id === parentId);
}

export function getCategoryById(id: string): FlatCategory | undefined {
  const allCategories = getFlatCategories();
  return allCategories.find(cat => cat.id === id);
}

export function getCategoryName(id: string): string {
  const category = getCategoryById(id);
  return category?.name || 'غير معروف';
}
