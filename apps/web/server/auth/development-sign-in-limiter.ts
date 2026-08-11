export type SignInLimitDecision = { allowed: boolean; retryAfterSeconds: number };

type Bucket = { attempts: number[]; touchedAt: number };

export class DevelopmentSignInLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly options: { windowMs: number; maximum: number; maximumBuckets: number };

  constructor(options: { windowMs: number; maximum: number; maximumBuckets: number }) { this.options = options; }

  check(keys: string[], now = Date.now()): SignInLimitDecision {
    this.cleanup(now);
    const unique = [...new Set(keys.filter(Boolean))];
    const blocked = unique.map((key) => this.buckets.get(key)).find((bucket) => bucket && bucket.attempts.length >= this.options.maximum);
    if (blocked) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((blocked.attempts[0]! + this.options.windowMs - now) / 1000)) };
    for (const key of unique) {
      const bucket = this.buckets.get(key) ?? { attempts: [], touchedAt: now };
      bucket.attempts.push(now); bucket.touchedAt = now; this.buckets.set(key, bucket);
    }
    this.trim();
    return { allowed: true, retryAfterSeconds: 0 };
  }

  private cleanup(now: number) {
    for (const [key, bucket] of this.buckets) {
      bucket.attempts = bucket.attempts.filter((attempt) => attempt > now - this.options.windowMs);
      if (!bucket.attempts.length) this.buckets.delete(key);
    }
  }

  private trim() {
    while (this.buckets.size > this.options.maximumBuckets) {
      const oldest = [...this.buckets.entries()].sort((left, right) => left[1].touchedAt - right[1].touchedAt)[0];
      if (!oldest) return;
      this.buckets.delete(oldest[0]);
    }
  }

  sizeForTest() { return this.buckets.size; }
}
