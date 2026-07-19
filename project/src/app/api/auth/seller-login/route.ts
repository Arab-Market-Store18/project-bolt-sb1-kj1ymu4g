// في ملف: app/api/auth/seller-login/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // إنشاء عميل Supabase صحيح مع معالج الكوكيز حتى تُضبط الجلسة تلقائياً
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // يتجاهل الخطأ إذا استُدعي من Server Component (لا يمكن تعديل الكوكيز)
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 401 }
      );
    }

    return NextResponse.json(
      { message: 'Login successful!', user: data.user },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
