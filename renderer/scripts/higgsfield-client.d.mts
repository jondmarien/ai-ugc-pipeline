export const MODEL_CATALOG: { image: any[]; video: any[] };
export const DEFAULT_IMAGE_MODEL: string;
export const DEFAULT_VIDEO_MODEL: string;

export function hasRestCreds(): boolean;
export function resolveMode(explicit?: string): "cli" | "rest" | "mcp";
export function buildNegativePrompt(): string;
export function promptHash(
  prompt: string,
  model: string,
  width: number,
  height: number,
  seed?: number | string,
  cacheBreaker?: string,
): string;
export function healthCheck(mode?: string): Promise<any>;
export function cliAspectRatio(width: number, height: number): string;
export function resolveCliBin(): { bin: string; shell: boolean };
export function buildCliCreateArgs(opts: {
  jobSetType: string;
  prompt: string;
  aspectRatio?: string;
  extraArgs?: string[];
  waitTimeout?: string;
}): string[];
export function parseCliCreateJson(text: string): any;
export function cliHealthCheck(): Promise<any>;
export function resolveSegmentImageUrl(slide: any, opts?: { publicBaseUrl?: string }): string;
export function motionPromptForBeat(beat: any, slide: any): string;
export function generateVideoFromImage(opts: any): Promise<any>;
export function imageModelCost(model: string): number;
export function imageModelFamily(model: string): string;
export function videoModelCost(model: string): number;
export function estimateCost(model: string, width?: number, height?: number): Promise<number>;
export function generateImage(opts: any): Promise<any>;
export function renderSlide(opts: any): Promise<any>;

declare const _default: any;
export default _default;
