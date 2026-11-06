'use client';

/**
 * BudgetRangeSlider — a dual-handle min/max slider for hourly budget.
 *
 * Pure React + pointer events (no external dep). Two draggable handles over a
 * gradient track; the selected span is highlighted. Values are also typeable
 * via the number inputs below, which stay in sync with the handles.
 *
 * Controlled component: parent owns min/max state and passes setters.
 */

import { useRef, useCallback } from 'react';

export function BudgetRangeSlider({
  min,
  max,
  floor = 15,
  ceil = 60,
  step = 1,
  onChange,
}: {
  min: number;
  max: number;
  floor?: number;
  ceil?: number;
  step?: number;
  onChange: (min: number, max: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = (v: number) => ((v - floor) / (ceil - floor)) * 100;

  const valueFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return floor;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const raw = floor + ratio * (ceil - floor);
      return Math.round(raw / step) * step;
    },
    [floor, ceil, step]
  );

  function startDrag(handle: 'min' | 'max') {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        const v = valueFromPointer(ev.clientX);
        if (handle === 'min') {
          onChange(Math.min(v, max - step), max);
        } else {
          onChange(min, Math.max(v, min + step));
        }
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };
  }

  return (
    <div className="select-none">
      {/* Value labels */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-2xl font-medium text-deepteal">${min}<span className="text-sm text-ink/40 font-sans">/hr</span></div>
        <div className="text-ink/30 text-sm">to</div>
        <div className="font-display text-2xl font-medium text-deepteal">${max}<span className="text-sm text-ink/40 font-sans">/hr</span></div>
      </div>

      {/* Track */}
      <div ref={trackRef} className="relative h-2 rounded-full bg-mist my-5">
        {/* Selected span */}
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-sage via-teal to-sky"
          style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
        />
        {/* Min handle */}
        <button
          type="button"
          onPointerDown={startDrag('min')}
          aria-label="Minimum budget"
          className="absolute top-1/2 w-6 h-6 -mt-3 -ml-3 rounded-full bg-white border-2 border-deepteal shadow-md cursor-grab active:cursor-grabbing touch-none hover:scale-110 transition-transform"
          style={{ left: `${pct(min)}%` }}
        />
        {/* Max handle */}
        <button
          type="button"
          onPointerDown={startDrag('max')}
          aria-label="Maximum budget"
          className="absolute top-1/2 w-6 h-6 -mt-3 -ml-3 rounded-full bg-white border-2 border-deepteal shadow-md cursor-grab active:cursor-grabbing touch-none hover:scale-110 transition-transform"
          style={{ left: `${pct(max)}%` }}
        />
      </div>

      {/* Scale ticks */}
      <div className="flex justify-between text-[10px] font-mono text-ink/35 mb-5">
        <span>${floor}</span>
        <span>${Math.round((floor + ceil) / 2)}</span>
        <span>${ceil}+</span>
      </div>

      {/* Typeable inputs (stay in sync) */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-ink/60 mb-1">Min / hr</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">$</span>
            <input
              type="number"
              min={floor}
              max={max - step}
              value={min}
              onChange={(e) => {
                const v = parseInt(e.target.value || `${floor}`, 10);
                if (!isNaN(v)) onChange(Math.min(Math.max(v, floor), max - step), max);
              }}
              className="w-full rounded-xl border border-ink/20 bg-white pl-7 pr-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </div>
        </div>
        <span className="text-ink/30 mt-5">–</span>
        <div className="flex-1">
          <label className="block text-xs font-medium text-ink/60 mb-1">Max / hr</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">$</span>
            <input
              type="number"
              min={min + step}
              max={ceil}
              value={max}
              onChange={(e) => {
                const v = parseInt(e.target.value || `${ceil}`, 10);
                if (!isNaN(v)) onChange(min, Math.max(Math.min(v, ceil), min + step));
              }}
              className="w-full rounded-xl border border-ink/20 bg-white pl-7 pr-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
