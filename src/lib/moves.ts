import type { LiftBooking } from '@/data/types';

export const MOVE_SLOTS = ['09:00 to 12:00', '14:00 to 17:00'];
export const MOVE_DEPOSIT = 500;

/** A slot is taken when another live booking holds the same lift, day and slot. */
export const slotTaken = (all: LiftBooking[], lift: string, date: Date, slot: string, ignoreId?: string) =>
  all.some((b) => b.id !== ignoreId && b.lift === lift && b.slot === slot && b.status !== 'rejected' && new Date(b.date).toDateString() === date.toDateString());
