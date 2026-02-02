import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingCart, Menu, Plus } from 'lucide-react'

export function BottomNav() {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-50 safe-bottom h-[60px]">
            {/* Início */}
            <button
                onClick={() => navigate('/')}
                className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-primary-600' : 'text-gray-400'}`}
            >
                <LayoutDashboard className="h-6 w-6" />
                <span className="text-[10px] font-medium">Início</span>
            </button>

            {/* Clientes */}
            <button
                onClick={() => navigate('/contatos')}
                className={`flex flex-col items-center gap-1 ${isActive('/contatos') ? 'text-primary-600' : 'text-gray-400'}`}
            >
                <Users className="h-6 w-6" />
                <span className="text-[10px] font-medium">Clientes</span>
            </button>

            {/* NOVA VENDA (FAB) */}
            <div className="relative -mt-12">
                <button
                    onClick={() => navigate('/nova-venda')}
                    className="bg-primary-600 text-white p-3.5 rounded-full shadow-lg hover:bg-primary-700 transition-colors active:scale-95 border-4 border-white"
                    aria-label="Nova Venda"
                >
                    <Plus className="h-8 w-8" />
                </button>
            </div>

            {/* Vendas */}
            <button
                onClick={() => navigate('/vendas')}
                className={`flex flex-col items-center gap-1 ${isActive('/vendas') ? 'text-primary-600' : 'text-gray-400'}`}
            >
                <ShoppingCart className="h-6 w-6" />
                <span className="text-[10px] font-medium">Vendas</span>
            </button>

            {/* Menu */}
            <button
                onClick={() => navigate('/menu')}
                className={`flex flex-col items-center gap-1 ${isActive('/menu') ? 'text-primary-600' : 'text-gray-400'}`}
            >
                <Menu className="h-6 w-6" />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </nav>
    )
}
