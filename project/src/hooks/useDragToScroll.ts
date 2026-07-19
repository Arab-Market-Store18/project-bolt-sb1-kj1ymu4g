// المسار: hooks/useDragToScroll.ts
// الإصلاح النهائي: حل مشكلة عدم استقرار التمرير العمودي على الهاتف.

import { useRef, useEffect, useCallback } from 'react';

export type IndicatorState = 'idle' | 'dragging' | 'readyToFetch' | 'fetching';

interface UseDragToScrollProps {
  onFetch?: () => void;
  isFetching?: boolean;
  hasNextPage?: boolean;
  setIndicatorState?: (state: IndicatorState) => void;
  threshold?: number;
}

export function useDragToScroll<T extends HTMLElement>({
  onFetch,
  isFetching = false,
  hasNextPage = false,
  setIndicatorState,
  threshold = 80,
}: UseDragToScrollProps = {}) {
  const ref = useRef<T>(null);

  const isAtEnd = useCallback(() => {
    const el = ref.current;
    if (!el) return false;
    return el.scrollWidth - el.scrollLeft - el.clientWidth < 5;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let startY: number;
    let isScrolling: 'horizontal' | 'vertical' | null = null;
    let currentDragState: IndicatorState = 'idle';

    const updateState = (newState: IndicatorState) => {
      if (currentDragState !== newState) {
        currentDragState = newState;
        setIndicatorState?.(newState);
      }
    };

    // --- قسم الفأرة (الكمبيوتر) - لا تغييرات جوهرية ---
    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      element.classList.add('active-scroll');
      startX = e.pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
      if (onFetch && hasNextPage && !isFetching && isAtEnd()) {
        updateState('dragging');
      }
    };

    const handleMouseLeaveOrUp = () => {
      isDown = false;
      element.classList.remove('active-scroll');
      if (currentDragState === 'readyToFetch') {
        onFetch?.();
      } else if (currentDragState !== 'fetching') {
        updateState('idle');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const walk = x - startX;

      if (currentDragState === 'dragging' || currentDragState === 'readyToFetch') {
        const dragDistance = -walk;
        updateState(dragDistance > threshold ? 'readyToFetch' : 'dragging');
      }
      
      element.scrollLeft = scrollLeft - walk * 2;
    };

    // --- قسم اللمس (الهاتف) - هنا الإصلاح الرئيسي ---
    const handleTouchStart = (e: TouchEvent) => {
      isDown = true;
      const touch = e.touches[0];
      startX = touch.pageX - element.offsetLeft;
      startY = touch.pageY;
      scrollLeft = element.scrollLeft;
      isScrolling = null; // إعادة تعيين اتجاه التمرير مع كل لمسة جديدة
      if (onFetch && hasNextPage && !isFetching && isAtEnd()) {
        updateState('dragging');
      }
    };

    const handleTouchEnd = () => {
      isDown = false;
      if (currentDragState === 'readyToFetch') {
        onFetch?.();
      } else if (currentDragState !== 'fetching') {
        updateState('idle');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      const touch = e.touches[0];
      const x = touch.pageX - element.offsetLeft;
      const y = touch.pageY;
      const walkX = x - startX;
      const walkY = y - startY;

      // --- هذا هو المنطق الذكي لتحديد النية ---
      if (isScrolling === null) {
        // انتظر حتى تكون الحركة واضحة قبل أن تقرر الاتجاه
        if (Math.abs(walkY) > Math.abs(walkX) && Math.abs(walkY) > 5) {
          isScrolling = 'vertical';
        } else if (Math.abs(walkX) > Math.abs(walkY) && Math.abs(walkX) > 5) {
          isScrolling = 'horizontal';
        }
      }

      // إذا كانت النية هي التمرير العمودي، لا تفعل شيئًا واترك الأمر للمتصفح
      if (isScrolling === 'vertical') {
        isDown = false; // تجاهل بقية حركات هذه اللمسة
        updateState('idle');
        return;
      }

      // إذا كانت النية هي التمرير الأفقي، امنع سلوك المتصفح وتحكم في التمرير
      if (isScrolling === 'horizontal') {
        e.preventDefault();

        if (currentDragState === 'dragging' || currentDragState === 'readyToFetch') {
          const dragDistance = -walkX;
          updateState(dragDistance > threshold ? 'readyToFetch' : 'dragging');
        }
        
        element.scrollLeft = scrollLeft - walkX * 2;
      }
    };

    // تطبيق الأحداث (مع إزالة passive: true)
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeaveOrUp);
    element.addEventListener('mouseup', handleMouseLeaveOrUp);
    element.addEventListener('mousemove', handleMouseMove);
    
    // --- التغيير الرئيسي هنا ---
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      // إزالة الأحداث
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeaveOrUp);
      element.removeEventListener('mouseup', handleMouseLeaveOrUp);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isAtEnd, hasNextPage, isFetching, onFetch, setIndicatorState, threshold]);

  return ref;
}
