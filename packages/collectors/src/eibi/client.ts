import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import { fetchTextWithRetry } from '../shared/http.js';
import { TokenBucketRateLimiter } from '../shared/rate-limit.js';
import type { EibiCollectorConfig } from './config.js';
import type { EibiBroadcast } from './types.js';

/**
 * Parse the EiBi CSV text into an array of {@link EibiBroadcast} records.
 *
 * The EiBi CSV has **no header row**. Fields are semicolon-delimited in this
 * order: `kHz;time(UTC);days;ITU;station;lang;target;remarks;P;start;end`
 *
 * The `time(UTC)` field contains start and end times separated by a hyphen
 * (e.g. `"0000-2400"`).
 *
 * @param csvText   - Raw CSV content
 * @param delimiter - Field delimiter (defaults to `;`)
 * @returns Array of parsed broadcast records
 *
 * @example
 * ```ts
 * const records = parseEibiCsv('6070;0000-2400;daily;D;CFRX;E;NAm;;1;;');
 * ```
 */
export function parseEibiCsv(csvText: string, delimiter: string = ';'): EibiBroadcast[] {
  const broadcasts: EibiBroadcast[] = [];
  const lines = csvText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const fields = trimmed.split(delimiter);

    // Need at least the first few fields to be useful
    if (fields.length < 6) {
      continue;
    }

    const frequencyRaw = fields[0]?.trim() ?? '';
    const frequency = parseFloat(frequencyRaw);
    if (Number.isNaN(frequency)) {
      continue;
    }

    // Time field is "HHMM-HHMM"
    const timeField = fields[1]?.trim() ?? '';
    const timeParts = timeField.split('-');
    const timeStart = timeParts[0]?.trim() ?? '';
    const timeEnd = timeParts[1]?.trim() ?? '';

    const days = fields[2]?.trim() ?? '';
    const station = fields[4]?.trim() ?? '';
    const language = fields[5]?.trim() ?? '';
    const targetArea = fields[6]?.trim() ?? '';
    const transmitterSite = fields[7]?.trim() ?? '';
    const persistence = fields[8]?.trim() ?? '';
    const startDate = fields[9]?.trim() ?? '';
    const endDate = fields[10]?.trim() ?? '';

    broadcasts.push({
      frequency,
      timeStart,
      timeEnd,
      days,
      station,
      language,
      targetArea,
      transmitterSite,
      persistence,
      startDate,
      endDate,
    });
  }

  return broadcasts;
}

/**
 * Client for downloading and parsing the EiBi shortwave broadcast
 * schedule CSV.
 *
 * @example
 * ```ts
 * const client = new EibiClient(config);
 * const schedule = await client.fetchSchedule();
 * ```
 */
export class EibiClient {
  private readonly logger: Logger;
  private readonly config: EibiCollectorConfig;
  private readonly rateLimiter: TokenBucketRateLimiter;

  /**
   * @param config - EiBi collector configuration
   */
  constructor(config: EibiCollectorConfig) {
    this.logger = createLogger({ name: 'eibi-client' });
    this.config = config;
    // Very conservative: the CSV is a static file updated infrequently
    this.rateLimiter = new TokenBucketRateLimiter(2, 60_000);
  }

  /**
   * Download the EiBi CSV schedule file and parse it into structured records.
   *
   * @returns Array of broadcast schedule entries
   * @throws {ExternalServiceError} When the download fails after retries
   */
  async fetchSchedule(): Promise<EibiBroadcast[]> {
    await this.rateLimiter.waitForToken();

    this.logger.debug({ url: this.config.csvUrl }, 'Downloading EiBi schedule CSV');

    const csvText = await fetchTextWithRetry(this.config.csvUrl, {
      timeoutMs: 60_000, // CSV can be large
      maxAttempts: 3,
    });

    this.logger.debug(
      { bytes: csvText.length },
      'Downloaded EiBi CSV, parsing',
    );

    const broadcasts = parseEibiCsv(csvText, this.config.delimiter);

    this.logger.info(
      { count: broadcasts.length },
      'Parsed EiBi broadcast schedule',
    );

    return broadcasts;
  }
}
