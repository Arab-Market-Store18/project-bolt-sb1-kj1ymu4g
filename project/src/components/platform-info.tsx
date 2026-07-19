// المسار: components/platform-info.tsx
// -- نسخة نهائية ومحسّنة بالكامل بالطريقة الحديثة --

"use client";

import { useModal } from "@/hooks/use-modal";
import { Mail, Phone, MapPin } from "lucide-react";

import PrivacyPolicyPage from "@/app/legal/privacy-policy/page";
import TermsOfServicePage from "@/app/legal/terms-of-service/page";
import ReturnPolicyPage from "@/app/legal/return-policy/page";
import FaqPage from "@/app/help/faq/page";

export function PlatformInfo() {
  const { onOpen } = useModal();

  // دالة عامة لفتح أي محتوى في نافذة Modal
  const showContent = (title: string, content: React.ReactNode) => {
    onOpen('contentViewer', {
      title: title,
      children: content,
    });
  };

  return (
    <div className="space-y-6 p-2">
      {/* قسم "عن سوق العرب" مع محتوى محسّن */}
      <div>
        <h3 className="font-bold text-lg mb-2">عن سوق العرب</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          سوق العرب هي بوابتك الرائدة لعالم التجارة الإلكترونية في الوطن العربي. مهمتنا هي تمكين التجار والمبدعين من الوصول إلى أوسع شريحة من العملاء، وتوفير تجربة تسوق فريدة وآمنة للمشترين.
        </p>
      </div>

      {/* قسم "تواصل معنا" مع أيقونات وروابط مفعلة */}
      <div>
        <h3 className="font-bold text-lg mb-2">تواصل معنا</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <a href="mailto:shababda@gmail.com" className="hover:underline hover:text-blue-600">
              shababda@gmail.com
            </a>
          </li>
          <li className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-500" />
            <a href="tel:+967774279104" className="hover:underline hover:text-blue-600" dir="ltr">
              +967 774 279 104
            </a>
          </li>
          <li className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>صنعاء، اليمن</span>
          </li>
        </ul>
      </div>

      {/* قسم "روابط مهمة" مع أزرار تفتح نوافذ Modal */}
      <div>
        <h3 className="font-bold text-lg mb-2">روابط مهمة</h3>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>
            <button onClick={() => showContent('سياسة الخصوصية', <PrivacyPolicyPage />)} className="hover:underline text-right w-full">
              سياسة الخصوصية
            </button>
          </li>
          <li>
            <button onClick={() => showContent('شروط الاستخدام', <TermsOfServicePage />)} className="hover:underline text-right w-full">
              شروط الاستخدام
            </button>
          </li>
          <li>
            <button onClick={() => showContent('سياسة الإرجاع', <ReturnPolicyPage />)} className="hover:underline text-right w-full">
              سياسة الإرجاع
            </button>
          </li>
          <li>
            <button onClick={() => showContent('الأسئلة الشائعة', <FaqPage />)} className="hover:underline text-right w-full">
              الأسئلة الشائعة
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
