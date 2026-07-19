//  features/merchant/management/components/MerchantDashboard.tsx

"use client";
import { LikedProductsDropdown } from "@/components/modals/LikedProductsDropdown";
import { FollowedSellersDropdown } from "@/components/modals/FollowedSellersDropdown";
import { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Package, Plus, Settings, Edit, LogOut, Save, X, Camera, Phone, Upload, Store, Globe, Trash2, Loader2, ShoppingCart, TrendingUp, ArrowLeft, Users, Heart, Star, Bell, MessageSquare, Send, Image as ImageIcon, MapPin, Pin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import type { Product, Category } from "@/lib/types";
import { CategoryPickerModal } from "@/components/category-picker-modal";
import { useModal } from "@/hooks/use-modal";
import { OwnerChatInbox } from "@/components/dashboard/owner-chat-inbox";

// ============ ⭐ استيرادات تحسين الأداء ============
import dynamic from 'next/dynamic';
import imageCompression from 'browser-image-compression';
import { CldImage } from 'next-cloudinary';

// ============ ⭐ تحميل ديناميكي للمكونات ============
const ProductCard = dynamic(() => import('@/components/product-card').then(mod => mod.ProductCard), {
  loading: () => (
    <div className="animate-pulse">
      <div className="w-full h-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg mb-3"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
  ),
  ssr: false
});

// ============ ⭐ Custom Hooks للتحسين ============
const useMediaOptimization = () => {
  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.8,
      };
      
      const compressedFile = await imageCompression(file, options);
      const savedPercentage = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
      
      console.log(`✅ تم ضغط الصورة: ${savedPercentage}% وفر في المساحة`);
      return compressedFile;
    } catch (error) {
      console.warn('⚠️ فشل ضغط الصورة، استخدام الأصل');
      return file;
    }
  };
  
  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        message: `حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)}MB). الحد الأقصى 10MB`
      };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: 'نوع الملف غير مدعوم. الرجاء استخدام JPEG, PNG, WebP, أو AVIF'
      };
    }
    
    return { valid: true };
  };
  
  return { compressImage, validateFile };
};

// ============ ⭐ مكونات مساعدة محسنة ============
const ProductsLoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <Card key={index} className="animate-pulse border-0 shadow-md">
        <CardContent className="p-4">
          <div className="w-full h-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg mb-3 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const OptimizedAvatar = ({ 
  src, 
  alt, 
  className = "",
  size = 96 
}: { 
  src?: string; 
  alt: string; 
  className?: string;
  size?: number;
}) => {
  if (src && src.startsWith('http')) {
    return (
      <div className={`relative overflow-hidden rounded-full border-2 border-white/50 ${className}`}>
        <CldImage
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="rounded-full object-cover w-full h-full"
          quality={70}
          format="auto"
          sizes={`${size}px`}
          loading="lazy"
        />
      </div>
    );
  }
  
  return (
    <div className={`rounded-full border-2 border-white/50 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ${className}`}>
      <span className={`font-bold text-white ${size > 64 ? 'text-2xl' : 'text-lg'}`}>
        {alt?.charAt(0)?.toUpperCase() || 'ت'}
      </span>
    </div>
  );
};
const OptimizedCoverImage = ({ src, alt }: { src: string; alt: string }) => {
  if (src && src.startsWith('http')) {
    return (
      <CldImage
        src={src}
        alt={alt}
        width={1920}
        height={480}
        className="w-full h-full object-cover"
        quality={75}
        format="auto"
        sizes="100vw"
        priority
      />
    );
  }
  
  return (
    <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/10"></div>
  );
};

// ============ ⭐ واجهات البيانات ============
interface PhoneNumber { id: string; type: 'whatsapp' | 'mobile' | 'landline'; number: string; }
interface SellerData { 
  id: string; 
  business_name: string; 
  email: string; 
  logo_url?: string; 
  description?: string; 
  category_id?: any; 
  country?: string; 
  city?: string; 
  store_type?: 'online' | 'physical'; 
  physical_address?: string; 
  store_image_url?: string; 
  phone_numbers?: any[]; 
  followers_count?: number; 
  total_likes_count?: number; 
  rating?: number; 
}
interface ProductReview { 
  id: string; 
  created_at: string; 
  user_name: string; 
  rating: number | null; 
  comment: string; 
  user_avatar_url?: string; 
  product_id: string; 
  products: { name: string } | null; 
  parent_review_id: string | null; 
}
interface SellerReview { 
  id: string; 
  created_at: string; 
  rating: number; 
  comment: string; 
  profiles: { full_name: string; avatar_url: string; } | null; 
}
interface UnifiedReview { 
  id: string; 
  type: 'product' | 'seller'; 
  created_at: string; 
  userName: string; 
  userAvatarUrl?: string | null; 
  rating: number | null; 
  comment: string; 
  productName?: string | null; 
  rawProductReview?: ProductReview; 
}

interface Notification { 
  id: string; 
  user_id: string; // ⬅️ إض��فة
  created_at: string; 
  type: string; // ⬅️ تغيير من محدد إلى عام
  message: string; // ⬅️ تغيير من text إلى message
  is_read: boolean;
  link?: string | null; // ⬅️ إضافة إذا كان موجوداً
}
interface SellerDashboardProps { 
  sellerData: SellerData; 
  allCategories: Category[]; 
}

const countryDictionary: { [key: string]: string } = { 
  YE: "اليمن", 
  SA: "المملكة العربية السعودية", 
  AE: "الإمارات العربية المتحدة", 
  QA: "قطر", 
  KW: "الكويت", 
  BH: "البحرين", 
  OM: "عُمان", 
  EG: "مصر", 
  JO: "الأردن", 
  SD: "السودان", 
  LY: "ليبيا", 
  TN: "تونس", 
  DZ: "الجزائر", 
  MA: "المغرب", 
};

const getCountryInArabic = (countryCode: string = "") => 
  countryDictionary[countryCode.toUpperCase()] || countryCode;

const getCategoryId = (categoryValue: any): string | null => {
  if (!categoryValue) return null;
  if (Array.isArray(categoryValue) && categoryValue.length > 0) {
    const id = String(categoryValue[0]);
    return !isNaN(parseInt(id, 10)) ? id : null;
  }
  if (typeof categoryValue === 'string') {
    const extractedNumber = categoryValue.replace(/\D/g, '');
    return extractedNumber || null;
  }
  if (typeof categoryValue === 'number') return String(categoryValue);
  return null;
};

// مكون بطاقة الإحصائيات
const StatCard = ({ 
  title, 
  value, 
  children 
}: { 
  title: string; 
  value: string | number; 
  children: React.ReactNode; 
}) => (
  <div className="flex-1 p-3 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-primary/10 shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:scale-[1.02]">
    {children}
    <div>
      <p className="text-xs text-muted-foreground font-medium">{title}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);

export function MerchantDashboard({ sellerData: initialSellerData, allCategories }: SellerDashboardProps) {
  // ============ ⭐ الاستعدادات الأولية ============
  const queryClient = useQueryClient();
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'products';
  
  const { onOpen, onClose } = useModal();
  const { compressImage, validateFile } = useMediaOptimization();
  
  // ============ ⭐ الحالات الأساسية ============
  const [activeTab, setActiveTab] = useState(initialTab);
  const [allProductReviews, setAllProductReviews] = useState<ProductReview[]>([]);
  const [isLoadingProductReviews, setIsLoadingProductReviews] = useState(false);
  const [sellerReviews, setSellerReviews] = useState<SellerReview[]>([]);
  const [isLoadingSellerReviews, setIsLoadingSellerReviews] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editableSellerData, setEditableSellerData] = useState<SellerData>(initialSellerData);
  const [originalSellerData, setOriginalSellerData] = useState<SellerData>(initialSellerData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSellerData?.logo_url || null);
  const [storeImagePreview, setStoreImagePreview] = useState<string | null>(initialSellerData?.store_image_url || null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  // أضف مع باقي الـ states (بعد السطر 180):
const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
const [isFollowingOpen, setIsFollowingOpen] = useState(false);
const playNotificationSound = useCallback(() => {
  const audio = new Audio('/notification.mp3');
  audio.play().catch(e => console.log('Error playing sound:', e));
}, []);
  const [isCategoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [imageOptimization, setImageOptimization] = useState({
    isCompressing: false,
    progress: 0,
    currentFile: ''
  });

  // ============ ⭐ تحسينات الأداء ============
  useEffect(() => {
    // Prefetch للصفحات المتوقعة
    router.prefetch('/');
    router.prefetch('/products');
  }, [router]);

  // ============ ⭐ useQuery محسن ============
  const { 
    data: products = [], 
    isLoading: isLoadingProducts,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['seller-products', initialSellerData.id],
    queryFn: async () => {
      console.time('⏱️ جلب المنتجات');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', initialSellerData.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      console.timeEnd('⏱️ جلب المنتجات');
      return data || [];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // ============ ⭐ الدوال المساعدة ============
 
  const getCategoryNameById = useCallback((categoryId: any): string => {
    if (!categoryId) return "غير محدد";
    
    
    // تحويل إلى string للمقارنة
    const idStr = String(categoryId);
    
    // البحث في allCategories
    const category = allCategories?.find(c => String(c.id) === idStr);
    
    if (category) {
      return category.name;
    }
    
    console.log('❌ لم نعثر على الفئة', idStr, 'في القائمة');
    return "غير محدد";
  }, [allCategories]);
  const setProducts = useCallback((newProducts: Product[]) => {
    queryClient.setQueryData(['seller-products', initialSellerData.id], newProducts);
  }, [initialSellerData.id, queryClient]);

  // ============ ⭐ معالجة الإشعارات ============
  const fetchInitialNotifications = useCallback(async (sellerId: string) => {
    const { error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sellerId) // ⬅️ التصحيح
      .eq('is_read', false);
    
    if (!error && count !== null) setUnreadNotificationsCount(count);
  }, [supabase]);
  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifs(true);
    const { data, error } = await supabase
  .from('notifications')
  .select('*') // ⬅️ اختيار جميع الحقول
  .eq('user_id', initialSellerData.id) // ⬅️ التصحيح
  .order('created_at', { ascending: false })
  .limit(20);
    if (error) {
      toast({ title: "خطأ في جلب الإشعارات", variant: "destructive" });
    } else {
      setNotifications(data as Notification[]);
    }
    setIsLoadingNotifs(false);
  }, [initialSellerData.id, supabase, toast]);

  const markNotificationsAsRead = useCallback(async () => {
    if (unreadNotificationsCount === 0) return;
    setUnreadNotificationsCount(0);
    await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', initialSellerData.id) // ⬅️ التصحيح
      .eq('is_read', false);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [initialSellerData.id, supabase, unreadNotificationsCount]);

  const getNotificationIcon = useCallback((type: Notification['type']) => {
    const icons = {
      'new_review': <Star className="w-4 h-4 text-yellow-500" />,
      'new_seller_review': <Store className="w-4 h-4 text-yellow-500" />,
      'new_follower': <Users className="w-4 h-4 text-blue-500" />,
      'new_message': <MessageSquare className="w-4 h-4 text-green-500" />,
      'new_like': <Heart className="w-4 h-4 text-red-500" />
    };
    return icons[type] || <Bell className="w-4 h-4 text-gray-500" />;
  }, []);

  // ============ ⭐ معالجة المراجعات ============
  const fetchProductReviews = useCallback(async () => {
    setIsLoadingProductReviews(true);
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`id, created_at, rating, comment, user_name, user_avatar_url, product_id, parent_review_id, products!inner(name, seller_id)`)
        .eq("products.seller_id", initialSellerData.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setAllProductReviews(data as ProductReview[]);
    } catch (error: any) {
      toast({ 
        title: "خطأ", 
        description: `فشل في جلب تقييمات المنتجات: ${error.message}`, 
        variant: "destructive" 
      });
      setAllProductReviews([]);
    } finally {
      setIsLoadingProductReviews(false);
    }
  }, [initialSellerData.id, supabase, toast]);

  const fetchSellerReviews = useCallback(async () => {
    setIsLoadingSellerReviews(true);
    try {
      const { data, error } = await supabase
        .from('seller_reviews')
        .select(`id, created_at, rating, comment, profiles!inner(full_name, avatar_url)`)
        .eq('seller_id', initialSellerData.id)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      setSellerReviews(data as SellerReview[]);
    } catch (error: any) {
      toast({ 
        title: "خطأ", 
        description: `فشل في جلب تقييمات المتجر: ${error.message}`, 
        variant: "destructive" 
      });
      setSellerReviews([]);
    } finally {
      setIsLoadingSellerReviews(false);
    }
  }, [initialSellerData.id, supabase, toast]);

  // ============ ⭐ useMemo للبيانات المحسوبة ============
  const unifiedReviews = useMemo(() => {
    const formattedProductReviews = allProductReviews
      .filter(r => r.parent_review_id === null)
      .map(r => ({
        id: r.id,
        type: 'product' as const,
        created_at: r.created_at,
        userName: r.user_name,
        userAvatarUrl: r.user_avatar_url,
        rating: r.rating,
        comment: r.comment,
        productName: r.products?.name,
        rawProductReview: r,
      }));

    const formattedSellerReviews = sellerReviews.map(r => ({
      id: r.id,
      type: 'seller' as const,
      created_at: r.created_at,
      userName: r.profiles?.full_name || 'مستخدم',
      userAvatarUrl: r.profiles?.avatar_url,
      rating: r.rating,
      comment: r.comment,
    }));

    return [...formattedProductReviews, ...formattedSellerReviews]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allProductReviews, sellerReviews]);

  const productRepliesMap = useMemo(() => {
    return allProductReviews
      .filter(r => r.parent_review_id !== null)
      .reduce((acc, reply) => {
        const parentId = reply.parent_review_id!;
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(reply);
        return acc;
      }, {} as Record<string, ProductReview[]>);
  }, [allProductReviews]);

  const coverImageUrl = useMemo(() => 
    storeImagePreview || originalSellerData.store_image_url || '/placeholder-cover.jpg', 
    [storeImagePreview, originalSellerData.store_image_url]
  );

  const sellerMainCategoryId = useMemo(() => 
    getCategoryId(originalSellerData.category_id), 
    [originalSellerData.category_id]
  );

  const sellerMainCategoryName = useMemo(() => 
    getCategoryNameById(sellerMainCategoryId), 
    [sellerMainCategoryId, getCategoryNameById]
  );

  // ============ ⭐ useEffect الرئيسية ============
  useEffect(() => {
    fetchInitialNotifications(initialSellerData.id);
    
    if (activeTab === 'reviews') {
      fetchProductReviews();
      fetchSellerReviews();
    }
  }, [activeTab, initialSellerData.id, fetchInitialNotifications, fetchProductReviews, fetchSellerReviews]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-dashboard-notifications:${initialSellerData.id}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
filter: `user_id=eq.${initialSellerData.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadNotificationsCount(prev => prev + 1);
          toast({ 
            title: "لديك إشعار جديد!", 
            description: newNotification.message,
          });
          playNotificationSound();

        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialSellerData.id, supabase, toast, fetchInitialNotifications]);

  useEffect(() => {
    setOriginalSellerData(initialSellerData);
    setEditableSellerData(initialSellerData);
    
    const fetchSellerStats = async () => {
      if (!initialSellerData.id) return;
      
      const { data } = await supabase
        .from('sellers')
        .select('followers_count, total_likes_count, rating')
        .eq('id', initialSellerData.id)
        .single();
      
      if (data) {
        setOriginalSellerData(prevData => ({ ...prevData, ...data }));
        setEditableSellerData(prevData => ({ ...prevData, ...data }));
      }
    };
    
    fetchSellerStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialSellerData.id, supabase]);

  // ============ ⭐ معالجات الصور المحسنة ============
  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({ title: "خطأ", description: validation.message, variant: "destructive" });
        return;
      }
      
      setImageOptimization({ isCompressing: true, progress: 0, currentFile: file.name });
      
      const compressedFile = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressedFile);
      
      setLogoFile(compressedFile);
      setLogoPreview(previewUrl);
      
      const savedPercentage = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
      toast({
        title: "✅ تم تحسين الصورة",
        description: `تم تقليل الحجم بنسبة ${savedPercentage}%`,
      });
      
    } catch (error: any) {
      toast({
        title: "⚠️ تحذير",
        description: error.message || "فشل في معالجة الصورة",
        variant: "destructive"
      });
      const previewUrl = URL.createObjectURL(file);
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } finally {
      setImageOptimization({ isCompressing: false, progress: 0, currentFile: '' });
    }
  }, [compressImage, validateFile, toast]);

  const handleStoreImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({ title: "خطأ", description: validation.message, variant: "destructive" });
        return;
      }
      
      setImageOptimization({ isCompressing: true, progress: 50, currentFile: file.name });
      
      const compressedFile = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressedFile);
      
      setStoreImageFile(compressedFile);
      setStoreImagePreview(previewUrl);
      
      const savedPercentage = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
      toast({
        title: "✅ تم تحسين صورة الغلاف",
        description: `تم تقليل الحجم بنسبة ${savedPercentage}%`,
      });
      
    } catch (error: any) {
      toast({
        title: "⚠️ تحذير",
        description: error.message || "فشل في معالجة الصورة",
        variant: "destructive"
      });
      const previewUrl = URL.createObjectURL(file);
      setStoreImageFile(file);
      setStoreImagePreview(previewUrl);
    } finally {
      setImageOptimization({ isCompressing: false, progress: 0, currentFile: '' });
    }
  }, [compressImage, validateFile, toast]);

  // ============ ⭐ معالجات الأحداث ============
  const handleReplySubmit = useCallback(async (parentReview: ProductReview) => {
    if (replyComment.trim() === "") {
      toast({ 
        title: "خطأ", 
        description: "لا يمكن إرسال رد فارغ.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmittingReply(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ 
          title: "خطأ", 
          description: "يجب تسجيل الدخول للرد.", 
          variant: "destructive" 
        });
        return;
      }

      const replyData = {
        comment: replyComment,
        user_id: user.id,
        user_name: originalSellerData.business_name,
        user_avatar_url: originalSellerData.logo_url,
        parent_review_id: parentReview.id,
        product_id: parentReview.product_id,
      };

      const { error } = await supabase.from('product_reviews').insert(replyData);
      
      if (error) throw error;
      
      toast({ title: "تم إرسال الرد بنجاح!" });
      setReplyComment("");
      setReplyingTo(null);
      await fetchProductReviews();
      
    } catch (error: any) {
      toast({ 
        title: "فشل إرسال الرد", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmittingReply(false);
    }
  }, [replyComment, originalSellerData, initialSellerData.id, supabase, toast, fetchProductReviews]);

  const handleDeleteReply = useCallback(async (replyId: string) => {
    if (!window.confirm("هل أنت متأكد من أنك تريد حذف هذا الرد؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    toast({ title: "جاري حذف الرد..." });
    
    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', replyId);
      
      if (error) throw error;
      
      toast({ title: "تم حذف الرد بنجاح." });
      await fetchProductReviews();
      
    } catch (error: any) {
      toast({ 
        title: "فشل حذف الرد", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  }, [supabase, toast, fetchProductReviews]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    
    const oldProducts = products;
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({ title: "تم حذف المنتج بنجاح." });
      refetchProducts();
    } catch (error: any) {
      toast({ 
        title: "فشل حذف المنتج", 
        description: error.message, 
        variant: "destructive" 
      });
      setProducts(oldProducts);
    }
  }, [products, setProducts, supabase, toast, refetchProducts]);

  const handleInputChange = useCallback((field: keyof SellerData, value: any) => {
    setEditableSellerData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePhoneNumberChange = useCallback((id: string, field: 'type' | 'number', value: string) => {
    handleInputChange('phone_numbers', 
      editableSellerData?.phone_numbers?.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      ) || []
    );
  }, [editableSellerData?.phone_numbers, handleInputChange]);

  const addPhoneNumber = useCallback(() => {
    handleInputChange('phone_numbers', [
      ...(editableSellerData?.phone_numbers || []), 
      { id: Date.now().toString(), type: 'mobile', number: '' }
    ]);
  }, [editableSellerData?.phone_numbers, handleInputChange]);

  const removePhoneNumber = useCallback((id: string) => {
    handleInputChange('phone_numbers', 
      editableSellerData?.phone_numbers?.filter(p => p.id !== id) || []
    );
  }, [editableSellerData?.phone_numbers, handleInputChange]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditableSellerData(originalSellerData);
    setLogoFile(null);
    setStoreImageFile(null);
    setLogoPreview(originalSellerData?.logo_url || null);
    setStoreImagePreview(originalSellerData?.store_image_url || null);
    
    // تنظيف الذاكرة
    if (logoFile) URL.revokeObjectURL(URL.createObjectURL(logoFile));
    if (storeImageFile) URL.revokeObjectURL(URL.createObjectURL(storeImageFile));
  }, [originalSellerData, logoFile, storeImageFile]);

  // ============ ⭐ حفظ التغييرات مع Cloudinary ============
  const handleSaveChanges = useCallback(async () => {
    setIsSaving(true);
    
    try {
      let newLogoUrl = editableSellerData.logo_url;
      if (logoFile) {
        toast({ title: "🔄 جاري رفع الشعار..." });
        
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        
        if (cloudName && uploadPreset) {
          // استخدام Cloudinary
          const formData = new FormData();
          formData.append('file', logoFile);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', 'seller-logos');
          
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
            { method: 'POST', body: formData }
          );
          
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message || 'فشل رفع Cloudinary');
          
          newLogoUrl = data.secure_url;
          toast({ title: "✅ تم رفع الشعار إلى Cloudinary" });
        } else {
          // البديل: Supabase Storage
          const fileExt = logoFile.name.split('.').pop();
          const filePath = `${initialSellerData.id}/logo-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('seller-assets')
            .upload(filePath, logoFile, { upsert: true });
          
          if (uploadError) throw new Error(`فشل رفع الشعار: ${uploadError.message}`);
          
          newLogoUrl = supabase.storage.from('seller-assets').getPublicUrl(filePath).data.publicUrl;
        }
      }

      let newStoreImageUrl = editableSellerData.store_image_url;
      if (storeImageFile) {
        toast({ title: "🔄 جاري رفع صورة الغلاف..." });
        
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        
        if (cloudName && uploadPreset) {
          const formData = new FormData();
          formData.append('file', storeImageFile);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', 'store-covers');
          
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
            { method: 'POST', body: formData }
          );
          
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message || 'فشل رفع Cloudinary');
          
          newStoreImageUrl = data.secure_url;
          toast({ title: "✅ تم رفع صورة الغلاف إلى Cloudinary" });
        } else {
          const fileExt = storeImageFile.name.split('.').pop();
          const filePath = `${initialSellerData.id}/store-image-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('seller-assets')
            .upload(filePath, storeImageFile, { upsert: true });
          
          if (uploadError) throw new Error(`فشل رفع صورة الغلاف: ${uploadError.message}`);
          
          newStoreImageUrl = supabase.storage.from('seller-assets').getPublicUrl(filePath).data.publicUrl;
        }
      }

      const categoryIdToSave = getCategoryId(editableSellerData.category_id);
      const updatedDataForDB = {
        business_name: editableSellerData.business_name,
        description: editableSellerData.description,
        category_id: categoryIdToSave ? parseInt(categoryIdToSave) : null,
        country: editableSellerData.country,
        city: editableSellerData.city,
        phone_numbers: editableSellerData.phone_numbers,
        store_type: editableSellerData.store_type,
        physical_address: editableSellerData.physical_address,
        logo_url: newLogoUrl,
        store_image_url: newStoreImageUrl
      };

      const { error: dbError } = await supabase
        .from('sellers')
        .update(updatedDataForDB)
        .eq('id', initialSellerData.id);
      
      if (dbError) throw dbError;
      
      setIsEditing(false);
      toast({ title: "✅ تم حفظ التغييرات بنجاح!" });
      router.refresh();

      queryClient.invalidateQueries({ queryKey: ['products', initialSellerData.id] });

    } catch (err: any) {
      toast({ 
        title: "❌ خطأ", 
        description: err.message || "حدث خطأ في الحفظ", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    editableSellerData, 
    logoFile, 
    storeImageFile, 
    initialSellerData.id, 
    supabase, 
    toast, 
    router,
    queryClient
  ]);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('liked_products');
    await supabase.auth.signOut();
    window.location.href = '/';
  }, [supabase.auth]);

  const handleProductAddedOptimistic = useCallback((newProduct: Product) => {
    const categoryObject = allCategories.find(c => c.id === newProduct.category_id);
    const mainCategoryObject = allCategories.find(c => c.id === newProduct.main_category_id);
    const sellerObject = {
      id: originalSellerData.id,
      business_name: originalSellerData.business_name,
      logo_url: originalSellerData.logo_url,
      country: originalSellerData.country,
      phone_numbers: originalSellerData.phone_numbers,
    };

    const fullProductForDisplay: Product = {
      ...newProduct,
      category: categoryObject || (newProduct.suggested_category_name ? { 
        id: 0, 
        name: newProduct.suggested_category_name, 
        parent_id: null 
      } : null),
      main_category: mainCategoryObject,
      sellers: sellerObject,
      likes_count: 0,
      reviews: [],
    };

    setProducts(currentProducts => [fullProductForDisplay, ...currentProducts]);
  }, [allCategories, originalSellerData, setProducts]);

  const handleProductUpdateOptimistic = useCallback((updatedProduct: Partial<Product>) => {
    setProducts(prevProducts =>
      prevProducts.map(p => 
        p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
      )
    );
    onClose();
  }, [setProducts, onClose]);

  const handleOpenAddProductModal = useCallback(() => {
    const latestSellerData = {
      sellerCountry: originalSellerData.country,
      allCategories: allCategories,
      sellerMainCategoryId: getCategoryId(editableSellerData.category_id),
      sellerMainCategoryName: getCategoryNameById(getCategoryId(editableSellerData.category_id)),
      sellerId: initialSellerData.id, // ⭐ أضف هذا السطر ⭐
      onProductAdded: handleProductAddedOptimistic,
    };
    onOpen('addProduct', latestSellerData);
  }, [
    originalSellerData.country, 
    allCategories, 
    editableSellerData.category_id, 
    getCategoryNameById, 
    handleProductAddedOptimistic, 
    onOpen
  ]);

  const fetchSubCategoriesForPicker = useCallback(async (parentId: number | null): Promise<Category[]> => {
    if (parentId === null) {
      return allCategories.filter(c => c.parent_id === null);
    }
    return allCategories.filter(c => c.parent_id === parentId);
  }, [allCategories]);

  // ============ ⭐ العرض الرئيسي ============
  return (
    <>
      <div className="min-h-screen bg-background" dir="rtl">
      <header className="relative h-48 bg-muted w-full group">
  {coverImageUrl?.includes('cloudinary') && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
    <CldImage
      src={coverImageUrl}
      alt="صورة غلاف المتجر"
      width={1920}
      height={480}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      quality={75}
      format="auto"
      sizes="100vw"
      priority
    />
  ) : (
    <img 
      src={coverImageUrl || '/placeholder-cover.jpg'} 
      alt="صورة غلاف المتجر" 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      loading="eager"
      decoding="sync"
      fetchPriority="high"
      onError={(e) => { e.currentTarget.src = '/placeholder-cover.jpg'; }}
    />
  )}
  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
  
  <div className="absolute top-0 inset-x-0 p-4">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleOpenAddProductModal} 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all hover:scale-105"
        >
          <Plus className="ml-2 h-4 w-4" /> إضافة منتج
        </Button>
        
        <div className="relative">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => setIsFavoritesOpen(p => !p)} 
            className="shadow-lg transition-all hover:scale-105"
          >
            <ShoppingCart className={`h-5 w-5 transition-colors ${isFavoritesOpen ? 'text-red-500 fill-current' : ''}`} />
            {originalSellerData.total_likes_count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {originalSellerData.total_likes_count > 9 ? '9+' : originalSellerData.total_likes_count}
              </span>
            )}
          </Button>
          <LikedProductsDropdown 
            isOpen={isFavoritesOpen} 
            onClose={() => setIsFavoritesOpen(false)} 
            userId={initialSellerData.id} 
          />
        </div>

        
       {/* أيقونة المتابعين */}
{/* أيقونة المتابعين */}
<div className="relative z-[60]"> {/* ⬅️ أضف z-index هنا */}
  <Button 
    variant="secondary" 
    size="icon" 
    onClick={() => setIsFollowingOpen(p => !p)} 
    className="shadow-lg transition-all hover:scale-105 z-[61]" // ⬅️ وأضف هنا
  >
    <Pin className={`h-5 w-5 transition-colors ${isFollowingOpen ? 'text-blue-500' : ''}`} />
    {originalSellerData.followers_count > 0 && (
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
        {originalSellerData.followers_count > 9 ? '9+' : originalSellerData.followers_count}
      </span>
    )}
  </Button>
  
  {/* ⬇️ تأكد أن المكون يظهر فوق الهيدر */}
  <div className="absolute top-full left-0 mt-2 z-[70]"> {/* ⬅️ z-index عالي */}
    <FollowedSellersDropdown 
      isOpen={isFollowingOpen} 
      onClose={() => setIsFollowingOpen(false)} 
      userId={initialSellerData.id} 
    />
  </div>
</div>
<Popover onOpenChange={(open) => { 
  if (open) { 
    fetchNotifications(); 
    markNotificationsAsRead(); 
  } 
}}>
  <PopoverTrigger asChild>
    <Button variant="secondary" size="icon" className="relative shadow-lg transition-all hover:scale-105">
      <Bell className="h-5 w-5" />
      {unreadNotificationsCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        </span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-2">
                        <h4 className="font-bold text-lg mb-2 px-2">الإشعارات</h4>
                        {isLoadingNotifs ? (
                          <div className="flex justify-center p-10">
                            <Loader2 className="animate-spin" />
                          </div>
                        ) : notifications.length > 0 ? (
                          <div className="space-y-1 max-h-[400px] overflow-y-auto">
                            {notifications.map(notification => (
                              <div 
                                key={notification.id} 
                                onClick={() => handleNotificationClick(notification)} 
                                className={`flex items-start gap-3 p-2.5 rounded-md transition-colors cursor-pointer hover:bg-muted ${
                                  !notification.is_read ? 'bg-primary/10' : 'bg-transparent'
                                }`}
                              >
                                <div className="mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium leading-tight">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground pt-1">
                                    {new Date(notification.created_at).toLocaleDateString('ar-EG', { 
                                      day: 'numeric', 
                                      month: 'short', 
                                      hour: 'numeric', 
                                      minute: 'numeric' 
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-center text-muted-foreground py-10">
                            لا توجد إشعارات جديدة.
                          </p>
                        )}
                      </div>
                    </PopoverContent>
</Popover>

        <Button 
          variant="destructive" 
          onClick={handleLogout} 
          className="shadow-lg transition-all hover:scale-105"
        >
          <LogOut className="ml-2 h-4 w-4" /> تسجيل الخروج
        </Button>
      </div>

      <Button 
        variant="secondary" 
        onClick={() => router.push('/')} 
        className="shadow-lg transition-all hover:scale-105"
      >
        <ArrowLeft className="ml-2 h-4 w-4" /> العودة للمتجر
      </Button>
    </div>
  </div>
  
  <div className="absolute bottom-0 inset-x-0 p-4">
    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-3 rounded-lg max-w-md transition-all hover:bg-white/15">
      <Avatar className="h-16 w-16 border-2 border-white/50 transition-all hover:scale-105">
        {originalSellerData.logo_url ? (
          <AvatarImage 
            src={originalSellerData.logo_url} 
            alt={originalSellerData.business_name}
            loading="lazy"
            decoding="async"
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
          {originalSellerData.business_name?.charAt(0)?.toUpperCase() || 'ت'}
        </AvatarFallback>
      </Avatar>
      
      <div className="text-white">
        <h1 className="text-xl font-bold tracking-tight transition-all hover:scale-105" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
          {originalSellerData.business_name}
        </h1>
        <p className="text-sm opacity-90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          لوحة التحكم الخاصة بك
        </p>
      </div>
    </div>
  </div>
</header>

        {imageOptimization.isCompressing && (
          <div className="fixed top-4 left-4 bg-primary text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <div>
              <p className="text-sm font-medium">جاري تحسين الصورة...</p>
              <p className="text-xs opacity-90">{imageOptimization.currentFile}</p>
            </div>
          </div>
        )}

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10 space-y-4">
            <TabsList className="h-auto p-2 rounded-xl border shadow-lg flex flex-col lg:flex-row gap-2 bg-card">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                <StatCard title="المتابعون" value={originalSellerData.followers_count || 0}>
                  <Users className="h-5 w-5 text-blue-500" />
                </StatCard>
                <StatCard title="الإعجابات" value={originalSellerData.total_likes_count || 0}>
                  <Heart className="h-5 w-5 text-red-500" />
                </StatCard>
                <StatCard title="التقييم" value={originalSellerData.rating ? originalSellerData.rating.toFixed(1) : 'N/A'}>
                  <Star className="h-5 w-5 text-yellow-500" />
                </StatCard>
                <StatCard title="المنتجات" value={products.length}>
                  <Package className="h-5 w-5 text-green-500" />
                </StatCard>
              </div>
              <div className="hidden lg:block border-l mx-2 self-stretch"></div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                <TabsTrigger 
                  value="products" 
                  className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted hover:scale-105"
                >
                  <Package className="h-4 w-4" />المنتجات
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted hover:scale-105"
                >
                  <TrendingUp className="h-4 w-4" />التقييمات
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted hover:scale-105"
                >
                  <Settings className="h-4 w-4" />الإعدادات
                </TabsTrigger>
                <TabsTrigger 
                  value="orders" 
                  className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted hover:scale-105"
                >
                  <ShoppingCart className="h-4 w-4" />الطلبات
                </TabsTrigger>
                <TabsTrigger 
                  value="inbox" 
                  className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted hover:scale-105"
                >
                  <MessageSquare className="h-4 w-4" />الرسائل
                </TabsTrigger>
              </div>
            </TabsList>

            <div className="bg-card p-4 rounded-xl border shadow-lg transition-all hover:shadow-xl">
              <TabsContent value="products" className="mt-0">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3 border-b pb-4">
                  <h2 className="text-2xl font-bold tracking-tight">منتجاتي</h2>
                  <Button 
                    onClick={handleOpenAddProductModal} 
                    className="w-full sm:w-auto transition-all hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    <Plus className="ml-2 h-4 w-4" /> إضافة منتج جديد
                  </Button>
                </div>
                {isLoadingProducts ? (
                  <ProductsLoadingSkeleton />
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.filter(product => product).map((product, index) => (
                      <div 
                        key={product.id} 
                        className="relative group"
                        style={{ 
                          animation: 'fadeInUp 0.5s ease-out forwards',
                          opacity: 0
                        }}
                      >
                        <Suspense fallback={
                          <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                        }>
                          <ProductCard
                            item={product}
                            allCategories={allCategories}
                            context="dashboard"
                            priority={index < 4}
                            onEdit={() => onOpen('editProduct', { 
                              product: product, 
                              allCategories: allCategories,
                              onProductUpdated: (updatedData) => handleProductUpdateOptimistic({ ...product, ...updatedData })
                            })}
                            onShare={(e) => {
                              e?.stopPropagation();
                              onOpen('shareModal', {
                                title: `مشاركة منتج: ${product.name}`,
                                text: `تفضل بزيارة م��تج: ${product.name} - ${product.description?.substring(0, 100)}...`,
                                url: `${window.location.origin}/products/${product.id}`,
                                image: product.image_url || '/placeholder.svg'
                              });
                            }}
                          />
                        </Suspense>
                        
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-8 w-8 shadow-lg transition-all hover:scale-110 bg-gradient-to-r from-red-500 to-rose-600"
                            onClick={() => handleDeleteProduct(product.id)}
                            title="حذف المنتج"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 transition-all hover:from-gray-100 hover:to-gray-200">
                    <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="mt-4 text-xl font-medium text-gray-800">لم تقم بإضافة أي منتجات بعد</h3>
                    <p className="mt-2 text-gray-600 max-w-md mx-auto">ابدأ رحلتك في البيع من خلال إضافة منتجك الأول</p>
                    <Button 
                      className="mt-6 transition-all hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600" 
                      onClick={handleOpenAddProductModal}
                    >
                      <Plus className="ml-2 h-4 w-4" /> إضافة منتج جديد
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-2 border-b mb-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl tracking-tight">إعدادات المتجر</CardTitle>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSaveChanges} 
                            disabled={isSaving}
                            className="transition-all hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600"
                          >
                            {isSaving ? (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="ml-2 h-4 w-4" />
                            )}
                            حفظ التغييرات
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleCancelEdit} 
                            disabled={isSaving}
                            className="transition-all hover:scale-105"
                          >
                            <X className="ml-2 h-4 w-4" /> إلغاء
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(true)}
                          className="transition-all hover:scale-105"
                        >
                          <Edit className="ml-2 h-4 w-4" /> تعديل
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 space-y-8">
                    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-slate-50 to-white">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                        <Store className="h-5 w-5 text-primary" />
                        هوية المتجر
                      </h3>
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex flex-col items-center">
                          <Label className="mb-2 font-medium">شعار المتجر</Label>
                          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden relative group transition-all hover:border-primary">
                            {logoPreview ? (
                              <CldImage
                                src={logoPreview}
                                alt="شعار المتجر"
                                width={112}
                                height={112}
                                className="rounded-full object-cover w-full h-full"
                                quality={80}
                                format="auto"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                <Store className="h-10 w-10 text-primary/40" />
                              </div>
                            )}
                            {isEditing && (
                              <label htmlFor="logo-upload-dashboard" className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                <Camera className="h-6 w-6" />
                              </label>
                            )}
                            <input 
                              id="logo-upload-dashboard" 
                              ref={logoInputRef} 
                              type="file" 
                              accept="image/*" 
                              onChange={handleLogoUpload} 
                              className="hidden" 
                              disabled={!isEditing} 
                            />
                          </div>
                          {logoFile && (
                            <p className="text-xs text-green-600 mt-2">✓ تم تحميل صورة جديدة</p>
                          )}
                        </div>
                        <div className="flex-1 w-full space-y-4">
                          <div>
                            <Label htmlFor="businessName" className="font-medium">اسم المتجر / النشاط التجاري</Label>
                            <Input 
                              id="businessName" 
                              value={editableSellerData.business_name || ''} 
                              onChange={(e) => handleInputChange('business_name', e.target.value)} 
                              disabled={!isEditing}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="category" className="font-medium">النشاط التجاري</Label>
                            {isEditing ? (
                              <Button 
                                id="category" 
                                type="button" 
                                variant="outline" 
                                className="w-full justify-between mt-1"
                                onClick={() => setCategoryPickerOpen(true)}
                              >
                                <span>{getCategoryNameById(getCategoryId(editableSellerData.category_id))}</span>
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            ) : (
                              <Input 
                                value={getCategoryNameById(getCategoryId(editableSellerData.category_id))} 
                                disabled 
                                className="mt-1"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description" className="font-medium">وصف المتجر</Label>
                        <Textarea 
                          id="description" 
                          value={editableSellerData.description || ''} 
                          onChange={(e) => handleInputChange('description', e.target.value)} 
                          disabled={!isEditing}
                          className="mt-1"
                          placeholder="اكتب وصفاً مختصراً عن متجرك ونشاطك التجاري..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label className="font-medium">صورة غلاف المتجر</Label>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="w-32 h-20 rounded-md bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center border border-gray-300 overflow-hidden">
                            {storeImagePreview ? (
                              <CldImage
                                src={storeImagePreview}
                                alt="غلاف المتجر"
                                width={128}
                                height={80}
                                className="object-cover w-full h-full"
                                quality={70}
                                format="auto"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          {isEditing && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => storeImageInputRef.current?.click()}
                              className="transition-all hover:scale-105"
                            >
                              <Upload className="w-4 h-4 ml-2" /> 
                              {storeImagePreview ? 'تغيير الغلاف' : 'إضافة غلاف'}
                            </Button>
                          )}
                          <input 
                            id="store-image-upload-dashboard" 
                            ref={storeImageInputRef} 
                            type="file" 
                            accept="image/*" 
                            onChange={handleStoreImageUpload} 
                            className="hidden" 
                            disabled={!isEditing} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-slate-50 to-white">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        تفاصيل المتجر والموقع
                      </h3>
                      <div>
                        <Label className="font-medium">نوع المتجر</Label>
                        <RadioGroup 
                          onValueChange={(value) => handleInputChange('store_type', value)} 
                          value={editableSellerData.store_type || 'online'} 
                          className="grid grid-cols-2 gap-4 mt-2" 
                          disabled={!isEditing}
                        >
                          <Label className={`
                            flex items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all
                            ${editableSellerData.store_type === 'online' 
                              ? 'border-primary bg-gradient-to-r from-primary/5 to-primary/10' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}>
                            <RadioGroupItem value="online" className="text-primary" />
                            <Globe className="h-5 w-5" />
                            <span>عبر الإنترنت</span>
                          </Label>
                          <Label className={`
                            flex items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all
                            ${editableSellerData.store_type === 'physical' 
                              ? 'border-primary bg-gradient-to-r from-primary/5 to-primary/10' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}>
                            <RadioGroupItem value="physical" className="text-primary" />
                            <Store className="h-5 w-5" />
                            <span>محل فعلي</span>
                          </Label>
                        </RadioGroup>
                      </div>
                      {editableSellerData.store_type === 'physical' && (
                        <div>
                          <Label htmlFor="physicalAddress" className="font-medium">تفاصيل العنوان الفعلي</Label>
                          <Textarea 
                            id="physicalAddress" 
                            placeholder="مثال: شارع التحرير، بجانب متجر الأمل، صنعاء" 
                            value={editableSellerData.physical_address || ''} 
                            onChange={(e) => handleInputChange('physical_address', e.target.value)} 
                            disabled={!isEditing}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-medium">الدولة</Label>
                          <Input 
                            value={getCountryInArabic(editableSellerData.country)} 
                            disabled 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city" className="font-medium">المدينة</Label>
                          <Input 
                            id="city" 
                            value={editableSellerData.city || ''} 
                            onChange={(e) => handleInputChange('city', e.target.value)} 
                            disabled={!isEditing}
                            className="mt-1"
                            placeholder="أدخل اسم المدينة"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-slate-50 to-white">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                        <Phone className="h-5 w-5 text-primary" />
                        معلومات التواصل
                      </h3>
                      <div>
                        <Label className="font-medium">البريد الإلكتروني (للحساب)</Label>
                        <Input 
                          value={editableSellerData.email || ''} 
                          disabled 
                          className="mt-1 bg-gray-100"
                        />
                      </div>
                      <div>
                        <Label className="font-medium">أرقام الهاتف</Label>
                        <div className="space-y-2 mt-2">
                          {(editableSellerData.phone_numbers || []).map((phone: PhoneNumber) => (
                            <div key={phone.id} className="flex items-center gap-2">
                              <Select 
                                value={phone.type} 
                                onValueChange={(value: 'whatsapp' | 'mobile' | 'landline') => 
                                  handlePhoneNumberChange(phone.id, 'type', value)
                                } 
                                disabled={!isEditing}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="whatsapp" className="flex items-center gap-2">
                                    <span>واتساب</span>
                                  </SelectItem>
                                  <SelectItem value="mobile">جوال</SelectItem>
                                  <SelectItem value="landline">هاتف ثابت</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex-1">
                                <Input 
                                  type="tel" 
                                  value={phone.number} 
                                  onChange={(e) => handlePhoneNumberChange(phone.id, 'number', e.target.value)} 
                                  disabled={!isEditing} 
                                  placeholder="أدخل الرقم هنا" 
                                  className="font-mono"
                                />
                              </div>
                              {isEditing && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removePhoneNumber(phone.id)} 
                                  disabled={!isEditing || (editableSellerData.phone_numbers || []).length <= 1}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={addPhoneNumber} 
                              className="mt-2 transition-all hover:scale-105"
                            >
                              <Plus className="h-4 w-4 mr-2" />إضافة رقم آخر
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="mt-0">
                <div className="text-center py-20 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">قسم الطلبات قيد الإنشاء</h3>
                  <p className="text-gray-600">سيتم إضافة هذه الميزة قريباً</p>
                </div>
              </TabsContent>

              <TabsContent value="inbox" className="mt-0">
                <h2 className="text-2xl font-bold tracking-tight mb-4">الرسائل</h2>
                <OwnerChatInbox
                  ownerId={initialSellerData.id}
                  role="seller"
                  entities={products.map((p: any) => ({ id: p.id, name: p.name }))}
                />
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-2 border-b mb-6">
                    <CardTitle className="text-2xl tracking-tight">
                      جميع التقييمات ({unifiedReviews.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    {(isLoadingProductReviews || isLoadingSellerReviews) ? (
                      <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      </div>
                    ) : unifiedReviews.length > 0 ? (
                      <div className="space-y-6">
                        {unifiedReviews.map(review => (
                          <div 
                            key={review.id} 
                            className="flex items-start gap-4 transition-all hover:bg-gradient-to-r from-gray-50/50 to-white p-3 rounded-lg"
                          >
                            <div className="flex-shrink-0">
                              <OptimizedAvatar 
                                src={review.userAvatarUrl || undefined} 
                                alt={review.userName}
                                size={48}
                              />
                            </div>
                            <div className="flex-1 bg-gradient-to-br from-gray-50/50 to-white rounded-lg p-4 transition-all hover:from-gray-50 hover:to-white">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-semibold text-gray-800">{review.userName}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString('ar-EG', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </div>
                              </div>
                              {review.rating !== null && (
                                <div className="flex items-center gap-1 mb-2">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < review.rating! 
                                          ? 'text-yellow-400 fill-yellow-400' 
                                          : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                              )}
                              <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                              {review.type === 'product' && review.productName && (
                                <div className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2">
                                  تقييم لمنتج: <span className="font-medium text-primary">{review.productName}</span>
                                </div>
                              )}
                              {review.type === 'product' && review.rawProductReview && (
                                <div className="mt-4">
                                  {productRepliesMap[review.id] ? (
                                    <div className="space-y-3">
                                      {productRepliesMap[review.id].map(reply => (
                                        <div 
                                          key={reply.id} 
                                          className="flex items-start gap-3 bg-gradient-to-r from-white to-gray-50 p-3 rounded-md border border-gray-100"
                                        >
                                          <div className="flex-shrink-0">
                                            <OptimizedAvatar 
                                              src={reply.user_avatar_url || undefined} 
                                              alt={reply.user_name}
                                              size={32}
                                            />
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                              <p className="font-semibold text-sm text-gray-800">{reply.user_name}</p>
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteReply(reply.id)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{reply.comment}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    replyingTo === review.id ? (
                                      <div className="flex items-center gap-2 mt-3">
                                        <Input 
                                          value={replyComment}
                                          onChange={(e) => setReplyComment(e.target.value)}
                                          placeholder="اكتب ردك هنا..."
                                          className="flex-1"
                                          autoFocus
                                        />
                                        <Button 
                                          onClick={() => handleReplySubmit(review.rawProductReview!)} 
                                          disabled={isSubmittingReply}
                                          className="bg-gradient-to-r from-green-500 to-emerald-600"
                                        >
                                          {isSubmittingReply ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Send className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          onClick={() => setReplyingTo(null)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setReplyingTo(review.id)}
                                        className="mt-3"
                                      >
                                        <MessageSquare className="ml-2 h-4 w-4" /> الرد على التقييم
                                      </Button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                        <Star className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-xl font-medium text-gray-800">لا توجد تقييمات بعد</h3>
                        <p className="mt-2 text-gray-600">لم يقم أي عميل بترك تقييم حتى الآن.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
      
      {isCategoryPickerOpen && (
        <CategoryPickerModal
          isOpen={isCategoryPickerOpen}
          onClose={() => setCategoryPickerOpen(false)}
          fetchSubCategories={fetchSubCategoriesForPicker}
          initialParentId={1}
          stopAtLevel={1}
          onSelect={(selectedCategory) => {
            if (typeof selectedCategory !== 'string') {
              handleInputChange("category_id", [String(selectedCategory.id)]);
            }
            setCategoryPickerOpen(false);
          }}
        />
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

