import { Package, Globe, ShieldCheck } from "lucide-react";
const features = [
  { name: "أكثر من 100 مليون منتج عالمي", icon: Package },
  { name: "الشحن إلى جميع أنحاء العالم", icon: Globe },
  { name: "المعاملات الدولية الآمنة", icon: ShieldCheck },
];
export const FeaturesSection = () => (
  <div className="border-y bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
    <div className="container mx-auto grid grid-cols-1 gap-4 px-4 py-8 text-center md:grid-cols-3">
      {features.map((feature) => (
        <div key={feature.name} className="flex flex-col items-center">
          <feature.icon className="h-10 w-10 text-yellow-500" />
          <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">{feature.name}</p>
        </div>
      ))}
    </div>
  </div>
);
