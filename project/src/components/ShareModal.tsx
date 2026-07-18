// components/ShareModal.tsx
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Facebook,
  Twitter,
  Send,
  Mail,
  Copy,
  Linkedin,
  QrCode,
  Share2,
  X
} from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData?: { // ⬅️ اجعلها اختيارية
    title: string;
    text: string;
    url: string;
    image?: string;
  };
}

export function ShareModal({ isOpen, onClose, shareData }: ShareModalProps) {
  // 🔧 التحقق من البيانات
  if (!shareData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              خطأ في البيانات
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-red-500 mb-4">بيانات المشاركة غير متوفرة</p>
            <Button onClick={onClose}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleShare = (platform: string) => {
    let shareUrl = "";
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + '\n' + shareData.url)}`;
        window.open(shareUrl, '_blank');
        break;
      
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent(shareData.text)}`;
        window.open(shareUrl, '_blank');
        break;
      
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
        window.open(shareUrl, '_blank');
        break;
      
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`;
        window.open(shareUrl, '_blank');
        break;
      
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}`;
        window.location.href = shareUrl;
        break;
      
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`;
        window.open(shareUrl, '_blank');
        break;
      
      case 'copy':
        navigator.clipboard.writeText(shareData.url)
          .then(() => toast.success("تم نسخ الرابط إلى الحافظة!"))
          .catch(() => toast.error("فشل نسخ الرابط"));
        break;
      
      case 'qrcode':
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareData.url)}`;
        window.open(qrUrl, '_blank');
        break;
      
      default:
        break;
    }
    
    if (platform !== 'copy') {
      onClose();
    }
  };

  const shareOptions = [
    { id: 'whatsapp', label: 'واتساب', icon: MessageCircle, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'facebook', label: 'فيسبوك', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'twitter', label: 'تويتر', icon: Twitter, color: 'bg-black hover:bg-gray-800' },
    { id: 'telegram', label: 'تلغرام', icon: Send, color: 'bg-sky-500 hover:bg-sky-600' },
    { id: 'email', label: 'البريد', icon: Mail, color: 'bg-gray-600 hover:bg-gray-700' },
    { id: 'linkedin', label: 'لينكدإن', icon: Linkedin, color: 'bg-blue-700 hover:bg-blue-800' },
    { id: 'copy', label: 'نسخ', icon: Copy, color: 'bg-purple-500 hover:bg-purple-600' },
    { id: 'qrcode', label: 'QR', icon: QrCode, color: 'bg-orange-500 hover:bg-orange-600' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {shareData.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm font-medium text-gray-700 mb-1">{shareData.title}</p>
            <p className="text-xs text-gray-500 break-words">{shareData.url}</p>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.id}
                variant="ghost"
                className={`flex flex-col items-center justify-center h-20 ${option.color} text-white hover:text-white`}
                onClick={() => handleShare(option.id)}
              >
                <option.icon className="h-6 w-6 mb-1" />
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: shareData.title,
                    text: shareData.text,
                    url: shareData.url,
                  });
                } else {
                  toast.error("ميزة المشاركة غير متاحة في هذا المتصفح");
                }
                onClose();
              }}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 ml-2" />
              مشاركة مباشرة
            </Button>
            <Button variant="ghost" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 ml-2" />
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}