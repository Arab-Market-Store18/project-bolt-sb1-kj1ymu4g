// lib/utils/supabase/client.ts - النسخة النهائية مع تحسينات
import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

// ⭐⭐ دالة جلب مع إعادة محاولة — تعيد الاستجابة كما هي (حتى لو كانت خطأ HTTP)
// حتى تتمكن مكتبة supabase-js من قراءة محتوى الخطأ الحقيقي (رسالة، تفاصيل، تلميح، كود)
// نعيد المحاولة فقط عند فشل الشبكة الفعلي (انقطاع الاتصال، انتهاء المهلة) وليس عند أخطاء HTTP العادية (400/401/403/...)
export async function resilientFetch(url: string, options?: RequestInit, retries = 2) {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error('انتهت مهلة الطلب')), 20000); // 20 ثانية مهلة

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // مهم: لا نرمي خطأ عند استجابة غير ناجحة، بل نعيدها كما هي
      // ليقوم supabase-js بقراءة محتوى الخطأ الحقيقي بدلاً من فقدانه
      return response;
    } catch (error) {
      lastError = error;
      console.log(`🔄 محاولة ${i + 1}/${retries} فشلت (خطأ شبكة): ${url}`);
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // تأخير تصاعدي
    }
  }
  throw lastError ?? new Error('فشل الجلب');
}

const createRetryFetch = (maxRetries = 3) => {
  return async (url: RequestInfo, options?: RequestInit): Promise<Response> => {
    return resilientFetch(url.toString(), options, maxRetries);
  };
};

// ⭐⭐ دالة لفحص صحة الاتصال
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  responseTime?: number;
}> {
  try {
    const startTime = Date.now();
    const supabase = createSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1)
      .single();
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        success: false,
        error: error.message,
        responseTime
      };
    }
    
    return {
      success: true,
      responseTime
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export function createSupabaseBrowserClient() {
  // إرجاع العميل الموجود إذا كان موجودًا
  if (client) {
    return client;
  }

  // ✅ إزالة القيم الثابتة والعودة إلى قراءة من متغيرات البيئة
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ✅ إضافة تحقق أفضل للأخطاء
  if (!supabaseUrl || !supabaseKey) {
    const errorMsg = `❌ Supabase Browser Client Error:
      - URL: ${supabaseUrl ? '✓' : '✗'}
      - Key: ${supabaseKey ? '✓' : '✗'}
      
      تأكد من:
      1. وجود ملف .env.local في جذر المشروع
      2. أن المتغيرات تبدأ بـ NEXT_PUBLIC_
      3. إعادة تشغيل خادم التطوير بعد التعديل
    `;
    
    console.error(errorMsg);
    
    // ⭐⭐ بدلاً من رمي خطأ، نعيد عميل وهمي للتنمية
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ إنشاء عميل Supabase وهمي للتنمية');
      client = createBrowserClient(
        'https://dummy.supabase.co',
        'dummy-key',
        {
          global: {
            fetch: createRetryFetch(2)
          }
        }
      ) as SupabaseClient;
      return client;
    }
    
    throw new Error('Supabase environment variables are missing');
  }

  // ⭐⭐ إنشاء العميل مع Retry Fetch
  client = createBrowserClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: createRetryFetch(3) // 3 محاولات
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }) as SupabaseClient;
  
  // ⭐⭐ إضافة event listener لأخطاء الاتصال - ✅ التصحيح هنا
  if (typeof window !== 'undefined' && client) {
    // ✅ استخدام client.auth.onAuthStateChange بدلاً من client.onAuthStateChange
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log('👤 تم تسجيل الخروج');
      }
    });
  }
  
  return client;
}

// ⭐⭐ دالة لفحص حالة Supabase Status
export async function checkSupabaseStatus(): Promise<{
  healthy: boolean;
  message: string;
  details?: any;
}> {
  try {
    // تحقق من status.supabase.com
    const response = await fetch('https://status.supabase.com/api/v2/status.json', {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      return {
        healthy: false,
        message: 'لا يمكن التحقق من حالة Supabase'
      };
    }
    
    const statusData = await response.json();
    
    // تحقق من اتصال المشروع الخاص بك
    const projectCheck = await testSupabaseConnection();
    
    return {
      healthy: projectCheck.success && statusData.status.indicator === 'none',
      message: projectCheck.success ? 
        '✅ الاتصال يعمل' : 
        '❌ مشكلة في الاتصال',
      details: {
        supabaseStatus: statusData.status,
        projectConnection: projectCheck
      }
    };
    
  } catch (error) {
    return {
      healthy: false,
      message: 'فشل في التحقق من الحالة'
    };
  }
}

// ⭐⭐ دالة لإنشاء عميل مع Fallback
export function createSafeSupabaseClient() {
  try {
    return createSupabaseBrowserClient();
  } catch (error) {
    console.warn('⚠️ فشل إنشاء عميل Supabase، استخدام العميل الوهمي');
    
    // عميل وهمي للطوارئ
    const mockClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        })
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      }
    };
    
    return mockClient as unknown as SupabaseClient;
  }
}