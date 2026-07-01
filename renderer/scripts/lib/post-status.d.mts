export const POSTS: string;
export const STATUSES: readonly ["draft", "approved", "generated", "upload_ready"];

export function listPosts(): string[];

export function readStatus(key: string): string | null;

export type SetStatusOpts = { onlyFrom?: string[] | null; dryRun?: boolean };
export type SetStatusResult = {
  key: string;
  old?: string | null;
  new?: string;
  changed: boolean;
  reason?: "missing" | "skipped" | "same" | "no-status-line";
};

export function setStatus(key: string, newStatus: string, opts?: SetStatusOpts): SetStatusResult;
