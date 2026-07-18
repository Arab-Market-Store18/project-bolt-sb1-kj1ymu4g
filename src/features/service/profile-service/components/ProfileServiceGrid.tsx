// features/service/profile-service/components/ProfileServiceGrid.tsx
// -- شبكة عرض خدمات مقدم الخدمة - الإصدار النهائي 2026 --

"use client";

import { useQuery } from "@tanstack/react-query";
import { useInView } from 'react-intersection-observer';
import { Loader2, Settings } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useDragToScroll } from "@/hooks/useDragToScroll";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";

interface LazyServiceSectionProps {
  providerId: string;
}

const LazyServiceSection = ({ providerId }: LazyServiceSectionProps) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const { data: services, isLoading } = useQuery({
    queryKey: ['provider-services', providerId],
    queryFn: async ({ signal }) => {
      const supabase = createSupabaseBrowserClient();
      
      const { data, error } = await supabase
        .from('services')
        .select(`*, service_providers (business_name, logo_url)`)
        .eq('service_provider_id', providerId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .abortSignal(signal); // ربط signal مع Supabase
      
      if (error) throw error;
      return data;
    },
    enabled: inView,
    staleTime: 1000 * 60 * 5, // 5 دقائق
  });

  if (!inView) return <div ref={ref} style={{ minHeight: '200px' }} />;
  if (isLoading) return <div ref={ref} className="flex justify-center items-center h-48"><Loader2 className="animate-spin" /></div>;

  return <ProfileServiceGrid services={services || []} />;
};

export const ProfileServiceGrid = ({ services }: { services: any[] }) => {
  const scrollRef = useDragToScroll<HTMLDivElement>();

  if (!services || services.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <span>خدماتنا</span>
        </h2>
        <div className="text-center py-10 bg-muted rounded-lg">
          <p className="text-muted-foreground">لا توجد خدمات لعرضها حاليًا.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <span>خدماتنا</span>
      </h2>
      <div 
        ref={scrollRef} 
        className="flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing scrollbar-thin"
      >
        {services.filter(service => service).map((service) => (
          <div key={service.id} className="flex-shrink-0 w-48 md:w-72">
            <ProductCard 
              item={service} 
              context="seller-profile"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export { LazyServiceSection };