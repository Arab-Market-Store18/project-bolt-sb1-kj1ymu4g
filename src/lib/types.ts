// المسار: lib/types.ts
// -- تم إضافة followers_count إلى تعريف Seller لضمان التوافق --

// 1. تعريف الفئة (Category)
export interface Category {
  id: number;
  name: string;
  icon_name: string | null;
  parent_id: number | null;
}

// 2. تعريف البائع (Seller)
export interface Seller {
  id: string; // uuid
  business_name: string;
  logo_url: string | null;
  
  // ▼▼▼ هذا هو السطر الوحيد الذي تم تعديله ▼▼▼
  followers_count?: number; // قد يكون غير موجود في كل الاستعلامات
  // ▲▲▲ نهاية التعديل ▲▲▲

  whatsapp_number: string | null;
  city: string | null;
}

// 3. تعريف المنتج (Product) - هذا هو التعريف الأهم
export interface Product {
  id: number; // bigint
  created_at: string; // timestamptz
  name: string;
  description: string;
  price: number; // float8
  currency: string;
  images: any; // jsonb - استخدام any أكثر أماناً هنا
  video_url: string | null;
  additional_details: any | null; // jsonb
  likes_count: number; // bigint
  seller_id: string; // uuid
  category_id: number; // bigint

  // الحقول التي تأتي من الربط (JOIN) أو الاستعلامات المتداخلة
  seller?: Seller; // قد يكون كائناً كاملاً
  sellers?: Seller; // supabase تستخدم أحياناً صيغة الجمع
  
  // الحقول المحسوبة التي تضيفها الدالة
  is_liked_by_user?: boolean;
  
  // الحقول القديمة التي قد لا تزال موجودة في بعض الاستعلامات
  category?: any; 
  sub_category?: any;
  seller_business_name?: string;
  seller_logo_url?: string | null;
  seller_followers_count?: number;
  seller_whatsapp_number?: string | null;
  seller_city?: string | null;
}
