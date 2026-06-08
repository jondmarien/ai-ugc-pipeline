import { useCallback } from "react";
import {
  QueryClient, useMutation, useQuery, useQueryClient,
} from "@tanstack/react-query";
import type { ApiEnvelope } from "@shared/types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // memory layer only; the server cache owns real freshness
      refetchOnWindowFocus: false,  // a local tool refocused 50x/day must not spam the server
      retry: 1,
    },
  },
});

async function getEnvelope<T>(path: string, force = false): Promise<ApiEnvelope<T>> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(force ? `${path}${sep}refresh=1` : path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const keyFor = (path: string) => ["api", path] as const;

export function useApi<T>(path: string): ApiEnvelope<T> & { loading: boolean; reload: () => void } {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: keyFor(path), queryFn: () => getEnvelope<T>(path) });
  const env: ApiEnvelope<T> = query.data ?? { data: null, error: null, fetchedAt: null };
  const reload = useCallback(async () => {
    // Per-module forced refresh: bypass the SERVER disk cache, then update the client cache.
    const fresh = await getEnvelope<T>(path, true).catch(
      (e): ApiEnvelope<T> => ({ data: env.data, error: String(e), fetchedAt: env.fetchedAt }));
    qc.setQueryData(keyFor(path), fresh);
  }, [path, qc, env.data, env.fetchedAt]);
  return {
    ...env,
    error: env.error ?? (query.error ? String(query.error) : null),
    loading: query.isPending,
    reload,
  };
}

/**
 * Local-state file (schedule.json / hooks-meta.json / sources.json) as a query + mutation.
 * save() optimistically writes the client cache, PUTs, then invalidates so the cache converges.
 */
export function useStateFile<T>(name: string) {
  const qc = useQueryClient();
  const path = `/api/state/${name}`;
  const api = useApi<T>(path);
  const mutation = useMutation({
    mutationFn: async (value: T) => {
      const res = await fetch(path, { method: "PUT", body: JSON.stringify(value) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return value;
    },
    onMutate: async (value) => {
      await qc.cancelQueries({ queryKey: keyFor(path) });
      const snapshot = qc.getQueryData<ApiEnvelope<T>>(keyFor(path));
      qc.setQueryData<ApiEnvelope<T>>(keyFor(path), { data: value, error: null, fetchedAt: null });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => { if (ctx?.snapshot) qc.setQueryData(keyFor(path), ctx.snapshot); },
    onSettled: () => qc.invalidateQueries({ queryKey: keyFor(path) }),
  });
  return {
    ...api,
    save: (value: T) => {
      // Never write while the first GET is pending OR errored (an unreadable file must
      // not be overwritten with defaults, and a too-early write clobbers sibling keys).
      if (api.loading || api.error) return;
      mutation.mutate(value);
    },
  };
}

/** Sidebar Refresh: bypass the server disk caches for upstream data, then refetch everything. */
export async function refreshAll(qc: QueryClient) {
  await Promise.allSettled(
    ["/api/ig/account", "/api/ig/media", "/api/trends"].map((p) => getEnvelope(p, true)));
  await qc.invalidateQueries({ queryKey: ["api"] });
}

export function ageLabel(fetchedAt: number | null): string {
  if (!fetchedAt) return "NEVER FETCHED";
  const h = (Date.now() - fetchedAt) / 3_600_000;
  return h < 1 ? `CACHED ${Math.round(h * 60)}M AGO` : `CACHED ${Math.round(h)}H AGO`;
}
