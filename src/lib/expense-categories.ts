/**
 * Single source of truth for the admin Expense ledger's category list.
 *
 * Used by:
 *   - admin POST/PUT validation (`/api/admin/expenses`)
 *   - the form's category Select
 *   - the list page's filter dropdown
 *   - the dashboard's "Expenses by Category" breakdown
 *   - the export to Excel
 *
 * Add new categories here and every consumer picks them up automatically.
 * Edit with care: changing a label will detach historical rows from the new
 * label until they're manually re-categorised.
 */

export const EXPENSE_CATEGORIES = [
  'Utilities',
  'Rent',
  'Salaries',
  'Marketing',
  'Travel',
  'Software',
  'Office Supplies',
  'Inventory / COGS',
  'Misc',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

/** Category used by the auto-sync from PurchaseOrders. */
export const PO_LINKED_CATEGORY: ExpenseCategory = 'Inventory / COGS'

/** `Expense.sourceType` value used by the PO auto-sync. */
export const EXPENSE_SOURCE_PURCHASE_ORDER = 'PURCHASE_ORDER' as const

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && (EXPENSE_CATEGORIES as readonly string[]).includes(value)
}
