'use client';

/**
 * ContactForm — real, working contact form. Submits to submitContactAction,
 * which stores the message in the database for the team to read.
 */

import { useState } from 'react';
import { submitContactAction } from './actions';

const ROLES = [
  'Family looking for care',
  'Family with a current Kindred caregiver',
  'CNA / caregiver',
  'Facility / enterprise',
  'Training school partner',
  'Press / media',
  'Other',
];

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit() {
    setStatus('sending');
    setErrors({});
    setErrorMsg('');
    const res = await submitContactAction({ name, email, role, message });
    if (res.ok) {
      setStatus('sent');
    } else {
      setStatus('error');
      setErrorMsg(res.error);
      if (res.fieldErrors) setErrors(res.fieldErrors);
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-white border border-ink/10 rounded-3xl p-8 md:p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-sage/30 mx-auto flex items-center justify-center text-2xl mb-4">✓</div>
        <h3 className="font-display text-2xl font-medium mb-2">Message received.</h3>
        <p className="text-ink/70 text-sm max-w-sm mx-auto">
          Thanks, {name.split(' ')[0] || 'there'}. A real person will read this and get back to you
          at {email}. We don&apos;t use auto-responders.
        </p>
      </div>
    );
  }

  const fieldClass =
    'w-full px-3.5 py-3 border border-ink/15 rounded-xl text-sm bg-white focus:outline-none focus:border-teal';

  return (
    <div className="bg-white border border-ink/10 rounded-3xl p-6 md:p-8">
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} placeholder="Your name" />
          {errors.name && <p className="text-xs text-coral mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={fieldClass} placeholder="you@email.com" />
          {errors.email && <p className="text-xs text-coral mt-1">{errors.email}</p>}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">I am a…</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">Your message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className={fieldClass} placeholder="What's going on? The more context, the better we can help." />
        {errors.message && <p className="text-xs text-coral mt-1">{errors.message}</p>}
      </div>
      {status === 'error' && errorMsg && <p className="text-sm text-coral mb-3">{errorMsg}</p>}
      <button
        onClick={handleSubmit}
        disabled={status === 'sending'}
        className="w-full bg-deepteal text-cream py-3 rounded-full text-sm font-medium hover:bg-inkdark transition disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      <p className="text-[10px] text-ink/50 mt-3 text-center font-mono">A real teammate replies — no auto-responders.</p>
    </div>
  );
}
