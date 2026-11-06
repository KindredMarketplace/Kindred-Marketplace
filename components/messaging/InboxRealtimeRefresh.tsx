'use client';

/**
 * InboxRealtimeRefresh — subscribes to Supabase Realtime for any changes to
 * the user's message_threads. Used on inbox pages and on any layout that
 * shows an unread badge (top nav).
 *
 * We subscribe to UPDATEs on message_threads filtered to threads the user
 * participates in — but Postgres Realtime filter syntax doesn't support OR
 * across two columns natively (participant_a=eq.X OR participant_b=eq.X).
 * Workaround: open TWO subscriptions, one for each side.
 *
 * The component renders nothing — pure side effect.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function InboxRealtimeRefresh({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Two channels — one for each side of the participant pair. Realtime
    // RLS will still gate which rows actually broadcast to this client.
    const channelA = supabase
      .channel(`inbox:a:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_threads',
          filter: `participant_a=eq.${currentUserId}`,
        },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_threads',
          filter: `participant_a=eq.${currentUserId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    const channelB = supabase
      .channel(`inbox:b:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_threads',
          filter: `participant_b=eq.${currentUserId}`,
        },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_threads',
          filter: `participant_b=eq.${currentUserId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channelA);
      void supabase.removeChannel(channelB);
    };
  }, [currentUserId, router]);

  return null;
}
