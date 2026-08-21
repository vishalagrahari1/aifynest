/* src/components/shared/Toast.tsx */
import React, { useEffect } from 'react';
import { Check, X } from './Icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'var(--color-success-light)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success)',
        };
      case 'error':
        return {
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
          border: '1px solid var(--color-danger)',
        };
      default:
        return {
          backgroundColor: 'var(--color-info-light)',
          color: 'var(--color-info)',
          border: '1px solid var(--color-info)',
        };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 10000,
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--shadow-xl)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        animation: 'slide-in-toast 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        ...getStyle(),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {type === 'success' ? <Check size={18} /> : <X size={18} />}
      </div>
      <div style={{ flex: 1 }}>{message}</div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        <X size={16} />
      </button>
      <style>{`
        @keyframes slide-in-toast {
          0% {
            transform: translateX(120%) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
