// المسار: lib/hooks/use-debounce.ts
// -- هذا هو الملف المفقود الذي سبب الخطأ --

"use client";

import { useState, useEffect } from 'react';

/**
 * Hook مخصص لتأخير تحديث قيمة معينة.
 * هذا مفيد لتجنب إعادة التصيير أو استدعاءات API المتكررة أثناء الكتابة أو تغيير قيم بسرعة.
 * @param value القيمة التي تريد تأخيرها.
 * @param delay فترة التأخير بالمللي ثانية.
 * @returns القيمة بعد انتهاء فترة التأخير.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // حالة لتخزين القيمة المؤجلة
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // إعداد مؤقت لتحديث القيمة بعد انتهاء فترة التأخير
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // دالة التنظيف: يتم استدعاؤها عند كل إعادة تصيير قبل تنفيذ التأثير مرة أخرى
    // أو عند إزالة المكون. هذا يمنع تحديث القيمة إذا تغيرت القيمة الأصلية قبل انتهاء التأخير.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // يتم إعادة تشغيل هذا التأثير فقط إذا تغيرت القيمة (value) أو فترة التأخير (delay)

  return debouncedValue;
}
