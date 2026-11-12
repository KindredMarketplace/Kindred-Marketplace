/**
 * Family FAQ content, shared by the public /faq page and the family Help
 * center. Facts checked Nov 12, 2026:
 *   - IRS Tax Topic 756 (household employees): Social Security / Medicare
 *     apply at $3,000+ cash wages to one household employee in 2026; federal
 *     unemployment (FUTA) at $1,000+ in any calendar quarter; Schedule H and
 *     W-2; employee vs. contractor turns on who controls how the work is done.
 *   - Care.com HomePay pricing page: Essentials $59/month, Plus $75/month.
 * Kindred has no partnership with, and gets nothing from, any payroll service.
 * Accordions are native <details>, so this stays server-rendered.
 */

import Link from 'next/link';

export type Faq = { q: string; a: React.ReactNode };

const a = 'text-deepteal underline underline-offset-2 hover:text-coral';

export const FAQ_GROUPS: { id: string; title: string; faqs: Faq[] }[] = [
  {
    id: 'caregivers',
    title: 'Finding a caregiver',
    faqs: [
      {
        q: 'How does Kindred check caregivers?',
        a: (
          <>
            Every caregiver you can find on Kindred meets the Kindred Standard: a personal interview, 1,500+ hours of
            hands-on experience, a Level 2 background check, a verified ID, and their own liability insurance. Read how we
            check on the <Link href="/kindred-standard" className={a}>Kindred Standard page</Link>.
          </>
        ),
      },
      {
        q: 'Can I look before I join?',
        a: 'Yes. Browsing is free and you don’t need an account. You can filter, open full profiles and save caregivers you like. Names, photos and messaging open with a membership, which protects caregivers’ privacy.',
      },
      {
        q: 'Why do I need a membership to message or post a job?',
        a: 'Membership is how Kindred keeps caregivers’ contact details away from strangers and how Kindred pays for itself without taking a cut of what you pay for care. Posting a job lets caregivers apply and message you, so it opens with membership too.',
      },
      {
        q: 'Can I have more than one caregiver?',
        a: 'Yes, and many families do. Each arrangement (schedule, rate and how you pay) is between you and that caregiver.',
      },
      {
        q: 'How do I switch caregivers?',
        a: 'Find someone new in Browse and message them. Let your current caregiver know with the notice the two of you agreed on.',
      },
    ],
  },
  {
    id: 'paying',
    title: 'Paying for care',
    faqs: [
      {
        q: 'How do I pay my caregiver?',
        a: 'Directly. You and your caregiver agree on the rate, the schedule and how you’ll pay. Kindred never processes, holds, or takes any part of what you pay for care.',
      },
      {
        q: 'What does Kindred charge?',
        a: (
          <>
            Only a membership: a one-time startup fee plus a monthly fee. No service fee on care and no percentage of
            what you pay your caregiver. Current prices are on the <Link href="/pricing" className={a}>pricing page</Link>.
          </>
        ),
      },
      {
        q: 'Will long-term-care insurance pay for this?',
        a: 'Some long-term-care policies reimburse families for in-home care. You file the claim with your insurer yourself, so check your policy and keep a simple log of visits, hours and what you paid.',
      },
      {
        q: 'Does Medicare or Medicaid cover this?',
        a: 'Not through Kindred. Kindred is private pay only and doesn’t bill Medicare, Medicaid or any insurer. Original Medicare generally doesn’t cover routine non-medical home care; some Medicare Advantage plans offer limited in-home help through their own providers.',
      },
    ],
  },
  {
    id: 'employer',
    title: 'Hiring directly: taxes and paperwork',
    faqs: [
      {
        q: 'Am I my caregiver’s employer?',
        a: (
          <>
            Often, yes. When you hire someone to work in your home and you decide what they do and how they do it, the
            IRS usually treats them as your household employee, not an independent contractor. It depends on the
            arrangement, so the IRS{' '}
            <a href="https://www.irs.gov/taxtopics/tc756" target="_blank" rel="noopener noreferrer" className={a}>
              household employee guide
            </a>{' '}
            and a tax professional are the places to confirm.
          </>
        ),
      },
      {
        q: 'When do household employment taxes kick in?',
        a: (
          <>
            For 2026, if you pay one household employee $3,000 or more in cash wages in the year, Social Security and
            Medicare taxes apply (7.65% withheld from their pay, and 7.65% you pay). If you pay household employees $1,000
            or more in any calendar quarter, federal unemployment tax (FUTA) applies too. You report these on Schedule H
            with your tax return and give your caregiver a W-2. Thresholds change from year to year, so check the{' '}
            <a href="https://www.irs.gov/taxtopics/tc756" target="_blank" rel="noopener noreferrer" className={a}>
              IRS page
            </a>{' '}
            for the current numbers.
          </>
        ),
      },
      {
        q: 'What about Florida?',
        a: 'Florida has no state income tax to withhold. A household employer may also owe Florida reemployment (unemployment) tax; the Florida Department of Revenue or a household payroll service can tell you whether that applies to you.',
      },
      {
        q: 'Is there a service that handles the payroll for me?',
        a: (
          <>
            Yes. Household payroll services register you with the tax agencies, run payroll and file the forms. One of
            the best known is{' '}
            <a href="https://www.care.com/homepay" target="_blank" rel="noopener noreferrer" className={a}>
              HomePay
            </a>{' '}
            (from Care.com), which lists plans from $59 a month; there are others. Kindred has no partnership with any of
            them and gets nothing if you sign up.
          </>
        ),
      },
    ],
  },
  {
    id: 'safety',
    title: 'Trust & safety',
    faqs: [
      {
        q: 'What if something goes wrong during a visit?',
        a: 'In an emergency, call 911 first. Once everyone is safe, tell us what happened so we can review the caregiver’s account.',
      },
      {
        q: 'Is my family’s information private?',
        a: (
          <>
            Yes. You decide what to share with the caregivers you talk to, and we don&rsquo;t sell personal information.
            Our <Link href="/privacy" className={a}>Privacy Policy</Link> has the details.
          </>
        ),
      },
    ],
  },
  {
    id: 'using',
    title: 'Using Kindred',
    faqs: [
      {
        q: 'Is there an app?',
        a: 'Kindred works in your phone’s browser, and you can add it to your home screen so it opens like an app (on iPhone: Share, then Add to Home Screen). App Store and Google Play versions come after launch.',
      },
      {
        q: 'Can my sibling or spouse use my account?',
        a: 'Not yet. Shared family access, where each person has their own sign-in, is on the way. For now, please don’t share your password.',
      },
    ],
  },
];

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <details key={i} className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
          <summary className="p-5 flex items-center justify-between gap-3 hover:bg-mist/30 transition">
            <span className="font-medium">{f.q}</span>
            <span className="accordion-chevron text-ink/50 shrink-0">▾</span>
          </summary>
          <div className="px-5 pb-5 text-sm text-ink/75 leading-relaxed border-t border-ink/10 pt-4">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
