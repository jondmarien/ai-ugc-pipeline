import type { IgComment } from "../shared/types";
import { appSecretProof, requireMetaStore } from "./meta_auth";

/**
 * Comment moderation (list/hide/delete/reply) for the dashboard's Comments panel
 * — same Page-token flow as meta.ts/ig.ts, requires instagram_manage_comments on
 * top of the publishing scopes. See renderer/scripts/publish/auth/meta.ts's
 * `scopes` array.
 *
 * Deliberately NOT implemented: like/unlike a comment. Meta's /{ig-user-id}/likes
 * endpoint requires an Instagram Login User access token (graph.instagram.com,
 * Instagram Business Login) — a different OAuth flow than the Facebook Login
 * Page-token model this entire app is built on. Wiring it up would mean running
 * a second, parallel auth system for one button; not worth it for a
 * single-owner tool.
 */

const GRAPH = "https://graph.facebook.com/v25.0";
const COMMENT_FIELDS =
  "id,text,from,timestamp,like_count,hidden,replies{id,text,from,timestamp,like_count,hidden}";

async function graphCall(
  method: "GET" | "POST" | "DELETE",
  pathAndQuery: string,
  fetchImpl: typeof fetch = fetch,
): Promise<any> {
  const store = requireMetaStore();
  const appSecret = process.env.META_APP_SECRET ?? "";
  const proof = appSecretProof(store.page_access_token, appSecret);
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  const url = `${GRAPH}${pathAndQuery}${sep}access_token=${store.page_access_token}&appsecret_proof=${proof}`;
  const res = await fetchImpl(url, { method });
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  return body;
}

/** The API returns commenter identity as a `from: {id, username}` object, not a
 * flat `username` field — the flat field is access-gated separately and is
 * frequently absent even when `from` is populated. */
function normalize(raw: any): IgComment {
  return {
    id: raw.id,
    text: raw.text,
    username: raw.from?.username,
    timestamp: raw.timestamp,
    like_count: raw.like_count,
    hidden: raw.hidden,
    replies: (raw.replies?.data ?? []).map(normalize),
  };
}

export async function listComments(
  mediaId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<IgComment[]> {
  const body = await graphCall(
    "GET",
    `/${mediaId}/comments?fields=${COMMENT_FIELDS}`,
    fetchImpl,
  );
  return (body.data ?? []).map(normalize);
}

export async function setCommentHidden(
  commentId: string,
  hidden: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<{ success: boolean }> {
  return graphCall("POST", `/${commentId}?hide=${hidden}`, fetchImpl);
}

export async function deleteComment(
  commentId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ success: boolean }> {
  return graphCall("DELETE", `/${commentId}`, fetchImpl);
}

export async function replyToComment(
  commentId: string,
  message: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string }> {
  return graphCall(
    "POST",
    `/${commentId}/replies?message=${encodeURIComponent(message)}`,
    fetchImpl,
  );
}
