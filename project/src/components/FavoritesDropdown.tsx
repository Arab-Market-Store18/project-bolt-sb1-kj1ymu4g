// المسار: components/FavoritesDropdown.tsx

"use client";

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Loader2, Heart, Store, User, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from './ui/button';

interface FavoriteItem {
  seller_id: string;
  sellers: {
    business_name: string;
    logo_url: string | null;
  } | null;
}

interface FavoritesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function FavoritesDropdown({ isOpen, onClose, userId }: FavoritesDropdownProps) {
  const supabase = createSupabaseBrowserClient();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchFavorites = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('seller_follows')
        .select(`
          seller_id,
          sellers (
            business_name,
            logo_url
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching favorites:", error);
        setFavorites([]);
      } else {
        setFavorites(data as FavoriteItem[]);
      }
      setIsLoading(false);
    };

    fetchFavorites();
  }, [isOpen, userId, supabase]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <Heart className="w-5 h-5 ml-2 text-red-500" />
          المتاجر المفضلة
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-2 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : favorites.length > 0 ? (
          <ul className="space-y-2">
            {favorites.map((fav) => (
              <li key={fav.seller_id} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Avatar className="h-9 w-9 ml-3">
                  <AvatarImage src={fav.sellers?.logo_url || undefined} />
                  <AvatarFallback>
                    {fav.sellers?.business_name?.charAt(0) || <Store />}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {fav.sellers?.business_name || 'متجر غير معروف'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            <p>قائمة المفضلة فارغة.</p>
            <p className="text-xs mt-1">أضف متاجر لسهولة الوصول إليها.</p>
          </div>
        )}
      </div>
    </div>
  );
}
