'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import BlockEditor from './BlockEditor';
import { parseBlocks, serializeBlocks, makeBlock } from './blocks';

const FRONTMATTER_FIELDS = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'flag', label: 'Flag', type: 'text', width: 'narrow' },
  { key: 'date', label: 'Date', type: 'text', placeholder: 'YYYY-MM-DD', width: 'narrow' },
  { key: 'cover', label: 'Cover (filename)', type: 'text' },
  { key: 'excerpt', label: 'Excerpt (feed)', type: 'textarea' },
];

const RAW_SNIPPETS = [
  { label: 'H2', text: '\n## Heading\n\n' },
  { label: 'Quote', text: '\n<PullQuote>A line worth pulling out.</PullQuote>\n\n' },
  { label: 'Figure', text: '\n<Figure src="" caption="" />\n\n' },
  { label: 'Gallery', text: '\n<Gallery srcs={["", "", ""]} caption="" />\n\n' },
  { label: 'Panorama', text: '\n<Panorama src="" caption="" />\n\n' },
];

export default function Studio() {
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fm, setFm] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [body, setBody] = useState(''); // raw-mode source
  const [mode, setMode] = useState('blocks');
  const [photos, setPhotos] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [rightTab, setRightTab] = useState('photos');
  const [previewKey, setPreviewKey] = useState(0);
  const bodyRef = useRef(null);

  const refreshList = useCallback(() => {
    fetch('/api/journal/posts').then((r) => r.json()).then(setPosts).catch(() => {});
  }, []);
  useEffect(refreshList, [refreshList]);

  const photoUrl = useCallback(
    (file) => {
      if (!file) return null;
      const hit =
        photos.find((p) => p.file === file) ||
        photos.find((p) => p.file.includes(file) || file.includes(p.file));
      return hit ? hit.url : null;
    },
    [photos]
  );

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
      setBlocks(parseBlocks(data.body || ''));
      setPhotos(data.photos || []);
      setMode('blocks');
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
  const changeBlocks = (next) => {
    setBlocks(next);
    setDirty(true);
  };
  const addBlock = (block) => changeBlocks([...blocks, block]);

  const toRaw = () => {
    setBody(serializeBlocks(blocks));
    setMode('raw');
  };
  const toBlocks = () => {
    setBlocks(parseBlocks(body));
    setMode('blocks');
  };

  const save = useCallback(async () => {
    if (!selected || !fm) return;
    const finalBody = mode === 'blocks' ? serializeBlocks(blocks) : body;
    setSaving(true);
    setStatus('Saving…');
    try {
      const res = await fetch(`/api/journal/post/${selected}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontmatter: fm, body: finalBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setBody(finalBody);
      setDirty(false);
      setStatus('Saved ✓');
      setPreviewKey((k) => k + 1);
      refreshList();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }, [selected, fm, blocks, body, mode, refreshList]);

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
    setBody(body.slice(0, start) + text + body.slice(end));
    setDirty(true);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    });
  };

  const onPhotoActivate = (file) => {
    if (mode === 'blocks') addBlock(makeBlock('figure', { src: file, caption: '', wide: false }));
    else insertAtCursor(`\n<Figure src="${file}" caption="" />\n\n`);
  };

  const input =
    'w-full bg-paper border border-ink/15 rounded px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-accent';

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-[520px] bg-paper text-ink">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 overflow-y-auto border-r border-ink/10">
        <div className="sticky top-0 border-b border-ink/10 bg-paper px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Studio</p>
          <p className="mt-0.5 text-[11px] text-muted">{posts.length} posts</p>
        </div>
        <ul className="py-2">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                onClick={() => loadPost(post.id)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                  selected === post.id ? 'bg-accent/10 text-ink' : 'text-ink/70 hover:bg-ink/5'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
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
      <main className="flex min-w-0 flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="mb-2 font-display text-2xl text-ink/70">Journal Studio</p>
              <p className="text-sm text-muted">Choose a post on the left to start writing.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="truncate text-sm font-medium">{selected}.mdx</span>
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-ink/70">
                  <input
                    type="checkbox"
                    checked={fm?.published !== false}
                    onChange={(e) => setField('published', e.target.checked)}
                    className="accent-[#B4441C]"
                  />
                  Published
                </label>
                <div className="flex items-center rounded-full border border-ink/15 p-0.5 text-[10px] uppercase tracking-[0.12em]">
                  {[
                    ['blocks', 'Blocks', () => mode !== 'blocks' && toBlocks()],
                    ['raw', 'Raw', () => mode !== 'raw' && toRaw()],
                  ].map(([m, label, fn]) => (
                    <button
                      key={m}
                      onClick={fn}
                      className={`rounded-full px-2.5 py-0.5 transition-colors ${
                        mode === m ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
                  className="rounded-full bg-accent px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-paper transition-colors hover:bg-ink disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1">
              {/* Fields + body */}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <div className="grid max-h-[36%] grid-cols-2 gap-x-4 gap-y-2.5 overflow-y-auto border-b border-ink/10 px-4 py-3">
                  <div className="col-span-2 text-[10px] uppercase tracking-[0.2em] text-muted">Frontmatter</div>
                  {FRONTMATTER_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className={field.type === 'textarea' || field.width !== 'narrow' ? 'col-span-2' : ''}
                    >
                      <label className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-ink/50">
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

                {/* Add / insert toolbar */}
                <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-1.5">
                  <span className="mr-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                    {mode === 'blocks' ? 'Add' : 'Insert'}
                  </span>
                  {mode === 'blocks' ? (
                    <>
                      {[
                        ['Text', () => addBlock(makeBlock('text', { text: '' }))],
                        ['Heading', () => addBlock(makeBlock('text', { text: '## ' }))],
                        ['Quote', () => addBlock(makeBlock('pullquote', { text: '' }))],
                        ['Gallery', () => addBlock(makeBlock('gallery', { srcs: [], caption: '' }))],
                        ['Panorama', () => addBlock(makeBlock('panorama', { src: '', caption: '', controls: false }))],
                      ].map(([label, fn]) => (
                        <button
                          key={label}
                          onClick={fn}
                          className="rounded border border-ink/15 px-2 py-1 text-[11px] text-ink/70 transition-colors hover:border-accent hover:text-ink"
                        >
                          + {label}
                        </button>
                      ))}
                      <span className="ml-1 text-[10px] text-muted">or drag photos in →</span>
                    </>
                  ) : (
                    RAW_SNIPPETS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => insertAtCursor(s.text)}
                        className="rounded border border-ink/15 px-2 py-1 text-[11px] text-ink/70 transition-colors hover:border-accent hover:text-ink"
                      >
                        {s.label}
                      </button>
                    ))
                  )}
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {mode === 'blocks' ? (
                    <BlockEditor blocks={blocks} onChange={changeBlocks} photoUrl={photoUrl} />
                  ) : (
                    <textarea
                      ref={bodyRef}
                      value={body}
                      onChange={(e) => {
                        setBody(e.target.value);
                        setDirty(true);
                      }}
                      spellCheck
                      className="h-full w-full resize-none bg-paper px-4 py-4 font-mono text-[13px] leading-relaxed text-ink focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Right: preview / photos */}
              <div className="flex w-[40%] flex-shrink-0 flex-col border-l border-ink/10">
                <div className="flex items-center gap-1 border-b border-ink/10 px-3 py-1.5">
                  {['photos', 'preview'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRightTab(tab)}
                      className={`rounded px-2.5 py-1 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                        rightTab === tab ? 'bg-ink/5 text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {tab === 'photos' ? `Photos (${photos.length})` : 'Preview'}
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
                    className="w-full flex-1 border-0 bg-white"
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto p-3">
                    <p className="mb-2 text-[11px] text-muted">
                      Drag a photo into the editor to place it, or click to add at the end.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photo) => (
                        <button
                          key={photo.file}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-photo', photo.file);
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => onPhotoActivate(photo.file)}
                          className="group text-left"
                          title={photo.file}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.caption || photo.file}
                            loading="lazy"
                            className="aspect-[3/2] w-full rounded bg-ink/5 object-cover"
                          />
                          <span className="mt-1 block truncate text-[10px] text-muted group-hover:text-accent">
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
