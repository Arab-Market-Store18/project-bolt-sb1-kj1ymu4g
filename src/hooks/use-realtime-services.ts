// المسار: hooks/use-realtime-services.ts
// -- نسخة معدلة من useRealtimeProducts للتعامل مع الخدمات مع useAuth --

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import type { Product, Service } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext'; // <-- إضافة استيراد useAuth

export function useRealtimeServices(sellerId: string | null) {
  const supabase = createSupabaseBrowserClient();
  const { user, isServiceProvider } = useAuth(); // <-- الحصول على المستخدم والتحقق من كونه مزود خدمة
  const [services, setServices] = useState<(Product | Service)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialServices = useCallback(async () => {
    if (!sellerId) {
      setIsLoading(false);
      setServices([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, sellers!inner(id, business_name, logo_url, country, phone_numbers)')
      .eq('seller_id', sellerId)
      .eq('product_type', 'SERVICE')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "خطأ في جلب الخدمات",
        description: error.message,
        variant: "destructive",
      });
      setServices([]);
    } else {
      setServices(data as Service[]);
    }
    setIsLoading(false);
  }, [sellerId, supabase, toast]);

  useEffect(() => {
    fetchInitialServices();
  }, [fetchInitialServices]);

  useEffect(() => {
    if (!sellerId) return;

    const channel = supabase
      .channel(`realtime-services-seller:${sellerId}`)
      .on<Service>(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'products', 
          filter: `seller_id=eq.${sellerId}` 
        },
        async (payload) => {
          const item = payload.new as Service;
          
          // فلتر مهم: تجاهل أي تحديث لا يخص الخدمات
          if (item.product_type !== 'SERVICE' && (payload.old as any)?.product_type !== 'SERVICE') {
            return;
          }

          console.log('Realtime SERVICE change received:', payload);
          
          // نحتاج لجلب بيانات البائع لأن Realtime لا يرجعها
          const { data: sellerData } = await supabase
              .from('sellers')
              .select('*')
              .eq('id', item.seller_id)
              .single();
          
          if (sellerData) {
              item.sellers = sellerData;
          }

          // تحديد ما إذا كان يجب إظهار الإشعار (فقط لصاحب الخدمة)
          const shouldShowToast = user && isServiceProvider && user.id === sellerId;

          if (payload.eventType === 'INSERT') {
            if (shouldShowToast) {
              toast({ title: "تمت إضافة خدمة جديدة", description: item.name });
            }
            setServices((prevServices) => [item, ...prevServices]);
          }

          if (payload.eventType === 'UPDATE') {
            if (shouldShowToast) {
              toast({ title: "تم تحديث الخدمة", description: item.name });
            }
            setServices((prevServices) =>
              prevServices.map((service) =>
                service.id === item.id ? item : service
              )
            );
          }

          if (payload.eventType === 'DELETE') {
            const deletedService = payload.old as Partial<Service>;
            if (shouldShowToast) {
              toast({ title: "تم حذف خدمة", variant: "destructive" });
            }
            setServices((prevServices) =>
              prevServices.filter((service) => service.id !== deletedService.id)
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to SERVICES channel for seller: ${sellerId}`);
        }
        if (status === 'CHANNEL_ERROR' || err) {
          console.error('Realtime channel error:', err);
          // إظهار الخطأ فقط لصاحب الخدمة
          if (user && isServiceProvider && user.id === sellerId) {
            toast({
              title: 'خطأ في اتصال التحديثات الفورية',
              description: 'قد لا يتم تحديث قائمة الخدمات تلقائيًا.',
              variant: 'destructive',
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, supabase, toast, fetchInitialServices, user, isServiceProvider]); // <-- إضافة user و isServiceProvider كمُتَبعِدات

  return { services, isLoadingServices: isLoading, setServices };
}