import { ExternalServiceError } from '@hydra/core';

/** Options for {@link fetchWithRetry}. */
export interface FetchWithRetryOptions {
  /** Request timeout in milliseconds. Defaults to 30 000. */
  timeoutMs?: number;
  /** Maximum number of attempts (including the initial call). Defaults to 3. */
  maxAttempts?: number;
  /** Base delay in milliseconds before the first retry. Defaults to 1000. */
  baseDelayMs?: number;
  /** Optional HTTP headers to include with the request. */
  headers?: Record<string, string>;
}

/**
 * Fetch wrapper with timeout, exponential-backoff retry, and structured error handling.
 *
 * @param url     - The URL to fetch
 * @param options - Timeout, retry, and header options
 * @returns The parsed JSON response body
 * @throws {ExternalServiceError} When the request fails after all retries
 *
 * @example
 * ```ts
 * const data = await fetchWithRetry('https://opensky-network.org/api/states/all', {
 *   timeoutMs: 15_000,
 *   maxAttempts: 3,
 * });
 * ```
 */
export async function fetchWithRetry<T>(
  url: string,
  options: FetchWithRetryOptions = {},
): Promise<T> {
  const {
    timeoutMs = 30_000,
    maxAttempts = 3,
    baseDelayMs = 1_000,
    headers,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '<unreadable>');
        throw new ExternalServiceError(
          'HTTP',
          `${response.status} ${response.statusText}: ${body}`,
          { url, status: response.status },
        );
      }

      const data = (await response.json()) as T;
      return data;
    } catch (error: unknown) {
      lastError = error;

      // Do not retry on 4xx client errors (except 429)
      if (error instanceof ExternalServiceError) {
        const status = error.details?.['status'];
        if (typeof status === 'number' && status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }

      if (attempt < maxAttempts) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof ExternalServiceError
    ? lastError
    : new ExternalServiceError('HTTP', String(lastError), { url });
}
