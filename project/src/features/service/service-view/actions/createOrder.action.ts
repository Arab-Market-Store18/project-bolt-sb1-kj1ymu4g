// المسار: features/service/service-view/actions/createOrder.action.ts
// -- Server Action لإنشاء طلب خدمة --

'use server';

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

interface OrderData {
  serviceId: string;
  providerId: string;
  serviceOptions: Record<string, any>;
  requirements: Record<string, any>;
  notes?: string;
  deliveryDate?: string;
}

export async function createServiceOrder(orderData: OrderData): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient();

    
    console.log('🛒 [Server Action] إنشاء طلب خدمة:', orderData.serviceId);

    // التحقق من المصادقة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول لطلب الخدمة'
      };
    }

    const { serviceId, providerId, serviceOptions, requirements, notes, deliveryDate } = orderData;

    // التحقق من وجود الخدمة
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, title, base_price, discounted_price, currency, delivery_time_days')
      .eq('id', serviceId)
      .eq('status', 'ACTIVE')
      .single();

    if (serviceError || !service) {
      return {
        success: false,
        error: 'الخدمة غير موجودة أو غير متاحة'
      };
    }

    // حساب السعر النهائي
    const basePrice = service.discounted_price || service.base_price;
    const optionsPrice = Object.values(serviceOptions || {})
      .reduce((sum: number, option: any) => sum + (option.price_adjustment || 0), 0);
    const totalPrice = basePrice + optionsPrice;

    // حساب وقت التسليم
    const baseDeliveryTime = service.delivery_time_days || 7;
    const optionsDeliveryTime = Object.values(serviceOptions || {})
      .reduce((sum: number, option: any) => sum + (option.delivery_time_adjustment || 0), 0);
    const estimatedDeliveryDays = baseDeliveryTime + optionsDeliveryTime;

    // حساب تاريخ التسليم المتوقع
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDeliveryDays);

    // إنشاء الطلب
    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .insert({
        service_id: serviceId,
        provider_id: providerId,
        client_id: user.id,
        title: service.title,
        base_price: service.base_price,
        discounted_price: service.discounted_price,
        options_price: optionsPrice,
        total_price: totalPrice,
        currency: service.currency || 'SAR',
        service_options: serviceOptions,
        requirements: requirements,
        notes: notes?.trim() || null,
        delivery_date: deliveryDate || estimatedDeliveryDate.toISOString(),
        estimated_delivery_days: estimatedDeliveryDays,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('خطأ في إنشاء الطلب:', orderError);
      return {
        success: false,
        error: 'حدث خطأ أثناء إنشاء الطلب'
      };
    }

    // جلب شعار/صورة المشتري لإرفاقه مع الإشعار
    const [{ data: buyerProfile }, { data: buyerSeller }, { data: buyerProvider }] = await Promise.all([
      supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle(),
      supabase.from('sellers').select('logo_url').eq('id', user.id).maybeSingle(),
      supabase.from('service_providers').select('logo_url').eq('user_id', user.id).maybeSingle(),
    ]);
    const buyerLogoUrl = buyerSeller?.logo_url || buyerProvider?.logo_url || buyerProfile?.avatar_url || null;

    // إرسال إشعار للموفر
    await supabase
      .from('notifications')
      .insert({
        user_id: providerId,
        title: 'طلب خدمة جديد',
        message: `لديك طلب جديد للخدمة "${service.title}"`,
        type: 'ORDER',
        reference_id: order.id,
        created_at: new Date().toISOString(),
        sender_logo_url: buyerLogoUrl,
      });

    // إعادة تحميل الصفحات
    revalidatePath(`/services/${serviceId}`);
    revalidatePath('/dashboard/orders');
    revalidatePath('/provider/dashboard/orders');

    console.log('✅ [Server Action] تم إنشاء الطلب بنجاح:', order.id);
    return {
      success: true,
      orderId: order.id
    };

  } catch (error) {
    console.error('❌ [Server Action] خطأ غير متوقع:', error);
    return {
      success: false,
      error: 'حدث خطأ غير متوقع في إنشاء الطلب'
    };
  }
}