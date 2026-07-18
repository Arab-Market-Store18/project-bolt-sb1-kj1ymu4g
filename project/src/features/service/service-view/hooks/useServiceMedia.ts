// المسار: features/service/service-view/hooks/useServiceMedia.ts
// -- ملف جديد حسب الهيكل المنظم --


import { useState, useCallback } from "react";

export const useServiceMedia = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  const handleLikeClick = useCallback((currentUser: any, onOpen: any) => {
    if (!currentUser) {
      onOpen('emailSignUp');
      return;
    }
    setIsLiked(prev => !prev);
  }, []);

  const handleShareClick = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: 'شاهد هذه الخدمة',
        url: window.location.href,
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  return {
    isLiked,
    setIsLiked,
    isImageZoomed,
    setIsImageZoomed,
    currentMediaIndex,
    setCurrentMediaIndex,
    thumbsSwiper,
    setThumbsSwiper,
    handleLikeClick,
    handleShareClick
  };
};
