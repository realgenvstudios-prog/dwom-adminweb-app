import type { Trip, Worker } from '../../services/workersService';

export const PICKER_TYPES = [
  { value: 'kayayie', label: 'Kayayie' },
  { value: 'picker', label: 'Picker' },
];

export function pickerTypeLabel(value: string) {
  return PICKER_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Trip.totalCost is a Prisma Decimal — a string over JSON. */
export function tripPay(t: Trip): number {
  const n = Number.parseFloat(String(t.totalCost));
  return Number.isFinite(n) ? n : 0;
}

/** Trips are dated in UTC days (TripsService), which is Ghana time. */
export function dayKey(iso: string | Date): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export interface PickerRow extends Worker {
  ordersThisWeek: number;
  payThisWeek: number;
  lastTrip: string | null;
}

/** Roster rows with the last 7 days of trip activity folded in. */
export function buildPickerRows(workers: Worker[], trips: Trip[], weekStart: string): PickerRow[] {
  return workers.map((w) => {
    const mine = trips.filter((t) => t.workerId === w.id);
    const week = mine.filter((t) => dayKey(t.date) >= weekStart);
    return {
      ...w,
      ordersThisWeek: week.reduce((s, t) => s + t.TripOrder.length, 0),
      payThisWeek: week.reduce((s, t) => s + tripPay(t), 0),
      lastTrip: mine[0]?.date ?? null,
    };
  });
}
