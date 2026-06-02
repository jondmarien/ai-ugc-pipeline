import { Audio, staticFile } from "remotion";

export type AudioConfig = {
  voice_mode?: string;
  voice_file?: string;
  voice_gain_db?: number;
  music_mode?: string;
  music_file?: string;
  music_gain_db?: number;
};

const dbToLinear = (db: number) => Math.pow(10, db / 20);

// Plays narration (full volume) over a ducked music bed. Only emits <Audio> for
// files that are actually present — render-reel.ts strips refs whose files are
// missing (and flips the mode to "none"), so by the time we get here, a set
// file path is safe to load via staticFile().
export function AudioBed({ audio }: { audio?: AudioConfig }) {
  if (!audio) return null;
  const voice =
    audio.voice_mode && audio.voice_mode !== "none" && audio.voice_file ? audio.voice_file : null;
  const music =
    audio.music_mode && audio.music_mode !== "none" && audio.music_file ? audio.music_file : null;

  return (
    <>
      {music && <Audio src={staticFile(music.replace(/^\//, ""))} volume={dbToLinear(audio.music_gain_db ?? -18)} />}
      {voice && <Audio src={staticFile(voice.replace(/^\//, ""))} volume={dbToLinear(audio.voice_gain_db ?? 0)} />}
    </>
  );
}
