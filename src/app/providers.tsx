// المسار: src/app/providers.tsx (النسخة النهائية والمعدلة)

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useState, useEffect } from 'react';
import { ModalProvider } from '@/components/providers/modal-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext'; // ✨ 1. استيراد AuthProvider

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 دقيقة
        retry: 1,
        refetchOnWindowFocus: false,
        gcTime: 5 * 60 * 1000, // 5 دقائق
      },
    },
  }));

  useEffect(() => {
    console.log('✅ React Query Provider initialized');
  }, []);

  return (
    // ✨ 2. تغليف كل شيء بـ AuthProvider في المستوى الأعلى
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        <ModalProvider />
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </AuthProvider>
  );
}