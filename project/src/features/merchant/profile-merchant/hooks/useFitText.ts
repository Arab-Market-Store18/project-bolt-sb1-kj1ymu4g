//  features/merchant/profile-merchant/hooks/useFitText.ts


import { useEffect, RefObject } from 'react';

interface UseFitTextOptions {
  textRef: RefObject<HTMLElement>;
  containerRef: RefObject<HTMLElement>;
}

export const useFitText = (options: UseFitTextOptions): void => {
  const { textRef, containerRef } = options;
  
  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;
    
    const observer = new ResizeObserver(() => {
      const { style } = text;
      style.fontSize = '';
      const initialFontSize = parseFloat(window.getComputedStyle(text).fontSize);
      let currentFontSize = initialFontSize;
      
      while (container.scrollWidth > container.clientWidth && currentFontSize > 10) {
        currentFontSize -= 0.5;
        style.fontSize = `${currentFontSize}px`;
      }
    });
    
    observer.observe(container);
    
    const initialCheck = () => {
      observer.disconnect();
      observer.observe(container);
    };
    
    setTimeout(initialCheck, 100);
    return () => observer.disconnect();
  }, [textRef, containerRef]);
};
