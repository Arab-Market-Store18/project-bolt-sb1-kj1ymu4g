// المسار: HomePageUI.tsx (النسخة الكاملة والنهائية بأسلوب الإضافة فقط)

"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client"; 
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { type Product, type Category } from '@/lib/types';
import { useProductViewStore } from '@/store/useProductViewStore';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';

// --- استيراد المكونات ---
import { Navbar } from "@/components/navbar";
import { PromoBanner } from "@/components/Banner/PromoBanner";
import { ProductSection } from "@/components/product-section";
import { TopButtons } from "@/components/top-buttons";
import { Footer } from "@/components/footer";
import { AccessibilityPanel } from "@/components/accessibility-panel";
import { BottomNavigation } from "@/components/bottom-navigation";
import { SearchAndCountries } from "@/components/SearchAndCountries";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Package, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';

const ProductCarousel = dynamic(() => import('@/components/ProductCarousel').then(mod => mod.ProductCarousel), { ssr: false, loading: () => <div className="h-[380px] w-full animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg" /> });
const PRODUCTS_PER_PAGE = 12;  // تقليل من 30 لتسريع التحميل

// --- دوال الجلب للمنتجات (محسّنة) ---
const createFetchFunction = (orderOption: string, categoryId?: number) => {
  return async ({ pageParam = 0 }) => {
    const supabase = createSupabaseBrowserClient();
    const offset = pageParam * PRODUCTS_PER_PAGE;
    // استعلام محسّن: جلب أقل عدد من الأعمدة الضرورية
    const selectQuery = `
      id, name, price, currency, images, likes_count,
      main_category:main_category_id(name), 
      sub_category:category_id(name), 
      sellers ( id, business_name, logo_url, city )
    `;
    let query = supabase.from('products').select(selectQuery);
    if (categoryId) { query = query.eq('category_id', categoryId); }
    query = query.eq('is_active', true).eq('is_approved', true);
    if (orderOption === 'created_at_desc') { query = query.order('created_at', { ascending: false }); }
    else if (orderOption === 'created_at_asc') { query = query.order('created_at', { ascending: true }); }
    else if (orderOption === 'likes_count_desc') { query = query.order('likes_count', { ascending: false }); }
    query = query.range(offset, offset + PRODUCTS_PER_PAGE - 1);
    const { data, error } = await query;
    if (error) { throw error; }
    const formattedData = data.map(p => {
      const sellerData = p.sellers as any; 
      return { 
        ...p, 
        seller: { 
          id: sellerData?.id, 
          businessName: sellerData?.business_name, 
          logoUrl: sellerData?.logo_url, 
          followersCount: 0,
          city: sellerData?.city, 
          whatsapp: null
        }
      };
    });
    return formattedData;
  };
};

// --- دالة جلب الخدمات (محسّنة) ---
const createServicesFetchFunction = () => {
  return async ({ pageParam = 0 }) => {
    const supabase = createSupabaseBrowserClient();
    const offset = pageParam * PRODUCTS_PER_PAGE;
    
    const { data, error } = await supabase
      .from('services')
      .select(`
        id, name, price, currency, images, likes_count,
        service_providers (id, business_name, logo_url, city),
        main_category:main_category_id (name),
        category:category_id (name)
      `)
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + PRODUCTS_PER_PAGE - 1);
    
    if (error) { 
      throw error; 
    }
    
    const formattedData = data.map(service => {
      const provider = service.service_providers as any;
      return {
        ...service,
        product_type: 'SERVICE',
        main_category: service.main_category,
        sub_category: service.category,
        seller: {
          id: provider?.id,
          businessName: provider?.business_name || 'مزود خدمة',
          logoUrl: provider?.logo_url,
          followersCount: 0,
          city: provider?.city,
          whatsapp: null
        }
      };
    });
    
    return formattedData;
  };
};

// --- دالة جلب الفئات (لم تتغير) ---
const fetchAllCategories = async (): Promise<Category[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from('categories').select('id, name, icon_name, parent_id').order('name');
  if (error) { throw new Error('فشل جلب الفئات.'); }
  return data as Category[];
};

const fetchMostInteracted = createFetchFunction('likes_count_desc');
const fetchSpecialOffers = createFetchFunction('created_at_asc');
const fetchNewArrivals = createFetchFunction('created_at_desc');
const fetchServicesFromTable = createServicesFetchFunction();

interface HomePageUIProps {
  initialMostInteracted: Product[];
  initialSpecialOffers: Product[];
  initialNewArrivals: Product[];
  initialServices: Product[];
  allCategories: Category[];
}

export default function HomePageUI({
  initialMostInteracted,
  initialSpecialOffers,
  initialNewArrivals,
  initialServices,
  allCategories: initialAllCategories
}: HomePageUIProps) {
    const searchParams = useSearchParams();
    const productRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
    const { selectedProductId, closeModal, openModal } = useProductViewStore();
    const queryClient = useQueryClient();
    const productsQueryKey = ['products_feed'];
    
    // --- استعلام المستخدم (محسّن) ---
    const { data: userData } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const supabase = createSupabaseBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) return null;
            const [profileRes, sellerRes] = await Promise.all([
              supabase.from('profiles').select('id, full_name').eq('id', user.id).single(),
              supabase.from('sellers').select('id, provider_type').eq('id', user.id).single()
            ]);
            if (sellerRes.data) {
                const providerType = sellerRes.data.provider_type;
                const isServiceProvider = Array.isArray(providerType) 
                    ? providerType.includes("SERVICE_PROVIDER")
                    : (typeof providerType === 'string' && providerType.includes("SERVICE_PROVIDER"));
                if (isServiceProvider) {
                    return { user, buyer: null, seller: null, serviceProvider: sellerRes.data };
                } else {
                    return { user, buyer: null, seller: sellerRes.data, serviceProvider: null };
                }
            }
            const buyerData = profileRes.data || { id: user.id, full_name: 'مستخدم جديد' };
            return { user, buyer: buyerData, seller: null, serviceProvider: null };
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
    
    // --- استعلامات البيانات (لم تتغير) ---
    const mostInteractedQuery = useInfiniteQuery({ 
      queryKey: [...productsQueryKey, 'mostInteracted'], 
      queryFn: fetchMostInteracted, 
      getNextPageParam: (lastPage, allPages) => lastPage.length === PRODUCTS_PER_PAGE ? allPages.length : undefined, 
      initialPageParam: 0, 
      initialData: { pages: [initialMostInteracted], pageParams: [0] }, 
    });
    const specialOffersQuery = useInfiniteQuery({ 
      queryKey: [...productsQueryKey, 'specialOffers'], 
      queryFn: fetchSpecialOffers, 
      getNextPageParam: (lastPage, allPages) => lastPage.length === PRODUCTS_PER_PAGE ? allPages.length : undefined, 
      initialPageParam: 0, 
      initialData: { pages: [initialSpecialOffers], pageParams: [0] }, 
    });
    const newArrivalsQuery = useInfiniteQuery({ 
      queryKey: [...productsQueryKey, 'newArrivals'], 
      queryFn: fetchNewArrivals, 
      getNextPageParam: (lastPage, allPages) => lastPage.length === PRODUCTS_PER_PAGE ? allPages.length : undefined, 
      initialPageParam: 0, 
      initialData: { pages: [initialNewArrivals], pageParams: [0] }, 
    });
    const servicesQuery = useInfiniteQuery({ 
      queryKey: [...productsQueryKey, 'services'], 
      queryFn: fetchServicesFromTable, 
      getNextPageParam: (lastPage, allPages) => lastPage.length === PRODUCTS_PER_PAGE ? allPages.length : undefined, 
      initialPageParam: 0, 
      initialData: { pages: [initialServices], pageParams: [0] }, 
    });
    const { data: allCategoriesData } = useQuery({ 
      queryKey: ['allCategories'], 
      queryFn: fetchAllCategories, 
      staleTime: 1000 * 60 * 60, 
      initialData: initialAllCategories, 
    });
    
    // --- منطق التحديث و useEffects (لم تتغير) ---
    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([ 
          mostInteractedQuery.refetch(), 
          specialOffersQuery.refetch(), 
          newArrivalsQuery.refetch(), 
          servicesQuery.refetch(), 
          queryClient.refetchQueries({ queryKey: ['allCategories'] }), 
          queryClient.refetchQueries({ queryKey: ['currentUser'] }) 
        ]);
        setIsRefreshing(false);
    };
    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN" || event === "SIGNED_OUT") { 
                queryClient.invalidateQueries({ queryKey: productsQueryKey });
                queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            }
        });
        return () => { authListener.subscription.unsubscribe(); };
    }, [queryClient]);
    useEffect(() => {
        const highlightId = searchParams.get('highlight');
        if (!highlightId) return;
        const targetElement = productRefs.current.get(highlightId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedProductId(highlightId);
            const openModalTimeout = setTimeout(() => { openModal(highlightId); }, 800);
            const cleanupTimeout = setTimeout(() => {
                setHighlightedProductId(null);
                const newUrl = window.location.pathname;
                window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
            }, 3000);
            return () => { clearTimeout(openModalTimeout); clearTimeout(cleanupTimeout); };
        }
    }, [searchParams, openModal]);
    
    const mostInteractedProducts = mostInteractedQuery.data?.pages.flatMap(page => page) ?? [];
    const specialOffersProducts = specialOffersQuery.data?.pages.flatMap(page => page) ?? [];
    const newArrivalsProducts = newArrivalsQuery.data?.pages.flatMap(page => page) ?? [];
    const servicesProducts = servicesQuery.data?.pages.flatMap(page => page) ?? [];
    const noProductsAtAll = [mostInteractedProducts, specialOffersProducts, newArrivalsProducts, servicesProducts].every(p => p.length === 0);

    // TopButtons يقرأ حالة المصادقة مباشرة من useAuth() بداخله
    
    return (
      <>
        <main className="min-h-screen bg-background pb-20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex justify-between items-center">
              <TopButtons />

              <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} aria-label="تحديث المنتجات" title="تحديث المنتجات">
                <RotateCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <PromoBanner /> 
          <Link href="/search" className="cursor-pointer" aria-label="الانتقال إلى صفحة البحث">
            <div className="pointer-events-none">
              <SearchAndCountries />
            </div>
          </Link>
          <FeaturesSection />
          <ProductCarousel 
            title="الأكثر تفاعلًا 🔥" 
            products={mostInteractedProducts} 
            allCategories={allCategoriesData || []} 
            renderProduct={(product, index) => (
              <ProductCard
                key={product.id}
                item={product}
                allCategories={allCategoriesData || []}
                isPriority={index < 5}
              />
            )}
          />
          <div className="mt-8 space-y-12">  
            <ProductSection 
              title="العروض الخاصة" 
              emoji="💎" 
              products={specialOffersProducts} 
              allCategories={allCategoriesData || []} 
              fetchNextPage={specialOffersQuery.fetchNextPage} 
              hasNextPage={!!specialOffersQuery.hasNextPage} 
              isFetchingNextPage={specialOffersQuery.isFetchingNextPage} 
              productRefs={productRefs} 
              highlightedProductId={highlightedProductId}
              renderProduct={(product, index) => (
                <ProductCard
                  key={product.id}
                  item={product}
                  allCategories={allCategoriesData || []}
                  isPriority={index < 5}
                />
              )}
            />
            <ProductSection 
              title="وصل حديثًا" 
              emoji="🆕" 
              products={newArrivalsProducts} 
              allCategories={allCategoriesData || []} 
              fetchNextPage={newArrivalsQuery.fetchNextPage} 
              hasNextPage={!!newArrivalsQuery.hasNextPage} 
              isFetchingNextPage={newArrivalsQuery.isFetchingNextPage} 
              productRefs={productRefs} 
              highlightedProductId={highlightedProductId}
              renderProduct={(product, index) => (
                <ProductCard
                  key={product.id}
                  item={product}
                  allCategories={allCategoriesData || []}
                  isPriority={index < 5}
                />
              )}
            />
            <ProductSection 
              title="الخدمات" 
              emoji="🛠️" 
              products={servicesProducts} 
              allCategories={allCategoriesData || []} 
              fetchNextPage={servicesQuery.fetchNextPage} 
              hasNextPage={!!servicesQuery.hasNextPage} 
              isFetchingNextPage={servicesQuery.isFetchingNextPage} 
              productRefs={productRefs} 
              highlightedProductId={highlightedProductId}
              renderProduct={(product, index) => (
                <ProductCard
                  key={product.id}
                  item={product}
                  allCategories={allCategoriesData || []}
                  isPriority={index < 5}
                />
              )}
            />
            {noProductsAtAll && ( 
              <div className="text-center py-16">
                <Package className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-xl font-medium">لا توجد منتجات لعرضها حالياً</h3>
              </div> 
            )}
          </div>
          <Footer />
          <BottomNavigation />
          <AccessibilityPanel />
        </main>
      </>
    );
  }
