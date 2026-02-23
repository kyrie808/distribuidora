import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
    console.log("=== DIAGNOSTIC 1: Contatos tipo FORNECEDOR ===");
    const { data: contatos, error: err1 } = await supabase
        .from('contatos')
        .select('id, nome, apelido, tipo, empresa, documento')
        .eq('tipo', 'FORNECEDOR');

    if (err1) {
        // If 'empresa' column doesn't exist, try without it
        console.log("Error querying with 'empresa', falling back...", err1.message);
        const { data: contatosFb, error: errFb } = await supabase
            .from('contatos')
            .select('id, nome, apelido, tipo, documento')
            .eq('tipo', 'FORNECEDOR');
        if (errFb) console.error(errFb);
        else console.table(contatosFb);
    } else {
        console.table(contatos);
    }

    console.log("\n=== DIAGNOSTIC 2: Purchase Orders Suppliers ===");
    const { data: pos, error: err2 } = await supabase
        .from('purchase_orders')
        .select('id, status, fornecedor_id, contatos:fornecedor_id (nome, apelido, tipo)')
        .limit(10);

    if (err2) {
        console.log("Error querying with 'fornecedor_id', trying 'supplier_id'...", err2.message);
        const { data: posFb, error: err2Fb } = await supabase
            .from('purchase_orders')
            .select('id, status, supplier_id, contatos:supplier_id (nome, apelido, tipo)')
            .limit(10);
        if (err2Fb) console.error(err2Fb);
        else console.table(posFb.map(p => ({ id: p.id, status: p.status, supplier_id: p.supplier_id, contato_nome: p.contatos?.nome })));
    } else {
        console.table(pos.map(p => ({ id: p.id, status: p.status, fornecedor_id: p.fornecedor_id, contato_nome: p.contatos?.nome })));
    }
}

runDiagnostics();
