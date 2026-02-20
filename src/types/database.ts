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
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sis_imagens_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_produtos"
            referencedColumns: ["id"]
          },
        ]
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
          observacoes?: string | null
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
          codigo: string | null
          descricao: string | null
          id: string | null
          images: Json | null
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
          weight_kg: number | null
        }
        Insert: {
          category?: string | null
          codigo?: string | null
          descricao?: string | null
          id?: string | null
          images?: never
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
          weight_kg?: number | null
        }
        Update: {
          category?: string | null
          codigo?: string | null
          descricao?: string | null
          id?: string | null
          images?: never
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
          weight_kg?: number | null
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

// Helper exports for common tables
export type Contato = Tables<'contatos'>
export type Venda = Tables<'vendas'>
export type ItemVenda = Tables<'itens_venda'>
export type PagamentoVenda = Tables<'pagamentos_venda'>
export type Produto = Tables<'produtos'>
export type PurchaseOrder = Tables<'purchase_orders'>
export type PurchaseOrderItem = Tables<'purchase_order_items'>
export type PurchaseOrderPayment = Tables<'purchase_order_payments'>

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: (PurchaseOrderItem & {
    product?: Produto
  })[]
  payments?: PurchaseOrderPayment[]
  fornecedor?: {
    nome: string
  }
}
