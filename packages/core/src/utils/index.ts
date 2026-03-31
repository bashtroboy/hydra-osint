/**
 * Splits an array into chunks of the specified size.
 *
 * @param array - The array to split
 * @param size - Maximum number of elements per chunk (must be >= 1)
 * @returns An array of chunks
 *
 * @example
 * ```ts
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * ```
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (size < 1) {
    throw new RangeError('Chunk size must be at least 1');
  }

  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Returns a promise that resolves after the given number of milliseconds.
 * Useful for rate-limiting or backoff delays.
 *
 * @param ms - Milliseconds to sleep
 * @returns A promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Options for the {@link retry} function. */
export interface RetryOptions {
  /** Maximum number of attempts (including the initial call). Defaults to 3. */
  maxAttempts?: number;
  /** Base delay in milliseconds before the first retry. Defaults to 1000. */
  baseDelayMs?: number;
  /** Multiplier applied to the delay after each failed attempt. Defaults to 2. */
  backoffMultiplier?: number;
  /**
   * Optional predicate that receives the error and attempt number.
   * Return `false` to abort retries early.
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Retries an async operation with exponential backoff.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The resolved value of `fn`
 * @throws The last error encountered if all attempts fail
 *
 * @example
 * ```ts
 * const data = await retry(() => fetchExternalApi(), {
 *   maxAttempts: 5,
 *   baseDelayMs: 500,
 * });
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      if (shouldRetry !== undefined && !shouldRetry(error, attempt)) {
        break;
      }

      const delay = baseDelayMs * backoffMultiplier ** (attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError;
}
