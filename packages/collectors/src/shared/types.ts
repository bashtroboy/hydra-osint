/** Configuration shared by all HYDRA data collectors. */
export interface CollectorConfig {
  /** Whether this collector is enabled. */
  enabled: boolean;
  /** Polling interval in milliseconds. */
  pollInterval: number;
  /** Human-readable collector name used for logging. */
  name: string;
}

/** Result returned after a single collection run. */
export interface CollectorResult {
  /** Whether the collection completed without fatal errors. */
  success: boolean;
  /** Number of records successfully ingested. */
  recordsProcessed: number;
  /** Errors encountered during this run (non-fatal errors may still allow partial success). */
  errors: string[];
}
