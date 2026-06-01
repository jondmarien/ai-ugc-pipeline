import type { TPostData } from "@/lib/schema";
import { SLIDE_COMPONENTS } from "./slides";

// Renders a single slide by index (used by the export harness, one slide per screenshot).
export function CarouselSlideByIndex({ post, index }: { post: TPostData; index: number }) {
  const slide = post.slides[index];
  if (!slide) return <div style={{ color: "#fff" }}>No slide at index {index}</div>;
  const Comp = SLIDE_COMPONENTS[slide.role];
  return <Comp post={post} slide={slide} />;
}

// Renders the whole deck stacked (used for human preview in the browser).
export function CarouselDeck({ post }: { post: TPostData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48, alignItems: "center", padding: 48 }}>
      {post.slides.map((slide, i) => {
        const Comp = SLIDE_COMPONENTS[slide.role];
        return (
          <div key={slide.slide} style={{ transform: "scale(0.5)", transformOrigin: "top center", marginBottom: -post.canvas.height * 0.5 + 48 }}>
            <Comp post={post} slide={slide} />
          </div>
        );
      })}
    </div>
  );
}
