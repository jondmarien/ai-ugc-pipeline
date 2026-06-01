import { useEffect, useState } from "react";
import { allPosts, getPost } from "./lib/posts";
import { CarouselSlideByIndex, CarouselDeck } from "./components/carousel/CarouselDeck";

// Preview/export router via query params (no react-router needed):
//   ?post=<id|slug|prefix>&slide=<1-based>   → single exact-size slide (export target)
//   ?post=<id>&mode=deck                     → stacked human preview
//   (none)                                   → index of available posts
function useQuery() {
  const [q] = useState(() => new URLSearchParams(window.location.search));
  return q;
}

export function App() {
  const q = useQuery();
  const postKey = q.get("post");
  const slideParam = q.get("slide");
  const mode = q.get("mode");

  // Signal readiness to the export harness once fonts + any bg image are loaded.
  useEffect(() => {
    let done = false;
    const markReady = () => {
      if (done) return;
      done = true;
      document.documentElement.setAttribute("data-render-ready", "1");
    };
    const fontsReady = (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
    Promise.resolve(fontsReady)
      .then(() => {
        const imgs = Array.from(document.images);
        return Promise.all(
          imgs.map((img) =>
            img.complete ? Promise.resolve() : new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); }),
          ),
        );
      })
      .then(markReady)
      .catch(markReady);
  }, [postKey, slideParam, mode]);

  if (!postKey) {
    const posts = allPosts();
    return (
      <div style={{ color: "#f8fafc", fontFamily: "Inter, sans-serif", padding: 40 }}>
        <h1>AI-UGC Renderer — preview</h1>
        <p style={{ color: "#94a3b8" }}>Append <code>?post=&lt;slug&gt;&amp;slide=1</code> for a single exact-size slide, or <code>?post=&lt;slug&gt;&amp;mode=deck</code> for the full deck.</p>
        <ul>
          {posts.map((p) => (
            <li key={p.post_id}>
              <code>{p.slug}</code> — {p.slides.length} slides — {p.pillar}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const post = getPost(postKey);
  if (!post) return <div style={{ color: "#fff", padding: 40 }}>Post not found: {postKey}</div>;

  if (mode === "deck") return <CarouselDeck post={post} />;

  const index = Math.max(0, (slideParam ? parseInt(slideParam, 10) : 1) - 1);
  return (
    <div className="export-stage">
      <CarouselSlideByIndex post={post} index={index} />
    </div>
  );
}
