// المسار: features/service/management/components/ProviderRegistrationModal.tsx
"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Upload, Phone, Loader2, Plus, X, Eye, EyeOff, User, Info, MapPin, Mail, ChevronDown, Image as ImageIcon, Clock, Award } from "lucide-react";
import { CategoryPickerModal } from "@/components/category-picker-modal";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
interface ServiceRegistrationModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; }
interface Country { code: string; name: string; phoneCode: string; flag: string; }
interface PhoneNumber { type: 'whatsapp' | 'mobile' | 'landline'; number: string; id: string; }
interface Category { id: number; name: string; icon_name: string | null; parent_id?: number | null; }
interface ServiceProviderFormValues {
  professionalName: string;
  category: any;
  specialization?: string;
  bio?: string;
  qualifications?: string;
  certifications?: string;
  yearsOfExperience?: string;
  availability?: string;
  workingDays?: string[];
  emergencyService: boolean;
  storeType: 'online' | 'physical';
  physicalAddress?: string;
  country: string;
  city: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}
const ARAB_COUNTRIES: Country[] = [
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
];
const YEARS_OF_EXPERIENCE = ["أقل من سنة", "1-3 سنوات", "3-5 سنوات", "5-10 سنوات", "أكثر من 10 سنوات"];
const AVAILABILITY_TIMES = ["صباحي (8 ص - 2 م)", "مسائي (2 م - 10 م)", "كامل الوقت (8 ص - 10 م)", "مرن حسب الطلب", "24/7"];
const WORKING_DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const serviceProviderSchema = z.object({
  professionalName: z.string().min(3, "الاسم المهني مطلوب."),
  category: z.any(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  qualifications: z.string().optional(),
  certifications: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  availability: z.string().optional(),
  workingDays: z.array(z.string()).optional(),
  emergencyService: z.boolean().default(false),
  storeType: z.enum(['online', 'physical']),
  physicalAddress: z.string().optional(),
  country: z.string().min(1, "الدولة مطلوبة."),
  city: z.string().min(2, "المدينة مطلوبة."),
  email: z.string().email("صيغة البريد الإلكتروني غير صحيحة."),
  password: z.string().min(6, "كلمة المرور يجب أن لا تقل عن 6 أحرف."),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "يجب الموافقة على الشروط." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين.",
  path: ["confirmPassword"],
}).refine(data => {
  if (data.category === null) return true;
  if (typeof data.category === 'object') return !!data.category?.id;
  return !!data.category;
}, {
  message: "يجب اختيار النشاط التجاري.",
  path: ["category"],
}).refine(data => {
  if (data.storeType === 'physical' && !data.physicalAddress?.trim()) return false;
  return true;
}, {
  message: "العنوان الفعلي مطلوب إذا كان لديك مقر فعلي.",
  path: ["physicalAddress"],
});
export function ProviderRegistrationModal({ isOpen, onClose, onSuccess }: ServiceRegistrationModalProps) {
  const supabase = createSupabaseBrowserClient();
  const { refreshProfile } = useAuth();
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isQualificationsOpen, setIsQualificationsOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([{ type: 'whatsapp', number: '', id: '1' }]);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const form = useForm<ServiceProviderFormValues>({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: {
      professionalName: "", 
      category: undefined, 
      specialization: "", 
      bio: "",
      qualifications: "", 
      certifications: "", 
      yearsOfExperience: "",
      availability: "", 
      workingDays: [], 
      emergencyService: false,
      storeType: 'online',
      physicalAddress: "",
      country: "ye", 
      city: "", 
      email: "", 
      password: "",
      confirmPassword: "", 
      agreeToTerms: false,
    },
  });
  const fetchSubCategories = useCallback(async (parentId: number | null): Promise<Category[]> => {
    if (allCategories.length > 0) {
      if (parentId === null) return allCategories.filter(c => c.parent_id === null);
      return allCategories.filter(c => c.parent_id === parentId);
    }
    const { data, error } = await supabase.from('categories').select('id, name, icon_name, parent_id');
    if (error) {
      console.error("Error fetching categories:", error);
      toast.error("فشل في تحميل الأقسام.");
      return [];
    }
    if (data) {
      setAllCategories(data);
      if (parentId === null) return data.filter(c => c.parent_id === null);
      return data.filter(c => c.parent_id === parentId);
    }
    return [];
  }, [supabase, allCategories]);
  const getSelectedCountry = useCallback(() => {
    const countryCode = form.watch('country');
    return ARAB_COUNTRIES.find(c => c.code === countryCode) || ARAB_COUNTRIES[0];
  }, [form]);
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      setProfileImageFile(file); 
      setProfileImagePreview(URL.createObjectURL(file)); 
    } 
  };
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
      setCoverImageFile(file); 
      setCoverImagePreview(URL.createObjectURL(file)); 
    } 
  };
  const addPhoneNumber = () => setPhoneNumbers(prev => [...prev, { type: 'mobile', number: '', id: Date.now().toString() }]);
  const removePhoneNumber = (id: string) => { 
    if (phoneNumbers.length > 1) setPhoneNumbers(prev => prev.filter(p => p.id !== id)); 
  };
  const handlePhoneNumberChange = (id: string, value: string) => { 
    setPhoneNumbers(prev => prev.map(p => p.id === id ? { ...p, number: value } : p)); 
    if (phoneError) setPhoneError(null); 
  };
  const handlePhoneTypeChange = (id: string, type: 'whatsapp' | 'mobile' | 'landline') => 
    setPhoneNumbers(prev => prev.map(p => p.id === id ? { ...p, type } : p));
  const handleClose = () => {
    form.reset();
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setIsLoading(false);
    setIsCategoryPickerOpen(false);
    setIsQualificationsOpen(false);
    setIsAvailabilityOpen(false);
    setPhoneNumbers([{ type: 'whatsapp', number: '', id: '1' }]);
    setPhoneError(null);
    onClose();
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      return await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.7,
      });
    } catch {
      return file;
    }
  };

  const onSubmit = async (values: ServiceProviderFormValues) => {
    // التحقق من وجود رقم هاتف واحد على الأقل
    if (phoneNumbers.every(p => !p.number.trim())) {
      setPhoneError("يجب إدخال رقم هاتف واحد على الأقل.");
      toast.error("بيانات ناقصة", { description: "يرجى إدخال رقم هاتف للتواصل." });
      return;
    }
    setPhoneError(null);
    setIsLoading(true);

    try {
      // 1. إنشاء الحساب — إذا كان البريد مسجلاً مسبقاً نحاول الدخول بدلاً من الإنشاء
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { business_name: values.professionalName, user_type: 'service_provider' } },
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
          toast.error("البريد الإلكتروني مسجل مسبقاً", {
            description: "كلمة المرور غير صحيحة. إذا كنت مسجلاً مسبقاً جرّب تسجيل الدخول أولاً.",
            duration: 8000,
          });
          return;
        }

        // تحقق إذا كان مسجلاً بالفعل كمزود خدمة
        const { data: existingProvider } = await supabase
          .from('service_providers')
          .select('id')
          .eq('user_id', signInData.user!.id)
          .maybeSingle();

        if (existingProvider) {
          toast.error("أنت مسجل بالفعل كمزود خدمة", {
            description: "هذا البريد مرتبط بحساب مزود خدمة موجود. يمكنك تسجيل الدخول مباشرة.",
            duration: 8000,
          });
          return;
        }

        // الحساب موجود لكن بدون ملف مزود → نكمل الإنشاء بـ userId الموجود
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

      if (profileImageFile) {
        toast.info("جاري تحضير الشعار...");
        try {
          const compressed = await compressImage(profileImageFile);
          logoBase64 = await toBase64(compressed);
          logoExt = profileImageFile.name.split('.').pop() || 'jpg';
        } catch (err) {
          console.warn("تحذير: خطأ في تحضير الشعار:", err);
        }
      }

      if (coverImageFile) {
        toast.info("جاري تحضير صورة الغلاف...");
        try {
          const compressed = await compressImage(coverImageFile);
          storeImageBase64 = await toBase64(compressed);
          storeImageExt = coverImageFile.name.split('.').pop() || 'jpg';
        } catch (err) {
          console.warn("تحذير: خطأ في تحضير صورة الغلاف:", err);
        }
      }

      // 3. تنسيق البيانات
      const selectedCountryCode = getSelectedCountry().phoneCode;
      const formattedPhoneNumbers = phoneNumbers
        .filter(p => p.number.trim())
        .map(p => ({ ...p, number: `${selectedCountryCode}${p.number.replace(/\D/g, '')}` }));

      const categoryId = (values.category && typeof values.category === 'object' && 'id' in values.category)
        ? values.category.id
        : null;

      const serviceProviderData = {
        business_name: values.professionalName,
        country: values.country,
        city: values.city,
        phone_numbers: formattedPhoneNumbers,
        category_id: categoryId,
        provider_type: ['SERVICE_PROVIDER'],
        is_setup_complete: true,
        specialization: values.specialization || null,
        qualifications: values.qualifications || null,
        certifications: values.certifications || null,
        years_of_experience: values.yearsOfExperience || null,
        availability: values.availability || null,
        working_days: values.workingDays && values.workingDays.length > 0 ? values.workingDays : null,
        emergency_service: values.emergencyService,
        store_type: values.storeType,
        physical_address: values.storeType === 'physical' ? values.physicalAddress || null : null,
        description: values.bio || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 4. إنشاء السجل عبر الخادم (service role — نفس نمط التاجر)
      const response = await fetch('/api/service-providers/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, providerData: serviceProviderData, logoBase64, logoExt, storeImageBase64, storeImageExt }),
      });
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("البريد الإلكتروني مستخدم", {
            description: "هذا البريد مسجل بالفعل كمقدم خدمة. حاول تسجيل الدخول أو استخدم بريداً مختلفاً.",
            duration: 10000,
          });
          return;
        }
        throw new Error(result.message || "فشل إنشاء سجل مزود الخدمة.");
      }

      // 5. تحديث AuthContext ليتحوّل الزر فوراً إلى اسم وأيقونة مزود الخدمة
      // في الصفحة الرئيسية — المستخدم يبقى فيها ويضغط على الزر متى شاء.
      await refreshProfile(authData.user);

      toast.success("تم إنشاء صفحتك المهنية! 🎉", {
        description: "اضغط على اسمك في الأعلى للدخول إلى لوحة التحكم.",
        duration: 5000,
      });
      onClose();
      onSuccess();

    } catch (error: any) {
      console.error("خطأ في تسجيل مزود الخدمة:", error);
      toast.error("فشل التسجيل", {
        description: error.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const countryOptions = useMemo(() => 
    ARAB_COUNTRIES.map((c) => (
      <SelectItem key={c.code} value={c.code}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{c.flag}</span>
          <span>{c.name}</span>
        </div>
      </SelectItem>
    )), []);
  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        >
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-2xl font-bold">انضمام كمقدم خدمة</DialogTitle>
            <DialogDescription>رحلة خبرتك تبدأ من هنا. املأ البيانات لعرض خدماتك.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form id="provider-registration-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                  <Info className="h-5 w-5 text-primary" /> الهوية المهنية
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex flex-col items-center">
                    <Label className="mb-2">صورتك الشخصية (اختياري)</Label>
                    <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed overflow-hidden relative group">
                      {profileImagePreview ? <img src={profileImagePreview} alt="الصورة" className="w-full h-full object-cover" /> : <Upload className="w-10 h-10 text-gray-400" />}
                      <label htmlFor="profile-image-upload" className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">تغيير</label>
                      <input id="profile-image-upload" type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <FormField control={form.control} name="professionalName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم المهني <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: مركز التميز للاستشارات" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>النشاط التجاري <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Button type="button" variant="outline" className="w-full justify-between text-right h-10" onClick={() => setIsCategoryPickerOpen(true)}>
                            {field.value?.name ? (
                              <span className="text-primary font-medium">{field.value.name}</span>
                            ) : (
                              <span className="text-muted-foreground">اختر النشاط...</span>
                            )}
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="specialization" render={({ field }) => (
                      <FormItem>
                        <FormLabel>التخصص الدقيق (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: تصميم واجهات المستخدم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>نبذة تعريفية (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="نبذة عن خبراتك..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div>
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-600" /> صورة الغلاف (اختياري)
                  </Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-32 h-20 rounded-md bg-gray-100 flex items-center justify-center border overflow-hidden">
                      {coverImagePreview ? <img src={coverImagePreview} alt="الغلاف" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-400" />}
                    </div>
                    <Button type="button" variant="outline" onClick={() => document.getElementById('cover-image-upload')?.click()}>
                      <Upload className="w-4 h-4 ml-2" /> رفع صورة
                    </Button>
                    <input id="cover-image-upload" type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Button type="button" variant="outline" className="w-full justify-between text-lg font-semibold py-6" onClick={() => setIsQualificationsOpen(!isQualificationsOpen)}>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> المؤهلات والخبرات
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isQualificationsOpen ? 'rotate-180' : ''}`} />
                </Button>
                {isQualificationsOpen && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <FormField control={form.control} name="qualifications" render={({ field }) => (
                      <FormItem>
                        <FormLabel>المؤهلات العلمية</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: بكالوريوس حاسوب" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="certifications" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الشهادات المهنية</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: شهادة AWS" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="yearsOfExperience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>سنوات الخبرة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر سنوات الخبرة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {YEARS_OF_EXPERIENCE.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <Button type="button" variant="outline" className="w-full justify-between text-lg font-semibold py-6" onClick={() => setIsAvailabilityOpen(!isAvailabilityOpen)}>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> التوفر والجدولة
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isAvailabilityOpen ? 'rotate-180' : ''}`} />
                </Button>
                {isAvailabilityOpen && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <FormField control={form.control} name="availability" render={({ field }) => (
                      <FormItem>
                        <FormLabel>وقت العمل</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر وقت العمل" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AVAILABILITY_TIMES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="emergencyService" render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-x-reverse rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="grid gap-1.5 leading-none">
                          <FormLabel>خدمة طوارئ</FormLabel>
                          <p className="text-sm text-muted-foreground">تقديم خدمة خارج أوقات العمل</p>
                        </div>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="workingDays" render={({ field }) => (
                      <FormItem>
                        <FormLabel>أيام العمل</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {WORKING_DAYS.map((day) => (
                            <div key={day} className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox 
                                id={`d-${day}`} 
                                checked={field.value?.includes(day)} 
                                onCheckedChange={(checked) => { 
                                  const newDays = checked 
                                    ? [...(field.value || []), day] 
                                    : field.value?.filter((v) => v !== day); 
                                  field.onChange(newDays); 
                                }} 
                              />
                              <Label htmlFor={`d-${day}`} className="text-sm font-normal cursor-pointer">
                                {day}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                  <MapPin className="h-5 w-5 text-primary" /> الموقع والتواصل
                </h3>
                <FormField control={form.control} name="storeType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع النشاط <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع النشاط" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">عبر الإنترنت فقط</SelectItem>
                        <SelectItem value="physical">لدي مقر فعلي</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                {form.watch('storeType') === 'physical' && (
                  <FormField control={form.control} name="physicalAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان الفعلي <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="اكتب العنوان الكامل للمقر..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدولة <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الدولة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countryOptions}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: صنعاء" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div>
                  <Label>أرقام الهاتف <span className="text-red-500">*</span></Label>
                  {phoneNumbers.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 mt-2">
                      <Select value={p.type} onValueChange={(v: 'whatsapp' | 'mobile' | 'landline') => handlePhoneTypeChange(p.id, v)}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="النوع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">واتساب</SelectItem>
                          <SelectItem value="mobile">جوال</SelectItem>
                          <SelectItem value="landline">ثابت</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dir-ltr">
                          +{getSelectedCountry().phoneCode}
                        </span>
                        <Input 
                          type="tel" 
                          value={p.number} 
                          onChange={(e) => handlePhoneNumberChange(p.id, e.target.value)} 
                          className="pl-16" 
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removePhoneNumber(p.id)} 
                        disabled={phoneNumbers.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addPhoneNumber} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />إضافة رقم
                  </Button>
                  {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
                </div>
              </div>
              {/* معلومات تسجيل الدخول — دائماً مطلوبة (مثل نظام التاجر) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 border-b pb-2">
                  <User className="h-5 w-5 text-primary" /> معلومات تسجيل الدخول
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="example@email.com" autoComplete="email" {...field} />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="********" 
                            {...field} 
                            autoComplete="new-password" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="********" 
                            {...field} 
                            autoComplete="new-password" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <Separator />
                <FormField control={form.control} name="agreeToTerms" render={({ field }) => (
                  <FormItem className="flex items-start space-x-2 space-x-reverse">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="grid gap-1.5 leading-none">
                      <FormLabel>
                        أوافق على <a href="/terms" className="text-blue-600 hover:underline">شروط الاستخدام</a> و <a href="/privacy" className="text-blue-600 hover:underline">سياسة الخصوصية</a>.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )} />
              </div>
            </form>
          </Form>
          <DialogFooter className="mt-8">
            <DialogClose asChild>
              <Button type="button" variant="secondary">إلغاء</Button>
            </DialogClose>
            <Button 
              type="submit"
              form="provider-registration-form"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                "إنشاء حسابي كمقدم خدمة"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CategoryPickerModal
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        fetchSubCategories={fetchSubCategories}
        initialParentId={null}
        stopAtLevel={2}
        disabledCategoryIds={[1]}
        onSelect={(selectedCategory) => {
          if (typeof selectedCategory !== 'string') {
            form.setValue('category', selectedCategory, { shouldValidate: true });
          }
          setIsCategoryPickerOpen(false);
        }}
      />
    </>
  );
}
export default ProviderRegistrationModal;
