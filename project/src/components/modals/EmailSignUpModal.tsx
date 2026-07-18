
// المسار: components/modals/EmailSignUpModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useModal } from "@/hooks/use-modal";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

import { X, Mail, User, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartmMerchantButton } from '@/features/merchant/management/components/SmartmMerchantButton';

export function EmailSignUpModal() {
  const router = useRouter();
  const { isOpen: isModalOpen, type, onClose } = useModal();
  const supabase = createSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const isOpen = isModalOpen && type === 'emailSignUp';

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (isLoading) return;
    setFullName("");
    setEmail("");
    setPassword("");
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
    onClose();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'BUYER' } },
    });
    setIsLoading(false);
    if (error) {
      if (error.message.includes("User already registered")) {
        setError("هذا البريد مسجل بالفعل. حاول تسجيل الدخول أو تأكيد بريدك الإلكتروني.");
      } else {
        setError(error.message);
      }
    }
    else if (data.user) {
      if (data.user.identities && data.user.identities.length === 0) {
         setSuccessMessage("تم إرسال رابط التفعيل إلى بريدك الإلكتروني. يرجى تأكيد حسابك ثم تسجيل الدخول.");
         setTimeout(() => handleClose(), 5000);
      } else {
        setSuccessMessage("تم إنشاء الحساب بنجاح! جاري تحديث الصفحة...");
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // تسجيل الدخول
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) {
      setIsLoading(false);
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      return;
    }

    if (user) {
      // التحقق من دور المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setIsLoading(false);
        setError("حدث خطأ في التحقق من الصلاحيات.");
        return;
      }

      if (profile?.role === 'admin') {
        // إذا كان مديرًا، توجيه إلى لوحة التحكم الإدارية
        setSuccessMessage("أهلاً بك أيها المدير! جاري توجيهك إلى لوحة التحكم...");
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      
} else {
  // إذا كان مستخدمًا عاديًا، فقط أغلق النافذة
  setSuccessMessage("أهلاً بعودتك! تم تسجيل دخولك بنجاح.");
  setTimeout(() => {
    handleClose();
    // لا حاجة لإعادة تحميل الصفحة - AuthProvider سيلتقط التغيير
  }, 1500);
}



    } else {
      setIsLoading(false);
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col max-h-full overflow-y-auto">
        <div className="p-6">
          <button onClick={handleClose} disabled={isLoading} className="absolute top-4 left-4 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 z-10">
            <X className="h-5 w-5" />
          </button>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-green-700 dark:text-green-400">{successMessage}</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">أهلاً بك في سوق العرب!</h2>
              </div>
              <div className="border rounded-lg p-4 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
                  للتفاعل مع المنتجات، يرجى تسجيل الدخول أو إنشاء حساب كزائر أولاً.
                </h3>
                <Tabs defaultValue="signup" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
                    <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                  </TabsList>
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName-signup"><User className="h-4 w-4 inline-block ml-2" />الاسم الكامل</Label>
                        <Input id="fullName-signup" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} dir="rtl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-signup"><Mail className="h-4 w-4 inline-block ml-2" />البريد الإلكتروني</Label>
                        <Input id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signup"><KeyRound className="h-4 w-4 inline-block ml-2" />كلمة المرور</Label>
                        <Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} dir="ltr" />
                      </div>
                      <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء حسابي'}
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-signin"><Mail className="h-4 w-4 inline-block ml-2" />البريد الإلكتروني</Label>
                        <Input id="email-signin" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signin"><KeyRound className="h-4 w-4 inline-block ml-2" />كلمة المرور</Label>
                        <Input id="password-signin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} dir="ltr" />
                      </div>
                      <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تسجيل الدخول'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
              {error && <p className="text-xs text-red-600 mt-3 text-center">{error}</p>}
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-3">
                  أنت تاجر وتريد إنشاء صفحة وعرض منتجاتك؟
                </h3>
                <div className="border rounded-lg p-4 text-center bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <p className="text-sm text-muted-foreground mb-3">
                    انشئ متجرك الآن وابدأ البيع خلال دقائق!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
