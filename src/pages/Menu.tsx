import { useNavigate } from 'react-router-dom'
import {
    Truck,
    Package,
    Bell,
    Share2,
    Settings,
    ClipboardList,
    Refrigerator
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui'
import { ENABLE_GELADEIRA, ENABLE_RECOMPRA } from '../constants/flags'

export function Menu() {
    const navigate = useNavigate()

    const menuItems = [
        {
            title: 'Entregas',
            icon: <Truck className="h-8 w-8 text-primary-500" />,
            href: '/entregas',
            visible: true
        },
        {
            title: 'Estoque / Geladeira',
            icon: <Refrigerator className="h-8 w-8 text-blue-500" />,
            href: '/estoque',
            visible: ENABLE_GELADEIRA
        },
        {
            title: 'Pedidos Compra',
            icon: <Package className="h-8 w-8 text-orange-500" />,
            href: '/pedidos-compra',
            visible: true
        },
        {
            title: 'Recompra',
            icon: <Bell className="h-8 w-8 text-red-500" />,
            href: '/recompra',
            visible: ENABLE_RECOMPRA
        },
        {
            title: 'Indicações',
            icon: <Share2 className="h-8 w-8 text-green-500" />,
            href: '/indicacoes',
            visible: true
        },
        {
            title: 'Produtos',
            icon: <Package className="h-8 w-8 text-purple-500" />,
            href: '/produtos',
            visible: true
        },
        {
            title: 'Relatório Fábrica',
            icon: <ClipboardList className="h-8 w-8 text-gray-600" />,
            href: '/relatorio-fabrica',
            visible: true
        },
        {
            title: 'Configurações',
            icon: <Settings className="h-8 w-8 text-gray-500" />,
            href: '/configuracoes',
            visible: true
        }
    ]

    return (
        <>
            <Header title="Menu" showBack />
            <PageContainer>
                <div className="grid grid-cols-2 gap-4 pb-20">
                    {menuItems.filter(item => item.visible).map((item) => (
                        <Card
                            key={item.href}
                            className="flex flex-col items-center justify-center py-6 gap-3 cursor-pointer hover:bg-gray-50 transition-all active:scale-95 border-2 border-transparent hover:border-primary-100 shadow-sm"
                            onClick={() => navigate(item.href)}
                        >
                            <div className="p-3 rounded-full bg-gray-50">
                                {item.icon}
                            </div>
                            <span className="font-semibold text-gray-700 text-center text-sm">{item.title}</span>
                        </Card>
                    ))}
                </div>
            </PageContainer>
        </>
    )
}
