// المسار: components/modals/content-modal.tsx

"use client";

// ▼▼▼ هذا هو السطر الذي تم تصحيحه ▼▼▼
import { useModal } from "@/hooks/use-modal"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { X } from "lucide-react";

export function ContentModal() {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === 'contentViewer';

  const { title, children } = data;

  if (!isModalOpen) {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 left-4">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
