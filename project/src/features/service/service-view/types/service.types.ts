// المسار: features/service/service-view/types/service.types.ts
// -- تم التعديل ليتوافق مع هيكل قاعدة البيانات الجديد --

// --- لم يتم تغيير هذه الأنواع لأنها مشتركة ---
export interface PhoneNumber {
  type: 'whatsapp' | 'mobile' | 'landline';
  number: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface AdditionalDetail {
  feature: string;
  value: string;
}

export interface AdditionalPrice {
  label: string;
  price: number;
  currency: string;
}


/**
 * @description يمثل بيانات مقدم الخدمة من جدول `service_providers`.
 * @before كان اسمه `Provider`.
 */
export interface ServiceProvider {
  id: string;
  user_id?: string;
  business_name: string;
  logo_url?: string | null;
  avatar_url?: string | null;    // <-- إضافة
  store_image_url?: string | null;
  whatsapp?: string | null;
  phone_numbers?: PhoneNumber[];
  followers_count?: number;
  location?: string;
  city?: string;
  specialization?: string;
  qualifications?: string;
  certifications?: string;
  years_of_experience?: string;
  availability?: string;
  working_days?: string[];
  emergency_service?: boolean;
  description?: string;
}

/**
 * @description يمثل بيانات الخدمة من جدول `services`.
 */
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  images?: string[] | string | null;
  video_url?: string | null;
  main_category_id: number;
  category_id: number;
  main_category_name?: string;
  sub_category_name?: string;
  additional_details?: AdditionalDetail[];
  additional_prices?: AdditionalPrice[];
  
  /**
   * @description يمثل العلاقة مع جدول `service_providers`.
   * @before كان اسمه `sellers: Provider | null;`.
   */
  service_providers: ServiceProvider | null;

  average_rating?: number;
  review_count?: number;
  discount_price?: number;
  likes_count?: number;
  reviews?: Review[]; // نفترض أن Review معرف في مكان آخر
  product_type?: 'PRODUCT' | 'SERVICE'; // هذا الحقل لا يزال مفيداً
  created_at?: string;
}


// --- تحديث الأنواع التي تعتمد على Service ---

// ولم تتغير.
export interface ServiceReviewsSectionProps {
  reviewsWithReplies: ReviewWithReplies[];
  service: Service;
  currentUser: User | null;
  isAuthLoading?: boolean;
  onOpen: (modal: string, data?: any) => void;
  onDataChange: () => void;
  onUpdateReview?: (reviewId: string, rating: number, comment: string) => void;
}

export interface ServiceMediaGalleryProps {
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

export interface ServiceProviderInfoProps {
  /**
   * @description تم تعديل النوع ليعكس الهيكل الجديد.
   * @before كان `service: { sellers: Provider | null; } | null;`
   */
  provider: ServiceProvider | null;
}

export interface ServiceDetailsSectionProps {
  service: Service | null;
  currentUser: User | null;
  onOpen: (modal: string, data?: any) => void;
}

// يجب التأكد من وجود هذه الأنواع أو استيرادها
export interface User { /* ... */ }
export interface Review { /* ... */ }
export interface ReviewWithReplies { /* ... */ }
