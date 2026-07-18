//components/theme-toggle.tsx
"use client"
import { Moon, Sun, Eye } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react" // <--- إضافة هذه الاستيرادات

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false) // <--- حالة جديدة

  // <--- useEffect جديد لتعيين mounted بعد أول عملية ترطيب
  useEffect(() => {
    setMounted(true)
  }, [])

  // <--- عرض مؤقت أو أيقونة افتراضية حتى يتم الترطيب
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="border-2">
        <Sun className="h-[1.2rem] w-[1.2rem]" /> {/* أيقونة افتراضية أو spinner */}
        <span className="sr-only">تغيير وضع العرض</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="border-2">
          {/* الآن فقط اعرض الأيقونة بناءً على الثيم بعد التأكد من الترطيب */}
          {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
          {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
          {theme === "high-contrast" && <Eye className="h-[1.2rem] w-[1.2rem]" />}
          {/* إذا كان الثيم غير معروف (مثل "system" قبل أن يتحدد)، يمكن عرض أيقونة افتراضية */}
          {(!theme || (theme !== "light" && theme !== "dark" && theme !== "high-contrast")) && (
              <Sun className="h-[1.2rem] w-[1.2rem]" /> // أيقونة افتراضية
          )}
          <span className="sr-only">تغيير وضع العرض</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="ml-2 h-4 w-4" />
          <span>فاتح</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="ml-2 h-4 w-4" />
          <span>داكن</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("high-contrast")}>
          <Eye className="ml-2 h-4 w-4" />
          <span>تباين عالي</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
