import { create } from 'zustand'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastStore {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9)
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }))

        // Auto remove after duration
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }))
        }, toast.duration || 3000)
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}))

// Hook for easy toast usage
export function useToast() {
    const addToast = useToastStore((state) => state.addToast)

    return {
        success: (message: string, duration?: number) =>
            addToast({ type: 'success', message, duration }),
        error: (message: string, duration?: number) =>
            addToast({ type: 'error', message, duration }),
        info: (message: string, duration?: number) =>
            addToast({ type: 'info', message, duration }),
        warning: (message: string, duration?: number) =>
            addToast({ type: 'warning', message, duration }),
    }
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
}

const colors = {
    success: 'bg-success-50 text-success-600 border-success-200',
    error: 'bg-danger-50 text-danger-600 border-danger-200',
    info: 'bg-primary-50 text-primary-600 border-primary-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
}

function ToastItem({ toast }: { toast: Toast }) {
    const removeToast = useToastStore((state) => state.removeToast)
    const Icon = icons[toast.type]

    return (
        <div
            className={`
        flex items-center gap-3 p-4 rounded-lg border shadow-lg
        animate-in slide-in-from-right duration-300
        ${colors[toast.type]}
      `}
        >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded hover:bg-black/10 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

export function ToastContainer() {
    const toasts = useToastStore((state) => state.toasts)

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    )
}
