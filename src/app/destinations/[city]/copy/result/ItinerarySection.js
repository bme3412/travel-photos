'use client';

// The generated itinerary: a read view (timeline with provenance) and an
// edit mode with the plan's manual verbs — rename a day, edit an item's
// title/description/time, remove, move up/down, move to another day, add a
// custom stop. Simple controls, no drag-and-drop. Text inputs commit on
// blur so the persisted session isn't rewritten on every keystroke.

import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { fmtTime12 } from '@/features/copy-trip/format.mjs';
import {
  renameDay,
  updateItem,
  removeItem,
  moveItem,
  moveItemToDay,
  addCustomItem,
} from '@/features/copy-trip/planEdits.mjs';

const STATUS_LABELS = {
  preserved: { label: 'From original', className: 'bg-ink/[0.06] text-ink/70' },
  modified: { label: 'Adjusted', className: 'bg-accent/10 text-accent' },
  new: { label: 'New suggestion', className: 'ring-1 ring-ink/20 text-ink/60' },
};

const TRAVEL_MODE_LABELS = {
  walk: 'On foot from the previous stop',
  metro: 'Métro from the previous stop',
  taxi: 'Taxi from the previous stop',
  bike: 'By bike from the previous stop',
};

const INPUT =
  'w-full rounded-lg bg-transparent px-2.5 py-1.5 text-ink ring-1 ring-ink/15 ' +
  'placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent';

const ICON_BUTTON =
  'flex h-7 w-7 items-center justify-center rounded-full text-ink/50 ring-1 ring-ink/15 ' +
  'transition-colors hover:text-ink hover:ring-ink/40 disabled:opacity-25 disabled:hover:text-ink/50 disabled:hover:ring-ink/15';

function StatusChip({ status }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.new;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${s.className}`}>
      {s.label}
    </span>
  );
}

function ItemView({ item, onViewSource }) {
  const travel = TRAVEL_MODE_LABELS[item.travelModeFromPrevious];
  return (
    <li className="grid grid-cols-[4.5rem_1fr] gap-4">
      <div className="pt-0.5 text-[13px] text-muted">{fmtTime12(item.time) ?? '—'}</div>
      <div className="min-w-0 border-l border-ink/[0.08] pl-4">
        {travel && (
          <p className="mb-1.5 text-[11px] uppercase tracking-[0.15em] text-ink/35">{travel}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h4 className="text-[16px] text-ink leading-snug">{item.title}</h4>
          <StatusChip status={item.status} />
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink/70">{item.description}</p>
        <p className="mt-1.5 text-xs text-muted">
          {[item.durationMinutes ? `${item.durationMinutes} min` : null, item.neighborhood]
            .filter(Boolean)
            .join(' · ')}
          {item.provenanceLabel && (
            <span className="italic text-ink/40"> — {item.provenanceLabel}</span>
          )}
        </p>
        {item.sourceExperienceId && (
          <button
            type="button"
            onClick={() => onViewSource(item.sourceExperienceId)}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em]
                       text-accent/80 transition-colors hover:text-accent"
          >
            <Eye className="h-3 w-3" />
            View original moment
          </button>
        )}
      </div>
    </li>
  );
}

function ItemEditor({ item, day, dayNumbers, index, count, onApply, plan }) {
  const commit = (patch) => onApply(updateItem(plan, day.dayNumber, item.id, patch));

  return (
    <li className="grid grid-cols-[4.5rem_1fr] gap-4">
      <div>
        <label className="sr-only" htmlFor={`time-${item.id}`}>Time for {item.title}</label>
        <input
          id={`time-${item.id}`}
          type="time"
          defaultValue={item.time ?? ''}
          onBlur={(e) => {
            const v = e.target.value || undefined;
            if (v !== item.time) commit({ time: v });
          }}
          className={`${INPUT} px-1.5 text-[12px]`}
        />
      </div>
      <div className="min-w-0 space-y-2 border-l border-ink/[0.08] pl-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            aria-label="Item title"
            defaultValue={item.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== item.title) commit({ title: v });
            }}
            className={`${INPUT} text-[16px]`}
          />
          <StatusChip status={item.status} />
        </div>
        <textarea
          rows={2}
          aria-label="Item description"
          defaultValue={item.description}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== item.description) commit({ description: v });
          }}
          className={`${INPUT} text-[14px] leading-relaxed`}
        />
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={index === 0}
            aria-label="Move up"
            onClick={() => onApply(moveItem(plan, day.dayNumber, item.id, -1))}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={index === count - 1}
            aria-label="Move down"
            onClick={() => onApply(moveItem(plan, day.dayNumber, item.id, +1))}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          {dayNumbers.length > 1 && (
            <select
              aria-label="Move to another day"
              value={day.dayNumber}
              onChange={(e) => onApply(moveItemToDay(plan, day.dayNumber, item.id, Number(e.target.value)))}
              className="rounded-full bg-transparent px-2.5 py-1 text-[11px] uppercase tracking-[0.12em]
                         text-ink/60 ring-1 ring-ink/15 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {dayNumbers.map((n) => (
                <option key={n} value={n}>
                  Day {n}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className={`${ICON_BUTTON} ml-auto hover:text-accent hover:ring-accent/50`}
            aria-label={`Remove ${item.title}`}
            onClick={() => onApply(removeItem(plan, day.dayNumber, item.id))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {item.provenanceLabel && (
          <p className="text-xs italic text-ink/40">{item.provenanceLabel}</p>
        )}
      </div>
    </li>
  );
}

function DayCard({ day, plan, editing, dayNumbers, onViewSource, onApply }) {
  const meta = [
    day.startTime && day.endTime ? `${fmtTime12(day.startTime)} – ${fmtTime12(day.endTime)}` : null,
    day.estimatedDistanceKm != null ? `≈ ${day.estimatedDistanceKm} km on foot` : null,
    day.neighborhoods?.length ? day.neighborhoods.join(' · ') : null,
  ].filter(Boolean);

  return (
    <section className="rounded-2xl bg-white/60 ring-1 ring-ink/10 p-5 sm:p-7">
      <p className="text-[11px] uppercase tracking-[0.25em] text-accent">
        Day {day.dayNumber} · {day.theme}
      </p>
      {editing ? (
        <input
          type="text"
          aria-label={`Title for day ${day.dayNumber}`}
          defaultValue={day.title}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== day.title) onApply(renameDay(plan, day.dayNumber, v));
          }}
          className={`${INPUT} mt-1.5 font-display text-2xl tracking-tight leading-tight`}
        />
      ) : (
        <h3 className="mt-1 font-display text-2xl tracking-tight leading-tight">{day.title}</h3>
      )}
      {meta.length > 0 && <p className="mt-2 text-xs text-muted">{meta.join(' · ')}</p>}

      {day.items.length === 0 ? (
        <p className="mt-6 text-[14px] italic text-ink/40">No stops on this day yet.</p>
      ) : (
        <ol className="mt-6 space-y-6">
          {day.items.map((item, index) =>
            editing ? (
              <ItemEditor
                key={item.id}
                item={item}
                day={day}
                dayNumbers={dayNumbers}
                index={index}
                count={day.items.length}
                plan={plan}
                onApply={onApply}
              />
            ) : (
              <ItemView key={item.id} item={item} onViewSource={onViewSource} />
            )
          )}
        </ol>
      )}

      {editing && (
        <button
          type="button"
          onClick={() => onApply(addCustomItem(plan, day.dayNumber).plan)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border
                     border-dashed border-ink/20 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em]
                     text-ink/50 transition-colors hover:border-accent/60 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Add a stop
        </button>
      )}
    </section>
  );
}

export default function ItinerarySection({
  plan,
  onViewSource,
  onApplyEdit,
  heading = 'Your itinerary',
}) {
  const [editing, setEditing] = useState(false);
  const dayNumbers = plan.days.map((d) => d.dayNumber);

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.25em] text-accent">{heading}</p>
        {onApplyEdit && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            aria-pressed={editing}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase
                        tracking-[0.18em] ring-1 transition-colors ${
                          editing
                            ? 'bg-ink text-paper ring-ink'
                            : 'text-ink/60 ring-ink/15 hover:text-ink hover:ring-ink/40'
                        }`}
          >
            <Pencil className="h-3 w-3" />
            {editing ? 'Done editing' : 'Edit itinerary'}
          </button>
        )}
      </div>
      <div className="mt-5 space-y-6">
        {plan.days.map((day) => (
          <DayCard
            key={day.dayNumber}
            day={day}
            plan={plan}
            editing={editing && Boolean(onApplyEdit)}
            dayNumbers={dayNumbers}
            onViewSource={onViewSource}
            onApply={onApplyEdit}
          />
        ))}
      </div>
    </section>
  );
}
