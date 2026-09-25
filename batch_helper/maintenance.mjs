/** One idempotent expiry attempt per existing scheduled run; never an extra loop. */
export async function expireInventoryReservations({ enabled, client, clock = () => Date.now() }) {
  if (!enabled) return { enabled: false, status: 'UNKNOWN', reason: 'DISABLED', releasedReservations: null, checkedAt: null, durationMs: null };
  const started = clock();
  try {
    const { data, error } = await client.rpc('expire_inventory_reservations', {});
    if (error || !Number.isSafeInteger(data) || data < 0) throw new Error('EXPIRY_NOT_CONFIRMED');
    return { enabled: true, status: 'PASS', reason: null, releasedReservations: data, checkedAt: new Date(clock()).toISOString(), durationMs: Math.max(0, clock() - started) };
  } catch {
    // A timeout may occur after a database commit. Unknown is never reported as
    // zero released holds; the next scheduled invocation may retry safely.
    return { enabled: true, status: 'UNKNOWN', reason: 'EXPIRY_NOT_CONFIRMED', releasedReservations: null, checkedAt: new Date(clock()).toISOString(), durationMs: Math.max(0, clock() - started) };
  }
}
