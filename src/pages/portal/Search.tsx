import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, Plus, Sparkles, SearchX } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { makeReads, type PlateRead } from '@/data/anpr';
import { Card, CardHeader, Checkbox, Chip, Empty, Plate, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CamFeed, FaceCrop } from '@/components/vision';
import { cn, hhmm, when } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { Scene, Sighting } from '@/data/types';

const SUGGESTIONS = ['red Myvi, yesterday 8 to 10pm, main gate', 'person in dark hoodie, perimeter, tonight', 'all side gate entries this week', 'plate WXY 8812'];
const COLOURS = ['red', 'white', 'black', 'silver', 'grey', 'blue', 'maroon'];
const MODELS = ['myvi', 'axia', 'bezza', 'saga', 'vios', 'civic', 'hr-v', 'hiace', 'motorcycle'];

type Result =
  | { kind: 'vehicle'; id: string; score: number; read: PlateRead }
  | { kind: 'person'; id: string; score: number; faceId: string; variant: number; where: string; at: string; note: string };

function understand(q: string) {
  const s = q.toLowerCase();
  const chips: string[] = [];
  const colour = COLOURS.find((c) => s.includes(c));
  const model = MODELS.find((m) => s.includes(m));
  const plate = q.toUpperCase().match(/[A-Z]{1,3}\s?\d{1,4}(\s?[A-Z])?/)?.[0];
  const person = /person|man|woman|hoodie|jacket|shirt|face|people|someone/.test(s);
  const vehicle = !!(colour || model || plate || /car|vehicle|lorry|van|plate/.test(s));
  const yesterday = s.includes('yesterday');
  const place = /side gate/.test(s) ? 'Side gate' : /main gate|gate/.test(s) ? 'Main gate' : /perimeter|fence/.test(s) ? 'Perimeter' : /lobby/.test(s) ? 'Lobbies' : /carpark|b1|b2/.test(s) ? 'Carpark' : undefined;
  if (vehicle) chips.push('Vehicle');
  if (person) chips.push('Person');
  if (colour) chips.push(`Colour: ${colour}`);
  if (model) chips.push(`Model: ${model === 'myvi' ? 'Perodua Myvi' : model}`);
  if (plate && /\d/.test(plate)) chips.push(`Plate: ${plate}`);
  if (yesterday) chips.push('Yesterday'); else if (/tonight|today/.test(s)) chips.push('Today'); else if (/week/.test(s)) chips.push('Last 7 days');
  if (place) chips.push(`${place} cameras`);
  return { chips, colour, model, plate: plate && /\d/.test(plate) ? plate.replace(/\s+/g, ' ') : undefined, person, vehicle, yesterday, place };
}

/** Where each scene sits on the site plan below (viewBox 322 × 170). */
const SCENE_XY: Record<Scene, [number, number]> = {
  gate: [161, 152], guardpost: [132, 152], lobby: [70, 72], corridor: [250, 72], carpark: [165, 114], pool: [42, 132], bin: [292, 138], fence: [300, 16], sidegate: [14, 96],
};

/** Unified map timeline: every sighting of one person on the site plan, numbered in time order. */
function SightingMap({ sightings }: { sightings: Sighting[] }) {
  const list = [...sightings].sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const pts = list.map((s, i) => { const [x, y] = SCENE_XY[s.scene] ?? [161, 85]; return [x + (i % 3) * 6, y - (i % 2) * 6] as const; });
  return (
    <>
      <svg viewBox="0 0 322 170" className="h-auto w-full" role="img" aria-label={`Map of ${list.length} sightings in time order`}>
        <rect x="1" y="1" width="320" height="168" rx="12" fill="#F7F9FD" stroke="#E3E9F4" />
        <rect x="30" y="22" width="80" height="46" rx="8" fill="#E8EEFF" /><text x="70" y="50" fontSize="11" fontWeight="700" textAnchor="middle" fill="#1D3FB0">Tower A</text>
        <rect x="210" y="22" width="80" height="46" rx="8" fill="#E8EEFF" /><text x="250" y="50" fontSize="11" fontWeight="700" textAnchor="middle" fill="#1D3FB0">Tower B</text>
        <rect x="120" y="96" width="90" height="36" rx="8" fill="#EEF1F7" /><text x="165" y="118" fontSize="11" fontWeight="700" textAnchor="middle" fill="#3A4468">Carpark</text>
        <text x="176" y="163" fontSize="10" fontWeight="700" fill="#0B1640">Main gate</text>
        {pts.length > 1 && <polyline points={pts.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#E5484D" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 6" />}
        {pts.map(([x, y], i) => (
          <g key={i}><circle cx={x} cy={y} r="8" fill="#E5484D" stroke="#fff" strokeWidth="2" /><text x={x} y={y + 3.5} fontSize="9.5" fontWeight="800" textAnchor="middle" fill="#fff">{i + 1}</text></g>
        ))}
      </svg>
      <ol className="flex flex-col">
        {list.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5 border-t border-line-soft py-1.5 text-[12.5px]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-dot text-[10.5px] font-extrabold text-white">{i + 1}</span>
            <span className="flex-1 font-semibold">{s.camera}</span><span className="font-mono text-muted">{when(s.at)}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? SUGGESTIONS[0];
  const [text, setText] = useState(q);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);
  const [sort, setSort] = useState('best');
  const faces = useStore((s) => s.unknownFaces);
  const createAlert = useStore((s) => s.createAlert);
  const navigate = useNavigate();
  const reads = useMemo(() => makeReads(), []);
  useEffect(() => setText(q), [q]);

  const u = understand(q);
  const results: Result[] = useMemo(() => {
    const out: Result[] = [];
    if (u.vehicle || !u.person) {
      reads.forEach((r) => {
        let score = 0;
        if (u.plate && r.plate.replace(/\s/g, '').includes(u.plate.replace(/\s/g, ''))) score += 60;
        if (u.colour && r.colour === u.colour) score += 30;
        if (u.colour && r.colour !== u.colour && u.colour === 'red' && r.colour === 'maroon') score += 14;
        if (u.model && r.model === u.model) score += 35;
        if (u.yesterday && (Date.now() - +new Date(r.at)) / 60000 > 1000) score += 20;
        if (u.place === 'Main gate' && /Lane/.test(r.lane)) score += 8;
        if (score > 20) out.push({ kind: 'vehicle', id: r.id, score: Math.min(98, score + 5), read: r });
      });
    }
    if (u.person) {
      faces.forEach((f) => {
        let score = 40;
        if (/hoodie/.test(q.toLowerCase()) && f.description.includes('hoodie')) score += 50;
        if (u.place && f.where.toLowerCase().includes(u.place.split(' ')[0].toLowerCase())) score += 25;
        if (score > 55) out.push({ kind: 'person', id: f.id, score: Math.min(97, score), faceId: f.id, variant: f.variant, where: f.where, at: f.at, note: f.description });
      });
    }
    return out.sort((a, b) => (sort === 'time' ? +new Date(b.kind === 'vehicle' ? b.read.at : b.at) - +new Date(a.kind === 'vehicle' ? a.read.at : a.at) : b.score - a.score));
  }, [q, reads, faces, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusRes = results.find((r) => r.id === focus) ?? results[0];
  const journey = focusRes?.kind === 'vehicle' ? reads.filter((r) => r.plate === focusRes.read.plate).sort((a, b) => +new Date(a.at) - +new Date(b.at)) : [];

  const run = (e?: FormEvent, value = text) => {
    e?.preventDefault();
    if (!value.trim()) return;
    setParams({ q: value.trim() });
    setSelected(new Set());
    setFocus(null);
  };

  const voice = () => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; start: () => void } }).webkitSpeechRecognition;
    if (!SR) { toast.info('Voice search', 'Your browser does not support voice input. Type your search instead.'); return; }
    const rec = new SR();
    rec.lang = 'en-MY';
    rec.onresult = (ev) => { const t = ev.results[0][0].transcript; setText(t); run(undefined, t); };
    rec.start();
    toast.info('Listening…', 'Describe what you are looking for');
  };

  const buildCase = () => {
    const picked = results.filter((r) => selected.has(r.id));
    const first = picked[0];
    const id = createAlert({
      category: 'report', title: `Investigation: ${q}`, where: first?.kind === 'vehicle' ? first.read.lane : first?.where ?? 'Multiple cameras', camera: first?.kind === 'vehicle' ? first.read.camera : 'Multiple',
      scene: first?.kind === 'vehicle' ? 'gate' : 'fence', at: new Date().toISOString(), severity: 'info', plate: first?.kind === 'vehicle' ? first.read.plate : undefined,
      summary: `Case built from evidence search "${q}". ${picked.length} clip(s): ${picked.map((p) => (p.kind === 'vehicle' ? `${p.read.plate} at ${p.read.lane} ${when(p.read.at)}` : `${p.where} ${when(p.at)}`)).join('; ')}.`,
      timelineText: `Case opened from evidence search with ${picked.length} clips`, owner: 'Farah Hanim', status: 'acknowledged',
    });
    toast.success('Case created', `${picked.length} clips attached`);
    navigate(`/portal/incidents/${id}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-3.5 p-4 sm:p-5">
        <form onSubmit={run} role="search" className="flex items-center gap-2 rounded-2xl border-2 border-brand bg-white p-1.5 pl-3 sm:pl-4">
          <Sparkles className="h-5 w-5 shrink-0 text-brand" aria-hidden />
          <label htmlFor="q" className="sr-only">Describe what you are looking for</label>
          <input id="q" type="search" value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none sm:text-[17px]" placeholder="Describe a person, vehicle, place and time" />
          <button type="button" aria-label="Search by voice" onClick={voice} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line-strong text-muted-dark hover:bg-ice"><Mic className="h-[18px] w-[18px]" /></button>
          <Button type="submit" variant="primary" className="h-10 shrink-0">Search<span className="hidden sm:inline">&nbsp;48 cameras</span></Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-bold text-muted">Try</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => { setText(s); run(undefined, s); }} className="h-8 rounded-full border border-line-strong bg-white px-3 text-[12.5px] font-semibold text-muted-dark hover:border-brand hover:text-brand">{s}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
          <span className="text-xs font-bold text-muted">Understood as</span>
          {u.chips.length ? u.chips.map((c) => <Chip key={c} tone="blue">{c}</Chip>) : <Chip>Any person or vehicle</Chip>}
        </div>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="h2">{results.length} matches</h2>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-[12.5px] font-bold text-muted-dark">Sort <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 w-auto"><option value="best">Best match</option><option value="time">Newest</option></Select></label>
              <Button variant="primary" size="sm" disabled={!selected.size} icon={<Plus className="h-4 w-4" />} onClick={buildCase}>Build case ({selected.size})</Button>
            </div>
          </div>
          {results.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <div key={r.id} className={cn('card flex flex-col gap-2 p-2.5', (focusRes?.id === r.id) && 'ring-2 ring-brand')}>
                  <button type="button" onClick={() => setFocus(r.id)} className="text-left" aria-label="Show journey" aria-pressed={focusRes?.id === r.id}>
                    {r.kind === 'vehicle'
                      ? <CamFeed scene="gate" tone={r.score > 85 ? 'red' : 'blue'} plate={r.read.plate} tag={`${r.score}% match`} boxLabel={`${r.read.plate} · ${r.read.colour} ${r.read.vehicle}`} cam={`${r.read.camera} · ${r.read.lane}`} time={hhmm(r.read.at)} live={false} size="sm" />
                      : <div className="relative"><FaceCrop variant={r.variant} className="rounded-lg" /><Chip tone="red" className="absolute left-2 top-2">{r.score}% match</Chip></div>}
                  </button>
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    {r.kind === 'vehicle' ? <Plate>{r.read.plate}</Plate> : <span className="text-[13px] font-bold">{r.where}</span>}
                    <Checkbox checked={selected.has(r.id)} onChange={(v) => { const n = new Set(selected); if (v) n.add(r.id); else n.delete(r.id); setSelected(n); }} label="Add to case" />
                  </div>
                  <span className="px-0.5 pb-0.5 text-xs text-muted">{r.kind === 'vehicle' ? `${r.read.vehicle} · ${r.read.detail} · ${when(r.read.at)}` : `${r.note} · ${when(r.at)}`}</span>
                </div>
              ))}
            </div>
          ) : <Card><Empty icon={<SearchX className="h-6 w-6" />} title="No matches" body="Try a colour, a car model, a plate, a place or a time. For example: white van, loading bay, Sunday." /></Card>}
        </div>

        <Card className="flex flex-col gap-3 p-5">
          {focusRes?.kind === 'vehicle' ? (
            <>
              <CardHeader title={`Journey of ${focusRes.read.plate}`} sub="Every camera that saw this vehicle" />
              <svg viewBox="0 0 322 170" className="h-auto w-full" role="img" aria-label="Map path from main gate to carpark and back">
                <rect x="1" y="1" width="320" height="168" rx="12" fill="#F7F9FD" stroke="#E3E9F4" />
                <rect x="30" y="22" width="80" height="46" rx="8" fill="#E8EEFF" /><text x="70" y="50" fontSize="11" fontWeight="700" textAnchor="middle" fill="#1D3FB0">Tower A</text>
                <rect x="210" y="22" width="80" height="46" rx="8" fill="#E8EEFF" /><text x="250" y="50" fontSize="11" fontWeight="700" textAnchor="middle" fill="#1D3FB0">Tower B</text>
                <rect x="120" y="96" width="90" height="36" rx="8" fill="#EEF1F7" /><text x="165" y="118" fontSize="11" fontWeight="700" textAnchor="middle" fill="#3A4468">B1 ramp</text>
                <path d="M161 160V136M165 96V80Q165 74 171 74H236" fill="none" stroke="#E5484D" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
                {[[161, 158], [165, 114], [238, 74]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="7" fill="#E5484D" stroke="#fff" strokeWidth="2" />)}
                <text x="176" y="162" fontSize="10.5" fontWeight="700" fill="#0B1640">Main gate</text><text x="248" y="90" fontSize="10.5" fontWeight="700" fill="#0B1640">Visitor bay</text>
              </svg>
              {journey.map((j) => (
                <div key={j.id} className="flex items-center gap-2.5 border-t border-line-soft py-1.5 text-[12.5px]">
                  <span className="w-11 font-mono font-bold">{hhmm(j.at)}</span><span className="flex-1 font-semibold">{j.lane}</span><span className="text-muted">{j.camera}</span>
                </div>
              ))}
              <p className="rounded-xl bg-warn-soft px-3 py-2.5 text-[12.5px] font-semibold leading-relaxed text-[#7A3A06]">{focusRes.read.match} · {focusRes.read.detail}</p>
            </>
          ) : focusRes?.kind === 'person' ? (
            <>
              <CardHeader title="Person sightings" sub={focusRes.note} />
              <FaceCrop variant={focusRes.variant} className="w-32" />
              <SightingMap sightings={faces.find((f) => f.id === focusRes.faceId)?.sightings ?? []} />
              <Button onClick={() => navigate('/portal/unregistered')}>Open in Unregistered Gallery</Button>
            </>
          ) : <Empty title="Pick a result" body="Its journey across cameras shows here." />}
        </Card>
      </div>
    </div>
  );
}
