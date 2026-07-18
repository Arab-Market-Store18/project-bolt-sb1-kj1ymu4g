// 📍 المسار: features/service/management/actions/deleteService.action.ts
// 📋 الوظيفة: إجراء حذف/إخفاء الخدمة على الخادم - يدعم الحذف الناعم (إخفاء) والحذف الفعلي مع إمكانية استعادة الخدمات المحذوفة ناعما.
'use server';

import { createSafeServerClient as createClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface DeleteServiceResponse {
  success: boolean;
  message: string;
  error?: string;
}

// =================================================================
// الدالة الأصلية (تبقى كما هي للتوافق)
// =================================================================
export async function deleteService(
  serviceId: string, 
  sellerId: string,
  softDelete: boolean = true // حذف ناعم افتراضيًا
): Promise<DeleteServiceResponse> {
  try {
    const supabase = createClient();
    
    // 1. التحقق من صلاحيات البائع
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        error: 'Unauthorized'
      };
    }

    // 2. التحقق من ملكية الخدمة
    const { data: existingService, error: fetchError } = await supabase
      .from('products')
      .select('seller_id, status')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      return {
        success: false,
        message: 'الخدمة غير موجودة',
        error: 'Service not found'
      };
    }

    if (existingService.seller_id !== sellerId) {
      return {
        success: false,
        message: 'ليس لديك صلاحية لحذف هذه الخدمة',
        error: 'Forbidden'
      };
    }

    // 3. الحذف (ناعم أو فعلي)
    let deleteResult;
    
    if (softDelete) {
      // الحذف الناعم: تحديث حالة الخدمة
      deleteResult = await supabase
        .from('products')
        .update({
          is_active: false,
          is_approved: false,
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
    } else {
      // الحذف الفعلي
      deleteResult = await supabase
        .from('products')
        .delete()
        .eq('id', serviceId);
    }

    if (deleteResult.error) {
      console.error('Error deleting service:', deleteResult.error);
      return {
        success: false,
        message: `فشل حذف الخدمة: ${deleteResult.error.message}`,
        error: deleteResult.error.message
      };
    }

    // 4. تحديث الصفحات
    revalidatePath('/service/dashboard');
    revalidatePath(`/seller/${sellerId}/services`);
    revalidatePath('/services');

    return {
      success: true,
      message: softDelete 
        ? 'تم إخفاء الخدمة بنجاح (يمكنك استعادتها لاحقًا)' 
        : 'تم حذف الخدمة نهائيًا بنجاح'
    };

  } catch (error: any) {
    console.error('Unexpected error in deleteService:', error);
    return {
      success: false,
      message: `حدث خطأ غير متوقع: ${error.message}`,
      error: error.message
    };
  }
}

// =================================================================
// الدالة الأصلية لاستعادة الخدمة (تبقى كما هي للتوافق)
// =================================================================
export async function restoreService(
  serviceId: string, 
  sellerId: string
): Promise<DeleteServiceResponse> {
  try {
    const supabase = createClient();
    
    // التحقق من صلاحيات البائع
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        error: 'Unauthorized'
      };
    }

    // التحقق من ملكية الخدمة
    const { data: existingService, error: fetchError } = await supabase
      .from('products')
      .select('seller_id, status')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService || existingService.seller_id !== sellerId) {
      return {
        success: false,
        message: 'الخدمة غير موجودة أو لا تملك صلاحية الاستعادة',
        error: 'Service not found or forbidden'
      };
    }

    // استعادة الخدمة
    const { error: restoreError } = await supabase
      .from('products')
      .update({
        is_active: true,
        status: 'pending',
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (restoreError) {
      console.error('Error restoring service:', restoreError);
      return {
        success: false,
        message: `فشل استعادة الخدمة: ${restoreError.message}`,
        error: restoreError.message
      };
    }

    // تحديث الصفحات
    revalidatePath('/service/dashboard');
    revalidatePath(`/seller/${sellerId}/services`);

    return {
      success: true,
      message: 'تم استعادة الخدمة بنجاح'
    };

  } catch (error: any) {
    console.error('Unexpected error in restoreService:', error);
    return {
      success: false,
      message: `حدث خطأ غير متوقع: ${error.message}`,
      error: error.message
    };
  }
}

// =================================================================
// ✅ الدالة الجديدة للحذف (تستقبل بيانات جاهزة)
// =================================================================
export async function deleteServiceV2({
  serviceId,
  userId,
  softDelete = true
}: {
  serviceId: string;
  userId: string;
  softDelete?: boolean;
}): Promise<DeleteServiceResponse> {
  try {
    const supabase = createClient();
    
    // ✅ 1. التحقق من المصادقة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        error: 'Unauthorized'
      };
    }

    // ✅ 2. التحقق من تطابق userId مع المستخدم المسجل
    if (user.id !== userId) {
      return {
        success: false,
        message: 'لا يمكنك حذف خدمة نيابة عن مستخدم آخر',
        error: 'Forbidden'
      };
    }

    // ✅ 3. التحقق من ملكية الخدمة
    const { data: existingService, error: fetchError } = await supabase
      .from('products')
      .select('seller_id, status')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      return {
        success: false,
        message: 'الخدمة غير موجودة',
        error: 'Service not found'
      };
    }

    // ✅ 4. التحقق من أن المستخدم يملك الخدمة (من خلال seller_id)
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('user_id')
      .eq('id', existingService.seller_id)
      .single();

    if (sellerError || !seller) {
      return {
        success: false,
        message: 'لم يتم العثور على البائع',
        error: 'Seller not found'
      };
    }

    if (seller.user_id !== userId) {
      return {
        success: false,
        message: 'ليس لديك صلاحية لحذف هذه الخدمة',
        error: 'Forbidden'
      };
    }

    // ✅ 5. الحذف (ناعم أو فعلي)
    let deleteResult;
    
    if (softDelete) {
      // الحذف الناعم: تحديث حالة الخدمة
      deleteResult = await supabase
        .from('products')
        .update({
          is_active: false,
          is_approved: false,
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);
    } else {
      // الحذف الفعلي
      deleteResult = await supabase
        .from('products')
        .delete()
        .eq('id', serviceId);
    }

    if (deleteResult.error) {
      console.error('Error deleting service:', deleteResult.error);
      return {
        success: false,
        message: `فشل حذف الخدمة: ${deleteResult.error.message}`,
        error: deleteResult.error.message
      };
    }

    // ✅ 6. تحديث الصفحات
    revalidatePath('/service/dashboard');
    revalidatePath(`/seller/${existingService.seller_id}/services`);
    revalidatePath('/services');

    return {
      success: true,
      message: softDelete 
        ? 'تم إخفاء الخدمة بنجاح (يمكنك استعادتها لاحقًا)' 
        : 'تم حذف الخدمة نهائيًا بنجاح'
    };

  } catch (error: any) {
    console.error('Unexpected error in deleteServiceV2:', error);
    return {
      success: false,
      message: `حدث خطأ غير متوقع: ${error.message}`,
      error: error.message
    };
  }
}

// =================================================================
// ✅ الدالة الجديدة لاستعادة الخدمة (تستقبل بيانات جاهزة)
// =================================================================
export async function restoreServiceV2({
  serviceId,
  userId
}: {
  serviceId: string;
  userId: string;
}): Promise<DeleteServiceResponse> {
  try {
    const supabase = createClient();
    
    // ✅ 1. التحقق من المصادقة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        error: 'Unauthorized'
      };
    }

    // ✅ 2. التحقق من تطابق userId مع المستخدم المسجل
    if (user.id !== userId) {
      return {
        success: false,
        message: 'لا يمكنك استعادة خدمة نيابة عن مستخدم آخر',
        error: 'Forbidden'
      };
    }

    // ✅ 3. التحقق من ملكية الخدمة
    const { data: existingService, error: fetchError } = await supabase
      .from('products')
      .select('seller_id, status')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      return {
        success: false,
        message: 'الخدمة غير موجودة',
        error: 'Service not found'
      };
    }

    // ✅ 4. التحقق من أن المستخدم يملك الخدمة
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('user_id')
      .eq('id', existingService.seller_id)
      .single();

    if (sellerError || !seller) {
      return {
        success: false,
        message: 'لم يتم العثور على البائع',
        error: 'Seller not found'
      };
    }

    if (seller.user_id !== userId) {
      return {
        success: false,
        message: 'ليس لديك صلاحية لاستعادة هذه الخدمة',
        error: 'Forbidden'
      };
    }

    // ✅ 5. استعادة الخدمة
    const { error: restoreError } = await supabase
      .from('products')
      .update({
        is_active: true,
        status: 'pending',
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (restoreError) {
      console.error('Error restoring service:', restoreError);
      return {
        success: false,
        message: `فشل استعادة الخدمة: ${restoreError.message}`,
        error: restoreError.message
      };
    }

    // ✅ 6. تحديث الصفحات
    revalidatePath('/service/dashboard');
    revalidatePath(`/seller/${existingService.seller_id}/services`);

    return {
      success: true,
      message: 'تم استعادة الخدمة بنجاح'
    };

  } catch (error: any) {
    console.error('Unexpected error in restoreServiceV2:', error);
    return {
      success: false,
      message: `حدث خطأ غير متوقع: ${error.message}`,
      error: error.message
    };
  }
}