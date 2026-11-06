'use client';

/**
 * ThreadLiveChannel — manages the per-thread realtime channel for **broadcast
 * events** (typing) and **presence** (is the other person in this thread
 * right now?).
 *
 * Separate from ThreadRealtimeRefresh which handles postgres_changes events.
 * Two channels on the same thread, with different responsibilities:
 *   - thread:{id}             → postgres_changes (data sync)  → triggers refresh
 *   - thread:{id}:live        → broadcast + presence (UX)     → React state only
 *
 * The hook returns:
 *   - otherIsTyping: boolean — other party is currently typing
 *   - otherIsHere: boolean — other party has this thread open right now
 *   - sendTyping() — call from composer onChange; debounced to fire at most
 *     once every 2 seconds, and auto-stops after 3 seconds of idle.
 *
 * Provides this via a small Context so the composer and typing-indicator
 * components don't have to pass props around.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ThreadLiveValue = {
  otherIsTyping: boolean;
  otherIsHere: boolean;
  sendTyping: () => void;
};

const ThreadLiveContext = createContext<ThreadLiveValue | null>(null);

export function useThreadLive(): ThreadLiveValue {
  const v = useContext(ThreadLiveContext);
  // Outside a provider this is a no-op so components don't crash if mounted
  // standalone (e.g. in tests).
  return v ?? { otherIsTyping: false, otherIsHere: false, sendTyping: () => {} };
}

export function ThreadLiveProvider({
  threadId,
  currentUserId,
  otherUserId,
  children,
}: {
  threadId: string;
  currentUserId: string;
  otherUserId: string;
  children: ReactNode;
}) {
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [otherIsHere, setOtherIsHere] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  // The most recent timeout that flips otherIsTyping back to false after no
  // typing events come in for N seconds.
  const typingClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounce: don't fire more than one typing broadcast per 2s.
  const lastTypingSendRef = useRef<number>(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`thread:${threadId}:live`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const fromUserId = (payload as { user_id?: string } | null)?.user_id;
        if (!fromUserId || fromUserId === currentUserId) return;
        setOtherIsTyping(true);

        if (typingClearTimeoutRef.current) clearTimeout(typingClearTimeoutRef.current);
        typingClearTimeoutRef.current = setTimeout(() => setOtherIsTyping(false), 3500);
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        const fromUserId = (payload as { user_id?: string } | null)?.user_id;
        if (!fromUserId || fromUserId === currentUserId) return;
        setOtherIsTyping(false);
        if (typingClearTimeoutRef.current) {
          clearTimeout(typingClearTimeoutRef.current);
          typingClearTimeoutRef.current = null;
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // state is keyed by the presence key. We tracked under currentUserId,
        // so the OTHER side will appear under otherUserId. Just check if the
        // other user has any active presence row.
        const others = state[otherUserId];
        setOtherIsHere(Array.isArray(others) && others.length > 0);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === otherUserId) setOtherIsHere(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingClearTimeoutRef.current) clearTimeout(typingClearTimeoutRef.current);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [threadId, currentUserId, otherUserId]);

  function sendTyping() {
    const now = Date.now();
    if (now - lastTypingSendRef.current < 2000) return;
    lastTypingSendRef.current = now;
    void channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId },
    });
  }

  return (
    <ThreadLiveContext.Provider value={{ otherIsTyping, otherIsHere, sendTyping }}>
      {children}
    </ThreadLiveContext.Provider>
  );
}
