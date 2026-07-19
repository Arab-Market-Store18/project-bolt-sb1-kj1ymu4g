// components/ui/safe-image.tsx
'use client'; // هذا المكون يتفاعل مع المستخدم، لذا يجب أن يكون Client Component

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

// الصورة الافتراضية التي ستظهر عند حدوث خطأ
// تأكد من أن هذا المسار صحيح في مشروعك
const FALLBACK_IMAGE_SRC = '/placeholder.png'; 

interface SafeImageProps extends ImageProps {
  fallbackSrc?: string;
}

export const SafeImage = (props: SafeImageProps) => {
  const { src, fallbackSrc = FALLBACK_IMAGE_SRC, ...rest } = props;
  const [imgSrc, setImgSrc] = useState(src);

  // التأكد من إعادة تعيين الحالة إذا تغير رابط الصورة الأصلي
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...rest}
      src={imgSrc}
      onError={() => {
        // عند فشل تحميل الصورة، قم بتغيير المصدر إلى الصورة الافتراضية
        setImgSrc(fallbackSrc);
      }}
    />
  );
};
