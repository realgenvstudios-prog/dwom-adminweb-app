// The values the Expense model documents for paymentMethod.
export const EXPENSE_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
];

export function methodLabel(value: string | null | undefined): string {
  if (!value) return 'None';
  return EXPENSE_METHODS.find((m) => m.value === value)?.label ?? value;
}

/** Expense.amount is a Prisma Decimal — a string over JSON. */
export function amountOf(e: { amount: number | string }): number {
  const n = Number.parseFloat(String(e.amount));
  return Number.isFinite(n) ? n : 0;
}

export function monthKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 7);
}

// The values FounderLedgerEntry.method documents.
export const FOUNDER_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank transfer' },
];
