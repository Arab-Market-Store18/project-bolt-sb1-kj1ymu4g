'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { useRouter, useSearchParams } from 'next/navigation';

import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ImagePlus, Trash2, AlertCircle } from 'lucide-react';

const advertisementRequestSchema = z.object({
  title: z.string().min(5, 'العنوان مطلوب (5 أحرف على الأقل)'),
  description: z.string().min(20, 'الوصف مطلوب (20 حرف على الأقل)'),
  target_link: z.string().url('يجب إدخال رابط صحيح').optional().or(z.literal('')),
  duration_days: z.string().refine(val => ['3', '7', '14', '30'].includes(val), 'اختر مدة صحيحة'),
  image: z.any().refine(file => file instanceof File, 'يجب رفع صورة للإعلان'),
});

type AdvertisementRequestFormValues = z.infer<typeof advertisementRequestSchema>;

interface AdvertisementSpace {
  id: number;
  name: string;
  price_per_day: number;
  currency: string;
  width: number;
  height: number;
}

export function AdvertisementRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spaceId = searchParams.get('space');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<AdvertisementSpace | null>(null);
  const [spaces, setSpaces] = useState<AdvertisementSpace[]>([]);
  const [user, setUser] = useState<any>(null);

  const form = useForm<AdvertisementRequestFormValues>({
    resolver: zodResolver(advertisementRequestSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      target_link: '',
      duration_days: '7',
      image: undefined,
    },
  });

  const supabase = createSupabaseBrowserClient();

  // جلب المستخدم والمساحات
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب المستخدم
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        // جلب المساحات
        const { data: spacesData, error } = await supabase
          .from('advertisement_spaces')
          .select('id, name, price_per_day, currency, width, height')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;
        setSpaces(spacesData || []);

        // تعيين المساحة المختارة
        if (spaceId) {
          const space = spacesData?.find(s => s.id === parseInt(spaceId));
          if (space) setSelectedSpace(space);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('فشل تحميل البيانات');
      }
    };

    fetchData();
  }, [spaceId]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', file, { shouldValidate: true });
      const previewUrl = URL.createObjectURL(file);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(previewUrl);
    }
  }, [form, imagePreview]);

  const removeImage = useCallback(() => {
    form.setValue('image', undefined, { shouldValidate: true });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }, [form, imagePreview]);

  const onSubmit = useCallback(async (values: AdvertisementRequestFormValues) => {
    if (!selectedSpace) {
      toast.error('يجب اختيار مساحة إعلانية');
      return;
    }

    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('جاري إنشاء طلبك...');

    try {
      // ضغط الصورة
      toast.loading('جاري ضغط الصورة...', { id: toastId });
      const imageFile = values.image as File;
      const compressedImage = await imageCompression(imageFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
      });

      // رفع الصورة
      toast.loading('جاري رفع الصورة...', { id: toastId });
      const fileName = `advertisements/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, compressedImage);

      if (uploadError) throw uploadError;

      // الحصول على رابط الصورة
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      // حساب التاريخ والمبلغ
      const startDate = new Date().toISOString().split('T')[0];
      const durationDays = parseInt(values.duration_days);
      const totalAmount = selectedSpace.price_per_day * durationDays;

      // إنشاء طلب الإعلان
      toast.loading('جاري حفظ البيانات...', { id: toastId });
      const { data: requestData, error: requestError } = await supabase
        .from('advertisement_requests')
        .insert({
          space_id: selectedSpace.id,
          seller_id: user.id,
          title: values.title,
          description: values.description,
          target_link: values.target_link || null,
          start_date: startDate,
          duration_days: durationDays,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'unpaid',
          admin_approval_status: 'pending',
          requester_email: user.email,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // إنشاء محتوى الإعلان
      const { error: contentError } = await supabase
        .from('advertisement_content')
        .insert({
          request_id: requestData.id,
          image_url: urlData?.publicUrl,
          image_alt_text: values.title,
          content_type: 'image',
        });

      if (contentError) throw contentError;

      toast.success('تم إنشاء طلبك بنجاح!', { id: toastId });
      
      // الانتقال إلى صفحة الدفع
      setTimeout(() => {
        router.push(`/advertise/payment/${requestData.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error submitting advertisement:', error);
      toast.error('فشل إنشاء الطلب', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSpace, user, router]);

  const durationDays = parseInt(form.watch('duration_days') || '7');
  const totalAmount = selectedSpace ? selectedSpace.price_per_day * durationDays : 0;

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          يجب <a href="/auth/login" className="underline text-primary">تسجيل الدخول</a> لطلب إعلان
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* النموذج */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>طلب إعلان جديد</CardTitle>
            <CardDescription>ملأ النموذج بتفاصيل إعلانك</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* اختيار المساحة */}
                <FormField
                  control={form.control}
                  name="duration_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المساحة الإعلانية</FormLabel>
                      <Select value={selectedSpace?.id.toString()} onValueChange={(val) => {
                        const space = spaces.find(s => s.id === parseInt(val));
                        setSelectedSpace(space || null);
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مساحة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {spaces.map(space => (
                            <SelectItem key={space.id} value={space.id.toString()}>
                              {space.name} - {space.price_per_day} {space.currency}/يوم
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* العنوان */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان الإعلان</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: أفضل منتج للعناية بالجلد" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الوصف */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الإعلان</FormLabel>
                      <FormControl>
                        <Textarea placeholder="اكتب وصفاً مفصلاً لإعلانك..." className="min-h-32" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الرابط المستهدف */}
                <FormField
                  control={form.control}
                  name="target_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرابط المستهدف (اختياري)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* مدة الإعلان */}
                <FormField
                  control={form.control}
                  name="duration_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدة الإعلان</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 أيام</SelectItem>
                          <SelectItem value="7">7 أيام</SelectItem>
                          <SelectItem value="14">14 يوم</SelectItem>
                          <SelectItem value="30">30 يوم</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الصورة */}
                <FormField
                  control={form.control}
                  name="image"
                  render={() => (
                    <FormItem>
                      <FormLabel>صورة الإعلان</FormLabel>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                        {imagePreview ? (
                          <div className="space-y-4">
                            <img src={imagePreview} alt="preview" className="max-h-48 mx-auto rounded" />
                            <Button type="button" variant="destructive" size="sm" onClick={removeImage}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              إزالة
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <div className="flex flex-col items-center gap-2">
                              <ImagePlus className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm font-medium">اضغط هنا أو اسحب الصورة</span>
                              <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  المتابعة للدفع
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* ملخص الطلب */}
      <div className="md:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">ملخص الطلب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSpace && (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">المساحة</p>
                  <p className="font-semibold">{selectedSpace.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">المدة</p>
                  <p className="font-semibold">{durationDays} أيام</p>
                </div>
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">السعر اليومي</p>
                    <p className="font-semibold">{selectedSpace.price_per_day} {selectedSpace.currency}</p>
                  </div>
                </div>
                <div className="border-t pt-4 bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold">{totalAmount} {selectedSpace.currency}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
