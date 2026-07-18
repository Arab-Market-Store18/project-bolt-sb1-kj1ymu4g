'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

interface AdvertisementSpace {
  id: number;
  name: string;
  description: string;
  location: string;
  width: number;
  height: number;
  price_per_day: number;
  currency: string;
  available_count: number;
  booked_count: number;
  image_url?: string;
  display_order: number;
}

export function AdvertisementSpaces() {
  const [spaces, setSpaces] = useState<AdvertisementSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: err } = await supabase
          .from('advertisement_spaces')
          .select('*')
          .eq('is_active', true)
          .order('location')
          .order('display_order');

        if (err) throw err;
        setSpaces(data || []);
      } catch (err) {
        console.error('Error fetching advertisement spaces:', err);
        setError('فشل تحميل المساحات الإعلانية');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const locations = Array.from(new Set(spaces.map(s => s.location)));
  const filteredSpaces = selectedLocation 
    ? spaces.filter(s => s.location === selectedLocation)
    : spaces;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* الفلترة حسب الموقع */}
      {locations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedLocation === null ? 'default' : 'outline'}
            onClick={() => setSelectedLocation(null)}
            size="sm"
          >
            الكل
          </Button>
          {locations.map(location => (
            <Button
              key={location}
              variant={selectedLocation === location ? 'default' : 'outline'}
              onClick={() => setSelectedLocation(location)}
              size="sm"
            >
              {getLocationLabel(location)}
            </Button>
          ))}
        </div>
      )}

      {/* عرض المساحات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpaces.map(space => (
          <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* صورة المعاينة */}
            {space.image_url && (
              <div className="aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={space.image_url}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2">{space.name}</CardTitle>
                  <CardDescription className="mt-2">{space.description}</CardDescription>
                </div>
                <Badge variant="secondary">{getLocationLabel(space.location)}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* معلومات المساحة */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">الحجم</p>
                    <p className="font-semibold">{space.width} × {space.height}px</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">المتاح</p>
                    <p className="font-semibold">{space.available_count - space.booked_count}/{space.available_count}</p>
                  </div>
                </div>
              </div>

              {/* السعر */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">السعر لليوم الواحد</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-bold text-lg">{space.price_per_day}</span>
                    <span className="text-sm text-muted-foreground">{space.currency}</span>
                  </div>
                </div>
              </div>

              {/* زر الطلب */}
              <Button asChild className="w-full" disabled={space.available_count <= space.booked_count}>
                <Link href={`/advertise/request?space=${space.id}`}>
                  طلب إعلان في هذه المساحة
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSpaces.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد مساحات إعلانية متاحة حالياً</p>
        </div>
      )}
    </div>
  );
}

function getLocationLabel(location: string): string {
  const labels: Record<string, string> = {
    'homepage': 'الصفحة الرئيسية',
    'sidebar': 'الشريط الجانبي',
    'category_page': 'صفحات الفئات',
    'search_results': 'نتائج البحث',
    'product_page': 'صفحات المنتجات',
    'service_page': 'صفحات الخدمات',
    'sticky': 'إعلانات عائمة',
  };
  return labels[location] || location;
}
