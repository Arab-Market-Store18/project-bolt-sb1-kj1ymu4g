// المسار: app/services/[id]/loading.tsx
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
      <p className="text-xl font-medium">جاري تحميل الخدمة...</p>
      <p className="text-muted-foreground mt-2">سيتم التحميل خلال لحظات</p>
    </div>
  );
}