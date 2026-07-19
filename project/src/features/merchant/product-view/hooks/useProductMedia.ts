// features/merchant/product-view/hooks/useProductMedia.ts
// features/merchant/product-view/hooks/useProductMedia.ts
/**
 * الوظيفة: هذا الهوك المخصص (Custom Hook) يعزل كل المنطق المتعلق بمعرض الوسائط.
 * يقوم بإنشاء قائمة الوسائط (صور وفيديو)، وإدارة الرابط المصغّر للفيديو،
 * وتوفير البيانات اللازمة لمكون `ProductMediaGallery`.
 */

import { useMemo } from 'react';
import { ProductDetails } from '../types/product.types';
import { getOptimizedMediaUrl } from "@/lib/utils/cloudinary";

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
}

export function useProductMedia(product: ProductDetails | null) {
  const mediaItems = useMemo((): MediaItem[] => {
    if (!product) return [];
    const items: MediaItem[] = [];

    if (product.images) {
      const imageArray = Array.isArray(product.images) ? product.images : [product.images];
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

    if (product.video_url) {
      const videoUrl = product.video_url.endsWith('.jpg')
        ? product.video_url.replace('.jpg', '.mp4')
        : product.video_url;

      const videoThumbnail = getOptimizedMediaUrl(
        videoUrl.replace(/\.[^/.]+$/, '.jpg'),
        'thumbnail'
      );

      items.push({
        type: 'video',
        url: getOptimizedMediaUrl(videoUrl, 'video'),
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
  }, [product]);

  const discountPercentage = useMemo(() => {
    if (!product?.discount_price || !product.price) return 0;
    return Math.round(((product.price - product.discount_price) / product.price) * 100);
  }, [product]);

  return { mediaItems, discountPercentage };
}
