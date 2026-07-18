// المسار: features/merchant/profile-merchant/components/layout/ProfileMerchantPageSkeleton.tsx


import { Loader2 } from "lucide-react";

export const ProfileMerchantPageSkeleton = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
};