import { useNavigate } from 'react-router-dom'
import { Refrigerator, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card } from '../ui'
import { useEstoqueMetrics } from '../../hooks/useEstoqueMetrics'
import { ENABLE_GELADEIRA } from '../../constants/flags'

export function EstoqueWidget() {
    const navigate = useNavigate()
    const { produtosBaixoEstoque, loading } = useEstoqueMetrics()

    const handleNavigate = () => {
        if (ENABLE_GELADEIRA) {
            navigate('/estoque')
        } else {
            // Se não tem geladeira, vai para produtos
            // Idealmente filtraríamos na URL, mas o MVP de produtos não tem filtro de URL ainda.
            // Vamos apenas listar.
            navigate('/produtos')
        }
    }

    if (loading) {
        return (
            <Card className="h-full flex items-center justify-center p-6">
                <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
            </Card>
        )
    }

    const isAlert = produtosBaixoEstoque > 0
    const alertColor = isAlert ? 'bg-warning-50 text-warning-700 border-warning-200' : 'bg-success-50 text-success-700 border-success-200'
    const iconColor = isAlert ? 'text-warning-600' : 'text-success-600'

    return (
        <Card
            className={`border cursor-pointer transition-all hover:opacity-90 active:scale-95 ${alertColor}`}
            onClick={handleNavigate}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-white/50 ${iconColor}`}>
                    {isAlert ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle className="h-6 w-6" />}
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-tight">
                        {isAlert ? 'Atenção ao Estoque' : 'Estoque Saudável'}
                    </h3>
                    <p className="text-sm opacity-90 font-medium">
                        {isAlert
                            ? `${produtosBaixoEstoque} produto(s) abaixo do mínimo`
                            : 'Todos produtos abastecidos'
                        }
                    </p>
                </div>
            </div>

            {/* Context Label */}
            <div className="mt-3 flex items-center gap-1 text-xs opacity-75 justify-end uppercase tracking-wide font-bold">
                <Refrigerator className="h-3 w-3" />
                <span>Inventário</span>
            </div>
        </Card>
    )
}
