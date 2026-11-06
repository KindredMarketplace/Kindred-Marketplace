/**
 * /contact — ported from Front-End/Homepage/contact.html, made honest:
 *   - removed the fabricated phone numbers, the "24/7 hotline · median 11 min",
 *     the invented street address, and the half-dozen fake department emails;
 *   - the form is REAL — it writes to contact_messages (see ContactForm);
 *   - one real email shown as a fallback channel.
 */

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ContactForm } from './ContactForm';

export const dynamic = 'force-dynamic';

const CONTACT_EMAIL = 'kindredhhcmarketplace@gmail.com';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20">
        <section className="text-center mb-12 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Contact</div>
          <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-4">
            Talk to a <span className="italic font-medium text-gradient">real person.</span>
          </h1>
          <p className="text-lg text-ink/70 max-w-2xl mx-auto">
            No phone tree, no ticket numbers. Send a note below and a real teammate reads it and
            replies.
          </p>
        </section>

        {/* Who you might be (honest routing, no fake numbers) */}
        <section className="grid md:grid-cols-3 gap-5 mb-12 fade-up">
          {[
            ['👨‍👩‍👧', 'Families', 'Help finding a caregiver, payment questions, or care plan changes.'],
            ['👩‍⚕️', 'Caregivers', 'Application help, profile questions, or anything about working on Kindred.'],
            ['🏥', 'Facilities & press', 'Early-access interest for facilities, media inquiries, and partnerships.'],
          ].map(([icon, title, body]) => (
            <div key={title} className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="text-2xl mb-2">{icon}</div>
              <h3 className="font-display text-xl font-medium mb-2">{title}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        {/* Form + sidebar */}
        <section className="grid lg:grid-cols-12 gap-8 mb-12 fade-up">
          <div className="lg:col-span-5">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Send a note</div>
            <h2 className="font-display text-3xl md:text-4xl font-light mb-4">Tell us what&apos;s up</h2>
            <p className="text-ink/70 leading-relaxed mb-6">
              We&apos;re a small, early team in Gainesville — which means your message goes to a
              person, not a queue. Prefer email? Reach us directly:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 bg-mist/50 border border-ink/10 rounded-xl px-4 py-3 text-sm text-deepteal hover:bg-mist transition break-all"
            >
              ✉ {CONTACT_EMAIL}
            </a>
          </div>
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
