//  features/merchant/profile-merchant/components/sections/ProfileMerchantTrust.tsx


import { ShieldCheck } from "lucide-react";

export const ProfileMerchantTrust = ({ features }: { features: string[] | null }) => {
  if (!features || features.length === 0) return null;

  return (
    <section className="bg-muted p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Why buy from us?</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-2xl">{["?", "??", "??"][i % 3]}</span>
            <span className="font-medium text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
