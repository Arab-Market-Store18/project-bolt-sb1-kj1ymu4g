// المسار: components/navbar.tsx
// -- النسخة المعدلة حسب الخطة فقط مع استخدام useAuth --

"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useInteractionStore } from '@/lib/use-interaction-store';
import { type Category } from '@/lib/types';
import { SearchBar as Searchbar } from './search-bar';
import { Logo } from './Logo';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { useAuth } from '@/context/AuthContext'; // <-- السطر المضاف فقط

import { 
  LayoutDashboard, ShoppingCart, User, Loader2, Heart, Users, 
  LogOut, Bell, Star, MessageSquare, Search, Info, Pin, PlusCircle 
} from "lucide-react";

import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import { 
  Sheet, SheetTrigger, SheetContent, SheetClose 
} from "@/components/ui/sheet";

import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";

import { PlatformInfo } from "./platform-info";
import { Button } from "@/components/ui/button";
import { LoginModal } from "./login-modal";
import { ThemeToggle } from "./theme-toggle";
import { useToast } from "./ui/use-toast";
import { LikedProductsDropdown } from "./modals/LikedProductsDropdown";
import { FollowedSellersDropdown } from "./modals/FollowedSellersDropdown";
import { useModal } from "@/hooks/use-modal";

// استيراد المكونات من مساراتها الجديدة في features/
import { MerchantRegistrationModal } from "@/features/merchant/management/components/MerchantRegistrationModal";

// تعريف Notification ليتوافق مع قاعدة البيانات
interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  sender_logo_url?: string | null;
}

// الاستيراد الديناميكي لـ MerchantDashboard
const MerchantDashboard = dynamic(() => 
  import('@/features/merchant/management/components/MerchantDashboard').then(mod => mod.MerchantDashboard), 
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-white animate-spin" />
      </div>
    )
  }
);

interface NavbarProps {
  initialUserData: any | null;
  initialCounts: { liked: number; following: number };
  initialUnreadCount: number;
  allCategories: Category[];
}

export function Navbar({
  initialUserData,
  initialCounts,
  initialUnreadCount,
  allCategories,
}: NavbarProps) {

  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { toast } = useToast();
  const { onOpen } = useModal();
  
  // ✅ استخدام useAuth
  const { 
    user, 
    isLoggedIn, 
    isLoading: authLoading, 
    displayName, 
    avatarUrl,
    isSeller,
    isServiceProvider,
    refreshProfile,
  } = useAuth();

  // نخفي عناصر المشتري طالما لم تنته المصادقة أو كان المستخدم تاجراً/مزوداً
  // هذا يمنع أي وميض لعناصر المشتري أثناء تهيئة الجلسة
  const isMerchantOrProvider = authLoading || isSeller || isServiceProvider;

  const { likedCount, followingCount, setInitialCounts, reset } = useInteractionStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(initialUnreadCount || 0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const [sellerRegistrationOpen, setSellerRegistrationOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);

  // تحديث الحالة عند تغير المستخدم
  useEffect(() => {
    if (!user) {
      reset();
      setUnreadNotificationsCount(0);
      setNotifications([]);
    }
  }, [user, reset]);

  // ✅ الاشتراك في الإشعارات باستخدام user.id
  useEffect(() => {
    if (!user?.id) return;
    
    const playNotificationSound = () => {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Error playing sound:', e));
    };

    const channel = supabase
      .channel(`realtime-notifications:${user.id}`)
      .on<Notification>(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        }, 
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadNotificationsCount(prev => prev + 1);
          toast({ 
            title: "لديك إشعار جديد!", 
            description: newNotification.message 
          });
          playNotificationSound();
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, supabase, toast]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.dispatchEvent(new Event("storageCleared"));
    toast({ title: "تم تسجيل الخروج بنجاح." });
    router.push('/');
    router.refresh();
  }, [supabase, toast, router]);

  const handleLoginSuccess = useCallback(() => setLoginModalOpen(false), []);
  const handleRegistrationSuccess = useCallback(async () => {
    setSellerRegistrationOpen(false);
    // تحديث AuthContext فوراً حتى يظهر اسم التاجر وشعاره وزر الإضافة بدون reload
    await refreshProfile();
  }, [refreshProfile]);
  const switchToRegister = useCallback(() => { 
    setLoginModalOpen(false); 
    setSellerRegistrationOpen(true); 
  }, []);
  
  const toggleDashboard = useCallback(() => setDashboardOpen(prev => !prev), []);
  
  const handleDataUpdated = useCallback(async () => {
    if (!user?.id) return;
    const { data: updatedSeller } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (updatedSeller) { 
      // تحديث local state إذا لزم الأمر
    }
  }, [supabase, user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingNotifs(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, message, link, is_read, created_at, sender_logo_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) { 
        toast({ 
          title: "خطأ في جلب الإشعارات", 
          description: error.message, 
          variant: "destructive" 
        }); 
      } else { 
        setNotifications(data as Notification[]); 
      }
    } catch (error) { 
      console.error('Error fetching notifications:', error); 
    } finally { 
      setIsLoadingNotifs(false); 
    }
  }, [supabase, user?.id, toast]);

  const markNotificationsAsRead = useCallback(async () => {
    if (!user?.id || unreadNotificationsCount === 0) return;
    
    setUnreadNotificationsCount(0);
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
      
    if (error) {
      toast({ 
        title: "خطأ في تحديث الإشعارات", 
        description: error.message, 
        variant: "destructive" 
      });
      
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      setUnreadNotificationsCount(count || 0);
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  }, [supabase, user?.id, unreadNotificationsCount, toast]);

  const getNotificationIcon = useCallback((type: string) => {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case 'new_review': 
      case 'new_seller_review': 
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'new_follower': 
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'new_message': 
      case 'new_private_message': 
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'new_like': 
      case 'new_like_on_message': 
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'new_reply': 
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default: 
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (notification.link) { 
      router.push(notification.link); 
    } else {
      switch (notification.type.toLowerCase()) {
        case 'new_message': 
        case 'new_private_message': 
          router.push('/messages'); 
          break;
        case 'new_review': 
        case 'new_seller_review': 
          router.push('/reviews'); 
          break;
        case 'new_follower': 
          router.push('/followers'); 
          break;
        default: 
          router.push('/notifications'); 
          break;
      }
    }
  }, [router]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background border-b">
        <div className="bg-muted/40">
          <div className="container mx-auto px-4 h-10 flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4 text-sm">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Info className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                    <div className="flex flex-col h-full">
                      <div className="flex flex-col space-y-4 py-4 flex-grow">
                        <SheetClose asChild>
                          <Link href="/" className="flex items-center text-xl font-bold text-primary mb-4">
                            سوق العرب
                          </Link>
                        </SheetClose>
                        <div className="mb-6">
                          <PlatformInfo />
                        </div>
                      </div>
                      <div className="py-4 border-t text-sm text-muted-foreground">
                        <p>© 2025 سوق العرب. جميع الحقوق محفوظة</p>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 h-auto p-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName || ''} className="h-5 w-5 rounded-full" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                          <span className="text-xs">{displayName || user?.email}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                          <LogOut className="ml-2 h-4 w-4" />
                          <span>تسجيل الخروج</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* زر إضافة منتج/خدمة — يظهر فقط للتاجر أو مزود الخدمة، وينقل لصفحة لوحة تحكمه */}
                    {isServiceProvider ? (
                      <Button
                        size="sm"
                        onClick={() => router.push('/service/dashboard')}
                        className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-2.5"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>إضافة خدمة</span>
                      </Button>
                    ) : isSeller ? (
                      <Button
                        size="sm"
                        onClick={() => router.push('/seller/dashboard')}
                        className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2.5"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>إضافة منتج</span>
                      </Button>
                    ) : null}
                  </div>
                ) : null /* ← لم أضف زر تسجيل الدخول، تركته null كما كان */ }
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Search className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="top" className="p-4 pt-10">
                      <Searchbar allCategories={allCategories} />
                    </SheetContent>
                  </Sheet>
                </div>
                {/* السلة والمفضلة — مخصصة للمشترين فقط */}
                {!isMerchantOrProvider && (
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsFavoritesOpen(p => !p)} 
                      className="h-8 w-8"
                    >
                      <ShoppingCart className={`h-5 w-5 transition-colors ${isFavoritesOpen ? 'text-red-500 fill-current' : ''}`} />
                      {likedCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                          {likedCount}
                        </span>
                      )}
                    </Button>
                    <LikedProductsDropdown 
                      isOpen={isFavoritesOpen} 
                      onClose={() => setIsFavoritesOpen(false)} 
                      userId={user?.id} 
                    />
                  </div>
                )}
                {isLoggedIn && (
                  <>
                    {/* متابعة التجار — للمشترين فقط */}
                    {!isMerchantOrProvider && (
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setIsFollowingOpen(p => !p)} 
                          aria-label="الحساب الذين اتابعهم" 
                          className="h-8 w-8"
                        >
                          <Pin className={`h-5 w-5 transition-colors ${isFollowingOpen ? 'text-blue-500' : ''}`} />
                          {followingCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                              {followingCount}
                            </span>
                          )}
                        </Button>
                        <FollowedSellersDropdown 
                          isOpen={isFollowingOpen} 
                          onClose={() => setIsFollowingOpen(false)} 
                          userId={user?.id} 
                        />
                      </div>
                    )}
                    <Popover onOpenChange={(open) => { 
                      if (open) { 
                        fetchNotifications(); 
                        markNotificationsAsRead(); 
                      } 
                    }}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                          <Bell className="h-5 w-5" />
                          {unreadNotificationsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-[10px] text-white font-bold">
                                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                              </span>
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="p-2">
                          <h4 className="font-bold text-lg mb-2 px-2">الإشعارات</h4>
                          {isLoadingNotifs ? (
                            <div className="flex justify-center p-10">
                              <Loader2 className="animate-spin" />
                            </div>
                          ) : notifications.length > 0 ? (
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                              {notifications.map(notification => (
                                <div 
                                  key={notification.id} 
                                  onClick={() => handleNotificationClick(notification)} 
                                  className={`flex items-start gap-3 p-2.5 rounded-md transition-colors cursor-pointer hover:bg-muted ${!notification.is_read ? 'bg-primary/10' : 'bg-transparent'}`}
                                >
                                  {/* أيقونة المُرسِل: شعار إن وُجد، وإلا أيقونة النوع */}
                                  <div className="mt-0.5 flex-shrink-0 relative">
                                    {notification.sender_logo_url ? (
                                      <div className="relative h-9 w-9">
                                        <img
                                          src={notification.sender_logo_url}
                                          alt="مرسِل الإشعار"
                                          className="h-9 w-9 rounded-full object-cover border border-border"
                                          onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            (e.currentTarget.nextSibling as HTMLElement)?.style && ((e.currentTarget.nextSibling as HTMLElement).style.display = 'flex');
                                          }}
                                        />
                                        {/* أيقونة النوع كـ badge صغير */}
                                        <span className="absolute -bottom-1 -left-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                                          {getNotificationIcon(notification.type)}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                        {getNotificationIcon(notification.type)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-tight">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground pt-1">
                                      {new Date(notification.created_at).toLocaleDateString('ar-EG', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        hour: 'numeric', 
                                        minute: 'numeric' 
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-center text-muted-foreground py-10">
                              لا توجد إشعارات جديدة.
                            </p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </>
                )}
                <ThemeToggle suppressHydrationWarning />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-background">
          <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-0">
            <div className="flex-shrink-0 mr-6">
              <Link href="/">
                <Logo 
                  imageUrl="/Generated_Image_a14w16a14w16a14w1.png" 
                  width={200} 
                  height={50}  
                  suppressHydrationWarning 
                />
              </Link>
            </div>
            <div className="hidden md:flex flex-3" style={{ marginRight: '100px', marginLeft: '0px' }}>
              <Searchbar allCategories={allCategories} />
            </div>
          </div>
        </div>
      </header>
      
      {/* المودالات */}
      <MerchantRegistrationModal 
        isOpen={sellerRegistrationOpen} 
        onClose={() => setSellerRegistrationOpen(false)} 
        onSuccess={handleRegistrationSuccess} 
      />
      
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={handleLoginSuccess} 
        onRegisterClick={switchToRegister} 
      />
      
      {dashboardOpen && user && (
        <MerchantDashboard 
          isOpen={dashboardOpen} 
          onClose={toggleDashboard} 
          seller={user} 
          onDataUpdated={handleDataUpdated} 
        />
      )}
    </>
  );
}
