const waitMilliseconds = 72 * 60 * 60 * 1000;
const startsAt = Date.parse('2026-11-27T08:44:40Z');

// Age is computed from the current pending revision, never from upload time.
export function reviewDeadline(currentState, awaitingState, lastChangedAt, now = Date.now()) {
  const submittedAt = Date.parse(lastChangedAt);
  if (!['draft', 'review'].includes(awaitingState) || currentState !== awaitingState ||
      !Number.isFinite(submittedAt) || !Number.isFinite(now) || submittedAt > now) return null;
  return Math.max(submittedAt, startsAt) + waitMilliseconds;
}

export function reviewIsDue(currentState, awaitingState, lastChangedAt, now = Date.now()) {
  const deadline = reviewDeadline(currentState, awaitingState, lastChangedAt, now);
  return deadline !== null && now >= deadline;
}
