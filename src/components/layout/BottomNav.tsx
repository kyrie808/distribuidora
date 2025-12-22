import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingCart, Plus, Share2, Bell, Package, Settings, Refrigerator, Truck } from 'lucide-react'
import { FloatingDock } from '../ui/FloatingDock'
import { ENABLE_GELADEIRA, ENABLE_RECOMPRA } from '../../constants/flags'

const allNavItems = [
    { href: '/', icon: <LayoutDashboard className="h-5 w-5" />, title: 'Dashboard' },
    { href: '/contatos', icon: <Users className="h-5 w-5" />, title: 'Contatos' },
    { href: '/vendas', icon: <ShoppingCart className="h-5 w-5" />, title: 'Vendas' },
    { href: '/entregas', icon: <Truck className="h-5 w-5" />, title: 'Entregas' },
    { href: '/nova-venda', icon: <Plus className="h-6 w-6" />, title: 'Nova Venda', isCenter: true },
    { href: '/indicacoes', icon: <Share2 className="h-5 w-5" />, title: 'Indicações' },
    { href: '/recompra', icon: <Bell className="h-5 w-5" />, title: 'Recompra', requiresFlag: 'recompra' },
    { href: '/produtos', icon: <Package className="h-5 w-5" />, title: 'Produtos' },
    { href: '/estoque', icon: <Refrigerator className="h-5 w-5" />, title: 'Geladeira', requiresFlag: 'geladeira' },
    { href: '/configuracoes', icon: <Settings className="h-5 w-5" />, title: 'Config' },
]

// Filtrar itens baseado em feature flags
const navItems = allNavItems.filter(item => {
    if (item.requiresFlag === 'recompra') return ENABLE_RECOMPRA
    if (item.requiresFlag === 'geladeira') return ENABLE_GELADEIRA
    return true
})

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
