// المسار: app/dashboard/page.tsx
// -- النسخة الكاملة والنهائية --

import { redirect } from 'next/navigation';
import { createRouteHandlerClient } from '@/lib/utils/supabase/server';
import { MerchantDashboard } from "@/features/merchant/management/components/MerchantDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { type Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// واجهة البيانات للتاجر
interface SellerData {
  id: string;
  business_name: string;
  email: string;
  logo_url?: string;
  description?: string;
  category_id?: any;
  country?: string;
  city?: string;
  store_type?: 'online' | 'physical';
  physical_address?: string;
  store_image_url?: string;
  phone_numbers?: any[];
  is_setup_complete?: boolean;
  total_likes_count?: number;
  followers_count?: number;
  provider_type?: string[] | null; // تم التأكيد أن النوع هو مصفوفة نصوص
  rating?: number;
}

export default async function DashboardPage() {
  const supabase = createRouteHandlerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const selectQuery = `id, business_name, logo_url, description, category_id, country, city, store_type, physical_address, store_image_url, phone_numbers, is_setup_complete, total_likes_count, followers_count, email, provider_type, rating`;
  const { data: sellerResult, error: sellerError } = await supabase
    .from('sellers')
    .select(selectQuery)
    .eq('id', user.id)
    .maybeSingle();

  if (sellerError && sellerError.code !== 'PGRST116') {
    return <ErrorState message={sellerError.message} />;
  }

  if (!sellerResult) {
    return <ErrorState message="لم يتم العثور على ملف تجاري مرتبط بحسابك. قد تحتاج إلى إكمال إعداد ملفك التجاري أولاً." />;
  }

  const sellerData: SellerData = sellerResult;

  // التحقق من الهوية بالطريقة الموحدة والصحيحة
  const isServiceProvider = Array.isArray(sellerData.provider_type) 
    && sellerData.provider_type.includes('SERVICE_PROVIDER');

  // إذا كان المستخدم مقدم خدمة، أعد توجيهه فوراً إلى لوحة التحكم الصحيحة
  if (isServiceProvider) {
    redirect('/service/dashboard');
  }

  // جلب الفئات (فقط إذا كان تاجراً)
  const { data: categoriesResult } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  
  const allCategories: Category[] = categoriesResult || [];

  // إذا كان تاجراً، اعرض لوحة التحكم الخاصة به
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow overflow-y-auto">
        <MerchantDashboard sellerData={sellerData} allCategories={allCategories} />
      </div>
    </div>
  );
}

// مكون عرض الخطأ (بدون تغيير)
function ErrorState({ message }: { message: string }) {
  return (
    <div className="container mx-auto mt-10 p-4">
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>خطأ في تحميل البيانات</AlertTitle>
        <AlertDescription>
          <p>لم نتمكن من تحميل لوحة التحكم الخاصة بك.</p>
          <p className="mt-2 text-xs font-mono">السبب: {message}</p>
        </AlertDescription>
      </Alert>
      <Button asChild className="mt-4">
        <Link href="/">العودة إلى الصفحة الرئيسية</Link>
      </Button>
    </div>
  );
}
