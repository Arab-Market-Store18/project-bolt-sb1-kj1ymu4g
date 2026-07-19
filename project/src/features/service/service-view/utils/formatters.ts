// المسار: features/service/service-view/utils/formatters.ts
// -- ملف جديد حسب الهيكل المنظم --


/**
 * وظائف تنسيق البيانات للخدمات
 */

/**
 * تنسيق التاريخ باللغة العربية
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'تاريخ غير محدد';
  
  try {
    const date = new Date(dateString);
    
    // التحقق من صحة التاريخ
    if (isNaN(date.getTime())) {
      return 'تاريخ غير صالح';
    }
    
    return new Intl.DateTimeFormat('ar-EG', {
      hour: 'numeric',
      minute: 'numeric',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Riyadh'
    }).format(date);
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return 'تاريخ غير محدد';
  }
};

/**
 * تنسيق السعر مع العملة
 */
export const formatPrice = (
  price: number, 
  currency: string = 'ر.س',
  locale: string = 'ar-SA'
): string => {
  if (typeof price !== 'number' || isNaN(price)) {
    return `0 ${currency}`;
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price) + ` ${currency}`;
};

/**
 * تنسيق نسبة الخصم
 */
export const formatDiscountPercentage = (
  originalPrice: number,
  discountPrice: number
): string => {
  if (!originalPrice || !discountPrice || originalPrice <= discountPrice) {
    return '0%';
  }
  
  const percentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  return `${percentage}%`;
};

/**
 * تقصير النص الطويل
 */
export const truncateText = (
  text: string,
  maxLength: number = 100,
  suffix: string = '...'
): string => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + suffix;
};

/**
 * تنسيق تقييم النجوم
 */
export const formatRating = (rating: number): string => {
  if (typeof rating !== 'number' || isNaN(rating) || rating < 0 || rating > 5) {
    return '0.0';
  }
  
  return rating.toFixed(1);
};

/**
 * تنسيق الأرقام الكبيرة (مثال: 1.2K)
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * تنسيق رقم الهاتف
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // إزالة كل ما عدا الأرقام
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // تنسيق حسب طول الرقم
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 9) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return phoneNumber;
};
