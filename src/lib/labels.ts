import type { Alert, AlertStatus, PermitStatus, Severity, Tone, VisitStatus, VisitType } from '@/data/types';
import type { ChipTone } from '@/components/ui';

export const sevTone: Record<Severity, ChipTone> = { critical: 'red', high: 'red', warning: 'amber', nuisance: 'blue', info: 'grey' };
export const sevLabel: Record<Severity, string> = { critical: 'Critical', high: 'High', warning: 'Warning', nuisance: 'Nuisance', info: 'Info' };
export const sevBar: Record<Severity, string> = { critical: '#E5484D', high: '#E5484D', warning: '#F59E0B', nuisance: '#1D4FE0', info: '#5B6585' };
export const sevCam: Record<Severity, Tone> = { critical: 'red', high: 'red', warning: 'amber', nuisance: 'blue', info: 'blue' };

export const statusLabel: Record<AlertStatus, string> = { open: 'Awaiting review', acknowledged: 'Acknowledged', dispatched: 'Guard dispatched', on_scene: 'Guard on scene', closed: 'Closed' };
export const statusTone: Record<AlertStatus, ChipTone> = { open: 'amber', acknowledged: 'grey', dispatched: 'blue', on_scene: 'blue', closed: 'teal' };

export const alertStatusText = (a: Alert) => (a.status === 'closed' ? a.outcome ?? 'Closed' : statusLabel[a.status]);

export const visitTypeLabel: Record<VisitType, string> = { guest: 'Guest', contractor: 'Contractor', rider: 'Rider', helper: 'Helper', driver: 'Driver', event: 'Event', family: 'Family', tutor: 'Tutor' };
export const visitTypeTone: Record<VisitType, ChipTone> = { guest: 'blue', contractor: 'amber', rider: 'grey', helper: 'purple', driver: 'purple', event: 'grey', family: 'blue', tutor: 'purple' };
export const visitStatusLabel: Record<VisitStatus, string> = { expected: 'Expected', on_site: 'On site', left: 'Left', cancelled: 'Cancelled', denied: 'Denied' };
export const visitStatusTone: Record<VisitStatus, ChipTone> = { expected: 'blue', on_site: 'teal', left: 'grey', cancelled: 'grey', denied: 'red' };

export const permitLabel: Record<PermitStatus, string> = {
  review: 'Review', active: 'Active', awaiting_deposit: 'Awaiting deposit', ending: 'Ending today', breach: 'Worker overstay', rejected: 'Rejected', completed: 'Completed', changes_requested: 'Changes requested',
};
export const permitTone: Record<PermitStatus, ChipTone> = {
  review: 'amber', active: 'teal', awaiting_deposit: 'grey', ending: 'blue', breach: 'red', rejected: 'red', completed: 'grey', changes_requested: 'amber',
};

export const AVATAR_COLORS = ['#1D4FE0', '#14A38F', '#5B34B8', '#C2410C', '#0B1640', '#3A4468'];
export const colorFor = (s: string) => AVATAR_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
