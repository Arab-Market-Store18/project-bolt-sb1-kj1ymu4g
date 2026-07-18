// المسار: components/ErrorBoundary.tsx
// -- نسخة مصححة بأقل تعديل ممكن --

"use client";

import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error.name === "ChunkLoadError") {
      window.location.reload();
    } else {
      console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // ▼▼▼ بداية التعديل: تمت إزالة الوسوم المسببة للمشكلة فقط ▼▼▼
      return (
        <>
          <h2>حدث خطأ ما.</h2>
          <p>نحن نعمل على إصلاحه. الرجاء محاولة إعادة تحميل الصفحة.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
            }}
          >
            حاول مرة أخرى
          </button>
        </>
      );
      // ▲▲▲ نهاية التعديل ▲▲▲
    }

    return this.props.children;
  }
}
