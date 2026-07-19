// المسار: components/modals/BannerRequestModal.tsx
// -- النسخة النهائية الكاملة والمصححة --

"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';

import { useModal } from "@/hooks/use-modal";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ImagePlus, Link as LinkIcon, Trash2, Send } from "lucide-react";

// مخطط التحقق من صحة النموذج
const bannerRequestSchema = z.object({
  title: z.string().min(5, "العنوان مطلوب (5 أحرف على الأقل)."),
  description: z.string().min(10, "الوصف مطلوب (10 أحرف على الأقل)."),
  link: z.string().url("يجب إدخال رابط صحيح (مثال: https://example.com  ).").optional().or(z.literal('')),
  image: z.any().refine(file => file instanceof File, { message: "يجب رفع صورة للبانر." }),
  duration: z.string({ required_error: "يجب تحديد مدة الإعلان." }),
});

type BannerRequestFormValues = z.infer<typeof bannerRequestSchema>;

export function BannerRequestModal() {
  const { isOpen, type, onClose } = useModal();
  const supabase = createSupabaseBrowserClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isModalOpen = isOpen && type === 'requestBannerAd';

  const form = useForm<BannerRequestFormValues>({
    resolver: zodResolver(bannerRequestSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      link: "",
      image: undefined,
      duration: "7",
    },
  });

  useEffect(() => {
    if (!isModalOpen) {
      form.reset();
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      setIsSubmitting(false);
    }
  }, [isModalOpen, form, imagePreview]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file, { shouldValidate: true });
      const previewUrl = URL.createObjectURL(file);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(previewUrl);
    }
  }, [form, imagePreview]);

  const removeImage = useCallback(() => {
    form.setValue("image", undefined, { shouldValidate: true });
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  }, [form, imagePreview]);

  const onSubmit = useCallback(async (values: BannerRequestFormValues) => {
    setIsSubmitting(true);
    const toastId = toast.loading("⏳ جاري إرسال طلبك...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("المستخدم غير مسجل. يرجى تسجيل الدخول أولاً.");

      toast.loading("ضغط الصورة...", { id: toastId });
      const imageFile = values.image as File;
      const compressedImage = await imageCompression(imageFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });

      toast.loading("رفع الصورة...", { id: toastId });
      const filePath = `banner-requests/${user.id}/${Date.now()}-${compressedImage.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(filePath, compressedImage);
      if (uploadError) throw new Error(`فشل رفع الصورة: ${uploadError.message}`);

      // ▼▼▼ هذا هو التصحيح المهم ▼▼▼
      // نحصل على الرابط العام من نفس الحاوية التي رفعنا إليها الصورة
      const { data: { publicUrl } } = supabase.storage
        .from('banner-images') 
        .getPublicUrl(filePath);
      // ▲▲▲ نهاية التصحيح ▲▲▲

      toast.loading("حفظ الطلب...", { id: toastId });
      const requestData = {
        seller_id: user.id,
        title: values.title,
        description: values.description,
        image_url: publicUrl,
        target_link: values.link || null,
        requested_duration_days: parseInt(values.duration, 10),
        status: 'pending',
      };
      
      const { error: insertError } = await supabase.from('banner_requests').insert(requestData);
      if (insertError) throw insertError;

      toast.success("✅ تم إرسال طلبك بنجاح!", { id: toastId, description: "سنتواصل معك قريباً لمراجعة الطلب وإتمام عملية الدفع." });
      onClose();

    } catch (error: any) {
      console.error("Banner request error:", error);
      toast.error(error.message || "حدث خطأ غير متوقع.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }, [supabase, onClose]);

  const handleModalClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">طلب مساحة إعلانية (بانر)</DialogTitle>
          <DialogDescription className="text-center">
            املأ النموذج التالي لطلب إعلانك. سيتم مراجعته من قبل الإدارة.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <fieldset disabled={isSubmitting} className="space-y-4">
              
              <FormField
                control={form.control}
                name="image"
                render={({ fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-md font-semibold">صورة الإعلان (مطلوب)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" className="hidden" id="banner-image-upload" onChange={handleImageUpload} />
                    </FormControl>
                    {!imagePreview ? (
                      <label htmlFor="banner-image-upload" className={`block w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${fieldState.error ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}`}>
                        <ImagePlus className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p className="font-semibold text-blue-600">انقر هنا لاختيار صورة</p>
                        <p className="text-sm text-gray-500 mt-1">الأبعاد الموصى بها: 1200x400 بكسل</p>
                      </label>
                    ) : (
                      <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden border">
                        <img src={imagePreview} alt="معاينة البانر" className="w-full h-full object-cover" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={removeImage}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان الرئيسي للإعلان</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: تخفيضات نهاية العام تصل إلى 50%!" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف المختصر</FormLabel>
                    <FormControl>
                      <Textarea placeholder="اكتشف مجموعتنا الجديدة من المنتجات العصرية..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        الرابط المستهدف (اختياري)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://your-store.com/special-offers" {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدة الإعلان</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مدة الإعلان" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="7">أسبوع واحد</SelectItem>
                          <SelectItem value="14">أسبوعان</SelectItem>
                          <SelectItem value="30">شهر واحد</SelectItem>
                          <SelectItem value="90">3 أشهر</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleModalClose} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
                إرسال الطلب
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
