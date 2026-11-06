/**
 * /business/team — facility team & permissions. Ported from
 * Business-Portal/team.html. Shell lives in app/business/layout.tsx.
 *
 * Real-data-only: the member table comes from organization_members joined to
 * users for THIS org. Stats are computed from real membership. The pending
 * invites section + audit log render empty states until those features are
 * wired. The roles-and-permissions reference cards are static educational
 * content (not fabricated user data) and stay as-is.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/business';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

const ROLE_META: Record<string, { label: string; chip: string }> = {
  admin: { label: 'Admin', chip: 'bg-deepteal text-cream' },
  scheduler: { label: 'Scheduler', chip: 'bg-sky/15 text-deepteal border border-sky/30' },
  supervisor: { label: 'Supervisor', chip: 'bg-sage/15 text-deepteal border border-sage/30' },
  billing: { label: 'Billing', chip: 'bg-butter/40 text-ink border border-butter/60' },
  hr: { label: 'HR', chip: 'bg-coral/15 text-coral border border-coral/30' },
};

export default async function BusinessTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ctx = await getBusinessContext();
  if (!ctx?.orgId) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Team &amp; permissions</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">Your team.</h1>
        </section>
        <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
          <p className="text-sm text-ink/70">Set up your facility first to invite teammates.</p>
        </div>
      </main>
    );
  }

  // Members + their user records.
  const { data: members } = await supabase
    .from('organization_members')
    .select('id, user_id, role, created_at')
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: true });

  const memberRows = members ?? [];
  const userIds = memberRows.map((m) => m.user_id);

  const userMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds);
    (users ?? []).forEach((u) => userMap.set(u.id, { full_name: u.full_name, email: u.email }));
  }

  const adminCount = memberRows.filter((m) => m.role === 'admin').length;

  // Role counts for the reference cards.
  const roleCounts = new Map<string, number>();
  memberRows.forEach((m) => roleCounts.set(m.role, (roleCounts.get(m.role) ?? 0) + 1));

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-12">
      {/* HEADER */}
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Team &amp; permissions</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          {memberRows.length > 0 ? (
            <>
              <span className="italic font-medium text-gradient">
                {memberRows.length} {memberRows.length === 1 ? 'teammate' : 'teammates'}
              </span>{' '}
              with Kindred access.
            </>
          ) : (
            <>Invite your <span className="italic font-medium text-gradient">team</span>.</>
          )}
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Different jobs need different access. Your HR coordinator doesn't need to see invoices, and
          your AP person doesn't need to approve shifts. Set it up once, audit it whenever.
        </p>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-8 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Active members</div>
          <div className="font-display text-3xl font-medium mt-1">{memberRows.length}</div>
          <div className="text-xs text-ink/60 mt-1">{adminCount} {adminCount === 1 ? 'admin' : 'admins'}</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Pending invites</div>
          <div className="font-display text-3xl font-medium mt-1 text-ink/40">0</div>
          <div className="text-xs text-ink/60 mt-1">Invites not yet wired</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">SSO status</div>
          <div className="font-display text-lg font-medium mt-1 text-ink/60">Not configured</div>
          <div className="text-xs text-ink/60 mt-1">Microsoft 365 / Okta — coming soon</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Audit log</div>
          <div className="font-display text-lg font-medium mt-1 text-ink/60">Coming soon</div>
          <div className="text-xs text-deepteal mt-1">HIPAA-ready logging</div>
        </div>
      </section>

      {/* MEMBERS TABLE */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.12s' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="relative max-w-md w-full">
            <input
              placeholder="Search by name, email, or role…"
              className="w-full pl-10 pr-4 py-2.5 border border-ink/15 rounded-full text-sm bg-white focus:outline-none focus:border-teal"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">🔍</span>
          </div>
          <button className="bg-deepteal text-cream px-4 py-2 rounded-full text-sm hover:bg-inkdark transition">
            + Invite teammate
          </button>
        </div>

        {memberRows.length > 0 ? (
          <div className="bg-white border border-ink/10 rounded-2xl overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[2.5fr_1.2fr_1.2fr_1fr_120px] gap-4 px-5 py-3 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
                <div>Member</div>
                <div>Role</div>
                <div>Joined</div>
                <div>Auth</div>
                <div></div>
              </div>
              {memberRows.map((m) => {
                const u = userMap.get(m.user_id);
                const name = u?.full_name || u?.email || 'Teammate';
                const meta = ROLE_META[m.role] ?? { label: m.role, chip: 'bg-mist text-ink/60 border border-ink/15' };
                const isYou = m.user_id === ctx.userId;
                return (
                  <div
                    key={m.id}
                    className={`grid grid-cols-[2.5fr_1.2fr_1.2fr_1fr_120px] gap-4 px-5 py-4 text-sm items-center border-b border-ink/10 last:border-b-0 ${isYou ? 'bg-deepteal/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${avatarClass(name)} flex items-center justify-center text-cream text-xs font-medium`}>
                        {initials(name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {name}{' '}
                          {isYou && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-deepteal/15 text-deepteal ml-1">You</span>
                          )}
                        </div>
                        {u?.email && <div className="text-xs text-ink/60 truncate">{u.email}</div>}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono ${meta.chip}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-xs text-ink/70 font-mono">
                      {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-ink/60">Email</div>
                    <div className="text-right">
                      <button className="text-xs text-deepteal hover:text-coral">Edit →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-display text-xl font-medium mb-1">Just you so far</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto">
              Invite schedulers, charge nurses, HR, and AP staff. Each gets exactly the permissions
              their role needs — no more, no less.
            </p>
          </div>
        )}
      </section>

      {/* ROLES & PERMISSIONS — static reference content */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.18s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Roles &amp; permissions</div>
            <h2 className="font-display text-2xl font-medium">Who can do what</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              key: 'admin',
              label: 'Admin',
              chip: 'bg-deepteal text-cream',
              desc: 'Full access. Can post shifts, approve timesheets, see invoices, manage team, change settings.',
              perms: ['Post & manage shifts', 'Approve timesheets', 'View & pay invoices', 'Manage roster & roles', 'Export reports'],
              denied: [],
            },
            {
              key: 'scheduler',
              label: 'Scheduler',
              chip: 'bg-sky/15 text-deepteal border border-sky/30',
              desc: 'Day-to-day staffing operations. Cannot see billing or invoices.',
              perms: ['Post & manage shifts', 'Approve applications', 'Manage roster'],
              denied: ['View invoices', 'Manage team'],
            },
            {
              key: 'supervisor',
              label: 'Supervisor',
              chip: 'bg-sage/15 text-deepteal border border-sage/30',
              desc: 'Wing-level access. Approves timesheets and rates CNAs for their wing only.',
              perms: ['Approve timesheets', 'Rate caregivers', 'View wing schedule'],
              denied: ['Post shifts', 'View invoices'],
            },
            {
              key: 'billing',
              label: 'Billing',
              chip: 'bg-butter/40 text-ink border border-butter/60',
              desc: 'Invoice & payment access only. No staffing data, no CNA personal info.',
              perms: ['View & pay invoices', 'Manage payment methods', 'Export financial reports'],
              denied: ['See caregiver names/data', 'Post shifts'],
            },
            {
              key: 'hr',
              label: 'HR',
              chip: 'bg-coral/15 text-coral border border-coral/30',
              desc: 'Compliance & vendor docs. Verifies CNA credentials and handles incident reports.',
              perms: ['View CNA credentials', 'Manage vendor docs (BAA, COI)', 'File incident reports'],
              denied: ['Post shifts', 'View invoices'],
            },
          ].map((r) => (
            <div key={r.key} className="bg-white border border-ink/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono ${r.chip}`}>{r.label}</span>
                <span className="text-xs text-ink/50 font-mono">
                  {roleCounts.get(r.key) ?? 0} {((roleCounts.get(r.key) ?? 0) === 1) ? 'member' : 'members'}
                </span>
              </div>
              <p className="text-xs text-ink/70 leading-relaxed mb-3">{r.desc}</p>
              <ul className="text-xs space-y-1 text-ink/80">
                {r.perms.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
                {r.denied.map((d) => (
                  <li key={d} className="text-ink/40">✗ {d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* HELP / SUPPORT */}
      <section className="mb-12 fade-up" style={{ animationDelay: '.22s' }}>
        <div className="bg-creamdark/70 border border-ink/10 rounded-3xl p-6 lg:p-8 grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">SSO &amp; audit log</div>
            <h3 className="font-display text-xl font-medium mb-1">Enterprise features coming soon.</h3>
            <p className="text-sm text-ink/70 leading-relaxed">
              SAML SSO (Microsoft 365, Okta, Google Workspace), HIPAA-compliant audit logging, custom
              roles, and per-wing permissions are on the enterprise roadmap. Ask your account manager
              if you need any of these now.
            </p>
          </div>
          <div className="lg:col-span-4 flex gap-2">
            <Link href="/business/help" className="flex-1 bg-deepteal text-cream text-center px-4 py-3 rounded-full text-sm hover:bg-inkdark transition">
              Talk to AM
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
