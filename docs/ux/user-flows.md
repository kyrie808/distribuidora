# Core User Flows - Gilmar Distribuidor Massas

## 1. Sales Flow (Nova Venda)
The primary revenue-generating flow of the application.

```mermaid
graph TD
    A[Dashboard/Menu] -->|Click Nova Venda| B(Select Client)
    B --> C(Browse/Search Products)
    C --> D(Add to Cart)
    D --> E(Review Cart)
    E --> F{Checkout}
    F -->|Confirm| G[Sale Detail Page]
    F -->|Cancel| E
```

## 2. Fulfillment Flow (Engregas)
Managing the "Last Mile" of the distribution.

```mermaid
graph TD
    A[Dashboard/Menu] --> B(List Pending Sales)
    B --> C(Assign/Update Delivery Date)
    C --> D(Mark as Delivered)
    D --> E(Update Stock Automatically)
```

## 3. Financial Reconciliation (Fluxo de Caixa)
Managing the money coming in and out.

```mermaid
graph TD
    A[Dashboard/Menu] --> B(View Monthly Fluxo)
    B --> C(Analyze Revenue vs Expenses)
    C --> D{Check Alerts}
    D -->|Overdue| E(Follow up with Client)
    D -->|Pending PO| F(Pay Supplier)
```

## 4. Purchasing Flow (Financeiro/Compras)
Replenishing the inventory.

```mermaid
graph TD
    A[Menu] --> B(Create Purchase Order)
    B --> C(Assign Status: Pending)
    C --> D(Mark as Received)
    D --> E(Increase Stock)
    D --> F(Track Payment installments)
```

## User Personas Impacted
1. **Admin/Owner**: Focused on Dashboard, Financial Flows, and Reports.
2. **Sales Rep**: Focused on Nova Venda and Client Management.
3. **Warehouse/Logistics**: Focused on Entregas and Stock management.
