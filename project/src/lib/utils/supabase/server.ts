// src/lib/utils/supabase/server.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// import { createSafeSupabaseClient } from './client'; // هذا السطر يجب أن يبقى معلقًا أو محذوفًا

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase environment variables are missing!');
}

export const createSupabaseServerClient = async (): Promise<SupabaseClient> => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables not configured');
    }
    const cookieStore = await cookies();
    return createSsrClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.warn('Cookie set error (development mode):', error);
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('❌ Failed to create authenticated server client:', error);
    return createSafeServerClient();
  }
};

export const createSafeServerClient = (): SupabaseClient => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return createClient(
      SUPABASE_URL || 'https://dummy.supabase.co',
      SUPABASE_ANON_KEY || 'dummy-key',
      { auth: { persistSession: false } }
     );
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
};

export const createAdminServerClient = (): SupabaseClient | null => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
};

export const createServerComponentClient = createSupabaseServerClient;
export const createRouteHandlerClient = createSupabaseServerClient;
export const createServerActionClient = createSupabaseServerClient;
