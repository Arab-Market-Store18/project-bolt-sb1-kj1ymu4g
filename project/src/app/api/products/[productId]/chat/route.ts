// المسار: app/api/products/[productId]/chat/route.ts
// -- الإصدار النهائي: دردشة عامة مع إرسال آمن للرسائل --

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
// --- دالة GET (لجلب الرسائل) ---
// تم تعديلها لجعل الدردشة عامة ومتاحة للجميع
export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // الاستعلام الصحيح لجلب كل الرسائل لمنتج معين بشكل عام
    const { data: messages, error } = await supabase
      .from('product_chat')
      .select(`
        *,
        profiles (full_name, avatar_url),
        sellers (business_name, logo_url)
      `)
      .eq('product_id', productId) // فلترة الرسائل حسب المنتج فقط
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }
    
    // إرجاع جميع الرسائل التي تم العثور عليها
    return NextResponse.json(messages);

  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


// --- دالة POST (لإرسال رسالة جديدة) ---
// هذه الدالة مسؤولة عن إضافة رسالة جديدة إلى قاعدة البيانات
export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );
    
    const { message } = await request.json();
    
    // 1. التحقق من أن المستخدم مسجل دخوله
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. التحقق من أن الرسالة ليست فارغة
    if (!message || message.trim() === "") {
      return new NextResponse('Message cannot be empty', { status: 400 });
    }

    // 3. جلب معرّف البائع
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single();

    if (productError || !productData) {
      return new NextResponse('Product or Seller not found', { status: 404 });
    }
    
    const sellerId = productData.seller_id;
    
    // 4. تجهيز بيانات الرسالة الجديدة
    const messageData = {
      product_id: productId,
      sender_id: user.id,
      receiver_id: sellerId, // نحفظ معرّف البائع كمستقبل افتراضي للرسالة
      message: message.trim(),
    };

    // 5. إدخال الرسالة في قاعدة البيانات
    const { data: newMessage, error: insertError } = await supabase
      .from('product_chat')
      .insert(messageData)
      .select()
      .single();

    if (insertError) {
        throw insertError;
    }
    
    // 6. إرجاع الرسالة الجديدة التي تم إنشاؤها بنجاح
    return NextResponse.json(newMessage);

  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
