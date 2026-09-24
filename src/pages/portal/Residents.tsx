import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Car, CreditCard, Download, Mail, MessageSquare, Plus, Search, ShieldCheck, Smartphone, UserPlus, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Avatar, Card, CardHeader, Checkbox, Chip, Empty, Field, Input, Modal, Plate, Segmented, Select, Textarea, type ChipTone } from '@/components/ui';
import { Button, IconButton } from '@/components/ui/Button';
import { colorFor, visitStatusLabel, visitStatusTone } from '@/lib/labels';
import { cn, downloadFile, todayStamp, toCsv, when } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { UnitRecord } from '@/data/types';

const tagTone: Record<UnitRecord['tag'], ChipTone> = { Owner: 'blue', Tenant: 'purple', Vacant: 'grey', Ending: 'amber', Reno: 'amber' };

export default function Residents() {
  const { unit } = useParams();
  return unit ? <UnitDetail unitId={unit} /> : <Directory />;
}

function Directory() {
  const units = useStore((s) => s.units);
  const navigate = useNavigate();
  const [tower, setTower] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [tag, setTag] = useState('all');
  const [q, setQ] = useState('');
  const list = units
    .filter((u) => tower === 'all' || u.tower === tower)
    .filter((u) => tag === 'all' || u.tag === tag || (tag === 'arrears' && !u.feesOk))
    .filter((u) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return u.unit.toLowerCase().includes(s) || u.name.toLowerCase().includes(s) || u.vehicles.some((v) => v.plate.toLowerCase().replace(/\s/g, '').includes(s.replace(/\s/g, ''))) || u.household.some((h) => h.name.toLowerCase().includes(s));
    });

  const exportCsv = () => {
    downloadFile(`units-${todayStamp()}.csv`, toCsv([['Unit', 'Tower', 'Occupant', 'Type', 'Household', 'Vehicles', 'Bays', 'Fees'], ...list.map((u) => [u.unit, u.tower, u.name, u.tag, u.household.length, u.vehicles.map((v) => v.plate).join(' / '), u.bays, u.feesOk ? 'Paid' : 'Arrears'])]));
    toast.success('Unit directory exported', `${list.length} units`);
  };

  const stats = [
    ['Units', '612', '598 occupied · 14 vacant'],
    ['Residents on app', '1,284', '87% of households'],
    ['Face access enrolled', '742', 'Consent recorded for each'],
    ['Tenancies ending in 30 days', '9', 'Access auto-expires on the end date'],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(([l, v, n]) => (
          <Card key={l} className="flex flex-col gap-1.5 p-4"><span className="text-[12.5px] font-bold text-muted-dark">{l}</span><span className="text-[26px] font-extrabold tracking-tight">{v}</span><span className="text-xs text-muted">{n}</span></Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          <CardHeader title="Unit directory" sub="Owners, tenants, household members, cars and access cards" action={<Button size="sm" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export CSV</Button>} />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Tower" value={tower} onChange={setTower} options={[{ value: 'all', label: 'All towers' }, { value: 'A', label: 'Tower A' }, { value: 'B', label: 'Tower B' }, { value: 'C', label: 'Tower C' }]} />
            <Select aria-label="Filter by type" value={tag} onChange={(e) => setTag(e.target.value)} className="w-auto">
              <option value="all">All types</option>
              <option value="Owner">Owner-occupied</option>
              <option value="Tenant">Tenanted</option>
              <option value="Ending">Tenancy ending</option>
              <option value="Reno">Renovating</option>
              <option value="Vacant">Vacant</option>
              <option value="arrears">Fees in arrears</option>
            </Select>
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input aria-label="Search units" placeholder="Unit, name or plate" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[760px]">
            <thead><tr><th>Unit</th><th>Occupant</th><th>Type</th><th>Household</th><th>Vehicles</th><th>Bays</th><th>Fees</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.unit} className="clickable" onClick={() => navigate(`/portal/residents/${u.unit}`)}>
                  <td><Link to={`/portal/residents/${u.unit}`} onClick={(e) => e.stopPropagation()} className="font-mono font-bold text-brand hover:underline">{u.unit}</Link></td>
                  <td><div className="font-semibold">{u.name}</div><div className="text-xs text-muted">{u.meta}</div></td>
                  <td><Chip tone={tagTone[u.tag]}>{u.tag === 'Ending' ? 'Tenancy ending' : u.tag === 'Reno' ? 'Renovating' : u.tag}</Chip></td>
                  <td>{u.household.length || '—'}</td>
                  <td><div className="flex flex-wrap gap-1">{u.vehicles.length ? u.vehicles.map((v) => <Plate key={v.plate}>{v.plate}</Plate>) : <span className="text-muted">—</span>}</div></td>
                  <td className="text-muted-dark">{u.bays}</td>
                  <td>{u.feesOk ? <Chip tone="teal">Paid</Chip> : <Chip tone="red">Arrears</Chip>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <Empty icon={<Search className="h-5 w-5" />} title="No units match" body="Try another unit number, name or plate." action={<Button size="sm" onClick={() => { setQ(''); setTag('all'); setTower('all'); }}>Clear filters</Button>} />}
        </div>
        <div className="px-4 py-3 text-xs text-muted">Showing {list.length} of {units.length} units in the demo directory (612 in production).</div>
      </Card>
    </div>
  );
}

function UnitDetail({ unitId }: { unitId: string }) {
  const units = useStore((s) => s.units);
  const limits = useStore((s) => s.limits);
  const visits = useStore((s) => s.visits);
  const parcels = useStore((s) => s.parcels);
  const alerts = useStore((s) => s.alerts);
  const { updateUnit, addNotice, log } = useStore.getState();
  const u = units.find((x) => x.unit === unitId);
  const [msg, setMsg] = useState(false);
  const [tenant, setTenant] = useState(false);
  const [member, setMember] = useState(false);
  const [vehicle, setVehicle] = useState(false);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [mName, setMName] = useState('');
  const [mRole, setMRole] = useState('Family member');
  const [mInvite, setMInvite] = useState(true);
  const [vPlate, setVPlate] = useState('');
  const [vModel, setVModel] = useState('');
  const [tName, setTName] = useState('');
  const [tEnd, setTEnd] = useState('');
  const [tRevoke, setTRevoke] = useState(true);

  const activity = useMemo(() => {
    if (!u) return [];
    const rows: { at: string; text: string; kind: string }[] = [];
    visits.filter((v) => v.unit === u.unit).forEach((v) => rows.push({ at: v.checkIn ?? v.validFrom, text: `${v.name} · ${visitStatusLabel[v.status]}`, kind: 'Visitor' }));
    parcels.filter((p) => p.unit === u.unit).forEach((p) => rows.push({ at: p.loggedAt, text: `${p.courier} parcel · ${p.status === 'collected' ? 'collected' : `waiting on ${p.shelf}`}`, kind: 'Parcel' }));
    alerts.filter((a) => a.unit === u.unit).forEach((a) => rows.push({ at: a.at, text: a.title, kind: 'Alert' }));
    return rows.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [u, visits, parcels, alerts]);

  if (!u) {
    return (
      <Card><Empty title={`Unit ${unitId} not found`} body="It may have been removed from the demo directory." action={<Link to="/portal/residents" className="text-sm font-bold text-brand">Back to directory</Link>} /></Card>
    );
  }

  const unitVisits = visits.filter((v) => v.unit === u.unit);

  const sendMsg = () => {
    if (!msgTitle.trim()) return toast.error('Add a subject first');
    addNotice({ unit: u.unit, title: msgTitle, body: msgBody || 'Message from management.', kind: 'announcement' });
    log({ who: useStore.getState().session.portal?.name ?? 'Farah Hanim', role: 'Building Manager', action: 'Sent', record: `Message to ${u.unit}` });
    toast.success(`Message sent to ${u.unit}`, 'Delivered by app push and WhatsApp.');
    setMsg(false); setMsgTitle(''); setMsgBody('');
  };

  const addMember = () => {
    if (!mName.trim()) return toast.error('Enter a name');
    updateUnit(u.unit, { household: [...u.household, { name: mName.trim(), role: mRole, app: mInvite, face: false }] });
    toast.success(`${mName} added to ${u.unit}`, mInvite ? 'App invite sent by SMS.' : undefined);
    setMember(false); setMName('');
  };

  const issueTag = (plate: string) => {
    const tag = `UHF-${Math.floor(100000 + Math.random() * 900000)}`;
    updateUnit(u.unit, { vehicles: u.vehicles.map((v) => (v.plate === plate ? { ...v, tag } : v)) });
    log({ who: useStore.getState().session.portal?.name ?? 'Farah Hanim', role: 'Building Manager', action: 'Added', record: `UHF tag ${tag} for ${plate}` });
    toast.success(`Tag ${tag} issued to ${plate}`, 'The barrier reads it from 8 m, even when the plate is dirty or damaged.');
  };

  const addVehicle = () => {
    if (!vPlate.trim()) return toast.error('Enter a plate');
    if (u.vehicles.length >= limits.vehiclesPerUnit) return toast.error(`This unit already has ${limits.vehiclesPerUnit} cars`, 'Change the limit in Site settings, or remove a car first.');
    updateUnit(u.unit, { vehicles: [...u.vehicles, { plate: vPlate.toUpperCase().trim(), model: vModel || 'Vehicle' }] });
    toast.success(`${vPlate.toUpperCase()} registered`, 'The barrier will open for this plate from now.');
    setVehicle(false); setVPlate(''); setVModel('');
  };

  const changeTenant = () => {
    if (!tName.trim()) return toast.error('Enter the new tenant name');
    updateUnit(u.unit, {
      name: `${tName.trim()} (tenant)`, tag: 'Tenant', tenancyEnds: tEnd || undefined, since: 'Today',
      household: [{ name: tName.trim(), role: 'Primary tenant', app: true, face: false }],
      vehicles: tRevoke ? [] : u.vehicles,
      cards: tRevoke ? u.cards.map((c) => ({ ...c, active: false, note: 'Revoked on tenant change' })) : u.cards,
    });
    log({ who: useStore.getState().session.portal?.name ?? 'Farah Hanim', role: 'Building Manager', action: 'Changed', record: `Tenant for ${u.unit}` });
    toast.success('Tenant changed', tRevoke ? 'Old cards, plates and face templates were revoked.' : undefined);
    setTenant(false); setTName(''); setTEnd('');
  };

  const toggleCard = (id: string) => {
    const c = u.cards.find((x) => x.id === id);
    updateUnit(u.unit, { cards: u.cards.map((x) => (x.id === id ? { ...x, active: !x.active, note: x.active ? 'Blocked today' : undefined } : x)) });
    toast.info(c?.active ? `Card ${id} blocked` : `Card ${id} unblocked`);
  };

  const removeMember = (name: string) => {
    updateUnit(u.unit, { household: u.household.filter((h) => h.name !== name) });
    toast.info(`${name} removed`, 'App access and face template removed.');
  };

  const removeVehicle = (plate: string) => {
    updateUnit(u.unit, { vehicles: u.vehicles.filter((v) => v.plate !== plate) });
    toast.info(`${plate} removed`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/portal/residents" className="flex items-center gap-1.5 text-[13px] font-bold text-muted-dark hover:text-navy"><ArrowLeft className="h-4 w-4" /> All units</Link>
      </div>
      <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft font-mono text-sm font-extrabold text-brand-ink">{u.unit.split('-')[0]}</span>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="font-mono text-2xl font-extrabold tracking-tight">{u.unit}</h1><Chip tone={tagTone[u.tag]}>{u.tag}</Chip>{!u.feesOk && <Chip tone="red">Fees in arrears</Chip>}</div>
            <p className="text-[13px] text-muted-dark">{u.name} · {u.size.toLocaleString()} sq ft · {u.beds} bedrooms · Owner {u.owner}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<MessageSquare className="h-4 w-4" />} onClick={() => setMsg(true)}>Message unit</Button>
          <Button icon={<Users className="h-4 w-4" />} onClick={() => setTenant(true)}>Change tenant</Button>
          <Button variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setMember(true)}>Add member</Button>
        </div>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <Card className="overflow-hidden">
            <div className="p-4"><CardHeader title="Household" sub={`${u.household.length} people linked to this unit`} action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setMember(true)}>Add</Button>} /></div>
            {u.household.length ? (
              <ul className="divide-y divide-line-soft">
                {u.household.map((h) => (
                  <li key={h.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Avatar name={h.name} color={colorFor(h.name)} size={36} />
                    <div className="min-w-0 flex-1"><p className="font-semibold">{h.name}</p><p className="text-xs text-muted">{h.role}</p></div>
                    <Chip tone={h.app ? 'teal' : 'grey'}><Smartphone className="h-3 w-3" />{h.app ? 'On app' : 'No app'}</Chip>
                    <Chip tone={h.face ? 'teal' : 'grey'}><ShieldCheck className="h-3 w-3" />{h.face ? 'Face access' : 'Card only'}</Chip>
                    {!h.app && <Button size="sm" variant="ghost" onClick={() => { updateUnit(u.unit, { household: u.household.map((x) => (x.name === h.name ? { ...x, app: true } : x)) }); toast.success(`Invite sent to ${h.name}`); }}>Send invite</Button>}
                    <Button size="sm" variant="ghost" onClick={() => removeMember(h.name)}>Remove</Button>
                  </li>
                ))}
              </ul>
            ) : <Empty icon={<Users className="h-5 w-5" />} title="Nobody linked yet" body="Add the owner or tenant so they can use the resident app." />}
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4"><CardHeader title="Visitors" sub="Passes created for this unit" /></div>
            <div className="overflow-x-auto">
              <table className="tbl min-w-[560px]">
                <thead><tr><th>Visitor</th><th>Type</th><th>Status</th><th>When</th></tr></thead>
                <tbody>
                  {unitVisits.map((v) => (
                    <tr key={v.id}><td className="font-semibold">{v.name}</td><td className="capitalize">{v.type}</td><td><Chip tone={visitStatusTone[v.status]}>{visitStatusLabel[v.status]}</Chip></td><td className="text-muted-dark">{when(v.checkIn ?? v.validFrom)}</td></tr>
                  ))}
                </tbody>
              </table>
              {!unitVisits.length && <Empty title="No visitors for this unit yet" />}
            </div>
          </Card>

          <Card className="p-4">
            <CardHeader title="Activity" sub="Visitors, parcels and alerts linked to this unit" />
            <ul className="mt-3 flex flex-col">
              {activity.slice(0, 10).map((a, i) => (
                <li key={i} className="flex gap-3 border-b border-line-soft py-2.5 last:border-0">
                  <span className="w-24 shrink-0 text-xs text-muted">{when(a.at)}</span>
                  <Chip tone={a.kind === 'Alert' ? 'red' : a.kind === 'Parcel' ? 'amber' : 'blue'}>{a.kind}</Chip>
                  <span className="text-[13px]">{a.text}</span>
                </li>
              ))}
              {!activity.length && <li className="py-4 text-center text-sm text-muted">No activity recorded.</li>}
            </ul>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="p-4">
            <h2 className="h2">Tenancy</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
              <div><dt className="text-xs text-muted">Owner</dt><dd className="font-semibold">{u.owner}</dd></div>
              <div><dt className="text-xs text-muted">Since</dt><dd className="font-semibold">{u.since}</dd></div>
              <div><dt className="text-xs text-muted">Tenancy ends</dt><dd className="font-semibold">{u.tenancyEnds ?? '—'}</dd></div>
              <div><dt className="text-xs text-muted">Parking bays</dt><dd className="font-semibold">{u.bays}</dd></div>
            </dl>
            {u.tenancyEnds && <p className="mt-3 rounded-xl bg-ice p-3 text-xs text-muted-dark">Cards, plates and face templates for this tenant expire automatically on {u.tenancyEnds}.</p>}
          </Card>

          <Card className="p-4">
            <CardHeader title="Vehicles" action={<IconButton label="Add vehicle" onClick={() => setVehicle(true)}><Plus className="h-4 w-4" /></IconButton>} />
            <ul className="mt-3 flex flex-col gap-2">
              {u.vehicles.map((v) => (
                <li key={v.plate} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <Car className="h-5 w-5 text-muted" />
                  <div className="flex-1"><Plate>{v.plate}</Plate><p className="mt-1 text-xs text-muted">{v.model}{v.tag ? ` · UHF tag ${v.tag}` : ' · no UHF tag'}</p></div>
                  {!v.tag && <Button size="sm" variant="ghost" onClick={() => issueTag(v.plate)}>Issue UHF tag</Button>}
                  <Button size="sm" variant="ghost" onClick={() => removeVehicle(v.plate)}>Remove</Button>
                </li>
              ))}
              {!u.vehicles.length && <li className="text-sm text-muted">No vehicles registered.</li>}
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="h2">Access cards</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {u.cards.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <CreditCard className={cn('h-5 w-5', c.active ? 'text-teal' : 'text-danger')} />
                  <div className="flex-1"><p className="font-mono text-[13px] font-bold">{c.id}</p><p className="text-xs text-muted">{c.holder}{c.note ? ` · ${c.note}` : ''}</p></div>
                  <Button size="sm" variant={c.active ? 'secondary' : 'teal'} icon={c.active ? <Ban className="h-3.5 w-3.5" /> : undefined} onClick={() => toggleCard(c.id)}>{c.active ? 'Block' : 'Unblock'}</Button>
                </li>
              ))}
              {!u.cards.length && <li className="text-sm text-muted">No cards issued.</li>}
            </ul>
            <Button block className="mt-3" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { const id = `00${48 + ['A', 'B', 'C'].indexOf(u.tower)}-${Math.floor(1000 + Math.random() * 8999)}`; updateUnit(u.unit, { cards: [...u.cards, { id, holder: u.household[0]?.name ?? u.owner, active: true }] }); toast.success(`Card ${id} issued`); }}>Issue new card</Button>
          </Card>
        </div>
      </div>

      <Modal open={msg} onClose={() => setMsg(false)} title={`Message ${u.unit}`} description="Goes to everyone in the household by app push, with WhatsApp as a fallback."
        footer={<><Button onClick={() => setMsg(false)}>Cancel</Button><Button variant="primary" icon={<Mail className="h-4 w-4" />} onClick={sendMsg}>Send</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Subject">{(id) => <Input id={id} value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} placeholder="e.g. Parking bay reminder" />}</Field>
          <Field label="Message">{(id) => <Textarea id={id} value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Write your message" />}</Field>
        </div>
      </Modal>

      <Modal open={member} onClose={() => setMember(false)} title="Add household member"
        footer={<><Button onClick={() => setMember(false)}>Cancel</Button><Button variant="primary" onClick={addMember}>Add member</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Full name">{(id) => <Input id={id} value={mName} onChange={(e) => setMName(e.target.value)} placeholder="As on IC or passport" />}</Field>
          <Field label="Relationship">{(id) => <Select id={id} value={mRole} onChange={(e) => setMRole(e.target.value)}>{['Family member', 'Spouse', 'Son', 'Daughter', 'Parent', 'Helper · recurring pass', 'Co-tenant'].map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
          <Checkbox checked={mInvite} onChange={setMInvite} label="Send an app invite by SMS" sub="They can then invite visitors and approve walk-ins." />
        </div>
      </Modal>

      <Modal open={vehicle} onClose={() => setVehicle(false)} title="Register vehicle"
        footer={<><Button onClick={() => setVehicle(false)}>Cancel</Button><Button variant="primary" onClick={addVehicle}>Register</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Plate number">{(id) => <Input id={id} value={vPlate} onChange={(e) => setVPlate(e.target.value)} placeholder="e.g. VBK 2231" className="font-mono uppercase" />}</Field>
          <Field label="Make, model and colour">{(id) => <Input id={id} value={vModel} onChange={(e) => setVModel(e.target.value)} placeholder="e.g. Honda HR-V · white" />}</Field>
        </div>
      </Modal>

      <Modal open={tenant} onClose={() => setTenant(false)} title="Change tenant" description={`Replace the current occupant of ${u.unit}.`}
        footer={<><Button onClick={() => setTenant(false)}>Cancel</Button><Button variant="primary" onClick={changeTenant}>Change tenant</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="New tenant name">{(id) => <Input id={id} value={tName} onChange={(e) => setTName(e.target.value)} />}</Field>
          <Field label="Tenancy end date">{(id) => <Input id={id} type="date" value={tEnd} onChange={(e) => setTEnd(e.target.value)} />}</Field>
          <Checkbox checked={tRevoke} onChange={setTRevoke} label="Revoke the old tenant's cards, plates and face templates" sub="Recommended. Recorded in the PDPA audit log." />
        </div>
      </Modal>
    </div>
  );
}
