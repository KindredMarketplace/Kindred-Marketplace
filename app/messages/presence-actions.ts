'use server';

/**
 * Presence-related server actions.
 *
 * `pingPresenceAction` — fire-and-forget update to users.last_active_at.
 * Called every ~60 seconds by the layout-mounted PresencePinger client
 * component while the tab is visible. Drives the inbox green dot.
 */

import { createClient } from '@/lib/supabase/server';

export async function pingPresenceAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // No revalidate — this fires once a minute per active user. We don't want
  // every navigation to bust caches just because someone's tab is open.
  await supabase
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', user.id);
}
