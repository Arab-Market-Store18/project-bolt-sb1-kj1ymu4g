// المسار: app/help/faq/page.tsx
export default function FaqPage() {
    return (
      <div className="p-6 prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-6">الأسئلة الشائعة</h1>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg">كيف يمكنني إنشاء حساب؟</h3>
            <p className="text-gray-700 mt-1">
              يمكنك إنشاء حساب جديد بسهولة عن طريق النقر على زر "تسجيل" في أعلى الصفحة وإدخال بريدك الإلكتروني أو رقم هاتفك.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">هل البيع والشراء آمن على المنصة؟</h3>
            <p className="text-gray-700 mt-1">
              نعم، نحن نأخذ الأمان على محمل الجد. نوفر نظام تواصل داخلي ونشجع على مراجعة تقييمات البائعين قبل الشراء. ومع ذلك، ننصح دائماً بالحذر وتجنب مشاركة المعلومات الشخصية خارج المنصة.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">كيف يمكنني التواصل مع البائع؟</h3>
            <p className="text-gray-700 mt-1">
              في صفحة كل منتج أو خدمة، ستجد أزراراً للتواصل مع البائع مباشرة عبر نظام الرسائل الداخلي للمنصة أو عبر الواتساب إذا كان البائع قد أتاح هذه الميزة.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">ماذا أفعل إذا واجهت مشكلة مع طلب؟</h3>
            <p className="text-gray-700 mt-1">
              الخطوة الأولى هي التواصل مباشرة مع البائع لمحاولة حل المشكلة. إذا لم تتمكن من الوصول إلى حل، يمكنك التواصل مع فريق الدعم الفني لـ "سوق العرب" للمساعدة في التوسط.
            </p>
          </div>
        </div>
      </div>
    );
  }
