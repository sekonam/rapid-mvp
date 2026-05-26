type Bucket = {
  count: number;
  resetAtMs: number;
};

// Best-effort, per-instance rate limiter for serverless.
// This protects you from accidental bursts and basic abuse.
const buckets = new Map<string, Bucket>();

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export function takeToken({
  key,
  limit,
  windowMs,
  nowMs = Date.now(),
}: {
  key: string;
  limit: number;
  windowMs: number;
  nowMs?: number;
}):
  | { ok: true }
  | { ok: false; retryAfterSeconds: number } {
  const existing = buckets.get(key);
  if (!existing || nowMs >= existing.resetAtMs) {
    buckets.set(key, { count: 1, resetAtMs: nowMs + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAtMs - nowMs) / 1000)
    );
    return { ok: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { ok: true };
}

