import { DoorOpen, Dumbbell, Flame, MapPin, PartyPopper, Trophy, Waves } from 'lucide-react';
import type { Booking, Facility, FacilityKind } from '@/data/types';

export const FACILITY_KINDS: Record<FacilityKind, { label: string; icon: typeof Flame }> = {
  hall: { label: 'Hall or event space', icon: PartyPopper },
  bbq: { label: 'BBQ pit', icon: Flame },
  court: { label: 'Sports court', icon: Trophy },
  gym: { label: 'Gym or studio', icon: Dumbbell },
  pool: { label: 'Pool', icon: Waves },
  room: { label: 'Meeting or games room', icon: DoorOpen },
  other: { label: 'Other', icon: MapPin },
};

export const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** Confirmed bookings for a facility from today onwards. */
export const upcomingBookings = (bookings: Booking[], f: Pick<Facility, 'name'>) => {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  return bookings.filter((b) => b.facility === f.name && b.status === 'confirmed' && new Date(b.date) >= today);
};
