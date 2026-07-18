// hooks/useShareUtils.ts
import { useCallback } from 'react';

export function useShareUtils() {
  const shareOnWhatsApp = useCallback((text: string, url: string) => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  }, []);

  const shareOnFacebook = useCallback((url: string) => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  }, []);
// المسار: app/api/recommendations/related/route.ts
// الوظيفة: جلب المنتجات ذات الصلة (من نفس البائع) لصفحة تفاصيل المنتج.

import { createRouteHandlerClient } from '@/lib/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// يضمن أن يتم تنفيذ هذا المسار ديناميكياً عند كل طلب، لتجنب التخزين المؤقت للبيانات.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. استخلاص المعلمات من رابط الطلب
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId'); 
    const currentProductId = searchParams.get('currentProductId');

    // 2. التحقق من وجود المعلمات الضرورية
    if (!sellerId || !currentProductId) {
      return NextResponse.json(
        { success: false, error: 'معلمات مطلوبة: sellerId, currentProductId' },
        { status: 400 }
      );
    }

    // 3. إنشاء اتصال آمن بقاعدة البيانات
    const supabase = createRouteHandlerClient();

    // 4. بناء وتنفيذ استعلام قاعدة البيانات
    // تم التأكد من أن اسم عمود البائع هو 'seller_id'
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select(`
        id, name, price, images, currency, discount_price, thumbnail_image_url
      `)
      .eq('seller_id', sellerId) // <-- استخدام اسم العمود الصحيح والمؤكد
      .neq('id', currentProductId)      // استبعاد المنتج الحالي
      .eq('is_active', true)            // جلب المنتجات النشطة فقط
      .eq('is_approved', true)          // جلب المنتجات المعتمدة فقط
      .limit(24);                       // وضع حد أقصى للنتائج

    // 5. معالجة أخطاء قاعدة البيانات
    if (allError) {
      console.error("Related API - Supabase Fetch Error:", allError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'فشل في جلب البيانات. تحقق من تكوين الخادم.' 
      }, { status: 500 });
    }

    // 6. إرجاع البيانات بنجاح
    return NextResponse.json({
      success: true,
      data: allProducts || [], // ضمان إرجاع مصفوفة دائماً
    });

  } catch (error: any) {
    // 7. معالجة الأخطاء العامة في الخادم
    console.error("Related API - Unexpected Server Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'خطأ غير متوقع في الخادم' 
    }, { status: 500 });
  }
}
  const shareOnTwitter = useCallback((text: string, url: string) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  }, []);

  const shareOnTelegram = useCallback((text: string, url: string) => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  }, []);

  const shareViaEmail = useCallback((subject: string, body: string) => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }, []);

  const shareOnLinkedIn = useCallback((url: string, title: string, summary: string) => {
    const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('خطأ في نسخ النص:', error);
      return false;
    }
  }, []);

  const generateQRCodeUrl = useCallback((url: string, size: number = 200) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  }, []);

  return {
    shareOnWhatsApp,
    shareOnFacebook,
    shareOnTwitter,
    shareOnTelegram,
    shareViaEmail,
    shareOnLinkedIn,
    copyToClipboard,
    generateQRCodeUrl
  };
}