// Sums and means as R computes them. R accumulates in extended precision (src/main/summary.c), which
// for the short vectors here gives the exact sum or mean rounded once to a double. These do that
// exactly: every double is a whole number times a power of 2, so the sum is a whole number (a BigInt)
// times the smallest power, and the mean is that over n, rounded once to the nearest double (ties to
// even). The difference matters where a mean sits on a rounding tie: SMURF's fauna index of exactly
// 0.3625 rounds to 0.362 in R only because its mean lands just below the tie.

/** x = m * 2^e with m a whole number */
function decompose(x: number): { m: bigint; e: number } {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, x)
  const hi = view.getUint32(0)
  const lo = view.getUint32(4)
  const exp = (hi >>> 20) & 0x7ff
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo)
  let e = -1074
  if (exp !== 0) {
    m |= 1n << 52n
    e = exp - 1075
  }
  return { m: hi >>> 31 ? -m : m, e }
}

const bitLength = (x: bigint): number => (x === 0n ? 0 : x.toString(2).length)
const TWO53 = 1n << 53n
const TWO52 = 1n << 52n

/** (p / q) * 2^k rounded once to the nearest double, ties to even (q > 0). */
export function ratioToDouble(p: bigint, q: bigint, k: number): number {
  if (p === 0n) return 0
  const neg = p < 0n
  const a = neg ? -p : p
  let s = 53 - (bitLength(a) - bitLength(q))
  const quotient = (shift: number) => {
    const num = shift >= 0 ? a << BigInt(shift) : a
    const den = shift >= 0 ? q : q << BigInt(-shift)
    return { mant: num / den, num, den }
  }
  let r = quotient(s)
  while (r.mant >= TWO53) r = quotient(--s)
  while (r.mant < TWO52) r = quotient(++s)
  let mant = r.mant
  const twice = (r.num - mant * r.den) * 2n
  if (twice > r.den || (twice === r.den && (mant & 1n) === 1n)) mant += 1n
  if (mant === TWO53) {
    mant >>= 1n
    s -= 1
  }
  const v = Number(mant) * 2 ** (k - s)
  return neg ? -v : v
}

function exactSum(xs: readonly number[]): { s: bigint; e: number } | null {
  if (!xs.every(Number.isFinite)) return null
  const parts = xs.map(decompose)
  const e = Math.min(...parts.map((p) => p.e))
  let s = 0n
  for (const p of parts) s += p.m << BigInt(p.e - e)
  return { s, e }
}

/** The sum, rounded once. */
export function rsum(xs: readonly number[]): number {
  const x = exactSum(xs)
  if (!x) return xs.reduce((a, b) => a + b, 0)
  return ratioToDouble(x.s, 1n, x.e)
}

/** The mean, rounded once (R's mean()). */
export function rmean(xs: readonly number[]): number {
  if (!xs.length) return NaN
  const x = exactSum(xs)
  if (!x) return xs.reduce((a, b) => a + b, 0) / xs.length
  return ratioToDouble(x.s, BigInt(xs.length), x.e)
}
