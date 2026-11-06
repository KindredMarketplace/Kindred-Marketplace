/**
 * /terms — Terms of Service
 *
 * Good-faith draft. Have a healthcare/platform-liability attorney review
 * before public launch.
 */

import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';

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
              <li>CNAs must hold a current, valid Florida CNA certification and consent to a Level 2 background check.</li>
              <li>Business accounts (facilities) must provide a valid Florida facility license and EIN.</li>
              <li>You must provide accurate, current, and complete information at registration and keep it updated.</li>
            </ul>
          </Sec>

          <Sec title="3. Account Types">
            <p>Kindred has three account types:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Client (Family):</strong> posts jobs, browses and hires CNAs, and manages billing.</li>
              <li><strong>CNA (Caregiver):</strong> creates a professional profile, applies for jobs, and receives payment through Stripe Connect.</li>
              <li><strong>Business (Facility):</strong> posts shift needs in bulk, manages rosters, and receives net-30 invoicing.</li>
            </ul>
          </Sec>

          <Sec title="4. Marketplace Rules">
            <Sub title="For Clients">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>You are hiring an independent CNA, not a Kindred employee.</li>
                <li>You are responsible for ensuring the care environment is safe and appropriate.</li>
                <li>You agree to pay the agreed hourly rate through the Kindred platform. Off-platform payments bypass our protections for both parties.</li>
              </ul>
            </Sub>
            <Sub title="For CNAs">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>You are an independent contractor. Kindred is not your employer and does not provide workers' compensation, health benefits, or employment protections.</li>
                <li>You are responsible for maintaining your CNA certification, carrying appropriate liability insurance, and complying with applicable Florida law.</li>
                <li>You agree to complete booked shifts or provide adequate notice. Repeated no-shows or cancellations may result in account suspension.</li>
              </ul>
            </Sub>
            <Sub title="Prohibited conduct (all users)">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Creating false profiles, misrepresenting credentials, or impersonating another person.</li>
                <li>Circumventing the Kindred platform to arrange care or payments off-platform.</li>
                <li>Harassment, discrimination, or threatening behavior toward any user.</li>
                <li>Sharing access credentials or allowing unauthorized users to access your account.</li>
                <li>Using the platform for any illegal purpose.</li>
              </ul>
            </Sub>
          </Sec>

          <Sec title="5. Payments and Fees">
            <p>
              Payments are processed through Stripe Connect. Client funds are held in escrow and released to the CNA after shift completion. Kindred charges a service fee on each transaction (see your account settings for the current rate applicable to your tier). Rates and fees are subject to change with 14 days' notice.
            </p>
            <p className="mt-3">
              Business accounts are invoiced monthly on net-30 terms. Late payments may accrue interest at 1.5% per month.
            </p>
          </Sec>

          <Sec title="6. Cancellations and Refunds">
            <p>
              Cancellations made more than 24 hours before a scheduled shift are free of charge. Cancellations within 24 hours may incur a cancellation fee. CNA no-shows are eligible for a full refund. Final cancellation and refund policies are detailed in your account settings and may be updated from time to time.
            </p>
          </Sec>

          <Sec title="7. Reviews and Ratings">
            <p>
              After a completed shift, clients may leave a review and rating for their caregiver. Reviews must be honest and based on direct experience. Kindred reserves the right to remove reviews that violate our community standards.
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
                <a href="mailto:legal@kindred.care" className="text-deepteal hover:text-coral underline">legal@kindred.care</a>
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
