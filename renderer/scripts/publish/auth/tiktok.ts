/**
 * TikTok OAuth2 platform config.
 *
 * Scopes include publish + upload + user info (basic + stats for the future
 * analytics/dashboard feature).
 */
export const tokenEndpoint = "https://open.tiktokapis.com/v2/oauth/token/";

export const scopes = [
  "video.publish",
  "video.upload",
  "user.info.basic",
  "user.info.stats",
];

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
