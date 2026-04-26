'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastItem = { id: number; message: string; visible: boolean }
type ToastContextType = { showToast: (message: string) => void }

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastEntry({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`bg-ink text-cream font-mono text-xs px-4 py-3 border border-ink/80
                  shadow-lg transition-all duration-300
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {message}
    </div>
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((message: string) => {
    const id = ++counterRef.current
    // Mount with visible:false so transition fires
    setToasts((prev) => [...prev, { id, message, visible: false }])

    // Trigger enter transition on next tick
    requestAnimationFrame(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: true } : t))
      )
    })

    // Start exit after 2.7s, remove after 3s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      )
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 300)
    }, 2700)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — bottom-right, above everything */}
      <div
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastEntry key={t.id} message={t.message} visible={t.visible} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
