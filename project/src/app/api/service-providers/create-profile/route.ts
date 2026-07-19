// src/app/api/service-providers/create-profile/route.ts
// يستخدم service role لإنشاء سجل مزود الخدمة ورفع الصور — يتجاوز RLS كلياً
import { NextResponse } from 'next/server';
import { createAdminServerClient } from '@/lib/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, providerData, logoBase64, logoExt, storeImageBase64, storeImageExt } = body;

    if (!userId || !providerData) {
      return NextResponse.json({ message: 'بيانات ناقصة.' }, { status: 400 });
    }

    const adminClient = createAdminServerClient();
    if (!adminClient) {
      return NextResponse.json(
        { message: 'خطأ في إعدادات الخادم (service role key مفقود).' },
        { status: 500 }
      );
    }

    // التحقق من أن userId موجود فعلاً في auth.users
    const { data: userCheck, error: userCheckError } =
      await adminClient.auth.admin.getUserById(userId);

    if (userCheckError || !userCheck?.user) {
      return NextResponse.json({ message: 'مستخدم غير صالح.' }, { status: 403 });
    }

    // ── رفع الصور بصلاحية service role (يتجاوز RLS كلياً) ──────────────
    let logoUrl: string | null = null;
    let storeImageUrl: string | null = null;

    if (logoBase64 && logoExt) {
      try {
        const buf = Buffer.from(logoBase64, 'base64');
        const path = `${userId}/logo-${Date.now()}.${logoExt}`;
        const mime = `image/${logoExt === 'jpg' ? 'jpeg' : logoExt}`;
        const { error } = await adminClient.storage
          .from('seller-assets')
          .upload(path, buf, { contentType: mime, upsert: true });
        if (!error) {
          logoUrl = adminClient.storage.from('seller-assets').getPublicUrl(path).data.publicUrl;
        } else {
          console.warn('[API] فشل رفع الشعار:', error.message);
        }
      } catch (err) {
        console.warn('[API] خطأ في رفع الشعار:', err);
      }
    }

    if (storeImageBase64 && storeImageExt) {
      try {
        const buf = Buffer.from(storeImageBase64, 'base64');
        const path = `${userId}/store-image-${Date.now()}.${storeImageExt}`;
        const mime = `image/${storeImageExt === 'jpg' ? 'jpeg' : storeImageExt}`;
        const { error } = await adminClient.storage
          .from('seller-assets')
          .upload(path, buf, { contentType: mime, upsert: true });
        if (!error) {
          storeImageUrl = adminClient.storage.from('seller-assets').getPublicUrl(path).data.publicUrl;
        } else {
          console.warn('[API] فشل رفع صورة الغلاف:', error.message);
        }
      } catch (err) {
        console.warn('[API] خطأ في رفع صورة الغلاف:', err);
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    // Allowlist: نأخذ فقط الحقول المسموح بها — نمنع mass-assignment
    const allowed = {
      user_id:             userId,
      business_name:       providerData.business_name       ?? null,
      logo_url:            logoUrl,
      store_image_url:     storeImageUrl,
      country:             providerData.country              ?? null,
      city:                providerData.city                 ?? null,
      phone_numbers:       providerData.phone_numbers        ?? null,
      category_id:         providerData.category_id          ?? null,
      provider_type:       providerData.provider_type        ?? ['SERVICE_PROVIDER'],
      is_setup_complete:   providerData.is_setup_complete    ?? true,
      specialization:      providerData.specialization       ?? null,
      qualifications:      providerData.qualifications       ?? null,
      certifications:      providerData.certifications       ?? null,
      years_of_experience: providerData.years_of_experience  ?? null,
      availability:        providerData.availability         ?? null,
      working_days:        providerData.working_days         ?? null,
      emergency_service:   providerData.emergency_service    ?? false,
      store_type:          providerData.store_type           ?? 'online',
      physical_address:    providerData.physical_address     ?? null,
      description:         providerData.description          ?? null,
      created_at:          providerData.created_at           ?? new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    };

    const { data: insertedProvider, error: providerError } = await adminClient
      .from('service_providers')
      .insert(allowed)
      .select('id')
      .single();

    if (providerError) {
      if (providerError.code === '23505' || providerError.message.includes('duplicate')) {
        return NextResponse.json(
          { message: 'هذا البريد الإلكتروني مسجل بالفعل كمزود خدمة.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ message: providerError.message }, { status: 400 });
    }

    if (!insertedProvider) {
      return NextResponse.json({ message: 'فشل إنشاء سجل مزود الخدمة.' }, { status: 500 });
    }

    // تحديث metadata المستخدم (اختياري — لا يوقف التسجيل إذا فشل)
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        user_type: 'service_provider',
        is_service_provider: true,
        service_provider_id: insertedProvider.id,
      },
    }).catch(() => {});

    return NextResponse.json({ id: insertedProvider.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'حدث خطأ غير متوقع.' },
      { status: 500 }
    );
  }
}
