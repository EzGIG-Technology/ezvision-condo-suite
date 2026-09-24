import { Link } from 'react-router-dom';
import { ArrowRight, Monitor, MonitorSmartphone, RotateCcw, Smartphone, Tablet, Ticket } from 'lucide-react';
import { Logo, CamFeed } from '@/components/vision';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/toast';
import { useDocumentTitle } from '@/lib/hooks';
import { Confirm } from '@/components/ui';
import { useState } from 'react';

const surfaces = [
  { to: '/login', icon: Monitor, title: 'Management Portal', who: 'JMB/MC, building manager, security supervisor', body: 'Command center, live AI camera wall, unregistered-entry gallery, visitors, vehicles, permits, guard KPIs, reports and PDPA controls.', tone: 'bg-brand text-white' },
  { to: '/guard', icon: Tablet, title: 'Guard Tablet', who: 'Guards at the guardhouse and on patrol', body: 'Gate console, alert takeover with AI talk-down, walk-in registration with ID and face check, QR verification, parcels, patrol and handover.', tone: 'bg-navy text-white' },
  { to: '/app', icon: Smartphone, title: 'Resident App', who: 'Owners, tenants and household', body: 'Invite visitors, approve walk-ins, parcels, facility booking, SOS, face access, renovation permits and fees.', tone: 'bg-teal text-white' },
  { to: '/v/v-10', icon: Ticket, title: 'Visitor & Courier Pass', who: 'Guests, riders and couriers, no app needed', body: 'The pass page a visitor gets on WhatsApp, optional selfie for lobby entry, and the one-time courier code.', tone: 'bg-warn-soft text-warn-ink' },
  { to: '/panel', icon: MonitorSmartphone, title: 'Lobby Intercom Panel', who: 'Visitors at a tower lobby door', body: 'Key in a unit number to video-call the resident app. The resident answers on their phone and opens the lobby door.', tone: 'bg-grape-soft text-grape-ink' },
];

export default function Launcher() {
  useDocumentTitle('Choose an app');
  const reset = useStore((s) => s.resetDemo);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="min-h-screen bg-ice">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo sub="Condo Suite" />
        <button type="button" onClick={() => setConfirm(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-muted-dark hover:bg-white">
          <RotateCcw className="h-4 w-4" /> Reset demo data
        </button>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <section className="grid items-center gap-8 py-6 lg:grid-cols-[1.1fr_1fr] lg:py-10">
          <div className="flex flex-col gap-5">
            <span className="eyebrow text-teal-dark">Visitor management + AI vision security</span>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
              Know everyone who walks in.<br /><span className="text-brand">Every visitor, every vehicle.</span>
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-muted-dark">
              One platform for Vista Harmoni Residences: the management portal, the guard tablet, the resident app and the visitor pass all share the same live data. Open two of them side by side to watch a visit, an alert or a parcel move through the whole journey.
            </p>
          </div>
          <CamFeed scene="lobby" tone="red" tag="Unregistered person · Tower A lobby" cam="CAM 08 · Tower A turnstiles" time="22:07:31" size="lg" className="rounded-3xl shadow-pop" />
        </section>
        <section aria-label="Choose an app" className="grid gap-4 sm:grid-cols-2">
          {surfaces.map((s) => (
            <Link key={s.to} to={s.to} className="card group flex gap-4 p-5 transition-shadow hover:shadow-pop">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${s.tone}`}><s.icon className="h-6 w-6" /></span>
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-lg font-extrabold tracking-tight">{s.title}</span>
                  <ArrowRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                </span>
                <span className="text-xs font-bold text-teal-dark">{s.who}</span>
                <span className="text-[13.5px] leading-relaxed text-muted-dark">{s.body}</span>
              </span>
            </Link>
          ))}
        </section>
        <section className="mt-8 grid gap-4 rounded-2xl border border-line bg-white p-5 text-[13px] text-muted-dark sm:grid-cols-3">
          <div><p className="font-bold text-navy">Portal sign-in</p><p>Any email and password. Two-step code: any 6 digits.</p></div>
          <div><p className="font-bold text-navy">Guard PIN</p><p>Kumar Selvam 2468 · Aiman Rashid 1111 · Mohd Taufiq 3333</p></div>
          <div><p className="font-bold text-navy">Resident sign-in</p><p>Mobile 012-345 6789, then any 6-digit code.</p></div>
        </section>
        <p className="mt-6 text-center text-xs text-muted">Sample data only. Names, plates and units are fictional. Camera views and faces are illustrations, not real footage.</p>
      </main>
      <Confirm open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?" body="All visits, alerts, parcels and settings go back to the starting scenario. Sign-ins are kept." confirmLabel="Reset" danger
        onConfirm={() => { reset(); toast.success('Demo data reset'); }} />
    </div>
  );
}
