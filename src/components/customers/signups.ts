import type { Customer } from './CustomerTypes';

/** yyyy-mm-dd of a timestamp in Ghana time (UTC). */
export const dayOf = (iso: string) => new Date(iso).toISOString().slice(0, 10);

/** Customers whose join date falls in [start, end] (inclusive dates); all when start is null. */
export function joinedIn(customers: Customer[], start: string | null, end: string) {
  return customers.filter((c) => {
    const d = dayOf(c.createdAt);
    return (start === null || d >= start) && d <= end;
  });
}
