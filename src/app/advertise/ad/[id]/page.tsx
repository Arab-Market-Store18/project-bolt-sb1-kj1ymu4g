import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { ChevronLeft, BarChart3, Eye, Mouse, TrendingUp, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'تفاصيل الإعلان - السوق العربي',
};

interface AdvertisementDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function AdvertisementDetailsPage({ params }: AdvertisementDetailsPageProps) {
  const adId = parseInt(params.id);

  try {
    const supabase = await createSupabaseServerClient();

    const { data: ad, error } = await supabase
      .from('advertisement_requests')
      .select(`
        *,
        advertisement_spaces (name, location, price_per_day),
        advertisement_content (image_url, image_alt_text),
        advertisement_analytics (views_count, clicks_count, tracking_date)
      `)
      .eq('id', adId)
      .single();

    if (error || !ad) {
      notFound();
    }

    // حساب الإحصائيات
    const totalViews = ad.advertisement_analytics?.reduce((sum: number, a: any) => sum + a.views_count, 0) || 0;
    const totalClicks = ad.advertisement_analytics?.reduce((sum: number, a: any) => sum + a.clicks_count, 0) || 0;
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return 'bg-green-100 text-green-800';
        case 'approved':
          return 'bg-blue-100 text-blue-800';
        case 'pending':
        case 'payment_pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'rejected':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Link href="/advertise/my-ads">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <span className="text-white/70 text-sm">رجوع</span>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{ad.title}</h1>
                <p className="text-white/70 text-sm mt-1">رقم الإعلان: #{ad.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* المحتوى */}
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* العمود الرئيسي */}
            <div className="lg:col-span-2 space-y-6">
              {/* صورة الإعلان */}
              {ad.advertisement_content?.[0]?.image_url && (
                <Card>
                  <CardContent className="pt-6">
                    <img
                      src={ad.advertisement_content[0].image_url}
                      alt={ad.title}
                      className="w-full max-h-96 object-cover rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}

              {/* الوصف */}
              <Card>
                <CardHeader>
                  <CardTitle>وصف الإعلان</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed">{ad.description}</p>
                  {ad.target_link && (
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-muted-foreground mb-1">الرابط المستهدف</p>
                      <a
                        href={ad.target_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm underline break-all"
                      >
                        {ad.target_link}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* الإحصائيات */}
              <Card>
                <CardHeader>
                  <CardTitle>الإحصائيات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">المشاهدات</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{totalViews}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Click className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-900">النقرات</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600">{totalClicks}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-900">معدل النقر</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">{ctr}%</p>
                    </div>
                  </div>

                  {/* رسم بياني للإحصائيات */}
                  {ad.advertisement_analytics && ad.advertisement_analytics.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-4">الإحصائيات اليومية</h3>
                      <div className="space-y-3">
                        {ad.advertisement_analytics.map((stat: any) => (
                          <div key={stat.tracking_date} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{stat.tracking_date}</span>
                            <div className="flex items-center gap-4">
                              <span>
                                <Eye className="h-3 w-3 inline mr-1" />
                                {stat.views_count}
                              </span>
                              <span>
                                <Click className="h-3 w-3 inline mr-1" />
                                {stat.clicks_count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* العمود الجانبي */}
            <div className="space-y-6">
              {/* معلومات الحالة */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">حالة الإعلان</p>
                    <Badge className={getStatusColor(ad.status)}>
                      {ad.status === 'active' && 'نشط'}
                      {ad.status === 'approved' && 'موافق عليه'}
                      {ad.status === 'pending' && 'قيد الانتظار'}
                      {ad.status === 'payment_pending' && 'في انتظار الدفع'}
                      {ad.status === 'rejected' && 'مرفوض'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">حالة الدفع</p>
                    <Badge variant={ad.payment_status === 'paid' ? 'default' : 'destructive'}>
                      {ad.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">المساحة الإعلانية</p>
                    <p className="font-semibold text-sm">{ad.advertisement_spaces?.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">المدة</p>
                      <p className="font-semibold">{ad.duration_days} أيام</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">السعر</p>
                      <p className="font-semibold">{ad.total_amount} {ad.currency}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الإجمالي</span>
                      <span className="font-bold text-lg">{ad.total_amount} {ad.currency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* التواريخ */}
              <Card>
                <CardHeader>
                  <CardTitle>التواريخ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      تاريخ البدء
                    </p>
                    <p className="font-semibold">{ad.start_date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      تاريخ الانتهاء
                    </p>
                    <p className="font-semibold">{ad.end_date}</p>
                  </div>
                </CardContent>
              </Card>

              {/* الإجراءات */}
              {ad.payment_status === 'unpaid' && (
                <Button asChild className="w-full">
                  <Link href={`/advertise/payment/${ad.id}`}>أكمل الدفع</Link>
                </Button>
              )}

              {ad.rejection_reason && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">
                    <p className="font-semibold mb-2">سبب الرفض:</p>
                    {ad.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading advertisement:', error);
    notFound();
  }
}
