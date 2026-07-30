import type { IgComment } from "../shared/types";
import {
  appSecretProof,
  GRAPH_BASE as GRAPH,
  requireMetaStore,
} from "./meta_auth";

/**
 * Comment moderation (list/hide/delete/reply/like) for the dashboard's Comments
 * panel — all on the same Page-token flow as meta.ts/ig.ts. Requires
 * instagram_manage_comments (hide/delete/reply) and instagram_manage_engagement
 * (like/unlike) on top of the publishing scopes. See
 * renderer/scripts/publish/auth/meta.ts's `scopes` array.
 *
 * Like/unlike (POST/DELETE /{ig-user-id}/likes) is documented at
 * graph.facebook.com under Meta's classic Instagram Graph API reference, not a
 * separate Instagram Login product — an earlier version of this file assumed
 * otherwise and built a whole second OAuth flow for it, which was wrong and
 * has been removed. This is the same Page token as everything else here.
 */

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

export async function likeComment(
  commentId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ success: boolean }> {
  const { ig_user_id } = requireMetaStore();
  return graphCall(
    "POST",
    `/${ig_user_id}/likes?comment_id=${commentId}`,
    fetchImpl,
  );
}

export async function unlikeComment(
  commentId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ success: boolean }> {
  const { ig_user_id } = requireMetaStore();
  return graphCall(
    "DELETE",
    `/${ig_user_id}/likes?comment_id=${commentId}`,
    fetchImpl,
  );
}
