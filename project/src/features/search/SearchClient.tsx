"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Filter, Grid, List, Star, Heart, ShoppingCart,
  Truck, Shield, TrendingUp, Eye, X, RefreshCw, ChevronLeft,
  Wifi, WifiOff, ArrowUpDown, Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type Product } from "@/lib/types";
import { getNetworkMode, POPULAR_SEARCHES } from "@/lib/arabic-search-utils";

// ===== أنواع =====
export interface Facets {
  breadcrumbs: any[];
  mainCategories: any[];
  subCategories: any[];
}

interface SearchResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  facets: Facets | null;
  query: string;
  executionTime?: string;
  lightMode?: boolean;
}

interface SearchClientProps {
  initialProducts: Product[];
  initialTotal: number;
  initialPage: number;
  initialError: string | null;
}

// ===== ثوابت =====
const SORT_OPTIONS = [
  { value: "best_match",  label: "الأكثر تطابقاً", icon: "🎯" },
  { value: "newest",      label: "الأحدث",          icon: "🆕" },
  { value: "price_low",   label: "السعر: الأقل",    icon: "💰" },
  { value: "price_high",  label: "السعر: الأعلى",   icon: "💎" },
  { value: "top_rated",   label: "الأعلى تقييماً",  icon: "⭐" },
] as const;

// ===== مكون Skeleton =====
const ProductSkeleton = ({ mode }: { mode: "grid" | "list" }) =>
  mode === "list" ? (
    <div className="bg-white border rounded-xl p-4 animate-pulse flex gap-4">
      <div className="w-32 h-32 bg-gray-200 rounded-lg shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  ) : (
    <div className="bg-white border rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );

// ===== بطاقة منتج =====
const ProductCard = ({ product, mode }: { product: Product; mode: "grid" | "list" }) => {
  const imageUrl = useMemo(() => {
    if (!product.images) return "/placeholder.svg";
    if (typeof product.images === "string") return product.images;
    if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      return typeof first === "string" ? first : first?.url || first?.src || "/placeholder.svg";
    }
    return "/placeholder.svg";
  }, [product.images]);

  if (mode === "list") {
    return (
      <Link href={`/products/${product.id}`} className="block">
        <div className="bg-white border rounded-xl p-4 flex gap-4 hover:border-blue-400 hover:shadow-md transition-all group">
          <div className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform"
              sizes="128px"
              onError={(e: any) => { e.target.src = "/placeholder.svg"; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">
                {product.price?.toLocaleString("ar-SA")} {product.currency || "ر.س"}
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm text-gray-600">{product.likes_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="bg-white border rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all group">
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={(e: any) => { e.target.src = "/placeholder.svg"; }}
          />
          {product.likes_count && product.likes_count > 10 && (
            <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-1.5 py-0.5">
              🔥 رائج
            </Badge>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600 text-sm">
              {product.price?.toLocaleString("ar-SA")} {product.currency || "ر.س"}
            </span>
            <div className="flex items-center gap-0.5 text-amber-400">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs text-gray-500">{product.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ===== فلتر مخصص =====
const PriceRangeFilter = ({
  min, max, value, onChange,
}: {
  min: number; max: number; value: [number, number];
  onChange: (v: [number, number]) => void;
}) => (
  <div className="space-y-3">
    <div className="flex gap-2">
      <input
        type="number" min={min} max={value[1]} value={value[0]}
        onChange={(e) => onChange([Number(e.target.value), value[1]])}
        className="w-full border rounded-md px-2 py-1.5 text-sm text-center"
        placeholder="من"
      />
      <span className="self-center text-gray-400">—</span>
      <input
        type="number" min={value[0]} max={max} value={value[1]}
        onChange={(e) => onChange([value[0], Number(e.target.value)])}
        className="w-full border rounded-md px-2 py-1.5 text-sm text-center"
        placeholder="إلى"
      />
    </div>
    <p className="text-xs text-center text-gray-400">
      {value[0].toLocaleString()} — {value[1].toLocaleString()} ر.س
    </p>
  </div>
);

// ===== الاقتراحات عند لا توجد نتائج =====
const NoResults = ({ query, onSearch }: { query: string; onSearch: (q: string) => void }) => (
  <div className="text-center py-16 bg-white rounded-xl border">
    <div className="text-5xl mb-4">🔍</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      لا توجد نتائج لـ "{query}"
    </h3>
    <p className="text-gray-500 mb-6 text-sm">جرّب كلمات مختلفة أو اختر من الاقتراحات:</p>
    <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto mb-6">
      {POPULAR_SEARCHES.slice(0, 6).map((s) => (
        <button
          key={s}
          onClick={() => onSearch(s)}
          className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
        >
          {s}
        </button>
      ))}
    </div>
    <Link href="/">
      <Button variant="outline">العودة للرئيسية</Button>
    </Link>
  </div>
);

// ===== المكون الرئيسي =====
export default function SearchClient({
  initialProducts, initialTotal, initialPage, initialError,
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode]         = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters]   = useState(false);
  const [selectedSort, setSelectedSort] = useState("best_match");
  const [priceRange, setPriceRange]     = useState<[number, number]>([0, 10000]);
  const [networkMode, setNetworkMode]   = useState<"fast" | "slow" | "offline">("fast");

  const currentQuery = searchParams.get("q") || "";

  // كشف سرعة الشبكة
  useEffect(() => {
    setNetworkMode(getNetworkMode());
  }, []);

  // Client-side sort (لا يحتاج إعادة اتصال بالسيرفر)
  const buildQueryString = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => params.set(k, v));
    if (networkMode === "slow") params.set("light", "1");
    return params.toString();
  }, [searchParams, networkMode]);

  const { data, isFetching } = useQuery<SearchResponse>({
    queryKey: ["search", searchParams.toString()],
    queryFn: () => fetch(`/api/search?${searchParams.toString()}`).then(r => r.json()),
    initialData: {
      products: initialProducts,
      total: initialTotal,
      page: initialPage,
      pageSize: networkMode === "slow" ? 5 : 20,
      totalPages: Math.ceil(initialTotal / 20),
      hasNextPage: false,
      hasPreviousPage: false,
      facets: null,
      query: currentQuery,
    },
    staleTime: 2 * 60 * 1000,
    gcTime:    5 * 60 * 1000,
  });

  // ترتيب على جهاز العميل (بدون اتصال)
  const displayProducts = useMemo(() => {
    const products = data?.products || [];
    switch (selectedSort) {
      case "price_low":  return [...products].sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price_high": return [...products].sort((a, b) => (b.price || 0) - (a.price || 0));
      case "top_rated":  return [...products].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      case "newest":
        return [...products].sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      default: return products;
    }
  }, [data?.products, selectedSort]);

  const navigateTo = (q: string) => router.push(`/search?q=${encodeURIComponent(q)}`);

  const applyPriceFilter = () => {
    router.push(`/search?${buildQueryString({
      min_price: priceRange[0].toString(),
      max_price: priceRange[1].toString(),
      page: "1",
    })}`);
  };

  if (initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">😞</div>
          <h3 className="text-lg font-semibold mb-2">حدث خطأ في البحث</h3>
          <p className="text-sm text-gray-600 mb-6">{initialError}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 ml-2" />حاول مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* شريط الحالة: وضع الشبكة الضعيفة */}
      {networkMode === "slow" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
          <Wifi className="w-4 h-4" />
          <span>تم تفعيل وضع الشبكة الخفيفة — نتائج مُخفَّفة لتوفير الباقة</span>
        </div>
      )}
      {networkMode === "offline" && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-sm text-red-800">
          <WifiOff className="w-4 h-4" />
          <span>لا يوجد اتصال — تعرض النتائج المحفوظة مسبقاً</span>
        </div>
      )}

      {/* شريط علوي */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 shrink-0">
            <ChevronLeft className="w-4 h-4" />
            الرئيسية
          </Link>

          {currentQuery && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">نتائج:</span>
              <span className="font-semibold text-gray-900">"{currentQuery}"</span>
              <Badge variant="secondary">{data?.total || 0} منتج</Badge>
              {isFetching && (
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              )}
            </div>
          )}

          {data?.executionTime && (
            <span className="text-xs text-gray-400 hidden md:inline">
              ⚡ {data.executionTime}
            </span>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {/* ترتيب */}
            <div className="flex items-center gap-1 border rounded-lg px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="text-sm bg-transparent outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                ))}
              </select>
            </div>

            {/* عرض */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* فلاتر (موبايل) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 border rounded-lg px-2 py-1.5 text-sm md:hidden"
            >
              <Filter className="w-4 h-4" />
              فلاتر
            </button>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* الشريط الجانبي */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-64 shrink-0`}>
            <div className="bg-white rounded-xl border p-4 sticky top-20 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">الفلاتر</h3>
                <button
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    router.push(`/search?q=${encodeURIComponent(currentQuery)}`);
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  مسح الكل
                </button>
              </div>

              {/* فلتر السعر */}
              <div>
                <h4 className="font-semibold text-sm mb-3">نطاق السعر (ر.س)</h4>
                <PriceRangeFilter
                  min={0} max={10000}
                  value={priceRange}
                  onChange={setPriceRange}
                />
                <Button
                  size="sm"
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                  onClick={applyPriceFilter}
                  disabled={isFetching}
                >
                  تطبيق الفلتر
                </Button>
              </div>

              {/* بحثات شائعة */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  بحثات شائعة
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.slice(0, 10).map(s => (
                    <button
                      key={s}
                      onClick={() => navigateTo(s)}
                      className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* النتائج */}
          <main className="flex-1 min-w-0">
            {isFetching && !displayProducts.length ? (
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "space-y-3"
              }>
                {Array.from({ length: networkMode === "slow" ? 5 : 12 }).map((_, i) => (
                  <ProductSkeleton key={i} mode={viewMode} />
                ))}
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                {/* شبكة المنتجات */}
                <div className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                    : "space-y-3"
                }>
                  {displayProducts.map(product => (
                    <ProductCard key={product.id} product={product} mode={viewMode} />
                  ))}
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      disabled={!data.hasPreviousPage || isFetching}
                      onClick={() => router.push(`/search?${buildQueryString({ page: String(data.page - 1) })}`)}
                      className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      السابق
                    </button>
                    <span className="text-sm text-gray-600 px-3">
                      صفحة {data.page} من {data.totalPages}
                    </span>
                    <button
                      disabled={!data.hasNextPage || isFetching}
                      onClick={() => router.push(`/search?${buildQueryString({ page: String(data.page + 1) })}`)}
                      className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            ) : (
              <NoResults query={currentQuery} onSearch={navigateTo} />
            )}
          </main>
        </div>
      </div>

      {/* فوتر ضمانات */}
      <div className="bg-white border-t mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Truck className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50", title: "شحن مجاني", sub: "لطلبات فوق 200 ر.س" },
              { icon: <Shield className="w-5 h-5 text-green-600" />, bg: "bg-green-50", title: "ضمان الجودة", sub: "ضمان 30 يوم للإرجاع" },
              { icon: <TrendingUp className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50", title: "أفضل الأسعار", sub: "نضمن أفضل سعر" },
              { icon: <Eye className="w-5 h-5 text-orange-600" />, bg: "bg-orange-50", title: "دعم 24/7", sub: "خدمة عملاء دائمة" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  {item.icon}
                </div>
                <h4 className="font-semibold text-sm mb-0.5">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
