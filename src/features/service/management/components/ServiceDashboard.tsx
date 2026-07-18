"use client";

import { useState, useEffect, useMemo, ChangeEvent, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

// ✅ استيراد useAuth
import { useAuth } from '@/context/AuthContext';

// الأيقونات (احذف غير المستخدم)
import {
  Plus, Settings, Edit, LogOut, Save, X, Camera, Phone, Upload, Store, Globe, Trash2,
  Loader2, ShoppingCart, TrendingUp, ArrowLeft, Users, Heart, Star, Bell, MessageSquare, Send, Wrench,
  ChevronDown, Calendar, Pin
} from "lucide-react";

// مكونات UI
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
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { Switch } from "@/components/ui/switch";

// الأنواع والمكونات
import type { Category } from '@/lib/types';
import type { Service, ServiceProvider } from '../../../service-view/types/service.types';
import { CategoryPickerModal } from "@/components/category-picker-modal";
import { ProductCard } from "@/components/product-card";
import { useModal } from "@/hooks/use-modal";
import { deleteServiceV2 } from '../actions/deleteService.action';
import { LikedProductsDropdown } from "@/components/modals/LikedProductsDropdown";
import { FollowedSellersDropdown } from "@/components/modals/FollowedSellersDropdown";
import { OwnerChatInbox } from "@/components/dashboard/owner-chat-inbox";
import { CldImage } from 'next-cloudinary';
// --- الواجهات والبيانات المساعدة (محدثة) ---
interface ServiceReview {
  id: string;
  created_at: string;
  user_name: string;
  rating: number | null;
  comment: string;
  user_avatar_url?: string;
  service_id: string;
  services: { name: string } | null;
  parent_review_id: string | null;
}

interface ProviderReview {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string | null;
  service_id?: string;
  service_name?: string | null;
}

interface UnifiedReview {
  id: string;
  type: 'service' | 'provider';
  created_at: string;
  userName: string;
  userAvatarUrl?: string | null;
  rating: number | null;
  comment: string;
  serviceName?: string | null;
  rawServiceReview?: ServiceReview;
}

interface Notification {
  id: string;
  user_id: string;
  created_at: string;
  type: string;
  message: string;
  is_read: boolean;
  link?: string | null;
}

interface ServiceDashboardProps {
  sellerData: ServiceProvider;
  allCategories: Category[];
}

const countryDictionary: { [key: string]: string } = {
  YE: "اليمن", SA: "المملكة العربية السعودية", AE: "الإمارات العربية المتحدة",
  QA: "قطر", KW: "الكويت", BH: "البحرين", OM: "عُمان", EG: "مصر",
  JO: "الأردن", SD: "السودان", LY: "ليبيا", TN: "تونس",
  DZ: "الجزائر", MA: "المغرب",
};

const getCountryInArabic = (countryCode: string = "") => countryDictionary[countryCode.toUpperCase()] || countryCode;

const getCategoryId = (categoryValue: any): string | null => {
  if (!categoryValue) return null;
  if (Array.isArray(categoryValue) && categoryValue.length > 0) {
    const id = String(categoryValue[0]);
    const isValid = !isNaN(parseInt(id, 10));
    return isValid ? id : null;
  }
  if (typeof categoryValue === 'string') {
    const extractedNumber = categoryValue.replace(/\D/g, '');
    return extractedNumber || null;
  }
  if (typeof categoryValue === 'number') {
    return String(categoryValue);
  }
  return null;
};

function ServiceDashboard({ sellerData: initialProviderData, allCategories }: ServiceDashboardProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'services';

  const queryClient = useQueryClient(); // ✅ أضف هذا
  const { onOpen } = useModal();
    const { user } = useAuth();

  // بعض سجلات مزودي الخدمة القديمة لا تملك user_id مملوءاً (كانت تعتمد فقط على service_providers.id
  // كمعرّف auth). نستخدم هذا المعرّف الموحّد في كل مكان يحتاج معرّف auth.users الخاص بالمزود
  // (الإشعارات، الدردشة)، بدل الاعتماد على initialProviderData.user_id مباشرة في كل موضع.
  const providerAuthId = initialProviderData.user_id || initialProviderData.id;

  // ✅ استبدل useRealtimeServices بـ useQuery
  const { 
    data: services = [], 
    isLoading: isLoadingServices,
    refetch: refetchServices
  } = useQuery({
    queryKey: ['provider-services', initialProviderData.id],
    queryFn: async () => {
      console.log('🔄 جلب الخدمات لـ service_provider_id:', initialProviderData.id);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
                .eq('service_provider_id', initialProviderData.id) // ✅ التأكد من التصحيح
        .order('created_at', { ascending: false })
        .limit(100);
      
      console.log('📊 نتيجة جلب الخدمات:', { 
        count: data?.length || 0, 
        error: error?.message 
      });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const setServices = useCallback((newServices: Service[]) => {
    queryClient.setQueryData(['provider-services', initialProviderData.id], newServices);
  }, [initialProviderData.id, queryClient]);
  // ========== States ==========
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSettingsTab, setActiveSettingsTab] = useState('basic');
  const [allServiceReviews, setAllServiceReviews] = useState<ServiceReview[]>([]);
  const [isLoadingServiceReviews, setIsLoadingServiceReviews] = useState(true);
  const [providerReviews, setProviderReviews] = useState<ProviderReview[]>([]);
  const [isLoadingProviderReviews, setIsLoadingProviderReviews] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editableProviderData, setEditableProviderData] = useState<ServiceProvider>(initialProviderData);
  const [originalProviderData, setOriginalProviderData] = useState<ServiceProvider>(initialProviderData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [isCategoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialProviderData?.logo_url || null);

  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('Error playing sound:', e));
  }, []);

  useEffect(() => {
    setOriginalProviderData(initialProviderData);
    setEditableProviderData(initialProviderData);

    const fetchProviderStats = async () => {
      if (!initialProviderData.id) return;
      try {
        const { data, error } = await supabase
          .from('service_providers')
          .select('followers_count, total_likes_count, rating')
          .eq('id', initialProviderData.id)
          .single();

        if (data && !error) {
          setOriginalProviderData(prev => ({ ...prev, ...data }));
          setEditableProviderData(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Error fetching provider stats:", error);
      }
    };
    fetchProviderStats();
  }, [initialProviderData.id, supabase]);

  const getCategoryNameById = useCallback((categoryId: any): string => {
    if (!categoryId) return "غير محدد";
    if (Array.isArray(categoryId)) {
      const idStr = categoryId.length > 0 ? String(categoryId[0]) : null;
      if (!idStr) return "غير محدد";
      const category = allCategories.find(c => String(c.id) === idStr);
      return category ? category.name : "غير محدد";
    }
    const idStr = String(categoryId);
    const category = allCategories.find(c => String(c.id) === idStr);
    if (category) {
      return category.name;
    }
    return "غير محدد";
  }, [allCategories]);

  const providerMainCategoryId = useMemo(() => getCategoryId(originalProviderData.category_id), [originalProviderData.category_id]);
  const providerMainCategoryName = useMemo(() => getCategoryNameById(providerMainCategoryId), [providerMainCategoryId, getCategoryNameById]);

  const fetchInitialNotifications = useCallback(async (providerId: string) => {
    const { error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', providerId)
      .eq('is_read', false);
    if (!error && count !== null) setUnreadNotificationsCount(count);
  }, [supabase]);

  useEffect(() => {
    if (providerAuthId) {
      fetchInitialNotifications(providerAuthId);
    }
  }, [providerAuthId, fetchInitialNotifications]);

  const fetchNotifications = async () => {
    setIsLoadingNotifs(true);
    // ملاحظة: notifications.user_id يشير إلى auth.users.id، وليس service_providers.id
    // (وهو PK داخلي منفصل) — لذا نستخدم providerAuthId هنا.
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', providerAuthId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) toast.error("خطأ في جلب الإشعارات");
    else setNotifications(data as Notification[]);
    setIsLoadingNotifs(false);
  };

  const markNotificationsAsRead = async () => {
    if (unreadNotificationsCount === 0) return;
    setUnreadNotificationsCount(0);
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', providerAuthId)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getNotificationIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('service') || normalizedType.includes('خدمة')) {
      return <Wrench className="w-4 h-4 text-indigo-500" />;
    }
    if (normalizedType.includes('booking') || normalizedType.includes('حجز')) {
      return <Calendar className="w-4 h-4 text-blue-500" />;
    }
    switch (normalizedType) {
      case 'new_review': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'new_seller_review': return <Store className="w-4 h-4 text-yellow-500" />;
      case 'new_follower': return <Users className="w-4 h-4 text-blue-500" />;
      case 'new_message': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'new_like': return <Heart className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (notification.link) {
      router.push(notification.link);
    } else {
      switch (notification.type.toLowerCase()) {
        case 'new_message': router.push('/messages'); break;
        case 'new_review': router.push('/reviews'); break;
        case 'new_service_booking': router.push('/bookings'); break;
        default: router.push('/notifications'); break;
      }
    }
  }, [router]);

  const fetchServiceReviews = useCallback(async () => {
    setIsLoadingServiceReviews(true);
    const { data, error } = await supabase
      .from("service_reviews")
      .select(`*, services!inner(name, service_provider_id)`)
      .eq("services.service_provider_id", initialProviderData.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(`فشل في جلب تقييمات الخدمات: ${error.message}`);
      setAllServiceReviews([]);
    } else {
      setAllServiceReviews(data as ServiceReview[]);
    }
    setIsLoadingServiceReviews(false);
  }, [initialProviderData.id, supabase]);
  const fetchProviderReviews = useCallback(async () => {
    setIsLoadingProviderReviews(true);
    try {
      const { data, error } = await supabase
        .from('service_provider_reviews')
        .select('id, created_at, rating, comment, user_id, user_name, user_avatar_url, service_provider_id')
        .eq('service_provider_id', initialProviderData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReviews: ProviderReview[] = (data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        rating: item.rating,
        comment: item.comment,
        user_id: item.user_id,
        user_name: item.user_name || 'مستخدم',
        user_avatar_url: item.user_avatar_url,
        service_id: undefined,
        service_name: undefined,
      }));

      setProviderReviews(formattedReviews);
    } catch (error: any) {
      console.warn("⚠️ ملاحظة: لم يتم العثور على تقييمات للمقدم:", error.message);
      setProviderReviews([]);
    } finally {
      setIsLoadingProviderReviews(false);
    }
  }, [initialProviderData.id, supabase]);

  const unifiedReviews: UnifiedReview[] = useMemo(() => {
    const formattedServiceReviews = allServiceReviews
      .filter(r => r.parent_review_id === null)
      .map(r => ({
        id: r.id,
        type: 'service' as const,
        created_at: r.created_at,
        userName: r.user_name,
        userAvatarUrl: r.user_avatar_url,
        rating: r.rating,
        comment: r.comment,
        serviceName: r.services?.name,
        rawServiceReview: r
      }));

      const formattedProviderReviews = providerReviews.map(r => ({
        id: r.id,
        type: 'provider' as const,
        created_at: r.created_at,
        userName: r.user_name || 'مستخدم',
        userAvatarUrl: r.user_avatar_url,
        rating: r.rating,
        comment: r.comment,
        serviceName: r.service_name,
      }));
    return [...formattedServiceReviews, ...formattedProviderReviews]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allServiceReviews, providerReviews]);

  const serviceRepliesMap = useMemo(() => {
    return allServiceReviews
      .filter(r => r.parent_review_id !== null)
      .reduce((acc, reply) => {
        const parentId = reply.parent_review_id!;
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(reply);
        return acc;
      }, {} as Record<string, ServiceReview[]>);
  }, [allServiceReviews]);

  useEffect(() => {
    fetchServiceReviews();
    fetchProviderReviews();
  }, [fetchServiceReviews, fetchProviderReviews]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-dashboard-notifications:${providerAuthId}`)
      .on<Notification>('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${providerAuthId}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadNotificationsCount(prev => prev + 1);
        toast.success("لديك إشعار جديد!", { description: newNotification.message });
        playNotificationSound();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialProviderData.id, supabase, playNotificationSound]);

  const handleReplySubmit = async (parentReview: ServiceReview) => {
    if (replyComment.trim() === "") {
      toast.error("لا يمكن إرسال رد فارغ.");
      return;
    }
    setIsSubmittingReply(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("يجب تسجيل الدخول للرد.");
      setIsSubmittingReply(false);
      return;
    }
    const replyData = {
      comment: replyComment,
      user_id: user.id,
      user_name: originalProviderData.business_name,
      user_avatar_url: originalProviderData.logo_url,
      parent_review_id: parentReview.id,
      service_id: parentReview.service_id,
      provider_id: initialProviderData.id
    };
    const { error } = await supabase.from('service_reviews').insert(replyData);
    if (error) {
      toast.error("فشل إرسال الرد", { description: error.message });
    } else {
      toast.success("تم إرسال الرد بنجاح!");
      setReplyComment("");
      setReplyingTo(null);
      await fetchServiceReviews();
    }
    setIsSubmittingReply(false);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!window.confirm("هل أنت متأكد من أنك تريد حذف هذا الرد؟")) return;
    toast.info("جاري حذف الرد...");
    const { error } = await supabase
      .from('service_reviews')
      .delete()
      .eq('id', replyId);
    if (error) {
      toast.error("فشل حذف الرد", { description: error.message });
    } else {
      toast.success("تم حذف الرد بنجاح.");
      await fetchServiceReviews();
    }
  };
const handleDeleteService = async (serviceId: string) => {
  if (!window.confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;
  
  // ✅ استخدام user من useAuth بدلاً من supabase.auth.getUser()
  if (!user) {
    toast.error("يجب تسجيل الدخول أولاً");
    return;
  }
  
  const result = await deleteServiceV2({
    serviceId,
    userId: user.id, // ✅ استخدام user.id مباشرة
    softDelete: true
  });
  
  if (result.success) {
    toast.success(result.message);
    
    // تحديث القائمة بعد الحذف
    queryClient.setQueryData(
      ['provider-services', initialProviderData.id],
      (oldData: Service[] = []) => oldData.filter(s => s.id !== serviceId)
    );
  } else {
    toast.error(result.message || "فشل حذف الخدمة");
  }
};
  
  const handleInputChange = (field: keyof ServiceProvider, value: any) =>
    setEditableProviderData(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setEditableProviderData(prev => ({ ...prev, logo_url: URL.createObjectURL(file) }));
    }
  };

  const handleStoreImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreImageFile(file);
      setEditableProviderData(prev => ({ ...prev, store_image_url: URL.createObjectURL(file) }));
    }
  };

  const handleCancelEdit = () => {
    setEditableProviderData(originalProviderData);
    setIsEditing(false);
    setLogoFile(null);
    setStoreImageFile(null);
  };

  const handlePhoneNumberChange = (id: string, field: 'type' | 'number', value: string) =>
    handleInputChange('phone_numbers', (editableProviderData.phone_numbers || []).map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));

  const addPhoneNumber = () =>
    handleInputChange('phone_numbers', [...(editableProviderData.phone_numbers || []), {
      id: Date.now().toString(),
      type: 'mobile',
      number: ''
    }]);

  const removePhoneNumber = (id: string) =>
    handleInputChange('phone_numbers', (editableProviderData.phone_numbers || []).filter(p => p.id !== id));

  const handleServiceAddedOptimistic = (newService: Service) => {
    const fullServiceForDisplay: Service = {
      ...newService,
      service_providers: {
        id: originalProviderData.id,
        business_name: originalProviderData.business_name,
        logo_url: originalProviderData.logo_url,
        country: originalProviderData.country
      }
    };
    
    // ✅ استخدم queryClient.setQueryData
    queryClient.setQueryData(
      ['provider-services', initialProviderData.id],
      (oldData: Service[] = []) => [fullServiceForDisplay, ...oldData]
    );
    
    setActiveTab('services');
    toast.success("تم إضافة الخدمة بنجاح!");
    
    // ✅ تأكيد تحديث البيانات
    setTimeout(() => {
      refetchServices();
    }, 1000);
  };
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // 1. رفع الملفات
      let newLogoUrl = editableProviderData.logo_url;
      if (logoFile) {
        const filePath = `${initialProviderData.id}/logo-${Date.now()}`;
        
        // ⭐⭐ التعديل هنا: استخدم 'seller-assets' بدلاً من 'provider-assets' ⭐⭐
        const { error: uploadError } = await supabase.storage
          .from('seller-assets')  // ⬅️ تم التغيير
          .upload(filePath, logoFile, { upsert: true });
        
        if (uploadError) throw new Error(`فشل رفع الشعار: ${uploadError.message}`);
        
        // ⭐⭐ التعديل هنا أيضاً ⭐⭐
        newLogoUrl = supabase.storage
          .from('seller-assets')  // ⬅️ تم التغيير
          .getPublicUrl(filePath).data.publicUrl;
      }

      let newStoreImageUrl = editableProviderData.store_image_url;
      if (storeImageFile) {
        const filePath = `${initialProviderData.id}/store-image-${Date.now()}`;
        
        // ⭐⭐ التعديل هنا: استخدم 'seller-assets' بدلاً من 'provider-assets' ⭐⭐
        const { error: uploadError } = await supabase.storage
          .from('seller-assets')  // ⬅️ تم التغيير
          .upload(filePath, storeImageFile, { upsert: true });
        
        if (uploadError) throw new Error(`فشل رفع صورة الغلاف: ${uploadError.message}`);
        
        // ⭐⭐ التعديل هنا أيضاً ⭐⭐
        newStoreImageUrl = supabase.storage
          .from('seller-assets')  // ⬅️ تم التغيير
          .getPublicUrl(filePath).data.publicUrl;
      }

      const categoryIdToSave = getCategoryId(editableProviderData.category_id);
      const updatedDataForDB = {
        business_name: editableProviderData.business_name,
        description: editableProviderData.description,
        category_id: categoryIdToSave ? parseInt(categoryIdToSave) : null,
        country: editableProviderData.country,
        city: editableProviderData.city,
        phone_numbers: editableProviderData.phone_numbers,
        store_type: editableProviderData.store_type,
        physical_address: editableProviderData.physical_address,
        logo_url: newLogoUrl,
        store_image_url: newStoreImageUrl,
        
        // ⭐⭐ الحقول الجديدة التي أضيفت ⭐⭐
        specialization: editableProviderData.specialization || null,
        qualifications: editableProviderData.qualifications || null,
        certifications: editableProviderData.certifications || null,
        years_of_experience: editableProviderData.years_of_experience || null,
        availability: editableProviderData.availability || null,
        working_days: editableProviderData.working_days || [],
        emergency_service: editableProviderData.emergency_service || false,
      };

      const { error: dbError } = await supabase
        .from('service_providers')
        .update(updatedDataForDB)
        .eq('id', initialProviderData.id);

      if (dbError) throw dbError;

      setOriginalProviderData(prev => ({ ...prev, ...updatedDataForDB }));
      setIsEditing(false);
      setLogoFile(null);
      setStoreImageFile(null);
      toast.success("تم الحفظ بنجاح!");
    } catch (err: any) {
      toast.error("خطأ", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('liked_products');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const coverImageUrl = useMemo(() =>
    editableProviderData.store_image_url || originalProviderData.store_image_url || '/placeholder-cover.jpg',
    [editableProviderData.store_image_url, originalProviderData.store_image_url]
  );

  const StatCard = ({ title, value, children }: { title: string; value: string | number; children: React.ReactNode; }) => (
    <div className="flex-1 p-3 bg-card rounded-lg border border-primary/20 shadow-sm flex items-center gap-3">
      {children}
      <div>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );

  const fetchSubCategoriesForPicker = useCallback(async (parentId: number | null): Promise<Category[]> => {
    try {
      if (parentId === null) {
        const mainCategories = allCategories.filter(c => c.parent_id === null);
        return mainCategories;
      }
      const subCategories = allCategories.filter(c => c.parent_id === parentId);
      return subCategories;
    } catch (error: any) {
      toast.error("فشل في تحميل الأقسام");
      return [];
    }
  }, [allCategories]);

  const handleOpenAddServiceModal = () => {
    const mainCategoryId = getCategoryId(originalProviderData.category_id);
    const mainCategoryName = getCategoryNameById(mainCategoryId);
    onOpen('addService', {
      sellerId: originalProviderData.id,
      sellerCountry: originalProviderData.country,
      sellerMainCategoryId: mainCategoryId,
      sellerMainCategoryName: mainCategoryName,
      allCategories: allCategories,
      onServiceAdded: handleServiceAddedOptimistic,
    });
  };

  const handleServiceUpdated = (updatedService: Partial<Service>) => {
    queryClient.setQueryData(
      ['provider-services', initialProviderData.id],
      (oldData: Service[] = []) => 
        oldData.map(s => s.id === updatedService.id ? { ...s, ...updatedService } : s)
    );
  };
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
              onError={(e) => { e.currentTarget.src = '/placeholder-cover.jpg'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <div className="absolute top-0 inset-x-0 p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Button onClick={handleOpenAddServiceModal} className="bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all hover:scale-105">
                  <Plus className="ml-2 h-4 w-4" /> إضافة خدمة
                </Button>
                <div className="relative">
                  <Button variant="secondary" size="icon" onClick={() => setIsFavoritesOpen(p => !p)} className="shadow-lg transition-all hover:scale-105">
                    <ShoppingCart className={`h-5 w-5 transition-colors ${isFavoritesOpen ? 'text-red-500 fill-current' : ''}`} />
                    {originalProviderData.total_likes_count > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                        {originalProviderData.total_likes_count > 9 ? '9+' : originalProviderData.total_likes_count}
                      </span>
                    )}
                  </Button>
                  <LikedProductsDropdown isOpen={isFavoritesOpen} onClose={() => setIsFavoritesOpen(false)} userId={initialProviderData.id} />
                </div>
                <div className="relative">
                  <Button variant="secondary" size="icon" onClick={() => setIsFollowingOpen(p => !p)} className="shadow-lg transition-all hover:scale-105">
                    <Pin className={`h-5 w-5 transition-colors ${isFollowingOpen ? 'text-blue-500' : ''}`} />
                    {originalProviderData.followers_count > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                        {originalProviderData.followers_count > 9 ? '9+' : originalProviderData.followers_count}
                      </span>
                    )}
                  </Button>
                  <FollowedSellersDropdown isOpen={isFollowingOpen} onClose={() => setIsFollowingOpen(false)} userId={initialProviderData.id} />
                </div>
                <Button variant="destructive" onClick={handleLogout} className="shadow-lg transition-all hover:scale-105">
                  <LogOut className="ml-2 h-4 w-4" /> تسجيل الخروج
                </Button>
                <Popover onOpenChange={(open) => { if (open) { fetchNotifications(); markNotificationsAsRead(); } }}>
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
                              className={`flex items-start gap-3 p-2.5 rounded-md transition-colors cursor-pointer hover:bg-muted ${!notification.is_read ? 'bg-primary/10' : 'bg-transparent'}`}
                            >
                              <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                              <div className="flex-1">
                                <p className="text-sm font-medium leading-tight">{notification.message}</p>
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
                        <p className="text-sm text-center text-muted-foreground py-10">لا توجد إشعارات جديدة.</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button variant="secondary" onClick={() => router.push('/')} className="shadow-lg transition-all hover:scale-105">
                <ArrowLeft className="ml-2 h-4 w-4" /> العودة للموقع
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-4">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-3 rounded-lg max-w-md transition-all hover:bg-white/15">
              <Avatar className="h-16 w-16 border-2 border-white/50 transition-all hover:scale-105">
                {originalProviderData.logo_url ? (
                  <AvatarImage
                    src={originalProviderData.logo_url}
                    alt={originalProviderData.business_name}
                    loading="lazy"
                    decoding="async"
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                  {originalProviderData.business_name?.charAt(0)?.toUpperCase() || 'خ'}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <h1 className="text-xl font-bold tracking-tight transition-all hover:scale-105" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
                  {originalProviderData.business_name}
                </h1>
                <p className="text-sm opacity-90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  لوحة تحكم مقدم الخدمة
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10 space-y-4" defaultValue="services">
            <TabsList className="h-auto p-2 rounded-xl border shadow-lg flex flex-col lg:flex-row gap-2 bg-card">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                <StatCard title="المتابعون" value={originalProviderData.followers_count || 0}>
                  <Users className="h-5 w-5 text-blue-500" />
                </StatCard>
                <StatCard title="الإعجابات" value={originalProviderData.total_likes_count || 0}>
                  <Heart className="h-5 w-5 text-red-500" />
                </StatCard>
                <StatCard title="التقييم" value={originalProviderData.rating ? originalProviderData.rating.toFixed(1) : 'N/A'}>
                  <Star className="h-5 w-5 text-yellow-500" />
                </StatCard>
                <StatCard title="الخدمات" value={services.length}>
                  <Wrench className="h-5 w-5 text-green-500" />
                </StatCard>
              </div>
              <div className="hidden lg:block border-l mx-2 self-stretch"></div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                <TabsTrigger value="services" className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted">
                  <Wrench className="h-4 w-4" />الخدمات
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted">
                  <TrendingUp className="h-4 w-4" />التقييمات
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted">
                  <Settings className="h-4 w-4" />الإعدادات
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted">
                  <ShoppingCart className="h-4 w-4" />الحجوزات
                </TabsTrigger>
                <TabsTrigger value="inbox" className="flex-1 p-3 rounded-lg border shadow-sm flex items-center justify-center gap-2 text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border-primary/20 text-foreground hover:bg-muted">
                  <MessageSquare className="h-4 w-4" />الرسائل
                </TabsTrigger>
              </div>
            </TabsList>

            <div className="bg-card p-4 rounded-xl border shadow-lg">
              <TabsContent value="services">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3 border-b pb-4">
                  <h2 className="text-2xl font-bold tracking-tight">خدماتي</h2>
                  <Button onClick={handleOpenAddServiceModal} className="w-full sm:w-auto transition-all hover:scale-105">
                    <Plus className="ml-2 h-4 w-4" /> إضافة خدمة جديدة
                  </Button>
                </div>
                {isLoadingServices ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {services.map(service => (
                      <ProductCard
                        key={service.id}
                        item={{
                          ...service,
                          sellers: service.service_providers
                        }}
                        allCategories={allCategories}
                        context="dashboard"
                        onEdit={() => {
                          onOpen('editService', {
                            service: service,
                            allCategories: allCategories,
                            onServiceUpdated: handleServiceUpdated
                          });
                        }}
                        onShare={(e) => {
                          e?.stopPropagation();
                          onOpen('shareModal', {
                            title: `مشاركة خدمة: ${service.name}`,
                            text: `تفضل بزيارة خدمتي: ${service.name} - ${service.description?.substring(0, 100)}...`,
                            url: `${window.location.origin}/services/${service.id}`,
                            image: (Array.isArray(service.images) && service.images.length > 0) ? service.images[0] : '/placeholder.svg'
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/50">
                    <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-xl font-medium">لم تقم بإضافة أي خدمات بعد</h3>
                    <p className="mt-2 text-gray-500">انقر على "إضافة خدمة جديدة" لبدء عرض مهاراتك.</p>
                    <Button className="mt-6 transition-all hover:scale-105" onClick={handleOpenAddServiceModal}>
                      <Plus className="ml-2 h-4 w-4" /> إضافة خدمة جديدة
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-2 border-b mb-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl tracking-tight">إعدادات الحساب</CardTitle>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button onClick={handleSaveChanges} disabled={isSaving} className="transition-all hover:scale-105">
                            {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                            حفظ التغييرات
                          </Button>
                          <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving} className="transition-all hover:scale-105">
                            <X className="ml-2 h-4 w-4" /> إلغاء
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)} className="transition-all hover:scale-105">
                          <Edit className="ml-2 h-4 w-4" /> تعديل
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <div className="border-b mb-6">
                    <div className="flex flex-wrap gap-2 px-2">
                      <Button variant="ghost" onClick={() => document.getElementById('basic-info')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm">
                        المعلومات الأساسية
                      </Button>
                      <Button variant="ghost" onClick={() => document.getElementById('expertise-info')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm">
                        التخصص والخبرة
                      </Button>
                      <Button variant="ghost" onClick={() => document.getElementById('schedule-info')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm">
                        أوقات العمل
                      </Button>
                      <Button variant="ghost" onClick={() => document.getElementById('contact-info')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm">
                        معلومات التواصل
                      </Button>
                      <Button variant="ghost" onClick={() => document.getElementById('business-info')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm">
                        معلومات النشاط
                      </Button>
                      <Button variant="ghost" onClick={() => document.getElementById('media-info')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm">
                        الوسائط
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-2 space-y-8">
                    {/* ========== القسم 1: المعلومات الأساسية ========== */}
                    <div id="basic-info" className="space-y-6 pt-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-4 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="businessName" className="font-semibold flex items-center gap-1">
                            الاسم المهني
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="businessName"
                            value={editableProviderData.business_name || ''}
                            onChange={(e) => handleInputChange("business_name", e.target.value)}
                            disabled={!isEditing}
                            className="transition-all hover:border-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="font-semibold">البريد الإلكتروني</Label>
                          <Input
                            value={user?.email || ''}
                            disabled
                            readOnly
                            className="bg-muted/50"
                          />
                          <p className="text-xs text-muted-foreground mt-1">لا يمكن تغيير البريد الإلكتروني</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="font-semibold">نبذة تعريفية</Label>
                        <Textarea
                          id="description"
                          value={editableProviderData.description || ""}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          disabled={!isEditing}
                          rows={4}
                          className="transition-all hover:border-primary"
                        />
                        <div className="flex justify-between">
                          <p className="text-xs text-muted-foreground">أخبر العملاء عن نفسك وخدماتك</p>
                          <span className="text-xs text-muted-foreground">
                            {editableProviderData.description?.length || 0}/500
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="years_of_experience" className="font-semibold">سنوات الخبرة</Label>
                          <Input
                            id="years_of_experience"
                            value={editableProviderData.years_of_experience || ""}
                            onChange={(e) => handleInputChange("years_of_experience", e.target.value)}
                            disabled={!isEditing}
                            placeholder="مثال: 5 سنوات"
                            type="text"
                          />
                          <p className="text-xs text-muted-foreground">
                            أدخل عدد السنوات كنص (مثال: "5 سنوات" أو "3-7 سنوات")
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city" className="font-semibold">المدينة</Label>
                          <Input
                            id="city"
                            value={editableProviderData.city || ""}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            disabled={!isEditing}
                            className="transition-all hover:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ========== القسم 2: التخصص والخبرة ========== */}
                    <div id="expertise-info" className="space-y-6 pt-8 border-t">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-4 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-semibold">التخصص والخبرة</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialization" className="font-semibold">التخصص</Label>
                          <Input
                            id="specialization"
                            value={editableProviderData.specialization || ""}
                            onChange={(e) => handleInputChange("specialization", e.target.value)}
                            disabled={!isEditing}
                            placeholder="مثال: تصليح أجهزة التكييف، تصميم جرافيك"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="qualifications" className="font-semibold">المؤهلات</Label>
                          <Textarea
                            id="qualifications"
                            value={editableProviderData.qualifications || ""}
                            onChange={(e) => handleInputChange("qualifications", e.target.value)}
                            disabled={!isEditing}
                            rows={2}
                            placeholder="المؤهلات الأكاديمية أو الدورات التدريبية"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="certifications" className="font-semibold">الشهادات</Label>
                          <Textarea
                            id="certifications"
                            value={editableProviderData.certifications || ""}
                            onChange={(e) => handleInputChange("certifications", e.target.value)}
                            disabled={!isEditing}
                            rows={2}
                            placeholder="الشهادات المهنية أو الرخصة التجارية"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ========== القسم 3: أوقات العمل ========== */}
                    <div id="schedule-info" className="space-y-6 pt-8 border-t">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-4 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-semibold">أوقات العمل</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="availability" className="font-semibold">وقت العمل</Label>
                          <Input
                            id="availability"
                            value={editableProviderData.availability || ""}
                            onChange={(e) => handleInputChange("availability", e.target.value)}
                            disabled={!isEditing}
                            placeholder="مثال: من 9 صباحاً إلى 6 مساءً"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="font-semibold">أيام العمل</Label>
                          <div className="flex flex-wrap gap-2">
                            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                              <Button
                                key={day}
                                type="button"
                                variant={(editableProviderData.working_days || []).includes(day) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (!isEditing) return;
                                  const currentDays = editableProviderData.working_days || [];
                                  const newDays = currentDays.includes(day)
                                    ? currentDays.filter(d => d !== day)
                                    : [...currentDays, day];
                                  handleInputChange("working_days", newDays);
                                }}
                                disabled={!isEditing}
                              >
                                {day}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 font-bold text-xl">!</span>
                            </div>
                            <div>
                              <p className="font-medium">خدمة الطوارئ</p>
                              <p className="text-sm text-muted-foreground">متاح للعمل في أي وقت</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editableProviderData.emergency_service || false}
                              onCheckedChange={(checked) => handleInputChange("emergency_service", checked)}
                              disabled={!isEditing}
                            />
                            <span className="text-sm">
                              {editableProviderData.emergency_service ? 'مفعلة' : 'غير مفعلة'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ========== القسم 4: معلومات التواصل ========== */}
                    <div id="contact-info" className="space-y-6 pt-8 border-t">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-4 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-semibold">معلومات التواصل</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="country" className="font-semibold">الدولة</Label>
                          <Input
                            id="country"
                            value={getCountryInArabic(editableProviderData.country || '')}
                            disabled
                            readOnly
                            className="bg-muted/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city" className="font-semibold">المدينة</Label>
                          <Input
                            id="city"
                            value={editableProviderData.city || ""}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            disabled={!isEditing}
                            className="transition-all hover:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">أرقام الهاتف</Label>
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addPhoneNumber}
                              className="h-8 text-xs"
                            >
                              <Plus className="ml-1 h-3 w-3" /> إضافة رقم
                            </Button>
                          )}
                        </div>

                        {(editableProviderData.phone_numbers || []).map((p: any) => (
                          <div key={p.id} className="flex flex-col sm:flex-row items-center gap-2">
                            <Select
                              value={p.type}
                              onValueChange={(v) => handlePhoneNumberChange(p.id, 'type', v)}
                              disabled={!isEditing}
                              dir="rtl"
                            >
                              <SelectTrigger className="w-full sm:w-[140px] transition-all hover:border-primary">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="whatsapp">واتساب</SelectItem>
                                <SelectItem value="mobile">جوال</SelectItem>
                                <SelectItem value="landline">هاتف ثابت</SelectItem>
                              </SelectContent>
                            </Select>

                            <Input
                              type="tel"
                              value={p.number || ''}
                              onChange={(e) => handlePhoneNumberChange(p.id, 'number', e.target.value)}
                              disabled={!isEditing}
                              className="flex-1 min-w-[150px] transition-all hover:border-primary"
                              dir="ltr"
                              placeholder="مثال: 05XXXXXXXX"
                            />

                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePhoneNumber(p.id)}
                                className="transition-all hover:scale-110 hover:bg-red-500/10"
                                title="حذف الرقم"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}

                        {(editableProviderData.phone_numbers || []).length === 0 && !isEditing && (
                          <div className="text-center py-4 border border-dashed rounded-lg bg-muted/30">
                            <Phone className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">لا توجد أرقام هاتف مضافة</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ========== القسم 5: معلومات النشاط ========== */}
                    <div id="business-info" className="space-y-6 pt-8 border-t">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-4 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-semibold">معلومات النشاط</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category" className="font-semibold">النشاط التجاري الرئيسي</Label>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Button
                              id="category"
                              variant="outline"
                              className="w-full justify-between font-normal transition-all hover:border-primary"
                              onClick={() => setCategoryPickerOpen(true)}
                            >
                              <span>{getCategoryNameById(getCategoryId(editableProviderData.category_id))}</span>
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <Input
                            id="category"
                            value={getCategoryNameById(getCategoryId(originalProviderData.category_id))}
                            disabled
                            readOnly
                            className="bg-muted/50"
                          />
                        )}
                        {originalProviderData.category_id && (
                          <p className="text-xs text-gray-500 mt-1">المعرف: {getCategoryId(originalProviderData.category_id)}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <Label className="font-semibold">نوع النشاط</Label>
                        <RadioGroup
                          value={editableProviderData.store_type || 'online'}
                          onValueChange={(v) => handleInputChange("store_type", v)}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                          disabled={!isEditing}
                        >
                          <Label className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${editableProviderData.store_type === 'online' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'}`}>
                            <RadioGroupItem value="online" />
                            <div className="flex items-center gap-2">
                              <Globe className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="font-medium">عبر الإنترنت فقط</p>
                                <p className="text-xs text-muted-foreground">خدمات رقمية وعن بُعد</p>
                              </div>
                            </div>
                          </Label>

                          <Label className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${editableProviderData.store_type === 'physical' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'}`}>
                            <RadioGroupItem value="physical" />
                            <div className="flex items-center gap-2">
                              <Store className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-medium">لدي مقر فعلي</p>
                                <p className="text-xs text-muted-foreground">حضوري أو زيارة موقع</p>
                              </div>
                            </div>
                          </Label>
                        </RadioGroup>

                        {editableProviderData.store_type === 'physical' && (
                          <div className="space-y-2 mt-4">
                            <Label htmlFor="physicalAddress" className="font-semibold">العنوان الفعلي</Label>
                            <Textarea
                              id="physicalAddress"
                              value={editableProviderData.physical_address || ""}
                              onChange={(e) => handleInputChange("physical_address", e.target.value)}
                              disabled={!isEditing}
                              rows={2}
                              className="transition-all hover:border-primary"
                              placeholder="اكتب العنوان الكامل للمقر..."
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ========== القسم 6: الوسائط ========== */}
                    <div id="media-info" className="space-y-6 pt-8 border-t">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-4 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-semibold">الوسائط</h3>
                      </div>

                      <div className="space-y-6">
                        {/* صورة الملف الشخصي */}
                        <div className="space-y-4">
                          <Label className="font-semibold">صورة الملف الشخصي</Label>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="relative">
                              <Avatar className="h-24 w-24 border-4 border-background shadow-lg transition-all hover:scale-105">
                                <AvatarImage src={editableProviderData.logo_url || undefined} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                  {editableProviderData.business_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {isEditing && (
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="absolute -bottom-2 -right-2 rounded-full h-9 w-9 shadow-md transition-all hover:scale-110"
                                  onClick={() => logoInputRef.current?.click()}
                                >
                                  <Camera className="h-4 w-4" />
                                </Button>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                ref={logoInputRef}
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                            </div>

                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-muted-foreground">
                                هذه الصورة تظهر في صفحتك الشخصية وفي جميع خدماتك
                              </p>
                              {isEditing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => logoInputRef.current?.click()}
                                  className="mt-2"
                                >
                                  <Upload className="ml-2 h-4 w-4" />
                                  {editableProviderData.logo_url ? 'تغيير الصورة' : 'رفع صورة'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* صورة الغلاف */}
                        <div className="space-y-4">
                          <Label className="font-semibold">صورة الغلاف</Label>
                          <div className="space-y-3">
                            <div className="w-full h-40 rounded-lg border bg-muted flex items-center justify-center overflow-hidden transition-all hover:border-primary">
                              {editableProviderData.store_image_url ? (
                                <img
                                  src={editableProviderData.store_image_url}
                                  alt="صورة الغلاف"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-center">
                                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">لا توجد صورة غلاف</p>
                                </div>
                              )}
                            </div>

                            {isEditing && (
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => storeImageInputRef.current?.click()}
                                  className="flex-1"
                                >
                                  <Upload className="ml-2 w-4 h-4" />
                                  {editableProviderData.store_image_url ? 'تغيير الصورة' : 'رفع صورة غلاف'}
                                </Button>
                                {editableProviderData.store_image_url && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleInputChange("store_image_url", null)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="ml-2 w-4 h-4" />
                                    حذف
                                  </Button>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleStoreImageUpload}
                                  className="hidden"
                                  ref={storeImageInputRef}
                                />
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              صورة الغلاف تظهر في أعلى صفحتك الشخصية (اختياري)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-2 border-b mb-6">
                    <CardTitle className="text-2xl tracking-tight">جميع التقييمات ({unifiedReviews.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    {(isLoadingServiceReviews || isLoadingProviderReviews) ? (
                      <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      </div>
                    ) : unifiedReviews.length > 0 ? (
                      <div className="space-y-6">
                        {unifiedReviews.map(review => (
                          <div key={review.id} className="flex items-start gap-4 transition-all hover:bg-muted/50 p-3 rounded-lg">
                            <Avatar className="mt-1 transition-all hover:scale-110">
                              <AvatarImage src={review.userAvatarUrl || undefined} />
                              <AvatarFallback>{review.userName?.charAt(0) || 'ع'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted/50 rounded-lg p-4 transition-all hover:bg-muted">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{review.userName}</h4>
                                  {review.rating && (
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < review.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {review.type === 'service' ? (
                                  <>تقييم على خدمة: <span className="font-medium">{review.serviceName || 'غير محدد'}</span></>
                                ) : (
                                  <span className="font-medium text-primary">تقييم على حسابك</span>
                                )}
                              </p>
                              <p className="mt-2 text-sm text-foreground leading-relaxed">{review.comment}</p>
                              {review.type === 'service' && (() => {
                                const replies = serviceRepliesMap[review.id] || [];
                                const canReply = replies.length === 0;
                                return (
                                  <>
                                    {replies.length > 0 && (
                                      <div className="mt-4 ml-4 p-3 bg-background rounded-lg border-l-4 border-primary/50 transition-all hover:border-primary">
                                        {replies.map(reply => (
                                          <div key={reply.id} className="flex items-start gap-3">
                                            <Avatar className="h-8 w-8 transition-all hover:scale-110">
                                              <AvatarImage src={reply.user_avatar_url || undefined} />
                                              <AvatarFallback>{reply.user_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between">
                                                <h5 className="font-semibold text-sm">{reply.user_name}</h5>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-red-500 hover:bg-red-500/10 transition-all hover:scale-110"
                                                  onClick={() => handleDeleteReply(reply.id)}
                                                  title="حذف الرد"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <p className="text-sm text-foreground">{reply.comment}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {replyingTo !== review.id && canReply && (
                                      <div className="mt-3">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => { setReplyingTo(review.id); setReplyComment(''); }}
                                          className="transition-all hover:scale-105"
                                        >
                                          <MessageSquare className="ml-2 h-4 w-4" /> رد
                                        </Button>
                                      </div>
                                    )}
                                    {replyingTo === review.id && (
                                      <div className="mt-4 space-y-2">
                                        <Textarea
                                          placeholder={`اكتب ردك على ${review.userName}...`}
                                          value={replyComment}
                                          onChange={(e) => setReplyComment(e.target.value)}
                                          disabled={isSubmittingReply}
                                          className="transition-all hover:border-primary"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleReplySubmit(review.rawServiceReview!)}
                                            disabled={isSubmittingReply}
                                            className="transition-all hover:scale-105"
                                          >
                                            {isSubmittingReply ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
                                            إرسال الرد
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setReplyingTo(null)}
                                            disabled={isSubmittingReply}
                                            className="transition-all hover:scale-105"
                                          >
                                            إلغاء
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/50">
                        <Star className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-xl font-medium">لا توجد تقييمات بعد</h3>
                        <p className="mt-2 text-gray-500">لم يقم أي عميل بترك تقييم حتى الآن.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <div className="text-center py-20 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">قسم الحجوزات قيد الإنشاء</h3>
                  <p className="text-gray-600">سيتم إضافة هذه الميزة قريباً</p>
                </div>
              </TabsContent>

              <TabsContent value="inbox">
                <h2 className="text-2xl font-bold tracking-tight mb-4">الرسائل</h2>
                <OwnerChatInbox
                  ownerId={providerAuthId}
                  role="provider"
                  entities={services.map((s: any) => ({ id: s.id, name: s.name }))}
                />
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
          initialParentId={2}
          stopAtLevel={2}
          onSelect={(selectedCategory) => {
            if (typeof selectedCategory !== 'string') {
              handleInputChange("category_id", [String(selectedCategory.id)]);
              toast.success(`تم تحديث النشاط التجاري إلى: ${selectedCategory.name}`);
            }
            setCategoryPickerOpen(false);
          }}
        />
      )}
    </>
  );
}

export default ServiceDashboard;
