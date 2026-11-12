/**
 * CaregiverProfile — the full caregiver page families open from Browse
 * (public /browse/[id] and the family portal's /client/caregivers/[id]).
 *
 * Built for "does she have this?": every fact is real and comes from
 * browse_caregiver(), which applies the same redaction as Browse (a family
 * that isn't a member sees a first initial, no photo, names masked in the
 * story). Everyone listed here has met the Kindred Standard, so those checks
 * are earned, not decoration.
 */

import Link from 'next/link';
import type { CaregiverRow } from '@/lib/listConfigs';
import {
  SERVICE_GROUPS,
  CREDENTIALS,
  DAYS,
  SLOTS,
  availabilityTags,
  normalizeLanguage,
} from '@/lib/careOptions';

const CRED_LABEL: Record<string, string> = Object.fromEntries(CREDENTIALS.map((o) => [o.value, o.label]));
const CRED_LONG: Record<string, string> = {
  cna: 'Certified Nursing Assistant',
  hha: 'Home Health Aide',
  lpn: 'Licensed Practical Nurse',
  rn: 'Registered Nurse',
  other: 'Caregiver',
};

function nameOf(c: CaregiverRow) {
  if (!c.identity_unlocked) return `${(c.display_name ?? 'K').charAt(0).toUpperCase()}.`;
  return `${c.display_name ?? 'Caregiver'}${c.last_name ? ` ${c.last_name.charAt(0)}.` : ''}`;
}
function initialsOf(c: CaregiverRow) {
  return `${(c.display_name ?? 'K').charAt(0)}${(c.last_name ?? '').charAt(0)}`.toUpperCase();
}

export function CaregiverProfile({
  c,
  actions,
  backHref,
  backLabel = 'Back to caregivers',
  lockedCta,
}: {
  c: CaregiverRow;
  /** Message / unlock / save buttons for this viewer. */
  actions: React.ReactNode;
  backHref: string;
  backLabel?: string;
  /** Shown when names and photos are hidden from this viewer. */
  lockedCta?: React.ReactNode;
}) {
  const name = nameOf(c);
  const keys = new Set(c.service_keys ?? []);
  const groups = SERVICE_GROUPS.map((g) => ({ ...g, offered: g.options.filter((o) => keys.has(o.value)) })).filter(
    (g) => g.offered.length > 0
  );
  const when = new Set(availabilityTags(c.availability));
  const langs = [...new Set((c.languages ?? []).map(normalizeLanguage))];
  const rated = c.rating_avg != null && (c.rating_count ?? 0) > 0;
  const cred = c.credential ? CRED_LONG[c.credential] ?? CRED_LABEL[c.credential] : null;

  const card = 'bg-white border border-ink/10 rounded-2xl p-5 sm:p-6';
  const eyebrow = 'text-xs font-mono uppercase tracking-widest text-ink/50 mb-1';

  return (
    <div className="max-w-4xl mx-auto">
      <Link href={backHref} className="text-sm text-ink/60 hover:text-coral inline-block mb-4">
        ‹ {backLabel}
      </Link>

      {/* HERO */}
      <section className={`${card} fade-up`}>
        <div className="flex flex-col sm:flex-row gap-5">
          {c.identity_unlocked && c.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.photo_url} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shrink-0" />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl av-1 flex items-center justify-center text-cream font-display text-4xl font-medium shrink-0">
              {initialsOf(c)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl sm:text-4xl font-medium leading-tight">{name}</h1>
              <span className="bg-sage/20 text-deepteal px-2.5 py-1 rounded-full text-xs font-medium">✓ Kindred Standard</span>
            </div>
            <div className="text-sm text-ink/70 mt-1">
              {cred ?? 'Caregiver'}
              {c.experience_hours ? ` · ${c.experience_hours.toLocaleString('en-US')}+ hours hands-on` : ''}
            </div>
            <div className="text-sm mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <span className={rated ? 'text-ink' : 'text-ink/60'}>
                {rated ? `★ ${Number(c.rating_avg).toFixed(1)} (${c.rating_count} review${c.rating_count === 1 ? '' : 's'})` : 'New to Kindred'}
              </span>
              {c.distance_mi != null && <span className="text-deepteal">~{c.distance_mi} mi from you</span>}
              {c.availability_status === 'available' && <span className="text-deepteal">● Taking new families</span>}
              {c.availability_status === 'fully_booked' && <span className="text-ink/60">Fully booked right now</span>}
              {c.availability_status === 'on_break' && <span className="text-ink/60">On a break right now</span>}
            </div>
            {c.headline && <p className="mt-3 italic font-display text-lg text-deepteal">&ldquo;{c.headline}&rdquo;</p>}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            {c.hourly_rate_cents != null ? (
              <div className="font-display text-3xl font-medium">
                ${Math.round(c.hourly_rate_cents / 100)}
                <span className="text-base text-ink/50 font-sans">/hr</span>
              </div>
            ) : (
              <div className="text-deepteal font-medium">Rate on request</div>
            )}
            <div className="text-[11px] text-ink/50">Paid to them directly. Kindred never takes a cut.</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        </div>

        {!c.identity_unlocked && lockedCta && (
          <div className="mt-4 bg-mist/50 border border-ink/10 rounded-xl p-3 text-sm text-ink/75">{lockedCta}</div>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 space-y-5">
          {/* ABOUT */}
          <section className={card}>
            <div className={eyebrow}>About</div>
            <h2 className="font-display text-2xl font-medium mb-3">In their words</h2>
            {c.bio ? (
              <p className="text-ink/80 leading-relaxed whitespace-pre-line">{c.bio}</p>
            ) : (
              <p className="text-ink/55 text-sm">They haven&apos;t written their story yet. Ask them anything in a message.</p>
            )}
          </section>

          {/* CARE OFFERED */}
          <section className={card}>
            <div className={eyebrow}>Care they offer</div>
            <h2 className="font-display text-2xl font-medium mb-4">What they can help with</h2>
            {groups.length === 0 ? (
              <p className="text-ink/55 text-sm">They haven&apos;t listed specific care yet. Ask them in a message.</p>
            ) : (
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.key}>
                    <div className="text-xs font-medium text-ink/60 mb-2">{g.label}</div>
                    <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {g.offered.map((o) => (
                        <li key={o.value} className="text-sm flex items-start gap-2">
                          <span className="text-deepteal" aria-hidden="true">✓</span>
                          {o.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p className="text-xs text-ink/50 pt-1">Don&apos;t see something? Ask them; this is the care they chose to list.</p>
              </div>
            )}
          </section>

          {/* AVAILABILITY */}
          <section className={card}>
            <div className={eyebrow}>Usual week</div>
            <h2 className="font-display text-2xl font-medium mb-4">When they&apos;re usually free</h2>
            {when.size === 0 ? (
              <p className="text-ink/55 text-sm">They haven&apos;t set regular hours. You&apos;ll agree on a schedule together.</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-center text-xs border-separate border-spacing-1 min-w-[320px]">
                  <thead>
                    <tr>
                      <th className="text-left font-normal text-ink/50 w-12" />
                      {SLOTS.map((s) => (
                        <th key={s.value} className="font-medium text-ink/70 pb-1">
                          {s.label}
                          <div className="font-normal text-[10px] text-ink/45">{s.hint}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((d) => (
                      <tr key={d.value}>
                        <th className="text-left font-medium text-ink/70">{d.label}</th>
                        {SLOTS.map((s) => {
                          const on = when.has(`${d.value}:${s.value}`);
                          return (
                            <td
                              key={s.value}
                              className={`rounded-md py-2 ${on ? 'bg-gradient-to-br from-sage to-teal text-cream' : 'bg-creamdark/70 text-ink/25'}`}
                              aria-label={`${d.label} ${s.label}: ${on ? 'usually free' : 'not listed'}`}
                            >
                              {on ? '✓' : '·'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* REVIEWS */}
          <section className={card}>
            <div className={eyebrow}>Reviews</div>
            <h2 className="font-display text-2xl font-medium mb-2">From families</h2>
            {rated ? (
              <p className="text-sm text-ink/75">
                ★ {Number(c.rating_avg).toFixed(1)} average from {c.rating_count} famil{c.rating_count === 1 ? 'y' : 'ies'} who hired them
                through Kindred.
              </p>
            ) : (
              <p className="text-sm text-ink/55">
                No reviews yet. Reviews only come from families who actually hired them through Kindred.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          {/* THE STANDARD */}
          <section className={card}>
            <div className={eyebrow}>Checked by Kindred</div>
            <h2 className="font-display text-xl font-medium mb-3">The Kindred Standard</h2>
            <ul className="space-y-2.5 text-sm">
              {[
                ['Personal interview', 'A real conversation with the Kindred team'],
                [
                  c.experience_hours ? `${c.experience_hours.toLocaleString('en-US')}+ hours of hands-on care` : '1,500+ hours of hands-on care',
                  'Proof of hours reviewed',
                ],
                ['Level 2 background check', 'Fingerprint-based state and FBI check'],
                ['ID verified', 'Government photo ID checked'],
                ['Own liability insurance', 'Proof of a current policy on file'],
              ].map(([t, s]) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-deepteal text-cream text-[11px] flex items-center justify-center shrink-0" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <span className="font-medium">{t}</span>
                    <span className="block text-xs text-ink/55">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/kindred-standard" className="mt-4 inline-block text-xs text-deepteal underline underline-offset-4">
              How we check
            </Link>
          </section>

          {/* DETAILS */}
          <section className={card}>
            <div className={eyebrow}>Details</div>
            <dl className="text-sm space-y-3">
              {cred && (
                <div>
                  <dt className="text-ink/50 text-xs">Credential</dt>
                  <dd>{cred}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink/50 text-xs">Languages</dt>
                <dd>{langs.length ? langs.join(', ') : 'Not listed'}</dd>
              </div>
              <div>
                <dt className="text-ink/50 text-xs">Where they work</dt>
                <dd>
                  {c.service_zip ? `Based near ${c.service_zip}` : 'Area not listed'}
                  {c.service_radius_miles ? ` · travels up to ${c.service_radius_miles} mi` : ''}
                </dd>
              </div>
              {c.years_experience != null && (
                <div>
                  <dt className="text-ink/50 text-xs">Years caregiving</dt>
                  <dd>{c.years_experience}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
