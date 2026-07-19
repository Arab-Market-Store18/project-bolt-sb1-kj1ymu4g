// المسار: app/api/sign-cloudinary-upload/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { paramsToSign } = await request.json();
    
    // التحقق من وجود CLOUDINARY_URL
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (!cloudinaryUrl) {
      return NextResponse.json(
        { error: 'CLOUDINARY_URL is not configured' },
        { status: 500 }
      );
    }
    
    // استخراج apiSecret ببساطة
    // cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const urlParts = cloudinaryUrl.split(':');
    if (urlParts.length < 3) {
      return NextResponse.json(
        { error: 'Invalid CLOUDINARY_URL format' },
        { status: 500 }
      );
    }
    
    const apiSecret = urlParts[2].split('@')[0];
    if (!apiSecret) {
      return NextResponse.json(
        { error: 'Could not extract API secret' },
        { status: 500 }
      );
    }
    
    // إنشاء التوقيع باستخدام crypto مباشرة (بدون استيراد cloudinary)
    const crypto = require('crypto');
    
    // ترتيب المعاملات أبجديًا
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key]}`)
      .join('&');
    
    // إنشاء التوقيع SHA1
    const signature = crypto
      .createHash('sha1')
      .update(sortedParams + apiSecret)
      .digest('hex');
    
    return NextResponse.json({ signature });
    
  } catch (error: any) {
    console.error('Cloudinary signature error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign' },
      { status: 500 }
    );
  }
}