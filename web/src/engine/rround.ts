// R's round(): WARM 1.x rounded SMURF's indices with it, so WARM 2.0 rounds the same way.
//
// R 4.0.0 and later round x to d digits by taking the two candidates on either side, x rounded down
// and x rounded up at d digits, and returning the nearer one in double arithmetic; on an exact tie
// the one with an even last digit. round(x) with no digits is the nearest integer, ties to even.
// (R's src/nmath/fround.c; web/tests/rround.test.ts compares this with R on hundreds of values,
// ties included.)

const DBL_DIG = 15
const LOG10_2 = Math.log10(2)

/** The nearest integer, exact ties to the even one (C's nearbyint, R's round(x)). */
function nearbyint(x: number): number {
  const f = Math.floor(x)
  const d = x - f
  if (d > 0.5) return f + 1
  if (d < 0.5) return f
  return f % 2 === 0 ? f : f + 1
}

function rnd(x: number, dig: number): number {
  // x > 0: logb(x) is its binary exponent
  const l10x = LOG10_2 * (0.5 + Math.floor(Math.log2(x)))
  if (l10x + dig > DBL_DIG) return x
  const p10 = 10 ** dig
  const x10 = p10 * x
  const i10 = Math.floor(x10)
  const xd = i10 / p10
  const xu = Math.ceil(x10) / p10
  const du = xu - x
  const dd = x - xd
  return du < dd || (du === dd && i10 % 2 === 1) ? xu : xd
}

/** R's round(x, digits). */
export function rround(x: number, digits = 0): number {
  if (!Number.isFinite(x) || x === 0) return x
  if (digits === 0) return nearbyint(x)
  const dig = Math.floor(digits + 0.5)
  return x < 0 ? -rnd(-x, dig) : rnd(x, dig)
}
