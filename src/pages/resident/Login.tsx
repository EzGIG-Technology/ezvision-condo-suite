import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Logo, CamFeed } from '@/components/vision';
import { Field, Input } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

export default function ResidentLogin() {
  useDocumentTitle('Resident sign-in');
  const signedIn = useStore((s) => s.session.resident);
  const login = useStore((s) => s.loginResident);
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('012-345 6789');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resend, setResend] = useState(0);

  useEffect(() => { if (signedIn) navigate('/app', { replace: true }); }, [signedIn, navigate]);
  useEffect(() => {
    if (resend <= 0) return;
    const t = window.setTimeout(() => setResend((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resend]);

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 9) return toast.error('Enter a valid Malaysian mobile number');
    setLoading(true);
    window.setTimeout(() => { setLoading(false); setStep('otp'); setResend(30); toast.info('Code sent by SMS', 'Demo: any 6 digits work.'); }, 600);
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    window.setTimeout(() => { login(); toast.success('Welcome back, Mei Ling'); navigate('/app', { replace: true }); }, 500);
  };

  return (
    <div className="min-h-screen bg-[#E9EEF7] sm:py-6">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white sm:min-h-[calc(100vh-48px)] sm:rounded-[32px] sm:shadow-pop">
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-dark"><ArrowLeft className="h-4 w-4" />All apps</Link>
        </div>
        <div className="flex flex-1 flex-col gap-6 px-6 pb-8">
          <Logo sub="Vista Harmoni Residences" size={36} />
          <CamFeed scene="lobby" tone="teal" tag="Resident · face access" cam="Tower A lobby" size="sm" className="rounded-2xl" boxLabel="Tan Mei Ling · 99%" />
          {step === 'phone' ? (
            <form onSubmit={sendCode} className="flex flex-col gap-4">
              <div><h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1><p className="mt-1 text-sm text-muted">Use the mobile number registered with the management office.</p></div>
              <Field label="Mobile number">{(id) => <Input id={id} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 text-base" />}</Field>
              <Button type="submit" variant="primary" size="lg" loading={loading} block>Send code</Button>
              <p className="text-center text-xs text-muted">New resident? The management office sends you an invite after your tenancy or SPA is registered.</p>
            </form>
          ) : (
            <form onSubmit={verify} className="flex flex-col gap-4">
              <div><h1 className="text-2xl font-extrabold tracking-tight">Enter the code</h1><p className="mt-1 text-sm text-muted">Sent to {phone}. <button type="button" className="font-bold text-brand" onClick={() => { setStep('phone'); setOtp(''); }}>Change</button></p></div>
              <Field label="6-digit code">{(id) => <Input id={id} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" className="h-14 text-center font-mono text-2xl tracking-[0.5em]" />}</Field>
              <Button type="submit" variant="primary" size="lg" loading={loading} block disabled={otp.length !== 6}>Verify and sign in</Button>
              <Button variant="ghost" disabled={resend > 0} onClick={() => { setResend(30); toast.info('New code sent'); }}>{resend > 0 ? `Resend code in ${resend}s` : 'Resend code'}</Button>
            </form>
          )}
          <p className="mt-auto flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-teal" />Your data stays with Vista Harmoni's management, under PDPA 2010.</p>
        </div>
      </div>
    </div>
  );
}
