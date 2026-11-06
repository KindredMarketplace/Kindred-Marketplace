/**
 * /hipaa — HIPAA Notice of Privacy Practices
 *
 * Required document if Kindred handles Protected Health Information (PHI).
 * Good-faith draft — have a healthcare attorney review before launch.
 */

import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';
import { CONTACT_EMAIL } from '@/lib/site';

export const metadata = {
  title: 'HIPAA Notice of Privacy Practices — Kindred',
  description: 'How Kindred handles Protected Health Information in compliance with HIPAA.',
};

const LAST_UPDATED = 'June 1, 2026';

export default function HipaaPage() {
  return (
    <LegalShell current="hipaa">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-3">Legal · Healthcare</div>
          <h1 className="font-display text-5xl font-medium tracking-tight mb-3">
            HIPAA Notice of Privacy Practices
          </h1>
          <p className="text-sm text-ink/50 font-mono">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Summary box */}
        <div className="bg-mist/50 border border-teal/25 rounded-2xl p-6 mb-10 text-sm leading-relaxed">
          <div className="font-display text-lg font-medium mb-2">Your health information, protected.</div>
          <p className="text-ink/75">
            Kindred handles certain health-related information about care recipients — such as medical conditions, medications, allergies, and care preferences. This notice explains your rights under HIPAA and how we protect that information.
          </p>
        </div>

        <div className="space-y-10 text-ink/80 leading-relaxed text-[15px]">

          <Sec title="1. What Information This Notice Covers">
            <p>
              This notice applies to Protected Health Information (PHI) — health-related details about care recipients that are created, received, or maintained on the Kindred platform. This includes medical diagnoses, conditions, medications, allergies, mobility needs, and care preferences entered by families or caregivers.
            </p>
            <p className="mt-3">
              General account information (name, email, billing address) is covered by our{' '}
              <Link href="/privacy" className="text-deepteal hover:text-coral underline">Privacy Policy</Link>, not this HIPAA notice.
            </p>
          </Sec>

          <Sec title="2. How We Use and Share Health Information">
            <Sub title="For treatment and care coordination (permitted without authorization)">
              <p className="mt-1">We share a care recipient's health information with their hired caregiver to support safe, informed care. This is permitted under HIPAA's treatment exception.</p>
            </Sub>
            <Sub title="For platform operations">
              <p className="mt-1">We may use health information to operate and improve the platform (e.g., matching CNAs with appropriate skills to care recipients with specific needs), subject to HIPAA's minimum necessary standard.</p>
            </Sub>
            <Sub title="With service providers (Business Associates)">
              <p className="mt-1">We share PHI with vendors who help operate the platform — such as our hosting provider (Supabase) and messaging infrastructure. Each vendor signs a Business Associate Agreement (BAA) as required by HIPAA.</p>
            </Sub>
            <Sub title="As required by law">
              <p className="mt-1">We may disclose PHI when required by law, court order, or to report abuse, neglect, or a serious public health threat, as permitted under HIPAA.</p>
            </Sub>
            <Sub title="What we do not do">
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>We do not sell PHI to third parties.</li>
                <li>We do not use PHI for marketing without explicit authorization.</li>
                <li>We do not share PHI with employers or insurance companies without your authorization.</li>
              </ul>
            </Sub>
          </Sec>

          <Sec title="3. Your Rights">
            <p>You have the following rights regarding health information about a care recipient you manage on Kindred:</p>

            <Sub title="Right to access">
              <p className="mt-1">You may request a copy of the health information we hold. Submit requests to <a href={`mailto:${CONTACT_EMAIL}`} className="text-deepteal hover:text-coral underline">{CONTACT_EMAIL}</a>. We will respond within 30 days.</p>
            </Sub>
            <Sub title="Right to correct">
              <p className="mt-1">If you believe health information we hold is incorrect or incomplete, you may request a correction. We will review and respond within 60 days.</p>
            </Sub>
            <Sub title="Right to restrict sharing">
              <p className="mt-1">You may request that we restrict how we use or share health information. We will honor reasonable requests where feasible.</p>
            </Sub>
            <Sub title="Right to an accounting of disclosures">
              <p className="mt-1">You may request a list of instances where we have shared PHI outside of normal care operations.</p>
            </Sub>
            <Sub title="Right to file a complaint">
              <p className="mt-1">If you believe your HIPAA rights have been violated, you may file a complaint with us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-deepteal hover:text-coral underline">{CONTACT_EMAIL}</a> or directly with the U.S. Department of Health and Human Services Office for Civil Rights at <a href="https://www.hhs.gov/hipaa/filing-a-complaint" className="text-deepteal hover:text-coral underline" target="_blank" rel="noopener noreferrer">hhs.gov/hipaa</a>. We will not retaliate against you for filing a complaint.</p>
            </Sub>
          </Sec>

          <Sec title="4. Our Safeguards">
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Technical:</strong> Data encrypted in transit (TLS) and at rest (AES-256). Access controls ensure only authorized users can view PHI.</li>
              <li><strong>Administrative:</strong> Workforce training on HIPAA policies. Audit logs maintained for all PHI access events.</li>
              <li><strong>Physical:</strong> PHI is stored on HIPAA-compliant cloud infrastructure with appropriate physical controls.</li>
              <li><strong>Vendor management:</strong> All vendors handling PHI sign Business Associate Agreements.</li>
            </ul>
          </Sec>

          <Sec title="5. Breach Notification">
            <p>
              In the event of a breach involving unsecured PHI, Kindred will notify affected individuals and, where required, the U.S. Department of Health and Human Services, in accordance with the HIPAA Breach Notification Rule.
            </p>
          </Sec>

          <Sec title="6. Changes to This Notice">
            <p>
              We may update this notice from time to time. The current version will always be available at <Link href="/hipaa" className="text-deepteal hover:text-coral underline">kindredmarketplace.com/hipaa</Link>.
            </p>
          </Sec>

          <Sec title="8. Contact Our Privacy Officer">
            <p>Questions about this notice or how we handle health information?</p>
            <div className="mt-3 bg-mist/40 border border-teal/20 rounded-2xl p-5 text-sm">
              <p className="font-medium">HIPAA Privacy Officer</p>
              <p className="text-ink/70">Kindred Marketplace LLC · Gainesville, Florida</p>
              <p className="text-ink/70 mt-1">
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-deepteal hover:text-coral underline">{CONTACT_EMAIL}</a>
              </p>
            </div>
          </Sec>

          <div className="bg-butter/20 border border-butter/50 rounded-2xl p-5 text-sm text-ink/70">
            <span className="font-mono text-xs uppercase tracking-wider text-ink/40">📋 Internal note</span>
            <p className="mt-2">Draft only — a healthcare attorney must review this before public launch. Key areas: Covered Entity vs. Business Associate determination, minimum necessary standard application, and breach notification procedures.</p>
          </div>
        </div>
      </main>
    </LegalShell>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-medium text-ink mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-medium text-ink mb-1">{title}</h3>
      <div className="text-ink/75">{children}</div>
    </div>
  );
}
