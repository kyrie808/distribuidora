import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Menu,
    Bell,
    TrendingUp,
    TrendingDown,
    ArrowUp,
    ChevronRight,
    Truck,
    Map as MapIcon
} from 'lucide-react'
import { AlertasFinanceiroWidget } from '../components/dashboard/AlertasFinanceiroWidget'
import { AlertasRecompraWidget } from '../components/dashboard/AlertasRecompraWidget'
import { MonthPicker } from '../components/dashboard/MonthPicker'
import { useVendas } from '../hooks/useVendas'
import { useContatos } from '../hooks/useContatos'
import { useRecompra } from '../hooks/useRecompra'
import { useIndicacoes } from '../hooks/useIndicacoes'
import { useAlertasFinanceiros } from '../hooks/useAlertasFinanceiros'
import { useDashboardFilter } from '../hooks/useDashboardFilter'
import { formatCurrency } from '../utils/formatters'
import { cn } from '@/lib/utils'

export function Dashboard() {
    const navigate = useNavigate()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { startDate, endDate } = useDashboardFilter()

    // Fetch data
    const { metrics, loading: loadingVendas, refetch: refetchVendas } = useVendas({ startDate, endDate })
    const { loading: loadingContatos, refetch: refetchContatos } = useContatos({})
    const { contatos: recompraContatos, atrasados: atrasadosRecompra, loading: loadingRecompra, refetch: refetchRecompra } = useRecompra()
    const { loading: loadingIndicacoes, refetch: refetchIndicacoes } = useIndicacoes()
    const { loading: loadingFinanceiro, refetch: refetchFinanceiro } = useAlertasFinanceiros()

    const loading = loadingVendas || loadingContatos || loadingRecompra || loadingIndicacoes || loadingFinanceiro

    // Pull to refresh action
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        await Promise.all([
            refetchVendas(),
            refetchContatos(),
            refetchRecompra(),
            refetchIndicacoes(),
            refetchFinanceiro()
        ])
        setIsRefreshing(false)
    }, [refetchVendas, refetchContatos, refetchRecompra, refetchIndicacoes, refetchFinanceiro])

    // Calculations for Progress Bars
    const revenueTarget = 150000
    const revenueProgress = Math.min((metrics.faturamentoMes / revenueTarget) * 100, 100)
    const marginPercent = metrics.faturamentoMes > 0 ? (metrics.lucroMes / metrics.faturamentoMes) * 100 : 0
    const ordersTarget = 100
    const ordersProgress = Math.min((metrics.vendasMes / ordersTarget) * 100, 100)

    if (loading && !isRefreshing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#102210] relative overflow-hidden">
                {/* Background Pattern for Loading Screen */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin z-10" />
                <p className="text-primary/70 animate-pulse font-mono tracking-widest text-xs uppercase z-10">Initializing Tactical Command...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#102210] text-foreground pb-24 font-body relative selection:bg-primary/30">

            {/* GLOBAL BACKGROUND TEXTURE (The Fix for "Flat Green") */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* 1. Base Gradient to remove flatness */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1a2e1a] via-[#102210] to-[#0a160a]" />

                {/* 2. Tactical Grid Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* 3. Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-40" />
            </div>

            {/* Header - Tactical Command */}
            <header className="flex items-center px-6 py-4 justify-between sticky top-0 z-50 bg-[#102210]/80 backdrop-blur-md border-b border-white/5 shadow-sm">
                <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                    <Menu className="h-6 w-6 text-foreground" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-center text-white flex-1 font-mono uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    Tactical Command
                </h1>
                <button
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 transition-colors relative border border-transparent hover:border-white/10"
                    onClick={handleRefresh}
                >
                    <Bell className={cn("h-6 w-6 text-foreground", isRefreshing && "animate-spin")} />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-[#102210] shadow-[0_0_5px_var(--destructive)]"></span>
                </button>
            </header>

            <main className="flex-1 flex flex-col gap-6 px-4 py-6 max-w-md mx-auto w-full relative z-10">

                {/* Month Selector - Wrapped to remove "Old Clothes" look */}
                <div className="w-full bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl p-1 shadow-sm">
                    <MonthPicker />
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Revenue Card */}
                    <div className="col-span-2 sm:col-span-1 flex flex-col gap-3 rounded-2xl p-5 bg-card/90 border border-primary/20 shadow-[0_0_15px_rgba(19,236,19,0.15)] backdrop-blur-sm relative overflow-hidden group hover:bg-card/95 transition-all">
                        <div className="flex justify-between items-start z-10">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Revenue (MTD)</span>
                                <span className="text-3xl font-bold text-white mt-1 drop-shadow-sm">{formatCurrency(metrics.faturamentoMes)}</span>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary border border-primary/20">
                                <TrendingUp className="h-4 w-4" /> 12%
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden z-10 box-border border-b border-white/5">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_var(--primary)]"
                                style={{ width: `${revenueProgress}%` }}
                            />
                        </div>
                        <span className="text-xs text-zinc-500 z-10">Target: {formatCurrency(revenueTarget)}</span>

                        {/* Decor */}
                        <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="h-24 w-24 -mr-4 -mb-4 text-primary" />
                        </div>
                    </div>

                    {/* Margin Card */}
                    <div className="col-span-1 flex flex-col gap-3 rounded-2xl p-5 bg-card/60 border border-white/5 shadow-sm hover:border-white/10 transition-colors backdrop-blur-sm">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Margin</span>
                            <span className="text-2xl font-bold text-foreground mt-1">{marginPercent.toFixed(1)}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-accent h-full rounded-full transition-all duration-1000 shadow-[0_0_5px_var(--accent)]"
                                style={{ width: `${marginPercent}%` }}
                            />
                        </div>
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive border border-destructive/20">
                            <TrendingDown className="h-3 w-3" /> 1.5%
                        </span>
                    </div>

                    {/* Orders Card */}
                    <div className="col-span-1 flex flex-col gap-3 rounded-2xl p-5 bg-card/60 border border-white/5 shadow-sm hover:border-white/10 transition-colors backdrop-blur-sm">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Orders</span>
                            <span className="text-2xl font-bold text-foreground mt-1">{metrics.vendasMes}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_5px_#3b82f6]"
                                style={{ width: `${ordersProgress}%` }}
                            />
                        </div>
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary border border-primary/20">
                            <ArrowUp className="h-3 w-3" /> 5%
                        </span>
                    </div>
                </div>

                {/* War Zone Section (Alerts) */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_var(--destructive)]"></span>
                            War Zone
                        </h2>
                        <button
                            className="text-xs font-medium text-zinc-400 hover:text-primary transition-colors"
                            onClick={() => navigate('/vendas?status=atrasado')}
                        >
                            View All
                        </button>
                    </div>

                    <AlertasFinanceiroWidget />
                    <AlertasRecompraWidget
                        contatos={recompraContatos}
                        atrasados={atrasadosRecompra}
                        loading={loadingRecompra}
                    />
                </div>

                {/* Logistics Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-white">Live Logistics</h2>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl bg-card/80 border border-white/5 p-4 shadow-sm hover:border-primary/20 transition-all group backdrop-blur-sm">
                        <div className="relative h-16 w-16 shrink-0 flex items-center justify-center rounded-full border-4 border-primary/10 bg-primary/5 group-hover:border-primary/30 transition-colors">
                            <Truck className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-1">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-foreground">Deliveries Today</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wide border border-primary/20">
                                    Active
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground mb-2">Driver: System Auto-Route</p>

                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_5px_var(--primary)]"></div>
                                    <span className="text-xs font-medium text-zinc-400">{metrics.entregasRealizadas} Done</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-white/20"></div>
                                    <span className="text-xs font-medium text-zinc-500">{metrics.entregasPendentes} Left</span>
                                </div>
                            </div>
                        </div>
                        <button
                            className="shrink-0 h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                            onClick={() => navigate('/entregas')}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Logistics Map View */}
                <div
                    className="w-full h-32 rounded-2xl bg-card/80 relative overflow-hidden group cursor-pointer border border-white/5 shadow-md hover:shadow-lg transition-all backdrop-blur-sm"
                    onClick={() => navigate('/entregas')}
                >
                    {/* Map Grid Pattern */}
                    <div className="absolute inset-0 bg-[#0c1a0c] flex items-center justify-center opacity-80">
                        <div className="grid grid-cols-6 grid-rows-3 gap-8 opacity-10 transform -rotate-12 scale-150 w-full h-full">
                            {[...Array(18)].map((_, i) => (
                                <div key={i} className="h-full w-px bg-primary/30"></div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent flex items-center p-6">
                        <div>
                            <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1 drop-shadow-[0_0_5px_rgba(19,236,19,0.5)]">Live Tracking</p>
                            <h3 className="text-white text-lg font-bold">Fleet Map View</h3>
                        </div>
                        <div className="ml-auto bg-primary/20 p-2 rounded-full group-hover:bg-primary/30 transition-colors border border-primary/20">
                            <MapIcon className="text-primary h-6 w-6" />
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}