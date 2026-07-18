// hooks/use-supabase-browser.ts
"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect } from 'react';

export function useSupabaseBrowser() {
  const [supabase, setSupabase] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // فقط في المتصفح
    if (typeof window === 'undefined') {
      console.log('🔄 useSupabaseBrowser: Running on server, skipping');
      return;
    }

    console.log('🚀 useSupabaseBrowser: Creating client...');
    
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase.auth.token',
          storage: window.localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      }
    );

    console.log('✅ useSupabaseBrowser: Client created');
    setSupabase(client);
    setIsReady(true);

    // اختبر الاتصال
    const testConnection = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        console.log('🔐 useSupabaseBrowser: Session test', {
          hasSession: !!session,
          userEmail: session?.user?.email
        });
      } catch (error) {
        console.error('❌ useSupabaseBrowser: Auth test failed', error);
      }
    };

    testConnection();
  }, []);

  return { supabase, isReady };
}