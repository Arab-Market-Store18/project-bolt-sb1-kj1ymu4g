// المسار: components/delete-product-dialog.tsx
"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { useState } from "react"

interface DeleteProductDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  productName: string
}

export function DeleteProductDialog({ isOpen, onClose, onConfirm, productName }: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    await onConfirm()
    setIsDeleting(false)
    onClose() // أغلق المربع بعد اكتمال الحذف بنجاح أو فشل
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
          <AlertDialogDescription>
            هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المنتج <strong className="text-red-600">{productName}</strong> بشكل دائم من قاعدة البيانات.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الحذف...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                نعم، قم بالحذف
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
