// المسار: app/api/auth/check-email/route.ts
// --- النسخة النهائية باستخدام createServerClient (الطريقة الأكثر موثوقية) ---
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ message: 'البريد الإلكتروني مطلوب.' }, { status: 400 });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ message: "إعدادات الخادم غير مكتملة." }, { status: 500 });
  }
  try {
    // --- **هذا هو التعديل الجوهري** ---
    // نستخدم createServerClient لإنشاء اتصال مدير مضمون ومباشر
    const supabaseAdmin = createServerClient(supabaseUrl, serviceKey);
    // نستدعي الدالة المخصصة 'get_user_by_email'
    const { data: userId, error } = await supabaseAdmin.rpc('get_user_by_email', { p_email: email });
    if (error) {
      throw new Error("حدث خطأ أثناء التحقق من البريد الإلكتروني.");
    }
    // إذا أعادت الدالة قيمة (userId ليس null)، فهذا يعني أن المستخدم موجود
    if (userId) {
      return NextResponse.json({ exists: true });
    } else {
      // إذا لم تعد الدالة قيمة (userId هو null)، فهذا يعني أن المستخدم غير موجود
      return NextResponse.json({ exists: false });
    }
  } catch (error: any) {
    return NextResponse.json({ message: `خطأ في الخادم: ${error.message}` }, { status: 500 });
  }
}
