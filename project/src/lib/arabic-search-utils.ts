/**
 * أدوات معالجة النصوص العربية لنظام البحث المتطور
 * تشمل: تطبيع النص، توسيع المرادفات، تصحيح الأخطاء الشائعة
 */

// ========== تطبيع النص العربي ==========
export function normalizeArabicText(text: string): string {
  if (!text) return '';

  return text
    .trim()
    // توحيد الهمزات: أ إ آ → ا
    .replace(/[أإآ]/g, 'ا')
    // توحيد الياء: ي ى → ي
    .replace(/ى/g, 'ي')
    // توحيد التاء المربوطة
    .replace(/ة/g, 'ه')
    // إزالة التشكيل (الحركات)
    .replace(/[\u064B-\u065F]/g, '')
    // إزالة التطويل
    .replace(/ـ/g, '')
    // إزالة المسافات الزائدة
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ========== قاموس المرادفات العربية ==========
const ARABIC_SYNONYMS: Record<string, string[]> = {
  // الهواتف
  'هاتف':     ['جوال', 'موبايل', 'نقال', 'تليفون', 'phone', 'mobile'],
  'جوال':     ['هاتف', 'موبايل', 'نقال', 'تليفون', 'phone', 'mobile'],
  'موبايل':   ['هاتف', 'جوال', 'نقال', 'تليفون', 'phone', 'mobile'],
  'ايفون':    ['iphone', 'apple', 'ابل'],
  'سامسونج':  ['samsung', 'galaxy', 'جالاكسي'],

  // الحاسوب
  'لابتوب':   ['حاسوب محمول', 'laptop', 'نوتبوك', 'كمبيوتر محمول'],
  'كمبيوتر':  ['حاسوب', 'computer', 'pc', 'جهاز'],
  'تابلت':    ['لوحي', 'ipad', 'ايباد', 'tablet'],

  // الملابس
  'ملابس':    ['ازياء', 'ثياب', 'لبس', 'ملبوسات', 'fashion'],
  'حذاء':     ['جزمه', 'حذاء', 'كوتش', 'shoes', 'sneakers'],

  // الإلكترونيات
  'شاشة':     ['تلفزيون', 'monitor', 'tv', 'تلفاز', 'شاشه'],
  'سماعة':    ['earphone', 'headphone', 'airpods', 'سماعات', 'سماعه'],
  'شاحن':     ['charger', 'باور بنك', 'powerbank', 'كابل', 'شاحنه'],

  // الكلمات الإنجليزية الشائعة
  'phone':    ['هاتف', 'جوال', 'موبايل'],
  'laptop':   ['لابتوب', 'حاسوب محمول'],
  'samsung':  ['سامسونج', 'galaxy', 'جالاكسي'],
  'apple':    ['ايفون', 'iphone', 'ابل'],

  // البحث بالنية
  'ارخص':     ['أرخص', 'اقل سعر', 'رخيص', 'اقتصادي', 'عروض'],
  'افضل':     ['أفضل', 'الاحسن', 'top', 'premium'],
  'جديد':     ['جديده', 'حديث', 'اصدار جديد', 'new'],
};

// ========== الكلمات الشائعة في البحث العربي ==========
export const POPULAR_SEARCHES = [
  'هواتف', 'لابتوب', 'سماعات', 'شاشة', 'كاميرا',
  'ملابس', 'حذاء', 'ساعة ذكية', 'شاحن', 'تابلت',
  'ايفون', 'سامسونج', 'عطر', 'حقيبة', 'إلكترونيات',
];

// ========== توسيع مصطلح البحث بالمرادفات ==========
export function expandQueryWithSynonyms(query: string): string[] {
  const normalized = normalizeArabicText(query);
  const terms = new Set<string>([query, normalized]);

  // البحث في قاموس المرادفات
  for (const [key, synonyms] of Object.entries(ARABIC_SYNONYMS)) {
    const normalizedKey = normalizeArabicText(key);
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      synonyms.forEach(s => terms.add(s));
      terms.add(key);
    }
  }

  return Array.from(terms).filter(t => t.length > 0);
}

// ========== تصحيح الأخطاء الإملائية الشائعة ==========
const COMMON_TYPOS: Record<string, string> = {
  'موبيل':    'موبايل',
  'تابليت':   'تابلت',
  'لاب توب':  'لابتوب',
  'سمسونج':   'سامسونج',
  'ايفن':     'ايفون',
  'كميرا':    'كاميرا',
  'سماعه':    'سماعة',
  'شاشه':     'شاشة',
  'حقيبه':    'حقيبة',
  'ساعه':     'ساعة',
};

export function correctTypos(query: string): string {
  let corrected = query;
  for (const [typo, correct] of Object.entries(COMMON_TYPOS)) {
    corrected = corrected.replace(new RegExp(typo, 'gi'), correct);
  }
  return corrected;
}

// ========== تقسيم الكلمات الملتصقة ==========
export function splitCompoundWords(query: string): string {
  // تقسيم مثل "شاحنسياره" → "شاحن سياره"
  // بسيط: إضافة مسافة قبل الكلمات المعروفة إذا كانت ملتصقة
  const knownPrefixes = ['شاحن', 'حامل', 'غطاء', 'كيس', 'حقيبة'];
  let result = query;
  for (const prefix of knownPrefixes) {
    const regex = new RegExp(`(${prefix})(?=[^\s])`, 'g');
    result = result.replace(regex, '$1 ');
  }
  return result.trim();
}

// ========== تحليل نية المستخدم ==========
export type SearchIntent = 'price_low' | 'price_high' | 'newest' | 'best' | 'general';

export function detectSearchIntent(query: string): SearchIntent {
  const lower = query.toLowerCase();
  if (/أرخص|ارخص|رخيص|اقل سعر|اقتصادي/.test(lower)) return 'price_low';
  if (/أغلى|اغلى|فاخر|premium|high end/.test(lower)) return 'price_high';
  if (/جديد|اخر اصدار|حديث|new|latest/.test(lower)) return 'newest';
  if (/أفضل|افضل|الاحسن|top|best/.test(lower)) return 'best';
  return 'general';
}

// ========== مرشح سرعة الشبكة ==========
export function getNetworkMode(): 'fast' | 'slow' | 'offline' {
  if (typeof navigator === 'undefined') return 'fast';
  
  // @ts-ignore - Network Information API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return 'fast';
  
  const effectiveType = connection.effectiveType;
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
  if (!navigator.onLine) return 'offline';
  return 'fast';
}
