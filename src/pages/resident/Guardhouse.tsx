import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Send, ShieldAlert } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Empty, Input } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { SITE } from '@/data/seed';
import { cn, dayLabel, hhmm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

const QUICK = ['My visitor is at the gate, please let them in', 'Please call me when my delivery arrives', 'Someone is parked in my bay', 'Noise complaint'];

export default function ResidentGuardhouse() {
  useDocumentTitle('Guardhouse');
  const unit = useStore((s) => s.resident.unit);
  const messages = useStore((s) => s.messages);
  const { sendMessage, markMessagesRead } = useStore.getState();
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const thread = messages.filter((m) => m.unit === unit);
  const unreadFromGuard = thread.some((m) => m.from === 'guard' && !m.read);

  useEffect(() => {
    if (unreadFromGuard) markMessagesRead(unit, 'resident');
  }, [unreadFromGuard, unit, markMessagesRead]);
  useEffect(() => end.current?.scrollIntoView?.({ block: 'end' }), [thread.length]);

  const send = (body: string) => {
    const t = body.trim();
    if (!t) return toast.error('Type a message first');
    sendMessage(unit, 'resident', t);
    setText('');
    toast.success('Sent to the guardhouse', 'The guard on duty will reply here.');
  };
  const submit = (e: FormEvent) => { e.preventDefault(); send(text); };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        <a href={`tel:${SITE.guardhousePhone.replace(/[^+\d]/g, '')}`} className="card flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-soft text-teal-dark"><Phone className="h-5 w-5" /></span>
          <span><span className="block text-[13px] font-bold">Call guardhouse</span><span className="text-[11px] text-muted">{SITE.guardhousePhone}</span></span>
        </a>
        <Link to="/app/sos" className="card flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-danger-soft text-danger-ink"><ShieldAlert className="h-5 w-5" /></span>
          <span><span className="block text-[13px] font-bold">Emergency</span><span className="text-[11px] text-muted">Use SOS instead</span></span>
        </Link>
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="h2 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-muted" />Messages</h2>
        {thread.length ? (
          <ol className="flex flex-col gap-2" aria-label="Messages with the guardhouse">
            {thread.map((m, i) => {
              const newDay = i === 0 || dayLabel(thread[i - 1].at) !== dayLabel(m.at);
              return (
                <li key={m.id} className="flex flex-col">
                  {newDay && <span className="my-1 self-center text-[11px] font-semibold text-muted">{dayLabel(m.at)}</span>}
                  <span className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-[13.5px]', m.from === 'resident' ? 'self-end rounded-br-md bg-brand text-white' : 'self-start rounded-bl-md bg-white text-navy shadow-card')}>
                    {m.from === 'guard' && <span className="block text-[11px] font-bold text-muted">Guardhouse</span>}
                    {m.text}
                    <span className={cn('mt-0.5 block text-right text-[10.5px]', m.from === 'resident' ? 'text-white/70' : 'text-muted')}>{hhmm(m.at)}{m.from === 'resident' && (m.read ? ' · Read' : ' · Sent')}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : <Empty icon={<MessageCircle className="h-5 w-5" />} title="No messages yet" body="Message the guard on duty about visitors, deliveries or anything in the building." />}
        <div ref={end} />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-thin">
          {QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold hover:border-brand">{q}</button>)}
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <Input aria-label="Message to the guardhouse" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" className="h-11" />
          <Button type="submit" variant="primary" icon={<Send className="h-4 w-4" />} aria-label="Send message" className="h-11 shrink-0" />
        </form>
      </Card>
    </div>
  );
}
