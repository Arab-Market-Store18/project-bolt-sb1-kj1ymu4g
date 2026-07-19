import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const SearchAndCountries = () => (
  <div className="bg-white dark:bg-gray-950 py-6">
    <div className="container mx-auto px-4">
      <div className="relative mx-auto max-w-2xl">
        <Input
          type="search"
          placeholder="ابحث في أكثر من 100 مليون منتج من جميع أنحاء العالم..."
          className="h-14 w-full rounded-full border-2 border-gray-300 pl-12 pr-4 text-base dark:border-gray-700"
        />
        <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
      </div>
      {/* يمكنك إضافة أعلام الدول هنا لاحقًا */}
    </div>
  </div>
);
