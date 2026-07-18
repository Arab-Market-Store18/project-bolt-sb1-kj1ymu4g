'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface AdvertisementRequest {
  id: number;
  title: string;
  total_amount: number;
  currency: string;
  duration_days: number;
  status: string;
  payment_status: string;
  space_id: number;
  advertisement_spaces?: {
    name: string;
    price_per_day: number;
  };
}

interface AdvertisementPaymentProps {
  requestId: number;
}

export function AdvertisementPayment({ requestId }: AdvertisementPaymentProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [request, setRequest] = useState<AdvertisementRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('advertisement_requests')
          .select(`
            *,
            advertisement_spaces (
              name,
              price_per_day
            )
          `)
          .eq('id', requestId)
          .single();

        if (error) throw error;
        setRequest(data);
      } catch (error) {
        console.error('Error fetching request:', error);
        toast.error('فشل تحميل بيانات الطلب');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const handlePaymentClick = async () => {
    if (!request) return;

    setProcessing(true);
    const toastId = toast.loading('جاري معالجة الدفع...');

    try {
      // محاكاة معالجة الدفع
      await new Promise(resolve => setTimeout(resolve, 2000));

      // تحديث حالة الطلب
      const { error: updateError } = await supabase
        .from('advertisement_requests')
        .update({
          payment_status: 'paid',
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          payment_reference: `AD-${Date.now()}`,
          status: 'payment_pending', // في انتظار موافقة الإدارة
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // إنشاء سجل دفع
      await supabase
        .from('advertisement_payments')
        .insert({
          request_id: requestId,
          amount: request.total_amount,
          currency: request.currency,
          payment_method: paymentMethod,
          payment_status: 'completed',
          transaction_id: `TXN-${Date.now()}`,
          paid_at: new Date().toISOString(),
        });

      toast.success('تم الدفع بنجاح!', { id: toastId });

      // الانتقال إلى صفحة تأكيد النجاح
      setTimeout(() => {
        router.push(`/advertise/payment/success/${requestId}`);
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('فشلت عملية الدفع', { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>لم يتم العثور على الطلب</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* معلومات الطلب */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الطلب</CardTitle>
          <CardDescription>رقم الطلب: #{request.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">عنوان الإعلان</p>
              <p className="font-semibold">{request.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المساحة الإعلانية</p>
              <p className="font-semibold">{request.advertisement_spaces?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المدة</p>
              <p className="font-semibold">{request.duration_days} أيام</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">السعر اليومي</p>
              <p className="font-semibold">{request.advertisement_spaces?.price_per_day} {request.currency}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">المبلغ الإجمالي</span>
              <span className="text-2xl font-bold text-primary">
                {request.total_amount} {request.currency}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* طرق الدفع */}
      <Card>
        <CardHeader>
          <CardTitle>طريقة الدفع</CardTitle>
          <CardDescription>اختر طريقة الدفع المناسبة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* بطاقة ائتمان */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod === 'card'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setPaymentMethod('card')}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  بطاقة ائتمان
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ادفع باستخدام بطاقتك الائتمانية أو الخصم
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                paymentMethod === 'card'
                  ? 'border-primary bg-primary'
                  : 'border-gray-300'
              }`} />
            </div>
          </div>

          {/* تحويل بنكي */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod === 'transfer'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setPaymentMethod('transfer')}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold">تحويل بنكي</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  قم بالتحويل مباشرة إلى حسابنا البنكي
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                paymentMethod === 'transfer'
                  ? 'border-primary bg-primary'
                  : 'border-gray-300'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات أمان */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          جميع المعاملات آمنة ومشفرة. بعد الدفع، سيتم مراجعة إعلانك من قبل فريقنا.
        </AlertDescription>
      </Alert>

      {/* أزرار العمل */}
      <div className="flex gap-3">
        <Button
          onClick={handlePaymentClick}
          disabled={processing}
          className="flex-1"
          size="lg"
        >
          {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          أكمل عملية الدفع
        </Button>
        <Button
          variant="outline"
          asChild
          className="flex-1"
          size="lg"
        >
          <Link href="/advertise/my-ads">إلغاء</Link>
        </Button>
      </div>
    </div>
  );
}
