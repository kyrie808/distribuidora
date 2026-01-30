import { create } from 'zustand'
import { startOfMonth, endOfMonth } from 'date-fns'

interface DashboardFilterState {
    startDate: Date
    endDate: Date
    setMonth: (date: Date) => void
    resetToCurrentMonth: () => void
}

export const useDashboardFilter = create<DashboardFilterState>((set) => ({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    setMonth: (date: Date) => {
        set({
            startDate: startOfMonth(date),
            endDate: endOfMonth(date),
        })
    },
    resetToCurrentMonth: () => {
        const now = new Date()
        set({
            startDate: startOfMonth(now),
            endDate: endOfMonth(now),
        })
    },
}))
