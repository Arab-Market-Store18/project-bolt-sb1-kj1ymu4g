'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, Clock, CheckCircle, XCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

interface AdvertisementRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  payment_status: string;
  admin_approval_status: string;
  total_amount: number;
  currency: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  target_link?: string;
  created_at: string;
  rejection_reason?: string;
  advertisement_spaces?: {
    name: string;
    location: string;
  };
  advertisement_content?: Array<{
    image_url: string;
    image_alt_text: string;
  }>;
  advertisement_analytics?: Array<{
    views_count: number;
    clicks_count: number;
    tracking_date: string;
  }>;
}

export function MyAdvertisements() {
  const [advertisements, setAdvertisements] = useState<AdvertisementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setError('يجب تسجيل الدخول أولاً');
          setLoading(false);
          return;
        }
        setUser(authUser);

        const { data, error: err } = await supabase
          .from('advertisement_requests')
          .select(`
            *,
            advertisement_spaces (name, location),
            advertisement_content (image_url, image_alt_text),
            advertisement_analytics (views_count, clicks_count, tracking_date)
          `)
          .eq('seller_id', authUser.id)
          .order('created_at', { ascending: false });

        if (err) throw err;
        setAdvertisements(data || []);
      } catch (err) {
        console.error('Error fetching advertisements:', err);
        setError('فشل تحميل الإعلانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'قيد الانتظار', icon: Clock },
      payment_pending: { variant: 'secondary', label: 'في انتظار الدفع', icon: AlertCircle },
      approved: { variant: 'default', label: 'موافق عليه', icon: CheckCircle },
      active: { variant: 'default', label: 'نشط', icon: Eye },
      rejected: { variant: 'destructive', label: 'مرفوض', icon: XCircle },
      expired: { variant: 'outline', label: 'منتهى', icon: Clock },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <Badge variant={badge.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      unpaid: { variant: 'destructive', label: 'غير مدفوع' },
      paid: { variant: 'default', label: 'مدفوع' },
      refunded: { variant: 'outline', label: 'مسترجع' },
    };

    return <Badge variant={badges[status]?.variant}>{badges[status]?.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          {error.includes('تسجيل الدخول') && (
            <Button asChild variant="link" className="ml-2">
              <Link href="/auth/login">تسجيل الدخول</Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const active = advertisements.filter(a => a.status === 'active');
  const pending = advertisements.filter(a => ['pending', 'payment_pending'].includes(a.status));
  const approved = advertisements.filter(a => a.status === 'approved');
  const ended = advertisements.filter(a => a.status === 'expired' || a.status === 'completed');
  const rejected = advertisements.filter(a => a.status === 'rejected');

  const TabContent = ({ ads }: { ads: AdvertisementRequest[] }) => (
    ads.length === 0 ? (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">لا توجد إعلانات</p>
        <Button asChild>
          <Link href="/advertise/spaces">طلب إعلان جديد</Link>
        </Button>
      </div>
    ) : (
      <div className="space-y-4">
        {ads.map(ad => (
          <Card key={ad.id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* الصورة */}
                {ad.advertisement_content?.[0]?.image_url && (
                  <div className="md:col-span-1">
                    <img
                      src={ad.advertisement_content[0].image_url}
                      alt={ad.title}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}

                {/* المعلومات */}
                <div className={ad.advertisement_content?.[0]?.image_url ? 'md:col-span-3' : 'md:col-span-4'}>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{ad.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">المساحة</span>
                        <p className="font-semibold">{ad.advertisement_spaces?.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">المدة</span>
                        <p className="font-semibold">{ad.duration_days} أيام</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">السعر</span>
                        <p className="font-semibold">{ad.total_amount} {ad.currency}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">المشاهدات</span>
                        <p className="font-semibold">
                          {ad.advertisement_analytics?.reduce((sum, a) => sum + a.views_count, 0) || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(ad.status)}
                      {getPaymentBadge(ad.payment_status)}
                    </div>

                    {ad.rejection_reason && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          سبب الرفض: {ad.rejection_reason}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2 pt-2">
                      {ad.payment_status === 'unpaid' && (
                        <Button asChild size="sm">
                          <Link href={`/advertise/payment/${ad.id}`}>أكمل الدفع</Link>
                        </Button>
                      )}
                      {ad.target_link && (
                        <Button asChild variant="outline" size="sm">
                          <a href={ad.target_link} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            الرابط
                          </a>
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/advertise/ad/${ad.id}`}>التفاصيل</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إعلاناتي</h2>
        <Button asChild>
          <Link href="/advertise/spaces">إعلان جديد</Link>
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active">نشط ({active.length})</TabsTrigger>
          <TabsTrigger value="pending">قيد الانتظار ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">موافق ({approved.length})</TabsTrigger>
          <TabsTrigger value="ended">منتهى ({ended.length})</TabsTrigger>
          <TabsTrigger value="rejected">مرفوض ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <TabContent ads={active} />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <TabContent ads={pending} />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <TabContent ads={approved} />
        </TabsContent>

        <TabsContent value="ended" className="mt-6">
          <TabContent ads={ended} />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <TabContent ads={rejected} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
