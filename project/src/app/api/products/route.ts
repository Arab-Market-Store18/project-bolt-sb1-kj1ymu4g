//  app/api/products/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: CookieOptions) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  );
  try {
    const { searchParams } = new URL(request.url);
    const p_limit = parseInt(searchParams.get('limit') || '20', 10);
    const p_offset = parseInt(searchParams.get('offset') || '0', 10);
    const p_sort_option = searchParams.get('sort') || 'created_at_desc';
    const { data: { user } } = await supabase.auth.getUser();
    const p_user_id = user?.id ?? null;
    const { data, error } = await supabase.rpc('get_products_with_like_status', { p_user_id, p_limit, p_offset, p_sort_option });
    if (error) { throw error; }
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Server Error" }, { status: 500 });
  }
}
