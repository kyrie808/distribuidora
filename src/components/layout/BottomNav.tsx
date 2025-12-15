import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingCart, Plus, Share2, Bell, Package, Settings } from 'lucide-react'
import { FloatingDock } from '../ui/FloatingDock'

const navItems = [
    { href: '/', icon: <LayoutDashboard className="h-5 w-5" />, title: 'Dashboard' },
    { href: '/contatos', icon: <Users className="h-5 w-5" />, title: 'Contatos' },
    { href: '/vendas', icon: <ShoppingCart className="h-5 w-5" />, title: 'Vendas' },
    { href: '/indicacoes', icon: <Share2 className="h-5 w-5" />, title: 'Indicações' },
    { href: '/nova-venda', icon: <Plus className="h-6 w-6" />, title: 'Nova Venda', isCenter: true },
    { href: '/recompra', icon: <Bell className="h-5 w-5" />, title: 'Recompra' },
    { href: '/produtos', icon: <Package className="h-5 w-5" />, title: 'Produtos' },
    { href: '/configuracoes', icon: <Settings className="h-5 w-5" />, title: 'Config' },
]

export function BottomNav() {
    const navigate = useNavigate()
    const location = useLocation()

    const itemsWithActive = navItems.map(item => ({
        ...item,
        isActive: location.pathname === item.href
    }))

    return (
        <FloatingDock
            items={itemsWithActive}
            onItemClick={(href) => navigate(href)}
        />
    )
}
