import { useRef, useState } from 'react';
import { Camera, Plus, Wrench, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Chip, Empty, Field, Input, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { dayLabel, shrinkImage } from '@/lib/utils';
import { ticketTone } from '@/lib/labels';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { TicketCategory } from '@/data/types';

const CATEGORIES: { value: TicketCategory; hint: string }[] = [
  { value: 'Defect', hint: 'Something broken: lift, lights, pipes, doors' },
  { value: 'Cleanliness', hint: 'Rubbish, dumping, spills, pests' },
  { value: 'Noise', hint: 'Renovation or neighbour noise' },
  { value: 'Parking', hint: 'Bay misuse, blocked cars' },
  { value: 'Security', hint: 'Damaged fence, broken gate, suspicious activity' },
  { value: 'Other', hint: 'Anything else for management' },
];

export default function ResidentReport() {
  useDocumentTitle('Report an issue');
  const unit = useStore((s) => s.resident.unit);
  const tickets = useStore((s) => s.tickets);
  const createTicket = useStore((s) => s.createTicket);
  const mine = tickets.filter((t) => t.unit === unit);
  const [form, setForm] = useState(false);
  const [category, setCategory] = useState<TicketCategory>('Defect');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState<string>();
  const file = useRef<HTMLInputElement>(null);

  const pick = async (f?: File) => {
    if (!f) return;
    try { setPhoto(await shrinkImage(f)); } catch { toast.error('That file is not a photo'); }
  };

  const submit = () => {
    if (!title.trim()) return toast.error('Say what the problem is');
    if (!location.trim()) return toast.error('Say where it is', 'For example: Tower A, level 15 lift lobby.');
    const id = createTicket({
      title: title.trim(), category, location: location.trim(), details: details.trim(), photo, evidence: !!photo, unit,
      meta: `Reported by ${unit} · ${location.trim()}`, state: 'New', raisedBy: 'resident',
    });
    toast.success(`Report ${id} sent`, 'Management will update you here.');
    setForm(false); setTitle(''); setLocation(''); setDetails(''); setPhoto(undefined);
  };

  if (form) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3 p-4">
          <Field label="Type" hint={CATEGORIES.find((c) => c.value === category)?.hint}>{(id) => <Select id={id} value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)}>{CATEGORIES.map((c) => <option key={c.value}>{c.value}</option>)}</Select>}</Field>
          <Field label="What is the problem?">{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Corridor light not working" />}</Field>
          <Field label="Where?">{(id) => <Input id={id} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Tower A, level 15, near lift" />}</Field>
          <Field label="More details (optional)">{(id) => <Textarea id={id} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="When did it start? Anything management should know?" className="min-h-[72px]" />}</Field>
          <input ref={file} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Photo of the problem" onChange={(e) => pick(e.target.files?.[0])} />
          {photo ? (
            <div className="relative self-start">
              <img src={photo} alt="Photo of the problem" className="h-32 rounded-xl object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => setPhoto(undefined)} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-navy/70 text-white"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <Button icon={<Camera className="h-4 w-4" />} onClick={() => file.current?.click()} className="self-start">Add a photo</Button>
          )}
        </Card>
        <div className="flex gap-2"><Button size="lg" onClick={() => setForm(false)}>Cancel</Button><Button size="lg" variant="primary" className="flex-1" onClick={submit}>Send report</Button></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="primary" size="lg" block icon={<Plus className="h-4 w-4" />} onClick={() => setForm(true)}>Report an issue</Button>
      {mine.map((t) => (
        <Card key={t.id} className="flex gap-3 p-4">
          {t.photo && <img src={t.photo} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold">{t.title}</p>
              <Chip tone={ticketTone[t.state]}>{t.state}</Chip>
            </div>
            <p className="text-xs text-muted">{t.id}{t.category ? ` · ${t.category}` : ''}{t.createdAt ? ` · ${dayLabel(t.createdAt)}` : ''}</p>
            <p className="mt-1 text-[12.5px] text-muted-dark">{t.location ?? t.meta}</p>
          </div>
        </Card>
      ))}
      {!mine.length && <Card><Empty icon={<Wrench className="h-5 w-5" />} title="No reports yet" body="Report broken fittings, dumping, noise or parking problems. Add a photo to help management fix it faster." /></Card>}
    </div>
  );
}
