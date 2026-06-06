import { Composition } from "remotion";
import { ReelComposition } from "./ReelComposition";
import postJson from "../content/posts/2026-06-05_hexstrike-ai-redteam.json";

// The reel reuses the SAME post JSON as the carousel — one source of truth.
// defaultProps loads Post 1 so Remotion Studio has something to preview, but the
// CLI render passes --props=<post> (see scripts/render-reel.ts), and
// calculateMetadata derives duration/fps/size from whichever post is passed.
const defaultPost = postJson as unknown as Record<string, unknown>;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="reel"
      component={ReelComposition as React.FC}
      // Fallback dims; calculateMetadata overrides per-post.
      durationInFrames={780}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ post: defaultPost }}
      calculateMetadata={({ props }) => {
        const post = (props as { post?: { video?: { duration_seconds?: number; fps?: number } } }).post;
        const video = post?.video ?? {};
        const fps = video.fps ?? 30;
        const duration = video.duration_seconds ?? 26;
        return {
          durationInFrames: Math.max(1, Math.round(duration * fps)),
          fps,
          width: 1080,
          height: 1920,
        };
      }}
    />
  );
};
