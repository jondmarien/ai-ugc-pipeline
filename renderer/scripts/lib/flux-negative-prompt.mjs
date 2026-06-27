// Shared negative prompt for FLUX / Comfy / Higgsfield background generation.
//
// Positive slide prompts must NOT say "no text" — suppression lives here only.
// art-comfyui graph node + higgsfield-client.buildNegativePrompt both import this module.
export const FLUX_NEGATIVE_PROMPT =
  "text, words, letters, numbers, typography, captions, subtitles, labels, signage, logo, watermark, " +
  "garbled text, random characters, fake words, gibberish, fake writing, handwriting, paragraph of text, " +
  "document, spreadsheet, calendar grid, source code, terminal window, user interface, dashboard, " +
  "control panel, charts, graphs, diagrams, icons";

/** @returns {string} Same contract as legacy art-comfyui / higgsfield-client. */
export function buildNegativePrompt() {
  return FLUX_NEGATIVE_PROMPT;
}