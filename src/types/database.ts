export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cat_imagens_produto: {
        Row: {
          criado_em: string | null
          id: string
          ordem: number | null
          principal: boolean | null
          produto_id: string | null
          texto_alternativo: string | null
          url: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          ordem?: number | null
          principal?: boolean | null
          produto_id?: string | null
          texto_alternativo?: string | null
          url: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          ordem?: number | null
          principal?: boolean | null
          produto_id?: string | null
          texto_alternativo?: string | null
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
      sis_imagens_produto: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: string
          ordem: number | null
          produto_id: string | null
          tipo: string | null
          url: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          ordem?: number | null
          produto_id?: string | null
          tipo?: string | null
          url: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          ordem?: number | null
          produto_id?: string | null
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sis_imagens_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
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
        Relationships: []
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
      contatos: {
        Row: {
          apelido: string | null
          atualizado_em: string
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          criado_em: string
          endereco: string | null
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
        }
        Insert: {
          apelido?: string | null
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          endereco?: string | null
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
        }
        Update: {
          apelido?: string | null
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          endereco?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "contatos_indicado_por_id_fkey"
            columns: ["indicado_por_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
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
          nome: string
          peso_kg: number | null
          preco: number
          slug: string | null
          unidade: string
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
          nome: string
          peso_kg?: number | null
          preco: number
          slug?: string | null
          unidade?: string
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
          nome?: string
          peso_kg?: number | null
          preco?: number
          slug?: string | null
          unidade?: string
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
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          purchase_order_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          purchase_order_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          purchase_order_id?: string
        }
        Relationships: [
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
          id: string
          notes: string | null
          order_date: string
          payment_status: Database["public"]["Enums"]["purchase_order_payment_status"]
          status: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          data_recebimento?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_status?: Database["public"]["Enums"]["purchase_order_payment_status"]
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          data_recebimento?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_status?: Database["public"]["Enums"]["purchase_order_payment_status"]
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      vendas: {
        Row: {
          atualizado_em: string
          contato_id: string
          criado_em: string
          custo_total: number | null
          data: string
          data_entrega: string | null
          data_prevista_pagamento: string | null
          forma_pagamento: string
          id: string
          observacoes: string | null
          pago: boolean | null
          parcelas: number | null
          status: string
          taxa_entrega: number | null
          total: number
          valor_pago: number | null
        }
        Insert: {
          atualizado_em?: string
          contato_id: string
          criado_em?: string
          custo_total?: number | null
          data?: string
          data_entrega?: string | null
          data_prevista_pagamento?: string | null
          forma_pagamento: string
          id?: string
          observacoes: string | null
          pago?: boolean | null
          parcelas?: number | null
          status?: string
          taxa_entrega?: number | null
          total: number
          valor_pago?: number | null
        }
        Update: {
          atualizado_em?: string
          contato_id?: string
          criado_em?: string
          custo_total?: number | null
          data?: string
          data_entrega?: string | null
          data_prevista_pagamento?: string | null
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          pago?: boolean | null
          parcelas?: number | null
          status?: string
          taxa_entrega?: number | null
          total?: number
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
        ]
      }
    }
    Views: {
      ranking_indicacoes: {
        Row: {
          indicador_id: string | null
          nome: string | null
          total_indicados: number | null
          total_vendas_indicados: number | null
        }
        Relationships: []
      }
      ranking_compras: {
        Row: {
          contato_id: string | null
          nome: string | null
          total_pontos: number | null
          total_compras: number | null
          ultima_compra: string | null
        }
        Relationships: []
      }
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
          category: string | null
          description: string | null
          id: string | null
          images: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string | null
          price_cents: number | null
          price_formatted: number | null
          primary_image_url: string | null
          slug: string | null
          stock_min_alert: number | null
          stock_quantity: number | null
          stock_status: string | null
          weight_kg: number | null
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
      receive_purchase_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
    }
    Enums: {
      purchase_order_payment_status: "paid" | "partial" | "unpaid"
      purchase_order_status: "pending" | "received" | "cancelled"
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type Contato = Tables<'contatos'>
export type ContatoInsert = Database['public']['Tables']['contatos']['Insert']
export type ContatoUpdate = Database['public']['Tables']['contatos']['Update']

export type Venda = Tables<'vendas'>
export type VendaInsert = Database['public']['Tables']['vendas']['Insert']

export type PurchaseOrder = Tables<'purchase_orders'>
export type PurchaseOrderItem = Tables<'purchase_order_items'>
export type PurchaseOrderPayment = Tables<'purchase_order_payments'>

export type PurchaseOrderWithItems = PurchaseOrder & {
  items: (PurchaseOrderItem & { product: Tables<'produtos'> | null })[]
  payments: PurchaseOrderPayment[]
}
