// Bound both time and bytes before Supabase's download helper allocates a Blob.
export function responseLimit(input, init = {}) {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const method = String(init.method ?? input?.method ?? 'GET').toUpperCase();
  if (method === 'GET' && url.pathname.includes('/storage/v1/object/')) {
    if (url.pathname.split('/').includes('batch-originals')) return 24 * 1024 * 1024;
    if (url.pathname.split('/').some(part => ['batch-processed', 'product-images'].includes(part))) return 8 * 1024 * 1024;
  }
  return 1024 * 1024;
}
export function boundedFetch({ fetchImpl = globalThis.fetch, timeoutMs = 30_000, runSignal, maxBytes = responseLimit } = {}) {
  return async function fetchWithBounds(input, init = {}) {
    const controller = new AbortController();
    const signals = [controller.signal, runSignal, init.signal, input?.signal].filter(Boolean);
    const signal = AbortSignal.any(signals);
    const timer = setTimeout(() => controller.abort(new Error('REQUEST_DEADLINE')), timeoutMs);
    const abort = new Promise((_, reject) => {
      if (signal.aborted) reject(signal.reason ?? new Error('REQUEST_ABORTED'));
      else signal.addEventListener('abort', () => reject(signal.reason ?? new Error('REQUEST_ABORTED')), { once: true });
    });
    let reader;
    try {
      const response = await Promise.race([fetchImpl(input, { ...init, signal }), abort]);
      const cap = typeof maxBytes === 'function' ? maxBytes(input, init) : maxBytes;
      if (response.body) reader = response.body.getReader();
      const declared = response.headers.get('content-length');
      if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > cap)) throw new Error('RESPONSE_SIZE_LIMIT');
      if (!response.body) return response;
      const chunks = []; let size = 0;
      while (true) {
        const part = await Promise.race([reader.read(), abort]);
        if (part.done) break;
        size += part.value.byteLength;
        if (size > cap) throw new Error('RESPONSE_SIZE_LIMIT');
        chunks.push(part.value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const headers = new Headers(response.headers);
      headers.delete('content-encoding'); // Native fetch already decoded the stream.
      headers.set('content-length', String(size));
      return new Response(bytes, { status: response.status, statusText: response.statusText, headers });
    } catch (error) {
      controller.abort(error);
      // Cancellation is best-effort and never extends the request deadline.
      if (reader) void reader.cancel(error).catch(() => undefined);
      throw error;
    } finally { clearTimeout(timer); }
  };
}
