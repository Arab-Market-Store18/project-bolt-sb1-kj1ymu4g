// src/lib/image-optimizer.ts
import imageCompression from 'browser-image-compression';

export class ImageOptimizer {
  /**
   * ضغط الصور بذكاء حسب النوع
   */
  static async compressImage(
    file: File, 
    imageType: 'product' | 'gallery' | 'avatar' = 'product'
  ): Promise<File> {
    try {
      console.log(`📸 بدء ضغط: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // إعدادات الضغط حسب النوع
      const presets = {
        product: { maxSizeMB: 1, maxWidthOrHeight: 1200, initialQuality: 0.8 },
        gallery: { maxSizeMB: 1.5, maxWidthOrHeight: 1600, initialQuality: 0.85 },
        avatar: { maxSizeMB: 0.5, maxWidthOrHeight: 800, initialQuality: 0.9 }
      };
      
      const preset = presets[imageType];
      
      const options = {
        maxSizeMB: preset.maxSizeMB,
        maxWidthOrHeight: preset.maxWidthOrHeight,
        useWebWorker: true,
        initialQuality: preset.initialQuality,
        alwaysKeepResolution: true,
        fileType: this.getOutputFormat(file.type)
      };
      
      const compressedFile = await imageCompression(file, options);
      
      console.log(`✅ تم الضغط: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      return compressedFile;
      
    } catch (error) {
      console.error('❌ فشل الضغط:', error);
      return file; // ارجع الملف الأصلي في حالة الخطأ
    }
  }
  
  /**
   * معالجة مجموعة صور
   */
  static async compressMultiple(
    files: File[], 
    imageType: 'product' | 'gallery' | 'avatar' = 'product'
  ): Promise<File[]> {
    const results: File[] = [];
    
    for (const file of files) {
      const compressed = await this.compressImage(file, imageType);
      results.push(compressed);
    }
    
    return results;
  }
  
  private static getOutputFormat(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'image/png': 'image/png',
      'image/webp': 'image/webp',
      'image/jpeg': 'image/jpeg',
      'image/jpg': 'image/jpeg',
    };
    
    return typeMap[mimeType.toLowerCase()] || 'image/jpeg';
  }
}