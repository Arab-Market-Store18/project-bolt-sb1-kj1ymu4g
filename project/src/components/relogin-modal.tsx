// المسار: components/relogin-modal.tsx
// --- مكون نافذة إعادة تسجيل الدخول مع الاسم الجديد ---

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

// تم تغيير اسم الواجهة (Interface)
interface ReloginModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

// ▼▼▼ تم تغيير اسم المكون هنا ▼▼▼
export function ReloginModal({ isOpen, onClose, email }: ReloginModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/seller-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "فشل تسجيل الدخول.");
      }

      toast({
        title: "تم تسجيل الدخول بنجاح!",
        description: "أهلاً بعودتك. جاري توجيهك إلى لوحة التحكم.",
      });
      
      window.location.reload(); 
      onClose();

    } catch (error: any) {
      setError(error.message);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "طلب استعادة كلمة المرور",
      description: "سيتم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">إعادة تسجيل الدخول</DialogTitle>
          <DialogDescription>
            هذا البريد الإلكتروني مسجل بالفعل. أدخل كلمة المرور للمتابعة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          
          <div className="text-sm">
            <a
              href="#"
              onClick={handleForgotPassword}
              className="font-medium text-primary hover:underline"
            >
              هل نسيت كلمة المرور؟
            </a>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              تسجيل الدخول
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}