import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInstagramDiscordPipeline } from "./pipeline.ts";
import type { NewPostNotification } from "./types.ts";

const stubFetch = async (url: string | URL | Request) => {
  const u = String(url);
  if (u.includes("/media?")) {
    return new Response(
      JSON.stringify({
        data: [
          {
            id: "new_1",
            caption: "pipeline test",
            timestamp: "2026-07-03T10:00:00+0000",
            permalink: "https://www.instagram.com/p/NEW/",
            media_type: "IMAGE",
            media_url: "https://cdn.example/new.jpg",
          },
          {
            id: "old_1",
            timestamp: "2026-07-01T10:00:00+0000",
            media_type: "IMAGE",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  if (u.includes("fields=username")) {
    return new Response(
      JSON.stringify({ username: "chron0s_cyb3r_w0rld.ai" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  if (u.includes("discord.com")) {
    return new Response(JSON.stringify({ id: "999" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: { message: "unexpected" } }), {
    status: 400,
  });
};

test("runInstagramDiscordPipeline posts to Discord for each new IG post", async () => {
  const dir = mkdtempSync(join(tmpdir(), "relay-pipe-"));
  const statePath = join(dir, "watch.json");
  try {
    writeFileSync(
      statePath,
      JSON.stringify({
        igUserId: "999",
        username: "chron0s_cyb3r_w0rld.ai",
        lastSeenMediaId: "old_1",
        lastSeenTimestamp: "2026-07-01T10:00:00+0000",
        updatedAt: 1,
      }),
      "utf8",
    );

    process.env.IG_ACCESS_TOKEN = "test-token";
    process.env.IG_USER_ID = "999";
    process.env.IG_TARGET_USERNAME = "chron0s_cyb3r_w0rld.ai";
    process.env.DISCORD_BOT_TOKEN = "discord-test-token";
    process.env.DISCORD_CHANNEL_ID = "1522416855061495848";

    const stdout: NewPostNotification[] = [];
    const origLog = console.log;
    console.log = (line: string) => {
      try {
        stdout.push(JSON.parse(line) as NewPostNotification);
      } catch {
        origLog(line);
      }
    };

    try {
      const r = await runInstagramDiscordPipeline({
        statePath,
        fetchImpl: stubFetch as typeof fetch,
        emitStdout: true,
        discordEnv: process.env,
      });
      expect(r.notifications).toHaveLength(1);
      expect(r.discordResults).toHaveLength(1);
      expect(r.discordResults[0].result.ok).toBe(true);
      expect(stdout).toHaveLength(1);
      expect(stdout[0].event).toBe("instagram.new_post");
    } finally {
      console.log = origLog;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runInstagramDiscordPipeline dry-run does not call Discord fetch", async () => {
  const dir = mkdtempSync(join(tmpdir(), "relay-pipe-dry-"));
  const statePath = join(dir, "watch.json");
  try {
    writeFileSync(
      statePath,
      JSON.stringify({
        igUserId: "999",
        username: "chron0s_cyb3r_w0rld.ai",
        lastSeenMediaId: "old_1",
        lastSeenTimestamp: "2026-07-01T10:00:00+0000",
        updatedAt: 1,
      }),
      "utf8",
    );

    process.env.IG_ACCESS_TOKEN = "test-token";
    process.env.IG_USER_ID = "999";
    process.env.IG_TARGET_USERNAME = "chron0s_cyb3r_w0rld.ai";

    let discordCalls = 0;
    const fetchImpl = async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes("discord.com")) {
        discordCalls++;
      }
      return stubFetch(url);
    };

    const r = await runInstagramDiscordPipeline({
      statePath,
      dryRun: true,
      discordDryRun: true,
      fetchImpl: fetchImpl as typeof fetch,
      emitStdout: false,
    });
    expect(r.notifications).toHaveLength(1);
    expect(discordCalls).toBe(0);
    expect(r.discordResults[0].result.ok).toBe(true);
    if (r.discordResults[0].result.ok && r.discordResults[0].result.mode === "dry-run") {
      expect(r.discordResults[0].result.request.url).toContain("1522416855061495848");
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});