'use client';

import { useRef, useEffect, useState } from 'react';
import { makeBlock } from './blocks';

// A textarea that grows to fit its content.
function AutoTextarea({ value, onChange, className, placeholder }) {
  const ref = useRef(null);
  const resize = () => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };
  useEffect(resize, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      rows={1}
      placeholder={placeholder}
      spellCheck
      className={`resize-none overflow-hidden ${className}`}
    />
  );
}

function BlockCard({ block, photoUrl, onUpdate, onRemove }) {
  const patch = (p) => onUpdate(block.id, p);

  const handle = (
    <span
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-block', block.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      title="Drag to reorder"
      className="cursor-grab active:cursor-grabbing select-none text-ink/25 hover:text-ink/60 px-0.5 leading-none"
    >
      ⠿
    </span>
  );

  let inner = null;

  if (block.type === 'text') {
    inner = (
      <AutoTextarea
        value={block.text}
        onChange={(v) => patch({ text: v })}
        placeholder="Write…  (Markdown — use ## for headings)"
        className="w-full bg-transparent font-mono text-[13px] leading-relaxed text-ink/90 focus:outline-none"
      />
    );
  } else if (block.type === 'pullquote') {
    inner = (
      <div className="border-l-2 border-accent pl-3">
        <AutoTextarea
          value={block.text}
          onChange={(v) => patch({ text: v })}
          placeholder="Pull quote…"
          className="w-full bg-transparent font-display text-lg leading-snug text-ink/85 focus:outline-none"
        />
      </div>
    );
  } else if (block.type === 'figure') {
    const url = photoUrl(block.src);
    inner = (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const p = e.dataTransfer.getData('application/x-photo');
          if (p) patch({ src: p });
        }}
        className="flex gap-3"
      >
        <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded bg-ink/5">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-muted">
              {block.src || 'drop a photo'}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="truncate text-[10px] uppercase tracking-[0.15em] text-muted">
            Figure{block.src ? ` · ${block.src}` : ''}
          </div>
          <input
            value={block.caption || ''}
            onChange={(e) => patch({ caption: e.target.value })}
            placeholder="Caption"
            className="w-full rounded border border-ink/15 bg-paper px-2 py-1 text-xs focus:border-accent focus:outline-none"
          />
          <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-ink/60">
            <input
              type="checkbox"
              checked={!!block.wide}
              onChange={(e) => patch({ wide: e.target.checked })}
              className="accent-[#B4441C]"
            />
            Wide
          </label>
        </div>
      </div>
    );
  } else if (block.type === 'gallery') {
    const srcs = block.srcs || [];
    const removeItem = (idx) => patch({ srcs: srcs.filter((_, j) => j !== idx) });
    const moveItem = (idx, dir) => {
      const next = [...srcs];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return;
      [next[idx], next[j]] = [next[j], next[idx]];
      patch({ srcs: next });
    };
    inner = (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const p = e.dataTransfer.getData('application/x-photo');
          if (p) patch({ srcs: [...srcs, p] });
        }}
      >
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.15em] text-muted">
          Gallery · {srcs.length} photos · drop to add
        </div>
        <div className="flex flex-wrap gap-1.5">
          {srcs.map((s, idx) => {
            const url = photoUrl(s);
            return (
              <div key={idx} className="group/g relative h-14 w-20 overflow-hidden rounded bg-ink/5">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="p-1 text-[9px] text-muted">{s}</div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/50 opacity-0 group-hover/g:opacity-100">
                  <button onClick={() => moveItem(idx, -1)} className="px-1 text-[10px] text-paper">‹</button>
                  <button onClick={() => removeItem(idx)} className="px-1 text-[10px] text-paper">×</button>
                  <button onClick={() => moveItem(idx, 1)} className="px-1 text-[10px] text-paper">›</button>
                </div>
              </div>
            );
          })}
          {srcs.length === 0 && (
            <div className="flex h-14 w-full items-center justify-center rounded border border-dashed border-ink/20 text-[10px] text-muted">
              Drag photos here
            </div>
          )}
        </div>
        <input
          value={block.caption || ''}
          onChange={(e) => patch({ caption: e.target.value })}
          placeholder="Caption"
          className="mt-1.5 w-full rounded border border-ink/15 bg-paper px-2 py-1 text-xs focus:border-accent focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div className="group/block relative flex gap-2 rounded-lg border border-transparent p-1.5 hover:border-ink/10 hover:bg-ink/[0.015]">
      <div className="pt-1">{handle}</div>
      <div className="min-w-0 flex-1">{inner}</div>
      <button
        onClick={() => onRemove(block.id)}
        title="Delete block"
        className="px-1 leading-none text-ink/25 opacity-0 transition-opacity hover:text-accent group-hover/block:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

export default function BlockEditor({ blocks, onChange, photoUrl }) {
  const [dragOver, setDragOver] = useState(null);

  const update = (id, p) => onChange(blocks.map((b) => (b.id === id ? { ...b, ...p } : b)));
  const remove = (id) => onChange(blocks.filter((b) => b.id !== id));
  const insertAt = (index, block) => {
    const next = [...blocks];
    next.splice(index, 0, block);
    onChange(next);
  };
  const moveTo = (id, index) => {
    const from = blocks.findIndex((b) => b.id === id);
    if (from < 0) return;
    const next = [...blocks];
    const [b] = next.splice(from, 1);
    next.splice(from < index ? index - 1 : index, 0, b);
    onChange(next);
  };
  const onGapDrop = (e, index) => {
    e.preventDefault();
    setDragOver(null);
    const photo = e.dataTransfer.getData('application/x-photo');
    const blockId = e.dataTransfer.getData('application/x-block');
    if (photo) insertAt(index, makeBlock('figure', { src: photo, caption: '', wide: false }));
    else if (blockId) moveTo(blockId, index);
  };

  const Gap = ({ index }) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(index);
      }}
      onDragLeave={() => setDragOver((d) => (d === index ? null : d))}
      onDrop={(e) => onGapDrop(e, index)}
      className="group/gap relative flex h-4 items-center justify-center"
    >
      <div
        className={`absolute inset-x-0 h-0.5 rounded transition-colors ${
          dragOver === index ? 'bg-accent' : 'bg-transparent group-hover/gap:bg-ink/10'
        }`}
      />
      <button
        onClick={() => insertAt(index, makeBlock('text', { text: '' }))}
        className="relative z-10 bg-paper px-2 text-[10px] uppercase tracking-[0.15em] text-muted opacity-0 transition-opacity hover:text-accent group-hover/gap:opacity-100"
      >
        + text
      </button>
    </div>
  );

  return (
    <div className="px-3 py-2">
      <Gap index={0} />
      {blocks.map((block, i) => (
        <div key={block.id}>
          <BlockCard block={block} photoUrl={photoUrl} onUpdate={update} onRemove={remove} />
          <Gap index={i + 1} />
        </div>
      ))}
    </div>
  );
}
