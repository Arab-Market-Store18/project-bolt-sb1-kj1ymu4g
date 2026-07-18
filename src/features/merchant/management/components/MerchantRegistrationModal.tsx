// features/merchant/management/components/MerchantRegistrationModal.tsx

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Upload, Phone, Loader2, Plus, X, Eye, Store, Globe, User, Lock, Info, MapPin, Mail, ChevronDown, Image as ImageIcon, Shield, AlertCircle } from "lucide-react";

// Project Components & Utils
import { CategoryPickerModal } from "@/components/category-picker-modal";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const ARAB_COUNTRIES = [
  { code: "ye", name: "اليمن", phoneCode: "967", flag: "🇾🇪" },
  { code: "sa", name: "المملكة العربية السعودية", phoneCode: "966", flag: "🇸🇦" },
  { code: "ae", name: "الإمارات العربية المتحدة", phoneCode: "971", flag: "🇦🇪" },
  { code: "eg", name: "مصر", phoneCode: "20", flag: "🇪🇬" },
  { code: "bh", name: "البحرين", phoneCode: "973", flag: "🇧🇭" },
  { code: "qa", name: "قطر", phoneCode: "974", flag: "🇶🇦" },
  { code: "om", name: "عمان", phoneCode: "968", flag: "🇴🇲" },
  { code: "kw", name: "الكويت", phoneCode: "965", flag: "🇰🇼" },
  { code: "jo", name: "الأردن", phoneCode: "962", flag: "🇯🇴" },
  { code: "sy", name: "سوريا", phoneCode: "963", flag: "🇸🇾" },
  { code: "iq", name: "العراق", phoneCode: "964", flag: "🇮🇶" },
  { code: "lb", name: "لبنان", phoneCode: "961", flag: "🇱🇧" },
  { code: "ma", name: "المغرب", phoneCode: "212", flag: "🇲🇦" },
  { code: "dz", name: "الجزائر", phoneCode: "213", flag: "🇩🇿" },
  { code: "tn", name: "تونس", phoneCode: "216", flag: "🇹🇳" },
  { code: "ly", name: "ليبيا", phoneCode: "218", flag: "🇱🇾" },
  { code: "sd", name: "السودان", phoneCode: "249", flag: "🇸🇩" },
  { code: "so", name: "الصومال", phoneCode: "252", flag: "🇸🇴" },
  { code: "dj", name: "جيبوتي", phoneCode: "253", flag: "🇩🇯" },
  { code: "ps", name: "فلسطين", phoneCode: "970", flag: "🇵🇸" },
  { code: "mr", name: "موريتانيا", phoneCode: "222", flag: "🇲🇷" },
];

// Enhanced Zod Schema with better validations
const sellerSchema = z.object({
  businessName: z.string()
    .min(3, "اسم المتجر مطلوب (3 أحرف على الأقل).")
    .max(100, "اسم المتجر طويل جداً (الحد الأقصى 100 حرف)."),
  
  category: z.any().refine(val => !!val && (typeof val === 'object' ? !!val.id : !!val), {
    message: "يجب اختيار النشاط التجاري.",
  }),
  
  description: z.string()
    .max(500, "الوصف طويل جداً (الحد الأقصى 500 حرف).")
    .optional(),
  
  storeType: z.enum(["online", "physical"]),
  
  physicalAddress: z.string()
    .max(200, "العنوان طويل جداً (الحد الأقصى 200 حرف).")
    .optional(),
  
  country: z.string().min(1, "الدولة مطلوبة."),
  
  city: z.string()
    .min(2, "المدينة مطلوبة (حرفين على الأقل).")
    .max(50, "اسم المدينة طويل جداً."),
  
  email: z.string()
    .email("صيغة البريد الإلكتروني غير صحيحة.")
    .min(5, "البريد الإلكتروني قصير جداً.")
    .max(100, "البريد الإلكتروني طويل جداً."),
  
    password: z.string()
    .min(4, "كلمة المرور يجب أن لا تقل عن 4 أحرف."), // ⬅️ تغيير من 8 إلى 4
  confirmPassword: z.string(),
  
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "يجب الموافقة على الشروط والأحكام.",
  }),
})
.refine(data => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين.",
  path: ["confirmPassword"],
})
.refine(data => {
  if (data.storeType === 'physical') {
    return !!data.physicalAddress?.trim();
  }
  return true;
}, {
  message: "تفاصيل العنوان مطلوبة للمحل الفعلي.",
  path: ["physicalAddress"],
});

type SellerFormValues = z.infer<typeof sellerSchema>;

export function MerchantRegistrationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  registrationType 
}: SellerRegistrationModalProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { refreshProfile } = useAuth();

  // State Management
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storeImagePreview, setStoreImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
    { type: 'whatsapp', number: '', id: '1' }
  ]);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });
  const [categoriesCache, setCategoriesCache] = useState<Category[]>([]);

  // Disabled categories based on registration type
  const disabledCategoryIds = useMemo(() => 
    registrationType === 'products' ? [2] : 
    registrationType === 'services' ? [1] : [], 
  [registrationType]);

  // Form initialization
  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      businessName: "",
      category: null,
      description: "",
      storeType: "online",
      physicalAddress: "",
      country: "ye",
      city: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
    mode: "onChange", // Real-time validation
  });




  const fetchSubCategories = useCallback(async (parentId: number | null): Promise<Category[]> => {
    // Return from cache if available
    if (categoriesCache.length > 0) {
      return categoriesCache.filter(c => c.parent_id === parentId);
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon_name, parent_id')
        .order('name');

      if (error) {
        console.error("خطأ في جلب الفئات:", error);
        toast.error("فشل في تحميل الأقسام.");
        return [];
      }

      if (data) {
        setCategoriesCache(data); // Cache the results
        return data.filter(c => c.parent_id === parentId);
      }
      
      return [];
    } catch (error) {
      console.error("استثناء في جلب الفئات:", error);
      return [];
    }
  }, [supabase, categoriesCache]);

  // Get selected country
  const getSelectedCountry = useCallback(() => 
    ARAB_COUNTRIES.find(c => c.code === form.watch('country')) || ARAB_COUNTRIES[0],
  [form]);

  // Enhanced image upload with validation
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFile: (file: File | null) => void, 
    setPreview: (url: string | null) => void,
    type: 'logo' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File type validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم", {
        description: `الأنواع المدعومة: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}`
      });
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      toast.error("حجم الملف كبير جداً", {
        description: `الحد الأقصى: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
      return;
    }

    setFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Cleanup URL on component unmount
    return () => URL.revokeObjectURL(previewUrl);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleImageUpload(e, setLogoFile, setLogoPreview, 'logo');

  const handleStoreImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleImageUpload(e, setStoreImageFile, setStoreImagePreview, 'cover');

  // Phone number management
  const addPhoneNumber = () => {
    setPhoneNumbers(prev => [
      ...prev, 
      { type: 'mobile', number: '', id: Date.now().toString() }
    ]);
  };

  const removePhoneNumber = (id: string) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(prev => prev.filter(p => p.id !== id));
    }
  };

  const handlePhoneNumberChange = (id: string, value: string) => {
    setPhoneNumbers(prev => prev.map(p => 
      p.id === id ? { ...p, number: value } : p
    ));
    if (phoneError) setPhoneError(null);
  };

  const handlePhoneTypeChange = (id: string, type: 'whatsapp' | 'mobile' | 'landline') => {
    setPhoneNumbers(prev => prev.map(p => 
      p.id === id ? { ...p, type } : p
    ));
  };

  // Secure image compression with error handling
  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.7,
      };

      return await imageCompression(file, options);
    } catch (error) {
      console.error("فشل ض��ط الصورة:", error);
      throw new Error("تعذر معالجة الصورة. حاول باستخدام صورة أخرى.");
    }
  };

  // Enhanced submit handler with better error handling
  const onSubmit = async (values: SellerFormValues) => {
    // Phone validation
    if (phoneNumbers.every(p => !p.number.trim())) {
      setPhoneError("يجب إدخال رقم هاتف واحد على الأقل.");
      toast.error("بيانات ناقصة", { 
        description: "يرجى إدخال رقم هاتف للتواصل." 
      });
      return;
    }

    setPhoneError(null);
    setIsLoading(true);

    try {
      // 1. إنشاء الحساب — إذا كان البريد مسجلاً مسبقاً نحاول الدخول بدلاً من الإنشاء
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            business_name: values.businessName,
            user_type: 'seller'
          }
        }
      });

      if (authError?.code === 'user_already_exists' ||
          authError?.message?.toLowerCase().includes('already registered') ||
          authError?.message?.toLowerCase().includes('already been registered')) {
        // البريد موجود → نحاول تسجيل الدخول بنفس البيانات
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (signInError) {
          // كلمة المرور خاطئة — لا نستطيع الدخول
          toast.error("البريد الإلكتروني مسجل مسبقاً", {
            description: "كلمة المرور غير صحيحة. إذا كنت مسجلاً مسبقاً جرّب تسجيل الدخول أولاً.",
            duration: 8000,
          });
          return;
        }

        // تحقق إذا كان مسجلاً بالفعل كتاجر
        const { data: existingSeller } = await supabase
          .from('sellers')
          .select('id')
          .eq('id', signInData.user!.id)
          .maybeSingle();

        if (existingSeller) {
          toast.error("أنت مسجل بالفعل كتاجر", {
            description: "هذا البريد مرتبط بحساب تاجر موجود. يمكنك تسجيل الدخول مباشرة.",
            duration: 8000,
          });
          return;
        }

        // الحساب موجود لكن بدون ملف تاجر → نكمل الإنشاء بـ userId الموجود
        authData = signInData;
        authError = null;
      }

      if (authError) throw authError;
      if (!authData?.user) throw new Error("فشل إنشاء حساب المستخدم.");

      const userId = authData.user.id;

      // 2. تحويل الصور إلى base64 لإرسالها إلى الـ API الخادمي
      // الـ API يرفعها بصلاحية service role فيتجاوز RLS كلياً — لا يعتمد على جلسة المتصفح
      const toBase64 = (file: File): Promise<string> =>
        new Promise((res, rej) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.onerror = rej;
        });

      let logoBase64: string | null = null;
      let logoExt: string | null = null;
      let storeImageBase64: string | null = null;
      let storeImageExt: string | null = null;

      if (logoFile) {
        toast.info("جاري تحضير الشعار...");
        try {
          const compressed = await compressImage(logoFile);
          logoBase64 = await toBase64(compressed);
          logoExt = logoFile.name.split('.').pop() || 'jpg';
        } catch (err) {
          console.warn("تحذير: خطأ في تحضير الشعار:", err);
        }
      }

      if (storeImageFile) {
        toast.info("جاري تحضير صورة الغلاف...");
        try {
          const compressed = await compressImage(storeImageFile);
          storeImageBase64 = await toBase64(compressed);
          storeImageExt = storeImageFile.name.split('.').pop() || 'jpg';
        } catch (err) {
          console.warn("تحذير: خطأ في تحضير صورة الغلاف:", err);
        }
      }

      // 4. Format phone numbers
      const selectedCountryCode = getSelectedCountry().phoneCode;
      const formattedPhoneNumbers = phoneNumbers
        .filter(p => p.number.trim())
        .map(p => ({
          ...p,
          number: `${selectedCountryCode}${p.number.replace(/\D/g, '')}`
        }));

      // 5. Get category ID
      const categoryId = typeof values.category === 'object' && values.category !== null 
        ? values.category.id 
        : null;

      // 6. Prepare seller data
      const sellerData = {
        id: userId,
        auth_user_id: userId,
        business_name: values.businessName,
        email: values.email,
        category_id: categoryId,
        country: values.country,
        city: values.city,
        phone_numbers: formattedPhoneNumbers,
        store_type: values.storeType,
        physical_address: values.storeType === 'physical' ? values.physicalAddress : null,
        provider_type: registrationType === 'products' ? '{PRODUCT_SELLER}' : '{SERVICE_SELLER}',
        is_setup_complete: true,
        created_at: new Date().toISOString(),
      };

      // 7. إدراج سجل التاجر ورفع الصور عبر مسار خادمي بصلاحية service role
      const response = await fetch('/api/sellers/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sellerData, logoBase64, logoExt, storeImageBase64, storeImageExt }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          toast.error("البريد الإلكتروني مستخدم", {
            description: "هذا البريد مسجل بالفعل. حاول تسجيل الدخول أو استخدم بريداً مختلفاً.",
            duration: 10000,
          });
          return;
        }
        throw new Error(result.message || "فشل إنشاء سجل التاجر.");
      }

      // 8. تحديث AuthContext ليتحوّل الزر فوراً إلى اسم وأيقونة التاجر
      // في الصفحة الرئيسية، ثم نغلق المودال فقط — المستخدم يبقى في الصفحة
      // الرئيسية ويضغط على زر التاجر متى شاء للدخول للوحة التحكم.
      await refreshProfile(authData.user);

      toast.success("تم إنشاء صفحتك التجارية!", {
        description: "اضغط على اسم متجرك في الأعلى للدخول إلى لوحة التحكم.",
        duration: 5000,
      });

      onClose();
      onSuccess();

    } catch (error: any) {
      console.error("خطأ في التسجيل:", error);

      let errorMessage = "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.";
      
      if (error.message.includes("auth/email-already-in-use")) {
        errorMessage = "البريد الإلكتروني مستخدم مسبقاً.";
      } else if (error.message.includes("auth/weak-password")) {
        errorMessage = "كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل.";
      } else if (error.message.includes("storage/")) {
        errorMessage = "حدث خطأ في رفع الملفات. تأكد من صحة الملفات وحجمها.";
      }

      toast.error("خطأ في التسجيل", {
        description: errorMessage,
        duration: 8000,
      });

    } finally {
      setIsLoading(false);
    }
  };

  // Password strength color


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              انضمام كتاجر جديد
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              رحلة نجاحك تبدأ من هنا. املأ البيانات لإنشاء متجرك.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* هوية المتجر */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-800 border-b pb-3">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">هوية المتجر</h3>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Logo Upload */}
                  <div className="flex flex-col items-center">
                    <Label className="mb-3 font-medium">شعار المتجر (اختياري)</Label>
                    <div className="w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden relative group hover:border-primary transition-colors">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="شعار المتجر" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="text-sm">اضف شعاراً</span>
                        </div>
                      )}
                      <label 
                        htmlFor="logo-upload" 
                        className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        تغيير
                      </label>
                      <input 
                        id="logo-upload" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">الحجم الموصى به: 500×500 بكسل</p>
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 w-full space-y-5">
                    <FormField control={form.control} name="businessName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          اسم المتجر / النشاط التجاري
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="مثال: متجر الأمل للإلكترونيات" 
                            {...field} 
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          النشاط التجاري
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full justify-between text-right h-11 border-gray-300 hover:border-primary"
                            onClick={() => setIsCategoryPickerOpen(true)}
                          >
                            {field.value ? (
                              <span className="text-primary font-medium">
                                {typeof field.value === 'object' && field.value !== null 
                                  ? field.value.name 
                                  : field.value}
                              </span>
                            ) : (
                              <span className="text-gray-500">اختر نشاطك التجاري...</span>
                            )}
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </Button>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Description */}
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف المتجر (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="نبذة عن متجرك والمنتجات التي تقدمها..." 
                        {...field} 
                        className="min-h-[100px] resize-none"
                        maxLength={500}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormMessage />
                      <span className="text-xs text-gray-500">
                        {field.value?.length || 0}/500
                      </span>
                    </div>
                  </FormItem>
                )} />

                {/* Cover Image */}
                <div>
                  <Label className="flex items-center gap-2 font-medium mb-2">
                    <ImageIcon className="h-4 w-4 text-gray-600" />
                    صورة غلاف المتجر (اختياري)
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    هذه الصورة ستظهر كخلفية في صفحة متجرك وتفاصيل منتجاتك.
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-full sm:w-40 h-32 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-300 overflow-hidden">
                      {storeImagePreview ? (
                        <img 
                          src={storeImagePreview} 
                          alt="غلاف المتجر" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <ImageIcon className="w-10 h-10 mb-2" />
                          <span className="text-sm">اضف صورة</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => document.getElementById('store-image-upload')?.click()}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="w-4 h-4 ml-2" /> 
                        رفع صورة
                      </Button>
                      <p className="text-xs text-gray-500">
                        الحجم الموصى به: 1920×600 بكسل • الحد الأقصى: 10MB
                      </p>
                    </div>
                    <input 
                      id="store-image-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleStoreImageUpload} 
                      className="hidden" 
                    />
                  </div>
                </div>
              </div>

              {/* تفاصيل المتجر والموقع */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-800 border-b pb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">تفاصيل المتجر والموقع</h3>
                </div>

                {/* Store Type */}
                <FormField control={form.control} name="storeType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      نوع المتجر
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2"
                      >
                        <div>
                          <RadioGroupItem value="online" id="online" className="peer sr-only" />
                          <Label 
                            htmlFor="online" 
                            className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50"
                          >
                            <Globe className="mb-2 h-6 w-6" />
                            <span className="font-medium">عبر الإنترنت</span>
                            <span className="text-sm text-gray-500 mt-1">متجر إلكتروني</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="physical" id="physical" className="peer sr-only" />
                          <Label 
                            htmlFor="physical" 
                            className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50"
                          >
                            <Store className="mb-2 h-6 w-6" />
                            <span className="font-medium">محل فعلي</span>
                            <span className="text-sm text-gray-500 mt-1">متجر على الأرض</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Physical Address (Conditional) */}
                {form.watch('storeType') === 'physical' && (
                  <div className="space-y-4 border border-gray-200 p-4 rounded-lg bg-gray-50">
                    <FormField control={form.control} name="physicalAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          تفاصيل العنوان الفعلي
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="مثال: شارع التحرير، بجانب متجر الأمل، صنعاء" 
                            {...field} 
                            className="min-h-[80px]"
                            maxLength={200}
                          />
                        </FormControl>
                        <div className="flex justify-between items-center">
                          <FormMessage />
                          <span className="text-xs text-gray-500">
                            {field.value?.length || 0}/200
                          </span>
                        </div>
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        الدولة
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="اختر الدولة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {ARAB_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{country.flag}</span>
                                <div>
                                  <div className="font-medium">{country.name}</div>
                                  <div className="text-xs text-gray-500">+{country.phoneCode}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        المدينة
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="مثال: صنعاء" 
                          {...field} 
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Contact Information */}
                <div>
                  <Label className="flex items-center gap-1 font-medium mb-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    معلومات التواصل
                    <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    أضف رقمًا واحدًا على الأقل للتواصل.
                  </p>
                  
                  {phoneNumbers.map((phone) => (
                    <div key={phone.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                      <Select 
                        value={phone.type} 
                        onValueChange={(value: 'whatsapp' | 'mobile' | 'landline') => 
                          handlePhoneTypeChange(phone.id, value)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[140px] h-10">
                          <SelectValue placeholder="اختر النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp" className="flex items-center gap-2">
                            <span>واتساب</span>
                          </SelectItem>
                          <SelectItem value="mobile">جوال</SelectItem>
                          <SelectItem value="landline">هاتف ثابت</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex-1 relative w-full">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          +{getSelectedCountry().phoneCode}
                        </span>
                        <Input 
                          type="tel" 
                          value={phone.number}
                          onChange={(e) => handlePhoneNumberChange(phone.id, e.target.value)}
                          className="pr-16 h-10"
                          placeholder="أدخل الرقم هنا"
                        />
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removePhoneNumber(phone.id)}
                        disabled={phoneNumbers.length <= 1}
                        className="h-10 w-10 text-gray-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addPhoneNumber}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة رقم آخر
                  </Button>
                  
                  {phoneError && (
                    <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {phoneError}
                    </div>
                  )}
                </div>
              </div>

              {/* معلومات تسجيل الدخول */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-800 border-b pb-3">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">معلومات تسجيل الدخول</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="md:col-span-2">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          البريد الإلكتروني
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="example@email.com" 
                              {...field} 
                              className="h-11 pr-10"
                              type="email"
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Password with strength indicator */}
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        كلمة المرور
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="********" 
                            {...field} 
                            className="h-11 pr-10"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </FormControl>
                   
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Confirm Password */}
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        تأكيد كلمة المرور
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="********" 
                            {...field} 
                            className="h-11 pr-10"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="space-y-6 pt-4 border-t">
                <FormField control={form.control} name="agreeToTerms" render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-x-reverse">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="text-gray-800 cursor-pointer">
                        أوافق على{" "}
                        <a href="/terms" className="text-blue-600 hover:underline font-medium">
                          شروط الاستخدام
                        </a>{" "}
                        و{" "}
                        <a href="/privacy" className="text-blue-600 hover:underline font-medium">
                          سياسة الخصوصية
                        </a>
                      </FormLabel>
                      <p className="text-sm text-gray-600">
                        أقر بأن جميع المعلومات التي قدمتها صحيحة وأتحمل كامل المسؤولية عنها.
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                        جاري إنشاء الحساب...
                      </>
                    ) : (
                      "إنشاء حسابي كتاجر"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Category Picker Modal */}
      <CategoryPickerModal
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        fetchSubCategories={fetchSubCategories}
        initialParentId={null}
        stopAtLevel={2}
        disabledCategoryIds={disabledCategoryIds}
        onSelect={(selectedCategory) => {
          if (typeof selectedCategory !== 'string') {
            form.setValue("category", selectedCategory, { shouldValidate: true });
          }
          setIsCategoryPickerOpen(false);
        }}
      />
    </>
  );
}


