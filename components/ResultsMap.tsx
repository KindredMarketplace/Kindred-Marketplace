'use client';

/**
 * ResultsMap — the map above Find jobs / Find care.
 *
 * MapLibre GL (open source) drawing OpenFreeMap tiles (OpenStreetMap data):
 * no API key, no account, no per-view bill, commercial use allowed.
 * Attribution is added by MapLibre automatically, as the tile terms ask.
 *
 * Pins sit somewhere inside each result's ZIP code (see lib/geo.ts pinPoint),
 * never on an address. Tapping a pin picks that result in the list.
 *
 * Draw (Zillow-style): tap "Draw", trace around an area with a finger or the
 * mouse, and only results inside it stay in the list. "Clear" removes it.
 *
 * The library (~250 KB gzipped) loads only when a map is actually shown.
 */

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

export type MapPin = { id: string; lat: number; lng: number; label: string };
/** A drawn area as [lat, lng] corners. */
export type DrawnArea = [number, number][];

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const FALLBACK_CENTER: [number, number] = [-82.325, 29.65]; // Gainesville, FL

export function ResultsMap({
  pins,
  home,
  selectedId,
  onSelect,
  area = null,
  onArea,
  className = '',
}: {
  pins: MapPin[];
  home?: [number, number] | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** The drawn area, if any (controlled by the list so Reset clears it too). */
  area?: DrawnArea | null;
  onArea?: (a: DrawnArea | null) => void;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lib = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = useRef<Map<string, { marker: any; el: HTMLButtonElement }>>(new Map());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [drawing, setDrawing] = useState(false);
  const [trace, setTrace] = useState<[number, number][]>([]); // screen points while drawing
  const tracing = useRef(false);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('maplibre-gl');
        if (cancelled || !box.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lib.current = (mod as any).default ?? mod;
        // The worker file is copied to /vendor at build (tools/copy-maplibre-worker.cjs).
        lib.current.setWorkerUrl?.('/vendor/maplibre-gl-worker.mjs');
        const m = new lib.current.Map({
          container: box.current,
          style: STYLE_URL,
          center: home ? [home[1], home[0]] : FALLBACK_CENTER,
          zoom: 9,
          attributionControl: { compact: true },
          cooperativeGestures: false,
          dragRotate: false,
          pitchWithRotate: false,
        });
        m.touchZoomRotate?.disableRotation?.();
        m.addControl(new lib.current.NavigationControl({ showCompass: false }), 'top-right');
        m.on('error', () => {
          // A failed tile now and then is normal; only give up if the style never loads.
          if (!m.isStyleLoaded()) setFailed(true);
        });
        m.on('load', () => !cancelled && setReady(true));
        map.current = m;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      markers.current.forEach(({ marker }) => marker.remove());
      markers.current.clear();
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep pins in step with the filtered results.
  useEffect(() => {
    const m = map.current;
    const L = lib.current;
    if (!m || !L || !ready) return;
    const want = new Set(pins.map((p) => p.id));
    markers.current.forEach((v, id) => {
      if (!want.has(id)) {
        v.marker.remove();
        markers.current.delete(id);
      }
    });
    for (const p of pins) {
      if (markers.current.has(p.id)) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'kmap-pin';
      el.textContent = p.label;
      el.setAttribute('aria-label', `Show result: ${p.label}`);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectRef.current?.(p.id);
      });
      const marker = new L.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(m);
      markers.current.set(p.id, { marker, el });
    }
    if (area) return; // keep the view on the area they drew
    const pts: [number, number][] = pins.map((p) => [p.lng, p.lat]);
    if (home) pts.push([home[1], home[0]]);
    if (pts.length === 1) m.easeTo({ center: pts[0], zoom: 11 });
    else if (pts.length > 1) {
      const b = new L.LngLatBounds(pts[0], pts[0]);
      pts.forEach((p) => b.extend(p));
      m.fitBounds(b, { padding: 48, maxZoom: 12, duration: 400 });
    }
  }, [pins, home, ready, area]);

  // Show the drawn area as a soft shape on the map.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const data = {
      type: 'FeatureCollection',
      features: area
        ? [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...area, area[0]].map(([la, ln]) => [ln, la])] } }]
        : [],
    };
    const src = m.getSource('kdraw');
    if (src) src.setData(data);
    else {
      m.addSource('kdraw', { type: 'geojson', data });
      m.addLayer({ id: 'kdraw-fill', type: 'fill', source: 'kdraw', paint: { 'fill-color': '#2E6E73', 'fill-opacity': 0.12 } });
      m.addLayer({ id: 'kdraw-line', type: 'line', source: 'kdraw', paint: { 'line-color': '#2E6E73', 'line-width': 2.5 } });
    }
  }, [area, ready]);

  // Drawing: trace on a layer over the map, then turn the trace into map coordinates.
  const pointFrom = (e: React.PointerEvent<HTMLDivElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const startTrace = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    tracing.current = true;
    setTrace([pointFrom(e)]);
  };
  const moveTrace = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tracing.current) return;
    const p = pointFrom(e);
    setTrace((t) => {
      const last = t[t.length - 1];
      return last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 4 ? t : [...t, p];
    });
  };
  const endTrace = () => {
    if (!tracing.current) return;
    tracing.current = false;
    const m = map.current;
    setDrawing(false);
    if (!m || trace.length < 3) {
      setTrace([]);
      return;
    }
    // Keep it light: at most ~60 corners.
    const step = Math.max(1, Math.ceil(trace.length / 60));
    const corners: DrawnArea = trace
      .filter((_, i) => i % step === 0)
      .map(([x, y]) => {
        const ll = m.unproject([x, y]);
        return [Math.round(ll.lat * 10000) / 10000, Math.round(ll.lng * 10000) / 10000] as [number, number];
      });
    setTrace([]);
    if (corners.length >= 3) onArea?.(corners);
  };

  // Your own area, as a soft dot.
  useEffect(() => {
    const m = map.current;
    const L = lib.current;
    if (!m || !L || !ready || !home) return;
    const el = document.createElement('div');
    el.className = 'kmap-home';
    el.title = 'Your area';
    const marker = new L.Marker({ element: el }).setLngLat([home[1], home[0]]).addTo(m);
    return () => marker.remove();
  }, [home, ready]);

  // Highlight the chosen pin.
  useEffect(() => {
    markers.current.forEach(({ el }, id) => el.classList.toggle('kmap-pin-on', id === selectedId));
  }, [selectedId, pins]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-ink/10 bg-mist/40 ${className}`}>
      <div ref={box} className="h-full w-full" />

      {/* Draw layer: only present while drawing, so the map pans normally otherwise. */}
      {drawing && (
        <div
          className="absolute inset-0 z-[5] cursor-crosshair touch-none"
          onPointerDown={startTrace}
          onPointerMove={moveTrace}
          onPointerUp={endTrace}
          onPointerCancel={endTrace}
        >
          <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
            {trace.length > 1 && (
              <polyline
                points={trace.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="rgba(46,110,115,0.12)"
                stroke="#2E6E73"
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
          </svg>
          {trace.length === 0 && (
            <div className="absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-inkdark/80 px-4 py-2 text-xs text-cream">
              Trace around the area you want
            </div>
          )}
        </div>
      )}

      {ready && onArea && (
        <div className="absolute left-3 top-3 z-[6] flex gap-2">
          {drawing ? (
            <button
              type="button"
              onClick={() => {
                setDrawing(false);
                setTrace([]);
              }}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-md border border-ink/10"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDrawing(true)}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-md border border-ink/10 hover:bg-mist"
            >
              ✏️ {area ? 'Redraw' : 'Draw'}
            </button>
          )}
          {area && !drawing && (
            <button
              type="button"
              onClick={() => onArea(null)}
              className="rounded-full bg-deepteal px-4 py-2 text-sm font-medium text-cream shadow-md"
            >
              ✕ Clear area
            </button>
          )}
        </div>
      )}
      {!ready && !failed && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-ink/50 pointer-events-none">Loading map…</div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink/60">
          The map couldn&apos;t load right now. The list below still works.
        </div>
      )}
    </div>
  );
}
