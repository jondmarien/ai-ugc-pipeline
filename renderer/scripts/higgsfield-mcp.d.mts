export function planPath(prefix: string): string;
export function buildArtPlan(post: any, opts?: any): any;
export function writeArtPlan(prefix: string, plan: any): void;
export function readArtPlan(prefix: string): any;
export function ingestArtPlan(post: any, postPath: string, opts?: any): any;

declare const _default: {
  planPath: typeof planPath;
  buildArtPlan: typeof buildArtPlan;
  writeArtPlan: typeof writeArtPlan;
  readArtPlan: typeof readArtPlan;
  ingestArtPlan: typeof ingestArtPlan;
};
export default _default;
