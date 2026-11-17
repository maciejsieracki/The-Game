/**
 * battleCommanderStar.ts
 *
 * Jasna, złota gwiazdka nad jednostką będącą GENERAŁEM (wodzem armii) na polu
 * bitwy taktycznej -- po obu stronach. Zgłoszenie właściciela 2026-11-16:
 * „na polu bitwy generał powinien się jakoś wyróżniać, powiem jasną gwiazdkę,
 * bo nie wiadomo kto jest generałem".
 *
 * Zasady:
 *   - źródło prawdy: `BattleUnit.isArmyCommander` (ustawiane w main.ts z
 *     `RuntimeUnit.isGeneral`); zwykłe jednostki i armia bez generała -- brak znacznika;
 *   - znacznik jest DZIECKIEM grupy jednostki (ru.group), więc podąża za nią przy
 *     ruchu i ucieczce, a znika razem z grupą (śmierć: group.visible=false,
 *     usunięcie z sceny: scene.remove);
 *   - jest niezależny od przełącznika „Paski HP / Morale" (nie chowa się razem z paskami);
 *   - Sprite zawsze zwrócony do kamery; depthTest wyłączony, żeby był widoczny
 *     na każdym terenie; NIE przechwytuje kliknięć (raycast no-op);
 *   - gwiazdka jest wspólna dla obu stron (złota wypełniona, ciemny obrys) --
 *     barwa strony zostaje na pasku i na żetonie, a nie na gwiazdce, żeby znak
 *     „generał" był czytelny na każdym tle.
 *
 * Moduł czysto renderowy (THREE + tekstura DataTexture generowana z kodu,
 * bez canvas/DOM), więc działa w testach węzła i w przeglądarce. Nie zmienia
 * żadnej reguły bitwy, walki ani balansu.
 */
import * as THREE from 'three';

/** Nazwa węzła znacznika (używana przez testy i przy odnajdywaniu). */
export const BATTLE_COMMANDER_STAR_NAME = 'battleCommanderStar';

/** Bok sprite'a w jednostkach świata (zbliżony do szerokości paska HP). */
export const BATTLE_COMMANDER_STAR_SIZE = 0.26;

/** Kolory: złota wypełniona gwiazdka z ciemnym obrysem. */
const STAR_FILL_RGB: readonly [number, number, number] = [255, 216, 74];
const STAR_OUTLINE_RGB: readonly [number, number, number] = [58, 35, 0];

const TEX_SIZE = 64;
const SUPERSAMPLE = 2;

type CommanderLike = {
  isArmyCommander?: boolean;
  dead?: boolean;
  removed?: boolean;
};

/**
 * Czy jednostka ma nieść znacznik generała. Jedyne kryterium: żywy wódz armii.
 * (`isArmyCommander === true` -- brak pola = zwykła jednostka.)
 */
export function isBattleCommanderStarTarget(unit: CommanderLike): boolean {
  return unit.isArmyCommander === true && unit.dead !== true && unit.removed !== true;
}

/** Id jednostek z armii, które dostają gwiazdkę (kolejność wejścia zachowana). */
export function battleCommanderStarIds(
  units: readonly ({ id: string } & CommanderLike)[],
): string[] {
  return units.filter(isBattleCommanderStarTarget).map(u => u.id);
}

/** Punkt w wielokącie (reguła parzystości), współrzędne w [0,1]. */
function pointInPolygon(px: number, py: number, poly: readonly (readonly [number, number])[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i] as readonly [number, number];
    const [xj, yj] = poly[j] as readonly [number, number];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Pięcioramienna gwiazda o środku (0.5,0.5) i promieniu `r` (w [0,1]). */
function starPolygon(r: number): [number, number][] {
  const pts: [number, number][] = [];
  const rInner = r * 0.42;
  for (let k = 0; k < 10; k++) {
    const rad = k % 2 === 0 ? r : rInner;
    const ang = -Math.PI / 2 + (k * Math.PI) / 5;
    pts.push([0.5 + rad * Math.cos(ang), 0.5 + rad * Math.sin(ang)]);
  }
  return pts;
}

let cachedStarTexture: THREE.DataTexture | null = null;

/**
 * Tekstura gwiazdki rysowana z kodu (bez canvas). Raz na sesję modułu.
 * Obrys = różnica między gwiazdą pełną a pomniejszoną.
 */
export function getBattleCommanderStarTexture(): THREE.DataTexture {
  if (cachedStarTexture) return cachedStarTexture;
  const outer = starPolygon(0.5);
  const inner = starPolygon(0.5 * 0.74);
  const data = new Uint8Array(TEX_SIZE * TEX_SIZE * 4);
  const sub = SUPERSAMPLE;
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      let fill = 0;
      let line = 0;
      for (let sy = 0; sy < sub; sy++) {
        for (let sx = 0; sx < sub; sx++) {
          const px = (x + (sx + 0.5) / sub) / TEX_SIZE;
          const py = (y + (sy + 0.5) / sub) / TEX_SIZE;
          if (pointInPolygon(px, py, inner)) fill++;
          else if (pointInPolygon(px, py, outer)) line++;
        }
      }
      const n = sub * sub;
      const idx = (y * TEX_SIZE + x) * 4;
      const cover = (fill + line) / n;
      if (fill > 0 && fill >= line) {
        data[idx] = STAR_FILL_RGB[0];
        data[idx + 1] = STAR_FILL_RGB[1];
        data[idx + 2] = STAR_FILL_RGB[2];
      } else {
        data[idx] = STAR_OUTLINE_RGB[0];
        data[idx + 1] = STAR_OUTLINE_RGB[1];
        data[idx + 2] = STAR_OUTLINE_RGB[2];
      }
      data[idx + 3] = Math.round(cover * 255);
    }
  }
  const tex = new THREE.DataTexture(data, TEX_SIZE, TEX_SIZE, THREE.RGBAFormat);
  tex.needsUpdate = true;
  cachedStarTexture = tex;
  return tex;
}

/**
 * Dokłada znacznik generała jako dziecko grupy jednostki (ru.group), o ile
 * jednostka jest celem (`isBattleCommanderStarTarget`). Zwraca utworzony
 * sprite albo null (zwykła jednostka -- nic nie dodaje).
 *
 * `localY` = wysokość środka gwiazdki nad punktem stania jednostki (w
 * układzie grupy), dobrana przez battleScene tak, by leżała nad słupkiem
 * z flagą i paskami.
 */
export function attachBattleCommanderStar(
  group: THREE.Group,
  unit: CommanderLike,
  localY: number,
): THREE.Sprite | null {
  if (!isBattleCommanderStarTarget(unit)) return null;
  const material = new THREE.SpriteMaterial({
    map: getBattleCommanderStarTexture(),
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = BATTLE_COMMANDER_STAR_NAME;
  sprite.position.set(0, localY, 0);
  sprite.scale.set(BATTLE_COMMANDER_STAR_SIZE, BATTLE_COMMANDER_STAR_SIZE, 1);
  sprite.renderOrder = 10;
  // Znacznik nie może przechwytywać kliknięć w jednostkę ani w teren.
  sprite.raycast = () => {};
  group.add(sprite);
  return sprite;
}
