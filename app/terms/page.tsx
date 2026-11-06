/**
 * /terms — Terms of Service
 *
 * Good-faith draft. Have a healthcare/platform-liability attorney review
 * before public launch.
 */

import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';
import { CONTACT_EMAIL } from '@/lib/site';

export const metadata = {
  title: 'Terms of Service — Kindred',
  description: 'Terms governing use of the Kindred Marketplace platform.',
};

const LAST_UPDATED = 'June 1, 2026';

export default function TermsPage() {
  return (
    <LegalShell current="terms">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-3">Legal</div>
          <h1 className="font-display text-5xl font-medium tracking-tight mb-3">Terms of Service</h1>
          <p className="text-sm text-ink/50 font-mono">Last updated: {LAST_UPDATED}</p>
          <p className="mt-3 text-sm bg-butter/40 border border-butter rounded-xl px-4 py-3 text-ink/80">
            Draft. These terms are being reviewed by our attorney before Kindred launches and may change.
          </p>
        </div>

        <div className="space-y-10 text-ink/80 leading-relaxed text-[15px]">
          <p>
            These Terms of Service ("Terms") govern your use of the Kindred platform, operated by Kindred Marketplace LLC ("Kindred," "we," "us," or "our"). By creating an account or using our services, you agree to these Terms. If you do not agree, do not use the platform.
          </p>

          <Sec title="1. About Kindred">
            <p>
              Kindred is an online marketplace that connects families seeking in-home care with independent, self-employed Certified Nursing Assistants (CNAs). Kindred is not a home health agency, staffing agency, or employer of CNAs. CNAs on Kindred are independent contractors who set their own rates, hours, and service areas.
            </p>
          </Sec>

          <Sec title="2. Eligibility">
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>You must be at least 18 years old to create an account.</li>
              <li>Caregivers must meet the <Link href="/kindred-standard" className="text-deepteal hover:text-coral underline">Kindred Standard</Link> before families can find them, including a Level 2 background check, a verified ID, their own liability insurance and at least 1,500 hours of hands-on experience.</li>
              <li>You must provide accurate, current, and complete information at registration and keep it updated.</li>
            </ul>
          </Sec>

          <Sec title="3. Account Types">
            <p>Kindred has two account types. Kindred is for in-home care only.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Family:</strong> browses caregivers, posts what they need, messages and hires caregivers directly.</li>
              <li><strong>Caregiver:</strong> creates a professional profile, sets their own rate, and applies to family job posts.</li>
            </ul>
          </Sec>

          <Sec title="4. Marketplace Rules">
            <Sub title="For Clients">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>You are hiring an independent caregiver directly. Kindred is not their employer and is not a home health agency or nurse registry.</li>
                <li>You and your caregiver agree on the work, the schedule and the rate between yourselves, and you pay your caregiver directly. Kindred does not process, hold or take any part of those payments.</li>
                <li>You are responsible for ensuring the care environment is safe and appropriate, and for any obligations you may have as a household employer.</li>
              </ul>
            </Sub>
            <Sub title="For Caregivers">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Kindred is not your employer and does not pay you, provide workers&apos; compensation, health benefits, or employment protections. Families pay you directly at the rate you set.</li>
                <li>You are responsible for keeping your credentials current, carrying your own liability insurance, and complying with applicable Florida law.</li>
                <li>You agree to give families honest information about your experience and availability, and reasonable notice if you can&apos;t make a commitment.</li>
              </ul>
            </Sub>
            <Sub title="Prohibited conduct (all users)">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Creating false profiles, misrepresenting credentials, or impersonating another person.</li>
                <li>Harassment, discrimination, or threatening behavior toward any user.</li>
                <li>Sharing access credentials or allowing unauthorized users to access your account.</li>
                <li>Using the platform for any illegal purpose.</li>
              </ul>
            </Sub>
          </Sec>

          <Sec title="5. Membership">
            <p>
              Kindred charges for access to the platform, never for care. Full access requires a membership: a one-time startup fee and a monthly fee, shown on our <Link href="/pricing" className="text-deepteal hover:text-coral underline">pricing page</Link>. Memberships are billed by Stripe and renew monthly until you cancel. You can cancel anytime from your Membership page, and access continues to the end of the period you&apos;ve paid for. Prices may change with at least 30 days&apos; notice.
            </p>
            <p className="mt-3">
              Kindred does not charge a percentage of care, add fees to a caregiver&apos;s rate, or handle any payment between a family and a caregiver.
            </p>
          </Sec>

          <Sec title="6. Arrangements Between Families and Caregivers">
            <p>
              Scheduling, cancellations and payment for care are agreed directly between each family and their caregiver. Kindred is not a party to those arrangements.
            </p>
          </Sec>

          <Sec title="7. Reviews and Ratings">
            <p>
              Families may leave a review and rating for a caregiver they have worked with. Reviews must be honest and based on direct experience. Kindred reserves the right to remove reviews that violate our community standards.
            </p>
          </Sec>

          <Sec title="8. Intellectual Property">
            <p>
              The Kindred platform, including its design, code, trademarks, and content, is owned by Kindred Marketplace LLC. You may not copy, reproduce, or distribute any part of it without written permission. You retain ownership of content you upload (your profile, photos, messages) and grant Kindred a limited license to display that content as part of operating the platform.
            </p>
          </Sec>

          <Sec title="9. Disclaimers and Limitation of Liability">
            <p>
              <strong>Kindred is a marketplace.</strong> We facilitate connections between families and caregivers but are not responsible for the quality, safety, or outcome of care provided. CNAs are independent contractors, not Kindred employees or agents.
            </p>
            <p className="mt-3">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, KINDRED'S TOTAL LIABILITY FOR ANY CLAIM ARISING FROM YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE FEES YOU PAID TO KINDRED IN THE THREE MONTHS PRECEDING THE CLAIM.
            </p>
          </Sec>

          <Sec title="10. Indemnification">
            <p>
              You agree to indemnify and hold harmless Kindred Marketplace LLC, its officers, directors, and agents from any claims, damages, or expenses (including legal fees) arising from your use of the platform, your violation of these Terms, or any care you provide or receive through Kindred.
            </p>
          </Sec>

          <Sec title="11. Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of the State of Florida. Any dispute arising from these Terms or your use of Kindred shall be resolved by binding arbitration in Gainesville, Florida, under the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction.
            </p>
          </Sec>

          <Sec title="12. Termination">
            <p>
              Kindred may suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or conduct that harms other users. You may close your account at any time by contacting support.
            </p>
          </Sec>

          <Sec title="13. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify you of material changes via email or a platform notice. Continued use after changes take effect constitutes acceptance.
            </p>
          </Sec>

          <Sec title="14. Contact">
            <div className="mt-3 bg-mist/40 border border-teal/20 rounded-2xl p-5 text-sm">
              <p className="font-medium">Kindred Marketplace LLC</p>
              <p className="text-ink/70 mt-1">Gainesville, Florida</p>
              <p className="text-ink/70">
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-deepteal hover:text-coral underline">{CONTACT_EMAIL}</a>
              </p>
            </div>
          </Sec>

          <div className="bg-butter/20 border border-butter/50 rounded-2xl p-5 text-sm text-ink/70">
            <span className="font-mono text-xs uppercase tracking-wider text-ink/40">📋 Internal note</span>
            <p className="mt-2">Draft only — have a healthcare and platform-liability attorney review before launch. Pay special attention to §9 (marketplace vs. agency distinction), §10 (indemnification), and §11 (arbitration clause).</p>
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
