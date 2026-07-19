// المسار: app/legal/privacy-policy/page.tsx
export default function PrivacyPolicyPage() {
    return (
      <div className="p-6 prose prose-lg max-w-none prose-a:text-blue-600 hover:prose-a:underline">
        <h1 className="text-3xl font-bold mb-4">سياسة الخصوصية</h1>
        <p className="mb-4 text-gray-500">آخر تحديث: 5 نوفمبر 2025</p>
        <p>
          في "سوق العرب"، نحن نلتزم بحماية خصوصية زوارنا ومستخدمينا. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية.
        </p>
        <h2 className="text-2xl font-bold mt-6 mb-3">المعلومات التي نجمعها</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>معلومات التسجيل:</strong> عند إنشاء حساب، نطلب معلومات مثل الاسم، البريد الإلكتروني، ورقم الهاتف.</li>
          <li><strong>بيانات المعاملات:</strong> معلومات حول المنتجات أو الخدمات التي تشتريها أو تبيعها عبر المنصة.</li>
          <li><strong>بيانات التواصل:</strong> أي معلومات تقدمها عند تواصلك مع فريق الدعم الفني.</li>
        </ul>
        <h2 className="text-2xl font-bold mt-6 mb-3">كيف نستخدم معلوماتك</h2>
        <p>
          نستخدم المعلومات التي نجمعها لتوفير وتحسين خدماتنا، وتخصيص تجربتك، ومعالجة المعاملات، والتواصل معك بشأن حسابك أو عروضنا.
        </p>
        <h2 className="text-2xl font-bold mt-6 mb-3">مشاركة المعلومات</h2>
        <p>
          نحن لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك المعلومات مع مزودي الخدمات الذين يساعدوننا في تشغيل المنصة (مثل بوابات الدفع) أو عند الطلب بموجب القانون.
        </p>
      </div>
    );
  }
