'use client';

import { useState } from 'react';

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function NewTripModal({ onClose, onCreated }) {
  const [f, setF] = useState({
    id: '',
    name: '',
    flag: '',
    year: '',
    countryId: '',
    locName: '',
    locCountry: '',
    coords: '',
    locDesc: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    setBusy(true);
    setErr('');
    const [latStr, lngStr] = (f.coords || '').split(',').map((s) => s.trim());
    try {
      const res = await fetch('/api/journal/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: (f.id || slugify(f.name)).trim(),
          name: f.name,
          flag: f.flag,
          year: f.year,
          countryId: f.countryId,
          location: f.locName
            ? {
                name: f.locName,
                country: f.locCountry || f.name,
                lat: latStr || '',
                lng: lngStr || '',
                description: f.locDesc,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create trip');
      onCreated(data.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full bg-paper border border-ink/15 rounded px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-accent';
  const idPreview = (f.id || slugify(f.name)).trim();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-ink/10 bg-paper p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-[0.25em] text-accent">New trip</p>
        <h2 className="mt-1 font-display text-2xl">Create a trip</h2>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">Name *</label>
            <input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Japanese Journeys" className={input} />
            {idPreview && <p className="mt-1 text-[10px] text-muted">id / url: /journal/{idPreview}</p>}
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">Flag</label>
            <input value={f.flag} onChange={(e) => set('flag', e.target.value)} placeholder="🇯🇵" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">Year</label>
            <input value={f.year} onChange={(e) => set('year', e.target.value)} placeholder="2025" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">Country code</label>
            <input value={f.countryId} onChange={(e) => set('countryId', e.target.value)} placeholder="JP" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">Custom id (optional)</label>
            <input value={f.id} onChange={(e) => set('id', e.target.value)} placeholder="auto from name" className={input} />
          </div>

          <div className="col-span-2 mt-2 border-t border-ink/10 pt-3 text-[10px] uppercase tracking-[0.2em] text-muted">
            First destination (optional)
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">Place</label>
            <input value={f.locName} onChange={(e) => set('locName', e.target.value)} placeholder="Tokyo" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">Country</label>
            <input value={f.locCountry} onChange={(e) => set('locCountry', e.target.value)} placeholder="Japan" className={input} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">
              Coordinates (lat, lng — paste from Google Maps)
            </label>
            <input value={f.coords} onChange={(e) => set('coords', e.target.value)} placeholder="35.6762, 139.6503" className={input} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">Description</label>
            <input value={f.locDesc} onChange={(e) => set('locDesc', e.target.value)} placeholder="Short description" className={input} />
          </div>
        </div>

        {err && <p className="mt-3 text-xs text-accent">{err}</p>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={onClose} className="text-[11px] uppercase tracking-[0.15em] text-ink/60 hover:text-ink">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !f.name.trim()}
            className="rounded-full bg-accent px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-ink transition-colors disabled:opacity-40"
          >
            {busy ? 'Creating…' : 'Create trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
