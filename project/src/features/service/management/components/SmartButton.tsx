// المسار: src/features/service/management/components/SmartButton.tsx
// النسخة الجديدة والمبسطة

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { WelcomeModal } from "@/components/welcome-modal";
import { LoginModal } from "@/components/login-modal";
import ProviderRegistrationModal from "@/features/service/management/components/ProviderRegistrationModal";
import { useAuth } from "@/context/AuthContext"; // ✨ 1. استيراد الخطاف المركزي
import { useRouter } from 'next/navigation'; // سنستخدم الراوتر للتوجيه السلس

export function SmartButton() {
  const router = useRouter();
  // 2. استهلاك الحالة الجاهزة من المصدر المركزي
  const { isLoading, isLoggedIn, isServiceProvider } = useAuth();

  // 3. نحتفظ فقط بالحالة الخاصة بالتحكم في النوافذ المنبثقة
  const [modalState, setModalState] = useState({
    showWelcomeModal: false,
    showLoginModal: false,
    showRegisterModal: false,
  });

  // ❌ تم حذف كل كود useEffect الخاص بالمصادقة.

  const handleAction = () => {
    if (isLoading) return;

    if (isServiceProvider) {
      // استخدام router.push للتوجيه السلس بدلاً من إعادة تحميل الصفحة
      router.push("/service/dashboard");
    } else if (isLoggedIn) {
      // إذا كان مسجلاً دخوله ولكنه ليس مقدم خدمة، اعرض نافذة التسجيل مباشرة
      setModalState({ ...modalState, showRegisterModal: true });
    } else {
      // إذا لم يكن مسجلاً دخوله، ابدأ من نافذة الترحيب
      setModalState({ ...modalState, showWelcomeModal: true });
    }
  };

  // --- دوال مساعدة للتحكم في النوافذ المنبثقة ---
  const openRegisterModal = () => setModalState({ showWelcomeModal: false, showLoginModal: false, showRegisterModal: true });
  const openLoginModal = () => setModalState({ showWelcomeModal: false, showRegisterModal: false, showLoginModal: true });
  const closeModal = () => {
    setModalState({ showWelcomeModal: false, showLoginModal: false, showRegisterModal: false });
  };

  // 4. في Next.js، من الأفضل عدم عرض المكون أثناء SSR لمنع Hydration Mismatch
  // سيتم عرض المكون بعد التحميل من جانب العميل فقط

  return (
    <>
      <Button 
        onClick={handleAction} 
        variant="secondary"
      >
        <Wrench className="ml-2" />
        {isServiceProvider ? "لوحة تحكم الخدمات" : "إنشاء صفحة خدمة"}
      </Button>

      {/* --- النوافذ المنبثقة (Modals) --- */}
      <WelcomeModal
        isOpen={modalState.showWelcomeModal}
        onClose={closeModal}
        onNewUser={openRegisterModal}
        onExistingUser={openLoginModal}
        title="مرحبًا بكم في قسم الخدمات"
        description="انضم إلى مجتمعنا من مقدمي الخدمات وابدأ في عرض خدماتك اليوم."
        newUserText="أنا مقدم خدمة جديد"
        existingUserText="لدي حساب بالفعل"
      />

      <LoginModal
        isOpen={modalState.showLoginModal}
        onClose={closeModal}
        onLoginSuccess={closeModal} // أغلق النافذة فقط. AuthContext سيتولى الباقي.
        onRegisterClick={openRegisterModal}
      />

      <ProviderRegistrationModal
        isOpen={modalState.showRegisterModal}
        onClose={closeModal}
        onSuccess={closeModal} // أغلق النافذة فقط. AuthContext سيتولى الباقي.
      />
    </>
  );
}
