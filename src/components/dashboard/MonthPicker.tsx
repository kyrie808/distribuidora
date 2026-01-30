import { useMemo } from 'react'
import { Select } from '../ui/Select'
import { useDashboardFilter } from '../../hooks/useDashboardFilter'
import { subMonths, format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function MonthPicker() {
    const { startDate, setMonth } = useDashboardFilter()

    const options = useMemo(() => {
        const today = new Date()
        const months = []
        for (let i = 0; i < 12; i++) {
            const date = subMonths(today, i)
            const value = startOfMonth(date).toISOString()
            const label = format(date, "MMMM 'de' yyyy", { locale: ptBR })
            months.push({
                value,
                label: label.charAt(0).toUpperCase() + label.slice(1)
            })
        }
        return months
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDate = new Date(e.target.value)
        setMonth(selectedDate)
    }

    // Ensures the Select value matches one of the options
    const currentValue = startOfMonth(startDate).toISOString()

    return (
        <div className="w-full sm:w-64">
            <Select
                options={options}
                value={currentValue}
                onChange={handleChange}
                className="bg-white/90 backdrop-blur border-none shadow-sm"
            />
        </div>
    )
}
