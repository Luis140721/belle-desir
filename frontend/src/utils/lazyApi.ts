import { buildApiUrl } from '../config/api.js';

interface LazyFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export function scheduleLazyTask(task: () => void, delayMs = 0): void {
  const run = () => window.setTimeout(task, delayMs);

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 1200 });
    return;
  }

  run();
}

export function warmBackend(): void {
  scheduleLazyTask(() => {
    void fetch(buildApiUrl('/health'), {
      method: 'GET',
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {
      // The visible loaders handle cold starts; this wake-up request is best effort.
    });
  }, 250);
}

export async function lazyFetch(input: string, options: LazyFetchOptions = {}): Promise<Response> {
  const {
    timeoutMs = 25000,
    retries = 2,
    retryDelayMs = 1800,
    ...fetchOptions
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (response.ok || attempt === retries) return response;
      lastError = new Error(`Error ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    } finally {
      window.clearTimeout(timeout);
    }

    await sleep(retryDelayMs * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error('No se pudo conectar con el servidor');
}

export async function lazyJson<T>(url: string, options?: LazyFetchOptions): Promise<T> {
  const response = await lazyFetch(url, options);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body?.message ?? `Error ${response.status}`);
  }

  return body as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
