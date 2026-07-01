export type FalModelEntry = {
  id: string;
  name: string;
  type: "image" | "video";
  apiModelId: string;
  defaultSize?: [number, number];
  defaultDuration?: number;
  aspectRatio?: string;
  resolution?: string;
};

export const MODEL_CATALOG: { image: FalModelEntry[]; video: FalModelEntry[] };
export const DEFAULT_IMAGE_MODEL: string;
export const DEFAULT_VIDEO_MODEL: string;

export function buildNegativePrompt(): string;
export function promptHash(
  prompt: string,
  model: string,
  width: number,
  height: number,
  seed?: number | string,
  cacheBreaker?: string,
): string;
export function healthCheck(): Promise<any>;
export function estimateCost(modelId: string, width: number, height: number): number;
export function generateImage(opts: any): Promise<any>;
export function resolveSegmentImageUrl(slide: any, opts?: { publicBaseUrl?: string }): string;
export function motionPromptForBeat(beat: any, slide: any): string;
export function generateVideoFromImage(opts: any): Promise<any>;
export function renderSlide(opts: any): Promise<any>;

declare const _default: any;
export default _default;
