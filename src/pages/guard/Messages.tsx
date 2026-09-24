import { useEffect, useState, type FormEvent } from 'react';
import { MessageCircle, Phone, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Empty, Input } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, dayLabel, hhmm, relative } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

const QUICK = ['Noted, we will handle it.', 'Your visitor is on the way up.', 'A guard is on the way.', 'Please come to the guardhouse.'];

export default function GuardMessages() {
  useDocumentTitle('Messages');
  const messages = useStore((s) => s.messages);
  const units = useStore((s) => s.units);
  const { sendMessage, markMessagesRead } = useStore.getState();
  const threads = Object.values(
    messages.reduce<Record<string, { unit: string; last: (typeof messages)[number]; unread: number }>>((acc, m) => {
      const t = acc[m.unit] ?? { unit: m.unit, last: m, unread: 0 };
      if (+new Date(m.at) >= +new Date(t.last.at)) t.last = m;
      if (m.from === 'resident' && !m.read) t.unread += 1;
      acc[m.unit] = t;
      return acc;
    }, {}),
  ).sort((a, b) => +new Date(b.last.at) - +new Date(a.last.at));
  const [unit, setUnit] = useState<string | null>(null);
  const active = unit ?? threads.find((t) => t.unread)?.unit ?? threads[0]?.unit ?? null;
  const thread = messages.filter((m) => m.unit === active);
  const unreadHere = thread.some((m) => m.from === 'resident' && !m.read);
  const [text, setText] = useState('');
  const resident = units.find((u) => u.unit === active);

  useEffect(() => {
    if (active && unreadHere) markMessagesRead(active, 'guard');
  }, [active, unreadHere, markMessagesRead]);

  const send = (body: string) => {
    if (!active) return;
    if (!body.trim()) return toast.error('Type a reply first');
    sendMessage(active, 'guard', body.trim());
    setText('');
    toast.success(`Reply sent to ${active}`);
  };
  const submit = (e: FormEvent) => { e.preventDefault(); send(text); };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Messages from residents</h1>
      {!threads.length ? (
        <div className="rounded-2xl border border-night-line bg-night-panel"><Empty dark icon={<MessageCircle className="h-5 w-5" />} title="No messages" body="Residents can message the guardhouse from the app." /></div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <ul className="flex flex-col gap-1.5 rounded-2xl border border-night-line bg-night-panel p-2" aria-label="Conversations">
            {threads.map((t) => (
              <li key={t.unit}>
                <button type="button" aria-pressed={t.unit === active} onClick={() => setUnit(t.unit)} className={cn('flex w-full items-center gap-3 rounded-xl p-3 text-left', t.unit === active ? 'bg-brand/25' : 'hover:bg-night-field')}>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2"><span className="font-mono text-[14px] font-bold">{t.unit}</span><span className="text-[11px] text-muted-light">{relative(t.last.at)}</span></span>
                    <span className="block truncate text-[12.5px] text-muted-light">{t.last.from === 'guard' ? 'You: ' : ''}{t.last.text}</span>
                  </span>
                  {t.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-dot px-1 text-[10.5px] font-bold">{t.unread}</span>}
                </button>
              </li>
            ))}
          </ul>
          <section className="flex flex-col gap-3 rounded-2xl border border-night-line bg-night-panel p-4" aria-label={`Conversation with ${active}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-mono text-lg font-bold">{active}</p><p className="text-xs text-muted-light">{resident?.name ?? 'Resident'}</p></div>
              <Button variant="night" icon={<Phone className="h-4 w-4" />} onClick={() => { if (active) { useStore.getState().startCall(active, 'Guardhouse'); toast.info(`Calling ${active}`, 'The resident app rings. No intercom hardware needed.'); } }}>Call unit</Button>
            </div>
            <ol className="flex flex-col gap-2">
              {thread.map((m, i) => (
                <li key={m.id} className="flex flex-col">
                  {(i === 0 || dayLabel(thread[i - 1].at) !== dayLabel(m.at)) && <span className="my-1 self-center text-[11px] font-semibold text-muted-light">{dayLabel(m.at)}</span>}
                  <span className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-[14px]', m.from === 'guard' ? 'self-end rounded-br-md bg-brand' : 'self-start rounded-bl-md bg-night-field')}>
                    {m.text}<span className="mt-0.5 block text-right text-[10.5px] text-white/60">{hhmm(m.at)}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">{QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-navy-500 px-3 py-1.5 text-[12.5px] font-semibold text-muted-light hover:border-brand-light hover:text-white">{q}</button>)}</div>
            <form onSubmit={submit} className="flex gap-2">
              <Input dark aria-label={`Reply to ${active}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" />
              <Button type="submit" size="lg" variant="nightPrimary" icon={<Send className="h-4 w-4" />} aria-label="Send reply" className="shrink-0" />
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
