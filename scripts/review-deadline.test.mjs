import { describe, expect, it } from 'vitest';
import { reviewDeadline, reviewIsDue } from './review-deadline.mjs';

describe('unanswered business review window', () => {
  it('waits 72 hours, and starts the clock again for changed revisions', () => {
    const submitted = '2026-11-28T04:00:00Z';
    const due = Date.parse('2026-12-01T04:00:00Z');
    expect(reviewIsDue('review', 'review', submitted, due - 1)).toBe(false);
    expect(reviewIsDue('review', 'review', submitted, due)).toBe(true);
    expect(reviewIsDue('review', 'review', '2026-11-29T04:00:00Z', due)).toBe(false);
  });

  it('gives existing pending reviews the same window from the activation date', () => {
    const due = Date.parse('2026-11-30T08:44:40Z');
    expect(reviewDeadline('draft', 'draft', '2026-11-26T04:00:00Z', due)).toBe(due);
  });

  it('excludes resolved, invalid and future states or timestamps', () => {
    const now = Date.parse('2026-12-02T04:00:00Z');
    for (const state of ['rejected', 'approved', 'demo', 'published', 'hold']) {
      expect(reviewIsDue(state, 'draft', '2026-11-28T04:00:00Z', now)).toBe(false);
    }
    expect(reviewDeadline('review', 'review', '2026-12-02T04:00:01Z', now)).toBeNull();
    expect(reviewDeadline('draft', 'draft', undefined, now)).toBeNull();
  });
});
