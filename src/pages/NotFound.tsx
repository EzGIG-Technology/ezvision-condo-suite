import { Link } from 'react-router-dom';
import { Logo } from '@/components/vision';
import { useDocumentTitle } from '@/lib/hooks';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ice px-6 text-center">
      <Logo sub="Condo Suite" />
      <div className="flex flex-col gap-2">
        <p className="font-mono text-sm font-bold text-brand">404</p>
        <h1 className="text-3xl font-extrabold tracking-tight">This page doesn't exist</h1>
        <p className="max-w-sm text-[14.5px] text-muted">The link may be old, or the pass may have been cancelled.</p>
      </div>
      <Link to="/" className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark">Go to all apps</Link>
    </div>
  );
}
