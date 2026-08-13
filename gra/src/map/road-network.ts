/**
 * map/road-network.ts — SIEĆ DRÓG: maska 6 bitów sąsiedztwa + porty na ściankach heksa.
 * (temat R-DROGA-WZOR-6-RAMION, zlecenie Macieja 2026-08-14)
 *
 * ZASADA (dokument designerski właściciela): każde ramię drogi kończy się DOKŁADNIE
 * w połowie ścianki heksa. Heks ma 6 ścianek → 6 portów → pełny wzór to sześcioramienna
 * gwiazda. Port kafla i port sąsiada to TEN SAM punkt na wspólnej krawędzi, więc szew
 * jest niewidoczny bez żadnego dopasowywania grafiki. Nie ma „wariantów obrotu": rysuje
 * się jedno ramię na każdy AKTYWNY kierunek (kierunek aktywny = sąsiad ma drogę).
 * 64 kombinacje bitów = 13 kształtów po obrocie, ale kod NIE potrzebuje tabeli kształtów —
 * składa ramiona wprost z bitów.
 * / EN: every road arm ends exactly at an edge midpoint of the hex. Six edges → six ports →
 * the full pattern is a six-armed star. A tile's port and its neighbour's port are the SAME
 * point on the shared edge, so the seam is invisible with no art matching. No "rotation
 * variants": one arm per active direction (active = that neighbour has a road). 64 bit
 * combinations = 13 shapes up to rotation, but the code needs no shape table — it composes
 * arms straight from the bits.
 *
 * Moduł jest CZYSTY (zero importów, zero THREE) — geometrię 3D buduje z niego
 * render/droga-6-ramion.ts, a maskę wylicza main.ts przy (prze)budowie mesha heksa.
 * Dzięki temu cały algorytm da się objąć testem w Node (tools/road-connectivity-test.cjs).
 * / EN: pure module (no imports, no THREE) so the whole algorithm is testable in Node.
 */

/**
 * Sześć kierunków aksjalnych — KOLEJNOŚĆ JEST KONTRAKTEM: indeks kierunku = numer bitu
 * w masce. Identyczna kolejność co HEX_DIRECTIONS (map/gen-helpers.ts) i AXIAL_DIRS
 * (render/scene.ts); test road-connectivity-test.cjs pilnuje tej zgodności.
 * / EN: the order IS the contract — direction index = bit number in the mask; identical to
 * HEX_DIRECTIONS / AXIAL_DIRS, asserted by the test.
 */
export const ROAD_DIRS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0], [+1, -1], [0, -1], [-1, 0], [-1, +1], [0, +1],
] as const;

/** Brak sąsiada z drogą. / EN: no road neighbour. */
export const ROAD_MASK_NONE = 0;
/** Pełna gwiazda — wszystkie 6 kierunków. / EN: full six-armed star. */
export const ROAD_MASK_FULL = 0b111111;

/** Węzeł (placyk na środku) rysuje się dopiero od TYLU ramion. / EN: node appears from this arm count up. */
export const ROAD_NODE_MIN_ARMS = 3;

/**
 * Proporcje z dokumentu designerskiego (heks 108×60 px, ramię 15 px, węzeł r=11 px).
 * Odniesieniem jest PROMIEŃ heksa (108 px = 2 × 54 px promienia), bo to jedyna wielkość
 * niezależna od orientacji: makieta jest flat-top spłaszczonym pionowo (perspektywa),
 * a silnik rysuje pointy-top (hexutil.ts). Ten sam hex, obrócony o 30° — więc przenosimy
 * proporcję do promienia, nie do „szerokości obrazka".
 * / EN: ratios from the design doc, expressed against the hex CIRCUMRADIUS — the only
 * orientation-independent measure (the mockup is a vertically squashed flat-top hex, the
 * engine draws pointy-top; same hex rotated 30°).
 */
export const ROAD_ARM_WIDTH_RATIO = 15 / 54;    // ≈ 0.278 × HEX_R
export const ROAD_NODE_RADIUS_RATIO = 11 / 54;  // ≈ 0.204 × HEX_R

const SQRT3 = Math.sqrt(3);

/** Bit maski dla kierunku 0-5. / EN: mask bit for direction 0-5. */
export function roadDirBit(dir: number): number {
  return 1 << dir;
}

/** Czy w masce ustawiony jest kierunek `dir`. / EN: is direction `dir` set in the mask. */
export function roadMaskHasDir(mask: number, dir: number): boolean {
  return (mask & roadDirBit(dir)) !== 0;
}

/**
 * Maska 6 bitów dla heksa (q,r): bit i = sąsiad w kierunku ROAD_DIRS[i] MA drogę.
 * `hasRoadAt` odpytuje stan mapy — dowolny typ drogi liczy się tak samo (patrz uwaga
 * o typach niżej przy roadHexesToRefresh).
 * / EN: 6-bit mask — bit i set when the neighbour in direction i has a road.
 */
export function computeRoadMask(
  q: number,
  r: number,
  hasRoadAt: (q: number, r: number) => boolean,
): number {
  let mask = 0;
  for (let i = 0; i < ROAD_DIRS.length; i++) {
    const [dq, dr] = ROAD_DIRS[i]!;
    if (hasRoadAt(q + dq, r + dr)) mask |= roadDirBit(i);
  }
  return mask;
}

/** Indeksy aktywnych kierunków (= ramion do narysowania). / EN: active direction indices (= arms to draw). */
export function roadMaskArms(mask: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < ROAD_DIRS.length; i++) {
    if (roadMaskHasDir(mask, i)) out.push(i);
  }
  return out;
}

/** Liczba ramion (popcount maski). / EN: arm count (mask popcount). */
export function roadArmCount(mask: number): number {
  let n = 0;
  for (let i = 0; i < ROAD_DIRS.length; i++) {
    if (roadMaskHasDir(mask, i)) n++;
  }
  return n;
}

/**
 * Czy rysować węzeł (środkowy placyk). Kanon właściciela: TYLKO przy 3+ ramionach —
 * przy 1-2 droga jest zwykłym przejazdem bez węzła.
 * / EN: draw the central node only at 3+ arms; 1-2 arms is a plain pass-through.
 */
export function roadMaskHasNode(mask: number): boolean {
  return roadArmCount(mask) >= ROAD_NODE_MIN_ARMS;
}

/**
 * Kafel z drogą, ale BEZ ani jednego sąsiada z drogą (maska 0). Ramion nie ma (kontrakt
 * roadMaskArms), więc render sam z siebie narysowałby PUSTKĘ — gracz właśnie wydał Pracę
 * i nie zobaczyłby nic. DECYZJA OPERATORA (nie ma tego w dokumencie designerskim):
 * w takim wypadku rysujemy sam placyk nawierzchni, który znika w chwili, gdy dojdzie
 * pierwszy sąsiad z drogą. Predykat jest tu, a nie w renderze, żeby dało się go objąć testem.
 * / EN: a road tile with no road neighbour (mask 0) has no arms, so the renderer would draw
 * NOTHING right after the player paid Work for it. Operator decision (not in the design doc):
 * draw a bare surface patch instead; it disappears as soon as a neighbour connects.
 */
export function roadMaskIsLonePatch(mask: number): boolean {
  return roadArmCount(mask) === 0;
}

/**
 * Przesunięcie portu (środka ścianki) względem środka heksa, w jednostkach świata Three.js.
 * Wyprowadzone z axialToWorld (render/hexutil.ts): sąsiad (dq,dr) leży o
 * (√3·(dq + dr/2)·R, 1.5·dr·R), więc POŁOWA tego wektora to dokładnie środek wspólnej
 * ścianki. Długość zawsze = R·√3/2 (promień wpisany pointy-top) — sprawdzane testem.
 * / EN: port offset (edge midpoint) in Three.js world units, derived from axialToWorld:
 * half the vector to the neighbour IS the shared edge midpoint. Length always R·√3/2.
 */
export function roadPortOffset(dir: number, hexR = 1): { x: number; z: number } {
  const [dq, dr] = ROAD_DIRS[dir] ?? [0, 0];
  return {
    x: SQRT3 * (dq + dr / 2) * hexR * 0.5,
    z: 1.5 * dr * hexR * 0.5,
  };
}

/** Obrót wokół Y, po którym lokalna oś +X ramienia celuje w port `dir`. / EN: Y rotation aiming local +X at port `dir`. */
export function roadPortRotationY(dir: number): number {
  const p = roadPortOffset(dir, 1);
  return Math.atan2(-p.z, p.x);
}

/** Długość ramienia = odległość środek → port = R·√3/2. / EN: arm length = centre-to-port = R·√3/2. */
export function roadArmLength(hexR = 1): number {
  return (SQRT3 / 2) * hexR;
}

/**
 * Kafle, których MASKA zmienia się po postawieniu/zburzeniu drogi na (q,r) — czyli te,
 * które trzeba przerenderować. To sam heks + KAŻDY jego sąsiad, który ma drogę (bo każdy
 * taki sąsiad zyskuje/traci bit w stronę (q,r)). Nigdy cała mapa.
 * `hasRoadAt` odpytuje stan JUŻ PO zmianie.
 *
 * Typowy przypadek z dokumentu — dociąganie drogi do istniejącej sieci jednym stykiem —
 * to dokładnie 2 kafle (siebie + ten sąsiad). Gdy nowy odcinek styka się z k sieciami
 * naraz, kafli jest 1+k; wersja „zawsze 2" zostawiłaby pozostałym sąsiadom nieaktualną
 * maskę (brakujące ramię w stronę nowej drogi).
 * / EN: tiles whose mask changes when a road is built/removed at (q,r): the tile itself plus
 * every neighbour that has a road. One contact = exactly 2 tiles (the doc's case); k contacts
 * = 1+k, because a hard-coded "always 2" would leave the other neighbours with a stale mask.
 */
export function roadHexesToRefresh(
  q: number,
  r: number,
  hasRoadAt: (q: number, r: number) => boolean,
): Array<{ q: number; r: number }> {
  const out: Array<{ q: number; r: number }> = [{ q, r }];
  for (const [dq, dr] of ROAD_DIRS) {
    const nq = q + dq;
    const nr = r + dr;
    if (hasRoadAt(nq, nr)) out.push({ q: nq, r: nr });
  }
  return out;
}
