// المسار: src/features/merchant/management/components/SmartmMerchantButton.tsx
// النسخة الجديدة والمبسطة

"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import { WelcomeModal } from "@/components/welcome-modal";
import { LoginModal } from "@/components/login-modal";
import { MerchantRegistrationModal } from "@/features/merchant/management/components/MerchantRegistrationModal";
import { useAuth } from "@/context/AuthContext";

export function SmartmMerchantButton() {
  const router = useRouter();
  const { isLoading, isLoggedIn, isSeller } = useAuth();

  // 3. نحتفظ فقط بالحالة الخاصة بالتحكم في النوافذ المنبثقة (Modals)
  const [modalState, setModalState] = useState({
    showWelcomeModal: false,
    showLoginModal: false,
    showRegisterModal: false,
  });

  // ❌ تم حذف كل كود useEffect الخاص بالمصادقة. لم نعد بحاجة إليه!

  const handleSellerPageAction = () => {
    if (isLoading) return;

    if (isSeller) {
      router.push('/seller/dashboard');
    } else if (isLoggedIn) {
      // إذا كان مسجلاً دخوله ولكنه ليس تاجرًا، اعرض نافذة التسجيل كتاجر مباشرة
      setModalState({ ...modalState, showRegisterModal: true });
    } else {
      // إذا لم يكن مسجلاً دخوله على الإطلاق، ابدأ من نافذة الترحيب
      setModalState({ ...modalState, showWelcomeModal: true });
    }
  };

  // --- دوال مساعدة للتحكم في النوافذ المنبثقة ---
  const openRegisterModal = () => setModalState({ showWelcomeModal: false, showLoginModal: false, showRegisterModal: true });
  const openLoginModal = () => setModalState({ showWelcomeModal: false, showRegisterModal: false, showLoginModal: true });
  const closeModal = () => setModalState({ showWelcomeModal: false, showLoginModal: false, showRegisterModal: false });

  return (
    <>
      <Button 
        onClick={handleSellerPageAction} 
        className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
      >
        <Store className="h-4 w-4 ml-2" />
        {isSeller ? "الذهاب للوحة التحكم" : "انضم كتاجر"}
      </Button>

      {/* --- النوافذ المنبثقة (Modals) --- */}
      {/* لم يتغير منطقها، فقط كيفية استدعائها */}
      <WelcomeModal
        isOpen={modalState.showWelcomeModal}
        onClose={closeModal}
        onNewUser={openRegisterModal}
        onExistingUser={openLoginModal}
        title="مرحبًا بك في سوق العرب"
        subtitle="انضم إلى مجتمع التجار"
        description="اختر الخيار المناسب لتبدأ رحلتك التجارية معنا"
        newUserText="أنا تاجر جديد"
        existingUserText="لدي حساب بالفعل"
      />

      <MerchantRegistrationModal
        isOpen={modalState.showRegisterModal}
        onClose={closeModal}
        onSuccess={closeModal} // بعد النجاح، أغلق النافذة. AuthContext سيتولى الباقي.
        registrationType="products"
      />

      <LoginModal
        isOpen={modalState.showLoginModal}
        onClose={closeModal}
        onLoginSuccess={closeModal} // بعد النجاح، أغلق النافذة. AuthContext سيتولى الباقي.
        onRegisterClick={openRegisterModal}
      />
    </>
  );
}
