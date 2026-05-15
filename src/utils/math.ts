/**
 * Calculate cosine similarity between two equal-length vectors.
 * Returns a value in [-1, 1] where 1 = identical direction.
 */
export function calculateCosineSimilarity(
  vecA: number[],
  vecB: number[]
): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    throw new Error(
      `Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Guard against zero-magnitude vectors
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Normalize a raw latency (ms) to a scalar in [0.0, 1.0].
 * Clamped: t < 500ms → 0.0, t > 5000ms → 1.0
 */
export function normalizeLatency(ms: number): number {
  const MIN_MS = 500;
  const MAX_MS = 15000; // Increased to 15s to prevent capping at 1.0 for normal reading speeds

  if (ms <= MIN_MS) return 0.0;
  if (ms >= MAX_MS) return 1.0;

  return (ms - MIN_MS) / (MAX_MS - MIN_MS);
}

/**
 * Calculate the Entropy Coefficient from an array of latencies.
 *
 * Detects robotic uniformity by computing the variance of latencies.
 * - If variance is suspiciously low (< 2500 ms², i.e., std dev < 50ms),
 *   return 0 (synthetic entity detected).
 * - Normal human variance returns 1.
 * - Gradual transition zone between 2500 and 10000 ms².
 */
export function calculateEntropyCoefficient(latencies: number[]): number {
  if (latencies.length < 2) return 1;

  const mean = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  const variance =
    latencies.reduce((sum, l) => sum + (l - mean) ** 2, 0) / latencies.length;

  const LOW_THRESHOLD = 2500; // std dev ≈ 50ms — robotic
  const HIGH_THRESHOLD = 10000; // std dev ≈ 100ms — clearly human

  if (variance < LOW_THRESHOLD) return 0;
  if (variance >= HIGH_THRESHOLD) return 1;

  // Smooth transition
  return (variance - LOW_THRESHOLD) / (HIGH_THRESHOLD - LOW_THRESHOLD);
}
