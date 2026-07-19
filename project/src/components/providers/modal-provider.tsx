//components/providers/modal-provider.tsx


"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/hooks/use-modal"; 

// --- استيرادات المودالات ---
import { EmailSignUpModal } from "@/components/modals/EmailSignUpModal";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { RegistrationOptionsModal } from "@/components/registration-options-modal";
import { ReloginModal } from "@/components/relogin-modal";
import { PublicProductView } from "@/features/merchant/product-view/PublicProductView";
import { ProfileMerchantPage } from "@/features/merchant/profile-merchant";
import { MerchantRegistrationModal } from "@/features/merchant/management/components/MerchantRegistrationModal";
import { EditServiceModal } from "@/features/service/management/components/EditServiceModal";
import { AddServiceModal } from "@/features/service/management/components/AddServiceModal";
import  ProfileServicePage  from '@/features/service/profile-service/ProfileServicePage';
import { AddProductModal } from "@/features/merchant/management/components/AddProductModal";
import { EditProductModal } from "@/components/edit-product-modal";
import { BannerRequestModal } from "@/components/modals/BannerRequestModal";
import { ContentModal } from "@/components/modals/content-modal";
// ✅ أضف هذا الاستيراد
import { ShareModal } from "@/components/ShareModal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { type, data, isOpen, onClose } = useModal();

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || !isOpen) { return null; }

  switch (type) {
    case 'emailSignUp': return <EmailSignUpModal />;
    case 'mediaViewer': return <VideoPlayerModal isOpen={isOpen} onClose={onClose} media={data?.media} startIndex={data?.startIndex} />;
    case 'registrationOptions': return <RegistrationOptionsModal />;
    case 'relogin': return <ReloginModal email={data?.email} />;
    case 'productView': return <PublicProductView isOpen={isOpen} onClose={onClose} initialProductId={data?.productId} />;
case 'sellerProfile': return <ProfileMerchantPage />;
    case 'sellerRegistration': return <SellerRegistrationModal isOpen={isOpen} onClose={onClose} registrationType={data?.registrationType} onSuccess={() => {}} />;
    case 'serviceView': return <PublicServiceView isOpen={isOpen} onClose={onClose} initialServiceId={data?.serviceId} />;
    case 'providerProfile': return <ProfileServicePage providerId={data?.providerId || ''} />;
    case 'serviceProviderRegistration': return <ServiceRegistrationModal 
    isOpen={isOpen} 
    onClose={onClose} 
    onSuccess={() => {
      window.location.href = '/service/dashboard'; // ⬅️ مباشرة
    }}
  />;
case 'addService': return <AddServiceModal 
  isOpen={isOpen}
  onClose={onClose}
  onProductAdded={data?.onProductAdded || (() => {})}
  sellerCountry={data?.sellerCountry || ''}
  sellerMainCategoryId={data?.sellerMainCategoryId || ''}
  sellerMainCategoryName={data?.sellerMainCategoryName || ''}
  allCategories={data?.allCategories || []}
/>;    case 'addProduct': return <AddProductModal 
                isOpen={isOpen} 
                onClose={onClose} 
                onProductAdded={data?.onProductAdded || (() => {})}
                sellerCountry={data?.sellerCountry || ''}
                sellerMainCategoryId={data?.sellerMainCategoryId || ""}
                sellerMainCategoryName={data?.sellerMainCategoryName || ""}
                allCategories={data?.allCategories || []}
             />;
    case 'editProduct': return <EditProductModal 
                isOpen={isOpen} 
                onClose={onClose} 
                productToEdit={data?.product} 
                onProductUpdated={data?.onProductUpdated || onClose}
                allCategories={data?.allCategories || []}
             />;
    case 'editService': return <EditServiceModal />;
    case 'requestBannerAd': return <BannerRequestModal />;
    case 'contentViewer': return <ContentModal />;
    // ✅ أضف هذا السطر الجديد
    case 'shareModal': return <ShareModal 
    isOpen={isOpen} 
    onClose={onClose} 
    shareData={data}  // ⬅️ بدون .shareData
  />;
    default:
      return null;
  }
};