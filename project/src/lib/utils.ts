// المسار: lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- دوال الذاكرة المؤقتة (ذاكرة الـ 24 ساعة) ---

const LIKES_CACHE_KEY = 'user_likes_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعة

interface CachedLike {
  productId: string;
  timestamp: number;
}

// وظيفة لقراءة كل الإعجابات المخزنة مؤقتاً
function getCachedLikes(): CachedLike[] {
  if (typeof window === 'undefined') return [];
  const cached = localStorage.getItem(LIKES_CACHE_KEY);
  if (!cached) return [];
  
  const likes: CachedLike[] = JSON.parse(cached);
  // فلترة الإعجابات التي انتهت صلاحيتها
  const now = Date.now();
  return likes.filter(like => (now - like.timestamp) < CACHE_DURATION);
}

// وظيفة للتحقق مما إذا كان منتج معين معجب به في الذاكرة المؤقتة
export function isLikeCached(productId: string): boolean {
  const cachedLikes = getCachedLikes();
  return cachedLikes.some(like => like.productId === productId);
}

// وظيفة لإضافة إعجاب إلى الذاكرة المؤقتة
export function cacheLike(productId: string): void {
  const cachedLikes = getCachedLikes();
  // التأكد من عدم وجود المنتج قبل إضافته
  if (!cachedLikes.some(like => like.productId === productId)) {
    cachedLikes.push({ productId, timestamp: Date.now() });
    localStorage.setItem(LIKES_CACHE_KEY, JSON.stringify(cachedLikes));
  }
}

// وظيفة لإزالة إعجاب من الذاكرة المؤقتة
export function uncacheLike(productId: string): void {
  const cachedLikes = getCachedLikes();
  const updatedLikes = cachedLikes.filter(like => like.productId !== productId);
  localStorage.setItem(LIKES_CACHE_KEY, JSON.stringify(updatedLikes));
}
