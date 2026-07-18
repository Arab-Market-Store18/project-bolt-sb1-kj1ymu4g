import { Metadata } from 'next';
import { AdminAdvertisementsDashboard } from '@/features/advertisement/components/AdminAdvertisementsDashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Package2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'إدارة الإعلانات - السوق العربي',
  description: 'مراجعة والموافقة على الإعلانات',
};

export default function AdminAdvertisementsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Link href="/admin">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span className="text-white/70 text-sm">رجوع</span>
          </div>
          <div className="flex items-center gap-3">
            <Package2 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">إدارة الإعلانات</h1>
              <p className="text-white/70 text-sm mt-1">مراجعة والموافقة على الإعلانات المقدمة</p>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <AdminAdvertisementsDashboard />
      </div>
    </main>
  );
}
