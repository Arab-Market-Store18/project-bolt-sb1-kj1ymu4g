"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Users, Share2, Loader2, Star } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { SellerData } from '../types/profile-merchant.types';

interface ProfileMerchantHeaderProps {
  seller: SellerData;
}

export const ProfileMerchantHeader = ({ seller }: ProfileMerchantHeaderProps) => {
  const { onOpen } = useModal();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const supabase = createSupabaseBrowserClient();
  
  const coverImageUrl = seller.store_image_url || '/placeholder-cover.jpg';
  const logoInitial = seller.business_name?.charAt(0) || 'م';

  const { mutate: toggleFollow, isPending: isTogglingFollow } = useMutation({
    mutationFn: async (isCurrentlyFollowing: boolean) => {
      const functionName = isCurrentlyFollowing ? 'unfollow_seller' : 'follow_seller';
      const params = isCurrentlyFollowing 
        ? { seller_id_to_unfollow: seller.id } 
        : { seller_id_to_follow: seller.id };
      
      const { error } = await supabase.rpc(functionName, params);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['seller-profile-core', seller.id] 
      });
    },
    onError: (error: any) => {
      // عرض نافذة التسجيل فقط إذا لم يكن المستخدم مسجلاً
      if (!isLoggedIn && (error.message.includes("JWT") || error.message.includes("Unauthorized"))) {
        onOpen('emailSignUp');
      } else {
        toast({ 
          title: "حدث خطأ", 
          description: "لم نتمكن من إتمام العملية.", 
          variant: "destructive" 
        });
      }
    },
  });

  const handleFollowClick = () => {
    // انتظار انتهاء تحميل الجلسة قبل التفاعل
    if (isAuthLoading) return;
    // إذا لم يكن مسجلاً → نافذة التسجيل
    if (!isLoggedIn) { onOpen('emailSignUp'); return; }
    toggleFollow(seller.isFollowing);
  };
  
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/seller/${seller.id}`;
    const shareData = { 
      title: `تصفح منتجات ${seller.business_name}`, 
      text: `اكتشفت منتجات رائعة من "${seller.business_name}" على منصة سوق العرب.`, 
      url: shareUrl 
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "تم النسخ!",
          description: "تم نسخ رابط المتجر إلى الحافظة",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل نسخ الرابط",
          variant: "destructive"
        });
      }
    }
  };

{/* إحصائيات المتجر - خلفية سوداء غير شفافة */}
<div className="flex flex-wrap items-center gap-2 mt-3">
  {/* إجمالي الإعجابات */}
  <div 
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black border border-gray-700 shadow-2xl"
    title="إجمالي الإعجابات على المنتجات"
  >
    <Heart className="h-4 w-4 text-red-400" />
    <span className="text-white font-semibold text-sm">
      {(seller.total_likes_count ?? 0).toLocaleString()} إعجاب
    </span>
  </div>
  
  {/* عدد المتابعين */}
  <div 
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black border border-gray-700 shadow-2xl"
    title="عدد المتابعين"
  >
    <Users className="h-4 w-4 text-gray-300" />
    <span className="text-white font-semibold text-sm">
      {(seller.followers_count ?? 0).toLocaleString()} متابع
    </span>
  </div>
</div>

{/* أزرار الإجراءات - خلفية سوداء غير شفافة */}
<div className="flex flex-col-reverse sm:flex-row gap-3 items-center">
  {/* زر المتابعة */}
  <Button 
    variant={seller.isFollowing ? "secondary" : "default"} 
    size="sm" 
    onClick={handleFollowClick} 
    disabled={isTogglingFollow} 
    className="w-32 min-w-32 bg-black hover:bg-gray-900 border-gray-700 text-white font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300"
  >
    {isTogglingFollow ? (
      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
    ) : (
      <Users className="ml-2 h-4 w-4" />
    )}
    {seller.isFollowing ? "إلغاء المتابعة" : "متابعة"}
  </Button>
  
  {/* زر المشاركة */}
  <Button 
    variant="outline" 
    size="sm" 
    onClick={handleShare} 
    className="bg-black hover:bg-gray-900 border-gray-700 text-white font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300"
  >
    <Share2 className="ml-2 h-4 w-4" />
    مشاركة المتجر
  </Button>
</div>
return (
  <div className="relative text-white rounded-t-lg overflow-hidden shadow-lg">
    {/* صورة الغلاف */}
    <img 
      src={coverImageUrl} 
      alt={`صورة غلاف متجر ${seller.business_name}`} 
      className="w-full h-48 md:h-64 object-cover" 
      onError={(e) => {
        e.currentTarget.src = '/placeholder-cover.jpg';
      }}
    />
    
    {/* طبقة تدرج لوني خفيفة جداً فقط للأسفل */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
    
    {/* محتوى الهيدر */}
    <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
      {/* مساحة علوية فارغة */}
      <div></div>
      
      {/* المحتوى الرئيسي */}
      <div className="flex items-end gap-4">
        {/* صورة الشعار */}
        <Avatar className="h-20 w-20 md:h-28 md:w-28 border-4 border-white/30 shadow-2xl backdrop-blur-sm flex-shrink-0 bg-black/80 mb-4">
          <AvatarImage 
            src={seller.logo_url} 
            alt={`شعار ${seller.business_name}`}
            onError={(e) => {
              e.currentTarget.src = '';
            }}
          />
          <AvatarFallback className="text-4xl bg-primary/90 backdrop-blur-sm text-primary-foreground">
            {logoInitial}
          </AvatarFallback>
        </Avatar>
        
        {/* معلومات المتجر */}
        <div className="flex-1 min-w-0">
          {/* اسم التاجر مع إطار أبيض مميز */}
          <div className="relative inline-block mb-3">
            {/* خلفية زجاجية مع إطار */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-xl border-2 border-white/25 -m-1"></div>
            
            {/* النص */}
            <h1 className="relative px-5 py-3 text-2xl md:text-3xl font-bold truncate !text-white drop-shadow-2xl" title={seller.business_name}>
              {seller.business_name}
            </h1>
          </div>
          
          {/* إحصائيات المتجر - خلفية داكنة قوية */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* متوسط التقييم */}
            {!!seller.rating && (
              <button
                type="button"
                onClick={() => document.getElementById('reviews-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-black/90 border border-gray-600/80 shadow-2xl hover:bg-black transition-colors cursor-pointer"
                title="الانتقال إلى تقييمات العملاء"
              >
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold text-sm">
                  {Number(seller.rating).toFixed(1)}
                </span>
              </button>
            )}

            {/* إجمالي الإعجابات */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-black/90 border border-gray-600/80 shadow-2xl"
              title="إجمالي الإعجابات على المنتجات"
            >
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-white font-semibold text-sm">
                {(seller.total_likes_count ?? 0).toLocaleString()} إعجاب
              </span>
            </div>
            
            {/* عدد المتابعين */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl bg-black/90 border border-gray-600/80 shadow-2xl"
              title="عدد المتابعين"
            >
              <Users className="h-4 w-4 text-gray-300" />
              <span className="text-white font-semibold text-sm">
                {(seller.followers_count ?? 0).toLocaleString()} متابع
              </span>
            </div>
          </div>
        </div>
        
        {/* أزرار الإجراءات - نفس خلفية الإيقونات الداكنة */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 items-center">
          {/* زر المتابعة */}
          <Button 
            variant={seller.isFollowing ? "secondary" : "default"} 
            size="sm" 
            onClick={handleFollowClick} 
            disabled={isTogglingFollow} 
            className="w-32 min-w-32 backdrop-blur-xl bg-black/90 hover:bg-black/95 border border-white/20 text-white font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            {isTogglingFollow ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Users className="ml-2 h-4 w-4" />
            )}
            {seller.isFollowing ? "إلغاء المتابعة" : "متابعة"}
          </Button>
          
          {/* زر المشاركة */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare} 
            className="w-32 min-w-32 backdrop-blur-xl bg-black/90 hover:bg-black/95 border border-white/20 text-white font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            <Share2 className="ml-2 h-4 w-4" />
            مشاركة المتجر
          </Button>
        </div>
      </div>
    </div>
  </div>
);
};