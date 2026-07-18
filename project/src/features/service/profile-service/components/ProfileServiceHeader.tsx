// features/service/profile-service/components/ProfileServiceHeader.tsx
"use client";

// ==================== التعديل الأساسي هنا ====================
import { useActionState } from 'react'; // <-- تم التغيير من 'react-dom' و useFormState
import { useFormStatus } from 'react-dom';
// ==========================================================

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Users, Share2, Loader2 } from "lucide-react";
import { CldImage } from 'next-cloudinary';
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/components/ui/use-toast";
import type { ProviderData } from '../types/profile-service.types';

// واجهة الخصائص لم تتغير
interface ProfileServiceHeaderProps {
  provider: ProviderData;
  isFollowing: boolean;
  followersCount: number;
  followAction: (
    prevState: { success: boolean; isFollowing: boolean; followersCount: number },
    formData: FormData
  ) => Promise<{ success: boolean; isFollowing: boolean; followersCount: number }>;
}

// مكون الزر لم يتغير
function FollowSubmitButton({ isFollowing }: { isFollowing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit"
      variant={isFollowing ? "secondary" : "default"} 
      size="sm" 
      disabled={pending}
      className="w-32"
    >
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      <Users className="ml-2 h-4 w-4" />
      {pending ? 'جاري...' : (isFollowing ? "إلغاء المتابعة" : "متابعة")}
    </Button>
  );
}


export const ProfileServiceHeader = ({ 
  provider, 
  isFollowing, 
  followersCount,
  followAction 
}: ProfileServiceHeaderProps) => {
  const { onOpen } = useModal();
  const { toast } = useToast();
  const coverImageUrl = provider.store_image_url || '/placeholder-cover.jpg';

  const initialState = {
    success: false,
    isFollowing: isFollowing,
    followersCount: followersCount,
  };

  // ==================== التعديل الأساسي هنا ====================
  const [state, formAction] = useActionState(followAction, initialState); // <-- تم تغيير اسم الدالة
  // ==========================================================


  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/provider/${provider.id}`;
    const shareData = { 
      title: `تصفح خدمات ${provider.business_name}`, 
      text: `اكتشفت خدمات رائعة من "${provider.business_name}" على منصة سوق العرب.`, 
      url: shareUrl 
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Share cancelled or failed:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "تم النسخ", description: "تم نسخ رابط الملف الشخصي" });
      } catch (error) {
        toast({ title: "خطأ", description: "فشل نسخ الرابط", variant: "destructive" });
      }
    }
  };

  return (
    <div className="relative text-white rounded-t-lg overflow-hidden group">
      {coverImageUrl?.includes('cloudinary') && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
        <CldImage
          src={coverImageUrl}
          alt={`صورة غلاف ${provider.business_name}`}
          width={1920}
          height={480}
          className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
          quality={75}
          format="auto"
          sizes="100vw"
          priority
        />
      ) : (
        <img
          src={coverImageUrl}
          alt={`صورة غلاف ${provider.business_name}`}
          className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
          loading="eager"
          decoding="sync"
          onError={(e) => { e.currentTarget.src = '/placeholder-cover.jpg'; }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare} 
            className="bg-white/20 border-white/30 hover:bg-white/30 text-white"
          >
            <Share2 className="ml-2 h-4 w-4" />
            مشاركة
          </Button>
        </div>
        
        <div className="flex items-end gap-4">
          <Avatar className="h-20 w-20 md:h-28 md:w-28 border-4 border-background shadow-lg flex-shrink-0 transition-all hover:scale-105">
            {provider.logo_url ? (
              <AvatarImage
                src={provider.logo_url}
                alt={`شعار ${provider.business_name}`}
                loading="lazy"
                decoding="async"
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
              {provider.business_name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate !text-white" title={provider.business_name}>
              {provider.business_name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs md:text-sm text-gray-200">
              <div className="flex items-center gap-1.5 bg-sky-brand px-2 py-1 rounded-md" title="إجمالي الإعجابات على كل الخدمات">
                <Heart className="h-4 w-4 text-red-400" />
                <span suppressHydrationWarning>
                  {(provider.total_likes_count ?? 0).toString()} إجمالي الإعجابات
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-sky-brand px-2 py-1 rounded-md" title="عدد المتابعين">
                <Users className="h-4 w-4" />
                <span suppressHydrationWarning>
                  {state.followersCount.toString()} متابع
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 items-center">
            
            <form action={formAction}>
              <input type="hidden" name="providerId" value={provider.id} />
              <input type="hidden" name="isFollowing" value={String(state.isFollowing)} />
              
              <FollowSubmitButton isFollowing={state.isFollowing} />
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};
