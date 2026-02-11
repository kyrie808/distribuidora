import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

import * as fs from 'fs'
import * as path from 'path'

// Manual env parsing because dotenv is being finicky with npx/paths
const envPath = path.resolve(process.cwd(), '.env')
let envContent = ''
try {
    envContent = fs.readFileSync(envPath, 'utf-8')
} catch (e) {
    console.error('Could not read .env file at', envPath)
    process.exit(1)
}

const getEnv = (key: string) => {
    const line = envContent.split('\n').find(l => l.startsWith(`${key}=`))
    return line ? line.split('=')[1].trim() : ''
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateAddresses() {
    console.log('Starting address migration...')

    // Fetch contacts with non-empty address
    const { data: contacts, error } = await supabase
        .from('contatos')
        .select('id, endereco')
        .not('endereco', 'is', null)
        .neq('endereco', '')

    if (error) {
        console.error('Error fetching contacts:', error)
        return
    }

    console.log(`Found ${contacts.length} contacts to migrate.`)

    for (const contact of contacts) {
        const address = contact.endereco
        let updates: any = {}

        // Simple heuristic parsing
        // Expected formats:
        // "Rua X, 123 - Compl - Cidade/UF"
        // "Rua X, S/N - Cidade/UF"

        const parts = address.split(',').map((p: string) => p.trim())

        if (parts.length >= 1) {
            updates.logradouro = parts[0]
        }

        if (parts.length >= 2) {
            const numberPart = parts[1].split('-')[0].trim()
            updates.numero = numberPart
        }

        // Try to find City/UF at the end
        const lastPart = address.split('-').pop()?.trim()
        if (lastPart && lastPart.includes('/')) {
            const [cidade, uf] = lastPart.split('/')
            updates.cidade = cidade.trim()
            updates.uf = uf.trim().substring(0, 2).toUpperCase()
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('contatos')
                .update(updates)
                .eq('id', contact.id)

            if (updateError) {
                console.error(`Failed to update contact ${contact.id}:`, updateError)
            } else {
                console.log(`Migrated contact ${contact.id}`)
            }
        }
    }

    console.log('Migration complete.')
}

migrateAddresses()
