#!/bin/bash
# ============================================================
# CLEANUP SCRIPT — Mont Distribuidora
# Remove synkrai-aios e arquivos de debug/debris do repositório
# 
# USO: bash cleanup.sh
# DEPOIS: git add -A && git commit -m "chore: remove synkrai-aios and debug debris"
# ============================================================
 
set -e
echo "🧹 Iniciando limpeza do repositório..."
 
# 1. REMOVER SYNKRAI-AIOS COMPLETAMENTE (12MB, 1039 arquivos)
echo ""
echo "❌ Removendo .aios-core/ (synkrai-aios)..."
rm -rf .aios-core/
 
# 2. REMOVER DIRETÓRIOS DE AGENTES LEGADOS
echo "❌ Removendo .agent/ (workflows legados)..."
rm -rf .agent/
 
echo "❌ Removendo .agents/ (rules legados)..."
rm -rf .agents/
 
# 3. REMOVER AGENTS.md (referencia synkrai)
echo "❌ Removendo AGENTS.md..."
rm -f AGENTS.md
 
# 4. REMOVER ARCHITECTURE_AUDIT.md (gerado pelo aios)
echo "❌ Removendo ARCHITECTURE_AUDIT.md..."
rm -f ARCHITECTURE_AUDIT.md
 
# 5. REMOVER ARQUIVOS DE DEBUG/OUTPUT
echo ""
echo "🗑️  Removendo arquivos de debug e output..."
rm -f build-errors.txt
rm -f build-output.txt
rm -f cashflow_test_output.txt
rm -f debug_raw_output.txt
rm -f diag.js
rm -f diag_out.txt
rm -f duplicates_report.txt
rm -f latest_groq_response.txt
rm -f link_out.txt
rm -f lint-results.txt
rm -f sales_dump.json
rm -f test_api.py
rm -f requirements.txt
rm -f ts_errors.txt
rm -f ts_errors_final.txt
rm -f ts_errors_final_utf8.txt
rm -f ts_errors_full.txt
rm -f ts_errors_utf8.txt
rm -f ts_errors_v2.txt
rm -f ts_errors_v2_utf8.txt
rm -f ts_errors_v3.txt
rm -f ts_errors_v3_utf8.txt
rm -f todos_fiados.md
rm -f analise_fiados.md
 
# 6. REMOVER .mcp.json (contém token exposto!)
echo ""
echo "⚠️  Removendo .mcp.json (TOKEN SUPABASE EXPOSTO!)..."
rm -f .mcp.json
 
# 7. LIMPAR ANTIGRAVITY AGENTS LEGADOS (serão substituídos)
echo "🔄 Limpando agentes Antigravity legados..."
rm -rf .antigravity/agents/
 
echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "📊 Resumo do que foi removido:"
echo "   - .aios-core/ (synkrai-aios: ~12MB, 1039 arquivos)"
echo "   - .agent/, .agents/ (diretórios legados)"
echo "   - AGENTS.md, ARCHITECTURE_AUDIT.md"
echo "   - 20+ arquivos de debug/output (.txt, .json, .py)"
echo "   - .mcp.json (token exposto)"
echo "   - .antigravity/agents/ (será recriado)"
echo ""
echo "⚠️  AÇÕES OBRIGATÓRIAS APÓS LIMPEZA:"
echo "   1. Rotacionar o SUPABASE_ACCESS_TOKEN em supabase.com"
echo "   2. Recriar .mcp.json LOCAL (não commitar!)"
echo "   3. Copiar os novos arquivos (.claude/, CLAUDE.md, .antigravity/)"
echo "   4. git add -A && git commit -m 'chore: remove synkrai-aios, add skills'"
echo "   5. git push"
