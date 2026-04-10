import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const success = (msg: string) => addToast('success', msg);
  const error = (msg: string) => addToast('error', msg);
  const info = (msg: string) => addToast('info', msg);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={(id) => setToasts(t => t.filter(x => x.id !== id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast: React.FC<{ toast: ToastItem; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - (100 / 40))); // 4s = 4000ms, each 100ms
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const icons = {
    success: <CheckCircle className="text-bd-success" size={20} />,
    error: <AlertCircle className="text-bd-error" size={20} />,
    info: <Info className="text-bd-info" size={20} />,
  };

  return (
    <div className="relative overflow-hidden min-w-[300px] bg-bd-medium border border-bd-border p-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300">
      {icons[toast.type]}
      <p className="text-bd-text text-sm flex-1">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="text-bd-muted hover:text-bd-text transition-colors">
        <X size={18} />
      </button>
      <div 
        className={`absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear ${
          toast.type === 'success' ? 'bg-bd-success' : toast.type === 'error' ? 'bg-bd-error' : 'bg-bd-info'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
