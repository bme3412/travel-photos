// Compact SVG of the captured GPS trail — one polyline per day, drawn from
// the blueprint's photo-derived route points. Server-renderable (no hooks,
// no Mapbox) so the copy overview stays light; the interactive map already
// lives in the replay.

const ACCENT = '#B4441C';
const INK = '#1B1713';
const DAY_OPACITIES = [0.4, 0.95, 0.65];

// `highlight` ({lat, lng}) marks one point of interest on the trail — used by
// the provenance drawer to place the original moment on its day's route. The
// marker is skipped when the point falls outside the trail's frame (e.g. the
// airport) rather than stretching the projection around it.
export default function RoutePreview({ days, highlight = null, className = '' }) {
  const allPoints = days.flatMap((d) => d.route || []);
  if (allPoints.length < 2) return null;

  const W = 640;
  const H = 400;
  const PAD = 28;

  // Equirectangular projection with latitude correction, fit to the viewBox.
  const midLat =
    allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const xOf = (p) => p.lng * kx;
  const yOf = (p) => p.lat;
  const minX = Math.min(...allPoints.map(xOf));
  const maxX = Math.max(...allPoints.map(xOf));
  const minY = Math.min(...allPoints.map(yOf));
  const maxY = Math.max(...allPoints.map(yOf));
  const scale = Math.min(
    (W - PAD * 2) / (maxX - minX || 1),
    (H - PAD * 2) / (maxY - minY || 1)
  );
  const ox = (W - (maxX - minX) * scale) / 2;
  const oy = (H - (maxY - minY) * scale) / 2;
  const project = (p) => [
    ox + (xOf(p) - minX) * scale,
    oy + (maxY - yOf(p)) * scale,
  ];

  let highlightPoint = null;
  if (highlight?.lat != null && highlight?.lng != null) {
    const [hx, hy] = project(highlight);
    if (hx >= 6 && hx <= W - 6 && hy >= 6 && hy <= H - 6) {
      highlightPoint = [hx, hy];
    }
  }

  const dayPaths = days
    .filter((d) => (d.route || []).length > 1)
    .map((d, i) => {
      const pts = d.route.map(project);
      return {
        key: d.id,
        dayNumber: d.dayNumber,
        distanceKm: d.distanceKm,
        opacity: DAY_OPACITIES[i % DAY_OPACITIES.length],
        d: pts
          .map(([x, y], j) => `${j === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
          .join(' '),
        start: pts[0],
      };
    });

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Route traced from the trip's photo locations, one line per day"
        className="block w-full rounded-xl bg-ink/[0.04] ring-1 ring-ink/10"
      >
        {dayPaths.map((p) => (
          <g key={p.key}>
            <path
              d={p.d}
              fill="none"
              stroke={ACCENT}
              strokeOpacity={p.opacity}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={p.start[0]} cy={p.start[1]} r="5" fill={ACCENT} fillOpacity={p.opacity} />
          </g>
        ))}
        {highlightPoint && (
          <g>
            <circle cx={highlightPoint[0]} cy={highlightPoint[1]} r="10" fill={ACCENT} fillOpacity="0.18" />
            <circle
              cx={highlightPoint[0]}
              cy={highlightPoint[1]}
              r="5.5"
              fill={INK}
              stroke="#FAF6EF"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] uppercase tracking-[0.18em] text-muted">
        {dayPaths.map((p) => (
          <span key={p.key} className="inline-flex items-center gap-2">
            <span
              className="inline-block h-[3px] w-6 rounded-full"
              style={{ backgroundColor: ACCENT, opacity: p.opacity }}
            />
            Day {p.dayNumber}
            {p.distanceKm != null && <span className="text-ink/40">{p.distanceKm} km</span>}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
