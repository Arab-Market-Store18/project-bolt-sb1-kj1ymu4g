// المسار: /app/seller/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { MerchantDashboard } from "@/features/merchant/management/components/MerchantDashboard";
import { type Category } from '@/lib/types';
import { useAuth } from '@/context/AuthContext'; // <-- إضافة useAuth

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
  followers_count?: number;
  total_likes_count?: number;
  rating?: number;
  provider_type?: string | string[];
}

export default function SellerDashboardPage() {
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createSupabaseBrowserClient();
  const { user, isLoading: authLoading } = useAuth(); // <-- استخدام useAuth

  useEffect(() => {
    // انتظر حتى ينتهي تحميل AuthContext
    if (authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // ✅ استخدام user من useAuth. إذا كان AuthContext لم يلتقط الجلسة بعد
        // (مثلاً مباشرة بعد إعادة تحميل الصفحة عقب التسجيل)، نتحقق مباشرة من
        // الجلسة عبر supabase.auth.getUser() قبل الحكم بأن المستخدم غير مسجل دخول.
        let effectiveUser = user;
        if (!effectiveUser) {
          const { data: { user: freshUser } } = await supabase.auth.getUser();
          if (!freshUser) {
            const { data: { session: fallbackSession } } = await supabase.auth.getSession();
            effectiveUser = fallbackSession?.user ?? null;
          } else {
            effectiveUser = freshUser;
          }
        }

        if (!effectiveUser) {
          setError('يجب تسجيل الدخول أولاً لعرض لوحة التحكم.');
          return;
        }

        // 2. جلب بيانات التاجر
        const { data: sellerResult, error: sellerError } = await supabase
          .from('sellers')
          .select('*')
          .eq('id', effectiveUser.id)
          .maybeSingle();

        if (sellerError) {
          setError('حدث خطأ أثناء جلب بيانات التاجر: ' + sellerError.message);
          return;
        }

        if (!sellerResult) {
          // لا يوجد سجل تاجر فعلاً لهذا المستخدم — الرسالة التحذيرية أدناه صحيحة هنا
          return;
        }

        // 3. جلب التصنيفات
        const { data: categoriesResult } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        setSellerData(sellerResult as SellerData);
        setCategories(categoriesResult || []);
        
      } catch (err: any) {
        setError(err.message || 'حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, supabase, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">❌ خطأ</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (!sellerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-yellow-600 mb-2">⚠️ تحذير</h2>
          <p className="text-gray-700 mb-4">ليس لديك ملف تاجر بعد.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            إنشاء ملف تاجر
          </button>
        </div>
      </div>
    );
  }

  return (
    <MerchantDashboard 
      sellerData={sellerData} 
      allCategories={categories} 
    />
  );
}