export type PromptSpecCtx = {
  accentHex?: string;
  accentName?: string;
  topic?: string;
  mood?: string;
  styleFusion?: string;
};

export function buildPromptSpec(slide: any, ctx: PromptSpecCtx): any;
export function composeFluxPrompt(spec: any): string;
export const PROMPT_FAMILIES: readonly ["flux", "soul", "seedream", "gpt", "natural"];
export function composePromptForFamily(spec: any, family: string): { prompt: string; negative: string };
export function buildSlidePrompt(slide: any, ctx: PromptSpecCtx): string;
export function postThemeContext(post: any): any;
export function postSeedOffset(s: any): number;
