/** Represents a successful result containing a value of type T. */
interface OkResult<T> {
  readonly ok: true;
  readonly value: T;
}

/** Represents a failed result containing an error of type E. */
interface ErrResult<E> {
  readonly ok: false;
  readonly error: E;
}

/**
 * A discriminated union representing either a success ({@link OkResult})
 * or a failure ({@link ErrResult}). Use instead of throwing for operations
 * that can fail expectedly.
 */
export type Result<T, E = Error> = OkResult<T> | ErrResult<E>;

/**
 * Creates a successful {@link Result} wrapping the given value.
 *
 * @param value - The success value
 * @returns A Result with `ok: true`
 *
 * @example
 * ```ts
 * const result = Ok(42);
 * // result.ok === true, result.value === 42
 * ```
 */
export function Ok<T>(value: T): OkResult<T> {
  return { ok: true, value };
}

/**
 * Creates a failed {@link Result} wrapping the given error.
 *
 * @param error - The error value
 * @returns A Result with `ok: false`
 *
 * @example
 * ```ts
 * const result = Err(new Error('something went wrong'));
 * // result.ok === false, result.error instanceof Error
 * ```
 */
export function Err<E>(error: E): ErrResult<E> {
  return { ok: false, error };
}

/**
 * Type guard that narrows a {@link Result} to the success variant.
 *
 * @param result - The result to check
 * @returns `true` if the result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is OkResult<T> {
  return result.ok;
}

/**
 * Type guard that narrows a {@link Result} to the failure variant.
 *
 * @param result - The result to check
 * @returns `true` if the result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is ErrResult<E> {
  return !result.ok;
}
