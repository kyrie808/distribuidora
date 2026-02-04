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
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">
                <Header
                    title="Menu"
                    showBack
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                />
                <PageContainer className="pt-0 pb-32 bg-transparent px-4">
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
            </div>
        </div>
    )
}
