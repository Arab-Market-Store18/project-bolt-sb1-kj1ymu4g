import { Metadata } from 'next';
import { MyAdvertisements } from '@/features/advertisement/components/MyAdvertisements';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'إدارة إعلاناتي - السوق العربي',
  description: 'تابع وأدر إعلاناتك',
};

export default function MyAdvertisementsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Link href="/advertise/spaces">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span className="text-white/70 text-sm">رجوع</span>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">إدارة إعلاناتي</h1>
              <p className="text-white/70 text-sm mt-1">تابع وأدر جميع إعلاناتك</p>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <MyAdvertisements />
      </div>
    </main>
  );
}
