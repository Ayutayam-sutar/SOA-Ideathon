/**
 * routeCache.ts — In-memory TTL cache for AI routing results.
 * Keyed by: origin+destination+preference+weightKg hash.
 * TTL: 5 minutes. Max 100 entries (LRU-lite eviction).
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const ROUTE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 100;

const routeCache = new Map<string, CacheEntry>();

function evictOldest() {
  // Delete the earliest-added entry
  const firstKey = routeCache.keys().next().value;
  if (firstKey) routeCache.delete(firstKey);
}

export function buildRouteCacheKey(
  originName: string,
  destName: string,
  preference: string = 'balanced',
  slaOverrideHours?: number,
  totalWeightKg?: number
): string {
  const w = totalWeightKg != null ? Math.round(totalWeightKg / 100) * 100 : 'def'; // bucket to nearest 100kg
  const sla = slaOverrideHours ?? 'def';
  return `${originName.toLowerCase().trim()}::${destName.toLowerCase().trim()}::${preference}::${sla}::${w}`;
}

export function getCachedRoute(key: string): any | null {
  const entry = routeCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    routeCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedRoute(key: string, data: any): void {
  if (routeCache.size >= MAX_ENTRIES) {
    evictOldest();
  }
  routeCache.set(key, {
    data,
    expiresAt: Date.now() + ROUTE_CACHE_TTL_MS,
  });
}

export function invalidateCacheForOriginDest(originName: string, destName: string): void {
  const prefix = `${originName.toLowerCase().trim()}::${destName.toLowerCase().trim()}::`;
  for (const key of routeCache.keys()) {
    if (key.startsWith(prefix)) {
      routeCache.delete(key);
    }
  }
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: routeCache.size,
    keys: Array.from(routeCache.keys()),
  };
}

/**
 * In-memory TTL cache for ML risk predictions keyed by shipmentId+routeHash.
 * Individual Python process spawns (predict_delay.py / predict_spoilage.py) are the
 * biggest latency contributor — caching their results for repeated same-shipment calls
 * (e.g. What-If recalculations) cuts response time from ~2-4s to <100ms on hit.
 */
const RISK_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const riskCache = new Map<string, CacheEntry>();

export function buildRiskCacheKey(shipmentId: string, durationHours: number, transferCount: number, mode: string): string {
  // Bucket duration to 0.5h increments — slight route variation shouldn't bust cache
  const durBucket = Math.round(durationHours * 2) / 2;
  return `${shipmentId}::${durBucket}::${transferCount}::${mode}`;
}

export function getCachedRisk(key: string): any | null {
  const entry = riskCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    riskCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedRisk(key: string, data: any): void {
  if (riskCache.size >= MAX_ENTRIES) {
    const firstKey = riskCache.keys().next().value;
    if (firstKey) riskCache.delete(firstKey);
  }
  riskCache.set(key, {
    data,
    expiresAt: Date.now() + RISK_CACHE_TTL_MS,
  });
}
