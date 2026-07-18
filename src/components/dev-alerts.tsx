// components/dev-alerts.tsx
'use client';

import { useEffect, useState } from 'react';

export function DevAlerts({ alerts }: { alerts: any[] }) {
  const [visible, setVisible] = useState(true);
  const [autoHide, setAutoHide] = useState(true);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // التحقق من بيئة التطوير
    setIsDev(process.env.NODE_ENV === 'development');
    
    // التحقق من localStorage
    const hideRequested = localStorage.getItem('hideDevAlerts') === 'true';
    if (hideRequested) {
      setVisible(false);
    }

    // إخفاء تلقائي بعد 30 ثانية
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [autoHide]);

  // ⭐⭐ لا تظهر إذا لم تكن في وضع التطوير
  if (!isDev) {
    return null;
  }

  if (!visible || alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]"> {/* ⬅️ زيادة z-index */}
      <div className="max-w-4xl mx-auto p-2">
        <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm">🔧 إشعارات التطوير</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setAutoHide(!autoHide)}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
              >
                {autoHide ? '⏸ إيقاف الإخفاء' : '▶ استئناف الإخفاء'}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('hideDevAlerts', 'true');
                  setVisible(false);
                }}
                className="text-xs bg-red-700 hover:bg-red-600 px-2 py-1 rounded"
              >
                ✕ إخفاء
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.map((alert, index) => (
              <div 
                key={index}
                className={`text-xs p-2 rounded ${
                  alert.type === 'error' ? 'bg-red-900/50 border-l-4 border-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-900/50 border-l-4 border-yellow-500' :
                  'bg-green-900/50 border-l-4 border-green-500'
                }`}
              >
                <div className="font-medium">{alert.title}</div>
                <div className="text-gray-300">{alert.message}</div>
                {alert.details && (
                  <div className="text-gray-400 text-xs mt-1">{alert.details}</div>
                )}
                {alert.link && (
                  <a 
                    href={alert.link}
                    target="_blank"
                    className="text-blue-300 hover:text-blue-200 text-xs mt-1 inline-block"
                  >
                    ⇢ معرفة المزيد
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}