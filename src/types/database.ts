export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          criado_em: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      cat_imagens_produto: {
        Row: {
          alt_text: string | null
          ativo: boolean | null
          created_at: string | null
          id: string
          ordem: number | null
          produto_id: string
          tipo: string
          updated_at: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          ordem?: number | null
          produto_id: string
          tipo?: string
          updated_at?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          ordem?: number | null
          produto_id?: string
          tipo?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_imagens_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_imagens_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_itens_pedido: {
        Row: {
          id: string
          nome_produto: string
          pedido_id: string | null
          preco_unitario_centavos: number
          produto_id: string | null
          quantidade: number
          total_centavos: number
        }
        Insert: {
          id?: string
          nome_produto: string
          pedido_id?: string | null
          preco_unitario_centavos: number
          produto_id?: string | null
          quantidade: number
          total_centavos: number
        }
        Update: {
          id?: string
          nome_produto?: string
          pedido_id?: string | null
          preco_unitario_centavos?: number
          produto_id?: string | null
          quantidade?: number
          total_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "cat_itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "cat_pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_pedidos: {
        Row: {
          atualizado_em: string | null
          contato_id: string | null
          criado_em: string | null
          endereco_entrega: string | null
          frete_centavos: number | null
          id: string
          indicado_por: string | null
          metodo_entrega: string | null
          metodo_pagamento: string | null
          nome_cliente: string
          numero_pedido: number
          observacoes: string | null
          status: string | null
          status_pagamento: string | null
          subtotal_centavos: number
          telefone_cliente: string
          total_centavos: number
        }
        Insert: {
          atualizado_em?: string | null
          contato_id?: string | null
          criado_em?: string | null
          endereco_entrega?: string | null
          frete_centavos?: number | null
          id?: string
          indicado_por?: string | null
          metodo_entrega?: string | null
          metodo_pagamento?: string | null
          nome_cliente: string
          numero_pedido?: number
          observacoes?: string | null
          status?: string | null
          status_pagamento?: string | null
          subtotal_centavos: number
          telefone_cliente: string
          total_centavos: number
        }
        Update: {
          atualizado_em?: string | null
          contato_id?: string | null
          criado_em?: string | null
          endereco_entrega?: string | null
          frete_centavos?: number | null
          id?: string
          indicado_por?: string | null
          metodo_entrega?: string | null
          metodo_pagamento?: string | null
          nome_cliente?: string
          numero_pedido?: number
          observacoes?: string | null
          status?: string | null
          status_pagamento?: string | null
          subtotal_centavos?: number
          telefone_cliente?: string
          total_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "cat_pedidos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_pedidos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "ranking_compras"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "cat_pedidos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "ranking_indicacoes"
            referencedColumns: ["indicador_id"]
          },
          {
            foreignKeyName: "cat_pedidos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "view_home_alertas"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      cat_pedidos_pendentes_vinculacao: {
        Row: {
          cat_pedido_id: string
          criado_em: string | null
          id: string
          motivo_falha: string
        }
        Insert: {
          cat_pedido_id: string
          criado_em?: string | null
          id?: string
          motivo_falha: string
        }
        Update: {
          cat_pedido_id?: string
          criado_em?: string | null
          id?: string
          motivo_falha?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_pedidos_pendentes_vinculacao_cat_pedido_id_fkey"
            columns: ["cat_pedido_id"]
            isOneToOne: false
            referencedRelation: "cat_pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          atualizado_em: string
          chave: string
          id: string
          valor: Json
        }
        Insert: {
          atualizado_em?: string
          chave: string
          id?: string
          valor: Json
        }
        Update: {
          atualizado_em?: string
          chave?: string
          id?: string
          valor?: Json
        }
        Relationships: []
      }
      contas: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          banco: string | null
          created_by: string | null
          criado_em: string | null
          id: string
          nome: string
          saldo_atual: number | null
          saldo_inicial: number | null
          tipo: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          banco?: string | null
          created_by?: string | null
          criado_em?: string | null
          id?: string
          nome: string
          saldo_atual?: number | null
          saldo_inicial?: number | null
          tipo: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          banco?: string | null
          created_by?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
          saldo_atual?: number | null
          saldo_inicial?: number | null
          tipo?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      contatos: {
        Row: {
          apelido: string | null
          atualizado_em: string
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_by: string | null
          criado_em: string
          endereco: string | null
          fts: unknown
          id: string
          indicado_por_id: string | null
          latitude: number | null
          logradouro: string | null
          longitude: number | null
          nome: string
          numero: string | null
          observacoes: string | null
          origem: string
          status: string
          subtipo: string | null
          telefone: string
          tipo: string
          uf: string | null
          ultimo_contato: string | null
          updated_by: string | null
        }
        Insert: {
          apelido?: string | null
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_by?: string | null
          criado_em?: string
          endereco?: string | null
          fts?: unknown
          id?: string
          indicado_por_id?: string | null
          latitude?: number | null
          logradouro?: string | null
          longitude?: number | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          origem?: string
          status?: string
          subtipo?: string | null
          telefone: string
          tipo: string
          uf?: string | null
          ultimo_contato?: string | null
          updated_by?: string | null
        }
        Update: {
          apelido?: string | null
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_by?: string | null
          criado_em?: string
          endereco?: string | null
          fts?: unknown
          id?: string
          indicado_por_id?: string | null
          latitude?: number | null
          logradouro?: string | null
          longitude?: number | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          origem?: string
          status?: string
          subtipo?: string | null
          telefone?: string
          tipo?: string
          uf?: string | null
          ultimo_contato?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_indicado_por_id_fkey"
            columns: ["indicado_por_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_indicado_por_id_fkey"
            columns: ["indicado_por_id"]
            isOneToOne: false
            referencedRelation: "ranking_compras"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contatos_indicado_por_id_fkey"
            columns: ["indicado_por_id"]
            isOneToOne: false
            referencedRelation: "ranking_indicacoes"
            referencedColumns: ["indicador_id"]
          },
          {
            foreignKeyName: "contatos_indicado_por_id_fkey"
            columns: ["indicado_por_id"]
            isOneToOne: false
            referencedRelation: "view_home_alertas"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      itens_venda: {
        Row: {
          custo_unitario: number | null
          id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Insert: {
          custo_unitario?: number | null
          id?: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Update: {
          custo_unitario?: number | null
          id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          atualizado_em: string | null
          conta_destino_id: string | null
          conta_id: string
          created_by: string | null
          criado_em: string | null
          data: string
          descricao: string | null
          id: string
          origem: string
          plano_conta_id: string | null
          purchase_order_payment_id: string | null
          tipo: string
          updated_by: string | null
          valor: number
          venda_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          conta_destino_id?: string | null
          conta_id: string
          created_by?: string | null
          criado_em?: string | null
          data?: string
          descricao?: string | null
          id?: string
          origem: string
          plano_conta_id?: string | null
          purchase_order_payment_id?: string | null
          tipo: string
          updated_by?: string | null
          valor: number
          venda_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          conta_destino_id?: string | null
          conta_id?: string
          created_by?: string | null
          criado_em?: string | null
          data?: string
          descricao?: string | null
          id?: string
          origem?: string
          plano_conta_id?: string | null
          purchase_order_payment_id?: string | null
          tipo?: string
          updated_by?: string | null
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_de_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_purchase_order_payment_id_fkey"
            columns: ["purchase_order_payment_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_venda: {
        Row: {
          criado_em: string
          data: string
          id: string
          metodo: string
          observacao: string | null
          valor: number
          venda_id: string
        }
        Insert: {
          criado_em?: string
          data?: string
          id?: string
          metodo?: string
          observacao?: string | null
          valor: number
          venda_id: string
        }
        Update: {
          criado_em?: string
          data?: string
          id?: string
          metodo?: string
          observacao?: string | null
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_de_contas: {
        Row: {
          ativo: boolean | null
          automatica: boolean | null
          categoria: string
          criado_em: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          automatica?: boolean | null
          categoria: string
          criado_em?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          automatica?: boolean | null
          categoria?: string
          criado_em?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          apelido: string | null
          ativo: boolean
          atualizado_em: string
          categoria: string | null
          codigo: string
          criado_em: string
          custo: number
          descricao: string | null
          destaque: boolean | null
          estoque_atual: number | null
          estoque_minimo: number | null
          id: string
          instrucoes_preparo: string | null
          nome: string
          peso_kg: number | null
          preco: number
          preco_ancoragem: number | null
          slug: string | null
          subtitulo: string | null
          unidade: string
          visivel_catalogo: boolean
        }
        Insert: {
          apelido?: string | null
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          codigo: string
          criado_em?: string
          custo: number
          descricao?: string | null
          destaque?: boolean | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          instrucoes_preparo?: string | null
          nome: string
          peso_kg?: number | null
          preco: number
          preco_ancoragem?: number | null
          slug?: string | null
          subtitulo?: string | null
          unidade?: string
          visivel_catalogo?: boolean
        }
        Update: {
          apelido?: string | null
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          codigo?: string
          criado_em?: string
          custo?: number
          descricao?: string | null
          destaque?: boolean | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          instrucoes_preparo?: string | null
          nome?: string
          peso_kg?: number | null
          preco?: number
          preco_ancoragem?: number | null
          slug?: string | null
          subtitulo?: string | null
          unidade?: string
          visivel_catalogo?: boolean
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_payments: {
        Row: {
          amount: number
          atualizado_em: string | null
          conta_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          purchase_order_id: string
        }
        Insert: {
          amount: number
          atualizado_em?: string | null
          conta_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          purchase_order_id: string
        }
        Update: {
          amount?: number
          atualizado_em?: string | null
          conta_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          purchase_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_payments_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          data_recebimento: string | null
          fornecedor_id: string
          id: string
          notes: string | null
          order_date: string
          payment_status: Database["public"]["Enums"]["purchase_order_payment_status"]
          status: Database["public"]["Enums"]["purchase_order_status"]
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          data_recebimento?: string | null
          fornecedor_id: string
          id?: string
          notes?: string | null
          order_date?: string
          payment_status?: Database["public"]["Enums"]["purchase_order_payment_status"]
          status?: Database["public"]["Enums"]["purchase_order_status"]
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          data_recebimento?: string | null
          fornecedor_id?: string
          id?: string
          notes?: string | null
          order_date?: string
          payment_status?: Database["public"]["Enums"]["purchase_order_payment_status"]
          status?: Database["public"]["Enums"]["purchase_order_status"]
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "ranking_compras"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "purchase_orders_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "ranking_indicacoes"
            referencedColumns: ["indicador_id"]
          },
          {
            foreignKeyName: "purchase_orders_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "view_home_alertas"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      sis_imagens_produto: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          ordem: number | null
          produto_id: string | null
          tipo: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          ordem?: number | null
          produto_id?: string | null
          tipo?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          ordem?: number | null
          produto_id?: string | null
          tipo?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sis_imagens_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_imagens_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "vw_catalogo_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          atualizado_em: string
          cat_pedido_id: string | null
          contato_id: string
          created_by: string | null
          criado_em: string
          custo_total: number | null
          data: string
          data_entrega: string | null
          data_prevista_pagamento: string | null
          forma_pagamento: string
          fts: unknown
          id: string
          observacoes: string | null
          origem: string | null
          pago: boolean | null
          parcelas: number | null
          status: string
          taxa_entrega: number | null
          total: number
          updated_by: string | null
          valor_pago: number | null
        }
        Insert: {
          atualizado_em?: string
          cat_pedido_id?: string | null
          contato_id: string
          created_by?: string | null
          criado_em?: string
          custo_total?: number | null
          data?: string
          data_entrega?: string | null
          data_prevista_pagamento?: string | null
          forma_pagamento: string
          fts?: unknown
          id?: string
          observacoes?: string | null
          origem?: string | null
          pago?: boolean | null
          parcelas?: number | null
          status?: string
          taxa_entrega?: number | null
          total: number
          updated_by?: string | null
          valor_pago?: number | null
        }
        Update: {
          atualizado_em?: string
          cat_pedido_id?: string | null
          contato_id?: string
          created_by?: string | null
          criado_em?: string
          custo_total?: number | null
          data?: string
          data_entrega?: string | null
          data_prevista_pagamento?: string | null
          forma_pagamento?: string
          fts?: unknown
          id?: string
          observacoes?: string | null
          origem?: string | null
          pago?: boolean | null
          parcelas?: number | null
          status?: string
          taxa_entrega?: number | null
          total?: number
          updated_by?: string | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "ranking_compras"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "vendas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "ranking_indicacoes"
            referencedColumns: ["indicador_id"]
          },
          {
            foreignKeyName: "vendas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "view_home_alertas"
            referencedColumns: ["contato_id"]
          },
        ]
      }
    }
    Views: {
      crm_view_monthly_sales: {
        Row: {
          ano: number | null
          custo_total: number | null
          faturamento: number | null
          lucro: number | null
          mes: number | null
          ticket_medio: number | null
          total_vendas: number | null
        }
        Relationships: []
      }
      crm_view_operational_snapshot: {
        Row: {
          clientes_ativos: number | null
          entregas_hoje_pendentes: number | null
          entregas_hoje_realizadas: number | null
          entregas_pendentes_total: number | null
          total_a_receber: number | null
        }
        Relationships: []
      }
      ranking_compras: {
        Row: {
          contato_id: string | null
          nome: string | null
          total_compras: number | null
          total_pontos: number | null
          ultima_compra: string | null
        }
        Relationships: []
      }
      ranking_indicacoes: {
        Row: {
          indicador_id: string | null
          nome: string | null
          total_indicados: number | null
          total_vendas_indicados: number | null
        }
        Relationships: []
      }
      view_extrato_mensal: {
        Row: {
          categoria_nome: string | null
          categoria_tipo: string | null
          conta_id: string | null
          data: string | null
          descricao: string | null
          id: string | null
          origem: string | null
          tipo: string | null
          valor: number | null
        }
        Relationships: []
      }
      view_extrato_saldo: {
        Row: {
          entradas: number | null
          mes: string | null
          mes_ordem: string | null
          saidas: number | null
          saldo_acumulado: number | null
          saldo_mes: number | null
        }
        Relationships: []
      }
      view_fluxo_resumo: {
        Row: {
          ano: number | null
          lucro_estimado: number | null
          mes: number | null
          total_a_receber: number | null
          total_entradas: number | null
          total_faturamento: number | null
          total_saidas: number | null
        }
        Relationships: []
      }
      view_home_alertas: {
        Row: {
          contato_id: string | null
          data_ultima_compra: string | null
          dias_sem_compra: number | null
          nome: string | null
          telefone: string | null
        }
        Relationships: []
      }
      view_home_financeiro: {
        Row: {
          alertas_financeiros: Json | null
          ano: number | null
          faturamento: number | null
          faturamento_anterior: number | null
          liquidado_mes: number | null
          liquidado_mes_count: number | null
          lucro_estimado: number | null
          mes: number | null
          ticket_medio: number | null
          total_a_receber: number | null
          variacao_faturamento_percentual: number | null
        }
        Relationships: []
      }
      view_home_operacional: {
        Row: {
          ano: number | null
          clientes_ativos: number | null
          mes: number | null
          pedidos_entregues_hoje: number | null
          pedidos_pendentes: number | null
          ranking_indicacoes: Json | null
          total_itens: number | null
          total_vendas: number | null
          ultimas_vendas: Json | null
        }
        Relationships: []
      }
      view_liquidado_mensal: {
        Row: {
          mes: string | null
          total_liquidado: number | null
          vendas_liquidadas: number | null
        }
        Relationships: []
      }
      view_lucro_liquido_mensal: {
        Row: {
          custo_fabrica: number | null
          custo_produtos: number | null
          despesas_operacionais: number | null
          lucro_bruto: number | null
          lucro_liquido: number | null
          margem_liquida_pct: number | null
          mes: string | null
          receita_bruta: number | null
        }
        Relationships: []
      }
      vw_admin_dashboard: {
        Row: {
          faturamento_hoje_cents: number | null
          faturamento_mes_cents: number | null
          pedidos_pendentes: number | null
          produtos_ativos: number | null
          produtos_estoque_baixo: number | null
          produtos_inativos: number | null
          ultimos_pedidos: Json | null
        }
        Relationships: []
      }
      vw_catalogo_produtos: {
        Row: {
          anchor_price_cents: number | null
          category: string | null
          codigo: string | null
          descricao: string | null
          id: string | null
          images: Json | null
          instrucoes_preparo: string | null
          is_active: boolean | null
          is_featured: boolean | null
          nome: string | null
          price_cents: number | null
          price_formatted: string | null
          primary_image_url: string | null
          slug: string | null
          stock_min_alert: number | null
          stock_quantity: number | null
          stock_status: string | null
          subtitle: string | null
        }
        Insert: {
          anchor_price_cents?: never
          category?: string | null
          codigo?: string | null
          descricao?: string | null
          id?: string | null
          images?: never
          instrucoes_preparo?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          nome?: string | null
          price_cents?: never
          price_formatted?: never
          primary_image_url?: never
          slug?: string | null
          stock_min_alert?: number | null
          stock_quantity?: number | null
          stock_status?: never
          subtitle?: string | null
        }
        Update: {
          anchor_price_cents?: never
          category?: string | null
          codigo?: string | null
          descricao?: string | null
          id?: string | null
          images?: never
          instrucoes_preparo?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          nome?: string | null
          price_cents?: never
          price_formatted?: never
          primary_image_url?: never
          slug?: string | null
          stock_min_alert?: number | null
          stock_quantity?: number | null
          stock_status?: never
          subtitle?: string | null
        }
        Relationships: []
      }
      vw_marketing_pedidos: {
        Row: {
          data_venda: string | null
          entregas_count: number | null
          faturamento_cents: number | null
          faturamento_direto_cents: number | null
          faturamento_online_cents: number | null
          mes_iso: string | null
          pedidos_diretos: number | null
          pedidos_online: number | null
          retiradas_count: number | null
          semana_iso: string | null
          ticket_medio_cents: number | null
          total_pedidos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_image_reference: {
        Args: { p_produto_id: string; p_url: string }
        Returns: undefined
      }
      criar_pedido: {
        Args: {
          p_endereco_entrega: string
          p_frete_centavos: number
          p_indicado_por?: string
          p_itens?: Json
          p_metodo_entrega: string
          p_metodo_pagamento: string
          p_nome_cliente: string
          p_observacoes?: string
          p_subtotal_centavos: number
          p_telefone_cliente: string
          p_total_centavos: number
        }
        Returns: Json
      }
      delete_image_reference: {
        Args: { p_produto_id: string }
        Returns: undefined
      }
      get_areceber_breakdown: {
        Args: never
        Returns: {
          sem_data: number
          valor_hoje: number
          valor_sem_data: number
          valor_semana: number
          valor_vencido: number
          vencem_hoje: number
          vencem_semana: number
          vencidos: number
        }[]
      }
      is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      receive_purchase_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      registrar_lancamento_venda:
        | {
            Args: {
              p_conta_id: string
              p_data: string
              p_valor: number
              p_venda_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_conta_id: string
              p_data: string
              p_metodo?: string
              p_observacao?: string
              p_valor: number
              p_venda_id: string
            }
            Returns: string
          }
      rpc_marcar_venda_paga: {
        Args: { p_conta_id: string; p_data?: string; p_venda_id: string }
        Returns: undefined
      }
    }
    Enums: {
      purchase_order_payment_status: "paid" | "partial" | "unpaid"
      purchase_order_status: "pending" | "received" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      purchase_order_payment_status: ["paid", "partial", "unpaid"],
      purchase_order_status: ["pending", "received", "cancelled"],
    },
  },
} as const

// Helper aliases
export type Table<T extends keyof (Database['public']['Tables'] & Database['public']['Views'])> = Tables<T>
export type Insert<T extends keyof Database['public']['Tables']> = TablesInsert<T>
export type Update<T extends keyof Database['public']['Tables']> = TablesUpdate<T>

export type Conta = Table<'contas'>
export type PlanoConta = Table<'plano_de_contas'>
export type Lancamento = Table<'lancamentos'>
export type ExtratoItem = Table<'view_extrato_mensal'>
export type FluxoResumo = Table<'view_fluxo_resumo'>

// STORY-005 Missing Table Aliases
export type Venda = Table<'vendas'>
export type Contato = Table<'contatos'>
export type Produto = Table<'produtos'>
export type ItemVenda = Table<'itens_venda'>
export type PagamentoVenda = Table<'pagamentos_venda'>

export type PurchaseOrder = Table<'purchase_orders'>
export type PurchaseOrderItem = Table<'purchase_order_items'>
export type PurchaseOrderPayment = Table<'purchase_order_payments'>

// CRUD Aliases
export type VendaInsert = Insert<'vendas'>
export type VendaUpdate = Update<'vendas'>
export type ContatoInsert = Insert<'contatos'>
export type ContatoUpdate = Update<'contatos'>
export type ProdutoInsert = Insert<'produtos'>
export type ProdutoUpdate = Update<'produtos'>
export type ItemVendaInsert = Insert<'itens_venda'>

// Complex Types for Services
export interface VendaComItens extends Venda {
  itens: (ItemVenda & {
    produto?: {
      id: string
      nome: string
      codigo: string
    }
  })[]
  contato?: {
    id: string
    nome: string
    telefone: string
    origem: string
    indicado_por_id?: string | null
    indicador?: {
      id: string
      nome: string
    } | null
    status: string
  }
  pagamentos?: PagamentoVenda[]
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  fornecedor: { nome: string }
  items: (PurchaseOrderItem & {
    product: Produto
  })[]
  payments: PurchaseOrderPayment[]
}
