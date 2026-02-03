
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://herlvujykltxnwqmwmyx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlcmx2dWp5a2x0eG53cW13bXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjc3MDcsImV4cCI6MjA4MDkwMzcwN30.eUT-obnvG_CERXdbSfUvPIHro_kiceyH9I7TPRCRnLM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyAReceber() {
    console.log('Verifying A Receber (Unpaid Sales) for January 2026...')

    // Dates: Jan 1 to Jan 31
    const start = '2026-01-01'
    const end = '2026-01-31'

    const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .gte('data', start)
        .lte('data', end)
        .eq('pago', false)
        .neq('status', 'cancelada')
        .order('data', { ascending: true })

    if (error) {
        console.error('Error fetching data:', error)
        return
    }

    console.log(`\n----------------------------------------`)
    console.log(`Count: ${data.length}`)

    let total = 0
    data.forEach(v => {
        const val = Number(v.total)
        total += val
        console.log(`[${v.data}] ${v.contato_id?.slice(0, 5)}... - R$ ${val.toFixed(2)} (Created: ${v.criado_em})`)
    })

    console.log(`\n----------------------------------------`)
    console.log(`Total A Receber (Calculated): R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`Comparison:`)
    console.log(`Localhost (Target): R$ 4.685,00`)
    console.log(`Vercel (Reported):  R$ 4.585,00`)
    console.log(`Diff: ${total - 4585}`)
    console.log(`----------------------------------------\n`)
}

verifyAReceber()
