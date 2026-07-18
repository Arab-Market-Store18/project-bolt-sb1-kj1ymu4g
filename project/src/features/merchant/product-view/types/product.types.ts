// features/merchant/product-view/types/product.types.ts

import { Review } from "./review.types";

export interface PhoneNumber {
  type: 'whatsapp' | 'mobile' | 'landline';
  number: string;
}

export interface SellerInfo {
  id: string;
  business_name: string;
  logo_url?: string | null;
  store_image_url?: string | null;
  whatsapp?: string | null;
  phone_numbers?: PhoneNumber[];
  followers_count?: number;
  location?: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface ProductDetails {
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
  additional_details?: { feature: string; value: string }[];
  additional_prices?: { label: string; price: number; currency: string }[];
  sellers: SellerInfo | null;
  average_rating?: number;
  review_count?: number;
  discount_price?: number;
  condition?: string;
  stock?: number;
  tags?: string[];
  created_at?: string;
  likes_count?: number;
  reviews: Review[];
}
