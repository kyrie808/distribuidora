# Story 03: Database-level Inventory Triggers

## Description
As a business owner, I want product stock to be automatically updated in the database whenever a sale occurs or a purchase is received, so that my inventory metrics are always accurate and consistent.

## Tasks
- [ ] Create a PostgreSQL function to handle inventory adjustments.
- [ ] Add an `AFTER INSERT OR DELETE` trigger to `public.itens_venda`.
- [ ] Add an `AFTER INSERT` trigger to `public.purchase_order_items`.
- [ ] Implement safety checks to prevent negative stock (unless specifically allowed).

## Acceptance Criteria
- [ ] Inserting a new sale item automatically decrements the `produtos.estoque_atual`.
- [ ] Deleting a sale item restores the stock.
- [ ] Receiving a purchase order increments the stock.
- [ ] Consistency is maintained even if the frontend fails after DB submission.
