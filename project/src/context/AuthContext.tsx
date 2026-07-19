// المسار: src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  sellerProfile: any | null;
  serviceProviderProfile: any | null;
  isSeller: boolean;
  isServiceProvider: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  userType: 'seller' | 'provider' | 'buyer' | null;
  /**
   * يُعيد تحميل ملف التاجر/مزود الخدمة.
   * مرّر المستخدم مباشرةً بعد signUp لتجنب انتظار الجلسة.
   * يأخذ الأولوية على أي onAuthStateChange سابق.
   */
  refreshProfile: (knownUser?: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // عميل Supabase مستقر — useMemo يمنع إعادة إنشائه عند كل render
  const supabase = useMemo(() => createSupabaseBrowserClient({
    global: {
      fetch: async (url, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        try {
          return await fetch(url, { ...options, signal: controller.signal });
        } finally {
          clearTimeout(timeoutId);
        }
      }
    }
  }), []);

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any | null>(null);
  const [serviceProviderProfile, setServiceProviderProfile] = useState<any | null>(null);

  /**
   * عداد التسلسل — يضمن أن الاستدعاء الأحدث فقط يُحدّث الحالة.
   * كل استدعاء يلتقط رقم seq قبل الجلب؛ إذا تغيّر العداد أثناء الانتظار
   * (بسبب استدعاء أحدث) يُهمَل هذا الاستدعاء ولا يكتب state.
   */
  const seqRef = useRef(0);

  // ─── جلب ملفات التاجر ومزود الخدمة ──────────────────────────────────────
  // seq: رقم التسلسل — يمنع الاستدعاءات القديمة من الكتابة فوق الحالة الجديدة
  const fetchProfiles = useCallback(async (currentUser: User | null, seq: number) => {
    if (!currentUser) {
      if (seqRef.current === seq) {
        setSellerProfile(null);
        setServiceProviderProfile(null);
      }
      return;
    }
    try {
      const [sellerRes, providerRes] = await Promise.all([
        supabase
          .from('sellers')
          .select('id, business_name, logo_url')
          .eq('id', currentUser.id)
          .maybeSingle(),
        supabase
          .from('service_providers')
          .select('id, business_name, logo_url')
          .eq('user_id', currentUser.id)
          .maybeSingle(),
      ]);
      // نسجّل أي خطأ حقيقي بدل ابتلاعه بصمت — خطأ هنا (شبكة/RLS) كان يؤدي سابقاً
      // إلى إظهار التاجر/مزود الخدمة كـ"مشتري" دون أي أثر يوضح السبب.
      if (sellerRes.error) console.warn('فشل جلب ملف التاجر (sellers):', sellerRes.error?.message || sellerRes.error);
      if (providerRes.error) console.warn('فشل جلب ملف مزود الخدمة (service_providers):', providerRes.error?.message || providerRes.error);
      // فقط نُحدّث الحالة إذا كان هذا الاستدعاء لا يزال الأحدث
      if (seqRef.current === seq) {
        // عند نجاح الاستعلام (بلا خطأ) نعتمد نتيجته كاملة (بما فيها null الحقيقي).
        // عند فشله (خطأ شبكة/RLS مؤقت) نُبقي القيمة السابقة بدل مسحها، لتفادي
        // "وميض" ظهور تاجر/مزود خدمة حقيقي كمشترٍ بسبب عطل عابر في الاتصال.
        if (!sellerRes.error) setSellerProfile(sellerRes.data ?? null);
        if (!providerRes.error) setServiceProviderProfile(providerRes.data ?? null);
      }
    } catch (err: any) {
      console.warn('فشل غير متوقع أثناء جلب ملفات التاجر/مزود الخدمة:', err?.message || err);
      // خطأ غير متوقع (وليس رفض صريح من الاستعلام) — نُبقي الحالة الحالية كما هي
      // بدل اعتبار المستخدم "مشترياً" بشكل خاطئ.
    }
  }, [supabase]);

  // ─── معالجة الجلسة الداخلية (onAuthStateChange / getSession) ─────────────
  // يستخدم seqRef لضمان أن الاستدعاء الأحدث يلغي الاستدعاءات السابقة.
  const processSession = useCallback(async (currentUser: User | null, seq: number) => {
    setIsLoading(true);
    setUser(currentUser);
    await fetchProfiles(currentUser, seq);
    if (seqRef.current === seq) {
      setIsLoading(false);
    }
  }, [fetchProfiles]);

  // ─── refreshProfile: تُستدعى من نماذج التسجيل بعد إدراج سجل التاجر ───────
  const refreshProfile = useCallback(async (knownUser?: User) => {
    const seq = ++seqRef.current;
    setIsLoading(true);
    try {
      let targetUser = knownUser;
      if (!targetUser) {
        const { data: { session } } = await supabase.auth.getSession();
        targetUser = session?.user ?? undefined;
      }
      if (targetUser) {
        setUser(targetUser);
        await fetchProfiles(targetUser, seq);
      }
    } finally {
      if (seqRef.current === seq) setIsLoading(false);
    }
  }, [supabase, fetchProfiles]);

  // ─── تهيئة المصادقة ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const handle = (currentUser: User | null) => {
      if (!mounted) return;
      const seq = ++seqRef.current;
      processSession(currentUser, seq);
    };

    // ── مرحلة 1: getSession (فورية، من localStorage) ──────────────────────────
    // نعرض الواجهة فوراً بناءً على الجلسة المخزّنة دون انتظار الشبكة.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      handle(session?.user ?? null);
    });

    // ── مرحلة 2: getUser (تحقق حقيقي في الخلفية) ────────────────────────────
    // بعد عرض الواجهة، نتحقق من صحة التوكن مع الخادم بصمت.
    // إذا كان التوكن منتهياً أو مزوّراً يُصحَّح الوضع تلقائياً دون وميض.
    supabase.auth.getUser()
      .then(({ data: { user: verifiedUser }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('فشل التحقق من المستخدم (getUser):', error.message);
        }
        // نُصحّح الحالة فقط إذا اختلف المستخدم المُتحقَّق منه عن الحالي
        handle(verifiedUser ?? null);
      })
      .catch((err: any) => {
        console.warn('خطأ غير متوقع أثناء التحقق من المستخدم:', err?.message || err);
        if (mounted) setIsLoading(false);
      });

    // الاستماع لتغيّرات المصادقة لاحقاً (تسجيل دخول/خروج)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handle(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, processSession]);

  // ─── قيم مشتقة ───────────────────────────────────────────────────────────
  const isSeller = !!sellerProfile;
  const isServiceProvider = !!serviceProviderProfile;

  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let userType: 'seller' | 'provider' | 'buyer' | null = null;

  if (isSeller && sellerProfile) {
    displayName = sellerProfile.business_name;
    avatarUrl = sellerProfile.logo_url;
    userType = 'seller';
  } else if (isServiceProvider && serviceProviderProfile) {
    displayName = serviceProviderProfile.business_name;
    avatarUrl = serviceProviderProfile.logo_url;
    userType = 'provider';
  } else if (user) {
    // استخدام الاسم الكامل المدخل عند التسجيل إن وُجد، وإلا جزء الإيميل قبل @
    displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'مستخدم';
    avatarUrl = null;
    userType = 'buyer';
  }

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    sellerProfile,
    serviceProviderProfile,
    isSeller,
    isServiceProvider,
    displayName,
    avatarUrl,
    userType,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
