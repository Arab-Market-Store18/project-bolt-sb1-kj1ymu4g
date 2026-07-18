// المسار: components/edit-product-modal.tsx
// -- النسخة النهائية: تم توحيدها بالكامل مع نظام الإضافة والتعديل --

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// --- [1] استيراد الأدوات الموحدة ---
import { ImageOptimizer } from "@/lib/image-optimizer";
import { useUploadManager } from "@/hooks/useUploadManager"; // <-- تم الإضافة
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { uploadToCloudinaryWithProgress } from '@/lib/utils/cloudinary';
import { validateFile } from '@/lib/utils/validation';
import { getOptimizedMediaUrl } from '@/lib/utils/cloudinary';
import type { Product, Category } from '@/lib/types';

// --- مكونات UI والأيقونات (موحدة) ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, Trash2, ImagePlus, Video, ChevronDown, Save, XCircle, Percent, Upload, EyeOff } from 'lucide-react';
import { CategoryPickerModal, SuggestedCategory } from "@/components/category-picker-modal";

const arabCurrencies = [
    { code: "YER", name: "ريال يمني" }, { code: "SAR", name: "ريال سعودي" }, { code: "AED", name: "درهم إماراتي" }, { code: "QAR", name: "ريال قطري" }, { code: "KWD", name: "دينار كويتي" }, { code: "BHD", name: "دينار بحريني" }, { code: "OMR", name: "ريال عماني" }, { code: "EGP", name: "جنيه مصري" }, { code: "JOD", name: "دينار أردني" }, { code: "SDG", name: "جنيه سوداني" }, { code: "LYD", name: "دينار ليبي" }, { code: "TND", name: "دينار تونسي" }, { code: "DZD", name: "دينار جزائري" }, { code: "MAD", name: "درهم مغربي" }, { code: "USD", name: "دولار أمريكي" },
];

// --- [2] مخطط Zod الموحد (مطابق تمامًا لنموذج الإضافة) ---
const productSchema = z.object({
  name: z.string().min(3, { message: "اسم المنتج مطلوب (3 أحرف على الأقل)." }),
  description: z.string().min(20, { message: "وصف المنتج مطلوب (20 حرفًا على الأقل)." }),
  category_id: z.any().refine(val => val != null, { message: "يجب تحديد فئة فرعية للمنتج." }),
  price: z.coerce.number({ required_error: "السعر الأساسي مطلوب.", invalid_type_error: "السعر يجب أن يكون رقمًا." }).positive({ message: "السعر يجب أن يكون أكبر من صفر." }),
  discount_price: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.coerce.number({ invalid_type_error: "سعر الخصم يجب أن يكون رقمًا." }).positive({ message: "سعر الخصم يجب أن يكون أكبر من صفر." }).optional()),
  currency: z.string({ required_error: "يجب اختيار عملة للسعر الأساسي." }),
  images: z.array(z.any()).min(1, "يجب رفع صورة واحدة على الأقل.").max(10, "يمكن رفع 10 صور كحد أقصى."),
  video: z.any().optional(),
  additional_details: z.array(z.object({ feature: z.string(), value: z.string() })).optional(),
  additional_prices: z.array(z.object({ price: z.preprocess((val) => (val === "" || val === null ? undefined : parseFloat(String(val))), z.number().positive().optional()), currency: z.string().optional(), label: z.string().min(1).optional() })).optional(),
}).superRefine((data, ctx) => {
  if (data.discount_price && data.price && data.discount_price >= data.price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "سعر الخصم يجب أن يكون أقل من السعر الأساسي.", path: ['discount_price'] });
  }
});

type ProductFormValues = z.infer<typeof productSchema>;

// --- المكونات المساعدة (موحدة) ---
const ImagePreview = ({ preview, onRemove }: { preview: string; onRemove: () => void; }) => (
    <div className="relative group transition-all hover:scale-105">
        <img src={preview} alt="preview" className="w-full h-24 object-cover rounded-md border bg-gray-200" />
        <button type="button" onClick={onRemove} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600">
            <Trash2 className="h-3 w-3" />
        </button>
    </div>
);
const VideoPreview = ({ preview, onRemove }: { preview: string; onRemove: () => void; }) => (
    <div className="mt-4 relative transition-all hover:scale-[1.02]">
        <video src={preview} controls className="w-full rounded-md max-h-60 border shadow-sm bg-black"></video>
        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 transition-all hover:scale-110" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
        </Button>
    </div>
);
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
      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-sm text-center flex items-center justify-center gap-2">
        <Percent className="h-4 w-4" />
        <span>سيظهر للعميل خصم بنسبة <strong>{discountPercentage}%</strong></span>
      </div>
    );
  }
  return null;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (updatedProduct: Product) => void;
  productToEdit: Product | null;
  allCategories: Category[];
}

export function EditProductModal({ isOpen, onClose, onProductUpdated, productToEdit, allCategories }: EditProductModalProps) {
  const supabase = createSupabaseBrowserClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<{ type: 'image' | 'video', url: string, originalUrl?: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  
  // --- [3] دمج مدير التحميل العالمي ---
  const { startUpload, updateProgress, finishUpload } = useUploadManager();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
  });

  const getCategoryById = useCallback((id: number | null) => {
    if (!id || !allCategories) return null;
    return allCategories.find(c => c.id === id) || null;
  }, [allCategories]);

  useEffect(() => {
    if (productToEdit && isOpen) {
      const detailsArray = productToEdit.additional_details ? Object.entries(productToEdit.additional_details).map(([feature, value]) => ({ feature, value: String(value) })) : [];
      const initialImages = productToEdit.images || [];
      const initialVideo = productToEdit.video_url;

      form.reset({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        category_id: getCategoryById(productToEdit.category_id),
        price: productToEdit.price || undefined,
        discount_price: productToEdit.discount_price || undefined,
        currency: productToEdit.currency || '',
        images: initialImages,
        video: initialVideo,
        additional_details: detailsArray,
        additional_prices: productToEdit.additional_prices || [],
      });

      const imagePreviews = initialImages.map(url => ({ type: 'image' as const, url: getOptimizedMediaUrl(url, 'image'), originalUrl: url }));
      const videoPreview = initialVideo ? [{ type: 'video' as const, url: getOptimizedMediaUrl(initialVideo, 'video'), originalUrl: initialVideo }] : [];
      setMediaPreviews([...imagePreviews, ...videoPreview]);
      setUploadProgress(0);
      setCompressionProgress(0);
    }
  }, [productToEdit, isOpen, form, getCategoryById]);

  // --- [4] إضافة تحذير لمنع الإغلاق العرضي ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSubmitting]);

  const { fields: detailFields, append: appendDetail, remove: removeDetail } = useFieldArray({ control: form.control, name: "additional_details" });
  const { fields: priceFields, append: appendPrice, remove: removePrice } = useFieldArray({ control: form.control, name: "additional_prices" });

  const handleMediaUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (type === 'image') {
        const currentImages = form.getValues("images") || [];
        if ((currentImages.length + files.length) > 10) { toast.error("لا يمكنك إضافة أكثر من 10 صور."); return; }
        
        const validFiles = files.filter(file => {
            const error = validateFile(file, 'images');
            if (error) { toast.error(`خطأ في الملف ${file.name}: ${error}`); return false; }
            return true;
        });

        form.setValue("images", [...currentImages, ...validFiles], { shouldValidate: true });
        const newPreviews = validFiles.map(f => ({ type: 'image' as const, url: URL.createObjectURL(f) }));
        setMediaPreviews(prev => [...prev, ...newPreviews]);
    } else { // type === 'video'
        const file = files[0];
        const error = validateFile(file, 'videos');
        if (error) { toast.error(`خطأ في ملف الفيديو: ${error}`); return; }

        form.setValue("video", file, { shouldValidate: true });
        const currentVideoIndex = mediaPreviews.findIndex(p => p.type === 'video');
        const newPreview = { type: 'video' as const, url: URL.createObjectURL(file) };
        if (currentVideoIndex > -1) {
            setMediaPreviews(prev => {
                const newArr = [...prev];
                URL.revokeObjectURL(newArr[currentVideoIndex].url);
                newArr[currentVideoIndex] = newPreview;
                return newArr;
            });
        } else {
            setMediaPreviews(prev => [...prev, newPreview]);
        }
    }
  }, [form, mediaPreviews]);

  const removeMedia = useCallback((index: number) => {
    const itemToRemove = mediaPreviews[index];
    
    if (itemToRemove.type === 'image') {
        const currentImages = form.getValues("images") || [];
        const updatedImages = currentImages.filter(img => (typeof img === 'string' ? img !== itemToRemove.originalUrl : URL.createObjectURL(img) !== itemToRemove.url));
        form.setValue("images", updatedImages, { shouldValidate: true });
    } else { // type === 'video'
        form.setValue("video", null, { shouldValidate: true });
    }

    if (!itemToRemove.originalUrl) {
        URL.revokeObjectURL(itemToRemove.url);
    }
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  }, [form, mediaPreviews]);

  const fetchSubCategories = useCallback(async (parentId: number | null): Promise<Category[]> => {
    if (!parentId || !allCategories) return [];
    return allCategories.filter(c => c.parent_id === parentId);
  }, [allCategories]);

  // --- [5] دالة onSubmit الموحدة والذكية ---
  const onSubmit = async (values: ProductFormValues) => {
    if (!productToEdit) return;
    
    const uploadId = startUpload('product', 'edit', values.name);
    toast.info("يمكنك إغلاق النافذة، سيتم إعلامك عند اكتمال التعديل", { duration: 5000 });
    
    setIsSubmitting(true);
    setUploadProgress(0);
    setCompressionProgress(0);
    const toastId = toast.loading("⏳ جاري تجهيز التعديلات...");

    try {
        const assetFolder = `products/physical_products/${productToEdit.seller_id}`;
        
        const newImageFiles = (values.images || []).filter(img => typeof img !== 'string') as File[];
        const existingImageUrls = (values.images || []).filter(img => typeof img === 'string') as string[];

        const compressedImages: File[] = [];
        if (newImageFiles.length > 0) {
            toast.loading("ضغط الصور الجديدة...", { id: toastId });
            for (let i = 0; i < newImageFiles.length; i++) {
                const compressed = await ImageOptimizer.compressImage(newImageFiles[i], 'product');
                compressedImages.push(compressed);
                const progress = Math.round(((i + 1) / newImageFiles.length) * 100);
                setCompressionProgress(progress);
            }
            setCompressionProgress(0);
        }
        
        const videoFile = values.video && typeof values.video !== 'string' ? values.video as File : null;
        const totalFilesToUpload = compressedImages.length + (videoFile ? 1 : 0);
        let filesUploaded = 0;
        
        if (totalFilesToUpload > 0) {
            toast.loading(`جاري رفع ${totalFilesToUpload} ملفات جديدة...`, { id: toastId });
        }
        
        const imageUploadPromises = compressedImages.map(async (image) => {
            const url = await uploadToCloudinaryWithProgress(image, { folder: assetFolder });
            filesUploaded++;
            const overallProgress = Math.round((filesUploaded / totalFilesToUpload) * 100);
            setUploadProgress(overallProgress);
            updateProgress(uploadId, overallProgress);
            return url;
        });

        // استخدام Promise.allSettled لرفع الصور
        const imageUploadResults = await Promise.allSettled(imageUploadPromises);
        const uploadedImageUrls = imageUploadResults
            .filter(res => res.status === 'fulfilled')
            .map(res => (res as PromiseFulfilledResult<string>).value);

        let finalVideoUrl = typeof values.video === 'string' ? values.video : null;
        if (videoFile) {
            finalVideoUrl = await uploadToCloudinary(videoFile, { folder: assetFolder });
            filesUploaded++;
            const overallProgress = Math.round((filesUploaded / totalFilesToUpload) * 100);
            setUploadProgress(overallProgress);
            updateProgress(uploadId, overallProgress);
        }

        const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];

        const filteredDetails = (values.additional_details || []).filter(d => d.feature.trim() && d.value.trim());
        const categoryValue = values.category_id as any;

        const dataToUpdate = {
            name: values.name,
            description: values.description,
            category_id: categoryValue?.id ? parseInt(categoryValue.id) : null,
            subcategory: categoryValue?.name || null,
            price: values.price,
            discount_price: (values.discount_price && values.discount_price > 0) ? values.discount_price : null,
            currency: values.currency,
            images: finalImageUrls.length > 0 ? finalImageUrls : null,
            video_url: finalVideoUrl,
            additional_details: filteredDetails.length > 0 ? filteredDetails : null,
            additional_prices: (values.additional_prices || []).filter(p => p.price && p.currency && p.label),
        };

        toast.loading("جاري تحديث قاعدة البيانات...", { id: toastId });
        const { data: updatedProduct, error: updateError } = await supabase.from('products')
            .update(dataToUpdate)
            .eq('id', productToEdit.id)
            .select()
            .single();
      
        if (updateError) throw updateError;
        
        toast.success("✅ تم تحديث المنتج بنجاح!", { id: toastId });
        finishUpload(uploadId, true, "تم تحديث المنتج بنجاح");
        onProductUpdated?.(updatedProduct as Product);
        onClose();
      
    } catch (error: any) {
      console.error("Product update error:", error);
      toast.error(error.message || "حدث خطأ غير متوقع.", { id: toastId });
      finishUpload(uploadId, false, error.message || "فشل تحديث المنتج");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // --- [6] منطق الإغلاق الموحد ---
  const handleClose = useCallback(() => {
    if (isSubmitting) {
      toast.info("العملية مستمرة في الخلفية. ستتلقى إشعارًا عند اكتمالها.");
      onClose();
      return;
    }
    
    mediaPreviews.forEach(p => { if (!p.originalUrl) URL.revokeObjectURL(p.url); });
    setMediaPreviews([]);
    onClose();
  }, [isSubmitting, onClose, mediaPreviews]);
  
  const mainCategoryName = useMemo(() => {
    if (!productToEdit?.main_category_id || !allCategories) return "المنتجات";
    const category = allCategories.find(c => c.id === productToEdit.main_category_id);
    return category ? category.name : "المنتجات";
  }, [productToEdit, allCategories]);

  if (!isOpen || !productToEdit) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">تعديل المنتج</DialogTitle>
            <DialogDescription>قم بتحديث تفاصيل منتجك هنا.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow flex flex-col overflow-hidden">
              <fieldset disabled={isSubmitting} className="flex-grow flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto pr-4 space-y-8">
                
                  {compressionProgress > 0 && compressionProgress < 100 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                          <div className="flex items-center gap-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              <div className="flex-1">
                                  <div className="text-sm font-medium text-blue-900">⚡ جاري تحسين الصور الجديدة...</div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${compressionProgress}%` }}></div></div>
                                  <div className="text-xs text-blue-700 mt-1">{compressionProgress}% مكتمل</div>
                              </div>
                          </div>
                      </div>
                  )}
                  
                  <FormField control={form.control} name="images" render={({ fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold flex items-center gap-2"><ImagePlus /> صور المنتج</FormLabel>
                      <FormControl><Input type="file" accept="image/*" multiple className="hidden" id="edit-product-image-upload" onChange={(e) => handleMediaUpload(e, 'image')} /></FormControl>
                      <label htmlFor="edit-product-image-upload" className={`block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${fieldState.error ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}`}>
                          <Upload className="mx-auto h-6 w-6 text-blue-600 mb-1" /><p className="font-semibold text-blue-600">أضف صورًا جديدة</p>
                      </label>
                      {mediaPreviews.filter(p => p.type === 'image').length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4">
                              {mediaPreviews.map((preview, index) => preview.type === 'image' && (<ImagePreview key={preview.url} preview={preview.url} onRemove={() => removeMedia(index)} />))}
                          </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="video" render={() => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold flex items-center gap-2"><Video /> فيديو المنتج (اختياري)</FormLabel>
                      <FormControl><Input type="file" accept="video/*" className="hidden" id="edit-product-video-upload" onChange={(e) => handleMediaUpload(e, 'video')} /></FormControl>
                      <label htmlFor="edit-product-video-upload" className="block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all border-gray-300 hover:border-purple-500">
                          <Video className="mx-auto h-6 w-6 text-purple-600 mb-1" /><p className="font-semibold text-purple-600">اختر فيديو جديد (سيستبدل القديم)</p>
                      </label>
                      {mediaPreviews.find(p => p.type === 'video') && (<VideoPreview preview={mediaPreviews.find(p => p.type === 'video')!.url} onRemove={() => removeMedia(mediaPreviews.findIndex(p => p.type === 'video'))} />)}
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم المنتج</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><FormLabel>الفئة الرئيسية (ثابتة)</FormLabel><div className="w-full flex items-center h-10 rounded-md border bg-gray-100 px-3 py-2 text-sm text-muted-foreground">{mainCategoryName}</div></div>
                    <FormField control={form.control} name="category_id" render={({ field }) => ( <FormItem className="space-y-2"><FormLabel>الفئة الفرعية</FormLabel><FormControl><Button type="button" variant="outline" className="w-full justify-between text-right h-10" onClick={() => setIsCategoryPickerOpen(true)}>{field.value?.name ? ( <span className="text-primary font-medium">{field.value.name}</span> ) : ( <span className="text-muted-foreground">اختر فئة فرعية...</span> )}<ChevronDown className="h-4 w-4" /></Button></FormControl><FormMessage /></FormItem> )} />
                  </div>
                  <div className="p-4 border rounded-lg space-y-4">
                    <FormLabel className="text-lg font-semibold">التسعير والخصومات</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <div className="space-y-2"><FormLabel>السعر الأساسي</FormLabel><div className="flex gap-2"><FormField control={form.control} name="price" render={({ field }) => ( <FormItem className="flex-grow"><FormControl><Input type="number" value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} /><FormField control={form.control} name="currency" render={({ field, fieldState }) => ( <FormItem className="w-[150px]"><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className={fieldState.error ? 'border-red-500' : ''}><SelectValue placeholder="العملة" /></SelectTrigger></FormControl><SelectContent>{arabCurrencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} /></div></div>
                      <div className="space-y-2"><FormLabel>سعر الخصم (اختياري)</FormLabel><FormField control={form.control} name="discount_price" render={({ field }) => (<FormItem><FormControl><Input type="number" value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} /></div>
                    </div>
                    <DiscountPreview control={form.control} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>وصف تفصيلي للمنتج</FormLabel><FormControl><Textarea {...field} rows={6} /></FormControl><FormMessage /></FormItem> )} />
                  <div>
                    <FormLabel className="text-lg font-semibold">تفاصيل إضافية (اختياري)</FormLabel>
                    <div className="space-y-4 mt-2">{detailFields.map((item, index) => ( <div key={item.id} className="flex items-center gap-4"><FormField control={form.control} name={`additional_details.${index}.feature`} render={({ field }) => ( <FormItem className="flex-1"><FormControl><Input placeholder="الميزة" {...field} /></FormControl><FormMessage /></FormItem> )} /><FormField control={form.control} name={`additional_details.${index}.value`} render={({ field }) => ( <FormItem className="flex-1"><FormControl><Input placeholder="القيمة" {...field} /></FormControl><FormMessage /></FormItem> )} /><Button type="button" variant="destructive" size="icon" onClick={() => removeDetail(index)}><XCircle className="h-4 w-4" /></Button></div> ))}<Button type="button" variant="outline" onClick={() => appendDetail({ feature: "", value: "" })}><PlusCircle className="h-4 w-4 ml-2" />إضافة تفصيل آخر</Button></div>
                  </div>
                </div>
              </fieldset>
              <DialogFooter className="mt-6 pt-4 border-t flex-shrink-0 items-center gap-3">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting && uploadProgress === 100}>
                  {isSubmitting ? (<><EyeOff className="h-4 w-4 ml-2" />إخفاء</>) : (<><XCircle className="h-4 w-4 ml-2" />إلغاء</>)}
                </Button>
                
                {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="flex-grow flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 flex-1">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-blue-700 font-medium">جاري الرفع:</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div></div>
                      <span className="font-bold text-blue-800">{uploadProgress}%</span>
                    </div>
                  </div>
                )}
                
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-32">
                  {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الحفظ...</>) : (<><Save className="h-4 w-4 ml-2" /> حفظ التعديلات</>)}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CategoryPickerModal isOpen={isCategoryPickerOpen && !isSubmitting} onClose={() => setIsCategoryPickerOpen(false)} fetchSubCategories={fetchSubCategories} initialParentId={productToEdit.main_category_id ? Number(productToEdit.main_category_id) : null} onSelect={(selected: Category | SuggestedCategory) => { form.setValue('category_id', selected, { shouldValidate: true }); setIsCategoryPickerOpen(false); }} />
    </>
  );
}
