'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { getNetworkMode } from '@/lib/arabic-search-utils';
import { useRouter } from 'next/navigation';

interface Suggestion {
  text: string;
  type: 'suggestion' | 'popular' | 'corrected';
}

export function AdvancedSearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [networkMode, setNetworkMode] = useState<'fast' | 'slow' | 'offline'>('fast');
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const router = useRouter();

  // ============ اكتشاف سرعة الشبكة ============
  useEffect(() => {
    const mode = getNetworkMode();
    setNetworkMode(mode);

    // إعادة الفحص كل 5 ثواني
    const interval = setInterval(() => {
      setNetworkMode(getNetworkMode());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ============ جلب الاقتراحات مع التأخير (Debounce) ============
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 1) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=10`,
        { signal: AbortSignal.timeout(5000) } // مهلة 5 ثواني
      );

      if (!response.ok) throw new Error('فشل في جلب الاقتراحات');

      const data = await response.json();

      // تجميع الاقتراحات
      const combined: Suggestion[] = [];

      // إذا كانت هناك تصحيحات
      if (data.corrected && data.corrected !== searchQuery) {
        combined.push({
          text: data.corrected,
          type: 'corrected',
        });
      }

      // الاقتراحات الرئيسية
      data.suggestions.forEach((suggestion: string) => {
        combined.push({
          text: suggestion,
          type: 'suggestion',
        });
      });

      // البحث الشعبي
      data.popular.slice(0, 3).forEach((item: string) => {
        combined.push({
          text: item,
          type: 'popular',
        });
      });

      setSuggestions(combined);
    } catch (err) {
      console.error('[Search] خطأ:', err);
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============ معالج تغيير البحث مع Debounce ============
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);

    // إلغاء الطلب السابق
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // في الشبكات البطيئة، انتظر أكثر قبل الطلب
    const delay = networkMode === 'slow' ? 800 : 300;

    debounceTimer.current = setTimeout(() => {
      if (value.length >= 1) {
        setIsOpen(true);
        fetchSuggestions(value);
      }
    }, delay);
  }, [networkMode, fetchSuggestions]);

  // ============ معالج اختيار اقتراح ============
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  }, [router]);

  // ============ معالج البحث ===========
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }, [query, router]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* شريط البحث الرئيسي */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center gap-2">
          <Search className="absolute right-4 w-5 h-5 text-gray-400" aria-hidden="true" />
          
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => query.length > 0 && setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder="ابحث عن منتجات..."
            className="w-full pr-10 pl-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="شريط البحث الرئيسي"
            autoComplete="off"
          />

          {isLoading && (
            <Loader2 className="absolute left-4 w-5 h-5 text-blue-500 animate-spin" />
          )}
        </div>

        {/* مؤشر سرعة الشبكة */}
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              networkMode === 'fast'
                ? 'bg-green-500'
                : networkMode === 'slow'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            aria-label={`حالة الشبكة: ${networkMode}`}
          />
          <span className="text-gray-500">
            {networkMode === 'fast'
              ? 'شبكة سريعة'
              : networkMode === 'slow'
              ? 'شبكة بطيئة - عرض محسّن'
              : 'بلا اتصال'}
          </span>
        </div>
      </form>

      {/* قائمة الاقتراحات */}
      {isOpen && (suggestions.length > 0 || error) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {error && (
            <div className="p-4 flex items-center gap-2 text-red-600 bg-red-50 border-b">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion.text)}
              className={`w-full px-4 py-3 text-right border-b hover:bg-gray-50 flex items-center justify-between transition ${
                suggestion.type === 'corrected'
                  ? 'bg-blue-50 border-blue-200'
                  : suggestion.type === 'popular'
                  ? 'bg-gray-50'
                  : ''
              }`}
              aria-label={`اختر: ${suggestion.text}`}
            >
              <span className="flex-1">{suggestion.text}</span>
              {suggestion.type === 'corrected' && (
                <span className="text-xs text-blue-600 ml-2">تصحيح</span>
              )}
              {suggestion.type === 'popular' && (
                <span className="text-xs text-gray-500 ml-2">شهير</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdvancedSearchBar;
