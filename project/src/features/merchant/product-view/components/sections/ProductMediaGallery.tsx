// features/merchant/product-view/components/sections/ProductMediaGallery.tsx
// features/merchant/product-view/components/sections/ProductMediaGallery.tsx
/**
 * الوظيفة: هذا المكون مسؤول حصراً عن عرض معرض الصور والفيديوهات.
 * يستخدم مكتبة Swiper لإنشاء سلايدر تفاعلي مع صور مصغرة للملاحة.
 * يتلقى بياناته من الهوك `useProductMedia` مما يجعله مكون عرض نقي.
 */

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import { Heart, Play, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MediaItem } from '../../hooks/useProductMedia';
import { ProductDetails } from "@/features/merchant/product-view/types/product.types";

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

interface ProductMediaGalleryProps {
  product: ProductDetails;
  mediaItems: MediaItem[];
  discountPercentage: number;
}

export function ProductMediaGallery({ product, mediaItems, discountPercentage }: ProductMediaGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const handleLikeClick = useCallback(() => {
    setIsLiked(prev => !prev);
    toast.success(!isLiked ? "تمت الإضافة إلى المفضلة" : "تمت الإزالة من المفضلة");
  }, [isLiked]);

  const handleShareClick = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description || '',
        url: window.location.href,
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("تم نسخ الرابط إلى الحافظة");
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط إلى الحافظة");
    }
  }, [product]);

  return (
    <div className="relative group">
      <div className="mb-4 relative rounded-xl overflow-hidden bg-black">
        <Swiper
          spaceBetween={10}
          navigation={mediaItems.length > 1}
          pagination={{ clickable: true }}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          modules={[Pagination, Thumbs, Navigation]}
          className="product-main-swiper"
          onSlideChange={(swiper) => setCurrentMediaIndex(swiper.activeIndex)}
        >
          {mediaItems.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full aspect-square flex items-center justify-center">
                {item.type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={product?.name || `Product image ${index + 1}`}
                    fill
                    className="object-contain"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    poster={item.thumbnail}
                    preload="metadata"
                  >
                    <source src={item.url} type="video/mp4" />
                    متصفحك لا يدعم عرض الفيديوهات.
                  </video>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button size="icon" variant="ghost" onClick={handleLikeClick} className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white">
            <Heart className={`h-5 w-5 transition-all ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleShareClick} className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white">
            <Share className="h-5 w-5" />
          </Button>
        </div>
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
            breakpoints={{ 320: { slidesPerView: 4 }, 640: { slidesPerView: 5 }, 1024: { slidesPerView: 7 } }}
          >
            {mediaItems.map((item, index) => (
              <SwiperSlide key={index} className="cursor-pointer">
                <div className={`relative h-20 rounded-md overflow-hidden border-2 transition-all ${currentMediaIndex === index ? 'border-primary' : 'border-transparent'}`}>
                  <Image src={item.thumbnail} alt={`Thumbnail ${index + 1}`} fill className="object-cover" sizes="80px" />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}