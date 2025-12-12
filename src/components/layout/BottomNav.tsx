import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Plus, Share2, Bell, Package, Settings } from 'lucide-react'

const leftItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/contatos', icon: Users, label: 'Contatos' },
]

const rightItems = [
    { to: '/indicacoes', icon: Share2, label: 'Indicações' },
    { to: '/recompra', icon: Bell, label: 'Recompra' },
    { to: '/produtos', icon: Package, label: 'Produtos' },
    { to: '/configuracoes', icon: Settings, label: 'Config' },
]

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${isActive
                    ? 'text-primary-500 bg-primary-50 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`
            }
        >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium whitespace-nowrap">{label}</span>
        </NavLink>
    )
}

export function BottomNav() {
    const navigate = useNavigate()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 safe-bottom">
            <div className="relative flex items-center h-16 max-w-lg mx-auto">
                {/* Esquerda - scrollável */}
                <div
                    className="flex-1 flex items-center justify-end gap-1 pr-10 overflow-x-auto scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {leftItems.map((item) => (
                        <NavItem key={item.to} {...item} />
                    ))}
                </div>

                {/* Botão Central FAB - FIXO */}
                <button
                    onClick={() => navigate('/nova-venda')}
                    className="absolute left-1/2 -translate-x-1/2 -top-5 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-110 active:scale-95 transition-all duration-200 z-20"
                >
                    <Plus className="h-7 w-7 text-white" />
                </button>

                {/* Direita - scrollável */}
                <div
                    className="flex-1 flex items-center gap-1 pl-10 overflow-x-auto scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {rightItems.map((item) => (
                        <NavItem key={item.to} {...item} />
                    ))}
                </div>
            </div>

            {/* CSS para esconder scrollbar */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
        </nav>
    )
}
