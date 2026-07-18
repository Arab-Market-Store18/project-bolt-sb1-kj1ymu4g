// src/app/api/sellers/create-profile/route.ts
// يستخدم service role لإنشاء سجل التاجر ورفع الصور — يتجاوز RLS كلياً
import { NextResponse } from 'next/server';
import { createAdminServerClient } from '@/lib/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sellerData, logoBase64, logoExt, storeImageBase64, storeImageExt } = body;

    if (!userId || !sellerData) {
      return NextResponse.json({ message: 'بيانات ناقصة.' }, { status: 400 });
    }

    const adminClient = createAdminServerClient();
    if (!adminClient) {
      return NextResponse.json(
        { message: 'خطأ في إعدادات الخادم (service role key مفقود).' },
        { status: 500 }
      );
    }

    // التحقق من أن المستخدم موجود فعلاً في auth.users قبل إدراج أي بيانات له
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

    const { data: insertedSeller, error: sellerError } = await adminClient
      .from('sellers')
      .insert({
        ...sellerData,
        id: userId,
        auth_user_id: userId,
        logo_url: logoUrl,
        store_image_url: storeImageUrl,
      })
      .select('id')
      .single();

    if (sellerError) {
      if (sellerError.code === '23505' || sellerError.message.includes('duplicate')) {
        return NextResponse.json(
          { message: 'هذا البريد الإلكتروني مسجل بالفعل كتاجر.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ message: sellerError.message }, { status: 400 });
    }

    if (!insertedSeller) {
      return NextResponse.json({ message: 'فشل إنشاء سجل التاجر.' }, { status: 500 });
    }

    return NextResponse.json({ id: insertedSeller.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'حدث خطأ غير متوقع.' },
      { status: 500 }
    );
  }
}
