"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ShipWheelIcon as Wheelchair, Eye, Type, ZoomIn, Moon, Sun, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

export function AccessibilityPanel() {
  const { theme, setTheme } = useTheme()
  const [fontSize, setFontSize] = useState<number[]>([100])
  const [reduceMotion, setReduceMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(theme === "high-contrast")

  // تغيير حجم الخط
  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value)
    document.documentElement.style.fontSize = `${value[0]}%`
  }

  // تغيير تقليل الحركة
  const handleReduceMotionChange = (checked: boolean) => {
    setReduceMotion(checked)
    if (checked) {
      document.documentElement.classList.add("reduce-motion")
    } else {
      document.documentElement.classList.remove("reduce-motion")
    }
  }

  // تغيير التباين العالي
  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked)
    if (checked) {
      setTheme("high-contrast")
    } else {
      setTheme("light")
    }
  }

  // إعادة تعيين الإعدادات
  const resetSettings = () => {
    setFontSize([100])
    document.documentElement.style.fontSize = "100%"
    setReduceMotion(false)
    document.documentElement.classList.remove("reduce-motion")
    setHighContrast(false)
    setTheme("light")
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 rounded-full h-12 w-12 border-2 border-primary bg-background shadow-lg"
          aria-label="إعدادات إمكانية الوصول"
        >
          <Wheelchair className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-xl">إعدادات إمكانية الوصول</SheetTitle>
          <SheetDescription>قم بتخصيص إعدادات إمكانية الوصول لتحسين تجربة استخدامك للموقع.</SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* وضع التباين العالي */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <Label htmlFor="high-contrast" className="font-medium">
                  وضع التباين العالي
                </Label>
              </div>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={handleHighContrastChange}
                aria-label="تفعيل وضع التباين العالي"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              يوفر تباينًا عاليًا بين النصوص والخلفيات لتحسين الرؤية للأشخاص ذوي الإعاقات البصرية.
            </p>
          </div>

          {/* حجم الخط */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              <Label className="font-medium">حجم الخط</Label>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">أ</span>
              <Slider
                value={fontSize}
                min={75}
                max={200}
                step={5}
                onValueChange={handleFontSizeChange}
                aria-label="ضبط حجم الخط"
              />
              <span className="text-lg font-bold">أ</span>
            </div>
            <p className="text-sm text-muted-foreground">الحجم الحالي: {fontSize[0]}% (الافتراضي: 100%)</p>
          </div>

          {/* تقليل الحركة */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-5 w-5" />
                <Label htmlFor="reduce-motion" className="font-medium">
                  تقليل الحركة
                </Label>
              </div>
              <Switch
                id="reduce-motion"
                checked={reduceMotion}
                onCheckedChange={handleReduceMotionChange}
                aria-label="تقليل الحركة والتأثيرات"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              تقليل أو إزالة التأثيرات الحركية والرسوم المتحركة في الموقع.
            </p>
          </div>

          {/* الوضع الداكن */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="font-medium">وضع العرض</Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTheme("light")}
                aria-label="تفعيل الوضع الفاتح"
              >
                <Sun className="h-4 w-4 ml-2" />
                فاتح
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTheme("dark")}
                aria-label="تفعيل الوضع الداكن"
              >
                <Moon className="h-4 w-4 ml-2" />
                داكن
              </Button>
            </div>
          </div>

          {/* إعادة تعيين */}
          <div className="pt-4">
            <Button variant="outline" className="w-full" onClick={resetSettings}>
              <X className="h-4 w-4 ml-2" />
              إعادة تعيين الإعدادات
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            نحن نسعى لجعل موقعنا متاحًا للجميع. إذا واجهت أي صعوبات في استخدام الموقع، يرجى التواصل معنا.
          </p>
        </div>

        <SheetClose className="absolute left-4 top-4">
          <Button variant="ghost" size="icon" aria-label="إغلاق">
            <X className="h-4 w-4" />
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  )
}
