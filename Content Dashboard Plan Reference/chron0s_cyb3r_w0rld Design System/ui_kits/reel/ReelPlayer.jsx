// Reel player — recreates the Remotion reel composition as a live, scrubbable
// player. Slow push-in per beat (scale 1.04 → 1.12), burned-in lower-third
// captions in three modes (block / word / highlight), and an end card. Reads
// the brand palette from CSS custom properties. Exports window.ReelKit.
(function () {
  const { useState, useEffect, useRef, useCallback } = React;

  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

  function beatAt(beats, t) {
    for (let k = beats.length - 1; k >= 0; k--) if (t >= beats[k].start) return k;
    return 0;
  }

  // Active word index within a beat (relative seconds), from words[] or even spread.
  function activeWord(beat, localT) {
    if (beat.words && beat.words.length) {
      let idx = 0;
      for (let i = 0; i < beat.words.length; i++) if (beat.words[i][1] <= localT) idx = i;
      return idx;
    }
    const words = beat.caption.trim().split(/\s+/);
    const dur = beat.end - beat.start;
    return Math.min(words.length - 1, Math.max(0, Math.floor((localT / dur) * words.length)));
  }

  function Captions({ beat, localT, mode, S }) {
    const words = beat.words ? beat.words.map((w) => w[0]) : beat.caption.trim().split(/\s+/);
    const idx = activeWord(beat, localT);
    const base = {
      fontFamily: "var(--font-headline)", fontWeight: 800, lineHeight: 1.05, textAlign: "center",
      color: "var(--fg)", maxWidth: 900 * S, hyphens: "none"
    };
    const wrap = { position: "absolute", inset: 0, display: "flex", justifyContent: "flex-end", alignItems: "center", flexDirection: "column", padding: `0 ${96 * S}px ${230 * S}px` };

    if (mode === "word") {
      return (
        <div style={wrap}>
          <div style={{ ...base, fontSize: 116 * S, textShadow: `var(--shadow-caption), 0 0 ${56 * S}px color-mix(in srgb, var(--accent) 33%, transparent)` }}>{words[idx]}</div>
        </div>
      );
    }
    if (mode === "highlight") {
      return (
        <div style={wrap}>
          <div style={{ ...base, fontSize: 76 * S, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${18 * S}px` }}>
            {words.map((w, i) => {
              const on = i === idx;
              return <span key={i} style={{ color: on ? "var(--accent)" : "var(--fg)", opacity: on ? 1 : 0.42, textShadow: on ? `var(--shadow-caption), 0 0 ${40 * S}px color-mix(in srgb, var(--accent) 40%, transparent)` : "0 2px 24px rgba(0,0,0,0.7)" }}>{w}</span>;
            })}
          </div>
        </div>
      );
    }
    // block — rolling window of up to 3 words
    const start = Math.floor(idx / 3) * 3;
    return (
      <div style={wrap}>
        <div style={{ ...base, fontSize: 92 * S, textShadow: `var(--shadow-caption), 0 0 ${48 * S}px color-mix(in srgb, var(--accent) 20%, transparent)` }}>{words.slice(start, start + 3).join(" ")}</div>
      </div>
    );
  }

  function EndCard({ question, handle, S }) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: 96 * S, gap: 40 * S }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 30 * S, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)" }}>Your move</div>
        <div style={{ fontFamily: "var(--font-headline)", fontWeight: 800, fontSize: 84 * S, lineHeight: 1.05, color: "var(--fg)", maxWidth: 880 * S }}>{question}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 36 * S, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--bg-deep)", background: "var(--accent)", padding: `${18 * S}px ${34 * S}px`, borderRadius: 999, fontWeight: 700 }}>Comment + Save</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 28 * S, color: "var(--muted)", letterSpacing: "0.12em" }}>{handle}</div>
      </div>
    );
  }

  function ReelPlayer({ reel, scale }) {
    const S = scale;
    const W = 1080 * S, H = 1920 * S;
    const KEY = "reel:" + reel.id;
    const [t, setT] = useState(() => parseFloat(localStorage.getItem(KEY) || "0") || 0);
    const [playing, setPlaying] = useState(false);
    const [mode, setMode] = useState(reel.caption_mode);
    const raf = useRef(0);
    const last = useRef(0);

    useEffect(() => { localStorage.setItem(KEY, t.toFixed(2)); }, [t]);

    useEffect(() => {
      if (!playing) return;
      last.current = performance.now();
      const tick = (now) => {
        const dt = (now - last.current) / 1000; last.current = now;
        setT((prev) => {
          const nt = prev + dt;
          if (nt >= reel.duration) { setPlaying(false); return reel.duration; }
          return nt;
        });
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf.current);
    }, [playing, reel.duration]);

    const toggle = useCallback(() => {
      setPlaying((p) => { if (!p && t >= reel.duration - 0.05) setT(0); return !p; });
    }, [t, reel.duration]);

    const k = beatAt(reel.beats, t);
    const beat = reel.beats[k];
    const localT = t - beat.start;
    const pushScale = lerp(1.04, 1.12, localT / (beat.end - beat.start));

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {/* caption-mode control */}
        <div className="modes">
          {["block", "word", "highlight"].map((m) => (
            <button key={m} data-active={m === mode} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>

        {/* the 9:16 canvas */}
        <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: "var(--bg-deep)", borderRadius: 22, border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)" }}>
          <div style={{ position: "absolute", inset: 0, transform: `scale(${pushScale})`, transformOrigin: "center" }}>
            <img src={`${reel.bgDir}/${beat.bg}`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {/* bottom caption scrim */}
          <div style={{ position: "absolute", inset: 0, background: "var(--overlay-reel-bottom)" }} />
          {/* top hairline + handle + AI disclosure */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "var(--accent)", opacity: 0.9 }} />
          <div style={{ position: "absolute", top: 18 * S * 3, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: `0 ${60 * S}px`, fontFamily: "var(--font-mono)", fontSize: Math.max(10, 26 * S), letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--muted)" }}>
            <span>{reel.handle}</span>
            <span style={{ color: "var(--accent)" }}>● AI Voiceover</span>
          </div>
          {beat.endcard ? <EndCard question={reel.comment_prompt} handle={reel.handle} S={S} /> : <Captions beat={beat} localT={localT} mode={mode} S={S} />}
        </div>

        {/* transport */}
        <div className="transport" style={{ width: W }}>
          <button className="play" onClick={toggle}>
            {playing
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <div className="track" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setT(((e.clientX - r.left) / r.width) * reel.duration); }}>
            {reel.beats.map((b, i) => <span key={i} className="seg" style={{ left: (b.start / reel.duration) * 100 + "%", width: ((b.end - b.start) / reel.duration) * 100 + "%" }} />)}
            <span className="fill" style={{ width: (t / reel.duration) * 100 + "%" }} />
          </div>
          <span className="time">{t.toFixed(1)}s</span>
        </div>
      </div>
    );
  }

  window.ReelKit = { ReelPlayer };
})();
