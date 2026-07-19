// المسار: lib/utils/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

async function getCloudinarySignature(paramsToSign: object) {
  try {
    const response = await fetch('/api/sign-cloudinary-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paramsToSign }),
    });
    
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Failed to get a signature from the server.');
    }
    
    const { signature } = await response.json();
    return signature;
    
  } catch (error) {
    console.error("Error fetching signature:", error);
    throw error;
  }
}



// ⭐⭐ دالة بديلة لرفع الملفات مع تتبع التقدم (للمستقبل) ⭐⭐
export async function uploadToCloudinaryWithProgress(
  file: File,
  options: {
    folder: string;
    onProgress?: (percentage: number) => void;
  }
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. الحصول على التوقيع
      const payload = {
        folder: options.folder,
        timestamp: Math.round(new Date().getTime() / 1000),
      };
      
      const signature = await getCloudinarySignature(payload);

      // 2. إعداد FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
      formData.append('signature', signature);
      formData.append('folder', options.folder);
      formData.append('timestamp', payload.timestamp.toString());

      const isVideo = file.type.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('Cloudinary cloud name not configured');
      }

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      // 3. استخدام XMLHttpRequest للتتبع الدقيق للتقدم
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && options.onProgress) {
          const percentage = Math.round((event.loaded * 100) / event.total);
          options.onProgress(percentage);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.secure_url) {
              resolve(data.secure_url);
            } else {
              reject(new Error('No URL returned from Cloudinary'));
            }
          } catch (parseError) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });
      
      xhr.open('POST', url);
      xhr.send(formData);
      
    } catch (error: any) {
      reject(error);
    }
  });
}

// --- باقي الدوال المساعدة تبقى كما هي ---
export function getOptimizedMediaUrl(url: string | null | undefined, type: 'image' | 'video' = 'image'): string {
    if (!url || !url.includes('res.cloudinary.com')) {
        return url || (type === 'image' ? '/placeholder.svg' : '');
    }
    if (url.includes('w_1200')) {
        return url.replace('/upload/', '/upload/f_auto,q_auto:good/');
    }
    if (url.includes('/upload/') && url.includes('w_')) {
        return url;
    }
    const imageTransformations = "f_auto,q_auto:good,w_1200,c_limit";
    const videoTransformations = "f_auto,q_auto:good,w_1280,c_scale";
    const transformations = type === 'video' ? videoTransformations : imageTransformations;
    const parts = url.split('/upload/');
    if (parts.length < 2) return url;
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}

export function extractPublicId(cloudinaryUrl: string): string | null {
    if (!cloudinaryUrl?.includes('res.cloudinary.com')) return null;
    try {
        const urlParts = cloudinaryUrl.split('/upload/');
        if (urlParts.length < 2) return null;
        const afterUpload = urlParts[1];
        const parts = afterUpload.split('/');
        const hasTransformations = parts[0]?.includes('w_') || parts[0]?.includes('f_');
        if (hasTransformations && parts.length > 1) {
            return parts.slice(1).join('/').replace(/\.[^/.]+$/, '');
        }
        return afterUpload.replace(/\.[^/.]+$/, '');
    } catch {
        return null;
    }
}

export async function getFileSizeFromUrl(url: string): Promise<number> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        return size ? parseInt(size) : 0;
    } catch {
        return 0;
    }
}

export function generateSizeUrl(cloudinaryUrl: string, size: 'thumb' | 'medium' | 'large' | 'original' = 'medium'): string {
    if (!cloudinaryUrl?.includes('res.cloudinary.com')) return cloudinaryUrl;
    
    const sizes = {
        thumb: 'w_300,h_300,c_fill,q_auto:low',
        medium: 'w_800,c_limit,q_auto:good',
        large: 'w_1200,c_limit,q_auto:good',
        original: '' // بدون تحويلات
    };
    
    const transformations = sizes[size];
    if (!transformations) return cloudinaryUrl;
    
    const parts = cloudinaryUrl.split('/upload/');
    if (parts.length < 2) return cloudinaryUrl;
    
    const existingTransformations = parts[1].split('/')[0];
    const hasExisting = existingTransformations.includes('w_') || existingTransformations.includes('f_');
    
    if (hasExisting) {
        const pathParts = parts[1].split('/');
        return `${parts[0]}/upload/${transformations}/${pathParts.slice(1).join('/')}`;
    }
    
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}