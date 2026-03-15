import { useState } from 'react'
import { createPortal } from 'react-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { Header } from '../components/layout/Header'
import { Plus, LayoutGrid, FileText } from 'lucide-react'
import { usePlanoDeContas } from '../hooks/usePlanoDeContas'
import { PlanoContaModal } from '../components/features/financeiro/PlanoContaModal'

export function PlanoDeContas() {
    const { planoContas, isLoading } = usePlanoDeContas()
    const [activeTab, setActiveTab] = useState<'receita' | 'despesa'>('receita')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const filteredPlano = planoContas.filter(item => item.tipo === activeTab)

    return (
        <PageContainer className="pb-24">
            <Header title="Plano de Contas" showBack centerTitle />

            <div className="px-4 py-6">
                {/* Tabs */}
                <div className="flex bg-card rounded-xl p-1 shadow-sm mb-6 border border-border">
                    <button
                        onClick={() => setActiveTab('receita')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'receita'
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Receitas
                    </button>
                    <button
                        onClick={() => setActiveTab('despesa')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'despesa'
                            ? 'bg-red-50 text-red-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Despesas
                    </button>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p>Carregando categorias...</p>
                        </div>
                    ) : filteredPlano.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-card rounded-2xl border border-dashed border-border">
                            <LayoutGrid size={48} className="mb-4 opacity-20" />
                            <p>Nenhuma categoria encontrada</p>
                        </div>
                    ) : (
                        filteredPlano.map((item) => (
                            <div
                                key={item.id}
                                className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.tipo === 'receita' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{item.nome}</h3>
                                        <span className="text-xs text-slate-500 uppercase font-medium tracking-wider">
                                            {item.categoria}
                                        </span>
                                    </div>
                                </div>
                                {!item.ativo && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">
                                        Inativo
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* FAB — portaled to escape stacking context */}
            {createPortal(
                <button
                    aria-label="Nova categoria"
                    onClick={() => setIsModalOpen(true)}
                    className="fixed right-6 bottom-24 w-14 h-14 bg-violet-600 text-white rounded-full shadow-lg shadow-violet-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[9997]"
                >
                    <Plus size={24} />
                </button>,
                document.body
            )}

            <PlanoContaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                defaultType={activeTab}
            />
        </PageContainer>
    )
}
