'use client';

import { useActionState } from 'react';
import { saveAccountAction, type AccountSaveState } from '@/app/cna/settings/actions';

export function AccountForm({ first, last, email, phone }: { first: string; last: string; email: string; phone: string }) {
  const [state, action, pending] = useActionState<AccountSaveState, FormData>(saveAccountAction, null);
  const label = 'text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block';
  return (
    <form action={action}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="first_name">First name</label>
          <input id="first_name" name="first_name" className="kfield" defaultValue={first} required maxLength={60} />
        </div>
        <div>
          <label className={label} htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" className="kfield" defaultValue={last} maxLength={60} />
          <div className="text-[10px] text-ink/50 mt-1">Families see your first name and last initial.</div>
        </div>
        <div>
          <label className={label} htmlFor="email">Email (sign-in)</label>
          <input id="email" className="kfield opacity-70" type="email" value={email} readOnly />
          <div className="text-[10px] text-ink/50 mt-1">To change your sign-in email, message us through Help.</div>
        </div>
        <div>
          <label className={label} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" className="kfield" type="tel" defaultValue={phone} placeholder="(555) 555-5555" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-3">
        {state && <span role="status" className={`text-sm ${state.ok ? 'text-deepteal' : 'text-coral'}`}>{state.message}</span>}
        <button
          type="submit"
          disabled={pending}
          className="text-sm px-5 py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
