'use server';

import { createSafeServerClient as createClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateServiceData {
  service_provider_id: string;
  seller_id: string;
  name?: string;
  description?: string;
  main_category_id?: number;
  category_id?: number | null;
  suggested_category_name?: string | null;
  subcategory?: string;
  price?: number;
  discount_price?: number | null;
  currency?: string;
  images?: string[] | null;
  video_url?: string | null;
  specifications?: Record<string, string> | null;
  additional_prices?: Array<{
    price: number;
    currency: string;
    label: string;
  }> | null;
  is_active?: boolean;
  is_approved?: boolean;
}

export interface UpdateServiceResponse {
  success: boolean;
  message: string;
  service?: any;
  error?: string;
}

export async function updateService(data: UpdateServiceData): Promise<UpdateServiceResponse> {
  try {
    const supabase = createClient();

    // 1. التحقق من صلاحيات المستخدم
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً', error: 'Unauthorized' };
    }

    // 2. التحقق من أن المستخدم يملك البائع المرتبط بالخدمة
    const { data: service, error: serviceError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', data.service_provider_id)
      .single();

    if (serviceError || !service) {
      return { success: false, message: 'الخدمة غير موجودة', error: 'Service not found' };
    }

    if (service.seller_id !== data.seller_id) {
      return { success: false, message: 'ليس لديك صلاحية تعديل هذه الخدمة', error: 'Forbidden' };
    }

    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('user_id, status')
      .eq('id', data.seller_id)
      .single();

    if (sellerError || !seller) {
      return { success: false, message: 'البائع غير موجود', error: 'Seller not found' };
    }

    if (seller.user_id !== user.id) {
      return { success: false, message: 'ليس لديك صلاحية تعديل هذه الخدمة', error: 'Forbidden' };
    }

    if (seller.status !== 'active') {
      return { success: false, message: 'حساب البائع غير مفعل', error: 'Seller not active' };
    }

    // 3. التحقق من صحة البيانات (اختياري)
    const { valid, errors } = await validateServiceData(data);
    if (!valid) {
      return { success: false, message: 'بيانات الخدمة غير صحيحة', error: errors.join(', ') };
    }

    // 4. تحديث الخدمة
    const { data: updatedService, error: updateError } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description,
        main_category_id: data.main_category_id,
        category_id: data.category_id,
        suggested_category_name: data.suggested_category_name,
        subcategory: data.subcategory,
        price: data.price,
        discount_price: data.discount_price,
        currency: data.currency,
        images: data.images,
        video_url: data.video_url,
        specifications: data.specifications,
        additional_prices: data.additional_prices,
        is_active: data.is_active,
        is_approved: data.is_approved,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.service_provider_id)
      .select(`
        *,
        sellers (
          id,
          business_name,
          logo_url,
          country
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return { success: false, message: `فشل تعديل الخدمة: ${updateError.message}`, error: updateError.message };
    }

    // 5. إعادة التحقق من الصفحات
    revalidatePath('/service/dashboard');
    revalidatePath(`/seller/${data.seller_id}/services`);
    revalidatePath('/services');

    return { success: true, message: 'تم تعديل الخدمة بنجاح', service: updatedService };
  } catch (error: any) {
    console.error('Unexpected error in updateService:', error);
    return { success: false, message: `حدث خطأ غير متوقع: ${error.message}`, error: error.message };
  }
}
// =================================================================
// ✅ دالة updateService المعدلة (تستقبل بيانات جاهزة)
// =================================================================
export async function updateServiceV2({
  serviceId,
  userId,
  sellerId,
  name,
  description,
  mainCategoryId,
  categoryId,
  suggestedCategoryName,
  subcategory,
  price,
  discountPrice,
  currency,
  images,
  videoUrl,
  specifications,
  additionalPrices,
  isActive,
  isApproved
}: {
  serviceId: string;
  userId: string;
  sellerId: string;
  name?: string;
  description?: string;
  mainCategoryId?: number;
  categoryId?: number | null;
  suggestedCategoryName?: string | null;
  subcategory?: string;
  price?: number;
  discountPrice?: number | null;
  currency?: string;
  images?: string[] | null;
  videoUrl?: string | null;
  specifications?: Record<string, string> | null;
  additionalPrices?: Array<{ price: number; currency: string; label: string; }> | null;
  isActive?: boolean;
  isApproved?: boolean;
}): Promise<UpdateServiceResponse> {
  try {
    const supabase = createClient();

    // ✅ 1. التحقق من المصادقة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً', error: 'Unauthorized' };
    }

    // ✅ 2. التحقق من تطابق userId مع المستخدم المسجل
    if (user.id !== userId) {
      return { success: false, message: 'لا يمكنك تعديل خدمة نيابة عن مستخدم آخر', error: 'Forbidden' };
    }

    // ✅ 3. التحقق من وجود الخدمة وصلاحية البائع (اختياري، يمكن إزالته إذا كنت تثق بالبيانات)
    const { data: service, error: serviceError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return { success: false, message: 'الخدمة غير موجودة', error: 'Service not found' };
    }

    if (service.seller_id !== sellerId) {
      return { success: false, message: 'ليس لديك صلاحية تعديل هذه الخدمة', error: 'Forbidden' };
    }

    // ✅ 4. التحقق من صحة البيانات (اختياري)
    const validationData = {
      name,
      description,
      price,
      discount_price: discountPrice,
      category_id: categoryId,
      suggested_category_name: suggestedCategoryName,
      images
    };
    const { valid, errors } = await validateServiceData(validationData);
    if (!valid) {
      return { success: false, message: 'بيانات الخدمة غير صحيحة', error: errors.join(', ') };
    }

    // ✅ 5. تحديث الخدمة
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (mainCategoryId !== undefined) updateData.main_category_id = mainCategoryId;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (suggestedCategoryName !== undefined) updateData.suggested_category_name = suggestedCategoryName;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (price !== undefined) updateData.price = price;
    if (discountPrice !== undefined) updateData.discount_price = discountPrice;
    if (currency !== undefined) updateData.currency = currency;
    if (images !== undefined) updateData.images = images;
    if (videoUrl !== undefined) updateData.video_url = videoUrl;
    if (specifications !== undefined) updateData.specifications = specifications;
    if (additionalPrices !== undefined) updateData.additional_prices = additionalPrices;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (isApproved !== undefined) updateData.is_approved = isApproved;
    
    updateData.updated_at = new Date().toISOString();

    const { data: updatedService, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', serviceId)
      .select(`
        *,
        sellers (
          id,
          business_name,
          logo_url,
          country
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return { success: false, message: `فشل تعديل الخدمة: ${updateError.message}`, error: updateError.message };
    }

    // ✅ 6. إعادة التحقق من الصفحات
    revalidatePath('/service/dashboard');
    revalidatePath(`/seller/${sellerId}/services`);
    revalidatePath('/services');

    return { success: true, message: 'تم تعديل الخدمة بنجاح', service: updatedService };

  } catch (error: any) {
    console.error('Unexpected error in updateServiceV2:', error);
    return { success: false, message: `حدث خطأ غير متوقع: ${error.message}`, error: error.message };
  }
}
// دالة مساعدة للتحقق من صحة البيانات
export async function validateServiceData(data: any): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (data.name && data.name.trim().length < 3) {
    errors.push('العنوان يجب أن يكون 3 أحرف على الأقل');
  }
  if (data.description && data.description.trim().length < 20) {
    errors.push('الوصف يجب أن يكون 20 حرفًا على الأقل');
  }
  if (data.price && data.price <= 0) {
    errors.push('السعر يجب أن يكون أكبر من الصفر');
  }
  if (data.discount_price && data.price && data.discount_price >= data.price) {
    errors.push('سعر الخصم يجب أن يكون أقل من السعر الأساسي');
  }
  if (!data.category_id && !data.suggested_category_name) {
    errors.push('يجب تحديد فئة للخدمة');
  }
  if (data.images && (!Array.isArray(data.images) || data.images.length === 0)) {
    errors.push('يجب رفع صورة واحدة على الأقل');
  }
  if (data.images && data.images.length > 10) {
    errors.push('لا يمكن رفع أكثر من 10 صور');
  }

  return { valid: errors.length === 0, errors };
}
