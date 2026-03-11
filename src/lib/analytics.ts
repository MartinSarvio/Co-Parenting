import { supabase } from './supabase';

type EventType =
  | 'page_view'
  | 'product_click'
  | 'link_redirect'
  | 'news_view'
  | 'forum_post'
  | 'forum_join';

interface TrackEventParams {
  eventType: EventType;
  targetId?: string;
  targetType?: 'product' | 'article' | 'forum_group' | 'offer' | 'flyer';
  page?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget event tracking. Never blocks UI.
 */
export function trackEvent({ eventType, targetId, targetType, page, metadata }: TrackEventParams): void {
  supabase
    .from('analytics_events')
    .insert({
      event_type: eventType,
      target_id: targetId ?? null,
      target_type: targetType ?? null,
      page: page ?? null,
      metadata: metadata ?? {},
    })
    .then(() => {}, () => {});
}
