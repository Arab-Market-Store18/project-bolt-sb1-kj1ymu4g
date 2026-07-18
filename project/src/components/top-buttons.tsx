// المسار: components/TopButtons.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Store, Loader2, Sparkles } from "lucide-react";
import { SmartmMerchantButton } from '@/features/merchant/management/components/SmartmMerchantButton';
import { SmartButton } from "@/features/service/management/components/SmartButton";

export function TopButtons() {
  const router = useRouter();

  const {
    isLoading,
    isLoggedIn,
    isSeller,
    isServiceProvider,
    sellerProfile,
    serviceProviderProfile,
    displayName,
  } = useAuth();

  const [mounted, setMounted] = useState(false);
  // يتحكم في ظهور أزرار إنشاء الصفحة (للزائر والمشتري معاً)
  const [showCreateButtons, setShowCreateButtons] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // إعادة تعيين حالة الأزرار عند تغيّر الدور لمنع تسرّب الحالة
  useEffect(() => {
    setShowCreateButtons(false);
  }, [isLoggedIn, isSeller, isServiceProvider]);

  // حالة التحميل — skeleton خفيف لا يعطّل عرض الصفحة
  if (!mounted || isLoading) {
    return (
      <div className="flex flex-wrap gap-3 my-6 justify-center items-center">
        <div className="h-12 w-44 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 my-6 justify-center items-center">

      {/* ── الحالة 1: مزود خدمة ─────────────────────────────────── */}
      {isServiceProvider && serviceProviderProfile && (
        <Button
          onClick={() => router.push('/service/dashboard')}
          size="lg"
          className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white h-12"
        >
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarImage src={serviceProviderProfile.logo_url || undefined} />
            <AvatarFallback className="text-sm bg-green-700 text-white">
              {serviceProviderProfile.business_name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold">{serviceProviderProfile.business_name}</span>
        </Button>
      )}

      {/* ── الحالة 2: تاجر (وليس مزود خدمة) ───────────────────── */}
      {isSeller && !isServiceProvider && sellerProfile && (
        <Button
          onClick={() => router.push('/seller/dashboard')}
          size="lg"
          className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white h-12"
        >
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarImage src={sellerProfile.logo_url || undefined} />
            <AvatarFallback className="text-sm bg-purple-700 text-white">
              {sellerProfile.business_name?.charAt(0) || 'T'}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold">{sellerProfile.business_name}</span>
        </Button>
      )}

      {/* ── الحالة 3: مشتري / زائر مسجّل (بدون متجر) ──────────── */}
      {isLoggedIn && !isSeller && !isServiceProvider && (
        <div className="flex flex-wrap items-center gap-3">
          {/* بطاقة الاسم */}
          <div className="flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <User className="h-4 w-4" />
            <span>{displayName}</span>
          </div>

          {/* زر الترقية إلى صاحب صفحة */}
          {!showCreateButtons ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-dashed border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500 text-xs h-9 px-3"
              onClick={() => setShowCreateButtons(true)}
            >
              <Sparkles className="h-3.5 w-3.5 ml-1" />
              هل تريد إنشاء صفحة؟
            </Button>
          ) : (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <SmartmMerchantButton />
              <SmartButton />
              <button
                onClick={() => setShowCreateButtons(false)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── الحالة 4: زائر غير مسجّل ────────────────────────────── */}
      {!isLoggedIn && (
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => setShowCreateButtons(prev => !prev)}
            size="lg"
            className="h-12"
          >
            <Store className="ml-2 h-4 w-4" />
            إنشاء صفحة تجارية
          </Button>
          <div
            className={`flex items-center gap-3 transition-all duration-500 ease-in-out ${
              showCreateButtons ? 'max-w-xl opacity-100' : 'max-w-0 opacity-0'
            } overflow-hidden`}
          >
            <SmartmMerchantButton />
            <SmartButton />
          </div>
        </div>
      )}
    </div>
  );
}
