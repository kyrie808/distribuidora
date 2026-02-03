
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://herlvujykltxnwqmwmyx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlcmx2dWp5a2x0eG53cW13bXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjc3MDcsImV4cCI6MjA4MDkwMzcwN30.eUT-obnvG_CERXdbSfUvPIHro_kiceyH9I7TPRCRnLM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyRevenue() {
    console.log('Verifying Revenue for January 2026...')

    // Dates: Jan 1 00:00 to Jan 31 23:59
    const start = '2026-01-01T00:00:00.000Z'
    const end = '2026-01-31T23:59:59.999Z'

    const { data, error } = await supabase
        .from('vendas')
        .select('total, data, criado_em, pago')
        .gte('data', start)
        .lte('data', end)

    if (error) {
        console.error('Error fetching data:', error)
        return
    }

    const total = data.reduce((acc, venda) => acc + (venda.total || 0), 0)
    const paidRevenue = data.filter(v => v.pago).reduce((acc, v) => acc + (v.total || 0), 0)

    console.log(`\n----------------------------------------`)
    console.log(`Querying by SALE DATE (2026-01-01 to 2026-01-31)`)
    console.log(`Total Count: ${data.length}`)
    console.log(`Total (Accrual): ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
    console.log(`Paid (Cash Basis): ${paidRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <--- CORRECT VALUE`)

    if (Math.abs(paidRevenue - 5367) < 1) {
        console.log(`\nSUCCESS: Logic matches expected clean data (5367).`)
        console.log(`If you see 5392 in dashboard, it is caching the extra R$ 25.00 transaction (Dec 23rd).`)
        console.log(`Please restart the dev server: npm run dev`)
    } else {
        console.log(`\nWARNING: Mismatch detected.`)
    }
    console.log(`----------------------------------------\n`)
}

verifyRevenue()
