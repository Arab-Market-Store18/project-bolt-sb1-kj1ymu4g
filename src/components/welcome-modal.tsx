//components/welcome-modal.tsx
"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
// تأكد من استيراد DialogTitle هنا
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"; // <--- هذا هو التغيير الأول

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewUser: () => void;
  onExistingUser: () => void;
  title: string;
  subtitle: string;
  description: string;
  newUserText: string;
  existingUserText: string;
}

export function WelcomeModal({
  isOpen,
  onClose,
  onNewUser,
  onExistingUser,
  title,
  subtitle,
  description,
  newUserText,
  existingUserText,
}: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        {/* أضف DialogTitle هنا، ويفضل أن يكون أول عنصر مباشر داخل DialogContent */}
        <DialogTitle className="sr-only">{title}</DialogTitle>{" "}
        {/* <--- هذا هو التغيير الثاني */}
        {/* استخدم "sr-only" إذا كنت تريد إخفاء العنوان بصريًا وتركه فقط لقارئات الشاشة */}
        <div className="relative bg-white rounded-lg">
          {/* زر الإغلاق */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* المحتوى */}
          <div className="px-8 py-12 text-center">
            {/* يمكنك استخدام الخاصية `title` التي تمررها بالفعل كمحتوى لـ DialogTitle */}
            <h1 className="text-3xl font-bold text-emerald-600 mb-4">
              {title}
            </h1>
            <h2 className="text-xl text-gray-700 mb-6">{subtitle}</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>

            <div className="space-y-4">
              <Button
                onClick={onNewUser}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-medium rounded-lg"
              >
                {newUserText}
              </Button>
              <Button
                onClick={onExistingUser}
                variant="outline"
                className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 text-lg font-medium rounded-lg"
              >
                {existingUserText}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}