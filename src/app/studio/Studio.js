'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const FRONTMATTER_FIELDS = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'flag', label: 'Flag', type: 'text', width: 'narrow' },
  { key: 'date', label: 'Date', type: 'text', placeholder: 'YYYY-MM-DD', width: 'narrow' },
  { key: 'cover', label: 'Cover (filename)', type: 'text' },
  { key: 'excerpt', label: 'Excerpt (feed)', type: 'textarea' },
];

const SNIPPETS = [
  { label: 'H2', text: '\n## Heading\n\n' },
  { label: 'Quote', text: '\n<PullQuote>A line worth pulling out.</PullQuote>\n\n' },
  { label: 'Figure', text: '\n<Figure src="" caption="" />\n\n' },
  { label: 'Gallery', text: '\n<Gallery srcs={["", "", ""]} caption="" />\n\n' },
];

export default function Studio() {
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fm, setFm] = useState(null);
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [rightTab, setRightTab] = useState('preview');
  const [previewKey, setPreviewKey] = useState(0);
  const bodyRef = useRef(null);

  const refreshList = useCallback(() => {
    fetch('/api/journal/posts')
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => {});
  }, []);

  useEffect(refreshList, [refreshList]);

  const loadPost = useCallback(
    async (id) => {
      if (dirty && !window.confirm('Discard unsaved changes?')) return;
      const res = await fetch(`/api/journal/post/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Failed to load');
        return;
      }
      setSelected(id);
      setFm(data.frontmatter || {});
      setBody(data.body || '');
      setPhotos(data.photos || []);
      setDirty(false);
      setStatus('');
      setPreviewKey((k) => k + 1);
    },
    [dirty]
  );

  const setField = (key, value) => {
    setFm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const save = useCallback(async () => {
    if (!selected || !fm) return;
    setSaving(true);
    setStatus('Saving…');
    try {
      const res = await fetch(`/api/journal/post/${selected}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontmatter: fm, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setDirty(false);
      setStatus('Saved ✓');
      setPreviewKey((k) => k + 1);
      refreshList();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }, [selected, fm, body, refreshList]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  const insertAtCursor = (text) => {
    const ta = bodyRef.current;
    if (!ta) {
      setBody((b) => b + text);
      setDirty(true);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    setDirty(true);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.selectionStart = ta.selectionEnd = pos;
    });
  };

  const input =
    'w-full bg-paper border border-ink/15 rounded px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-accent';

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-[520px] bg-paper text-ink">
      {/* Sidebar — post list */}
      <aside className="w-60 flex-shrink-0 border-r border-ink/10 overflow-y-auto">
        <div className="px-4 py-3 border-b border-ink/10 sticky top-0 bg-paper">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Studio</p>
          <p className="text-[11px] text-muted mt-0.5">{posts.length} posts</p>
        </div>
        <ul className="py-2">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                onClick={() => loadPost(post.id)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                  selected === post.id ? 'bg-accent/10 text-ink' : 'text-ink/70 hover:bg-ink/5'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                    post.published ? 'bg-accent' : 'bg-ink/20'
                  }`}
                  title={post.published ? 'Published' : 'Draft'}
                />
                <span className="truncate">
                  {post.flag ? `${post.flag} ` : ''}
                  {post.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Editor */}
      <main className="flex-1 min-w-0 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <p className="font-display text-2xl text-ink/70 mb-2">Journal Studio</p>
              <p className="text-sm text-muted">Choose a post on the left to start writing.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-ink/10">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium truncate">{selected}.mdx</span>
                <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-ink/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fm?.published !== false}
                    onChange={(e) => setField('published', e.target.checked)}
                    className="accent-[#B4441C]"
                  />
                  Published
                </label>
              </div>
              <div className="flex items-center gap-3">
                {status && <span className="text-[11px] text-muted">{status}</span>}
                {dirty && !status && <span className="text-[11px] text-accent">Unsaved</span>}
                <a
                  href={`/journal/${selected}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] uppercase tracking-[0.15em] text-ink/60 hover:text-accent"
                >
                  Open ↗
                </a>
                <button
                  onClick={save}
                  disabled={saving || !dirty}
                  className="bg-accent text-paper text-[11px] uppercase tracking-[0.2em] rounded-full px-4 py-1.5
                             hover:bg-ink transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex">
              {/* Left of editor: fields + body */}
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {/* Frontmatter */}
                <div className="px-4 py-3 border-b border-ink/10 grid grid-cols-2 gap-x-4 gap-y-2.5 overflow-y-auto max-h-[38%]">
                  <div className="col-span-2 text-[10px] uppercase tracking-[0.2em] text-muted">
                    Frontmatter
                  </div>
                  {FRONTMATTER_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className={field.type === 'textarea' || field.width !== 'narrow' ? 'col-span-2' : ''}
                    >
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-ink/50 mb-1">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          value={fm?.[field.key] ?? ''}
                          onChange={(e) => setField(field.key, e.target.value)}
                          className={`${input} resize-none`}
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={fm?.[field.key] ?? ''}
                          onChange={(e) => setField(field.key, e.target.value)}
                          className={input}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Snippet toolbar */}
                <div className="px-4 py-1.5 border-b border-ink/10 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted mr-1">Insert</span>
                  {SNIPPETS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => insertAtCursor(s.text)}
                      className="text-[11px] px-2 py-1 rounded border border-ink/15 text-ink/70 hover:border-accent hover:text-ink transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Body */}
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setDirty(true);
                  }}
                  spellCheck
                  className="flex-1 min-h-0 w-full resize-none px-4 py-4 font-mono text-[13px] leading-relaxed
                             text-ink bg-paper focus:outline-none"
                  placeholder="Write your post in Markdown / MDX…"
                />
              </div>

              {/* Right: preview / photos */}
              <div className="w-[42%] flex-shrink-0 border-l border-ink/10 flex flex-col">
                <div className="flex items-center gap-1 px-3 py-1.5 border-b border-ink/10">
                  {['preview', 'photos'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRightTab(tab)}
                      className={`text-[11px] uppercase tracking-[0.15em] px-2.5 py-1 rounded transition-colors ${
                        rightTab === tab ? 'text-ink bg-ink/5' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {tab === 'preview' ? 'Preview' : `Photos (${photos.length})`}
                    </button>
                  ))}
                  {rightTab === 'preview' && (
                    <button
                      onClick={() => setPreviewKey((k) => k + 1)}
                      className="ml-auto text-[11px] text-ink/50 hover:text-accent"
                      title="Reload preview"
                    >
                      ↻
                    </button>
                  )}
                </div>

                {rightTab === 'preview' ? (
                  <iframe
                    key={previewKey}
                    src={`/journal/${selected}`}
                    title="Preview"
                    className="flex-1 w-full border-0 bg-white"
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto p-3">
                    <p className="text-[11px] text-muted mb-2">
                      Click a photo to insert a Figure at the cursor.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photo) => (
                        <button
                          key={photo.file}
                          onClick={() =>
                            insertAtCursor(`\n<Figure src="${photo.file}" caption="" />\n\n`)
                          }
                          className="group text-left"
                          title={photo.file}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.caption || photo.file}
                            loading="lazy"
                            className="w-full aspect-[3/2] object-cover rounded bg-ink/5"
                          />
                          <span className="block mt-1 text-[10px] text-muted truncate group-hover:text-accent">
                            {photo.file}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
