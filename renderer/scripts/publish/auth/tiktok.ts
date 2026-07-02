/**
 * TikTok OAuth2 platform config.
 *
 * Scopes match the live TikTok app (Login Kit + Content Posting API): video.publish
 * for Direct Post and user.info.basic for the creator_info query the post flow requires.
 * Analytics scopes (user.info.stats, video.list) are deferred to the future dashboard
 * spec — TikTok's audit makes you demo every requested scope, so we only request what
 * this feature uses.
 */
export const tokenEndpoint = "https://open.tiktokapis.com/v2/oauth/token/";

export const scopes = ["video.publish", "user.info.basic"];

export function buildRefreshBody(
  cfgEnv: Record<string, string>,
  refreshToken: string,
): Record<string, string> {
  return {
    grant_type: "refresh_token",
    client_key: cfgEnv.TIKTOK_CLIENT_KEY ?? "",
    client_secret: cfgEnv.TIKTOK_CLIENT_SECRET ?? "",
    refresh_token: refreshToken,
  };
}
