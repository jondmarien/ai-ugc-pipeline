import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInstagramWatch } from "./watch.ts";
import type { NewPostNotification } from "./types.ts";

test("runInstagramWatch stub: simulated new post emits exactly one payload", async () => {
  const dir = mkdtempSync(join(tmpdir(), "relay-test-"));
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

    const fetchImpl = async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes("/media?")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "new_1",
                caption: "hello",
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
      return new Response(JSON.stringify({ error: { message: "unexpected" } }), {
        status: 400,
      });
    };

    process.env.IG_ACCESS_TOKEN = "test-token";
    process.env.IG_USER_ID = "999";
    process.env.IG_TARGET_USERNAME = "chron0s_cyb3r_w0rld.ai";

    const emitted: NewPostNotification[] = [];
    const first = await runInstagramWatch({
      statePath,
      fetchImpl: fetchImpl as typeof fetch,
      onNewPost: (n) => emitted.push(n),
    });

    expect(first.notifications).toHaveLength(1);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].mediaId).toBe("new_1");
    expect(emitted[0].caption).toBe("hello");

    const second = await runInstagramWatch({
      statePath,
      fetchImpl: fetchImpl as typeof fetch,
      onNewPost: (n) => emitted.push(n),
    });
    expect(second.notifications).toHaveLength(0);
    expect(emitted).toHaveLength(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});