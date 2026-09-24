import type { useStore } from '@/store/useStore';

type State = ReturnType<typeof useStore.getState>;

/** Strata accounts for the quarter: maintenance fund and sinking fund (10% of charges under the Strata Management Act 2013). */
export function strataAccounts(s: State) {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const bookingFees = s.bookings.filter((b) => b.status === 'confirmed').reduce((n, b) => n + b.fee, 0);
  const depositsHeld =
    s.bookings.filter((b) => b.status === 'confirmed' && new Date(b.date) >= today).reduce((n, b) => n + b.deposit, 0) +
    s.permits.filter((p) => p.depositPaid && p.status !== 'completed').reduce((n, p) => n + p.deposit, 0) +
    s.liftBookings.filter((b) => b.depositPaid && !b.depositRefunded).reduce((n, b) => n + (b.deposit ?? 0), 0);
  const ev = s.resolutions.find((r) => /EV chargers/i.test(r.title));
  const sinkingCommitted = ev?.status === 'passed' ? 86_000 : 0;

  const billed = { maintenance: 1_852_727, sinking: 185_273 };
  const collected = { maintenance: 1_711_818, sinking: 171_182 };
  const expenses: [string, number][] = [
    ['Security guards (Securiforce Sdn Bhd)', 312_000], ['Management fee', 90_000], ['Cleaning', 96_000], ['Common area electricity and water', 141_500],
    ['Lift maintenance', 48_600], ['Repairs and maintenance', 64_300], ['Landscaping', 27_000], ['Insurance', 22_400], ['EzVision subscription', 18_900],
  ];
  const spent = expenses.reduce((n, [, v]) => n + v, 0);
  const opening = { maintenance: 612_400, sinking: 1_286_000 };
  const balance = {
    maintenance: opening.maintenance + collected.maintenance + bookingFees - spent,
    sinking: opening.sinking + collected.sinking - sinkingCommitted,
  };
  const ledger: [string, string, number][] = [
    ['Opening balance', 'Maintenance fund', opening.maintenance],
    ['Opening balance', 'Sinking fund', opening.sinking],
    ['Maintenance charges collected', 'Maintenance fund', collected.maintenance],
    ['Sinking fund contributions collected', 'Sinking fund', collected.sinking],
    ['Facility booking fees', 'Maintenance fund', bookingFees],
    ...expenses.map(([k, v]) => [k, 'Maintenance fund', -v] as [string, string, number]),
    ...(sinkingCommitted ? [['EV chargers at B1 (EGM 2026/2, committed)', 'Sinking fund', -sinkingCommitted] as [string, string, number]] : []),
  ];
  return {
    quarter: 'Q3 2026', billed, collected, expenses, spent, opening, balance, bookingFees, depositsHeld, sinkingCommitted, ledger,
    collectionRate: (collected.maintenance + collected.sinking) / (billed.maintenance + billed.sinking),
  };
}
