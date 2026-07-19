// المسار: app/api/follow/route.ts
// النسخة النهائية والنظيفة التي تعتمد على دوال SQL الآمنة
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// دالة للتعامل مع طلبات "المتابعة" (POST)
export async function POST(request: Request) {
  try {
    const { sellerId } = await request.json();
    // انتظار دالة cookies() باستخدام await - هذا هو التصحيح الرئيسي
    const cookieStore = await cookies();
    const supabase = createServerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }
    // التحقق من أن البائع موجود
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', sellerId)
      .single();
    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }
    // تجنب متابعة النفس
    if (user.id === sellerId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }
    // استدعاء الدالة الآمنة للمتابعة
    const { data, error } = await supabase.rpc('follow_seller', { 
      seller_id_to_follow: sellerId 
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // إرسال إشعار "متابع جديد" للبائع مع شعار المتابِع
    try {
      const [{ data: followerProfile }, { data: followerSeller }, { data: followerProvider }] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('sellers').select('logo_url, business_name').eq('id', user.id).maybeSingle(),
        supabase.from('service_providers').select('logo_url, business_name').eq('user_id', user.id).maybeSingle(),
      ]);

      const followerName = followerSeller?.business_name
        || followerProvider?.business_name
        || followerProfile?.full_name
        || 'أحدهم';
      const followerLogo = followerSeller?.logo_url
        || followerProvider?.logo_url
        || followerProfile?.avatar_url
        || null;

      await supabase.from('notifications').insert({
        user_id: sellerId,
        type: 'new_follower',
        message: `قام "${followerName}" بمتابعتك.`,
        link: null,
        sender_logo_url: followerLogo,
      });
    } catch (_) {
      // إخفاق الإشعار لا يُوقف نجاح المتابعة
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully followed seller'
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
// دالة للتعامل مع طلبات "إلغاء المتابعة" (DELETE)
export async function DELETE(request: Request) {
  try {
    const { sellerId } = await request.json();
    // انتظار دالة cookies() باستخدام await - هذا هو التصحيح الرئيسي
    const cookieStore = await cookies();
    const supabase = createServerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }
    // التحقق من أن المستخدم يتابع البائع فعلاً
    const { data: existingFollow, error: followError } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('seller_id', sellerId)
      .single();
    if (followError || !existingFollow) {
      return NextResponse.json({ error: 'You are not following this seller' }, { status: 400 });
    }
    // استدعاء الدالة الآمنة لإلغاء المتابعة
    const { data, error } = await supabase.rpc('unfollow_seller', { 
      seller_id_to_unfollow: sellerId 
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ 
      success: true,
      message: 'Successfully unfollowed seller'
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
// دالة إضافية للحصول على حالة المتابعة (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const cookieStore = await cookies();
    const supabase = createServerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }
    // التحقق من حالة المتابعة
    const { data: isFollowing, error: followError } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('seller_id', sellerId)
      .single();
    return NextResponse.json({ 
      isFollowing: !!isFollowing 
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
