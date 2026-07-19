import { Metadata } from 'next';
import { AdvertisementSpaces } from '@/features/advertisement/components/AdvertisementSpaces';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'المساحات الإعلانية - السوق العربي',
  description: 'استعرض المساحات الإعلانية المتاحة واطلب إعلانك الآن',
};

export default function AdvertiseSpacesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              المساحات الإعلانية
            </h1>
            <p className="text-base sm:text-lg text-white/90 mb-6">
              اختر من بين مساحات إعلانية متعددة على موقعنا الموثوق. وصل إلى آلاف الزوار يومياً.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="secondary" size="lg">
                <Link href="/advertise/request">
                  طلب إعلان
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-foreground">
                <Link href="/advertise/my-ads">إدارة إعلاناتي</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">المساحات المتاحة</h2>
          <p className="text-muted-foreground">اختر المساحة المناسبة لإعلانك من بين الخيارات أدناه</p>
        </div>
        
        <AdvertisementSpaces />

        {/* قسم المعلومات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t">
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">1</span>
              اختر المساحة
            </h3>
            <p className="text-sm text-muted-foreground">
              استعرض المساحات المتاحة واختر ما يناسب احتياجات إعلانك
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">2</span>
              أكمل الطلب والدفع
            </h3>
            <p className="text-sm text-muted-foreground">
              ملأ بيانات إعلانك وقم بعملية الدفع الآمنة
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">3</span>
              الموافقة والنشر
            </h3>
            <p className="text-sm text-muted-foreground">
              بعد مراجعة الفريق، سينشر إعلانك على الفور
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
