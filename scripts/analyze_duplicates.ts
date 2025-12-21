import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Helper to load env
// Helper to load env
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            content.split(/\r?\n/).forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    let value = match[2].trim();
                    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                    process.env[key] = value;
                }
            });
        }
    } catch (e) {
        // silent fail
    }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("❌ Erro: Credenciais do Supabase não encontradas no arquivo .env");
    console.log("Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidos.");
    process.exit(1);
}

const supabase = createClient(url, key);

async function analyze() {
    console.log("🔍 Buscando vendas no banco de dados...");

    // Fetch all sales order by date
    const { data: vendas, error } = await supabase
        .from('vendas')
        .select(`
            id,
            total,
            data,
            criado_em,
            contato_id,
            contato:contatos(nome)
        `)
        .order('criado_em', { ascending: true });

    if (error) {
        console.error("❌ Erro ao buscar vendas:", error.message);
        return;
    }

    console.log(`📊 Analisando total de ${vendas.length} vendas...`);

    const duplicates: any[] = [];
    const timeWindowMs = 2 * 60 * 1000; // 2 minutos de tolerância

    // Group by contato_id
    const byContact: Record<string, any[]> = {};

    for (const v of vendas) {
        if (!byContact[v.contato_id]) byContact[v.contato_id] = [];
        byContact[v.contato_id].push(v);
    }

    for (const contatoId in byContact) {
        const userSales = byContact[contatoId];
        // Ensure sorted by created_at
        userSales.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());

        for (let i = 0; i < userSales.length - 1; i++) {
            const current = userSales[i];
            const next = userSales[i + 1];

            // Compare Total and Time
            const t1 = new Date(current.criado_em).getTime();
            const t2 = new Date(next.criado_em).getTime();
            const diffMs = t2 - t1;

            // Se o total for igual E a diferença de tempo for menor que a janela (ex: 2 min)
            if (current.total === next.total && diffMs < timeWindowMs) {
                duplicates.push({
                    cliente: Array.isArray(current.contato) ? current.contato[0]?.nome : current.contato?.nome || 'Desconhecido',
                    total: current.total,
                    data: new Date(current.criado_em).toLocaleDateString(),
                    hora1: new Date(current.criado_em).toLocaleTimeString(),
                    hora2: new Date(next.criado_em).toLocaleTimeString(),
                    diffSec: Math.round(diffMs / 1000),
                    id1: current.id,
                    id2: next.id
                });
            }
        }
    }

    let report = "";
    if (duplicates.length === 0) {
        report = "✅ Nenhuma duplicata suspeita encontrada.";
    } else {
        report += `⚠️ Encontradas ${duplicates.length} possíveis duplicatas:\n`;
        report += "===================================================\n";
        duplicates.forEach((d, index) => {
            report += `#${index + 1} | Cliente: ${d.cliente} | Total: R$ ${d.total}\n`;
            report += `    Original:  ID: ${d.id1} | ${d.data} - ${d.hora1}\n`;
            report += `    Duplicada: ID: ${d.id2} | ${d.data} - ${d.hora2} | Diff: ${d.diffSec}s\n`;
            report += "---------------------------------------------------\n";
        });
        report += "===================================================\n";
    }

    fs.writeFileSync('duplicates_report.txt', report);
    console.log("Report saved to duplicates_report.txt");
}

analyze();
