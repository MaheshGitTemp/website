// src/components/hooks/ToastContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// ── Toast types → colors + icons ─────────────────────────────────────────────
const TOAST_STYLES = {
  success: {
    background: '#e6f9ee',
    border:     '1px solid #4CAF50',
    color:      '#2e7d32',
    icon:       'far fa-check-circle',
    bar:        '#4CAF50'
  },
  error: {
    background: '#fdecea',
    border:     '1px solid #f44336',
    color:      '#c62828',
    icon:       'fas fa-times-circle',
    bar:        '#f44336'
  },
  warning: {
    background: '#fff8e1',
    border:     '1px solid #FFC107',
    color:      '#f57f17',
    icon:       'fas fa-exclamation-triangle',
    bar:        '#FFC107'
  },
  info: {
    background: '#e8f4fd',
    border:     '1px solid #2196F3',
    color:      '#0d47a1',
    icon:       'fas fa-info-circle',
    bar:        '#2196F3'
  }
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ title, description, type = 'success', duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, description, type, duration }]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

// ── Toast Container — fixed bottom-right ──────────────────────────────────────
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position:   'fixed',
      bottom:     '24px',
      right:      '24px',
      zIndex:     99999,
      display:    'flex',
      flexDirection: 'column',
      gap:        '10px',
      maxWidth:   '360px',
      width:      '100%'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// ── Single Toast ──────────────────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
  const { title, description, type, duration } = toast;
  const style = TOAST_STYLES[type] || TOAST_STYLES.success;

  return (
    <div style={{
      background:   style.background,
      border:       style.border,
      borderRadius: '8px',
      boxShadow:    '0 4px 12px rgba(0,0,0,0.15)',
      overflow:     'hidden',
      animation:    'toastSlideIn 0.3s ease',
      position:     'relative'
    }}>
      {/* Progress bar */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        height:     '3px',
        background: style.bar,
        width:      '100%',
        animation:  `toastProgress ${duration}ms linear forwards`
      }} />

      {/* Content */}
      <div style={{
        display:    'flex',
        alignItems: 'flex-start',
        padding:    '14px 16px',
        gap:        '12px'
      }}>
        {/* Icon */}
        <i className={style.icon} style={{
          color:     style.bar,
          fontSize:  '18px',
          marginTop: '1px',
          flexShrink: 0
        }} />

        {/* Text */}
        <div style={{ flex: 1 }}>
          {title && (
            <div style={{
              fontWeight:   '700',
              fontSize:     '14px',
              color:        style.color,
              marginBottom: description ? '3px' : 0
            }}>
              {title}
            </div>
          )}
          {description && (
            <div style={{
              fontSize: '13px',
              color:    style.color,
              opacity:  0.9
            }}>
              {description}
            </div>
          )}
        </div>

        {/* Close button */}
        <button onClick={onClose} style={{
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          color:      style.color,
          opacity:    0.6,
          fontSize:   '16px',
          padding:    '0',
          lineHeight: 1,
          flexShrink: 0
        }}>
          &times;
        </button>
      </div>

      {/* CSS animations — injected once */}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  );
};