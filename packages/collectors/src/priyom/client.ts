import type { Logger } from 'pino';
import { createLogger } from '@hydra/core';
import { fetchWithRetry } from '../shared/http.js';
import { TokenBucketRateLimiter } from '../shared/rate-limit.js';
import type { PriyomCollectorConfig } from './config.js';
import type { PriyomStation, PriyomScheduleEntry } from './types.js';

/**
 * Client for retrieving numbers station data from Priyom.org.
 *
 * Since Priyom does not expose a formal REST API, this client provides:
 * - A hardcoded catalogue of well-known active numbers stations
 * - A schedule fetcher with fallback to structured JSON parsing
 *
 * @example
 * ```ts
 * const client = new PriyomClient(config);
 * const stations = client.getKnownStations();
 * ```
 */
export class PriyomClient {
  private readonly logger: Logger;
  private readonly config: PriyomCollectorConfig;
  private readonly rateLimiter: TokenBucketRateLimiter;

  /**
   * @param config - Priyom collector configuration
   */
  constructor(config: PriyomCollectorConfig) {
    this.logger = createLogger({ name: 'priyom-client' });
    this.config = config;
    // Conservative rate limit: 5 requests per minute to be polite
    this.rateLimiter = new TokenBucketRateLimiter(5, 60_000);
  }

  /**
   * Fetch the schedule page from Priyom and attempt to extract schedule entries.
   *
   * Because Priyom does not have a formal API, this method fetches the schedule
   * page and returns whatever structured data can be extracted. For reliable
   * ingestion, prefer {@link parseScheduleData} with pre-formatted JSON.
   *
   * @returns Array of parsed schedule entries (may be empty if parsing fails)
   * @throws {ExternalServiceError} When the HTTP request fails after retries
   */
  async fetchSchedule(): Promise<PriyomScheduleEntry[]> {
    await this.rateLimiter.waitForToken();

    this.logger.info(
      { url: this.config.scheduleUrl },
      'Fetching Priyom schedule page',
    );

    const html = await fetchWithRetry<string>(this.config.scheduleUrl, {
      timeoutMs: 30_000,
      maxAttempts: 3,
      headers: {
        'Accept': 'text/html,application/json',
        'User-Agent': 'HYDRA-OSINT/1.0 (research)',
      },
    });

    // The response is HTML which we cannot reliably parse without a DOM parser.
    // Log a warning and return empty — callers should use parseScheduleData()
    // with pre-formatted data for production use.
    if (typeof html === 'string') {
      this.logger.warn(
        'Schedule page returned HTML; use parseScheduleData() with structured data instead',
      );
      return [];
    }

    // If the endpoint ever returns JSON, try to parse it
    if (Array.isArray(html)) {
      return this.parseScheduleData(html);
    }

    return [];
  }

  /**
   * Parse pre-formatted schedule data into typed schedule entries.
   *
   * Use this method when ingesting data from a curated JSON source or
   * a pre-processed export of the Priyom schedule page.
   *
   * @param data - Array of objects with schedule entry fields
   * @returns Array of validated PriyomScheduleEntry records
   *
   * @example
   * ```ts
   * const entries = client.parseScheduleData([
   *   { stationName: 'E06', designator: 'E06', frequency: 6840, time: '21:00' },
   * ]);
   * ```
   */
  parseScheduleData(data: unknown[]): PriyomScheduleEntry[] {
    const entries: PriyomScheduleEntry[] = [];

    for (const item of data) {
      try {
        if (!isScheduleEntryLike(item)) {
          this.logger.warn({ item }, 'Skipping invalid schedule entry');
          continue;
        }

        entries.push({
          stationName: String(item.stationName),
          designator: String(item.designator),
          frequency: Number(item.frequency),
          time: String(item.time),
          dayOfWeek: item.dayOfWeek ? String(item.dayOfWeek) : undefined,
          notes: item.notes ? String(item.notes) : undefined,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn({ error: message }, 'Failed to parse schedule entry');
      }
    }

    this.logger.info({ count: entries.length }, 'Parsed schedule entries');
    return entries;
  }

  /**
   * Return a hardcoded catalogue of well-known active numbers stations.
   *
   * This list is based on publicly available information from Priyom.org,
   * ENIGMA 2000, and the broader signals monitoring community.
   *
   * @returns Array of known PriyomStation records
   */
  getKnownStations(): PriyomStation[] {
    return KNOWN_STATIONS;
  }
}

/** Type guard for objects that resemble a schedule entry. */
function isScheduleEntryLike(
  value: unknown,
): value is Record<string, unknown> & {
  stationName: unknown;
  designator: unknown;
  frequency: unknown;
  time: unknown;
  dayOfWeek?: unknown;
  notes?: unknown;
} {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    'stationName' in obj &&
    'designator' in obj &&
    'frequency' in obj &&
    'time' in obj &&
    typeof obj['stationName'] === 'string' &&
    typeof obj['designator'] === 'string' &&
    typeof obj['time'] === 'string' &&
    (typeof obj['frequency'] === 'number' || typeof obj['frequency'] === 'string')
  );
}

/**
 * Hardcoded catalogue of well-known numbers stations compiled from
 * Priyom.org and ENIGMA 2000 public data.
 */
const KNOWN_STATIONS: PriyomStation[] = [
  {
    name: 'English Man',
    designator: 'E06',
    country: 'Poland',
    language: 'English',
    frequencies: [4780, 5340, 6840, 7540, 8090],
    description:
      'Polish intelligence numbers station using a male synthetic voice reading 5-figure groups.',
    status: 'active',
  },
  {
    name: 'English Lady',
    designator: 'E07',
    country: 'Russia',
    language: 'English',
    frequencies: [4930, 5473, 7380],
    description:
      'Russian intelligence station using a female voice reading 5-figure groups in English.',
    status: 'active',
  },
  {
    name: 'Czech Lady / Slavic Man',
    designator: 'S06',
    country: 'Poland',
    language: 'Czech/Slovak',
    frequencies: [3840, 4030, 4780, 5340, 6840],
    description:
      'Polish intelligence numbers station transmitting in Czech/Slovak with alternating male and female voices.',
    status: 'active',
  },
  {
    name: 'The Buzzer (UVB-76)',
    designator: 'V07',
    country: 'Russia',
    language: 'Russian',
    frequencies: [4625],
    description:
      'Russian military channel marker broadcasting a continuous buzzing tone with occasional voice messages.',
    status: 'active',
  },
  {
    name: 'Morse Station',
    designator: 'M12',
    country: 'Russia',
    language: 'Morse',
    frequencies: [4168, 5154, 7039, 8145],
    description:
      'Russian military Morse code station transmitting 5-figure groups.',
    status: 'active',
  },
  {
    name: 'German Lady',
    designator: 'G06',
    country: 'Poland',
    language: 'German',
    frequencies: [3840, 4030, 5340, 6840],
    description:
      'Polish intelligence numbers station using a female synthetic voice reading 5-figure groups in German.',
    status: 'active',
  },
  {
    name: 'Oblique',
    designator: 'E11',
    country: 'Poland',
    language: 'English',
    frequencies: [4780, 5340, 6840],
    description:
      'Polish intelligence numbers station using a female synthetic voice, sister station to E06.',
    status: 'active',
  },
  {
    name: 'The Pip',
    designator: 'S28',
    country: 'Russia',
    language: 'Russian',
    frequencies: [3756],
    description:
      'Russian military channel marker similar to The Buzzer, broadcasting short pips.',
    status: 'active',
  },
  {
    name: 'The Squeaky Wheel',
    designator: 'S32',
    country: 'Russia',
    language: 'Russian',
    frequencies: [3828],
    description:
      'Russian military channel marker broadcasting a squeaky wheel sound with occasional voice messages.',
    status: 'active',
  },
  {
    name: 'HM01 (Atenci\u00f3n)',
    designator: 'HM01',
    country: 'Cuba',
    language: 'Spanish',
    frequencies: [5855, 9330, 11435],
    description:
      'Cuban intelligence numbers station operated by the Direcci\u00f3n de Inteligencia, reading 5-figure groups in Spanish.',
    status: 'active',
  },
];
