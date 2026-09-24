import { Component, Suspense, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const RELOAD_KEY = 'ezv:chunk-reload';

function isChunkLoadError(error: unknown) {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported|ChunkLoadError|Unable to preload CSS/i.test(msg);
}

/**
 * After a new deploy, an open tab still asks for the old build's page files, which no longer exist.
 * Reload once to pick up the new build. The timestamp guard stops a reload loop if the file is truly missing.
 */
export function reloadForNewBuild() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked: still reload once; the next failure falls through to the error screen.
  }
  window.location.reload();
  return true;
}

export function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" />
    </div>
  );
}

type BoundaryState = { error: unknown; reloading: boolean };

export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null, reloading: false };

  static getDerivedStateFromError(error: unknown): Partial<BoundaryState> {
    return { error };
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error) && reloadForNewBuild()) this.setState({ reloading: true });
    else console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.state.reloading) return <Loading />;
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center" role="alert">
        <h2 className="text-lg font-bold text-navy">This page didn't load</h2>
        <p className="max-w-sm text-[14.5px] text-muted">
          {isChunkLoadError(this.state.error)
            ? 'A newer version of the app may be available, or the connection dropped.'
            : 'Something went wrong while showing this page.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 rounded-xl bg-brand px-4 py-2 text-[14px] font-bold text-white hover:opacity-90"
        >
          Reload
        </button>
      </div>
    );
  }
}

/** Renders the current child route inside its layout, so the sidebar and header stay visible while a page loads. */
export function PageOutlet() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}
