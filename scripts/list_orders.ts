
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load env from root
const envPath = path.resolve(process.cwd(), '.env')
const envConfig = dotenv.config({ path: envPath })
// Fallback if dotenv not installed or fails, try manual parse or rely on process if passed
// But since I don't know if dotenv is installed (it wasn't in package.json), simple parsing:

function loadEnv() {
    try {
        const content = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8')
        const lines = content.split('\n')
        const env: any = {}
        for (const line of lines) {
            const [key, val] = line.split('=')
            if (key && val) env[key.trim()] = val.trim()
        }
        return env
    } catch (e) {
        return {}
    }
}

const env = loadEnv()
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function listOrders() {
    const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('order_date', { ascending: false }) // Assuming user sees them by date descending usually, or created_at?
    // Let's sort by created_at desc to match "latest" usually shown first
    // But user said "2º pedido", maybe assuming a list.
    // I will list them all.

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Found', data.length, 'orders')
    data.forEach((order, index) => {
        console.log(`${index + 1}. ID: ${order.id} | Date: ${order.order_date} | Received: ${order.data_recebimento} | Total: ${order.total_amount}`)
    })
}

listOrders()
