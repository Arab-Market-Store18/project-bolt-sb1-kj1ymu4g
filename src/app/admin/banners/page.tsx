// المسار: app/admin/banners/page.tsx
// -- النسخة النهائية الكاملة والمعدلة --
import { createServerClient } from "@/lib/utils/supabase/server";
import { redirect } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { BannerActions } from "./BannerActions"; // <-- تأكد من أن هذا الملف موجود
// --- واجهات وأنواع البيانات ---
interface BannerRequest {
  id: string;
  created_at: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_duration_days: number;
  image_url: string;
  target_link: string | null;
  sellers: { 
    business_name: string;
    email: string;
  } | null;
}
// --- الدوال المساعدة ---
async function getUserAndRole(supabase: ReturnType<typeof createServerClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return { user, role: profile?.role || 'user' };
}
const getStatusBadgeVariant = (status: BannerRequest['status']) => {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected': return 'destructive';
    default: return 'secondary';
  }
};
// --- المكون الرئيسي للصفحة ---
export default async function AdminBannersPage() {
  const supabase = createServerClient();
  // 1. حماية الصفحة
  const { user, role } = await getUserAndRole(supabase);
  if (!user || role !== 'admin') {
    redirect('/');
  }
  // 2. جلب البيانات
  const { data: requests, error } = await supabase
    .from('banner_requests')
    .select(`
      id, created_at, title, status, requested_duration_days, image_url, target_link,
      sellers ( business_name, email )
    `)
    .order('created_at', { ascending: false });
  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">حدث خطأ في جلب البيانات: {error.message}</div>;
  }
  return (
    <div className="container mx-auto py-10">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">إدارة البانرات الإعلانية</h1>
        <p className="text-muted-foreground mt-1">مراجعة طلبات الإعلانات والموافقة عليها أو رفضها.</p>
      </header>
      <main className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">المعاينة</TableHead>
              <TableHead>التفاصيل</TableHead>
              <TableHead>صاحب الطلب</TableHead>
              <TableHead className="text-center">المدة</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((req) => (
                <TableRow key={req.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="relative h-16 w-28 rounded-md overflow-hidden border shadow-sm">
                      <Image 
                        src={req.image_url} 
                        alt={req.title} 
                        fill 
                        className="object-cover" 
                        sizes="150px" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{req.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      {req.target_link ? (
                        <Link href={req.target_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-500 hover:underline">
                          رابط مستهدف <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-gray-400">لا يوجد رابط</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{req.sellers?.business_name || "تاجر غير معروف"}</div>
                    <div className="text-sm text-muted-foreground">{req.sellers?.email}</div>
                  </TableCell>
                  <TableCell className="text-center">{req.requested_duration_days} أيام</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(req.status)} className="text-xs">
                      {req.status === 'pending' && <Clock className="ml-1 h-3 w-3" />}
                      {req.status === 'approved' && <CheckCircle className="ml-1 h-3 w-3" />}
                      {req.status === 'rejected' && <XCircle className="ml-1 h-3 w-3" />}
                      {{
                        'pending': 'قيد المراجعة',
                        'approved': 'موافق عليه',
                        'rejected': 'مرفوض'
                      }[req.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <BannerActions request={req} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  لا توجد طلبات إعلانية حالياً.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
