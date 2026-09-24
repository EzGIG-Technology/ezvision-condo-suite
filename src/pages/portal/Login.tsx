import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, UserX } from 'lucide-react';
import { CamFeed, Logo } from '@/components/vision';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Modal } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { toast } from '@/store/toast';
import { useDocumentTitle } from '@/lib/hooks';

export default function Login() {
  useDocumentTitle('Sign in');
  const [email, setEmail] = useState('farah.hanim@vistaharmoni.my');
  const [pw, setPw] = useState('');
  const [keep, setKeep] = useState(true);
  const [step, setStep] = useState<'creds' | 'otp'>('creds');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const login = useStore((s) => s.loginPortal);
  const navigate = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };

  const submitCreds = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid work email.');
    if (pw.length < 4) return setErr('Enter your password (at least 4 characters).');
    setErr('');
    setLoading(true);
    window.setTimeout(() => { setLoading(false); setStep('otp'); }, 500);
  };
  const submitOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setErr('Enter the 6-digit code from your authenticator app.');
    setErr('');
    login(email);
    toast.success('Welcome back, Farah', 'Signed in to Vista Harmoni Residences');
    navigate(loc.state?.from ?? '/portal/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-white">
      <section className="relative hidden w-[52%] flex-col justify-between bg-navy p-12 text-white lg:flex xl:p-14">
        <Logo dark sub="Condo Suite" size={36} />
        <div className="flex flex-col gap-7">
          <h1 className="text-[44px] font-extrabold leading-[1.07] tracking-[-0.035em] xl:text-[48px]">Know everyone who walks in.<br /><span className="text-brand-light">Every visitor, every vehicle.</span></h1>
          <div className="relative mr-8">
            <CamFeed scene="lobby" tone="red" tag="Unregistered person · Tower A lobby" cam="CAM 08 · Tower A turnstiles" time="22:07:31" size="lg" className="rounded-2xl" />
            <div className="absolute -bottom-7 -right-6 flex w-72 items-start gap-3 rounded-2xl bg-white p-4 text-navy shadow-pop">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger-ink"><UserX className="h-5 w-5" /></span>
              <span className="flex flex-col gap-1"><span className="text-[13.5px] font-extrabold">Not on today's visitor list</span><span className="text-xs leading-snug text-muted">Followed resident A-08-2 through the turnstile. Guardhouse alerted in 2 seconds.</span></span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13px] font-semibold text-[#9FB0DB]">
          <span>Processed on-site · PDPA-ready</span><span>Works with your existing CCTV</span><span>A product of EzTEC · EzGIG Group</span>
        </div>
      </section>
      <section className="flex flex-1 flex-col items-center justify-center bg-ice px-5 py-10">
        <div className="mb-8 lg:hidden"><Logo sub="Condo Suite" /></div>
        {step === 'creds' ? (
          <form onSubmit={submitCreds} className="flex w-full max-w-[420px] flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <h2 className="text-[28px] font-extrabold tracking-tight">Sign in to your site</h2>
              <p className="text-[14.5px] leading-relaxed text-muted">For building managers, JMB/MC committee members and security supervisors.</p>
            </div>
            <Field label="Work email">{(id) => <Input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />}</Field>
            <Field label="Password">{(id) => <Input id={id} type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Any password works in this demo" className="h-12" />}</Field>
            <div className="flex items-center justify-between gap-3">
              <Checkbox checked={keep} onChange={setKeep} label="Keep me signed in for 12 hours" />
              <button type="button" onClick={() => setForgot(true)} className="text-[13px] font-bold text-brand hover:underline">Forgot password?</button>
            </div>
            {err && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] font-semibold text-danger-ink">{err}</p>}
            <Button type="submit" variant="primary" size="lg" loading={loading} block>Continue</Button>
            <div className="flex items-center gap-3 text-[12.5px] font-semibold text-muted"><span className="h-px flex-1 bg-line-strong" />or<span className="h-px flex-1 bg-line-strong" /></div>
            <Button size="lg" block icon={<Lock className="h-4 w-4" />} onClick={() => { setErr(''); setStep('otp'); toast.info('Company SSO', 'Redirected back from your identity provider.'); }}>Sign in with company SSO</Button>
            <p className="text-[12.5px] leading-relaxed text-muted">Two-step verification is required for every account. Access is logged in the site's PDPA audit trail.</p>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="flex w-full max-w-[420px] flex-col gap-5" noValidate>
            <button type="button" onClick={() => { setStep('creds'); setErr(''); }} className="flex items-center gap-1.5 self-start text-[13px] font-bold text-muted-dark hover:text-navy"><ArrowLeft className="h-4 w-4" /> Back</button>
            <div className="flex flex-col gap-2">
              <h2 className="text-[28px] font-extrabold tracking-tight">Two-step verification</h2>
              <p className="text-[14.5px] leading-relaxed text-muted">Enter the 6-digit code from your authenticator app for {email}.</p>
            </div>
            <Field label="Verification code">{(id) => <Input id={id} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="h-14 text-center font-mono text-2xl tracking-[0.4em]" />}</Field>
            {err && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] font-semibold text-danger-ink">{err}</p>}
            <Button type="submit" variant="primary" size="lg" block>Verify and sign in</Button>
            <button type="button" onClick={() => toast.info('New code sent', 'Check your authenticator or SMS.')} className="text-[13px] font-bold text-brand hover:underline">Send a code by SMS instead</button>
          </form>
        )}
        <Link to="/" className="mt-10 text-[12.5px] font-semibold text-muted hover:text-navy">← All apps</Link>
      </section>
      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset your password" description="We'll email a reset link to your work address." size="sm"
        footer={<><Button onClick={() => setForgot(false)}>Cancel</Button><Button variant="primary" onClick={() => { setForgot(false); toast.success('Reset link sent', `Check ${email}`); }}>Send link</Button></>}>
        <Field label="Work email">{(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
      </Modal>
    </div>
  );
}
