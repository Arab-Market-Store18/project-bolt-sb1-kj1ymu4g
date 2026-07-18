"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { POPULAR_SEARCHES } from '@/lib/arabic-search-utils';

const RECENT_SEARCHES_KEY = 'arab_store_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentSearches().filter(s => s !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {}
}

export function SearchBar() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // تحميل البحثات الأخيرة عند فتح الـ dropdown
  const handleFocus = () => {
    setRecentSearches(getRecentSearches());
    setShowDropdown(true);
  };

  // جلب الاقتراحات من API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounce الاقتراحات: 250ms فقط (لا نتصل بالسيرفر في كل حرف)
  const handleChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  // إغلاق الـ dropdown عند النقر خارجه
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current  && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchTerm);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    executeSearch(suggestion);
  };

  const clearInput = () => {
    setSearchTerm('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // ما يظهر في الـ dropdown
  const dropdownItems = searchTerm.length >= 1
    ? suggestions
    : recentSearches.length > 0
      ? recentSearches
      : POPULAR_SEARCHES.slice(0, 6);

  const dropdownLabel = searchTerm.length >= 1
    ? null
    : recentSearches.length > 0
      ? 'عمليات البحث الأخيرة'
      : 'الأكثر بحثاً';

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="ابحث عن منتجات..."
            className="w-full pr-10 pl-10 py-2 h-10 rounded-md border"
            value={searchTerm}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowDropdown(false);
            }}
            aria-label="حقل البحث"
            autoComplete="off"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="مسح البحث"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="h-10 shrink-0">بحث</Button>
      </form>

      {/* Dropdown الاقتراحات */}
      {showDropdown && dropdownItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label="اقتراحات البحث"
        >
          {dropdownLabel && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">
              {recentSearches.length > 0
                ? <Clock className="w-3 h-3" />
                : <TrendingUp className="w-3 h-3" />
              }
              {dropdownLabel}
            </div>
          )}

          {isLoadingSuggestions ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">جارٍ البحث...</div>
          ) : (
            dropdownItems.map((item, index) => (
              <button
                key={index}
                type="button"
                role="option"
                className="w-full text-right px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                onClick={() => handleSuggestionClick(item)}
                onMouseDown={(e) => e.preventDefault()} // منع blur قبل click
              >
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{item}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
