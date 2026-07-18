"use client";

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import ServiceDashboard from '@/features/service/management/components/ServiceDashboard';
import { type Category } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface ServiceProviderData {
  id: string;
  user_id: string;
  business_name: string;
  email?: string;
  logo_url?: string;
  store_image_url?: string;
  description?: string;
  category_id?: any;
  country?: string;
  city?: string;
  phone_numbers?: any[];
  followers_count?: number;
  total_likes_count?: number;
  rating?: number;
  provider_type?: string | string[];
  [key: string]: any;
}

export default function ServiceDashboardPage() {
  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // انتظر حتى ينتهي تحميل AuthContext
    if (authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // تحقق من المستخدم — إذا لم يلتقط AuthContext الجلسة بعد نتحقق مباشرة
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

        // جلب بيانات مزود الخدمة
        const { data: providerResult, error: providerError } = await supabase
          .from('service_providers')
          .select('*')
          .eq('user_id', effectiveUser.id)
          .maybeSingle();

        if (providerError) {
          setError('حدث خطأ أثناء جلب بيانات مزود الخدمة: ' + providerError.message);
          return;
        }

        if (!providerResult) {
          setError('ليس لديك ملف مزود خدمة بعد.');
          return;
        }

        // جلب التصنيفات
        const { data: categoriesResult } = await supabase
          .from('categories')
          .select('id, name, icon_name, parent_id')
          .eq('is_approved', true);

        setProviderData(providerResult as ServiceProviderData);
        setCategories(categoriesResult || []);

      } catch (err: any) {
        setError(err.message || 'حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, supabase, authLoading]);

  // شاشة التحميل
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  // شاشة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-right">
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

  // لا يوجد بيانات مزود خدمة
  if (!providerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md text-right">
          <h2 className="text-xl font-bold text-yellow-600 mb-2">⚠️ تحذير</h2>
          <p className="text-gray-700 mb-4">ليس لديك ملف مزود خدمة بعد.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            إنشاء صفحة خدمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <ServiceDashboard
      sellerData={providerData}
      allCategories={categories}
    />
  );
}
