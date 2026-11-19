// Seeded PRNG (mulberry32) so photo mode, traffic staging and AI decisions are reproducible.
// Every random choice that affects a staged frame goes through a seeded stream, never Math.random.
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + next() * (hi - lo);
  next.int = (lo, hi) => Math.floor(next.range(lo, hi + 1));
  next.pick = arr => arr[Math.floor(next() * arr.length)];
  next.chance = p => next() < p;
  return next;
}
// City-wide stream, seeded once per boot so world layout and AI choices repeat.
export const rng = makeRng(20261119);
