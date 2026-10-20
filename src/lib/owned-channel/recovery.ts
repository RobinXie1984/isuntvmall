export type StreamPlayer = {
  paused: boolean;
  addEventListener: (name: string, listener: () => void) => void;
  removeEventListener: (name: string, listener: () => void) => void;
};
/** A bounded retry budget belongs to one video, not each iframe instance. */
export function attachRecovery(player: StreamPlayer, retry: () => void, budget: { remaining: number }, visible: () => boolean) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { if (timer) clearTimeout(timer); timer = undefined; };
  const failure = () => {
    if (timer || budget.remaining <= 0 || !visible()) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (visible() && budget.remaining > 0) { budget.remaining--; retry(); }
    }, 15_000);
  };
  const stalled = () => { if (!player.paused) failure(); };
  const listeners = { error: failure, stalled, waiting: stalled, playing: clear, pause: clear };
  for (const [name, listener] of Object.entries(listeners)) player.addEventListener(name, listener);
  return () => { clear(); for (const [name, listener] of Object.entries(listeners)) player.removeEventListener(name, listener); };
}
