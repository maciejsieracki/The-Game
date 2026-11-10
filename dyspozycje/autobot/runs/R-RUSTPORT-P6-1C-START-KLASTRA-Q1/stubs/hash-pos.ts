export function hashPos(seed: number, q: number, r: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d)
    ^ Math.imul(r | 0, 0x165667b1)
    ^ Math.imul(seed | 0, 0x9e3779b1)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}
