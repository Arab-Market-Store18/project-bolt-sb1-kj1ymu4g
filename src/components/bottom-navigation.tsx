// المسار: components/bottom-navigation.tsx
// -- نسخة نهائية: مع إصلاح خطأ الوصولية (Accessibility) --

"use client";

import React, { useState, useMemo } from "react";
import { Home, Search, ShoppingBag, Info, Mail, Phone, MapPin, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { SearchBar } from "./search-bar";
import { usePathname } from "next/navigation";

// استيراد محتوى الصفحات الثابتة
import PrivacyPolicyPage from "@/app/legal/privacy-policy/page";
import TermsOfServicePage from "@/app/legal/terms-of-service/page";
import ReturnPolicyPage from "@/app/legal/return-policy/page";
import FaqPage from "@/app/help/faq/page";

// ====================================================================================
// --- مكونات النوافذ المنبثقة (Modals) ---

// ▼▼▼ تعديل: إضافة DialogHeader و DialogTitle هنا ▼▼▼
const SearchModal = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>البحث في المنصة</DialogTitle>
      </DialogHeader>
      <SearchBar />
    </DialogContent>
  </Dialog>
);

// --- مكون نافذة عرض المحتوى (يبقى كما هو) ---
const ContentModal = ({ isOpen, onOpenChange, title, children }: { isOpen: boolean, onOpenChange: (open: boolean) => void, title: string, children: React.ReactNode }) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
      <DialogHeader className="p-6 pb-4 border-b">
        <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        <DialogClose asChild><Button variant="ghost" size="icon" className="absolute top-4 left-4"><X className="h-5 w-5" /></Button></DialogClose>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto">{children}</div>
    </DialogContent>
  </Dialog>
);

// --- مكون PlatformInfo الأساسي (يبقى كما هو) ---
const PlatformInfo = () => (
  <div className="space-y-6">
    <div>
      <h3 className="font-bold text-lg mb-2 text-right">عن سوق العرب</h3>
      <p className="text-sm text-gray-600 leading-relaxed text-right">
        سوق العرب هي بوابتك الرائدة لعالم التجارة الإلكترونية في الوطن العربي. مهمتنا هي تمكين التجار والمبدعين من الوصول إلى أوسع شريحة من العملاء، وتوفير تجربة تسوق فريدة وآمنة للمشترين.
      </p>
    </div>
    <div>
      <h3 className="font-bold text-lg mb-2 text-right">تواصل معنا</h3>
      <ul className="text-sm text-gray-700 space-y-2">
        <li className="flex items-center justify-end gap-3"><a href="mailto:shababda@gmail.com" className="hover:underline hover:text-blue-600">shababda@gmail.com</a><Mail className="h-4 w-4 text-gray-500" /></li>
        <li className="flex items-center justify-end gap-3"><a href="tel:+967774279104" className="hover:underline hover:text-blue-600" dir="ltr">+967 774 279 104</a><Phone className="h-4 w-4 text-gray-500" /></li>
        <li className="flex items-center justify-end gap-3"><span>صنعاء، اليمن</span><MapPin className="h-4 w-4 text-gray-500" /></li>
      </ul>
    </div>
  </div>
);

// --- مكون InfoModal (يبقى كما هو) ---
const InfoModal = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
  const [contentState, setContentState] = useState<{ isOpen: boolean; title: string; content: React.ReactNode | null }>({ isOpen: false, title: '', content: null });

  const handleShowContent = (title: string, content: React.ReactNode) => {
    setContentState({ isOpen: true, title, content });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">عن سوق العرب</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <PlatformInfo />
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg"><div className="text-2xl font-bold text-primary">10,000+</div><div className="text-sm text-muted-foreground">منتج وخدمة</div></div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg"><div className="text-2xl font-bold text-green-600">5,000+</div><div className="text-sm text-muted-foreground">تاجر ومعلن</div></div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg"><div className="text-2xl font-bold text-blue-600">50,000+</div><div className="text-sm text-muted-foreground">عميل راضي</div></div>
              <div className="text-center p-4 bg-orange-500/10 rounded-lg"><div className="text-2xl font-bold text-orange-600">24/7</div><div className="text-sm text-muted-foreground">دعم فني</div></div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-right">روابط مفيدة</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Button asChild variant="outline" size="sm" className="justify-start"><a href="tel:+967774279104">📞 اتصل بنا</a></Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => handleShowContent('الأسئلة الشائعة', <FaqPage />)}>❓ الأسئلة الشائعة</Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => handleShowContent('شروط الاستخدام', <TermsOfServicePage />)}>📋 الشروط والأحكام</Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => handleShowContent('سياسة الخصوصية', <PrivacyPolicyPage />)}>🔒 سياسة الخصوصية</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <ContentModal 
        isOpen={contentState.isOpen} 
        onOpenChange={(open) => setContentState(s => ({ ...s, isOpen: open }))}
        title={contentState.title}
      >
        {contentState.content}
      </ContentModal>
    </>
  );
};
// ====================================================================================

export function BottomNavigation() {
  const [modalState, setModalState] = useState({ search: false, info: false });
  const pathname = usePathname();
  const { isSeller, isServiceProvider, isLoading: authLoading } = useAuth();
  // نخفي السلة طالما لم تنته المصادقة أو كان المستخدم تاجراً/مزوداً
  const isMerchantOrProvider = authLoading || isSeller || isServiceProvider;

  // السلة مخصصة للمشترين فقط — لا تظهر للتجار ومزودي الخدمة
  const navItems = useMemo(() => {
    const baseItems = [
      { id: 'home', label: 'الرئيسية', icon: Home, href: '/', action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
      { id: 'search', label: 'البحث', icon: Search, href: '#search', action: () => setModalState(s => ({ ...s, search: true })) },
      { id: 'info', label: 'المنصة', icon: Info, href: '#info', action: () => setModalState(s => ({ ...s, info: true })) },
    ];
    if (!isMerchantOrProvider) {
      baseItems.splice(2, 0, { id: 'cart', label: 'السلة', icon: ShoppingBag, href: '/cart', action: () => {} });
    }
    return baseItems;
  }, [isMerchantOrProvider]);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href && item.href !== '#search' && item.href !== '#info';
            return (
              <Button key={item.id} variant="ghost" size="sm" className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${isActive ? 'text-primary' : ''}`} onClick={item.action}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <SearchModal isOpen={modalState.search} onOpenChange={(open) => setModalState(s => ({ ...s, search: open }))} />
      <InfoModal isOpen={modalState.info} onOpenChange={(open) => setModalState(s => ({ ...s, info: open }))} />
    </>
  );
}
