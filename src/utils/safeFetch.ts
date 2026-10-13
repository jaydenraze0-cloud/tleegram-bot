/**
 * Resilient JSON fetch utility that safely guards against:
 * 1. Plain text responses (e.g. "Service Unavailable", "Rate exceeded.", 502/503 HTML)
 * 2. Network disconnections or cold starts (TypeError: Failed to fetch)
 * 3. Malformed JSON payloads
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await res.text();
      const cleanText = text.trim();
      return {
        ok: false,
        status: res.status,
        error: cleanText.length > 200 ? cleanText.slice(0, 200) + '...' : cleanText || `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
      error: res.ok ? undefined : (data as any)?.error || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network connection unavailable',
    };
  }
}
