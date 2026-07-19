// المسار: components/BuyerStatus.tsx
// -- الإصدار النهائي: يضمن تحديث الصفحة بعد تسجيل الخروج --

"use client";

import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
// ▼▼▼ بداية التعديل 1: استيراد الأدوات الجديدة ▼▼▼
import { useSupabaseBrowser } from "@/hooks/use-supabase-browser"; // استيراد العميل الموثوق
import { useRouter } from "next/navigation"; // استيراد الراوتر لتحديث الصفحة
// ▲▲▲ نهاية التعديل 1 ▲▲▲
import { useToast } from "./ui/use-toast";

export function BuyerStatus({ buyer }: { buyer: any }) {
  // ▼▼▼ بداية التعديل 2: استخدام العميل الموثوق والراوتر ▼▼▼
  const supabase = useSupabaseBrowser();
  const router = useRouter();
  // ▲▲▲ نهاية التعديل 2 ▲▲▲
  const { toast } = useToast();

  if (!buyer) {
    return null;
  }

  // ▼▼▼ بداية التعديل 3: تحسين دالة تسجيل الخروج ▼▼▼
  const handleSignOut = async () => {
    if (!supabase) return; // حماية إضافية

    // الخطوة 1: تسجيل الخروج من Supabase
    await supabase.auth.signOut();

    // الخطوة 2: مسح الذاكرة المؤقتة للإعجابات (هذا السطر كان موجوداً لديك وهو صحيح)
    localStorage.removeItem('liked_products');
    
    toast({ title: "تم تسجيل الخروج بنجاح." });

    // الخطوة 3 (الأهم): إجبار الصفحة على التحديث لتعكس حالة "الزائر"
    router.refresh();
  };
  // ▲▲▲ نهاية التعديل 3 ▲▲▲

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 hidden md:flex"
        >
       <User className="h-4 w-4 ml-2" />
          
          {/* ▼▼▼ هذا هو التعديل الوحيد والمطلوب ▼▼▼ */}
          <span className="whitespace-nowrap">
            أهلاً بك <span className="font-bold">{buyer.full_name || 'زائر'}</span>، يمكنك الآن التفاعل مع المنتجات!
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
