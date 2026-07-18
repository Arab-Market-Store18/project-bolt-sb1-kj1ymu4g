// app/layout.tsx - النسخة الكاملة
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/app/providers";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalUploadIndicator } from "@/components/GlobalUploadIndicator";
import { DevAlerts } from '@/components/dev-alerts';
import { createSafeSupabaseClient, testSupabaseConnection } from '@/lib/utils/supabase/client';

// تحسين الأداء: تخزين مؤقت لمدة 60 ثانية
export const revalidate = 60;

const tajawal = localFont({
  src: [
    { path: "../../public/fonts/ArbFONTS-Tajawal-Light.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/ArbFONTS-Tajawal-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/ArbFONTS-Tajawal-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/ArbFONTS-Tajawal-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "ArabMarket - السوق العربي المتكامل",
  description: "منصة تسوق عربية شاملة",
  metadataBase: new URL("https://arabmarket.com"),
  keywords: ["تسوق", "منتجات", "خدمات", "العربية", "سوق"],
};

/**
 * جلب الفئات (محسّنة)
 */
async function getInitialCategories(): Promise<any[]> {
  try {
    const supabase = createSafeSupabaseClient();
    
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, icon_name, parent_id")
      .eq('is_approved', true)
      .limit(15);
    
    if (error) {
      console.warn('Could not fetch categories');
      return [];
    }
    
    return (data || []).map(category => ({
      ...category,
      sub_category: category.parent_id ? [] : undefined
    }));
    
  } catch (error) {
    return [];
  }
}

// دالة خفيفة للتحقق من حالة النظام (للتطوير فقط)
async function getDevStatusAlerts() {
  if (process.env.NODE_ENV !== 'development') {
    return { alerts: [] };
  }
  
  try {
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      return { 
        alerts: [{
          type: 'error',
          title: 'لا يمكن الاتصال بـ Supabase',
          message: connectionTest.error || 'فشل الاتصال'
        }] 
      };
    }
    return { alerts: [] };
  } catch (error) {
    return { alerts: [] };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const devStatus = await getDevStatusAlerts();
  
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${tajawal.variable} font-sans antialiased bg-gray-50`}>
        <GlobalUploadIndicator />
        {devStatus.alerts.length > 0 && process.env.NODE_ENV === 'development' && 
          <DevAlerts alerts={devStatus.alerts} />
        }
        
        <ErrorBoundary>
          <Providers>
            <main className="min-h-screen pb-20">
              {children}
            </main>
            <BottomNavigation />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
