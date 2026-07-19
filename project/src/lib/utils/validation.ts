// المسار: lib/utils/validation.ts

// التحقق من صحة ملف واحد
export function validateFile(file: File, fileType: 'images' | 'videos' | 'raw'): string | null {
  if (!file) {
    return 'لم يتم اختيار ملف';
  }

  const maxSizes = {
    'images': 10 * 1024 * 1024, // 10MB
    'videos': 100 * 1024 * 1024, // 100MB
    'raw': 50 * 1024 * 1024 // 50MB
  };

  if (file.size === 0) {
    return 'الملف فارغ';
  }

  if (file.size > maxSizes[fileType]) {
    return `حجم الملف كبير جدًا. الحد الأقصى: ${maxSizes[fileType] / (1024 * 1024)}MB`;
  }

  const allowedTypes = {
    'images': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    'videos': ['video/mp4', 'video/mkv', 'video/avi', 'video/mov', 'video/webm'],
    'raw': ['application/pdf', 'application/zip', 'text/plain']
  };

  if (!allowedTypes[fileType].includes(file.type)) {
    const supportedTypes = allowedTypes[fileType].map(type => type.split('/')[1]).join(', ');
    return `نوع الملف غير مدعوم. الأنواع المسموحة: ${supportedTypes}`;
  }

  return null; // الملف صالح
}
