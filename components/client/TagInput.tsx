'use client';

/**
 * TagInput — type-ahead tag entry backed by the self-growing tag_bank.
 *
 * Behavior:
 *   - Type → debounced GET /api/tags?category=…&q=… → suggestion dropdown.
 *   - Enter, comma, or click a suggestion → adds a pill.
 *   - A brand-new word (not in the bank) still adds as a pill; on save the
 *     server records it into the bank so the NEXT person sees it suggested.
 *   - Click the × on a pill to remove it.
 *
 * Controlled: parent owns the string[] of values.
 */

import { useEffect, useRef, useState } from 'react';

export function TagInput({
  category,
  values,
  onChange,
  placeholder = 'Type and press enter…',
  accent = 'teal',
}: {
  category: 'food' | 'movie' | 'show' | 'music' | 'hobby' | 'care_need';
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  accent?: 'teal' | 'coral' | 'sky';
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Debounced suggestion fetch.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tags?category=${category}&q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        const list: string[] = (data.suggestions ?? []).filter(
          (s: string) => !values.some((v) => v.toLowerCase() === s.toLowerCase())
        );
        setSuggestions(list);
        setActive(-1);
      } catch {
        /* ignore */
      }
    }, 160);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, values]);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (values.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setQuery('');
      return;
    }
    onChange([...values, tag]);
    setQuery('');
    setSuggestions([]);
    setActive(-1);
  }

  function removeTag(tag: string) {
    onChange(values.filter((v) => v !== tag));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (active >= 0 && active < suggestions.length) addTag(suggestions[active]);
      else addTag(query);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Backspace' && !query && values.length) {
      removeTag(values[values.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const pillColor = {
    teal: 'bg-teal text-cream',
    coral: 'bg-coral text-cream',
    sky: 'bg-sky text-cream',
  }[accent];

  return (
    <div ref={boxRef} className="relative">
      <div className="flex flex-wrap gap-2 items-center rounded-xl border border-ink/20 bg-white px-3 py-2.5 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/20 transition">
        {values.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1.5 ${pillColor} text-sm font-medium px-3 py-1 rounded-full`}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:opacity-70 transition"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={values.length ? '' : placeholder}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none py-1"
        />
      </div>

      {/* Suggestion dropdown */}
      {open && (suggestions.length > 0 || query.trim()) && (
        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-ink/15 rounded-xl shadow-xl shadow-ink/10 overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => addTag(s)}
              className={`w-full text-left px-4 py-2 text-sm transition ${
                i === active ? 'bg-mist/70' : 'hover:bg-mist/40'
              }`}
            >
              {s}
            </button>
          ))}
          {/* "Add new" affordance when the typed value isn't an exact suggestion */}
          {query.trim() &&
            !suggestions.some((s) => s.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => addTag(query)}
                className="w-full text-left px-4 py-2 text-sm border-t border-ink/10 text-deepteal hover:bg-mist/40 transition"
              >
                + Add &ldquo;{query.trim()}&rdquo;
              </button>
            )}
        </div>
      )}
    </div>
  );
}
