// المسار: middleware.ts
// لماذا هذا الملف ضروري: عميل المتصفح (@supabase/ssr) يخزّن الجلسة في cookies حتى تتزامن
// مع الخادم (Server Components/Actions). لكن دون middleware يقوم بتحديث الـ access token
// المنتهي الصلاحية (تنتهي صلاحيته افتراضياً خلال ساعة) على كل طلب، تبقى الكوكيز تحمل توكن
// قديم/منتهي دون تجديد موثوق — يظهر المستخدم "مسجّل دخول" في الواجهة بينما auth.uid() في
// قاعدة البيانات يكون فارغاً (AuthSessionMissingError / فشل RLS)، مما يفسّر: ظهور التاجر/مزود
// الخدمة كـ"مشتري"، وفشل إرسال رسائل الدردشة رغم تسجيل الدخول الظاهري.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // مهم: استدعاء getUser() هنا (وليس getSession()) هو ما يُجبر مكتبة supabase-js على
  // التحقق من صلاحية التوكن وتجديده تلقائياً عبر refresh token عند الحاجة، وكتابة
  // الكوكيز المحدّثة في الاستجابة — دون هذا الاستدعاء لا يحدث أي تجديد فعلي.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
