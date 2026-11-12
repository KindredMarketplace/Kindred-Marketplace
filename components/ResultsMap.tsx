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
 * The library (~250 KB gzipped) loads only when a map is actually shown.
 */

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

export type MapPin = { id: string; lat: number; lng: number; label: string };

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const FALLBACK_CENTER: [number, number] = [-82.325, 29.65]; // Gainesville, FL

export function ResultsMap({
  pins,
  home,
  selectedId,
  onSelect,
  className = '',
}: {
  pins: MapPin[];
  home?: [number, number] | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
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

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('maplibre-gl');
        if (cancelled || !box.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lib.current = (mod as any).default ?? mod;
        // The worker file is copied to /vendor at build (scripts/copy-maplibre-worker.cjs).
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
    const pts: [number, number][] = pins.map((p) => [p.lng, p.lat]);
    if (home) pts.push([home[1], home[0]]);
    if (pts.length === 1) m.easeTo({ center: pts[0], zoom: 11 });
    else if (pts.length > 1) {
      const b = new L.LngLatBounds(pts[0], pts[0]);
      pts.forEach((p) => b.extend(p));
      m.fitBounds(b, { padding: 48, maxZoom: 12, duration: 400 });
    }
  }, [pins, home, ready]);

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
