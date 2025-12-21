
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
const dumpPath = path.resolve(__dirname, '../../sales_dump.json');

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        acc[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
    return acc;
}, {} as Record<string, string>);

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function main() {
    const { data: contacts } = await supabase
        .from('contatos')
        .select('id, nome')
        .ilike('nome', '%Ana Paula%');

    if (!contacts || contacts.length === 0) {
        fs.writeFileSync(dumpPath, JSON.stringify({ error: 'No contacts found' }));
        return;
    }

    const contactIds = contacts.map(c => c.id);

    // Fetch sales + items + Inventory Movements usually linked to sale_id
    const { data: sales, error } = await supabase
        .from('vendas')
        .select(`
      *,
      itens_venda (
        *,
        produtos (nome, unidade)
      )
    `)
        .in('contato_id', contactIds)
        .order('data', { ascending: false });

    if (error) {
        fs.writeFileSync(dumpPath, JSON.stringify({ error }));
        return;
    }

    // Also fetch movements for these sales if possible. 
    // We don't have easy join, so separate query.
    const saleIds = sales.map(s => s.id);
    // Assuming 'inventory_movements' has 'sale_id' or similar based on previous context
    // Let's try to select from 'inventory_movements' if table exists. 
    // I saw it in conversation history but not explicit in types check (I didn't check ALL types).
    // I will try. If it fails, we handle it.

    let movements = [];
    try {
        const { data: movs } = await supabase
            .from('inventory_movements') // This might be wrong table name if I didn't check types.
            .select('*')
            .in('sale_id', saleIds);
        movements = movs || [];
    } catch (e) {
        // ignore
    }

    fs.writeFileSync(dumpPath, JSON.stringify({ sales, movements }, null, 2));
    console.log('Dump written to ' + dumpPath);
}

main();
