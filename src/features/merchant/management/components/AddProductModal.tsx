// features/merchant/management/components/AddProductModal.tsx

"use client";

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Percent } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Eye, Send, Loader2, XCircle, ImagePlus, Video, Trash2, ChevronDown, Upload, EyeOff } from "lucide-react";
import { useUploadManager } from "@/hooks/useUploadManager";
import { CategoryPickerModal, SuggestedCategory } from "@/components/category-picker-modal";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { validateFile } from "@/lib/utils/validation";
import type { Product, Category } from "@/lib/types";
import { getSubCategories } from "@/lib/utils/categories-converter";
import imageCompression from 'browser-image-compression';
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { ImageOptimizer } from "@/lib/image-optimizer";
import { createProduct } from '../actions/createProduct.action'; // <-- استيراد الأكشن
import { useModal } from "@/hooks/use-modal";

// --- البيانات الثابتة ---
const arabCurrencies = [
    { code: "YER", name: "ريال يمني" }, { code: "SAR", name: "ريال سعودي" },
    { code: "AED", name: "درهم إماراتي" }, { code: "QAR", name: "ريال قطري" },
    { code: "KWD", name: "دينار كويتي" }, { code: "BHD", name: "دينار بحريني" },
    { code: "OMR", name: "ريال عماني" }, { code: "EGP", name: "جنيه مصري" },
    { code: "JOD", name: "دينار أردني" }, { code: "SDG", name: "جنيه سوداني" },
    { code: "LYD", name: "دينار ليبي" }, { code: "TND", name: "دينار تونسي" },
    { code: "DZD", name: "دينار جزائري" }, { code: "MAD", name: "درهم مغربي" },
    { code: "USD", name: "دولار أمريكي" },
];
const countryCodeCurrencyMap: { [key: string]: string } = {
    "ye": "YER", "sa": "SAR", "ae": "AED", "qa": "QAR", "kw": "KWD",
    "bh": "BHD", "om": "OMR", "eg": "EGP", "jo": "JOD", "sd": "SDG",
    "ly": "LYD", "tn": "TND", "dz": "DZD", "ma": "MAD",
};

// --- مخطط Zod (بدون تغيير) ---
const productSchema = z.object({
  name: z.string().min(3, { message: "اسم المنتج مطلوب (3 أحرف على الأقل)." }),
  description: z.string().min(20, { message: "وصف المنتج مطلوب (20 حرفًا على الأقل)." }),
  category_id: z.any().refine(val => val != null, { message: "يجب تحديد فئة فرعية للمنتج." }),
  price: z.coerce.number({ required_error: "السعر الأساسي مطلوب.", invalid_type_error: "السعر يجب أن يكون رقمًا." })
         .positive({ message: "السعر يجب أن يكون أكبر من صفر." }),
  discount_price: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.coerce.number({ invalid_type_error: "سعر الخصم يجب أن يكون رقمًا." })
            .positive({ message: "سعر الخصم يجب أن يكون أكبر من صفر." })
            .optional()
  ),
  currency: z.string({ required_error: "يجب اختيار عملة للسعر الأساسي." }),
  images: z.array(z.any()).min(1, "يجب رفع صورة واحدة على الأقل.").max(10, "يمكن رفع 10 صور كحد أقصى."),
  video: z.any().optional(),
  additional_details: z.array(z.object({ feature: z.string(), value: z.string() })).optional(),
  additional_prices: z.array(
    z.object({
      price: z.preprocess((val) => (val === "" || val === null ? undefined : parseFloat(String(val))), z.number().positive().optional()),
      currency: z.string().optional(),
      label: z.string().min(1).optional(),
    })
  ).optional(),
}).superRefine((data, ctx) => {
  if (data.discount_price && data.price && data.discount_price >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "سعر الخصم يجب أن يكون أقل من السعر الأساسي.",
      path: ['discount_price'],
    });
  }
});
type ProductFormValues = z.infer<typeof productSchema>;

// --- المكونات المساعدة (بدون تغيير) ---
function DiscountPreview({ control }: { control: any }) {
  const [price, discountPrice] = useWatch({ control, name: ["price", "discount_price"] });
  const discountPercentage = useMemo(() => {
    const basePrice = parseFloat(String(price));
    const salePrice = parseFloat(String(discountPrice));
    if (salePrice > 0 && basePrice > salePrice) { return Math.round(((basePrice - salePrice) / basePrice) * 100); }
    return 0;
  }, [price, discountPrice]);
  if (discountPercentage > 0) {
    return (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm text-center flex items-center justify-center gap-2">
        <Percent className="h-4 w-4" />
        <span>سيظهر للعميل خصم بنسبة <strong>{discountPercentage}%</strong></span>
      </div>
    );
  }
  return null;
}

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductAdded: (newProduct: Product) => void;
    sellerCountry?: string | null;
    sellerMainCategoryId: string;
    sellerMainCategoryName: string;
    allCategories: Category[];
    sellerId: string; // ⭐ أضف هذا

}
const ImagePreview = ({ preview, index, onRemove }: { preview: string; index: number; onRemove: (index: number) => void; }) => (
    <div className="relative group transition-all hover:scale-105">
        <img src={preview} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md border" />
        <button type="button" onClick={() => onRemove(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600">
            <Trash2 className="h-3 w-3" />
        </button>
    </div>
);
const VideoPreview = ({ preview, onRemove }: { preview: string; onRemove: () => void; }) => (
    <div className="mt-4 relative transition-all hover:scale-[1.02]">
        <video src={preview} controls className="w-full rounded-md max-h-60 border shadow-sm"></video>
        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 transition-all hover:scale-110" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
        </Button>
    </div>
);

// --- المكون الرئيسي ---
export function AddProductModal() {
  // ⭐⭐ استخدم useModal مثل AddServiceModal ⭐⭐
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === 'addProduct';
  
  // ⭐⭐ استخرج البيانات من data مثل AddServiceModal ⭐⭐
  const { 
    onProductAdded, 
    sellerId, 
    sellerCountry, 
    sellerMainCategoryId, 
    sellerMainCategoryName, 
    allCategories 
  } = data || {};
  
  // ⭐⭐ تحقق من البيانات مثل AddServiceModal ⭐⭐
  useEffect(() => {
    if (isModalOpen) {
      console.log('✅ AddProductModal مفتوح:', { 
        sellerId, 
        sellerMainCategoryId,
        sellerCountry,
        hasOnProductAdded: !!onProductAdded 
      });
      
      if (!sellerId) {
        toast.error('��� خطأ: sellerId مفقود في data');
        console.error('data كاملة:', data);
      }
    }
  }, [isModalOpen, sellerId, sellerMainCategoryId, data, sellerCountry, onProductAdded]);
  
  const supabase = createSupabaseBrowserClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startUpload, finishUpload } = useUploadManager();
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);

  const defaultCurrency = useMemo(() => sellerCountry ? countryCodeCurrencyMap[sellerCountry] : undefined, [sellerCountry]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    defaultValues: {
      name: "", description: "", category_id: null, price: undefined,
      discount_price: undefined,
      currency: defaultCurrency || "", images: [], video: null,
      additional_details: [], additional_prices: [],
    },
  });
  
  useEffect(() => {
      return () => {
          imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
          if (videoPreview) URL.revokeObjectURL(videoPreview);
      };
  }, [imagePreviews, videoPreview]);

  useEffect(() => {
      if (isOpen) {
          form.reset({
              name: "", description: "", category_id: null, price: undefined,
              discount_price: undefined,
              currency: defaultCurrency || "", images: [], video: null,
              additional_details: [], additional_prices: [],
          });
          imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
          if (videoPreview) URL.revokeObjectURL(videoPreview);
          setImagePreviews([]);
          setVideoPreview(null);
      }
  }, [isOpen, defaultCurrency, form]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "additional_details" });
  const { fields: priceFields, append: appendPrice, remove: removePrice } = useFieldArray({ control: form.control, name: "additional_prices" });

  const removeImage = useCallback((index: number) => {
      const currentImages = form.getValues("images");
      const updatedImages = currentImages.filter((_, i) => i !== index);
      form.setValue("images", updatedImages, { shouldValidate: true });
      const previewToRemove = imagePreviews[index];
      URL.revokeObjectURL(previewToRemove);
      setImagePreviews(prev => prev.filter(p => p !== previewToRemove));
  }, [form, imagePreviews]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const currentImages = form.getValues("images") || [];
      if ((currentImages.length + files.length) > 10) { toast.error("لا يمكنك إضافة أكثر من 10 صور."); return; }
      const validFiles = files.filter(file => {
          const validationError = validateFile(file, 'images');
          if (validationError) { toast.error(`خطأ في الملف ${file.name}: ${validationError}`); return false; }
          return true;
      });
      form.setValue("images", [...currentImages, ...validFiles], { shouldValidate: true });
      const newPreviews = validFiles.map(f => URL.createObjectURL(f));
      setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [form]);

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (file) {
          const validationError = validateFile(file, 'videos');
          if (validationError) { toast.error(`خطأ في ملف الفيديو: ${validationError}`); form.setValue("video", null); setVideoPreview(null); return; }
          form.setValue("video", file, { shouldValidate: true });
          setVideoPreview(URL.createObjectURL(file));
      } else {
          form.setValue("video", null);
          setVideoPreview(null);
      }
  }, [form, videoPreview]);

  const removeVideo = useCallback(() => {
      form.setValue("video", null);
      if (videoPreview) { URL.revokeObjectURL(videoPreview); setVideoPreview(null); }
  }, [form, videoPreview]);

  const fetchSubCategories = useCallback(async (parentId: string | null): Promise<Category[]> => {
    // استخدم البيانات المحلية بدلاً من قاعدة البيانات
    return getSubCategories(parentId);
  }, []);

  const getSubCategoryDisplayName = useCallback((subCategory: any): string => {
      if (!subCategory) return "اختر فئة فرعية...";
      if (typeof subCategory === 'object' && subCategory.name) return subCategory.name;
      return "اختر فئة فرعية...";
  }, []);

  // ▼▼▼ دالة onSubmit المحدثة والنهائية ▼▼▼
  const onSubmit = useCallback(async (values: ProductFormValues) => {
    const uploadId = startUpload('product', 'add', values.name);
    toast.info("يمكنك إغلاق النافذة، سيتم إعلامك عند اكتمال الإضافة", { duration: 5000 });
    
    setIsSubmitting(true);
    setCompressionProgress(0);
    const toastId = toast.loading("⏳ جاري تجهيز البيانات...");

    try {
        // --- الخطوة 1: ضغط الصور ---
        toast.loading("ضغط الصور لتحسين السرعة...", { id: toastId });
        const images = values.images as File[];
        const compressedImages: File[] = [];
        for (let i = 0; i < images.length; i++) {
            const compressed = await ImageOptimizer.compressImage(images[i], 'product');
            compressedImages.push(compressed);
            setCompressionProgress(Math.round(((i + 1) / images.length) * 100));
        }
        setCompressionProgress(0);

        // --- الخطوة 2: تجهيز البيانات المعقدة ---
        const details = (values.additional_details || []).filter(d => d.feature && d.value);
        const prices = (values.additional_prices || []).filter(p => p.price && p.currency && p.label);

        // --- الخطوة 3: استدعاء الأكشن بالشكل الصحيح ---
        toast.loading("جاري الرفع والحفظ...", { id: toastId });
        
        const result = await createProduct({
            sellerId: sellerId as string,
            sellerEmail: '',
            name: values.name,
            description: values.description,
            price: values.price,
            currency: values.currency,
            discountPrice: values.discount_price,
            categoryData: values.category_id,
            additionalDetails: details,
            additionalPrices: prices,
            images: compressedImages,
            video: values.video as File | null,
        });

        if (!result.success) {
            throw new Error(result.message);
        }

        // --- النجاح ---
        toast.success("✅ تم نشر المنتج بنجاح!", { id: toastId });
        finishUpload(uploadId, true, "تم إضافة المنتج بنجاح");
        onProductAdded(result.data as Product);
        onClose();

    } catch (error: any) {
        console.error("Product submission error:", error);
        toast.error(error.message || "حدث خطأ غير متوقع.", { id: toastId });
        finishUpload(uploadId, false, error.message || "حدث خطأ غير متوقع");
    } finally {
        setIsSubmitting(false);
    }
  }, [sellerId, sellerMainCategoryId, onProductAdded, onClose, startUpload, finishUpload]);
  // ▲▲▲ نهاية دالة onSubmit المحدثة ▲▲▲

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      toast.info("العملية مستمرة في الخلفية...");
      onClose();
      return;
    }
    onClose();
  }, [isSubmitting, onClose]);

  return (
    <>
<Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent 
    className="max-w-4xl h-[90vh] flex flex-col"
    aria-describedby="add-product-modal-desc"  // ← أضف هذا السطر
  >
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-center">إضافة منتج جديد</DialogTitle>
      <DialogDescription 
        className="text-center"
        id="add-product-modal-desc"  // ← وهذا السطر (نفس الاسم)
      >
        املأ التفاصيل التالية لنشر منتجك في المتجر
      </DialogDescription>
    </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow flex flex-col overflow-hidden">
              <fieldset disabled={isSubmitting} className="flex-grow flex flex-col overflow-hidden">
              <div className="flex-grow overflow-y-auto pr-4 space-y-6">
    
                {compressionProgress > 0 && compressionProgress < 100 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-blue-900">
                                    ⚡ جاري تحسين الصور للرفع...
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${compressionProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                  <FormField control={form.control} name="images" render={({ field, fieldState }) => (
                      <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center gap-2"><ImagePlus className="text-blue-600" /> صور المنتج (مطلوب)</FormLabel>
                          <FormControl><Input type="file" accept="image/*" multiple className="hidden" id="image-upload" onChange={handleImageUpload} /></FormControl>
                          <label htmlFor="image-upload" className={`block w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200 ${fieldState.error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'} ${isSubmitting ? 'cursor-not-allowed bg-gray-100' : ''}`}>
                              <Upload className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                              <p className="font-semibold text-blue-600">انقر هنا لاختيار الصور</p>
                              <p className="text-sm text-gray-500 mt-1">يمكنك رفع حتى 10 صور (JPEG, PNG, WebP)</p>
                          </label>
                          {imagePreviews.length > 0 && (
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4">
                                  {imagePreviews.map((preview, index) => (<ImagePreview key={index} preview={preview} index={index} onRemove={removeImage} />))}
                              </div>
                          )}
                          <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField control={form.control} name="video" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center gap-2"><Video className="text-purple-600" /> فيديو المنتج (اختياري)</FormLabel>
                          <FormControl><Input type="file" accept="video/*" className="hidden" id="video-upload" onChange={handleVideoUpload} /></FormControl>
                          <label htmlFor="video-upload" className={`block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200 ${isSubmitting ? 'cursor-not-allowed bg-gray-100' : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'}`}>
                              <Video className="mx-auto h-6 w-6 text-purple-600 mb-1" />
                              <p className="font-semibold text-purple-600">انقر هنا لاختيار فيديو</p>
                          </label>
                          {videoPreview && (<VideoPreview preview={videoPreview} onRemove={removeVideo} />)}
                          <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-lg font-semibold">اسم المنتج</FormLabel>
                          <FormControl><Input placeholder="مثال: ساعة ذكية رياضية" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><FormLabel className="text-lg font-semibold">الفئة الرئيسية</FormLabel><div className="w-full flex items-center h-10 rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-muted-foreground">{sellerMainCategoryName}</div></div>
                      <FormField control={form.control} name="category_id" render={({ field }) => (
                          <FormItem className="space-y-2">
                              <FormLabel className="text-lg font-semibold">الفئة الفرعية</FormLabel>
                              <FormControl><Button type="button" variant="outline" className="w-full justify-between h-10" onClick={() => setIsCategoryPickerOpen(true)} disabled={isSubmitting}><span className={field.value ? "text-primary font-semibold" : "text-muted-foreground"}>{getSubCategoryDisplayName(field.value)}</span><ChevronDown className="h-4 w-4 text-muted-foreground" /></Button></FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                      />
                  </div>
                  <div className="p-4 border rounded-lg space-y-4 bg-gray-50/50">
                    <FormLabel className="text-lg font-semibold">التسعير والخصومات</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <div className="space-y-2"><FormLabel>السعر الأساسي (إجباري)</FormLabel><div className="flex gap-2"><FormField control={form.control} name="price" render={({ field }) => ( <FormItem className="flex-grow"><FormControl><Input type="number" placeholder="100" value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} /><FormField control={form.control} name="currency" render={({ field, fieldState }) => ( <FormItem className="w-[150px]"><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className={`${fieldState.error ? 'border-red-500' : ''}`}><SelectValue placeholder="العملة" /></SelectTrigger></FormControl><SelectContent>{arabCurrencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} /></div></div>
                      <div className="space-y-2"><FormLabel>سعر الخصم (اختياري)</FormLabel><FormField control={form.control} name="discount_price" render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="مثال: 75" value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} /></div>
                    </div>
                    <DiscountPreview control={form.control} />
                  </div>
                  <div className="p-4 border rounded-lg space-y-4 bg-gray-50/50">
                      <FormLabel className="text-lg font-semibold">أسعار إضافية (اختياري)</FormLabel>
                      {priceFields.map((item, index) => (
                          <div key={item.id} className="space-y-2 border p-3 rounded-lg bg-white">
                              <div className="flex gap-2 items-center"><FormField control={form.control} name={`additional_prices.${index}.label`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">وصف السعر</FormLabel><FormControl><Input placeholder="مثال: سعر الجملة" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><Button type="button" variant="ghost" size="icon" className="text-red-500 self-end" onClick={() => removePrice(index)}><Trash2 className="h-4 w-4" /></Button></div>
                              <div className="flex flex-col sm:flex-row gap-2"><FormField control={form.control} name={`additional_prices.${index}.price`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">السعر</FormLabel><FormControl><Input type="number" placeholder="السعر" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} /><FormField control={form.control} name={`additional_prices.${index}.currency`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">العملة</FormLabel><FormControl><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="العملة" /></SelectTrigger><SelectContent>{arabCurrencies.map(c => (<SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>))}</SelectContent></Select></FormControl></FormItem>)} /></div>
                          </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => appendPrice({ price: undefined, currency: defaultCurrency, label: "" })}><PlusCircle className="h-4 w-4 ml-2" />إضافة سعر إضافي</Button>
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel className="text-lg font-semibold">تفاصيل المنتج</FormLabel><FormControl><Textarea placeholder="اكتب وصفًا تفصيليًا وجذابًا لمنتجك..." {...field} rows={6} /></FormControl><FormMessage /></FormItem> )} />
                  <div>
                      <FormLabel className="text-lg font-semibold">تفاصيل إضافية (اختياري)</FormLabel>
                      <div className="space-y-4 mt-2">{fields.map((item, index) => ( <div key={item.id} className="flex items-center gap-4"><FormField control={form.control} name={`additional_details.${index}.feature`} render={({ field }) => ( <FormItem className="flex-1"><FormControl><Input placeholder="الميزة (مثال: اللون)" {...field} /></FormControl></FormItem> )} /><FormField control={form.control} name={`additional_details.${index}.value`} render={({ field }) => ( <FormItem className="flex-1"><FormControl><Input placeholder="القيمة (مثال: أسود)" {...field} /></FormControl></FormItem> )} /><Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><XCircle className="h-4 w-4" /></Button></div> ))}<Button type="button" variant="outline" onClick={() => append({ feature: "", value: "" })}><PlusCircle className="h-4 w-4 ml-2" />إضافة تفصيل آخر</Button></div>
                  </div>
                </div>
              </fieldset>
          
              <DialogFooter className="mt-6 pt-4 border-t flex-shrink-0 items-center gap-3">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {isSubmitting ? ( <><EyeOff className="h-4 w-4 ml-2" /> إخفاء</> ) : ( <><XCircle className="h-4 w-4 ml-2" /> إلغاء</> )}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 min-w-32">
                  {isSubmitting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" />جاري النشر...</> ) : ( <><Send className="h-4 w-4 ml-2" />نشر المنتج</> )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <CategoryPickerModal isOpen={isCategoryPickerOpen && !isSubmitting} onClose={() => setIsCategoryPickerOpen(false)} fetchSubCategories={fetchSubCategories} initialParentId={sellerMainCategoryId ? parseInt(sellerMainCategoryId) : null} onSelect={(selectedCategory: Category | SuggestedCategory) => { form.setValue("category_id", selectedCategory, { shouldValidate: true }); setIsCategoryPickerOpen(false); }} />
    </>
  );
}
