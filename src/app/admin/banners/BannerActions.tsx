// المسار: app/admin/banners/BannerActions.tsx
// -- نسخة معدلة لتمرير البيانات اللازمة للإشعارات --
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { approveBanner, rejectBanner } from "./actions";
interface BannerActionsProps {
  request: {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_duration_days: number;
    title: string; // <-- إضافة العنوان
    sellers: { id: string } | null; // <-- تعديل لجلب ID التاجر
  };
}
export function BannerActions({ request }: BannerActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  // التأكد من وجود التاجر قبل تفعيل الأزرار
  const sellerId = request.sellers?.id;
  if (!sellerId) {
    return <span className="text-xs text-red-500">خطأ: التاجر غير مرتبط بهذا الطلب.</span>;
  }
  const handleApprove = async () => {
    setIsLoading(true);
    toast.info("جاري الموافقة على الإعلان...");
    // ▼▼▼ تم تمرير البيانات الجديدة هنا ▼▼▼
    const result = await approveBanner(request.id, sellerId, request.title, request.requested_duration_days);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error("فشل الإجراء", { description: result.message });
    }
    setIsLoading(false);
  };
  const handleReject = async () => {
    const reason = prompt("اختياري: اذكر سبب الرفض للتاجر.");
    if (reason === null) return;
    setIsLoading(true);
    toast.info("جاري رفض الإعلان...");
    // ▼▼▼ تم تمرير البيانات الجديدة هنا ▼▼▼
    const result = await rejectBanner(request.id, sellerId, request.title, reason || undefined);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error("فشل الإجراء", { description: result.message });
    }
    setIsLoading(false);
  };
  if (request.status !== 'pending') {
    return <span className="text-sm text-muted-foreground">تم اتخاذ إجراء</span>;
  }
  return (
    <div className="flex gap-2 justify-end">
      {isLoading ? (
        <Button size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>
      ) : (
        <>
          <Button size="sm" variant="destructive" onClick={handleReject}>رفض</Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>موافقة</Button>
        </>
      )}
    </div>
  );
}
