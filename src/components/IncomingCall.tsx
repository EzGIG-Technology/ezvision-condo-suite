import { DoorOpen, Phone, PhoneOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CamFeed } from '@/components/vision';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/toast';

/** Full-screen video intercom call in the resident app, from a lobby panel or the guardhouse tablet. */
export function IncomingCall({ unit }: { unit: string }) {
  const call = useStore((s) => s.call);
  const { answerCall, endCall } = useStore.getState();
  if (!call || call.unit !== unit || call.state === 'ended') return null;
  const lobby = /panel/i.test(call.from);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Video call from ${call.from}`} className="fixed inset-0 z-50 flex items-stretch justify-center bg-navy/95 sm:py-6">
      <div className="flex w-full max-w-md flex-col gap-5 p-5 text-white">
        <div className="flex flex-col items-center gap-1 pt-6 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-light">{call.state === 'ringing' ? 'Incoming video call' : 'On call'}</span>
          <h2 className="text-2xl font-extrabold">{call.from}</h2>
          <p className="text-sm text-[#C9D3EE]">{lobby ? 'Someone at the lobby is calling your unit' : 'The guard on duty is calling'}</p>
        </div>
        <CamFeed scene={lobby ? 'lobby' : 'guardpost'} tone="blue" tag={call.state === 'ringing' ? 'Live preview' : 'Live · two-way audio'} cam={lobby ? `CAM · ${call.from}` : 'Guardhouse tablet'} size="lg" className="rounded-3xl" />
        {call.state === 'ringing' ? (
          <div className="mt-auto grid grid-cols-2 gap-3">
            <Button size="xl" variant="danger" icon={<PhoneOff className="h-5 w-5" />} onClick={() => { endCall('declined'); toast.info('Call declined'); }}>Decline</Button>
            <Button size="xl" variant="teal" icon={<Phone className="h-5 w-5" />} onClick={answerCall}>Answer</Button>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-3">
            {lobby && <Button size="xl" variant="teal" icon={<DoorOpen className="h-5 w-5" />} onClick={() => { endCall('door_opened'); toast.success('Lobby door opened', 'It locks again after 5 seconds.'); }}>Open lobby door</Button>}
            <Button size="xl" variant="danger" icon={<PhoneOff className="h-5 w-5" />} onClick={() => { endCall('talked'); toast.info('Call ended'); }}>End call</Button>
          </div>
        )}
      </div>
    </div>
  );
}
