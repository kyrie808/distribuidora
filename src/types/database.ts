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
          atualizado_em: string
          bairro: string | null
          cep: string | null
          criado_em: string
          endereco: string | null
          id: string
          indicado_por_id: string | null
          latitude: number | null
          longitude: number | null
          nome: string
          observacoes: string | null
          origem: string
          status: string
          subtipo: string | null
          telefone: string
          tipo: string
          ultimo_contato: string | null
        }
        Insert: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          criado_em?: string
          endereco?: string | null
          id?: string
          indicado_por_id?: string | null
          latitude?: number | null
          longitude?: number | null
          nome: string
          observacoes?: string | null
          origem?: string
          status?: string
          subtipo?: string | null
          telefone: string
          tipo: string
          ultimo_contato?: string | null
        }
        Update: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          criado_em?: string
          endereco?: string | null
          id?: string
          indicado_por_id?: string | null
          latitude?: number | null
          longitude?: number | null
          nome?: string
          observacoes?: string | null
          origem?: string
          status?: string
          subtipo?: string | null
          telefone?: string
          tipo?: string
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
          custo_unitario: number
          id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Insert: {
          custo_unitario: number
          id?: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Update: {
          custo_unitario?: number
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
          metodo: string
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
          codigo: string
          criado_em: string
          custo: number
          estoque_atual: number
          id: string
          nome: string
          preco: number
          unidade: string
        }
        Insert: {
          apelido?: string | null
          ativo?: boolean
          atualizado_em?: string
          codigo: string
          criado_em?: string
          custo: number
          estoque_atual?: number
          id?: string
          nome: string
          preco: number
          unidade?: string
        }
        Update: {
          apelido?: string | null
          ativo?: boolean
          atualizado_em?: string
          codigo?: string
          criado_em?: string
          custo?: number
          estoque_atual?: number
          id?: string
          nome?: string
          preco?: number
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
          total_cost: number
          unit_cost: number
        }
        Insert: {
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Update: {
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          total_cost?: number
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
          amount_paid: number
          created_at: string
          data_recebimento: string | null
          id: string
          notes: string | null
          order_date: string
          payment_status: Database["public"]["Enums"]["purchase_order_payment_status"]
          status: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          data_recebimento?: string | null
          id?: string
          notes?: string | null
          order_date: string
          payment_status?: Database["public"]["Enums"]["purchase_order_payment_status"]
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          data_recebimento?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_status?: Database["public"]["Enums"]["purchase_order_payment_status"]
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          atualizado_em: string
          contato_id: string
          criado_em: string
          custo_total: number
          data: string
          data_entrega: string | null
          data_prevista_pagamento: string | null
          forma_pagamento: string
          id: string
          observacoes: string | null
          pago: boolean
          parcelas: number | null
          status: string
          taxa_entrega: number
          total: number
          valor_pago: number
        }
        Insert: {
          atualizado_em?: string
          contato_id: string
          criado_em?: string
          custo_total?: number
          data?: string
          data_entrega?: string | null
          data_prevista_pagamento?: string | null
          forma_pagamento: string
          id?: string
          observacoes?: string | null
          pago?: boolean
          parcelas?: number | null
          status?: string
          taxa_entrega?: number
          total: number
          valor_pago?: number
        }
        Update: {
          atualizado_em?: string
          contato_id?: string
          criado_em?: string
          custo_total?: number
          data?: string
          data_entrega?: string | null
          data_prevista_pagamento?: string | null
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          pago?: boolean
          parcelas?: number | null
          status?: string
          taxa_entrega?: number
          total?: number
          valor_pago?: number
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

type PublicSchema = Database[Extract<keyof Database, "public">]

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      purchase_order_payment_status: {
        paid: "paid",
        partial: "partial",
        unpaid: "unpaid",
      },
      purchase_order_status: {
        pending: "pending",
        received: "received",
        cancelled: "cancelled",
      },
    },
  },
} as const

export type PurchaseOrder = {
    id: string
    supplier_id: string | null
    order_date: string
    status: 'pending' | 'received' | 'cancelled'
    payment_status: 'paid' | 'partial' | 'unpaid'
    total_amount: number
    notes: string | null
    data_recebimento: string | null
    amount_paid: number
    created_at: string
    updated_at: string
}

export type PurchaseOrderItem = {
    id: string
    purchase_order_id: string
    product_id: string
    quantity: number
    unit_cost: number
    total_cost: number
}

// Old definition removed


// Convenience types
export type Contato = Database['public']['Tables']['contatos']['Row']
export type ContatoInsert = Database['public']['Tables']['contatos']['Insert']
export type ContatoUpdate = Database['public']['Tables']['contatos']['Update']

export type Produto = Database['public']['Tables']['produtos']['Row']
export type ProdutoInsert = Database['public']['Tables']['produtos']['Insert']
export type ProdutoUpdate = Database['public']['Tables']['produtos']['Update']

export type Venda = Database['public']['Tables']['vendas']['Row']
export type VendaInsert = Database['public']['Tables']['vendas']['Insert']
export type VendaUpdate = Database['public']['Tables']['vendas']['Update']

export type ItemVenda = Database['public']['Tables']['itens_venda']['Row']
export type ItemVendaInsert = Database['public']['Tables']['itens_venda']['Insert']

export type PagamentoVenda = Database['public']['Tables']['pagamentos_venda']['Row']
export type PagamentoVendaInsert = Database['public']['Tables']['pagamentos_venda']['Insert']

export type Configuracao = Database['public']['Tables']['configuracoes']['Row']

// Extended types with relations
export type PurchaseOrderPayment = Database['public']['Tables']['purchase_order_payments']['Row']
export type PurchaseOrderPaymentInsert = Database['public']['Tables']['purchase_order_payments']['Insert']

export type PurchaseOrderWithItems = PurchaseOrder & {
    items: (PurchaseOrderItem & { product: Produto })[]
    payments?: PurchaseOrderPayment[]
}

export type VendaComItens = Venda & {
    itens: (ItemVenda & { produto: Produto })[]
    contato: Contato
}

export type ContatoComIndicador = Contato & {
    indicador?: Contato | null
}
