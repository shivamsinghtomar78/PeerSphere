'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  visible: boolean; // drives CSS animation
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Config ───────────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'var(--ps-success)',
  error: 'var(--ps-danger)',
  warning: 'var(--ps-warning)',
  info: 'var(--ps-info)',
};

const ICON_COLORS: Record<ToastType, string> = {
  success: 'var(--ps-success)',
  error: 'var(--ps-danger)',
  warning: 'var(--ps-warning)',
  info: 'var(--ps-info)',
};

const AUTO_DISMISS_MS = 3000;
const MAX_VISIBLE = 3;

// ─── Single Toast ─────────────────────────────────────────────────────────────

interface SingleToastProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

function SingleToast({ item, onDismiss }: SingleToastProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        // Glass card look
        background: 'var(--ps-surface, rgba(255,255,255,0.08))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--ps-border-subtle, rgba(255,255,255,0.12))',
        borderLeft: `4px solid ${BORDER_COLORS[item.type]}`,
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        // Layout
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        minWidth: '260px',
        maxWidth: '360px',
        // Animation: slide in from right when visible, slide out when not
        transform: item.visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: item.visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
        willChange: 'transform, opacity',
      }}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        style={{
          color: ICON_COLORS[item.type],
          fontSize: '15px',
          fontWeight: 700,
          lineHeight: 1,
          flexShrink: 0,
          width: '18px',
          textAlign: 'center',
        }}
      >
        {ICONS[item.type]}
      </span>

      {/* Message */}
      <span
        style={{
          flex: 1,
          fontSize: '13px',
          lineHeight: '1.4',
          color: 'var(--ps-text, inherit)',
        }}
      >
        {item.message}
      </span>

      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          lineHeight: 1,
          fontSize: '14px',
          color: 'var(--ps-text-muted, #888)',
          flexShrink: 0,
          borderRadius: '4px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            'var(--ps-text, inherit)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            'var(--ps-text-muted, #888)';
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Track per-toast timers so we can clear them on manual dismiss
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    // First animate out, then remove from DOM
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 350); // matches transition duration
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setToasts((prev) => {
        // Keep only last MAX_VISIBLE - 1 toasts, then append new one
        const trimmed = prev.slice(-(MAX_VISIBLE - 1));
        return [...trimmed, { id, message, type, visible: false }];
      });

      // On the next tick, flip visible → true to trigger the slide-in animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, visible: true } : t))
          );
        });
      });

      // Auto-dismiss after AUTO_DISMISS_MS
      const timer = setTimeout(() => remove(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [remove]
  );

  // Clean up all timers on unmount
  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleDismiss = useCallback(
    (id: string) => {
      const timer = timers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
      remove(id);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Fixed toast container — bottom-right */}
      <div
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: '24px',  // bottom-6
          right: '24px',   // right-6
          zIndex: 50,      // z-50
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((item) => (
          <div key={item.id} style={{ pointerEvents: 'auto' }}>
            <SingleToast item={item} onDismiss={handleDismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
