/**
 * /privacy — Privacy Policy
 *
 * Good-faith draft covering the key sections. Have a healthcare attorney
 * review before public launch (see legal checklist).
 */

import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';

export const metadata = {
  title: 'Privacy Policy — Kindred',
  description: 'How Kindred Marketplace LLC collects, uses, and protects your personal information.',
};

const LAST_UPDATED = 'June 1, 2026';

export default function PrivacyPage() {
  return (
    <LegalShell current="privacy">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-3">Legal</div>
          <h1 className="font-display text-5xl font-medium tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-sm text-ink/50 font-mono">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-10 text-ink/80 leading-relaxed text-[15px]">
          <p>
            Kindred Marketplace LLC ("Kindred," "we," "us," or "our") operates the Kindred platform — a marketplace connecting families with independent Certified Nursing Assistants (CNAs) in Florida. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </p>
          <p>
            By using Kindred, you agree to the practices described in this policy.
          </p>

          <Sec title="1. Information We Collect">
            <Sub title="Information you provide directly">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Account registration:</strong> name, email address, phone number, ZIP code, and password.</li>
                <li><strong>CNA profiles:</strong> bio, photo, license number, years of experience, hourly rate, service area, and availability.</li>
                <li><strong>Care recipient information:</strong> name, medical conditions, allergies, medications, and care preferences — shared by families with their chosen caregiver.</li>
                <li><strong>Verification documents:</strong> CNA license, CPR card, background check consent, and immunization records.</li>
                <li><strong>Payment information:</strong> processed by Stripe; we do not store raw card numbers.</li>
                <li><strong>Messages:</strong> communications sent through the Kindred messaging system.</li>
                <li><strong>Job postings and applications.</strong></li>
              </ul>
            </Sub>
            <Sub title="Information collected automatically">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>IP address, browser type, device identifiers, and operating system.</li>
                <li>Pages visited, time spent, and referral URLs.</li>
                <li>Approximate location (ZIP code or geolocation) to match caregivers and jobs.</li>
              </ul>
            </Sub>
            <Sub title="Information from third parties">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Background check results from our screening partner.</li>
                <li>License verification data from the Florida Department of Health.</li>
                <li>Payment data from Stripe Connect.</li>
              </ul>
            </Sub>
          </Sec>

          <Sec title="2. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Create and maintain your account and profile.</li>
              <li>Match families with caregivers by location, services, and availability.</li>
              <li>Process payments and payouts through Stripe Connect.</li>
              <li>Verify CNA credentials and facilitate background checks.</li>
              <li>Send transactional notifications (booking confirmations, messages, payment receipts).</li>
              <li>Provide customer support and resolve disputes.</li>
              <li>Improve the platform through analytics and usage data.</li>
              <li>Comply with legal obligations, including HIPAA where applicable.</li>
              <li>Prevent fraud, abuse, and safety incidents.</li>
            </ul>
          </Sec>

          <Sec title="3. How We Share Your Information">
            <Sub title="With other platform users">
              <p className="mt-1">CNA profiles are visible to families searching for caregivers. Full contact details are only shared after a booking is confirmed. Care recipient information is shared only with the family's hired caregiver.</p>
            </Sub>
            <Sub title="With service providers">
              <p className="mt-1">We share data with vetted vendors who help operate the platform: Stripe (payments), Supabase (hosting), our background check partner, and transactional email/SMS providers. Each vendor handling health-related data is required to sign a Business Associate Agreement (BAA).</p>
            </Sub>
            <Sub title="For legal reasons">
              <p className="mt-1">We may disclose information if required by law, court order, or to protect user or public safety.</p>
            </Sub>
            <Sub title="We do not sell your data">
              <p className="mt-1">Kindred does not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
            </Sub>
          </Sec>

          <Sec title="4. Protected Health Information (PHI)">
            <p>
              Some information on Kindred — such as a care recipient's medical conditions, medications, and care preferences — may constitute Protected Health Information (PHI) under HIPAA. We handle this information in accordance with our{' '}
              <Link href="/hipaa" className="text-deepteal hover:text-coral underline">HIPAA Notice of Privacy Practices</Link>.
              We use HIPAA-compliant infrastructure, require BAAs from relevant vendors, and maintain audit logs of access to health-related data.
            </p>
          </Sec>

          <Sec title="5. Data Retention">
            <p>We retain account data for as long as your account is active or as needed to provide services. Upon account deletion, personal data is removed within 30 days, except where retention is required by law (e.g., financial records, HIPAA audit logs).</p>
          </Sec>

          <Sec title="6. Security">
            <p>We use industry-standard safeguards: TLS encryption in transit, AES-256 encryption at rest, role-based access controls, and regular security reviews. No method of transmission or storage is 100% secure. Contact us immediately if you suspect unauthorized account access.</p>
          </Sec>

          <Sec title="7. Your Rights">
            <p>You may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Access</strong> the personal data we hold about you.</li>
              <li><strong>Correct</strong> inaccurate data via your profile or account settings.</li>
              <li><strong>Delete</strong> your account and associated data.</li>
              <li><strong>Opt out</strong> of non-transactional communications at any time.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, email{' '}
              <a href="mailto:privacy@kindred.care" className="text-deepteal hover:text-coral underline">privacy@kindred.care</a>.
            </p>
          </Sec>

          <Sec title="8. Cookies">
            <p>We use cookies to maintain your session, remember preferences, and analyze platform usage. You can disable cookies in your browser settings, though some features may not work correctly without them.</p>
          </Sec>

          <Sec title="9. Children's Privacy">
            <p>Kindred is not directed at children under 18. We do not knowingly collect information from minors. Contact <a href="mailto:privacy@kindred.care" className="text-deepteal hover:text-coral underline">privacy@kindred.care</a> if you believe a minor has created an account.</p>
          </Sec>

          <Sec title="10. Changes to This Policy">
            <p>We may update this policy from time to time. We will notify you of material changes via email or a prominent notice on the platform. Continued use after changes constitutes acceptance.</p>
          </Sec>

          <Sec title="11. Contact Us">
            <p>Questions about this Privacy Policy?</p>
            <div className="mt-3 bg-mist/40 border border-teal/20 rounded-2xl p-5 text-sm">
              <p className="font-medium">Kindred Marketplace LLC</p>
              <p className="text-ink/70 mt-1">Gainesville, Florida</p>
              <p className="text-ink/70">
                <a href="mailto:privacy@kindred.care" className="text-deepteal hover:text-coral underline">privacy@kindred.care</a>
              </p>
            </div>
          </Sec>

          <div className="bg-butter/20 border border-butter/50 rounded-2xl p-5 text-sm text-ink/70">
            <span className="font-mono text-xs uppercase tracking-wider text-ink/40">📋 Internal note</span>
            <p className="mt-2">Draft only — have a healthcare attorney review before public launch, particularly HIPAA and data retention sections.</p>
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
