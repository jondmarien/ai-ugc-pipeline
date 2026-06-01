import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import postJson from "../content/posts/2026-06-02_ai-phishing-training.json";

// The reel reuses the SAME post JSON as the carousel — one source of truth.
// VideoSpec drives duration/fps/beats; no separate content-writing process.
const post = postJson as unknown as Record<string, unknown>;
const video = (post.video ?? {}) as { duration_seconds?: number; fps?: number };
const fps = video.fps ?? 30;
const durationInFrames = Math.round((video.duration_seconds ?? 26) * fps);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="reel"
      component={ReelComposition as React.FC}
      durationInFrames={durationInFrames}
      fps={fps}
      width={1080}
      height={1920}
      defaultProps={{ post }}
    />
  );
};
