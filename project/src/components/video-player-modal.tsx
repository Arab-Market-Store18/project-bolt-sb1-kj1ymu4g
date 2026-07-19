// المسار: components/video-player-modal.tsx
// -- النسخة النهائية المحصّنة: تضمن تحسين كل الوسائط قبل العرض --

"use client";

import { useState, useEffect, useMemo } from "react"; // <-- إضافة useMemo
import { useModal } from "@/hooks/use-modal";
import { AnimatePresence, motion } from "framer-motion";
import { X, Play } from "lucide-react";
import Image from "next/image";

// استيراد Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
// ▼▼▼ الخطوة 1: استيراد دالة التحسين ▼▼▼
import { getOptimizedMediaUrl } from "@/lib/utils/cloudinary";

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export const VideoPlayerModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  const isModalOpen = isOpen && type === "mediaViewer";
  const media: MediaItem[] = data?.media || [];
  const startIndex: number = data?.startIndex || 0;

  // ▼▼▼ الخطوة 2: إنشاء نسخة محسّنة من الوسائط ▼▼▼
  const optimizedMedia = useMemo(() => {
    if (!media) return [];
    // هذا يضمن أن كل رابط يتم تحسينه قبل العرض، بغض النظر عن مصدره
    return media.map(item => ({
      ...item,
      url: getOptimizedMediaUrl(item.url, item.type),
    }));
  }, [media]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  if (!isModalOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-0 right-0 z-50 text-white opacity-70 hover:opacity-100 p-2"><X size={32} /></button>

            <Swiper
              key={startIndex}
              initialSlide={startIndex}
              spaceBetween={10}
              navigation={true}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              modules={[FreeMode, Navigation, Thumbs]}
              className="w-full h-[80%]"
            >
              {/* ▼▼▼ الخطوة 3: استخدام النسخة المحسّنة هنا ▼▼▼ */}
              {optimizedMedia.map((item, index) => (
                <SwiperSlide key={index} className="flex items-center justify-center">
                  {item.type === 'image' ? (
                    <div className="relative w-full h-full">
                      <Image src={item.url} alt={`Media ${index + 1}`} layout="fill" objectFit="contain" />
                    </div>
                  ) : (
                    // هذا سيستخدم الآن الرابط المحسّن بشكل مؤكد
                    <video src={item.url} controls autoPlay={index === startIndex} className="max-w-full max-h-full" />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>

            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={5}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[FreeMode, Navigation, Thumbs]}
              className="w-full h-[15%]"
            >
              {/* ▼▼▼ والنسخة المحسّنة هنا أيضاً للصور المصغرة ▼▼▼ */}
              {optimizedMedia.map((item, index) => (
                <SwiperSlide key={index} className="cursor-pointer rounded-md overflow-hidden opacity-50 swiper-slide-thumb-active:opacity-100 swiper-slide-thumb-active:border-2 border-white">
                  {item.type === 'image' ? (
                    <Image src={item.url} alt={`Thumbnail ${index + 1}`} layout="fill" objectFit="cover" />
                  ) : (
                    <div className="relative w-full h-full bg-black">
                      {/* ملاحظة: الصورة المصغرة للفيديو ستكون محسّنة أيضاً */}
                      <Image src={item.url.replace(/\.mp4$/, '.jpg')} alt={`Video thumbnail ${index + 1}`} layout="fill" objectFit="cover" onError={(e) => (e.currentTarget.src = '/placeholder.svg')} />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Play className="text-white h-6 w-6" />
                      </div>
                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};