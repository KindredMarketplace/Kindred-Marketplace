'use client';

/**
 * ThreadRealtimeRefresh — subscribes to Supabase Realtime for INSERT events
 * on `messages` filtered to a single thread. When the counterparty sends a
 * message, calls router.refresh() which re-runs the server component for
 * this thread page → new bubble appears without a full page reload.
 *
 * Why router.refresh() instead of patching client state?
 *   - The thread page is a server component — it already does the right
 *     query, the right RLS check, the right joins. Re-rendering it server-
 *     side is the simplest way to keep one source of truth.
 *   - Next.js patches the DOM via streaming, so the user sees the new
 *     message appear cleanly. Scroll position is preserved by default for
 *     most browsers; the composer's textarea state lives in a client
 *     component and persists across refresh().
 *   - No risk of getting out of sync between client cache and DB.
 *
 * The component renders nothing — it's a side-effect-only subscriber.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ThreadRealtimeRefresh({
  threadId,
  currentUserId,
}: {
  threadId: string;
  /**
   * The logged-in user's id. We use this to skip refreshing on events fired
   * by our OWN messages — sendMessageAction already does a revalidatePath()
   * which triggers the refresh, so subscribing would double-trigger.
   */
  currentUserId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          // Skip our own inserts — the server action already refreshed us.
          // payload.new contains the row that was inserted.
          const senderId = (payload.new as { sender_id?: string } | null)?.sender_id;
          if (senderId === currentUserId) return;
          router.refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_threads',
          filter: `id=eq.${threadId}`,
        },
        () => {
          // Thread metadata changed (status promoted from pending to accepted,
          // unread counts, etc). Refresh so banners/badges update.
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, currentUserId, router]);

  return null;
}
