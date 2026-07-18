'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';

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
  created_at: string;
  requester_email: string;
  target_link?: string;
  rejection_reason?: string;
  admin_notes?: string;
  advertisement_spaces?: {
    name: string;
    location: string;
    price_per_day: number;
  };
  advertisement_content?: Array<{
    image_url: string;
    image_alt_text: string;
  }>;
}

export function AdminAdvertisementsDashboard() {
  const [advertisements, setAdvertisements] = useState<AdvertisementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<AdvertisementRequest | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('advertisement_requests')
        .select(`
          *,
          advertisement_spaces (name, location, price_per_day),
          advertisement_content (image_url, image_alt_text)
        `)
        .neq('status', 'expired')
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

  const handleApprove = async () => {
    if (!selectedAd) return;
    setProcessing(true);

    try {
      const { error: err } = await supabase
        .from('advertisement_requests')
        .update({
          admin_approval_status: 'approved',
          status: selectedAd.payment_status === 'paid' ? 'active' : 'approved',
          admin_notes: adminNotes,
          approved_at: new Date().toISOString(),
        })
        .eq('id', selectedAd.id);

      if (err) throw err;

      toast.success('تم الموافقة على الإعلان');
      setApprovalDialogOpen(false);
      setAdminNotes('');
      await fetchAdvertisements();
    } catch (err) {
      console.error('Error approving advertisement:', err);
      toast.error('فشل الموافقة على الإعلان');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAd) return;
    if (!rejectionNotes.trim()) {
      toast.error('يجب إدخال سبب الرفض');
      return;
    }

    setProcessing(true);

    try {
      const { error: err } = await supabase
        .from('advertisement_requests')
        .update({
          admin_approval_status: 'rejected',
          status: 'rejected',
          rejection_reason: rejectionNotes,
          admin_notes: adminNotes,
        })
        .eq('id', selectedAd.id);

      if (err) throw err;

      toast.success('تم رفض الإعلان');
      setApprovalDialogOpen(false);
      setRejectionNotes('');
      setAdminNotes('');
      await fetchAdvertisements();
    } catch (err) {
      console.error('Error rejecting advertisement:', err);
      toast.error('فشل رفض الإعلان');
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const pending = advertisements.filter(a => a.admin_approval_status === 'pending');
  const approved = advertisements.filter(a => a.admin_approval_status === 'approved');
  const rejected = advertisements.filter(a => a.admin_approval_status === 'rejected');
  const active = advertisements.filter(a => a.status === 'active');

  const AdsList = ({ ads }: { ads: AdvertisementRequest[] }) => (
    ads.length === 0 ? (
      <div className="text-center py-8">
        <p className="text-muted-foreground">لا توجد إعلانات</p>
      </div>
    ) : (
      <div className="space-y-4">
        {ads.map(ad => (
          <Card key={ad.id} className={ad.admin_approval_status === 'pending' ? 'border-yellow-200 bg-yellow-50/50' : ''}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* الصورة */}
                {ad.advertisement_content?.[0]?.image_url && (
                  <div className="md:col-span-1">
                    <img
                      src={ad.advertisement_content[0].image_url}
                      alt={ad.title}
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-75"
                      onClick={() => {
                        setSelectedAd(ad);
                        setApprovalDialogOpen(true);
                      }}
                    />
                  </div>
                )}

                {/* المعلومات */}
                <div className={ad.advertisement_content?.[0]?.image_url ? 'md:col-span-4' : 'md:col-span-5'}>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{ad.title}</h3>
                      <p className="text-sm text-muted-foreground">{ad.description.substring(0, 100)}...</p>
                      <p className="text-xs text-muted-foreground mt-1">البريد: {ad.requester_email}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">المساحة</span>
                        <p className="font-semibold text-sm">{ad.advertisement_spaces?.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">الموقع</span>
                        <p className="font-semibold text-sm">{ad.advertisement_spaces?.location}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">المبلغ</span>
                        <p className="font-semibold text-sm">{ad.total_amount} {ad.currency}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">الحالة</span>
                        <Badge className="text-xs mt-1">
                          {ad.admin_approval_status === 'pending' && 'قيد المراجعة'}
                          {ad.admin_approval_status === 'approved' && 'موافق'}
                          {ad.admin_approval_status === 'rejected' && 'مرفوض'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">الدفع</span>
                        <Badge variant={ad.payment_status === 'paid' ? 'default' : 'destructive'} className="text-xs mt-1">
                          {ad.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                        </Badge>
                      </div>
                    </div>

                    {ad.rejection_reason && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          سبب الرفض: {ad.rejection_reason}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedAd(ad);
                          setAdminNotes(ad.admin_notes || '');
                          setApprovalDialogOpen(true);
                        }}
                        size="sm"
                        variant={ad.admin_approval_status === 'pending' ? 'default' : 'outline'}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        عرض التفاصيل
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
            <p className="text-sm text-muted-foreground">قيد المراجعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">{approved.length}</p>
            <p className="text-sm text-muted-foreground">موافق عليها</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-blue-600">{active.length}</p>
            <p className="text-sm text-muted-foreground">نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-red-600">{rejected.length}</p>
            <p className="text-sm text-muted-foreground">مرفوضة</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">قيد المراجعة ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">موافق ({approved.length})</TabsTrigger>
          <TabsTrigger value="active">نشطة ({active.length})</TabsTrigger>
          <TabsTrigger value="rejected">مرفوضة ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <AdsList ads={pending} />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <AdsList ads={approved} />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <AdsList ads={active} />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <AdsList ads={rejected} />
        </TabsContent>
      </Tabs>

      {/* Dialog للموافقة/الرفض */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>مراجعة الإعلان</DialogTitle>
            <DialogDescription>{selectedAd?.title}</DialogDescription>
          </DialogHeader>

          {selectedAd && (
            <div className="space-y-4">
              {/* الصورة */}
              {selectedAd.advertisement_content?.[0]?.image_url && (
                <img
                  src={selectedAd.advertisement_content[0].image_url}
                  alt={selectedAd.title}
                  className="w-full max-h-64 object-cover rounded"
                />
              )}

              {/* التفاصيل */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">المساحة</p>
                  <p className="font-semibold">{selectedAd.advertisement_spaces?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المدة</p>
                  <p className="font-semibold">{selectedAd.duration_days} أيام</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المبلغ</p>
                  <p className="font-semibold">{selectedAd.total_amount} {selectedAd.currency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-semibold text-xs">{selectedAd.requester_email}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-2">الوصف</p>
                <p className="text-sm">{selectedAd.description}</p>
              </div>

              {selectedAd.target_link && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">الرابط المستهدف</p>
                  <a href={selectedAd.target_link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline break-all">
                    {selectedAd.target_link}
                  </a>
                </div>
              )}

              {/* ملاحظات الإدارة */}
              <div>
                <label className="text-sm font-semibold mb-2 block">ملاحظات الإدارة</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظات داخلية..."
                  className="min-h-20"
                />
              </div>

              {/* سبب الرفض */}
              {selectedAd.admin_approval_status !== 'approved' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">سبب الرفض (إذا كنت ترفضه)</label>
                  <Textarea
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="اشرح سبب الرفض..."
                    className="min-h-20"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedAd?.admin_approval_status !== 'approved' && (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                رفض
              </Button>
            )}
            {selectedAd?.admin_approval_status !== 'approved' && (
              <Button
                variant="default"
                onClick={handleApprove}
                disabled={processing}
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                موافقة
              </Button>
            )}
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
