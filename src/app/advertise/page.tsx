import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart3, DollarSign, Zap, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'الإعلانات - السوق العربي',
  description: 'ادفع للإعلان على منصتنا والوصول إلى آلاف الزوار',
};

export default function AdvertisePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold mb-6">
            وسّع نطاق عملك مع إعلاناتنا
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-8">
            وصل إلى آلاف الزوار المهتمين بمنتجاتك أو خدماتك اليوم
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="secondary" className="font-semibold">
              <Link href="/advertise/spaces">عرض المساحات الإعلانية</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
              <Link href="/advertise/my-ads">إدارة إعلاناتي</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* المميزات الرئيسية */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">لماذا تختار الإعلان معنا؟</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Eye className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">آلاف المشاهدات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                وصل إلى آلاف الزوار اليوميين على منصتنا
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">أسعار تنافسية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                احصل على أفضل قيمة مقابل أموالك
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-600 mb-2" />
              <CardTitle className="text-lg">تفعيل سريع</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ابدأ إعلانك في غضون 24 ساعة من الموافقة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">تتبع الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                راقب أداء إعلانك في الوقت الفعلي
              </p>
            </CardContent>
          </Card>
        </div>

        {/* عملية الإعلان */}
        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">كيف يعمل الإعلان؟</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">اختر المساحة</h3>
              <p className="text-sm text-muted-foreground">
                اختر من بين مساحات متعددة تناسب احتياجاتك
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">ملأ النموذج</h3>
              <p className="text-sm text-muted-foreground">
                أدخل بيانات إعلانك والصورة والرابط
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">ادفع</h3>
              <p className="text-sm text-muted-foreground">
                أكمل عملية الدفع بأمان وسهولة
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">انشر</h3>
              <p className="text-sm text-muted-foreground">
                بعد الموافقة، ينشر إعلانك مباشرة
              </p>
            </div>
          </div>
        </div>

        {/* الأسعار */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">الأسعار مرنة وتنافسية</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            نقدم خيارات مرنة للإعلانات القصيرة والطويلة. كلما زادت مدة إعلانك، كلما حصلت على سعر أفضل.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3 أيام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">من</p>
                <p className="text-2xl font-bold text-primary mb-4">750 ر.س</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/advertise/spaces">اختر</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">7 أيام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">من</p>
                <p className="text-2xl font-bold text-primary mb-4">1,400 ر.س</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/advertise/spaces">اختر</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">14 يوم</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">من</p>
                <p className="text-2xl font-bold text-primary mb-4">2,400 ر.س</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/advertise/spaces">اختر</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">30 يوم</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">من</p>
                <p className="text-2xl font-bold text-primary mb-4">4,500 ر.س</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/advertise/spaces">اختر</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">هل أنت مستعد للبدء؟</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            انضم إلى المئات من الشركات والأفراد الذين يستخدمون منصتنا للوصول إلى عملائهم
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/advertise/spaces">عرض المساحات الإعلانية</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/advertise/my-ads">إدارة إعلاناتي</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
