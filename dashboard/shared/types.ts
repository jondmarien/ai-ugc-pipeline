export type ApiEnvelope<T> = {
  data: T | null;
  error: string | null;
  /** epoch ms when the underlying upstream data was fetched; null = live/local read */
  fetchedAt: number | null;
};

export type ModuleKey =
  | "overview" | "hooks" | "analytics" | "competitors"
  | "scheduler" | "calendar" | "trending";
