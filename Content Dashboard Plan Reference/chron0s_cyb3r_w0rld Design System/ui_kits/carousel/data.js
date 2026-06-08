// Carousel UI kit — sample post data lifted verbatim from the pipeline
// (renderer/content/posts/*.json). Two approved posts, two themes.
// Backgrounds are the text-free FLUX key art; React renders the type on top.
window.CAROUSEL_POSTS = [
  {
    id: "prompt-injection-agents",
    theme: "defensive",
    handle: "@chron0s_cyb3r_w0rld.ai",
    bgDir: "../../assets/backgrounds/blue",
    pillar: "model_security",
    likes: 1284,
    posted: "JUNE 3",
    comment_prompt: "Would your agent trust a webpage it was told to summarize?",
    caption:
      "The weirdest AI attack doesn't get typed into the chat box. It hides in the content your AI agent reads. That's indirect prompt injection. Defender move: isolate untrusted content, scope agent permissions, log every action, confirm sensitive steps.",
    hashtags: ["#AISecurity", "#PromptInjection", "#LLMSecurity", "#AIagents", "#OWASP"],
    slides: [
      { role: "cover", bg: "01_cover.png", kicker: "AI × Cybersecurity", copy: "THE WEIRDEST AI ATTACK HIDES WHERE YOUR AGENT READS", sub: "Prompt injection isn't always typed by the user.", cta: "Swipe →" },
      { role: "context", bg: "02_context.png", kicker: "What Changed", copy: "Direct injection: the user manipulates the model. Indirect: the content does.", sub: "The instruction can come from data, not the chat box." },
      { role: "risk", bg: "03_risk.png", kicker: "Why It Matters", copy: "It can live in web pages, emails, documents, or images, anywhere the agent reads.", sub: "Untrusted content becomes untrusted instructions." },
      { role: "mechanism", bg: "04_mechanism.png", kicker: "How It Works", copy: "The risk spikes when the AI can act: send email, read files, call APIs.", sub: "Reading is one thing. Acting is another." },
      { role: "failure_point", bg: "05_failure-point.png", kicker: "Where Teams Fail", copy: "OWASP flags the pattern: injection, sensitive disclosure, excessive agency.", sub: "It's a known risk class, not a surprise." },
      { role: "defense", bg: "06_defense.png", kicker: "Defensive Move", copy: "Isolate untrusted content. Limit tools. Log actions. Confirm sensitive steps.", sub: "Least privilege for agents, not just users." },
      { role: "takeaway", bg: "07_takeaway.png", kicker: "Takeaway", copy: "Treat external content [[like user input wearing a costume]].", sub: "" },
      { role: "cta", bg: "08_cta.png", kicker: "Your Move", copy: "Would your agent trust a webpage it was told to summarize?", sub: "Save this for your next agent design review.", cta: "Comment + Save" }
    ]
  },
  {
    id: "hexstrike-ai-v6",
    theme: "offensive",
    handle: "@chron0s_cyb3r_w0rld.ai",
    bgDir: "../../assets/backgrounds/red",
    pillar: "offensive_ai",
    likes: 2071,
    posted: "JUNE 6",
    comment_prompt: "How fast can your team patch an internet-facing zero-day, honestly?",
    caption:
      "An open-source tool just let an AI agent drive 150+ hacking tools by itself. The gap between a disclosure and mass exploitation is collapsing. No fake panic, but the direction is real: patch velocity and exposure management matter more than ever.",
    hashtags: ["#offensiveAI", "#redteam", "#MCP", "#CVE", "#patchmanagement", "#AIsecurity"],
    slides: [
      { role: "cover", bg: "01_cover.png", kicker: "Offensive AI · Red Team Tools", copy: "AI JUST CUT EXPLOIT DEVELOPMENT FROM WEEKS TO MINUTES", sub: "HexStrike AI: one open-source tool, 150+ hacking tools, driven by an AI agent.", cta: "Swipe →" },
      { role: "context", bg: "02_context.png", kicker: "What It Is", copy: "An open-source framework that lets an AI agent run 150+ security tools.", sub: "Built for authorized red teams via MCP, with Claude, GPT, or Copilot as the operator." },
      { role: "risk", bg: "03_risk.png", kicker: "What Actually Happened", copy: "Hours after a Citrix zero-day dropped, attackers discussed using it to mass-exploit.", sub: "Reported on dark-web forums by Check Point: chatter, not confirmed forensics." },
      { role: "mechanism", bg: "04_mechanism.png", kicker: "How It Works", copy: "A decision engine turns a plain-language goal into a recon-to-exploit loop.", sub: "It selects the tools, chains them, and retries failures on its own. That's the leap." },
      { role: "failure_point", bg: "05_failure-point.png", kicker: "The Shrinking Window", copy: "The gap between disclosure and mass exploitation is now hours, not weeks.", sub: "~28,000 NetScaler boxes were exposed to one bug (CVE-2025-7775, CVSS 9.2)." },
      { role: "defense", bg: "06_defense.png", kicker: "What Actually Works", copy: "Patch internet-facing gear first, and fast. Assume n-day exploitation is automated.", sub: "Track exposure, watch threat intel on disclosure day, tune detection for the window." },
      { role: "takeaway", bg: "07_takeaway.png", kicker: "The Real Shift", copy: "AI lowers the skill floor for attackers. [[Patch velocity matters more]], {{not less}}.", sub: "Same fundamentals. Far less time to apply them." },
      { role: "cta", bg: "08_cta.png", kicker: "Your Move", copy: "How fast can your team patch an internet-facing zero-day, honestly?", sub: "Save this for your next patch-SLA review.", cta: "Comment + Save" }
    ]
  }
];
