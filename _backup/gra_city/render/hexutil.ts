/**
 * hexutil.ts
 * Konwersja współrzędnych aksjalnych (q, r) → pozycja świata Three.js.
 *
 * Konwencja: POINTY-TOP hex, promień zewnętrzny R.
 *
 * Wzory (standardowe pointy-top axial→world):
 *   world_x = R * sqrt(3) * (q + r/2)
 *   world_z = R * 1.5     * r
 *
 * Sprawdzenie kafelkowania:
 *   Sąsiad (+1, 0): Δx = R*sqrt(3), Δz = 0
 *   Sąsiad (0, +1): Δx = R*sqrt(3)/2, Δz = R*1.5
 *   Odległość: sqrt((R*sqrt(3))²+(R*1.5)²) = R*sqrt(3+2.25) = R*2.2913... — przekątna
 *   Krawędź lewo-prawa (q±1): odl. między środkami = R*sqrt(3) ✓ (szerokość hex)
 *   Krawędź góra-dół (r±1):  odl. między środkami = R*1.5*2... nie, Δz = R*1.5,
 *     ale środki sąsiadują krawędzią długości R, odl. między środkami = R*sqrt(3)
 *     dla sąsiadów q±1 i R*sqrt(3) dla (q,r+1) gdy wyrównane → sprawdzamy:
 *     dist((0,0),(1,0)) = R*sqrt(3) = szerokość hexa (środek do środka przez krawędź boczną)
 *     dist((0,0),(0,1)) = sqrt((R*sqrt(3)/2)²+(R*1.5)²) = sqrt(0.75R²+2.25R²) = sqrt(3)*R
 *   Oba sąsiedztwa mają tę samą odległość środków = R*sqrt(3) → kafelkowanie bez szczelin. ✓
 */

export const HEX_R = 1.0; // promień zewnętrzny (wierzchołek)

export const SQRT3 = Math.sqrt(3);

/**
 * Konwertuje współrzędne aksjalne (q, r) na pozycję XZ w świecie Three.js.
 * Y = 0 (wysokość ustalana osobno przez renderer).
 */
export function axialToWorld(q: number, r: number, R = HEX_R): { x: number; z: number } {
  const x = R * SQRT3 * (q + r * 0.5);
  const z = R * 1.5   * r;
  return { x, z };
}

/**
 * Zwraca środek całej siatki (q in [0,W), r in [0,H)) w world space.
 */
export function mapCenter(width: number, height: number, R = HEX_R): { x: number; z: number } {
  const cx = (width  - 1) / 2;
  const cy = (height - 1) / 2;
  return axialToWorld(cx, cy, R);
}
