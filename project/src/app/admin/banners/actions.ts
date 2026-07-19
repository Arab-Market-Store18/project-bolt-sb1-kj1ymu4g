// المسار: app/admin/banners/actions.ts
// -- نسخة محدثة لتتوافق مع BannerActions وتضيف الإشعارات --
"use server";
import { createServerClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
// --- دالة التحقق من المشرف (تبقى كما هي) ---
async function verifyAdmin() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("المستخدم غير مسجل.");
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("غير مصرح لك بالقيام بهذا الإجراء.");
}
// --- دالة مساعدة لإنشاء إشعار ---
async function createNotification(supabase: ReturnType<typeof createServerClient>, userId: string, title: string, message: string, link: string) {
  // افترض أن لديك جدول 'notifications' بهذه الأعمدة
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    link,
  });
}
// --- دالة الموافقة المحدثة ---
export async function approveBanner(
  requestId: string, 
  sellerId: string, // <-- معلمة جديدة
  bannerTitle: string, // <-- معلمة جديدة
  durationDays: number
) {
  const supabase = createServerClient();
  try {
    await verifyAdmin();
    const approvalDate = new Date();
    const expiryDate = new Date(approvalDate);
    expiryDate.setDate(approvalDate.getDate() + durationDays);
    const { error: updateError } = await supabase.from('banner_requests').update({
      status: 'approved',
      approved_at: approvalDate.toISOString(),
      expires_at: expiryDate.toISOString(),
      is_paid: true, // افترض أن الموافقة تعني الدفع
    }).eq('id', requestId);
    if (updateError) throw updateError;
    // إنشاء إشعار للمستخدم
    await createNotification(
      supabase,
      sellerId,
      "تمت الموافقة على إعلانك!",
      `تهانينا! تمت الموافقة على إعلانك "${bannerTitle}" وهو الآن فعال.`,
      "/dashboard/my-ads" // رابط افتراضي لصفحة إعلانات التاجر
    );
    revalidatePath('/admin/banners');
    revalidatePath('/'); // إعادة التحقق من الصفحة الرئيسية لعرض البانر الجديد
    return { success: true, message: "تمت الموافقة على الإعلان وإرسال إشعار للتاجر." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
// --- دالة الرفض المحدثة ---
export async function rejectBanner(
  requestId: string, 
  sellerId: string, // <-- معلمة جديدة
  bannerTitle: string, // <-- معلمة جديدة
  reason: string = "لا يستوفي الشروط"
) {
  const supabase = createServerClient();
  try {
    await verifyAdmin();
    const { error: updateError } = await supabase.from('banner_requests').update({
      status: 'rejected',
      admin_notes: reason,
    }).eq('id', requestId);
    if (updateError) throw updateError;
    // إنشاء إشعار للمستخدم
    await createNotification(
      supabase,
      sellerId,
      "تم رفض طلب إعلانك",
      `نأسف لإبلاغك بأنه تم رفض طلب إعلانك "${bannerTitle}". السبب: ${reason}`,
      "/dashboard/my-ads" // رابط افتراضي
    );
    revalidatePath('/admin/banners');
    return { success: true, message: "تم رفض الإعلان وإرسال إشعار للتاجر." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
