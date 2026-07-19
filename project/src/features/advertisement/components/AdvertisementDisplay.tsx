'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import Link from 'next/link';

interface Advertisement {
  id: number;
  title: string;
  target_link?: string;
  advertisement_content?: Array<{
    image_url: string;
    image_alt_text: string;
  }>;
}

interface AdvertisementDisplayProps {
  location: 'homepage' | 'sidebar' | 'category_page' | 'search_results' | 'product_page' | 'service_page' | 'sticky';
  width?: number;
  height?: number;
}

export function AdvertisementDisplay({ location, width = 300, height = 300 }: AdvertisementDisplayProps) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('advertisement_requests')
          .select(`
            id,
            title,
            target_link,
            advertisement_content (image_url, image_alt_text),
            advertisement_spaces (width, height)
          `)
          .eq('advertisement_spaces.location', location)
          .eq('status', 'active')
          .lte('start_date', today)
          .gte('end_date', today)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error fetching advertisements:', error);
        } else {
          setAdvertisements(data || []);
        }
      } catch (err) {
        console.error('Error in advertisement fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisements();
  }, [location]);

  // تدوير الإعلانات تلقائياً
  useEffect(() => {
    if (advertisements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
    }, 5000); // تبديل كل 5 ثوانٍ

    return () => clearInterval(interval);
  }, [advertisements.length]);

  // تتبع المشاهدات
  useEffect(() => {
    if (!advertisements.length || loading) return;

    const currentAd = advertisements[currentAdIndex];
    if (!currentAd) return;

    const trackView = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // محاولة تحديث إذا كان السجل موجوداً
        const { data: existingData, error: fetchError } = await supabase
          .from('advertisement_analytics')
          .select('id')
          .eq('request_id', currentAd.id)
          .eq('tracking_date', today)
          .single();

        if (existingData) {
          // تحديث السجل الموجود
          await supabase
            .from('advertisement_analytics')
            .update({ views_count: existingData.views_count + 1 })
            .eq('id', existingData.id);
        } else {
          // إنشاء سجل جديد
          await supabase
            .from('advertisement_analytics')
            .insert({
              request_id: currentAd.id,
              tracking_date: today,
              views_count: 1,
              clicks_count: 0,
              impressions_count: 1,
            });
        }
      } catch (error) {
        // تجاهل الأخطاء في التتبع
        console.debug('Analytics tracking skipped');
      }
    };

    trackView();
  }, [currentAdIndex, advertisements, loading]);

  if (loading || advertisements.length === 0) {
    return null;
  }

  const currentAd = advertisements[currentAdIndex];
  const imageUrl = currentAd.advertisement_content?.[0]?.image_url;

  if (!imageUrl) {
    return null;
  }

  const handleClick = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: analytics } = await supabase
        .from('advertisement_analytics')
        .select('id, clicks_count')
        .eq('request_id', currentAd.id)
        .eq('tracking_date', today)
        .single();

      if (analytics) {
        await supabase
          .from('advertisement_analytics')
          .update({ clicks_count: (analytics.clicks_count || 0) + 1 })
          .eq('id', analytics.id);
      }
    } catch (error) {
      console.debug('Click tracking skipped');
    }

    if (currentAd.target_link) {
      window.open(currentAd.target_link, '_blank');
    }
  };

  const containerStyle = {
    width: width,
    height: height,
    overflow: 'hidden' as const,
  };

  return (
    <div
      className="relative bg-gray-100 rounded-lg overflow-hidden group"
      style={containerStyle}
      role="region"
      aria-label="إعلان"
    >
      {/* الصورة */}
      <button
        onClick={handleClick}
        className="w-full h-full flex items-center justify-center cursor-pointer transition-transform group-hover:scale-105"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-label={`إعلان: ${currentAd.title}`}
      >
        <img
          src={imageUrl}
          alt={currentAd.title}
          className="w-full h-full object-cover"
        />
      </button>

      {/* مؤشرات التدوير */}
      {advertisements.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {advertisements.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentAdIndex ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentAdIndex(index)}
              aria-label={`عرض الإعلان ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* علامة إعلان */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        إعلان
      </div>
    </div>
  );
}

// مكونات متخصصة لكل موقع
export function HomepageAdvertisement() {
  return <AdvertisementDisplay location="homepage" width={1200} height={300} />;
}

export function SidebarAdvertisement() {
  return <AdvertisementDisplay location="sidebar" width={300} height={400} />;
}

export function CategoryPageAdvertisement() {
  return <AdvertisementDisplay location="category_page" width={1200} height={250} />;
}

export function SearchResultsAdvertisement() {
  return <AdvertisementDisplay location="search_results" width={1200} height={250} />;
}

export function ProductPageAdvertisement() {
  return <AdvertisementDisplay location="product_page" width={1200} height={250} />;
}

export function ServicePageAdvertisement() {
  return <AdvertisementDisplay location="service_page" width={1200} height={250} />;
}

export function StickyAdvertisement() {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AdvertisementDisplay location="sticky" width={300} height={300} />
    </div>
  );
}
