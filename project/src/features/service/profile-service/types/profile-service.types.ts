// features/service/profile-service/types/profile-service.types.ts
// -- أنواع بيانات الملف الشخصي - الإصدار النهائي 2026 --

import { Category } from "@/lib/types";

export interface PhoneNumber {
  id?: string;
  type: 'whatsapp' | 'mobile' | 'landline';
  number: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface ProviderReview {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  user_id: string;
  // ✅ الحقل الجديد من الاستعلام (user:user_id)
  user?: {
    full_name: string;
    avatar_url: string | null;
  };
  // الحقول القديمة للتوافق مع الإصدارات السابقة
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  user_display_name?: string;
  user_display_avatar?: string | null;
  user_name?: string;
  user_avatar_url?: string | null;
}

export interface ProviderData {
  id: string;
  business_name: string;
  logo_url: string | null;
  avatar_url: string | null;
  store_image_url: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  physical_address: string | null;
  phone_numbers: PhoneNumber[] | null;
  followers_count: number | null;
  total_likes_count: number | null;
  trust_features: any | null;
  faqs: FAQ[] | null;
  working_hours: string | null;
  specialization: string | null;
  qualifications: string | null;
  certifications: string | null;
  years_of_experience: string | null;
  availability: string | null;
  working_days: string[] | null;
  emergency_service: boolean | null;
  email: string | null;
  full_name: string | null;
  provider_type: string[] | null;
  store_type: string | null;
  rating: number | null;
  category_id: number | null;
  category: string | null;
  sub_category: string | null;
  is_setup_complete: boolean | null;
  created_at: string;
  updated_at: string | null;
  isFollowing?: boolean;
  allCategories?: Category[];
}

export interface ProfileServiceHeaderProps {
  provider: ProviderData;
  isFollowing: boolean;
  isPending: boolean;
  followAction: (formData: FormData) => Promise<void>;
}

export interface ProfileServiceInfoCardProps {
  provider: ProviderData;
}

export interface ProfileServiceReviewsListProps {
  reviews: ProviderReview[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}