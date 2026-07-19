// المسار: features/service/service-view/components/sections/ServiceMediaGallery.tsx
// -- ملف جديد حسب الهيكل المنظم --


"use client";
import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share, Play } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Thumbs, FreeMode } from 'swiper/modules';
import { toast } from "sonner";
import { getOptimizedMediaUrl } from "@/lib/utils/cloudinary";

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
}

interface ServiceMediaGalleryProps {
  service: {
    id: string;
    name: string;
    images?: string[] | string | null;
    video_url?: string | null;
    discount_price?: number;
    price?: number;
  } | null;
  onLikeClick: () => void;
  onShareClick: () => void;
  isLiked: boolean;
}

export const ServiceMediaGallery = ({ 
  service, 
  onLikeClick, 
  onShareClick, 
  isLiked 
}: ServiceMediaGalleryProps) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // حساب الخصم
  const discountPercentage = useMemo(() => { 
    if (!service?.discount_price || !service.price) return 0; 
    return Math.round(((service.price - service.discount_price) / service.price) * 100); 
  }, [service]);

  // تحضير الوسائط
  const mediaItems = useMemo((): MediaItem[] => {
    if (!service) return [];
    const items: MediaItem[] = [];
    
    if (service.images) {
      const imageArray = Array.isArray(service.images) ? service.images : [service.images];
      imageArray.forEach(url => { 
        if (url && typeof url === 'string' && url.trim() !== '') { 
          items.push({ 
            type: 'image', 
            url: getOptimizedMediaUrl(url, 'image'), 
            thumbnail: getOptimizedMediaUrl(url, 'thumbnail') 
          }); 
        } 
      });
    }
    
    if (service.video_url) {
      const videoThumbnail = getOptimizedMediaUrl(service.video_url.replace(/\.\w+$/, '.jpg'), 'thumbnail');
      items.push({ 
        type: 'video', 
        url: getOptimizedMediaUrl(service.video_url, 'video'), 
        thumbnail: videoThumbnail 
      });
    }
    
    if (items.length === 0) { 
      items.push({ 
        type: 'image', 
        url: '/placeholder.svg', 
        thumbnail: '/placeholder.svg' 
      }); 
    }
    
    return items;
  }, [service]);

  // لا حاجة لتغيير الكود - يعمل كما هو
  return (
    <div className="relative group">
      <div className="mb-4 relative rounded-xl overflow-hidden bg-black">
        <Swiper 
          spaceBetween={10} 
          navigation={mediaItems.length > 1} 
          pagination={{ clickable: true }} 
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }} 
          modules={[Pagination, Thumbs]} 
          className="product-main-swiper" 
          onSlideChange={(swiper) => setCurrentMediaIndex(swiper.activeIndex)}
        >
          {mediaItems.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full aspect-square flex items-center justify-center">
                {item.type === 'image' ? (
                  <>
                    <Image 
                      src={item.url} 
                      alt={service?.name || `Service image ${index + 1}`} 
                      fill 
                      className="object-contain cursor-zoom-in" 
                      onClick={() => setIsImageZoomed(!isImageZoomed)} 
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                      priority={index === 0} // تحسين: أول صورة priority
                    />
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={onLikeClick} 
                        className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white transition-all"
                      >
                        <Heart className={`h-5 w-5 transition-all ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={onShareClick} 
                        className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white transition-all"
                      >
                        <Share className="h-5 w-5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full">
                    <video 
                      src={item.url} 
                      controls 
                      playsInline 
                      className="w-full h-full object-contain" 
                      poster={item.thumbnail} 
                      preload="metadata" 
                      onError={() => toast.error("حدث خطأ في تحميل الفيديو")}
                    >
                      <source src={item.url} type="video/mp4" />
                      <source src={item.url} type="video/webm" />
                      متصفحك لا يدعم عرض الفيديوهات.
                    </video>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {discountPercentage > 0 && (
          <Badge className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-sm font-bold z-10">
            خصم {discountPercentage}%
          </Badge>
        )}
      </div>
      
      {mediaItems.length > 1 && (
        <div className="mt-2">
          <Swiper 
            onSwiper={setThumbsSwiper} 
            spaceBetween={8} 
            slidesPerView={4} 
            freeMode={true} 
            watchSlidesProgress={true} 
            modules={[FreeMode, Thumbs]} 
            className="product-thumbs-swiper" 
            breakpoints={{ 
              320: { slidesPerView: 3 }, 
              640: { slidesPerView: 4 }, 
              1024: { slidesPerView: 7 } 
            }}
          >
            {mediaItems.map((item, index) => (
              <SwiperSlide key={index}>
                <div className="relative">
                  {currentMediaIndex === index && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">•</div>
                    </div>
                  )}
                  <div 
                    className={`relative h-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${currentMediaIndex === index ? 'border-primary' : 'border-transparent'}`} 
                    onClick={() => setCurrentMediaIndex(index)}
                  >
                    <div className="relative w-full h-full">
                      <Image 
                        src={item.thumbnail} 
                        alt={`Thumbnail ${index + 1}`} 
                        fill 
                        className="object-cover" 
                        sizes="80px" 
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} 
                      />
                    </div>
                    {item.type === 'video' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};
