/**
 * Floating Dock Component - Adaptado da Aceternity UI
 * https://ui.aceternity.com/components/floating-dock
 * 
 * Animação de expansão apenas no desktop (mouse hover)
 * No mobile: tamanho fixo, sem expansão
 */

import { useRef, useState, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "../../utils/cn"

interface DockItem {
    title: string
    icon: React.ReactNode
    href: string
    isActive?: boolean
    isCenter?: boolean
}

interface FloatingDockProps {
    items: DockItem[]
    className?: string
    onItemClick?: (href: string) => void
}

// Hook para detectar dispositivo mobile (usa pointer: coarse para detectar touch primário)
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            // pointer: coarse = dispositivo touch como entrada primária
            // max-width: 768px = tela pequena
            const isTouchPrimary = window.matchMedia('(pointer: coarse)').matches
            const isSmallScreen = window.matchMedia('(max-width: 768px)').matches
            setIsMobile(isTouchPrimary && isSmallScreen)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return isMobile
}

export function FloatingDock({ items, className, onItemClick }: FloatingDockProps) {
    const mouseX = useMotionValue(Infinity)
    const isMobile = useIsMobile()

    // Separar itens: esquerda, centro, direita
    const centerIndex = items.findIndex(item => item.isCenter)
    const leftItems = items.slice(0, centerIndex)
    const centerItem = items[centerIndex]
    const rightItems = items.slice(centerIndex + 1)

    return (
        <motion.nav
            onMouseMove={(e) => !isMobile && mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={cn(
                "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
                "flex items-end justify-center gap-1 px-3 py-2",
                "bg-gray-900/90 backdrop-blur-xl",
                "border border-gray-700/50",
                "rounded-2xl shadow-2xl",
                // Mobile: max-width para caber na tela
                "max-w-[95vw]",
                className
            )}
        >
            {/* Itens da esquerda */}
            {leftItems.map((item) => (
                <DockIcon
                    key={item.href}
                    mouseX={mouseX}
                    isMobile={isMobile}
                    {...item}
                    onItemClick={onItemClick}
                />
            ))}

            {/* Botão central */}
            {centerItem && (
                <DockIcon
                    key={centerItem.href}
                    mouseX={mouseX}
                    isMobile={isMobile}
                    {...centerItem}
                    onItemClick={onItemClick}
                />
            )}

            {/* Itens da direita */}
            {rightItems.map((item) => (
                <DockIcon
                    key={item.href}
                    mouseX={mouseX}
                    isMobile={isMobile}
                    {...item}
                    onItemClick={onItemClick}
                />
            ))}
        </motion.nav>
    )
}

interface DockIconProps extends DockItem {
    mouseX: any
    isMobile: boolean
    onItemClick?: (href: string) => void
}

function DockIcon({ title, icon, href, isActive, isCenter, mouseX, isMobile, onItemClick }: DockIconProps) {
    const ref = useRef<HTMLButtonElement>(null)

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
        return val - bounds.x - bounds.width / 2
    })

    // No mobile: tamanho fixo. No desktop: animação de expansão
    const baseSize = isMobile ? 44 : 48
    const expandedSize = isMobile ? 44 : 64

    const widthTransform = useTransform(distance, [-100, 0, 100], [baseSize, expandedSize, baseSize])
    const heightTransform = useTransform(distance, [-100, 0, 100], [baseSize, expandedSize, baseSize])
    const iconScale = useTransform(distance, [-100, 0, 100], [1, isMobile ? 1 : 1.3, 1])

    const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 })
    const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 })
    const scale = useSpring(iconScale, { mass: 0.1, stiffness: 150, damping: 12 })

    // Botão central especial
    if (isCenter) {
        return (
            <motion.button
                ref={ref}
                onClick={() => onItemClick?.(href)}
                style={isMobile ? { width: 48, height: 48 } : { width, height }}
                className={cn(
                    "relative flex items-center justify-center rounded-full mx-1",
                    "bg-gradient-to-br from-primary-500 to-primary-600",
                    "shadow-lg shadow-primary-500/40",
                    "hover:shadow-xl hover:shadow-primary-500/50"
                )}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div style={isMobile ? {} : { scale }} className="text-white">
                    {icon}
                </motion.div>
            </motion.button>
        )
    }

    return (
        <motion.button
            ref={ref}
            onClick={() => onItemClick?.(href)}
            style={isMobile ? { width: baseSize, height: baseSize } : { width, height }}
            className={cn(
                "relative flex flex-col items-center justify-center rounded-xl",
                isActive ? "text-primary-400" : "text-gray-400 hover:text-white"
            )}
            whileTap={{ scale: 0.95 }}
        >
            <motion.div style={isMobile ? {} : { scale }}>
                {icon}
            </motion.div>

            {/* Label - sempre visível, sem background */}
            <span className={cn(
                "text-[9px] font-medium mt-0.5 whitespace-nowrap",
                isActive ? "text-primary-400" : "text-gray-500"
            )}>
                {title}
            </span>
        </motion.button>
    )
}
