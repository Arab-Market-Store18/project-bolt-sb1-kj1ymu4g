// المسار: features/service/management/components/AddServiceModal.tsx
// -- النسخة المعدلة للتكامل مع upload-store الحديث --

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { type Category } from '@/lib/types';
import { useModal } from "@/hooks/use-modal";
import { useAuth } from '@/context/AuthContext';

import {uploadToCloudinaryWithProgress } from '@/lib/utils/cloudinary';
import { validateFile } from '@/lib/utils/validation';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, ImagePlus, Video, ChevronDown, Send, Eye, XCircle, Percent, Upload, EyeOff } from 'lucide-react';
import { CategoryPickerModal } from "@/components/category-picker-modal";
import type { SuggestedCategory } from "@/components/category-picker-modal";
import { ImageOptimizer } from "@/lib/image-optimizer";
import { useUploadStore } from '@/store/upload-store'; // ⭐ استيراد الـ store الجديد
import { createServiceV2 } from '../actions/createService.action';
import { FEATURES } from '@/lib/feature-flags';

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

// --- مخطط Zod (كما هو) ---
const serviceSchema = z.object({
  name: z.string().min(3, { message: "عنوان الخدمة مطلوب (3 أحرف على الأقل)." }),
  description: z.string().min(20, { message: "وصف الخدمة مطلوب (20 حرفًا على الأقل)." }),
  category_id: z.any().refine(val => val != null, { message: "يجب تحديد قسم للخدمة." }),
  price: z.coerce.number({ required_error: "السعر الأساسي مطلوب.", invalid_type_error: "السعر يجب أن يكون رقمًا." }).positive({ message: "السعر يجب أن يكون أكبر من صفر." }),
  discount_price: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number({ invalid_type_error: "سعر الخصم يجب أن يكون رقمًا." }).positive({ message: "سعر الخصم يجب أن يكون أكبر من صفر." }).optional()
  ),
  currency: z.string({ required_error: "يجب اختيار عملة للسعر الأساسي." }),
  images: z.array(z.any()).min(1, { message: "يجب رفع صورة واحدة على الأقل." }).max(10, "يمكن رفع 10 صور كحد أقصى."),
  video: z.any().optional(),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  additional_prices: z.array(
    z.object({
      price: z.preprocess((val) => (val === "" || val === null ? undefined : parseFloat(String(val))), z.number().positive().optional()),
      currency: z.string().optional(),
      label: z.string().min(1).optional(),
    })
  ).optional(),
}).superRefine((data, ctx) => {
  if (data.discount_price && data.price && data.discount_price >= data.price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "سعر الخصم يجب أن يكون أقل من السعر الأساسي.", path: ['discount_price'] });
  }
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

// --- مكونات مساعدة (كما هي) ---
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

function DiscountPreview({ control }: { control: any }) {
  const [price, discountPrice] = useWatch({ control, name: ["price", "discount_price"] });
  const discountPercentage = useMemo(() => {
    const basePrice = parseFloat(String(price));
    const salePrice = parseFloat(String(discountPrice));
    if (salePrice > 0 && basePrice > salePrice) {
      return Math.round(((basePrice - salePrice) / basePrice) * 100);
    }
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

export function AddServiceModal() {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === 'addService';
  const { onServiceAdded, sellerId, sellerCountry, sellerMainCategoryId, sellerMainCategoryName } = data || {}; 
  
  const supabase = createSupabaseBrowserClient();
  const { user, serviceProviderProfile, displayName } = useAuth();

  // ⭐ استخدام الـ store الجديد
  const { 
    startUpload, 
    updateFileProgress, 
    completeFileUpload, 
    failFileUpload, 
    completeUpload, 
    failUpload,
    toggleGlobalIndicator 
  } = useUploadStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [mainCategoryDisplayName, setMainCategoryDisplayName] = useState('الخدمات');
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);

  const defaultCurrency = useMemo(() => sellerCountry ? countryCodeCurrencyMap[sellerCountry] : undefined, [sellerCountry]);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    mode: "onBlur",
    defaultValues: {
      name: '', description: '', category_id: null, price: undefined, discount_price: undefined,
      currency: defaultCurrency, images: [], video: null,
      specifications: [{ key: 'مدة التسليم', value: '' }],
      additional_prices: [],
    },
  });

  // تنظيف الملفات المؤقتة عند إغلاق المودال
  useEffect(() => {
    return () => {
      imagePreviews.forEach(p => URL.revokeObjectURL(p));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreviews, videoPreview]);

  // تهيئة المودال عند الفتح
  useEffect(() => {
    if (isModalOpen) {
      form.reset({
        name: '', description: '', category_id: null, price: undefined, discount_price: undefined,
        currency: defaultCurrency, images: [], video: null,
        specifications: [{ key: 'مدة التسليم', value: '' }],
        additional_prices: [],
      });
      
      // تنظيف المعاينات السابقة
      imagePreviews.forEach(p => URL.revokeObjectURL(p));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setImagePreviews([]);
      setVideoPreview(null);
      
      // إظهار المؤشر العالمي
      toggleGlobalIndicator(true);
    }
  }, [isModalOpen, defaultCurrency, form]);

  // الحصول على اسم الفئة الرئيسية
  useEffect(() => {
    if (sellerMainCategoryName && sellerMainCategoryName !== "غير محدد" && sellerMainCategoryName !== "قسم غير معروف") {
      setMainCategoryDisplayName(sellerMainCategoryName);
    } else if (sellerMainCategoryId) {
      const fetchCategoryName = async () => {
        const { data } = await supabase.from('categories').select('name').eq('id', sellerMainCategoryId).single();
        if (data) setMainCategoryDisplayName(data.name);
      };
      fetchCategoryName();
    }
  }, [sellerMainCategoryId, sellerMainCategoryName, supabase]);

  // استخدام useFieldArray للمواصفات
  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({ 
    control: form.control, 
    name: "specifications" 
  });

  // إزالة صورة
  const removeImage = useCallback((index: number) => {
    const currentImages = form.getValues("images") || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    form.setValue("images", updatedImages, { shouldValidate: true });
    
    const previewToRemove = imagePreviews[index];
    if (previewToRemove) URL.revokeObjectURL(previewToRemove);
    setImagePreviews(prev => prev.filter(p => p !== previewToRemove));
  }, [form, imagePreviews]);

  // رفع الصور
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImages = form.getValues("images") || [];
    
    if ((currentImages.length + files.length) > 10) {
      toast.error("لا يمكنك إضافة أكثر من 10 صور.");
      return;
    }
    
    const validFiles = files.filter(file => {
      const validationError = validateFile(file, 'images');
      if (validationError) {
        toast.error(`خطأ في الملف ${file.name}: ${validationError}`);
        return false;
      }
      return true;
    });
    
    form.setValue("images", [...currentImages, ...validFiles], { shouldValidate: true });
    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [form]);

  // رفع الفيديو
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // تنظيف المعاينة السابقة
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    
    if (file) {
      const validationError = validateFile(file, 'videos');
      if (validationError) {
        toast.error(`خطأ في ملف الفيديو: ${validationError}`);
        form.setValue("video", null);
        setVideoPreview(null);
        return;
      }
      
      form.setValue("video", file, { shouldValidate: true });
      setVideoPreview(URL.createObjectURL(file));
    } else {
      form.setValue("video", null);
      setVideoPreview(null);
    }
  }, [form, videoPreview]);

  // إزالة الفيديو
  const removeVideo = useCallback(() => {
    form.setValue("video", null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  }, [form, videoPreview]);

  // جلب الأقسام الفرعية
  const fetchSubCategories = useCallback(async (parentId: number | null): Promise<Category[]> => {
    try {
      const query = supabase.from('categories').select('id, name, icon_name').eq('is_approved', true);
      const finalQuery = parentId === null ? query.is('parent_id', null) : query.eq('parent_id', parentId);
      const { data, error } = await finalQuery.order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast.error("فشل في تحميل الأقسام الفرعية.");
      return [];
    }
  }, [supabase]);

  const getSubCategoryDisplayName = useCallback((subCategory: any): string => {
    if (!subCategory) return "اختر قسم الخدمة...";
    if (typeof subCategory === 'object' && subCategory.name) return subCategory.name;
    return "اختر قسم الخدمة...";
  }, []);

 
const onSubmit = async (values: ServiceFormValues) => {
  if (!sellerId) {
    toast.error("❌ خطأ: لم يتم التعرف على البائع.");
    return;
  }

  setIsSubmitting(true);
  
  // استخراج الملفات
  const imageFiles = (values.images || []).filter(img => img instanceof File) as File[];
  const videoFile = values.video instanceof File ? values.video : null;
  const totalFiles = imageFiles.length + (videoFile ? 1 : 0);

  // 1. إنشاء عملية رفع في الـ store
  const uploadFiles = [
    ...imageFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: 'image' as const,
    })),
    ...(videoFile ? [{
      name: videoFile.name,
      size: videoFile.size,
      type: 'video' as const,
    }] : [])
  ];

  const uploadId = startUpload(
    values.name || 'خدمة جديدة',
    'service',
    uploadFiles
  );
  
  setCurrentUploadId(uploadId);
  
  toast.info("💡 يمكنك تصغير نافذة التحميل، سيستمر الرفع في الخلفية", {
    duration: 5000,
    id: 'upload-tip',
  });

  try {
    // 2. ضغط الصور
    const compressedImages: File[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const compressed = await ImageOptimizer.compressImage(imageFiles[i], 'product');
      compressedImages.push(compressed);
    }

    // 3. رفع الصور مع تحديث التقدم
    const imageUrls: string[] = [];
    for (let index = 0; index < compressedImages.length; index++) {
      const file = compressedImages[index];
      const fileId = `${uploadId}-file-${index}`;
      
      try {
        const url = await uploadToCloudinaryWithProgress(file, {
          folder: `services/${sellerId}/images`,
          onProgress: (progress) => {
            updateFileProgress(uploadId, fileId, progress);
          }
        });
        
        imageUrls.push(url);
        completeFileUpload(uploadId, fileId, url);
        
      } catch (error: any) {
        failFileUpload(uploadId, fileId, error.message);
        throw new Error(`فشل رفع الصورة ${index + 1}: ${error.message}`);
      }
    }

    // 4. رفع الفيديو (إذا وجد)
    let videoUrl: string | null = null;
    if (videoFile) {
      const fileId = `${uploadId}-file-${compressedImages.length}`;
      
      try {
        videoUrl = await uploadToCloudinaryWithProgress(videoFile, {
          folder: `services/${sellerId}/videos`,
          onProgress: (progress) => {
            updateFileProgress(uploadId, fileId, progress);
          }
        });
        
        completeFileUpload(uploadId, fileId, videoUrl);
        
      } catch (error: any) {
        failFileUpload(uploadId, fileId, error.message);
        console.error('❌ فشل رفع الفيديو:', error.message);
        // نستمر بدون الفيديو
      }
    }

    // 5. التحقق من الفئة
    const { category_id: selectedCategory } = values;
    if (!selectedCategory?.id && !selectedCategory?.isSuggested) {
      throw new Error("الفئة الفرعية مطلوبة.");
    }

    // 6. معالجة المواصفات
    const filteredSpecs = (values.specifications || []).filter(spec => spec.key.trim() && spec.value.trim());
    const specificationsObject = filteredSpecs.reduce((acc, spec) => { 
      acc[spec.key] = spec.value; 
      return acc; 
    }, {} as Record<string, string>);

    // 6.5 معالجة الأسعار الإضافية
    const validPrices = (values.additional_prices || []).filter(p => p.price && p.currency && p.label);

    // 7. التحقق من المستخدم مع fallback لـ Supabase مباشرة
    let effectiveUser = user;
    if (!effectiveUser) {
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      effectiveUser = freshUser;
    }

    if (!effectiveUser) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    // sellerId = service_providers.id (UUID الجدول)، وليس auth user ID
    const resolvedProviderId = sellerId || serviceProviderProfile?.id || effectiveUser.id;

    const result = await createServiceV2({
      providerId: resolvedProviderId,
      providerBusinessName: serviceProviderProfile?.business_name || displayName || '',
      providerEmail: serviceProviderProfile?.email || effectiveUser.email || '',
      name: values.name,
      description: values.description,
      price: values.price,
      currency: values.currency,
      discountPrice: values.discount_price,
      mainCategoryId: sellerMainCategoryId || '2',
      categoryData: values.category_id,
      images: imageUrls,
      video: videoUrl,
      specifications: Object.keys(specificationsObject).length > 0 ? specificationsObject : null,
      additionalPrices: validPrices.length > 0 ? validPrices : null
    });

    if (result.success) {
      // تحديث الـ store بنجاح العملية
      completeUpload(uploadId, '✅ تم إنشاء الخدمة بنجاح!');
      
      toast.success("✅ تم إنشاء الخدمة بنجاح", { id: 'saving-toast' });
      
      if (result.data && onServiceAdded) {
        onServiceAdded(result.data);
      }
      
      // إغلاق المودال بعد تأخير بسيط
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } else {
      throw new Error(result.error || 'حدث خطأ أثناء حفظ الخدمة');
    }

  } catch (error: any) {
    console.error("Service submission error:", error);
    
    // تحديث الـ store بفشل العملية
    failUpload(uploadId, error.message);
    
    toast.error(`❌ ${error.message || "حدث خطأ غير متوقع"}`, { 
      id: 'saving-toast',
      duration: 8000 
    });
    
  } finally {
    setIsSubmitting(false);
    setCurrentUploadId(null);
  }
};
  // --- ⬇️ التعديل الأول: تحديث دالة الإغلاق ---
  const handleClose = useCallback(() => {
    onClose();
    if (currentUploadId) {
      toggleGlobalIndicator(true);
    }
  }, [onClose, currentUploadId, toggleGlobalIndicator]);
  // --- ⬆️ نهاية التعديل الأول ---

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">إضافة خدمة جديدة</DialogTitle>
            <DialogDescription className="text-center">املأ التفاصيل التالية لنشر خدمتك.</DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow flex flex-col overflow-hidden">
              {/* --- ⬇️ التعديل الثاني: نقل الأزرار خارج fieldset --- */}
              <fieldset disabled={isSubmitting} className="flex-grow flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto pr-4 space-y-6">
                  
                  {/* معرض الصور */}
                  <FormField 
                    control={form.control} 
                    name="images" 
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold flex items-center gap-2">
                          <ImagePlus className="text-blue-600" /> معرض أعمال الخدمة (مطلوب)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            className="hidden" 
                            id="service-image-upload" 
                            onChange={handleImageUpload} 
                          />
                        </FormControl>
                        <label 
                          htmlFor="service-image-upload" 
                          className={`block w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200 ${
                            fieldState.error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          } ${isSubmitting ? 'cursor-not-allowed bg-gray-100' : ''}`}
                        >
                          <Upload className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                          <p className="font-semibold text-blue-600">انقر هنا لاختيار الصور</p>
                          <p className="text-sm text-gray-500 mt-1">يمكنك رفع حتى 10 صور (JPEG, PNG, WebP)</p>
                        </label>
                        {imagePreviews.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-4">
                            {imagePreviews.map((preview, index) => (
                              <ImagePreview 
                                key={preview} 
                                preview={preview} 
                                index={index} 
                                onRemove={removeImage} 
                              />
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  {/* فيديو الخدمة */}
                  <FormField 
                    control={form.control} 
                    name="video" 
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold flex items-center gap-2">
                          <Video className="text-purple-600" /> فيديو الخدمة (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            id="service-video-upload" 
                            onChange={handleVideoUpload} 
                          />
                        </FormControl>
                        <label 
                          htmlFor="service-video-upload" 
                          className={`block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-200 ${
                            isSubmitting ? 'cursor-not-allowed bg-gray-100' : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                          }`}
                        >
                          <Video className="mx-auto h-6 w-6 text-purple-600 mb-1" />
                          <p className="font-semibold text-purple-600">انقر هنا لاختيار فيديو</p>
                        </label>
                        {videoPreview && <VideoPreview preview={videoPreview} onRemove={removeVideo} />}
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  {/* عنوان الخدمة */}
                  <FormField 
                    control={form.control} 
                    name="name" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">عنوان الخدمة</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="مثال: تصميم شعار احترافي لشركتك" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  {/* الفئات */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel className="text-lg font-semibold flex items-center gap-2">
                        <span>الفئة الرئيسية</span>
                        {sellerMainCategoryId && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">⭐ مثبتة</span>
                        )}
                      </FormLabel>
                      <div className="w-full flex items-center justify-between h-10 rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                        <span className="font-medium">{mainCategoryDisplayName}</span>
                        {sellerMainCategoryId && <span className="text-xs text-green-600">✓</span>}
                      </div>
                      {sellerMainCategoryId && (
                        <p className="text-xs text-gray-500">سيتم عرض الخدمات ضمن هذه الفئة الرئيسية فقط</p>
                      )}
                    </div>
                    
                    <FormField 
                      control={form.control} 
                      name="category_id" 
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-lg font-semibold">قسم الخدمة</FormLabel>
                          <FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full justify-between text-right h-10" 
                              onClick={() => setIsCategoryPickerOpen(true)} 
                              disabled={isSubmitting}
                            >
                              <span className={field.value ? "text-primary font-semibold" : "text-muted-foreground"}>
                                {getSubCategoryDisplayName(field.value)}
                              </span>
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} 
                    />
                  </div>

                  {/* التسعير */}
                  <div className="p-4 border rounded-lg space-y-4">
                    <FormLabel className="text-lg font-semibold">التسعير والخصومات</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <div className="space-y-2">
                        <FormLabel>السعر الأساسي (إجباري)</FormLabel>
                        <div className="flex gap-2">
                          <FormField 
                            control={form.control} 
                            name="price" 
                            render={({ field }) => (
                              <FormItem className="flex-grow">
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="100" 
                                    value={field.value ?? ''} 
                                    onChange={field.onChange} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} 
                          />
                          
                          <FormField 
                            control={form.control} 
                            name="currency" 
                            render={({ field, fieldState }) => (
                              <FormItem className="w-[150px]">
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className={`${fieldState.error ? 'border-red-500' : ''}`}>
                                      <SelectValue placeholder="العملة" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {arabCurrencies.map(c => (
                                      <SelectItem key={c.code} value={c.code}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>سعر الخصم (اختياري)</FormLabel>
                        <FormField 
                          control={form.control} 
                          name="discount_price" 
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="مثال: 75" 
                                  value={field.value ?? ''} 
                                  onChange={field.onChange} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} 
                        />
                      </div>
                    </div>
                    <DiscountPreview control={form.control} />
                  </div>

                  {/* الوصف التفصيلي */}
                  <FormField 
                    control={form.control} 
                    name="description" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">وصف تفصيلي للخدمة</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="اكتب وصفًا تفصيليًا وجذابًا لخدمتك..." 
                            {...field} 
                            rows={6} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />

                  {/* ميزات الخدمة */}
                  <div>
                  <FormLabel className="text-lg font-semibold">ميزات الخدمة (اختياري)</FormLabel>
                    <div className="space-y-4 mt-2">
                      {specFields.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <FormField 
                            control={form.control} 
                            name={`specifications.${index}.key`} 
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input 
                                    placeholder="الميزة (مثال: عدد المراجعات)" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} 
                          />
                          
                          <FormField 
                            control={form.control} 
                            name={`specifications.${index}.value`} 
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input 
                                    placeholder="القيمة (مثال: 3 مراجعات)" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} 
                          />
                          
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => removeSpec(index)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => appendSpec({ key: "", value: "" })}
                      >
                        <PlusCircle className="h-4 w-4 ml-2" />
                        إضافة ميزة أخرى
                      </Button>
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* الفوتر */}
              <DialogFooter className="mt-6 pt-4 border-t flex-shrink-0 items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  // --- ⬇️ التعديل الثالث: تم حذف خاصية disabled من هنا ---
                >
                  {isSubmitting ? (
                    <>
                      <EyeOff className="h-4 w-4 ml-2" />
                      إخفاء (الرفع مستمر)
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 ml-2" />
                      إلغاء
                    </>
                  )}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => toast.info("سيتم تفعيل المعاينة قريبًا!")} 
                  disabled={isSubmitting}
                >
                  <Eye className="h-4 w-4 ml-2" />
                  معاينة
                </Button>

                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-emerald-600 hover:bg-emerald-700 min-w-32"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري النشر...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-2" />
                      نشر الخدمة
                    </>
                  )}
                </Button>
              </DialogFooter>
              {/* --- ⬆️ نهاية التعديل الثاني والثالث --- */}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* مودال اختيار الفئة */}
      <CategoryPickerModal
        isOpen={isCategoryPickerOpen && !isSubmitting}
        onClose={() => setIsCategoryPickerOpen(false)}
        fetchSubCategories={fetchSubCategories}
        initialParentId={sellerMainCategoryId ? parseInt(String(sellerMainCategoryId)) : 2}
        stopAtLevel={1}
        forceParentId={sellerMainCategoryId ? parseInt(String(sellerMainCategoryId)) : null}
        disabledCategoryIds={[]}
        onSelect={(selected: Category | SuggestedCategory) => {
          form.setValue('category_id', selected, { shouldValidate: true });
          setIsCategoryPickerOpen(false);
          
          if (typeof selected === 'object' && 'name' in selected) {
            toast.success(`تم اختيار: ${selected.name}`, {
              description: mainCategoryDisplayName !== 'الخدمات' && mainCategoryDisplayName !== 'غير محدد'
                ? `ضمن الفئة الرئيسية: ${mainCategoryDisplayName}` 
                : undefined
            });
          }
        }}
      />
    </>
  );
}
