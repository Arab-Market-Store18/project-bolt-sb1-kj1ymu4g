// المسار: /app/login/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { LoginModal } from "@/components/login-modal";
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const handleLoginSuccess = async () => {
    toast({ title: "تم تسجيل الدخول!", description: "جاري توجيهك..." });

    // انتظر قليلاً لتأكيد تثبيت الجلسة
    await new Promise(resolve => setTimeout(resolve, 300));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: "destructive", title: "خطأ", description: "لم نتمكن من التحقق من هويتك." });
      return;
    }

    // ── تحقق من الجداول بالتوازي ──────────────────────────────────────────
    const [sellerRes, providerRes] = await Promise.all([
      supabase.from('sellers').select('id').eq('id', user.id).maybeSingle(),
      supabase.from('service_providers').select('id').eq('user_id', user.id).maybeSingle(),
    ]);

    if (providerRes.data) {
      // مزود خدمة → لوحة الخدمات
      router.push('/service/dashboard');
    } else if (sellerRes.data) {
      // تاجر → لوحة المتجر
      router.push('/seller/dashboard');
    } else {
      // مشتري أو مستخدم جديد → الصفحة الرئيسية
      toast({ title: "أهلاً بك!", description: "يمكنك تصفح المنتجات والخدمات." });
      router.push('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => router.push('/')} 
        onLoginSuccess={handleLoginSuccess} 
        onRegisterClick={() => {}} 
      />
    </div>
  );
}
