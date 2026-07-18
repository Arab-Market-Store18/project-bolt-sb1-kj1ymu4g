// المسار: components/Banner/PromoBanner.tsx
// -- النسخة النهائية الكاملة (الحقيقية) --

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";

// واجهة لضمان سلامة أنواع البيانات القادمة من Supabase
interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  target_link: string | null;
}

export function PromoBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { onOpen } = useModal();

  // 1. جلب البيانات الحقيقية من Supabase
  useEffect(() => {
    const fetchBanners = async () => {
      const supabase = createSupabaseBrowserClient();
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('banner_requests')
        .select('id, title, description, image_url, target_link')
        .eq('status', 'approved')
        .eq('is_paid', true)
        .gte('expires_at', new Date().toISOString()) // يجلب الإعلانات التي لم تنتهِ صلاحيتها بعد
        .order('created_at', { ascending: false });

      if (error) {
        // في حالة الخطأ، نعرض البانر فارغًا بدلاً من التوقف
        setBanners([]); 
      } else {
        setBanners(data);
      }
      setIsLoading(false);
    };

    fetchBanners();
  }, []); // يعمل مرة واحدة عند تحميل المكون

  // 2. التحكم في التبديل التلقائي للشرائح
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 7000); // مدة أطول قليلاً لإعطاء فرصة للقراءة
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const prevSlide = () => {
    if (banners.length > 1) {
      setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }
  };

  const nextSlide = () => {
    if (banners.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }
  };
  
  // 3. عرض حالة التحميل (Loading State)
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 mt-4">
        <div className="w-full h-[300px] md:h-[350px] bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  // 4. عرض حالة عدم وجود إعلانات (Empty State)
  if (banners.length === 0) {
    return (
      <div className="container mx-auto px-4 mt-4">
        <div className="w-full h-[300px] md:h-[350px] bg-gray-100 dark:bg-gray-900 rounded-lg flex flex-col items-center justify-center text-center p-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">مساحة إعلانية مميزة</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">كن أول من يعلن هنا ويصل إلى آلاف الزوار!</p>
          <Button className="mt-6" onClick={() => onOpen('requestBannerAd')}>
            اطلب إعلانك الآن
          </Button>
        </div>
      </div>
    );
  }

  // 5. عرض البانرات الحقيقية
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4 container mx-auto px-4">
      <div className="lg:col-span-3 relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 shadow-lg">
        <div className="relative h-[300px] md:h-[350px]">
          {banners.map((banner, index) => (
            <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${ index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0" }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 items-center h-full gap-8 px-8 py-12">
                <div className="text-center md:text-right z-10">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>{banner.title}</h2>
                  <p className="mt-4 text-lg text-gray-700 dark:text-gray-300" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>{banner.description}</p>
                  {banner.target_link && (
                    <Button size="lg" className="mt-8 bg-blue-600 hover:bg-blue-700 transition-transform hover:scale-105" asChild>
                      <Link href={banner.target_link} target="_blank" rel="noopener noreferrer">تسوق الآن</Link>
                    </Button>
                  )}
                </div>
                <div className="absolute inset-0">
                  <Image src={banner.image_url} alt={banner.title} fill className="object-cover" priority={index === 0} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 900px" />
                  <div className="absolute inset-0 bg-gradient-to-l from-gray-100/30 via-gray-100/10 to-transparent dark:from-gray-900/40 dark:via-gray-900/20 md:bg-gradient-to-r" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {banners.length > 1 && (
          <>
            <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/30 text-white rounded-full p-2 z-20" onClick={prevSlide}><ChevronLeft className="h-6 w-6" /></Button>
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/30 text-white rounded-full p-2 z-20" onClick={nextSlide}><ChevronRight className="h-6 w-6" /></Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
              {banners.map((_, index) => (
                <button key={index} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-white scale-125" : "bg-white/50"}`} onClick={() => setCurrentSlide(index)} aria-label={`Go to slide ${index + 1}`}></button>
              ))}
            </div>
          </>
        )}
        <Button className="absolute bottom-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1 h-auto z-20 transition-transform hover:scale-105" onClick={() => onOpen('requestBannerAd')}>
          اطلب إعلانك هنا
        </Button>
      </div>
      <div className="lg:col-span-1">
        <div className="h-full min-h-[250px] lg:min-h-full bg-gray-100 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">مساحة إعلانية</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">إعلانات جوجل والشركات</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm">احجز مساحتك الآن</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
