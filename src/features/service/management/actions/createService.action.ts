// features/service/management/actions/createService.action.ts
// -- الكود الكامل مع إضافة دالة جديدة باسم فريد (بدون حذف أي شيء) --

'use server';

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ════════════════════════════════════════════════════════════════════════
// ⚠️ الجزء الجديد المضاف (باسم فريد لتجنب الأخطاء)
// ════════════════════════════════════════════════════════════════════════
/**
 * هذه الدالة مخصصة ليتم استيرادها واستخدامها في مكونات العميل (Client Components).
 * تقوم بالرفع المباشر إلى Cloudinary وتحديث مدير الرفع.
 * 
 * @param files - مصفوفة الملفات المراد رفعها.
 * @param uploadManager - كائن مدير الرفع من الواجهة الأمامية.
 * @param entityName - اسم الكيان لعرضه في شريط التقدم.
 * @returns - وعد (Promise) يحتوي على مصفوفة من روابط Cloudinary.
 */
export async function uploadClientSideAndTrackProgress(
  files: File[],
  uploadManager: any,
  entityName: string
): Promise<string[]> {
  // هذا الجزء من الكود سيتم تشغيله فعليًا في بيئة المتصفح
  if (typeof window === 'undefined') {
    // هذا يمنع تشغيل الكود على الخادم ويؤكد أنه للعميل فقط
    throw new Error("This function can only be called from the client-side.");
  }

  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary cloud name is not configured in public environment variables.");
  }
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_UPLOAD_PRESET) {
    throw new Error("Cloudinary unsigned upload preset is not configured.");
  }

  const uploadId = uploadManager.startUpload({
    type: 'service',
    action: 'add',
    entityName: entityName || 'ملفات الخدمة',
  });

  const uploadPromises = files.map(file => {
    return new Promise<string>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_UPLOAD_PRESET!);

      const xhr = new XMLHttpRequest();
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`, true );

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          uploadManager.updateProgress(uploadId, progress);
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } else {
            reject(new Error(`فشل رفع الملف: ${xhr.statusText}`));
          }
        }
      };
      
      xhr.send(formData);
    });
  });

  try {
    const urls = await Promise.all(uploadPromises);
    uploadManager.finishUpload(uploadId, true, 'اكتمل رفع الملفات بنجاح!');
    return urls;
  } catch (error: any) {
    uploadManager.finishUpload(uploadId, false, error.message);
    throw error;
  }
}


// ════════════════════════════════════════════════════════════════════════
// ⛔️ الجزء الأصلي والمهم (بدون أي تعديل أو حذف)
// ════════════════════════════════════════════════════════════════════════

// 1. تكوين Cloudinary (أصلي)
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!apiSecret && process.env.CLOUDINARY_URL) {
  const urlMatch = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/[^:]+:([^@]+)@/);
  if (urlMatch && urlMatch[1]) apiSecret = urlMatch[1];
}

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ 
    cloud_name: cloudName, 
    api_key: apiKey, 
    api_secret: apiSecret,
    secure: true 
  });
} else {
  console.error('❌ Cloudinary configuration missing for server-side actions.');
}

// 2. دالة رفع الملفات (أصلية)
async function uploadFileToCloudinary(file: File, folder: string): Promise<string> {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary configuration missing');
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

  const fileType = file.type;
  const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType);

  if (!isImage && !isVideo) {
    throw new Error(`نوع الملف غير مدعوم: ${fileType}`);
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`الملف كبير جدًا (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder, 
        resource_type: isVideo ? 'video' : 'image',
        timeout: 60000,
        quality: 'auto:good',
        ...(isImage ? { format: 'webp' } : {}),
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error.message);
          return reject(new Error(`فشل رفع الملف: ${error.message}`));
        }
        resolve(result!.secure_url);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// 3. دالة التحقق من البائع (أصلية)
async function validateSeller(sellerId: string, supabaseAdmin: any) {
  try {
    const { data: provider, error } = await supabaseAdmin
      .from('service_providers')
      .select(`id, business_name, email, user_id, is_setup_complete, city, country`)
      .eq('id', sellerId)
      .single();
    
    if (error) {
      console.error('❌ خطأ في البحث عن مزود الخدمة:', error);
      throw new Error(`خطأ في البحث عن مزود الخدمة: ${error.message}`);
    }
    
    if (!provider) {
      throw new Error('لم يتم العثور على مزود الخدمة');
    }
    
    if (provider.is_setup_complete === false) {
      throw new Error('لم يكتمل إعداد حساب مزود الخدمة بعد');
    }
    
    console.log('✅ تم التحقق من مزود الخدمة:', { id: provider.id, business_name: provider.business_name });
    return provider;
    
  } catch (error: any) {
    const { data: providerSimple } = await supabaseAdmin.from('service_providers').select('id').eq('id', sellerId).single();
    if (!providerSimple) throw new Error('لم يتم العثور على مزود الخدمة');
    console.log('✅ تم العثور على مزود الخدمة (تحقق أساسي)');
    return { id: providerSimple.id };
  }
}

// 4. Server Action الرئيسية (أصلية)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createService(formData: FormData) {
  try {
    console.log('=== بداية createService (النسخة الأصلية) ===');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const sellerId = formData.get('seller_id') as string;
    if (!sellerId || sellerId === 'undefined' || sellerId === 'null') throw new Error('معرف البائع غير صالح');
    
    const provider = await validateSeller(sellerId, supabaseAdmin);
    
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const priceStr = formData.get('price') as string;
    const currency = (formData.get('currency') as string) || 'YER';
    const discountPriceRaw = formData.get('discount_price') as string;
    const mainCategoryId = formData.get('main_category_id') as string || '2';
    
    if (!name || name.length < 3) throw new Error('اسم الخدمة مطلوب (3 أحرف على الأقل)');
    if (!description || description.length < 20) throw new Error('وصف الخدمة مطلوب (20 حرفاً على الأقل)');
    
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) throw new Error('السعر يجب أن يكون أكبر من صفر');
    
    let discount_price: number | null = null;
    if (discountPriceRaw) {
      const discountPrice = parseFloat(discountPriceRaw);
      if (!isNaN(discountPrice) && discountPrice > 0 && discountPrice < price) {
        discount_price = discountPrice;
      } else if (discountPrice >= price) {
        throw new Error('سعر الخصم يجب أن يكون أقل من السعر الأساسي');
      }
    }
    
    let categoryData: any = null;
    try { categoryData = JSON.parse(formData.get('category') as string || 'null'); } catch (e) { console.error('❌ خطأ في تحليل category:', e); }
    
    let category_id = null;
    let suggested_category_name = null;
    
    if (categoryData?.id) {
      category_id = categoryData.id;
    } else if (categoryData?.isSuggested && categoryData?.name) {
      suggested_category_name = categoryData.name;
    } else {
      throw new Error('يجب تحديد قسم للخدمة');
    }
    
    const imagesJson = formData.get('images_json') as string;
    const videoUrl = formData.get('video_url') as string;
    
    let images: string[] = [];
    if (imagesJson) {
      try {
        images = JSON.parse(imagesJson);
        if (!Array.isArray(images)) throw new Error('تنسيق بيانات الصور غير صحيح');
        images = images.filter(url => url && (url.startsWith('https://res.cloudinary.com/') || url.startsWith('http://res.cloudinary.com/')));
        if (images.length === 0) throw new Error('لم يتم توفير صور صالحة للخدمة');
        console.log(`✅ تم استلام ${images.length} صورة عبر JSON`);
      } catch (error) {
        throw new Error('تنسيق بيانات الصور غير صحيح');
      }
    } else {
      const imageFiles = formData.getAll('images') as File[];
      if (imageFiles.length === 0) throw new Error('يجب رفع صورة واحدة على الأقل');
      console.log(`📸 جاري رفع ${imageFiles.length} صورة...`);
      const uploadPromises = imageFiles.map((file, idx) =>
        uploadFileToCloudinary(file, `services/${provider.id}/images/${Date.now()}_${idx}`)
      );
      images = await Promise.all(uploadPromises);
    }
    
    let video_url: string | null = videoUrl || null;
    const videoFile = formData.get('video') as File | null;
    
    if (videoFile && videoFile.size > 0) {
      console.log('🎥 جاري رفع الفيديو...');
      try { 
        video_url = await uploadFileToCloudinary(videoFile, `services/${provider.id}/videos`); 
      } catch (error: any) { 
        video_url = null; 
      }
    }
    
    let specifications: Record<string, string> | null = null;
    const specsJson = formData.get('specifications') as string;
    if (specsJson) {
      try {
        const specsData = JSON.parse(specsJson);
        if (typeof specsData === 'object' && specsData !== null) {
          specifications = {};
          Object.entries(specsData).forEach(([key, value]) => {
            if (key && value && typeof key === 'string' && typeof value === 'string') {
              specifications![key.trim()] = value.toString().trim();
            }
          });
          if (Object.keys(specifications).length === 0) specifications = null;
        }
      } catch (e) { console.error('❌ خطأ في تحليل specifications:', e); }
    }
    
    let additional_prices: any[] | null = null;
    const pricesJson = formData.get('additional_prices') as string;
    if (pricesJson) {
      try {
        additional_prices = JSON.parse(pricesJson);
        if (Array.isArray(additional_prices)) {
          additional_prices = additional_prices.filter(p => p && typeof p === 'object' && p.price && p.currency && p.label && typeof p.price === 'number' && p.price > 0);
          if (additional_prices.length === 0) additional_prices = null;
        } else {
          additional_prices = null;
        }
      } catch (e) { console.error('❌ خطأ في تحليل additional_prices:', e); }
    }
    
    const serviceData = {
      service_provider_id: provider.id, name, description, main_category_id: parseInt(mainCategoryId), category_id, suggested_category_name, price, discount_price, currency, is_active: true, is_approved: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), likes_count: 0, views_count: 0, sales_count: 0, images: images.length > 0 ? images : null, thumbnail_image_url: images[0] || null, video_url, specifications, additional_prices,
    };
    
    console.log('💾 جاري حفظ الخدمة في قاعدة البيانات...');
    
    const { data: newService, error: insertError } = await supabaseAdmin.from('services').insert(serviceData).select(`*, service_providers (id, business_name, avatar_url)`).single();
    
    if (insertError) throw new Error(`فشل إنشاء الخدمة: ${insertError.message}`);
    if (!newService) throw new Error('فشل استرجاع الخدمة بعد الحفظ');
    
    console.log('✅ تم إنشاء الخدمة بنجاح:', newService.id);
    console.log('=== نهاية createService (النسخة الأصلية) ===');
    
    return { success: true, message: 'تم إنشاء الخدمة بنجاح', data: newService };
    
  } catch (error: any) {
    console.error('🔥 خطأ كامل في createService:', error);
    let errorMessage = error.message || 'حدث خطأ غير متوقع';
    if (error.message.includes('Cloudinary')) errorMessage = 'فشل في رفع الملفات. يرجى المحاولة مرة أخرى.';
    else if (error.message.includes('validation') || error.message.includes('مطلوب')) errorMessage = error.message;
    else if (error.message.includes('قاعدة البيانات')) errorMessage = 'حدث خطأ في قاعدة البيانات. يرجى المحاولة لاحقًا.';
    return { success: false, message: errorMessage, error: error.message };
  }
}

// =================================================================
// ✅ دالة createService المعدلة (تستقبل بيانات جاهزة)
// =================================================================
export async function createServiceV2({
  providerId,
  providerBusinessName,
  providerEmail,
  name,
  description,
  price,
  currency,
  discountPrice,
  mainCategoryId,
  categoryData,
  images,
  video,
  specifications,
  additionalPrices
}: {
  providerId: string;
  providerBusinessName: string;
  providerEmail: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  discountPrice?: number;
  mainCategoryId: string;
  categoryData: any;
  images: string[];
  video?: string | null;
  specifications?: Record<string, string> | null;
  additionalPrices?: any[] | null;
}) {
  try {
    console.log('=== بداية createServiceV2 (معدلة) ===');
    console.log('🔍 providerId المستلم:', providerId);
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ تحقق أن providerId موجود فعلاً في جدول service_providers
    const { data: providerRow, error: providerError } = await supabaseAdmin
      .from('service_providers')
      .select('id, user_id')
      .eq('id', providerId)
      .maybeSingle();

    if (providerError || !providerRow) {
      throw new Error('مزود الخدمة غير موجود — يرجى إعادة تسجيل الدخول');
    }

    // ✅ التحقق من صحة البيانات
    if (!name || name.length < 3) throw new Error('اسم الخدمة مطلوب (3 أحرف على الأقل)');
    if (!description || description.length < 20) throw new Error('وصف الخدمة مطلوب (20 حرفاً على الأقل)');
    if (isNaN(price) || price <= 0) throw new Error('السعر يجب أن يكون أكبر من صفر');
    
    if (discountPrice && discountPrice >= price) {
      throw new Error('سعر الخصم يجب أن يكون أقل من السعر الأساسي');
    }
    
    // ✅ معالجة الفئة
    let category_id = null;
    let suggested_category_name = null;
    
    if (categoryData?.id) {
      category_id = categoryData.id;
    } else if (categoryData?.isSuggested && categoryData?.name) {
      suggested_category_name = categoryData.name;
    } else {
      throw new Error('يجب تحديد قسم للخدمة');
    }
    
    if (!images || images.length === 0) {
      throw new Error('يجب توفير صورة واحدة على الأقل');
    }
    
    // ✅ بناء بيانات الخدمة
    const serviceData = {
      service_provider_id: providerId, // ✅ استخدام providerId مباشرة
      name,
      description,
      main_category_id: parseInt(mainCategoryId),
      category_id,
      suggested_category_name,
      price,
      discount_price: discountPrice || null,
      currency,
      is_active: true,
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      views_count: 0,
      sales_count: 0,
      images: images.length > 0 ? images : null,
      thumbnail_image_url: images[0] || null,
      video_url: video || null,
      specifications: specifications || null,
      additional_prices: additionalPrices || null,
    };
    
    console.log('💾 جاري حفظ الخدمة في قاعدة البيانات...');
    
    // ✅ إدراج الخدمة مع جلب بيانات مزود الخدمة للإرجاع
    const { data: newService, error: insertError } = await supabaseAdmin
      .from('services')
      .insert(serviceData)
      .select(`*, service_providers (id, business_name, avatar_url)`)
      .single();
    
    if (insertError) throw new Error(`فشل إنشاء الخدمة: ${insertError.message}`);
    if (!newService) throw new Error('فشل استرجاع الخدمة بعد الحفظ');
    
    console.log('✅ تم إنشاء الخدمة بنجاح:', newService.id);
    console.log('=== نهاية createServiceV2 ===');

    // تحديث الصفحة الرئيسية لتظهر الخدمة الجديدة فوراً
    revalidatePath('/');

    return { 
      success: true, 
      message: 'تم إنشاء الخدمة بنجاح', 
      data: newService 
    };
    
  } catch (error: any) {
    console.error('🔥 خطأ في createServiceV2:', error);
    return { 
      success: false, 
      message: error.message || 'حدث خطأ غير متوقع', 
      error: error.message 
    };
  }
}