// المسار: components/Icon.tsx

// تم تعديل هذا السطر: استيراد `icons` و `HelpCircle` بشكل منفصل
import { icons, HelpCircle } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
// تم تعديل هذا السطر: استيراد النوع من ملف البيانات المحدث
import type { IconName } from '@/lib/data/categories';

interface IconProps extends LucideProps {
  name: IconName;
}

const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = icons[name];

  if (!LucideIcon) {
    // تم تعديل هذا السطر: استخدام `HelpCircle` المستوردة مباشرة
    return <HelpCircle {...props} />;
  }
  
  return <LucideIcon {...props} />;
};

export default Icon;
