// المسار: components/registration-options-modal.tsx

"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Mail, Phone } from "lucide-react"
import { toast } from "./ui/use-toast"

interface RegistrationOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectEmail: () => void
}

export function RegistrationOptionsModal({ 
  isOpen, 
  onClose, 
  onSelectEmail 
}: RegistrationOptionsModalProps) {

  const handlePhoneClick = () => {
    toast({
      title: "قيد التطوير",
      description: "سيتم تفعيل التسجيل عبر رقم الهاتف قريبًا.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>اختيار طريقة التسجيل</DialogTitle>
          <DialogDescription>
            كيف تفضل إنشاء حسابك الجديد في سوق العرب؟
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <Button 
            onClick={onSelectEmail} 
            className="w-full"
          >
            <Mail className="h-4 w-4 ml-2" />
            التسجيل عبر البريد الإلكتروني
          </Button>
          <Button 
            onClick={handlePhoneClick} 
            variant="secondary" 
            className="w-full"
          >
            <Phone className="h-4 w-4 ml-2" />
            التسجيل عبر رقم الهاتف (قريبًا)
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}