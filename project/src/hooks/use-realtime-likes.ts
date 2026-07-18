// ملف: hooks/use-realtime-likes.ts
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { useAuth } from '@/context/AuthContext'; // <-- إضافة استيراد useAuth

export const useRealtimeLikes = (productId: number) => {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth(); // <-- الحصول على المستخدم الحالي
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false); // <-- إضافة حالة لمعرفة إذا كان المستخدم قد أعجب

  useEffect(() => {
    if (!productId) return;

    // 1. جلب العدد الأولي
    const fetchInitialCount = async () => {
      const { count } = await supabase
        .from('product_likes')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);
      
      setLikesCount(count || 0);
    };
    
    fetchInitialCount();

    // 2. إذا كان المستخدم مسجلاً، تحقق مما إذا كان قد أعجب بهذا المنتج
    if (user) {
      const checkUserLike = async () => {
        const { data } = await supabase
          .from('product_likes')
          .select('id')
          .eq('product_id', productId)
          .eq('user_id', user.id) // <-- استخدام user.id من useAuth
          .maybeSingle();
        
        setIsLiked(!!data);
      };
      
      checkUserLike();
    }

    // 3. الاشتراك في التحديثات الفورية
    const channel = supabase
      .channel(`realtime-likes-product:${productId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'product_likes',
        filter: `product_id=eq.${productId}`
      }, (payload) => {
        setLikesCount(prev => prev + 1);
        // إذا كان المستخدم الحالي هو من أضاف الإعجاب، حدّث حالة isLiked
        if (user && payload.new.user_id === user.id) {
          setIsLiked(true);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'product_likes',
        filter: `product_id=eq.${productId}`
      }, (payload) => {
        setLikesCount(prev => Math.max(0, prev - 1));
        // إذا كان المستخدم الحالي هو من أزال الإعجاب، حدّث حالة isLiked
        if (user && payload.old.user_id === user.id) {
          setIsLiked(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, user?.id]); // <-- إضافة user?.id كمُتَبعِد

  return { likesCount, isLiked }; // <-- إرجاع isLiked أيضاً
};