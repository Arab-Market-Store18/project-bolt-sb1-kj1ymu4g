// features/merchant/profile-merchant/components/ui/ProfileMerchantFAQ.tsx


import { useState } from 'react';
import { HelpCircle, ChevronDown } from "lucide-react";

export const ProfileMerchantFAQ = ({ faqs }: { faqs: any[] | null }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div 
            key={i} 
            className="bg-muted p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/80"
            onClick={() => toggleFAQ(i)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold">{faq.q}</span>
              </div>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${expandedIndex === i ? 'rotate-180' : ''}`} 
              />
            </div>
            {expandedIndex === i && (
              <p className="mt-2 mr-7 text-sm text-muted-foreground">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
