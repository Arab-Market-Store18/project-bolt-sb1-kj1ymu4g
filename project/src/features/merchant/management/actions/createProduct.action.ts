// features/merchant/management/actions/createProduct.action.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server';

// ════════════════════════════════════════════
// 1. تكوين Cloudinary
// ════════════════════════════════════════════
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!apiSecret && process.env.CLOUDINARY_URL) {
  const urlMatch = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/[^:]+:([^@]+)@/);
  if (urlMatch && urlMatch[1]) apiSecret = urlMatch[1];
}

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

// ════════════════════════════════════════════
// 2. دالة رفع الملفات
// ════════════════════════════════════════════
async function uploadFileToCloudinary(file: File, folder: string): Promise<string> {
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary configuration missing');

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (!ALLOWED_MIME_TYPES.includes(file.type)) throw new Error(`File type not allowed: ${file.type}`);
  if (file.size > MAX_FILE_SIZE) throw new Error(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto', timeout: 30000 },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// ════════════════════════════════════════════
// 3. Server Action لإنشاء منتج (معدلة)
// ════════════════════════════════════════════
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createProduct({
  sellerId,
  sellerEmail,
  name,
  description,
  price,
  currency,
  discountPrice,
  categoryData,
  additionalDetails,
  additionalPrices,
  images,
  video
}: {
  sellerId: string;
  sellerEmail: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  discountPrice?: number;
  categoryData?: any;
  additionalDetails?: any[];
  additionalPrices?: any[];
  images?: File[];
  video?: File | null;
}) {
  try {
    console.log('=== بداية createProduct ===');
    console.log('🔍 sellerId المستلم:', sellerId);
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ التحقق من sellerId
    if (!sellerId) {
      throw new Error('معرف البائع مطلوب');
    }

    // ✅ التحقق من الجلسة عبر الكوكيز أولاً
    try {
      const supabaseUser = await createSupabaseServerClient();
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user && user.id !== sellerId) {
        throw new Error('لا يمكنك إضافة منتج نيابة عن تاجر آخر');
      }
    } catch (authCheckError: any) {
      // إذا كانت الجلسة غير متاحة (مثلاً localStorage فقط بدون كوكيز)
      // نتحقق من أن البائع موجود فعلاً في قاعدة البيانات
      if (authCheckError.message === 'لا يمكنك إضافة منتج نيابة عن تاجر آخر') {
        throw authCheckError;
      }
      // fallback: تحقق من وجود البائع في DB
      const { data: sellerExists, error: sellerError } = await supabaseAdmin
        .from('sellers')
        .select('id')
        .eq('id', sellerId)
        .maybeSingle();
      if (sellerError || !sellerExists) {
        throw new Error('البائع غير موجود أو غير مصرح له');
      }
    }

    // 3. رفع الصور (إذا وجدت)
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      console.log(`📸 جاري رفع ${images.length} صورة...`);
      
      const uploadPromises = images.map((file, idx) =>
        uploadFileToCloudinary(file, `products/${sellerId}/images/${Date.now()}_${idx}`).catch((error) => {
          console.error(`❌ فشل رفع الصورة ${idx}:`, error.message);
          return null;
        })
      );
      
      const results = await Promise.all(uploadPromises);
      imageUrls = results.filter((url): url is string => url !== null);
      console.log(`✅ تم رفع ${imageUrls.length} من ${images.length} صورة`);
    }

    // 4. رفع الفيديو (إذا وجد)
    let videoUrl: string | null = null;
    if (video) {
      console.log('🎥 جاري رفع الفيديو...');
      try { 
        videoUrl = await uploadFileToCloudinary(video, `products/${sellerId}/videos`); 
        console.log('✅ تم رفع الفيديو بنجاح');
      } catch (error: any) { 
        console.error('❌ فشل رفع الفيديو:', error.message);
        videoUrl = null; 
      }
    }

    // 5. التحقق من صحة البيانات
    if (!name || name.length < 3) throw new Error('اسم المنتج مطلوب (3 أحرف على الأقل)');
    if (!description || description.length < 20) throw new Error('وصف المنتج مطلوب (20 حرفاً على الأقل)');
    if (isNaN(price) || price <= 0) throw new Error('السعر يجب أن يكون أكبر من صفر');

    // 6. بناء productData
    const productData: any = {
      seller_id: sellerId, // ✅ استخدام sellerId مباشرة
      product_type: 'PRODUCT',
      name,
      description,
      price,
      currency,
      is_active: true,
      is_approved: true,
      created_at: new Date().toISOString(),
      likes_count: 0,
      views_count: 0,
      sales_count: 0,
      images: imageUrls,
      thumbnail_image_url: imageUrls[0] || null,
      image_url: imageUrls[0] || null,
      video_url: videoUrl || null
    };

    // إضافة السعر المخفض
    if (discountPrice && discountPrice > 0 && discountPrice < price) {
      productData.discount_price = discountPrice;
    }

    // إضافة الفئة
    if (categoryData) {
      productData.category_id = categoryData.id || null;
      productData.subcategory = categoryData.name || null;
      productData.suggested_category_name = categoryData.isSuggested ? categoryData.name : null;
    }

    // إضافة التفاصيل الإضافية
    if (additionalDetails && additionalDetails.length > 0) {
      productData.additional_details = additionalDetails.filter(d => d.feature && d.value);
    }

    // إضافة الأسعار الإضافية
    if (additionalPrices && additionalPrices.length > 0) {
      productData.additional_prices = additionalPrices.filter(p => p && p.price && p.currency && p.label);
    }

    // 7. إدخال المنتج في قاعدة البيانات
    console.log('💾 جاري حفظ المنتج في قاعدة البيانات...');
    
    const { data: newProduct, error: insertError } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select(`*`) // ✅ إزالة sellers من الـ select
      .single();

    if (insertError) {
      console.error('❌ خطأ في إدخال المنتج:', insertError);
      throw new Error(`فشل إنشاء المنتج: ${insertError.message}`);
    }
    
    if (!newProduct) {
      throw new Error('فشل استرجاع المنتج بعد الحفظ');
    }

    console.log('✅ تم إنشاء المنتج بنجاح:', newProduct.id);
    console.log('=== نهاية createProduct ===');

    return { 
      success: true, 
      message: 'تم إنشاء المنتج بنجاح', 
      data: newProduct 
    };

  } catch (error: any) {
    console.error('🔥 خطأ كامل في createProduct:', error);
    console.error('🔥 Stack trace:', error.stack);
    return { 
      success: false, 
      message: error.message || 'حدث خطأ غير متوقع', 
      error: error.message 
    };
  }
}