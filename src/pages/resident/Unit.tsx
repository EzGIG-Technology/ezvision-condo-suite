import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, ChevronRight, CreditCard, FileText, Hammer, LogOut, MessageCircle, Plus, ScanFace, ShieldCheck, Smartphone, Truck, UserPlus, Vote, Wrench } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Avatar, Card, Chip, Confirm, Field, Input, Modal, Plate, Select, Switch } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { colorFor } from '@/lib/labels';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

export default function ResidentUnit() {
  useDocumentTitle('My unit');
  const resident = useStore((s) => s.resident);
  const units = useStore((s) => s.units);
  const limits = useStore((s) => s.limits);
  const { updateUnit, logoutResident } = useStore.getState();
  const navigate = useNavigate();
  const u = units.find((x) => x.unit === resident.unit)!;
  const [member, setMember] = useState(false);
  const [car, setCar] = useState(false);
  const [lost, setLost] = useState<string | null>(null);
  const [out, setOut] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Family member');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [prefs, setPrefs] = useState({ visitors: true, parcels: true, security: true, whatsapp: false });

  const addMember = () => {
    if (!name.trim() || phone.replace(/\D/g, '').length < 9) return toast.error('Enter a name and mobile number');
    updateUnit(u.unit, { household: [...u.household, { name: name.trim(), role, app: true, face: false }] });
    toast.success(`${name.split(' ')[0]} invited`, 'They get an SMS to set up the app.');
    setMember(false); setName(''); setPhone('');
  };
  const addCar = () => {
    if (!plate.trim()) return toast.error('Enter the plate');
    if (u.vehicles.length >= limits.vehiclesPerUnit) return toast.error(`Maximum ${limits.vehiclesPerUnit} cars per unit`, 'Remove one first or ask the management office.');
    updateUnit(u.unit, { vehicles: [...u.vehicles, { plate: plate.toUpperCase().trim(), model: model || 'Car' }] });
    toast.success(`${plate.toUpperCase()} registered`, 'The barrier will open for it from now.');
    setCar(false); setPlate(''); setModel('');
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center gap-3 p-4">
        <Avatar name={resident.name} color="#14A38F" size={48} />
        <div className="flex-1"><p className="font-extrabold">{resident.name}</p><p className="text-xs text-muted">Primary tenant · {u.unit} · until {u.tenancyEnds}</p></div>
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between"><h2 className="h2">Household</h2><Button size="sm" variant="ghost" icon={<UserPlus className="h-4 w-4" />} onClick={() => setMember(true)}>Add</Button></div>
        {u.household.map((h) => (
          <div key={h.name} className="flex items-center gap-3 py-2">
            <Avatar name={h.name} color={colorFor(h.name)} size={34} />
            <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold">{h.name}</p><p className="text-xs text-muted">{h.role}</p></div>
            {h.app && <Smartphone className="h-4 w-4 text-teal" aria-label="On the app" />}
            {h.face && <ScanFace className="h-4 w-4 text-grape-ink" aria-label="Face access" />}
            {h.name !== resident.name && <button type="button" onClick={() => { updateUnit(u.unit, { household: u.household.filter((x) => x.name !== h.name) }); toast.info(`${h.name} removed`); }} className="text-xs font-semibold text-muted hover:text-danger">Remove</button>}
          </div>
        ))}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between"><h2 className="h2">Cars</h2><Button size="sm" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={() => setCar(true)}>Add</Button></div>
        {u.vehicles.map((v) => (
          <div key={v.plate} className="flex items-center gap-3 py-2"><Car className="h-5 w-5 text-muted" /><div className="flex-1"><Plate>{v.plate}</Plate><p className="mt-0.5 text-xs text-muted">{v.model}{v.tag ? ` · UHF tag ${v.tag}` : ''}</p></div><button type="button" onClick={() => { updateUnit(u.unit, { vehicles: u.vehicles.filter((x) => x.plate !== v.plate) }); toast.info(`${v.plate} removed`); }} className="text-xs font-semibold text-muted hover:text-danger">Remove</button></div>
        ))}
        <p className="mt-1 text-xs text-muted">Parking bays {u.bays}</p>
      </Card>

      <Card className="p-4">
        <h2 className="h2 mb-2">Access cards</h2>
        {u.cards.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-2">
            <CreditCard className={c.active ? 'h-5 w-5 text-teal' : 'h-5 w-5 text-danger'} />
            <div className="flex-1"><p className="font-mono text-[13px] font-bold">{c.id}</p><p className="text-xs text-muted">{c.holder}{c.note ? ` · ${c.note}` : ''}</p></div>
            {c.active ? <button type="button" onClick={() => setLost(c.id)} className="text-xs font-semibold text-danger">Report lost</button> : <Chip tone="red">Blocked</Chip>}
          </div>
        ))}
      </Card>

      <Card className="overflow-hidden">
        {[
          { to: '/app/face', icon: ScanFace, label: 'Face access' },
          { to: '/app/renovation', icon: Hammer, label: 'Renovation permit' },
          { to: '/app/billing', icon: FileText, label: 'Fees and billing' },
          { to: '/app/move', icon: Truck, label: 'Move in or out' },
          { to: '/app/report', icon: Wrench, label: 'Report an issue' },
          { to: '/app/guardhouse', icon: MessageCircle, label: 'Message the guardhouse' },
          { to: '/app/vote', icon: Vote, label: 'AGM and e-voting' },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5 last:border-0 hover:bg-ice"><l.icon className="h-5 w-5 text-muted" /><span className="flex-1 text-[14px] font-semibold">{l.label}</span><ChevronRight className="h-4 w-4 text-muted" /></Link>
        ))}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="h2">Notifications</h2>
        {([['visitors', 'Visitor arrivals'], ['parcels', 'Parcels'], ['security', 'Security notices'], ['whatsapp', 'Also send by WhatsApp']] as const).map(([k, l]) => (
          <div key={k} className="flex items-center justify-between"><span className="text-[13.5px]">{l}</span><Switch checked={prefs[k]} label={l} onChange={(v) => { setPrefs({ ...prefs, [k]: v }); toast.info(`${l} ${v ? 'on' : 'off'}`); }} /></div>
        ))}
        {!prefs.security && <p className="text-xs text-warn-ink">Emergency notices are always sent, even with this off.</p>}
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-teal" /><a href="mailto:dpo@vistaharmoni.my" className="underline">Privacy and your data</a></p>
      <Button size="lg" block icon={<LogOut className="h-4 w-4" />} onClick={() => setOut(true)}>Sign out</Button>

      <Modal open={member} onClose={() => setMember(false)} title="Add a household member"
        footer={<><Button onClick={() => setMember(false)}>Cancel</Button><Button variant="primary" onClick={addMember}>Send invite</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Name">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          <Field label="Mobile number">{(id) => <Input id={id} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="012-345 6789" />}</Field>
          <Field label="Relationship">{(id) => <Select id={id} value={role} onChange={(e) => setRole(e.target.value)}>{['Family member', 'Spouse', 'Son', 'Daughter', 'Parent', 'Co-tenant'].map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
        </div>
      </Modal>
      <Modal open={car} onClose={() => setCar(false)} title="Register a car"
        footer={<><Button onClick={() => setCar(false)}>Cancel</Button><Button variant="primary" onClick={addCar}>Register</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Plate">{(id) => <Input id={id} value={plate} onChange={(e) => setPlate(e.target.value)} className="font-mono uppercase" placeholder="VBK 2231" />}</Field>
          <Field label="Make, model and colour">{(id) => <Input id={id} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Honda HR-V · white" />}</Field>
        </div>
      </Modal>
      <Confirm open={!!lost} onClose={() => setLost(null)} danger confirmLabel="Block card" title="Block this card?" body="It stops working at every door and barrier right away. Collect a replacement at the management office (RM 50)."
        onConfirm={() => { if (lost) { updateUnit(u.unit, { cards: u.cards.map((c) => (c.id === lost ? { ...c, active: false, note: 'Reported lost today' } : c)) }); toast.success('Card blocked'); } }} />
      <Confirm open={out} onClose={() => setOut(false)} title="Sign out?" confirmLabel="Sign out" body="You will stop getting visitor and parcel alerts on this phone."
        onConfirm={() => { logoutResident(); navigate('/app/login'); }} />
    </div>
  );
}
