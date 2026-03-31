/**
 * Converts a Date to a Unix timestamp in seconds.
 *
 * @param date - The Date to convert
 * @returns Unix timestamp in seconds
 */
export function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Creates a Date from a Unix timestamp in seconds.
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns A Date object
 */
export function fromUnixTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Checks whether a given date falls within a time window relative to a
 * reference point. Useful for checking data freshness.
 *
 * @param date - The date to check
 * @param windowMs - Size of the time window in milliseconds
 * @param reference - Reference point (defaults to now)
 * @returns `true` if `date` is within `windowMs` before the reference
 *
 * @example
 * ```ts
 * const fiveMinutesMs = 5 * 60 * 1000;
 * isWithinTimeWindow(someDate, fiveMinutesMs); // true if within last 5 min
 * ```
 */
export function isWithinTimeWindow(
  date: Date,
  windowMs: number,
  reference: Date = new Date(),
): boolean {
  const diff = reference.getTime() - date.getTime();
  return diff >= 0 && diff <= windowMs;
}

/** The start and end of a time window. */
export interface TimeWindowBounds {
  start: Date;
  end: Date;
}

/**
 * Calculates the start and end dates for a time window of the given
 * duration ending at the reference point.
 *
 * @param windowMs - Size of the time window in milliseconds
 * @param reference - End of the window (defaults to now)
 * @returns An object with `start` and `end` dates
 */
export function getTimeWindowBounds(
  windowMs: number,
  reference: Date = new Date(),
): TimeWindowBounds {
  return {
    start: new Date(reference.getTime() - windowMs),
    end: reference,
  };
}
