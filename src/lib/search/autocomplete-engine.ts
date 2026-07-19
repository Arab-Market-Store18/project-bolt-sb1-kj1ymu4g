/**
 * محرك الاقتراحات المتقدم (Autocomplete Engine)
 * يوفر اقتراحات ذكية أثناء كتابة المستخدم مع تصحيح الأخطاء
 */

import {
  normalizeArabicText,
  expandQueryWithSynonyms,
  correctTypos,
  POPULAR_SEARCHES,
} from '@/lib/arabic-search-utils';
import { cacheAutocomplete, getAutocompleteCache } from '@/lib/redis/search-cache';
import { calculateLevenshteinDistance } from './string-similarity';

// ==================== قاموس الكلمات الشاملة ====================
const DICTIONARY = new Set([
  // الهواتف والإلكترونيات
  'هاتف', 'جوال', 'موبايل', 'ايفون', 'سامسونج', 'شاشة', 'تلفاز',
  'لابتوب', 'حاسوب', 'تابلت', 'سماعة', 'شاحن', 'كاميرا',
  
  // الملابس والأحذية
  'ملابس', 'فستان', 'بنطال', 'قميص', 'حذاء', 'جوارب', 'معطف',
  
  // الاكسسوارات
  'حقيبة', 'محفظة', 'ساعة', 'خاتم', 'اسورة', 'عقد', 'عطر',
  
  // الكلمات الوصفية
  'جديد', 'رخيص', 'غالي', 'فاخر', 'اقتصادي', 'متوسط',
  'أفضل', 'أسوأ', 'كبير', 'صغير', 'أحمر', 'أزرق', 'أسود',
  
  // العلامات التجارية
  'apple', 'samsung', 'lg', 'sony', 'xiaomi', 'huawei', 'nokia',
]);

// ==================== فهرس الكلمات المعاكسة (Inverted Index) ====================
const INVERTED_INDEX = new Map<string, Set<string>>();

// بناء الفهرس من القاموس
for (const word of DICTIONARY) {
  const normalized = normalizeArabicText(word);
  for (let i = 1; i <= normalized.length; i++) {
    const prefix = normalized.substring(0, i);
    if (!INVERTED_INDEX.has(prefix)) {
      INVERTED_INDEX.set(prefix, new Set());
    }
    INVERTED_INDEX.get(prefix)!.add(word);
  }
}

// ==================== دالة البحث السريع عن الكلمات ====================
function getWordsForPrefix(prefix: string): string[] {
  const normalized = normalizeArabicText(prefix);
  const found = INVERTED_INDEX.get(normalized) || new Set();
  return Array.from(found).slice(0, 20);
}

// ==================== دالة تصحيح الأخطاء بالاقتراح ====================
export function suggestCorrectedWords(
  input: string,
  maxDistance = 2
): string[] {
  const normalized = normalizeArabicText(input);
  const suggestions = new Map<string, number>();

  // البحث عن كلمات قريبة من حيث التشابه
  for (const word of DICTIONARY) {
    const distance = calculateLevenshteinDistance(normalized, normalizeArabicText(word));
    if (distance <= maxDistance && distance > 0) {
      suggestions.set(word, distance);
    }
  }

  // ترتيب النتائج حسب القرب (المسافة الأقل أولاً)
  return Array.from(suggestions.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([word]) => word)
    .slice(0, 5);
}

// ==================== محرك الاقتراحات الرئيسي ====================
export async function generateAutocomplete(
  partialQuery: string,
  limit = 10
): Promise<{
  suggestions: string[];
  popular: string[];
  corrected: string | null;
  hasErrors: boolean;
}> {
  if (!partialQuery || partialQuery.trim().length < 1) {
    return {
      suggestions: [],
      popular: POPULAR_SEARCHES.slice(0, limit),
      corrected: null,
      hasErrors: false,
    };
  }

  const trimmed = partialQuery.trim();
  const normalized = normalizeArabicText(trimmed);

  // ============ 1. البحث في الكاش أولاً ============
  const cached = await getAutocompleteCache(normalized);
  if (cached) {
    return {
      suggestions: cached,
      popular: POPULAR_SEARCHES.slice(0, Math.max(0, limit - cached.length)),
      corrected: null,
      hasErrors: false,
    };
  }

  // ============ 2. البحث عن كلمات بنفس البادئة ============
  const prefixMatches = getWordsForPrefix(normalized);

  // ============ 3. تصحيح الأخطاء إذا لم نجد تطابق ============
  let corrected: string | null = null;
  let suggestions = prefixMatches;

  if (prefixMatches.length === 0) {
    const correctedWords = suggestCorrectedWords(trimmed);
    if (correctedWords.length > 0) {
      corrected = correctedWords[0];
      suggestions = correctedWords;
    }
  }

  // ============ 4. توسيع البحث بالمرادفات ============
  const expanded = expandQueryWithSynonyms(trimmed);
  for (const synonym of expanded) {
    if (!suggestions.includes(synonym)) {
      suggestions.push(synonym);
    }
  }

  // ============ 5. إضافة الكلمات الشعبية ============
  const popular = POPULAR_SEARCHES.filter(
    p => normalizeArabicText(p).startsWith(normalized) && !suggestions.includes(p)
  );

  const finalSuggestions = [...new Set([...suggestions.slice(0, limit), ...popular.slice(0, Math.max(0, limit - suggestions.length))])];

  // ============ 6. حفظ في الكاش ============
  await cacheAutocomplete(normalized, finalSuggestions);

  return {
    suggestions: finalSuggestions.slice(0, limit),
    popular: POPULAR_SEARCHES.slice(0, Math.max(0, limit - finalSuggestions.length)),
    corrected,
    hasErrors: !prefixMatches.length && corrected !== null,
  };
}

// ==================== اقتراحات متقدمة مع السياق ====================
export async function generateContextualSuggestions(
  query: string,
  userHistory: string[] = []
): Promise<string[]> {
  const suggestions = new Map<string, number>();

  // 1. الاقتراحات العادية
  const basic = await generateAutocomplete(query, 20);
  basic.suggestions.forEach((s, i) => {
    suggestions.set(s, (suggestions.get(s) || 0) + (20 - i));
  });

  // 2. الأولويات من سجل المستخدم
  userHistory.forEach((h, i) => {
    if (normalizeArabicText(h).includes(normalizeArabicText(query))) {
      suggestions.set(h, (suggestions.get(h) || 0) + (userHistory.length - i) * 5);
    }
  });

  // 3. الكلمات الشعبية
  POPULAR_SEARCHES.forEach((p, i) => {
    if (normalizeArabicText(p).startsWith(normalizeArabicText(query))) {
      suggestions.set(p, (suggestions.get(p) || 0) + (POPULAR_SEARCHES.length - i));
    }
  });

  // ترتيب حسب الوزن
  return Array.from(suggestions.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([suggestion]) => suggestion)
    .slice(0, 15);
}

export default generateAutocomplete;
