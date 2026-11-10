'use server';

/**
 * Admin → People: manage any family / caregiver account.
 *
 * Every action re-checks that the caller is an active admin, then uses the
 * service-role client (needed for auth changes: email, password, suspend,
 * delete). Each change is written to audit_log. Results come back as a
 * ?ok= / ?err= query param on the page that sent them.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role, status').eq('id', user.id).single();
  if (me?.role !== 'admin' || me.status !== 'active') redirect('/login?error=not_authorized');
  return user.id;
}

function back(id: string, key: 'ok' | 'err', msg: string): never {
  redirect(`/admin/people/${id}?${key}=${encodeURIComponent(msg)}`);
}

async function audit(adminId: string, action: string, targetId: string, context: Record<string, unknown>) {
  const svc = createServiceClient();
  await svc.from('audit_log').insert({
    user_id: adminId,
    action: action === 'delete_account' ? 'delete' : action === 'create_account' ? 'create' : 'update',
    resource_type: 'users',
    resource_id: targetId,
    context: { admin_action: action, ...context },
  });
}

async function loadTarget(id: string) {
  if (!UUID.test(id)) redirect('/admin/people?err=' + encodeURIComponent('Unknown account.'));
  const svc = createServiceClient();
  const { data } = await svc.from('users').select('id, email, full_name, role, status').eq('id', id).maybeSingle();
  if (!data) redirect('/admin/people?err=' + encodeURIComponent('That account no longer exists.'));
  return data;
}

/* ----------------------------------------------------------- account details */

export async function updateAccountAction(formData: FormData) {
  const adminId = await requireAdmin();
  const id = formData.get('id')?.toString() ?? '';
  const target = await loadTarget(id);

  const fullName = (formData.get('full_name')?.toString() ?? '').trim().slice(0, 120);
  const phone = (formData.get('phone')?.toString() ?? '').trim().slice(0, 30) || null;
  const email = (formData.get('email')?.toString() ?? '').trim().toLowerCase();
  if (!fullName) back(id, 'err', 'Name can’t be empty.');
  if (!EMAIL.test(email)) back(id, 'err', 'That email doesn’t look right.');

  const svc = createServiceClient();
  if (email !== target.email.toLowerCase()) {
    const { error } = await svc.auth.admin.updateUserById(id, { email, email_confirm: true });
    if (error) back(id, 'err', 'Couldn’t change the email (it may already be in use).');
  }
  const { error } = await svc.from('users').update({ full_name: fullName, phone, email }).eq('id', id);
  if (error) back(id, 'err', 'Couldn’t save those changes.');

  await audit(adminId, 'edit_account', id, { email_changed: email !== target.email.toLowerCase() });
  revalidatePath('/admin', 'layout');
  back(id, 'ok', 'Saved.');
}

/* ----------------------------------------------------------- suspend / restore */

export async function setAccountStatusAction(formData: FormData) {
  const adminId = await requireAdmin();
  const id = formData.get('id')?.toString() ?? '';
  const next = formData.get('status')?.toString();
  const target = await loadTarget(id);
  if (target.role === 'admin') back(id, 'err', 'Admin accounts are managed in Supabase.');
  if (next !== 'active' && next !== 'suspended') back(id, 'err', 'Unknown status.');

  const svc = createServiceClient();
  // Suspending also blocks sign-in at the auth level, not just in the app.
  const { error: banErr } = await svc.auth.admin.updateUserById(id, {
    ban_duration: next === 'suspended' ? '876000h' : 'none',
  });
  if (banErr) back(id, 'err', 'Couldn’t change their sign-in access.');
  const { error } = await svc.from('users').update({ status: next }).eq('id', id);
  if (error) back(id, 'err', 'Couldn’t update their status.');

  await audit(adminId, next === 'suspended' ? 'suspend' : 'restore', id, {});
  revalidatePath('/admin', 'layout');
  back(id, 'ok', next === 'suspended' ? 'Suspended. They can’t sign in until you restore them.' : 'Restored.');
}

/* ----------------------------------------------------------- password */

export async function setPasswordAction(formData: FormData) {
  const adminId = await requireAdmin();
  const id = formData.get('id')?.toString() ?? '';
  const target = await loadTarget(id);
  if (target.role === 'admin') back(id, 'err', 'Admin passwords are managed in Supabase.');
  const password = formData.get('password')?.toString() ?? '';
  if (password.length < 8 || password.length > 72) back(id, 'err', 'Use 8 to 72 characters.');

  const svc = createServiceClient();
  const { error } = await svc.auth.admin.updateUserById(id, { password });
  if (error) back(id, 'err', 'Couldn’t set that password.');

  await audit(adminId, 'set_password', id, {});
  back(id, 'ok', 'New password set. Share it with them privately.');
}

/* ----------------------------------------------------------- membership */

export async function setMembershipAction(formData: FormData) {
  const adminId = await requireAdmin();
  const id = formData.get('id')?.toString() ?? '';
  const mode = formData.get('mode')?.toString();
  const reason = (formData.get('reason')?.toString() ?? '').trim().slice(0, 200) || null;
  const target = await loadTarget(id);
  if (target.role !== 'client' && target.role !== 'cna') back(id, 'err', 'Only families and caregivers have memberships.');

  const svc = createServiceClient();
  const { data: plan } = await svc
    .from('access_plans')
    .select('key')
    .eq('role', target.role)
    .eq('active', true)
    .order('sort')
    .limit(1)
    .maybeSingle();

  if (mode === 'comp') {
    const { error } = await svc.from('memberships').upsert(
      {
        user_id: id,
        role: target.role,
        status: 'comped',
        plan_key: plan?.key ?? null,
        comp_reason: reason ?? 'Comped by Kindred',
        current_period_end: null,
      },
      { onConflict: 'user_id' }
    );
    if (error) back(id, 'err', 'Couldn’t comp their membership.');
  } else if (mode === 'none') {
    const { data: m } = await svc.from('memberships').select('stripe_subscription_id').eq('user_id', id).maybeSingle();
    if (m?.stripe_subscription_id) back(id, 'err', 'They pay through Stripe. Cancel it in Stripe first.');
    const { error } = await svc.from('memberships').update({ status: 'none', comp_reason: null }).eq('user_id', id);
    if (error) back(id, 'err', 'Couldn’t end their membership.');
  } else {
    back(id, 'err', 'Unknown membership change.');
  }

  await audit(adminId, mode === 'comp' ? 'comp_membership' : 'end_membership', id, { reason });
  revalidatePath('/admin', 'layout');
  back(id, 'ok', mode === 'comp' ? 'Membership comped.' : 'Membership ended.');
}

/* ----------------------------------------------------------- delete */

async function removeStorageFolder(bucket: string, folder: string) {
  const svc = createServiceClient();
  const paths: string[] = [];
  const walk = async (prefix: string, depth: number) => {
    const { data } = await svc.storage.from(bucket).list(prefix, { limit: 1000 });
    for (const f of data ?? []) {
      const p = `${prefix}/${f.name}`;
      // Folders come back without an id.
      if (!f.id && depth < 3) await walk(p, depth + 1);
      else paths.push(p);
    }
  };
  await walk(folder, 0);
  for (let i = 0; i < paths.length; i += 100) {
    await svc.storage.from(bucket).remove(paths.slice(i, i + 100));
  }
  return paths.length;
}

export async function deleteAccountAction(formData: FormData) {
  const adminId = await requireAdmin();
  const id = formData.get('id')?.toString() ?? '';
  const confirm = (formData.get('confirm')?.toString() ?? '').trim();
  const target = await loadTarget(id);
  if (id === adminId) back(id, 'err', 'You can’t delete your own account.');
  if (target.role === 'admin') back(id, 'err', 'Admin accounts can’t be deleted from the dashboard.');
  if (confirm !== 'DELETE') back(id, 'err', 'Type DELETE in capitals to confirm.');

  const svc = createServiceClient();

  // Audit first, so the record survives the delete.
  await audit(adminId, 'delete_account', id, { email: target.email, role: target.role, name: target.full_name });

  const { error: prepErr } = await svc.rpc('admin_prepare_user_delete', { target: id });
  if (prepErr) back(id, 'err', 'Couldn’t clear their bookings and reviews, so nothing was deleted.');

  const files =
    (await removeStorageFolder('kindred-documents', id)) + (await removeStorageFolder('kindred-avatars', id));

  const { error } = await svc.auth.admin.deleteUser(id);
  if (error) back(id, 'err', 'Their files and bookings were cleared, but the account itself couldn’t be deleted.');

  revalidatePath('/admin', 'layout');
  const role = target.role === 'cna' ? 'cna' : target.role === 'client' ? 'client' : 'all';
  redirect(
    `/admin/people?role=${role}&ok=${encodeURIComponent(
      `Deleted ${target.full_name || target.email}${files ? ` and ${files} file${files === 1 ? '' : 's'}` : ''}.`
    )}`
  );
}

/* ----------------------------------------------------------- add */

export async function createAccountAction(formData: FormData) {
  const adminId = await requireAdmin();
  const role = formData.get('role')?.toString();
  const fullName = (formData.get('full_name')?.toString() ?? '').trim().slice(0, 120);
  const email = (formData.get('email')?.toString() ?? '').trim().toLowerCase();
  const password = formData.get('password')?.toString() ?? '';
  const phone = (formData.get('phone')?.toString() ?? '').trim().slice(0, 30) || null;

  const fail = (m: string): never => redirect(`/admin/people/new?role=${role ?? ''}&err=${encodeURIComponent(m)}`);
  if (role !== 'client' && role !== 'cna') fail('Pick family or caregiver.');
  if (!fullName) fail('Add their name.');
  if (!EMAIL.test(email)) fail('That email doesn’t look right.');
  if (password.length < 8 || password.length > 72) fail('Password needs 8 to 72 characters.');

  const svc = createServiceClient();
  const { data: created, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error || !created.user) fail('Couldn’t create that account (the email may already be in use).');
  const id = created.user!.id;

  // handle_new_user created the users row; add phone and, for caregivers,
  // a profile so they show up in the applications pipeline.
  await svc.from('users').update({ phone, full_name: fullName }).eq('id', id);
  if (role === 'cna') {
    const [first, ...rest] = fullName.split(' ');
    await svc.from('cna_profiles').insert({
      user_id: id,
      display_name: first || fullName,
      last_name: rest.join(' ') || null,
      application_status: 'submitted',
      application_submitted_at: new Date().toISOString(),
    });
  }

  await audit(adminId, 'create_account', id, { role, email });
  revalidatePath('/admin', 'layout');
  redirect(`/admin/people/${id}?ok=${encodeURIComponent('Account created. They can sign in with that email and password.')}`);
}
