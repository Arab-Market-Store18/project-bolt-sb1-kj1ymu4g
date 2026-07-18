// المسار: components/login-modal.tsx
"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, Lock } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
}

export function LoginModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  onRegisterClick 
}: LoginModalProps) {
  const supabase = createSupabaseBrowserClient();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "أهلاً بعودتك!",
      description: "تم تسجيل دخولك بنجاح.",
    });
    
    // 🔴 التعديل المهم: أغلق النافذة أولاً
    onClose();
    
    // 🔴 ثم استدعي النجاح بعد قليل
    setTimeout(() => {
      onLoginSuccess();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل الدخول</DialogTitle>
          <DialogDescription>
            أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin}>
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full">
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              تسجيل الدخول
            </Button>
            <Button type="button" variant="link" onClick={onRegisterClick}>
              ليس لديك حساب؟ سجل الآن
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}