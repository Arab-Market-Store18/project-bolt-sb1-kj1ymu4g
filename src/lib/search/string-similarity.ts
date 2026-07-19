/**
 * دوال قياس التشابه والمسافة بين النصوص
 * تستخدم خوارزميات متطورة لقياس قرب الكلمات عن بعضها
 */

/**
 * حساب مسافة Levenshtein (عدد العمليات اللازمة لتحويل نص إلى آخر)
 * مفيدة جداً لتصحيح الأخطاء الإملائية
 */
export function calculateLevenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // إنشاء مصفوفة dp
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // ملء الحالات الأساسية
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  // ملء الجدول
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // حذف
          dp[i][j - 1],     // إدراج
          dp[i - 1][j - 1]  // استبدال
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * حساب نسبة التشابه بين نصين (0 إلى 1)
 * حيث 1 = متطابقة تماماً، 0 = لا توجد تشابهات
 */
export function calculateSimilarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = calculateLevenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

/**
 * فحص ما إذا كانت كلمة تحتوي على نفس الأحرف (Anagram Check)
 */
export function isAnagram(word1: string, word2: string): boolean {
  const sort = (str: string) => str.split('').sort().join('');
  return sort(word1) === sort(word2);
}

/**
 * حساب تشابه Jaccard (تقاطع / اتحاد)
 * مفيد لقياس التشابه بين مجموعات الكلمات
 */
export function calculateJaccardSimilarity(words1: string[], words2: string[]): number {
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set(
    [...set1].filter(x => set2.has(x))
  );
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * حساب تطابق N-gram (تسلسلات من N حرف)
 * مفيد لقياس التشابه بين البحث والعنوان
 */
export function calculateNGramSimilarity(text1: string, text2: string, n = 2): number {
  const getNGrams = (text: string) => {
    const grams = new Set<string>();
    const normalized = text.toLowerCase();
    for (let i = 0; i <= normalized.length - n; i++) {
      grams.add(normalized.substring(i, i + n));
    }
    return grams;
  };

  const grams1 = getNGrams(text1);
  const grams2 = getNGrams(text2);

  const intersection = new Set([...grams1].filter(x => grams2.has(x)));
  const union = new Set([...grams1, ...grams2]);

  if (union.size === 0) return text1 === text2 ? 1 : 0;
  return intersection.size / union.size;
}

/**
 * حساب درجة تطابق مزدوج (Combined Score)
 * تجمع عدة معايير لقياس أفضل للتشابه
 */
export function calculateCombinedScore(
  query: string,
  candidate: string,
  weights = { levenshtein: 0.3, jaccard: 0.4, nGram: 0.3 }
): number {
  const queryWords = query.split(' ');
  const candidateWords = candidate.split(' ');

  const levenshteinScore = calculateSimilarityScore(query, candidate);
  const jaccardScore = calculateJaccardSimilarity(queryWords, candidateWords);
  const nGramScore = calculateNGramSimilarity(query, candidate);

  return (
    levenshteinScore * weights.levenshtein +
    jaccardScore * weights.jaccard +
    nGramScore * weights.nGram
  );
}

/**
 * ترتيب النتائج حسب درجة التشابه
 */
export function rankBySimilarity(
  query: string,
  candidates: string[]
): Array<{ text: string; score: number }> {
  return candidates
    .map(candidate => ({
      text: candidate,
      score: calculateCombinedScore(query, candidate),
    }))
    .sort((a, b) => b.score - a.score);
}

export default {
  calculateLevenshteinDistance,
  calculateSimilarityScore,
  isAnagram,
  calculateJaccardSimilarity,
  calculateNGramSimilarity,
  calculateCombinedScore,
  rankBySimilarity,
};
