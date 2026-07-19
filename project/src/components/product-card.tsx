// المسار: components/product-card.tsx
// -- النسخة المصححة: تم إصلاح زر التعديل للتمييز بين المنتجات والخدمات --

"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Product, Category, Service } from '@/lib/types';
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal";
import { useAuth } from "@/context/AuthContext";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { useQueryClient } from '@tanstack/react-query';
import { cacheLike, uncacheLike, isLikeCached } from '@/lib/utils';
import { ProductCardUI } from './ProductCardUI';
import { useInteractionStore } from '@/lib/use-interaction-store';
import { getOptimizedMediaUrl } from "@/lib/utils/cloudinary";

const isService = (item: Product | Service): item is Service => {
  return (item as any).product_type === 'SERVICE';
};
interface ProductCardProps {
  item: Product | Service;
  allCategories?: Category[];
  context?: 'store' | 'dashboard' | 'seller-profile';
  onEdit?: () => void;  // ✅ بدون معامل
  onShare?: (e: React.MouseEvent) => void;
  highlightedItemId?: string | null;
  searchQuery?: string;
  isPriority?: boolean;
}

const currencyDictionary: { [key: string]: string } = { 
  YER: "ريال يمني", 
  SAR: "ريال سعودي", 
  AED: "درهم إماراتي", 
  QAR: "ريال قطري", 
  KWD: "دينار كويتي", 
  BHD: "دينار بحريني", 
  OMR: "ريال عماني", 
  EGP: "جنيه مصري", 
  JOD: "دينار أردني", 
  SDG: "جنيه سوداني", 
  LYD: "دينار ليبي", 
  TND: "دينار تونسي", 
  DZD: "دينار جزائري", 
  MAD: "درهم مغربي", 
  USD: "دولار أمريكي", 
};

const getCurrencyInArabic = (currencyCode: string) => currencyDictionary[currencyCode] || currencyCode;

const sortCategoriesByRelevance = (categories: { main: string | null; sub: string | null }, searchQuery?: string) => {
  if (!searchQuery) return [categories.main, categories.sub].filter(Boolean);
  
  const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
  const categoriesWithScores = [ 
    { name: categories.main, score: 0 }, 
    { name: categories.sub, score: 0 } 
  ].filter(item => item.name);
  
  categoriesWithScores.forEach(category => {
    if (!category.name) return;
    const categoryName = category.name.toLowerCase();
    searchTerms.forEach(term => {
      if (categoryName === term) category.score += 10;
      else if (categoryName.includes(term)) category.score += 5;
      else if (term.includes(categoryName)) category.score += 3;
    });
  });
  
  return categoriesWithScores
    .sort((a, b) => b.score - a.score)
    .map(item => item.name)
    .filter(Boolean);
};

export const ProductCard = React.memo(function ProductCard({
  item: initialItem,
  allCategories,
  context = 'store',
  onEdit,
  onShare,
  highlightedItemId,
  searchQuery,
  isPriority,
  // ▼▼▼ الإضافة الجديدة ▼▼▼
  viewMode: initialViewMode = 'grid', // 'grid' أو 'list'
}: ProductCardProps & {
  // ▼▼▼ الإضافة الجديدة ▼▼▼
  viewMode?: 'grid' | 'list';
}) {
  const { onOpen } = useModal();
  const router = useRouter();
  const { isLoggedIn, user: authUser, isLoading: isAuthLoading } = useAuth();
  
  // ✅ **الكود الصحيح: استخدم useSupabaseBrowser() فقط** ✅
  const [supabase, setSupabase] = useState<any>(null);
const [isSupabaseReady, setIsSupabaseReady] = useState(false);

useEffect(() => {
  const client = createSupabaseBrowserClient();
  setSupabase(client);
  setIsSupabaseReady(true);
}, []);

  const queryClient = useQueryClient();
  const { incrementLiked, decrementLiked } = useInteractionStore();
  const viewMode = initialViewMode || 'grid';
  const cardStyle = viewMode === 'grid' 
    ? { 
        '--card-width': '220px', 
        '--card-height': '420px', 
        width: 'var(--card-width)', 
        height: 'var(--card-height)' 
      } 
    : { 
        '--card-width': '100%', 
        '--card-height': 'auto', 
        width: 'var(--card-width)', 
        height: 'var(--card-height)' 
      };
  const [isLiked, setIsLiked] = useState(false);
const [likesCount, setLikesCount] = useState(initialItem?.likes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCurrentImageLoaded, setIsCurrentImageLoaded] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    setIsLiked(isLikeCached(initialItem.id));
  }, [initialItem.id]);

  const { mainCategoryName, subCategoryName, sortedCategories } = useMemo(() => {
    const item = initialItem as any;
    let mainCatName = item.main_category?.name;
    let subCatName = item.subcategory;
    
    if (!subCatName) subCatName = item.category?.name || item.categories?.name || item.sub_category?.name;
    if (!mainCatName) mainCatName = item.main_categories?.name;
    
    if (!subCatName && allCategories && item.category_id) {
      const foundCategory = allCategories.find(c => c.id === item.category_id);
      subCatName = foundCategory?.name;
    }
    
    if (!mainCatName && allCategories && item.main_category_id) {
      const foundCategory = allCategories.find(c => c.id === item.main_category_id);
      mainCatName = foundCategory?.name;
    }
    
    if (!subCatName) subCatName = item.suggested_category_name;
    
    const categories = { main: mainCatName || null, sub: subCatName || null };
    const sortedCats = sortCategoriesByRelevance(categories, searchQuery);
    
    return { 
      mainCategoryName: mainCatName || null, 
      subCategoryName: subCatName || null, 
      sortedCategories: sortedCats 
    };
  }, [initialItem, allCategories, searchQuery]);

  const itemDataForUI = useMemo(() => {
    const p = initialItem as any;
    // ✅ دعم كلا النوعين
const ownerData = 
Array.isArray(p.sellers) ? p.sellers[0] : 
p.sellers || 
p.service_providers || 
p.seller;
    const formatLargeNumber = (price: number) => {
      if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} مليار`;
      if (price >= 1_000_000) return `${(price / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} مليون`;
      return price.toLocaleString('en-US');
    };
    
    const getPriceDetails = () => {
      const basePrice = p.price;
      const discountPrice = p.discount_price;
      const currencyText = getCurrencyInArabic(p.currency);
      
      if (basePrice === null || typeof basePrice === 'undefined') {
        return { currentPrice: 'عند الطلب', oldPrice: null, discountPercentage: null };
      }
      
      const isValidDiscount = typeof discountPrice === 'number' && discountPrice > 0 && discountPrice < basePrice;
      
      if (isValidDiscount) {
        const percentage = Math.round(((basePrice - discountPrice) / basePrice) * 100);
        return { 
          currentPrice: `${formatLargeNumber(discountPrice)} ${currencyText}`, 
          oldPrice: `${formatLargeNumber(basePrice)} ${currencyText}`, 
          discountPercentage: percentage 
        };
      }
      
      const priceText = basePrice === 0 ? `0 ${currencyText}` : `${formatLargeNumber(basePrice)} ${currencyText}`;
      return { currentPrice: priceText, oldPrice: null, discountPercentage: null };
    };
    
    const priceDetails = getPriceDetails();
    
    const getValidImages = () => {
      const imagesData = p.images;
      let rawUrls: string[] = [];
      
      if (Array.isArray(imagesData) && imagesData.length > 0) {
        rawUrls = imagesData.filter(Boolean);
      } else if (typeof imagesData === 'string') {
        try {
          const parsed = JSON.parse(imagesData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawUrls = parsed.filter(Boolean);
          }
        } catch (e) {
          rawUrls = imagesData.split(',').map((url: string) => url.trim()).filter(Boolean);
        }
      }
      
      if (rawUrls.length === 0) return ["/placeholder.svg"];
      return rawUrls.map(url => getOptimizedMediaUrl(url, 'image'));
    };
    
    const validImages = getValidImages();
    
    return { 
      id: p.id, 
      name: p.name, 
      images: validImages, 
      priceDetails: priceDetails, 
      owner: ownerData ? { 
        id: ownerData.id, 
        businessName: ownerData.business_name, 
        logoUrl: getOptimizedMediaUrl(ownerData.logo_url, 'image'),
        followersCount: ownerData.followers_count, 
      } : undefined 
    };
  }, [initialItem]);

  useEffect(() => {
    const preloadImportantImages = async () => {
      if (itemDataForUI.images.length === 0) return;
      
      const importantIndices = [ 
        currentImageIndex, 
        (currentImageIndex + 1) % itemDataForUI.images.length 
      ];
      
      const imagesToPreload = importantIndices
        .map(index => itemDataForUI.images[index])
        .filter(url => url && url !== "/placeholder.svg" && !preloadedImages.has(url));
      
      if (imagesToPreload.length === 0) return;
      
      const preloadPromises = imagesToPreload.map((url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = () => { 
            setPreloadedImages(prev => new Set([...prev, url])); 
            resolve(url); 
          };
          img.onerror = () => resolve(null);
        });
      });
      
      await Promise.all(preloadPromises);
    };
    
    preloadImportantImages();
  }, [currentImageIndex, itemDataForUI.images, preloadedImages]);

  useEffect(() => {
    if (itemDataForUI.images.length <= 1) return;
    
    let timeoutId: NodeJS.Timeout;
    const startTimer = () => {
      if (isCurrentImageLoaded) {
        timeoutId = setTimeout(() => {
          setIsCurrentImageLoaded(false);
          setCurrentImageIndex(prev => prev === 0 ? 1 : 0);
        }, 3000);
      }
    };
    
    startTimer();
    return () => { 
      if (timeoutId) clearTimeout(timeoutId); 
    };
  }, [itemDataForUI.images.length, isCurrentImageLoaded, currentImageIndex]);
  
  useEffect(() => {
    const handleStorageClear = () => setIsLiked(false);
    window.addEventListener('storageCleared', handleStorageClear);
    return () => window.removeEventListener('storageCleared', handleStorageClear);
  }, []);
  useEffect(() => {
  const fetchLikeStatus = async () => {
    if (!supabase) return;
    
    if (!authUser) {
      setIsLiked(isLikeCached(initialItem.id));
      return;
    }
    
    // ✅ تحقق من حالة الإعجاب من قاعدة البيانات
    const { data } = await supabase
      .from('product_likes')
      .select('id')
      .eq('product_id', initialItem.id)
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    setIsLiked(!!data || isLikeCached(initialItem.id));
  };
  
  fetchLikeStatus();
}, [initialItem.id, supabase, authUser]); // ✅ استخدام authUser بدل session
const handleLikeClick = useCallback(async (e: React.MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();
  
  console.log('🎯 النقر على زر الإعجاب');
  
  // ⭐ تحديث الواجهة أولاً فوراً
  const newLikedState = !isLiked;
  console.log('⚡ تحديث الواجهة فوراً');
  
  setIsLiked(newLikedState);
  setLikesCount(prev => {
    const newCount = newLikedState ? prev + 1 : Math.max(0, prev - 1);
    console.log('⚡ setLikesCount:', { من: prev, إلى: newCount });
    return newCount;
  });
  
  // التحقق من Supabase
  if (!supabase) {
    console.log('⚠️ Supabase غير جاهز');
    return;
  }

  // انتظار انتهاء تحميل الجلسة
  if (isAuthLoading) return;
  
  // تحقق من تسجيل الدخول — يكفي أي حساب (مشتري، تاجر، مزود خدمة)
  if (!isLoggedIn || !authUser) {
    console.log('👤 غير مسجل');
    onOpen('emailSignUp');
    return;
  }
    if (newLikedState) incrementLiked(); 
    else decrementLiked();
    
    setIsLiking(true);
    
    if (newLikedState) cacheLike(initialItem.id); 
    else uncacheLike(initialItem.id);
    
    try {
      const likeTable = 'product_likes';
      const likeColumn = 'product_id';
      
      if (newLikedState) {
        await supabase.from(likeTable).insert({ 
          [likeColumn]: initialItem.id, 
          user_id: authUser.id 
        });
        
        if (itemDataForUI.owner?.id && itemDataForUI.owner.id !== authUser.id) {
          const { data: likerProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', authUser.id)
            .single();

          const { data: likerSeller } = await supabase
            .from('sellers')
            .select('logo_url')
            .eq('id', authUser.id)
            .maybeSingle();

          const { data: likerProvider } = await supabase
            .from('service_providers')
            .select('logo_url')
            .eq('user_id', authUser.id)
            .maybeSingle();

          const senderLogoUrl = likerSeller?.logo_url
            || likerProvider?.logo_url
            || likerProfile?.avatar_url
            || null;

          const likerName = likerProfile?.full_name || 'أحدهم';
          const itemType = isService(initialItem) ? 'بخدمتك' : 'بمنتجك';
          
          await supabase.from('notifications').insert({ 
            user_id: itemDataForUI.owner.id,
            message: `أُعجب ${likerName} ${itemType}: "${itemDataForUI.name}"`,
            type: 'new_like', 
            link: `/products/${initialItem.id}`,
            sender_logo_url: senderLogoUrl,
          });
        }
      } else {
        await supabase
          .from(likeTable)
          .delete()
          .eq(likeColumn, initialItem.id)
          .eq('user_id', authUser.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ['products_feed'] });
    } catch (error) {
      console.error("❌ فشل مزامنة الإعجاب:", error);
      setIsLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? Math.max(0, prev - 1) : prev + 1);
      
      if (newLikedState) uncacheLike(initialItem.id); 
      else cacheLike(initialItem.id);
    } finally {
      setIsLiking(false);
    }
  }, [supabase, isLiking, isLiked, isLoggedIn, authUser, initialItem, itemDataForUI, queryClient, onOpen, incrementLiked, decrementLiked]);
  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // هذا السطر جيد، اتركه كما هو
    
    // التحقق إذا كان العنصر خدمة
    if (isService(initialItem)) {
      //  ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
      // السلوك الجديد: قم بالتوجيه إلى صفحة الخدمة المستقلة
      router.push(`/services/${initialItem.id}`);
      //  ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    } else {
      // هذا الجزء صحيح بالفعل، اتركه كما هو
// --- ⬇️⬇️⬇️ هذا هو السطر الذي يجب أن تضعه مكانه ⬇️⬇️⬇️ ---
const href = isService(initialItem) ? `/services/${initialItem.id}` : `/products/${initialItem.id}`;
router.push(href);
// --- ⬆️⬆️⬆️ هذا هو السطر الذي يجب أن تضعه مكانه ⬆️⬆️⬆️ ---
    }
  }, [initialItem, router]); // يمكنك الآن إزالة onOpen من مصفوفة الاعتماديات
  


 

const handleProfileClick = useCallback((e: React.MouseEvent) => {
  e.stopPropagation();
  
  // 🔥 تحديث: للخدمات فقط
  if (isService(initialItem)) {

    console.log('🔍 بيانات الخدمة للرابط:', {
      item: initialItem,
      service_provider_id: (initialItem as any).service_provider_id,
      seller_id: (initialItem as any).seller_id,
      ownerId: itemDataForUI.owner?.id,
      isService: true
    });
    // 🔥 للخدمات: استخدم service_provider_id مباشرة
// 🔥 للخدمات: استخدم service_provider_id أو ownerId أو أي معرف متاح
const providerId = 
  (initialItem as any).service_provider_id || 
  (initialItem as any).provider_id ||
  (initialItem as any).service_providers?.id ||
  itemDataForUI.owner?.id;

console.log('🔍 بيانات الخدمة للملاحة:', {
  item: initialItem,
  service_provider_id: (initialItem as any).service_provider_id,
  provider_id: (initialItem as any).provider_id,
  service_providers_id: (initialItem as any).service_providers?.id,
  ownerId: itemDataForUI.owner?.id,
  finalProviderId: providerId,
  isService: isService(initialItem)
});

if (!providerId) {
  console.error("❌ Navigation blocked: Service provider ID is missing for service");
  return;
}

router.push(`/provider/${providerId}`);
  } else {
    // 🔥 للمنتجات: يبقى كما هو (لا تمسه)
    // ✅ دعم كلا النوعين
    const ownerId = 
      itemDataForUI.owner?.id || 
      (initialItem as any).seller_id;
    
    if (!ownerId) {
      console.error("Navigation blocked: Owner ID is missing.");
      return;
    }
    
    // ✅ يفتح صفحة التاجر (seller)
    router.push(`/seller/${ownerId}`);
  }
}, [itemDataForUI.owner, initialItem, router]);
  const handleImageIndicatorClick = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
      // ⭐ التحقق الجديد:
  if (index >= 2) {
    handleDetailsClick(e);
    return;
  }
    if (index === currentImageIndex) return;
    
    setIsCurrentImageLoaded(false);
    setCurrentImageIndex(index);
    
    const nextIndex = (index + 1) % itemDataForUI.images.length;
    const nextImageUrl = itemDataForUI.images[nextIndex];
    
    if (nextImageUrl && nextImageUrl !== "/placeholder.svg" && !preloadedImages.has(nextImageUrl)) {
      const img = new Image();
      img.src = nextImageUrl;
      img.onload = () => { 
        setPreloadedImages(prev => new Set([...prev, nextImageUrl])); 
      };
    }
  }, [currentImageIndex, itemDataForUI.images, preloadedImages]);

// ✅✅ الكود الجديد الذي يجب أن تضعه مكانها ✅✅
const handleCardClick = useCallback((e: React.MouseEvent) => {
  // المنطق الصحيح للتوجيه بناءً على نوع العنصر
  const href = isService(initialItem) 
    ? `/services/${initialItem.id}` 
    : `/products/${initialItem.id}`;
    
  router.push(href);

}, [router, initialItem]);

  // ✅ دالة التعديل المصححة
  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // إذا كان هناك onEdit ممرر من المكون الأب، استخدمه
    if (onEdit) {
      onEdit();
      return;
    }
    
    // التمييز بين المنتج والخدمة
    if (isService(initialItem)) {
      onOpen('editService', {
        service: initialItem,
        allCategories,
        onServiceUpdated: (updatedService) => {
          console.log('تم تحديث الخدمة:', updatedService);
        }
      });
    } else {
      onOpen('editProduct', {
        product: initialItem,
        allCategories,
        onProductUpdated: (updatedProduct) => {
          console.log('تم تحديث المنتج:', updatedProduct);
        }
      });
    }
  }, [onEdit, initialItem, onOpen, allCategories]);

  // ✅ دالة المشاركة المصححة
  const handleShareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // إذا كان هناك onShare ممرر من المكون الأب، استخدمه
    if (onShare) {
      onShare(e);
      return;
    }
    
    // المشاركة الافتراضية
    onOpen('shareModal', {
      title: isService(initialItem) ? 'مشاركة خدمة' : 'مشاركة منتج',
      text: `شاهد ${isService(initialItem) ? 'هذه الخدمة' : 'هذا المنتج'}: ${itemDataForUI.name}`,
      url: `${window.location.origin}/products/${initialItem.id}`,
      image: itemDataForUI.images[0]
    });
  }, [initialItem.id, itemDataForUI.name, itemDataForUI.images, isService, onOpen, onShare]);

  return (
    <ProductCardUI
    viewMode={viewMode} // ▼▼▼ الإضافة هنا ▼▼▼
      mainCategoryName={mainCategoryName}
      subCategoryName={subCategoryName}
      sortedCategories={sortedCategories}
      productId={itemDataForUI.id}
      productName={itemDataForUI.name}
      sellerName={itemDataForUI.owner?.businessName}
      sellerLogoUrl={itemDataForUI.owner?.logoUrl}
      sellerId={itemDataForUI.owner?.id}
      followersCount={itemDataForUI.owner?.followersCount}
      likesCount={likesCount}
      priceDetails={itemDataForUI.priceDetails}
      images={itemDataForUI.images}
      isLiked={isLiked}
      isLiking={isLiking}
      currentImageIndex={currentImageIndex}
      highlighted={highlightedItemId === initialItem.id}
      onLikeClick={handleLikeClick}
      onDetailsClick={handleDetailsClick}
      onSellerProfileClick={handleProfileClick}
      onFollowersClick={handleProfileClick}
      onImageIndicatorClick={handleImageIndicatorClick}
      onImageLoad={() => setIsCurrentImageLoaded(true)}
      isPriority={isPriority}
      onCardClick={handleCardClick}
      // ✅ إضافة Props الجديدة
      onEditClick={context === 'dashboard' ? handleEditClick : undefined}
      onShareClick={context === 'dashboard' ? (onShare || handleShareClick) : undefined}
      context={context}
    />
  );
});