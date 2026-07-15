import Studio from './Studio';

export const metadata = {
  title: 'Journal Studio | Copy This Trip',
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  // The editor writes .mdx files on disk, which only works locally — the
  // deployed filesystem is read-only. Show a note instead of a broken editor.
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted mb-3">Journal Studio</p>
        <h1 className="font-display text-3xl mb-4">Available in local development</h1>
        <p className="text-ink/70 text-sm leading-relaxed">
          The editor writes post files on disk, so it runs only on your machine. Run{' '}
          <code className="bg-ink/5 px-1.5 py-0.5 rounded">npm run dev</code> and open{' '}
          <code className="bg-ink/5 px-1.5 py-0.5 rounded">/studio</code> to write, then commit and
          push the changes.
        </p>
      </div>
    );
  }
  return <Studio />;
}
