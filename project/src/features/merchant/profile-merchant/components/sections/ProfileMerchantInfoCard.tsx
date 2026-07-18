// features/merchant/profile-merchant/components/sections/ProfileMerchantInfoCard.tsx


import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Users, Share2, Loader2 } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useFitText } from '../../hooks/useFitText';
import { toggleFollowSeller } from '../../actions/profile-merchant.actions';
import { generateShareUrl } from '../../utils/formatters';

export const ProfileMerchantInfoCard = ({ seller }: { seller: any }) => {
  const { onOpen } = useModal();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const coverImageUrl = seller.store_image_url || '/placeholder-cover.jpg';
  const nameContainerRef = useRef<HTMLDivElement>(null);
  const nameTextRef = useRef<HTMLHeadingElement>(null);
  
  useFitText({ containerRef: nameContainerRef, textRef: nameTextRef });

  const { mutate: toggleFollow, isPending: isTogglingFollow } = useMutation({
    mutationFn: () => toggleFollowSeller(seller.id, seller.isFollowing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile-core', seller.id] });
    },
    onError: (error: any) => {
      // عرض نافذة التسجيل فقط إذا لم يكن المستخدم مسجلاً
      if (!isLoggedIn && (error.message.includes("JWT") || error.message.includes("Unauthorized"))) {
        onOpen('emailSignUp');
      } else {
        toast({
          title: "حدث خطأ",
          description: "لم نتمكن من إتمام العملية.",
          variant: "destructive",
        });
      }
    },
  });

  const handleFollowClick = () => {
    // انتظار انتهاء تحميل الجلسة قبل التفاعل
    if (isAuthLoading) return;
    // إذا لم يكن مسجلاً → نافذة التسجيل
    if (!isLoggedIn) { onOpen('emailSignUp'); return; }
    toggleFollow();
  };

  const handleShare = async () => {
    const shareUrl = generateShareUrl(seller.id);
    const shareData = { 
      title: `Browse ${seller.business_name} store on Arab Market`, 
      text: `I found this great store "${seller.business_name}" on Arab Market platform. Visit it!`, 
      url: shareUrl 
    };
    
    if (navigator.share) { 
      await navigator.share(shareData).catch(e => console.error(e)); 
    } else { 
      await navigator.clipboard.writeText(shareUrl)
        .then(() => alert("Store link copied!"))
        .catch(() => alert("Failed to copy link.")); 
    }
  };

  return (
    <div className="relative text-white rounded-t-lg overflow-hidden">
      <img 
        src={coverImageUrl} 
        alt={`Store cover for ${seller.business_name}`} 
        className="w-full h-48 md:h-64 object-cover" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
        <div></div>
        <div className="flex items-end gap-4">
          <Avatar className="h-20 w-20 md:h-28 md:w-28 border-4 border-background shadow-lg flex-shrink-0">
            <AvatarImage src={seller.logo_url} alt={`Store logo for ${seller.business_name}`} />
            <AvatarFallback className="text-4xl">{seller.business_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div ref={nameContainerRef} className="md:hidden bg-black/50 p-2 rounded-md mb-2 overflow-hidden">
              <h1 ref={nameTextRef} className="text-xl font-bold text-center whitespace-nowrap text-white">
                {seller.business_name}
              </h1>
            </div>
            <h1 
              className="hidden md:block text-2xl md:text-3xl font-bold truncate !text-white" 
              title={seller.business_name}
            >
              {seller.business_name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs md:text-sm text-gray-200">
              <div 
                className="flex items-center gap-1.5 bg-sky-brand px-2 py-1 rounded-md" 
                title="Total likes on all products"
              >
                <Heart className="h-4 w-4 text-red-400" />
                <span>{(seller.total_likes_count ?? 0).toLocaleString()} total likes</span>
              </div>
              <div 
                className="flex items-center gap-1.5 bg-sky-brand px-2 py-1 rounded-md" 
                title="Number of followers"
              >
                <Users className="h-4 w-4" />
                <span>{(seller.followers_count ?? 0).toLocaleString()} followers</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 items-center">
            <Button 
              variant={seller.isFollowing ? "secondary" : "default"} 
              size="sm" 
              onClick={handleFollowClick} 
              disabled={isTogglingFollow} 
              className="w-32"
            >
              {isTogglingFollow ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Users className="ml-2 h-4 w-4" />}
              {seller.isFollowing ? "Unfollow" : "Follow"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare} 
              className="bg-white/20 border-white/30 hover:bg-white/30 text-white"
            >
              <Share2 className="ml-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
