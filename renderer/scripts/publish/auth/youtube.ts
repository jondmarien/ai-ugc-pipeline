/**
 * YouTube OAuth2 platform config.
 *
 * Scopes include upload + read-only for the future analytics/dashboard feature.
 */
export const tokenEndpoint = "https://oauth2.googleapis.com/token";

export const scopes = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export function buildRefreshBody(
  cfgEnv: Record<string, string>,
  refreshToken: string,
): Record<string, string> {
  return {
    grant_type: "refresh_token",
    client_id: cfgEnv.YOUTUBE_CLIENT_ID ?? "",
    client_secret: cfgEnv.YOUTUBE_CLIENT_SECRET ?? "",
    refresh_token: refreshToken,
  };
}
