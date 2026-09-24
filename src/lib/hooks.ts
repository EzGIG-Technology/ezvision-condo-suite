import { useEffect, useState } from 'react';

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · EzVision Condo Suite`;
  }, [title]);
}

/** True when the viewport is at least `min` px wide (Tailwind xl = 1280). Updates on resize. */
export function useMinWidth(min = 1280) {
  const q = `(min-width: ${min}px)`;
  const [ok, setOk] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setOk(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return ok;
}

/** Browser connection state, updated on the online and offline events. */
export function useOnline() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
}
