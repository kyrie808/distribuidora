import { MapPin, DollarSign, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeliveryCardProps {
    id: string
    cliente: string
    endereco: string
    bairro: string | null
    total: number
    isSelected: boolean
    hasAddress: boolean
    onToggle: (id: string) => void
}

export function DeliveryCard({
    id,
    cliente,
    endereco,
    bairro,
    total,
    isSelected,
    hasAddress,
    onToggle
}: DeliveryCardProps) {
    // Generate avatar color from client name
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-500',
            'bg-violet-500',
            'bg-emerald-500',
            'bg-orange-500',
            'bg-pink-500',
            'bg-cyan-500'
        ]
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[hash % colors.length]
    }

    const initials = cliente
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()

    return (
        <div
            onClick={() => onToggle(id)}
            className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-white dark:bg-surface-dark",
                isSelected
                    ? "border-semantic-green shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5",
                    isSelected ? "bg-semantic-green border-semantic-green" : "border-gray-300 dark:border-gray-600"
                )}>
                    {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>

                {/* Avatar */}
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0", getAvatarColor(cliente))}>
                    {initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{cliente}</h4>
                        <div className="flex items-center gap-1 text-semantic-green font-bold text-sm flex-shrink-0">
                            <DollarSign className="w-3.5 h-3.5" />
                            {total.toFixed(2)}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        {bairro && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
                                {bairro}
                            </span>
                        )}
                        {!hasAddress && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Sem endereço
                            </span>
                        )}
                    </div>

                    {endereco && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {endereco}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
