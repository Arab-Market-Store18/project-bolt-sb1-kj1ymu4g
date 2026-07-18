// المسار الصحيح: components/providers/query-provider.tsx
// هذا هو الملف الذي يوفر "العقل" لمكتبة TanStack Query

"use client";

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  // نستخدم useState لضمان أن QueryClient يُنشأ مرة واحدة فقط
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
