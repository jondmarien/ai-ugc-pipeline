// Reel UI kit — sample reel timeline lifted from the pipeline
// (renderer/content/posts/2026-06-03_prompt-injection-agents.json → video).
// 26s, 5 beats, highlight captions, narrated (AI voiceover, labelled).
// Each beat references a slide background; words[] are relative-to-beat seconds
// (from Whisper alignment) and drive word/highlight caption modes.
window.REEL = {
  id: "prompt-injection-agents",
  theme: "defensive",
  handle: "@chron0s_cyb3r_w0rld.ai",
  bgDir: "../../assets/backgrounds/blue",
  duration: 26,
  caption_mode: "highlight",
  comment_prompt: "Would your agent trust a webpage it was told to summarize?",
  beats: [
    {
      start: 0, end: 5, bg: "01_cover.png", purpose: "hook",
      caption: "The weirdest AI attack hides where your agent reads.",
      words: [["The",0,0.1],["weirdest",0.1,0.46],["AI",0.46,0.7],["attack",0.7,1.22],["hides",1.22,1.5],["where",1.5,1.76],["your",1.76,1.88],["agent",1.88,2.12],["reads.",2.12,2.64]]
    },
    {
      start: 5, end: 11, bg: "03_risk.png", purpose: "context",
      caption: "It hides in the content, not the chat box.",
      words: [["It",0.2,0.4],["hides",0.4,0.8],["in",0.8,0.95],["the",0.95,1.1],["content,",1.1,1.7],["not",2.0,2.3],["the",2.3,2.5],["chat",2.5,2.9],["box.",2.9,3.4]]
    },
    {
      start: 11, end: 17, bg: "06_defense.png", purpose: "defense",
      caption: "Isolate untrusted content. Limit tools. Log every action.",
      words: [["Isolate",0.2,0.8],["untrusted",0.8,1.5],["content.",1.5,2.1],["Limit",2.4,2.9],["tools.",2.9,3.4],["Log",3.8,4.1],["every",4.1,4.5],["action.",4.5,5.1]]
    },
    {
      start: 17, end: 22, bg: "07_takeaway.png", purpose: "takeaway",
      caption: "External content is user input in a costume."
    },
    {
      start: 22, end: 26, bg: "08_cta.png", purpose: "cta", endcard: true,
      caption: "Comment + save."
    }
  ]
};
