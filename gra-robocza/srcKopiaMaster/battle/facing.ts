/**
 * facing.ts
 * FACING (front / flank / rear) helper for the auto-battle (battleScene.ts).
 *
 * Canon link: SS5l "KANONICZNY MODEL WALKI" -- the flank/rear DEFENCE penalty
 * (units.json fields "Kara obrony z flanki (%)" / "Kara obrony z tylu (%)")
 * applies based on WHERE the attacker strikes the defender relative to the
 * direction the defender is facing.
 *
 * Coordinate convention (must match battleScene.ts / hexutil.ts):
 *   POINTY-TOP axial hexes. The six neighbour directions, in rotational order
 *   (each index is exactly 60 degrees clockwise from the previous one):
 *
 *     idx 0: ( 1,  0)
 *     idx 1: ( 1, -1)
 *     idx 2: ( 0, -1)
 *     idx 3: (-1,  0)
 *     idx 4: (-1,  1)
 *     idx 5: ( 0,  1)
 *
 * A unit's FACING is stored as one of these six direction indices -- the
 * direction that points from the unit toward the enemy it is oriented against.
 *
 * 2 / 2 / 2 SPLIT
 * ---------------
 * The attack is classified by the INCOMING direction: the axial direction that
 * points FROM the defender's hex TOWARD the attacker's hex. Let `f` be the
 * defender's facing index and `o` the incoming direction index. With six
 * directions and a vertex-centred facing, the six incoming directions are
 * partitioned into three contiguous 120-degree arcs of TWO directions each:
 *
 *     offset = (o - f + 6) % 6   in {0,1,2,3,4,5}
 *
 *     offset 0 or 1  -> FRONT   (facing dir + its clockwise neighbour)
 *     offset 2 or 5  -> FLANK   (the two side directions)
 *     offset 3 or 4  -> REAR    (the opposite dir + its counter-clockwise nb)
 *
 * This is an exact, complete 2/2/2 partition (every direction lands in exactly
 * one bucket) and a 180-degree rotation swaps FRONT<->REAR, as expected. The
 * split carries a small clockwise bias (it cannot be perfectly mirror-symmetric
 * because 6 directions cannot be centred on a single direction and still give
 * even left/right halves); FRONT is the 120-degree wedge that begins at the
 * facing direction and sweeps one step clockwise.
 *
 * ASCII-only source file.
 */

/** Result of classifying an attack against a defender's facing. */
export type FacingHit = 'front' | 'flank' | 'rear';

/**
 * The six pointy-top axial neighbour directions, in rotational order.
 * Index into this array is what we store as a unit's FACING.
 * Kept identical to HEX_DIRS in battleScene.ts.
 */
export const FACE_DIRS: ReadonlyArray<readonly [number, number]> = [
  [ 1,  0], // 0
  [ 1, -1], // 1
  [ 0, -1], // 2
  [-1,  0], // 3
  [-1,  1], // 4
  [ 0,  1], // 5
];

/**
 * Pick the neighbour direction index that best matches the axial vector
 * (dq, dr) pointing from a unit toward a point of interest (its target).
 *
 * Each of the six unit directions is scored by the axial/cube dot product
 * (dirq*dq + dirr*dr + dirs*ds) with s = -q - r, a monotonic proxy for the
 * cosine between the two hex vectors; the best-scoring direction wins. Ties
 * resolve to the lowest index for determinism.
 *
 * If (dq, dr) is the zero vector (target on the same hex) we keep `fallback`
 * (the unit's current facing) so a facing is never clobbered to a default.
 */
export function facingTowards(dq: number, dr: number, fallback = 0): number {
  if (dq === 0 && dr === 0) return fallback;

  const ds = -dq - dr;
  let bestIdx = fallback;
  let bestScore = -Infinity;

  for (let i = 0; i < FACE_DIRS.length; i++) {
    const dir = FACE_DIRS[i];
    if (!dir) continue;
    const diq = dir[0];
    const dir_ = dir[1];
    const dis = -diq - dir_;
    // Axial/cube dot product: larger == directions point more the same way.
    const score = diq * dq + dir_ * dr + dis * ds;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Convenience wrapper: facing index that points from (fromQ,fromR) toward
 * (toQ,toR). Keeps the caller from re-deriving the delta.
 */
export function facingFromTo(
  fromQ: number,
  fromR: number,
  toQ: number,
  toR: number,
  fallback = 0,
): number {
  return facingTowards(toQ - fromQ, toR - fromR, fallback);
}

/**
 * Classify an attack against a defender given:
 *   - the defender's FACING direction index (0..5),
 *   - the attacker's hex and the defender's hex.
 *
 * The incoming direction is the axial direction pointing FROM the defender
 * TOWARD the attacker. We then bucket the offset to that facing into
 * FRONT / FLANK / REAR per the documented 2/2/2 split.
 *
 * Works for any attacker position (not just adjacency); a ranged attacker two
 * hexes away is classified by the same incoming-direction logic.
 */
export function classifyAttack(
  defenderFacing: number,
  attackerQ: number,
  attackerR: number,
  defenderQ: number,
  defenderR: number,
): FacingHit {
  // Direction from the defender toward the attacker (where the blow comes from).
  const incoming = facingTowards(
    attackerQ - defenderQ,
    attackerR - defenderR,
    defenderFacing,
  );
  return classifyOffset(defenderFacing, incoming);
}

/**
 * Pure offset classifier: given the defender's facing index and the incoming
 * direction index, return FRONT / FLANK / REAR.
 *
 *   offset = (incoming - facing + 6) % 6
 *     0,1 -> front   |   2,5 -> flank   |   3,4 -> rear
 *
 * Exposed for unit tests and for callers that already have both indices.
 */
export function classifyOffset(facing: number, incoming: number): FacingHit {
  const offset = (((incoming - facing) % 6) + 6) % 6;
  if (offset === 0 || offset === 1) return 'front';
  if (offset === 3 || offset === 4) return 'rear';
  return 'flank'; // offset 2 or 5
}
