import { Metadata } from 'next';
import { AdvertisementRequestForm } from '@/features/advertisement/components/AdvertisementRequestForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'طلب إعلان - السوق العربي',
  description: 'طلب إعلان جديد في المساحات الإعلانية المتاحة',
};

export default function AdvertisementRequestPage() {
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
          <h1 className="text-2xl sm:text-3xl font-bold">طلب إعلان جديد</h1>
        </div>
      </div>

      {/* المحتوى */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <AdvertisementRequestForm />
      </div>
    </main>
  );
}
