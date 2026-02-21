import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingCart, Menu, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#102210] border-t border-gray-100 dark:border-gray-800 safe-bottom">
            <div className="flex items-end justify-between px-2 pb-2 h-16">

                {/* Dashboard */}
                <NavButton
                    active={isActive('/')}
                    onClick={() => navigate('/')}
                    icon={LayoutDashboard}
                    label="Início"
                />

                {/* Clientes */}
                <NavButton
                    active={isActive('/contatos')}
                    onClick={() => navigate('/contatos')}
                    icon={Users}
                    label="Clientes"
                />

                {/* NOVA VENDA (FAB) */}
                <div className="relative -top-5 mx-2">
                    <button
                        onClick={() => navigate('/nova-venda')}
                        className="
                            flex items-center justify-center 
                            w-14 h-14 rounded-full 
                            bg-primary text-primary-foreground 
                            shadow-lg shadow-primary/30
                            border-4 border-gray-50
                            transform transition-transform active:scale-95
                        "
                        aria-label="Nova Venda"
                    >
                        <Plus className="h-7 w-7" />
                    </button>
                </div>

                {/* Vendas */}
                <NavButton
                    active={isActive('/vendas')}
                    onClick={() => navigate('/vendas')}
                    icon={ShoppingCart}
                    label="Vendas"
                />

                {/* Menu */}
                <NavButton
                    active={isActive('/menu')}
                    onClick={() => navigate('/menu')}
                    icon={Menu}
                    label="Menu"
                />
            </div>
        </nav>
    )
}

interface NavButtonProps {
    active: boolean
    onClick: () => void
    icon: LucideIcon
    label: string
}

function NavButton({ active, onClick, icon: Icon, label }: NavButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-lg transition-colors",
                "h-14 min-w-[3.5rem]", // Touch target
                active ? "text-primary" : "text-muted-foreground hover:bg-gray-50"
            )}
        >
            <Icon
                className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")}
                // @ts-ignore - Lucide icon types might conflict with style prop locally
                style={active ? { fill: 'currentColor', fillOpacity: 0.2 } : undefined}
            />
            <span className="text-[10px] font-medium leading-none">
                {label}
            </span>
        </button>
    )
}
