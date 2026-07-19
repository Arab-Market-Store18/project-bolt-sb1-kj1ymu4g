// المسار: components/modals/FollowedSellersDropdown.tsx
// هذا ملف جديد بالكامل

"use client";

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Loader2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useModal } from '@/hooks/use-modal';

// تعريف نوع البيانات للبائع المتابع
interface FollowedSeller {
  sellers: {
    id: string;
    business_name: string;
    logo_url: string | null;
  } | null;
}

interface FollowedSellersDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export function FollowedSellersDropdown({ isOpen, onClose, userId }: FollowedSellersDropdownProps) {
  const supabase = createSupabaseBrowserClient();
  const { onOpen } = useModal();

  const [followedSellers, setFollowedSellers] = useState<FollowedSeller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // دالة لجلب البائعين المتابَعين
  const fetchFollowedSellers = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    
    // استخدام جدول 'seller_follows' لجلب البيانات
    const { data, error: fetchError } = await supabase
      .from('seller_follows')
      .select(`
        sellers (
          id,
          business_name,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // ترتيبهم من الأحدث للأقدم

    if (fetchError) {
      console.error("Error fetching followed sellers:", fetchError);
      setError("حدث خطأ أثناء جلب قائمة المتابعة.");
      setFollowedSellers([]);
    } else {
      const validSellers = data.filter(item => item.sellers !== null) as FollowedSeller[];
      setFollowedSellers(validSellers);
    }
    setIsLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowedSellers();
    }
  }, [isOpen, userId, fetchFollowedSellers]);

  // دالة عند النقر على اسم البائع
  const handleSellerClick = (sellerId: string) => {
    onClose(); // أغلق القائمة المنسدلة الحالية
    onOpen('sellerProfile', { sellerId }); // افتح نافذة ملف التاجر
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full mt-8 left-1/2 -translate-x-1/4 w-70 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <Users className="w-5 h-5 ml-2 text-blue-500" />
          المتاجر الذين اتابعهم 
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="p-2 max-h-96 overflow-y-auto">
        {isLoading ? ( <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : error ? ( <div className="text-center p-8 text-red-500"><p>{error}</p></div>
        ) : followedSellers.length > 0 ? (
          <ul className="space-y-1">
            {followedSellers.map((item) => (
              item.sellers && (
                <li key={item.sellers.id}>
                  <button
                    onClick={() => handleSellerClick(item.sellers!.id)}
                    className="w-full flex items-center text-right p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <Avatar className="h-9 w-9 ml-3">
                      <AvatarImage src={item.sellers.logo_url || undefined} />
                      <AvatarFallback>{item.sellers.business_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{item.sellers.business_name}</p>
                    </div>
                  </button>
                </li>
              )
            ))}
          </ul>
        ) : (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            <p className="font-semibold">قائمة المتابعة فارغة.</p>
            <p className="text-xs mt-1">تابع بائعينك المفضلين ليظهروا هنا.</p>
          </div>
        )}
      </div>
    </div>
  );
}
