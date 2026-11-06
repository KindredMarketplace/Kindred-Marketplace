'use client';

/**
 * MarkThreadReadOnMount — fires markThreadReadAction once when the page loads.
 *
 * Server-rendered thread pages can't run "useEffect" themselves. This tiny
 * client component sits inside the page and triggers the read marker on
 * mount. Safe to re-fire on re-renders (the action is idempotent — only
 * messages with read_at = NULL get updated).
 */

import { useEffect } from 'react';
import { markThreadReadAction } from '@/app/messages/actions';

export function MarkThreadReadOnMount({ threadId }: { threadId: string }) {
  useEffect(() => {
    const fd = new FormData();
    fd.set('thread_id', threadId);
    void markThreadReadAction(fd);
  }, [threadId]);
  return null;
}
