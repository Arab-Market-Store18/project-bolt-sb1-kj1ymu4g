import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { CheckCircle2, Clock, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'تم الدفع بنجاح - السوق العربي',
  description: 'شكراً لك، تم استلام طلبك',
};

interface SuccessPageProps {
  params: {
    id: string;
  };
}

export default function PaymentSuccessPage({ params }: SuccessPageProps) {
  const requestId = params.id;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* رسالة النجاح */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">تم الدفع بنجاح!</h1>
            <p className="text-muted-foreground">
              شكراً لك على اختيارك للإعلان معنا
            </p>
          </div>

          {/* معلومات الطلب */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>تفاصيل الطلب</CardTitle>
              <CardDescription>رقم الطلب: #{requestId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  يتم حالياً مراجعة إعلانك من قبل فريقنا. سيتم تنبيهك بالبريد الإلكتروني عند الموافقة.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  ما الخطوة التالية؟
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>✓ تم استلام الدفع بنجاح</li>
                  <li>▪ جاري مراجعة محتوى الإعلان (1-24 ساعة)</li>
                  <li>▪ سيتم إخطارك عند الموافقة أو طلب تعديلات</li>
                  <li>▪ بعد الموافقة، سيبدأ عرض إعلانك مباشرة</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">تنبيهات مهمة</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• تحقق من بريدك الإلكتروني (بما فيه folder Spam)</li>
                  <li>• قد تستغرق المراجعة حتى 24 ساعة</li>
                  <li>• التأكد من أن الإعلان يتوافق مع سياستنا</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* الخطوات */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">حالة الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">✓</div>
                    <div className="w-0.5 h-8 bg-green-200 mt-2"></div>
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold">طلب مرسل</p>
                    <p className="text-sm text-muted-foreground">تم استقبال طلب الإعلان</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">✓</div>
                    <div className="w-0.5 h-8 bg-green-200 mt-2"></div>
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold">دفع مستلم</p>
                    <p className="text-sm text-muted-foreground">تم تأكيد عملية الدفع</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600">⏳</div>
                    <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold">جاري المراجعة</p>
                    <p className="text-sm text-muted-foreground">فريقنا يراجع الإعلان حالياً</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400">-</div>
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold">موافقة</p>
                    <p className="text-sm text-muted-foreground">سيتم عرض الإعلان بعد الموافقة</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الأزرار */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href="/advertise/my-ads">إدارة إعلاناتي</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/advertise/spaces">طلب إعلان آخر</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
