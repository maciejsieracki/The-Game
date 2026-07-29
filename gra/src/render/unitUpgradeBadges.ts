/**
 * unitUpgradeBadges.ts
 *
 * ODZNAKI ULEPSZEŃ BUDYNKOWYCH na żetonie jednostki na mapie — układ „Total War”
 * (decyzja właściciela Maciej, C-OBCE-JEDN-Q2, 2026-07-29).
 *
 * ── CO SIĘ ZMIENIŁO WZGLĘDEM POPRZEDNIEJ WERSJI (i dlaczego) ──────────────
 * STARY MODEL (2026-07-25, pytanie 57): jedna wspólna odznaka liczona z SUMY
 * obu ścieżek (0–95 pp), rysowana jako metalowy kołnierz u podstawy żetonu +
 * 1–3 kule przed stopami figurki. Gracz widział „jak mocno ulepszona”, ale NIE
 * widział CZYM — Kuźnią (Pancerz) czy Koszarami (Parametry).
 * NOWY MODEL (ta wersja): DWIE NIEZALEŻNE odznaki, po jednej na ścieżkę,
 * wpięte w ten sam rządek nad głową figurki co gwiazdki weterana:
 *
 *        [ikona KOSZAR]   ★ ★ ★   [ikona KUŹNI]
 *         ścieżka B      weteran    ścieżka A
 *        (Parametry)               (Pancerz)
 *
 * Kołnierz u podstawy i kule ZNIKNĘŁY całkowicie. Poziomy 1/2/3 liczone są
 * OSOBNO DLA KAŻDEJ ŚCIEŻKI (game/unit-building-bonuses.ts::armorPathBadgeLevel
 * / softPathBadgeLevel) — sumowanie obu ścieżek w jedną liczbę jest w tym
 * module MARTWE i nie wolno go przywracać.
 *
 * ── IKONY: PRAWDZIWE SYMBOLE BUDYNKÓW Z BRAND-BOOKA ───────────────────────
 * KOREKTA WŁAŚCICIELA (Maciej, 2026-07-29, po obejrzeniu zrzutów pierwszej
 * wersji): „same symbole kuźni i koszar niezbyt mi się podobają, masz konkretne
 * ikony i symbole tych dwóch budynków. Użyj je tylko po prostu będą różne
 * kolory i tyle”.
 * Pierwsza wersja rysowała WŁASNE bryły 3D (kowadło i budynek z okapem) jako
 * ExtrudeGeometry — zostały USUNIĘTE. Teraz odznaka to sprite z kanwy, na której
 * rasteryzujemy oryginalne ikony brand-booka:
 *   ui/icons/brand/buildings/bld-koszary.svg → ŚCIEŻKA B (Parametry)
 *   ui/icons/brand/buildings/bld-kuznia.svg  → ŚCIEŻKA A (Pancerz)
 * czyli DOKŁADNIE te symbole, które gracz widzi w panelu miasta przy tych
 * budynkach. Jeden słownik znaków w całej grze.
 *
 * ── ROZRÓŻNIENIE POZIOMU: WYŁĄCZNIE KOLOR ────────────────────────────────
 * Ten sam kształt ikony na wszystkich trzech poziomach, zmienia się tylko barwa:
 * BRĄZ / SREBRO / ZŁOTO (PATH_BADGE_COLOR). To wprost decyzja właściciela
 * („po prostu będą różne kolory i tyle”) — żadnego drugiego sygnału poziomu.
 * Kolor niesie płytka: obwódka zaokrąglonego kwadratu ORAZ kreska samej ikony
 * mają ten sam odcień, więc barwa czyta się nawet wtedy, gdy detal ikony
 * zlewa się przy oddalonej kamerze.
 *
 * ── ODRÓŻNIENIE OD GWIAZDEK WETERANA ─────────────────────────────────────
 * Oba systemy stoją w jednym rządku, więc rozróżnienie musi być mocne:
 *   1. POZYCJA — gwiazdki ZAWSZE w środku; ikony ulepszeń ZAWSZE po bokach
 *      (Koszary lewo, Kuźnia prawo), nigdy w środku.
 *   2. KSZTAŁT — weteran to pełna, wypełniona pięcioramienna GWIAZDA (bryła 3D);
 *      ulepszenia to KRESKOWE ikony budynków w ciemnej, zaokrąglonej płytce.
 *      Inna technika rysowania, inny obrys, zero wspólnych elementów.
 *   3. ODCIEŃ I TŁO — złoto weterana to jasny, blady żółty 0xFFD24A na czystym
 *      tle terenu; złoto odznaki to bursztyn 0xF2A81C osadzony w CIEMNEJ,
 *      niemal czarnej płytce, więc cała odznaka czyta się jako ciemny kafelek
 *      z jasną obwódką, a nigdy jako jasna plama w kształcie gwiazdy.
 *
 * ── PARYTET AI ────────────────────────────────────────────────────────────
 * Żadna funkcja tego modułu nie zna pojęcia `ownerId` — żeton AI, miasta-państwa
 * i barbarzyńców dostaje odznaki dokładnie tak samo jak żeton gracza.
 *
 * ── ZASOBY ────────────────────────────────────────────────────────────────
 * Tekstury i materiały są cache'owane PER (IKONA, POZIOM) — maksymalnie
 * 2 ikony × 3 poziomy = 6 tekstur na CAŁĄ GRĘ, niezależnie od liczby jednostek
 * na mapie. Per żeton powstaje wyłącznie obiekt THREE.Sprite, który nie posiada
 * ani geometrii, ani materiału na własność. Dlatego NIC nie trafia do
 * group.userData['mats'] ani ['perTokenGeos'] — te dwie tablice niszczy
 * UnitRenderer._disposeToken (units.ts) przy usuwaniu POJEDYNCZEGO żetonu,
 * a wpisanie tam współdzielonej tekstury skasowałoby odznaki WSZYSTKICH
 * pozostałych jednostek na mapie.
 *
 * ── ŹRÓDŁO SVG: WSTRZYKIWANE, NIE IMPORTOWANE ────────────────────────────
 * Tak samo jak w render/unitOwnerEmblem.ts: ui/icons/brandAssets.ts wciąga
 * assety przez `import.meta.glob` i `?raw`, czyli mechanizmy dostępne TYLKO
 * w buildzie Vite, a katalog render/ jest bundlowany także esbuildem
 * (tools/build-*-preview.cjs). Bezpośredni import wywala te harnessy już przy
 * ewaluacji modułu. Dlatego SVG podaje kompozytor aplikacji (main.ts) przez
 * `setUnitUpgradeBadgeAssets()`. Bez wstrzykniętego źródła odznaka nadal
 * działa — zostaje sama płytka z obwódką w kolorze poziomu (fallback bez wyjątku).
 *
 * ── CZYTELNOŚĆ POD KĄTEM KAMERY GRY (52°) ─────────────────────────────────
 * Ikony są sprite'ami, więc zawsze stoją przodem do kamery — bez skrótu
 * perspektywicznego i bez potrzeby odchylania płytki (gwiazdki weterana, jako
 * bryły 3D, nadal używają BADGE_ROW_TILT_RAD). Kreska ikon brand-booka jest
 * pogrubiana ×ICON_STROKE_BOOST przy rasteryzacji, bo oryginał jest rysowany
 * pod 24 px w UI, a tu schodzi do kilkunastu pikseli na ekranie.
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';
import {
  armorPathBadgeLevel,
  softPathBadgeLevel,
  type UnitBuildingProgress,
  type UnitPathBadgeLevel,
} from '../game/unit-building-bonuses';
import { veteranStarCount, type VeteranProgress } from '../game/veteran';
import { loadImageInto, prepareSvgForCanvas, svgToDataUri } from './unitOwnerEmblem';

// ---------------------------------------------------------------------------
// Model poziomu (progi i wyprowadzenie: game/unit-building-bonuses.ts)
// ---------------------------------------------------------------------------

/** Poziom odznaki JEDNEJ ścieżki: 0 = brak ikony, 1–3 = brąz / srebro / złoto. */
export type UpgradeBadgeLevel = UnitPathBadgeLevel;

/**
 * Kolor odznaki wg poziomu — ten sam dla obu ścieżek (ścieżkę rozpoznaje się
 * IKONĄ BUDYNKU i STRONĄ rządka; kolor niesie wyłącznie „jak wysoko”).
 *   1 — brąz   (ciemna miedź)
 *   2 — srebro (jasny, chłodny)
 *   3 — złoto  (nasycony bursztyn — celowo ciemniejszy i bardziej pomarańczowy
 *       niż blade złoto gwiazdki weterana 0xFFD24A)
 */
export const PATH_BADGE_COLOR: Readonly<Record<1 | 2 | 3, number>> = {
  1: 0xb9762e,
  2: 0xd6e2ee,
  3: 0xf2a81c,
};

/** Ten sam kolor jako string CSS — kanwa rysuje w 2D, nie przez THREE.Color. */
function badgeColorCss(level: 1 | 2 | 3): string {
  return '#' + PATH_BADGE_COLOR[level].toString(16).padStart(6, '0');
}

/** Etykieta poziomu do UI/tooltipu (poziom 0 = pusty string). */
export const PATH_BADGE_LABEL: Readonly<Record<1 | 2 | 3, string>> = {
  1: 'Ulepszenie I (brąz)',
  2: 'Ulepszenie II (srebro)',
  3: 'Ulepszenie III (złoto)',
};

export function pathBadgeLabel(level: UpgradeBadgeLevel): string {
  return level === 0 ? '' : PATH_BADGE_LABEL[level];
}

// ---------------------------------------------------------------------------
// UKŁAD RZĄDKA NAD GŁOWĄ — jedno źródło prawdy dla obu modułów odznak
//
// Ten moduł jest właścicielem geometrii CAŁEGO rządka (wysokość, promień i
// rozstaw gwiazdek, rozmiar ikon), a render/unitVeteranBadges.ts importuje
// stąd stałe gwiazdek. Kierunek zależności jest JEDNOSTRONNY
// (unitVeteranBadges → unitUpgradeBadges), więc nie ma cyklu importów.
// ---------------------------------------------------------------------------

/**
 * Wysokość całego rządka nad środkiem żetonu. Figurki mają ~0,75·HEX_R
 * wysokości, więc 0,92·HEX_R jest wyraźnie NAD GŁOWĄ; jest też wyżej niż
 * czaszka głodu (0,78·HEX_R) i badge stosu (0,55·HEX_R) — zero kolizji
 * z istniejącymi elementami żetonu.
 */
export const VETERAN_BADGE_RESERVED_Y = 0.92 * HEX_R;

/** Promień zewnętrzny (ramię) gwiazdki weterana. */
export const VETERAN_STAR_R = 0.072 * HEX_R;
/** Rozstaw gwiazdek weterana w osi X. */
export const VETERAN_STAR_SPACING = 0.158 * HEX_R;
/** Powiększenie ciemnej gwiazdy-obwódki (kontrast niezależny od koloru terenu). */
export const VETERAN_STAR_OUTLINE_SCALE = 1.30;

/**
 * Odchylenie brył 3D rządka do tyłu = elewacja kamery gry (render/camera.ts: 52°).
 * Dotyczy WYŁĄCZNIE gwiazdek weterana — ikony ulepszeń są sprite'ami i zawsze
 * same ustawiają się przodem do kamery.
 */
export const BADGE_ROW_TILT_RAD = THREE.MathUtils.degToRad(52);

/** Bok sprite'a ikony ulepszenia w jednostkach świata (HEX_R = 1.0). */
const ICON_SPRITE_SIZE = 0.24 * HEX_R;
/** Połowa boku — używana w rachunku pozycji X. */
const ICON_HALF_W = ICON_SPRITE_SIZE / 2;
/** Odstęp między skrajną gwiazdką (z obwódką) a krawędzią ikony. */
const ICON_GAP = 0.050 * HEX_R;
/** Wysunięcie ikon w stronę kamery, żeby nie przecinały się z bryłami gwiazdek. */
const ICON_Z = 0.030 * HEX_R;
/**
 * Kolejność rysowania: wyżej niż badge stosu (10), niżej niż medalion
 * właściciela (14) i czaszka głodu (15).
 */
const ICON_RENDER_ORDER = 13;

/** Bok kanwy ikony w pikselach (potęga dwójki — czysty mipmapping). */
const CANVAS_PX = 128;
/**
 * Pogrubienie kreski ikony brand-booka przy rasteryzacji. Oryginał ma
 * stroke-width 1,5 przy viewBox 24 i jest projektowany na 24 px w UI; sprite
 * na mapie schodzi do kilkunastu pikseli, więc bez pogrubienia kreska znika.
 * Wartość dobrana PO OGLĘDZINACH ZRZUTU z oddalonej kamery mapy.
 */
const ICON_STROKE_BOOST = 1.6;
/** Bok rysunku ikony na kanwie (reszta to margines płytki). */
const ICON_DRAW_PX = 92;

/**
 * Półszerokość zajęta przez gwiazdki weterana wraz z ich ciemnymi obwódkami.
 * `starCount` = 0 (Rekrut, brak gwiazdek) → 0, wtedy ikony schodzą do środka
 * i rządek nadal wygląda jak jedna, zwarta listwa, a nie dwie osobne plamy.
 */
function starsHalfSpan(starCount: number): number {
  if (starCount <= 0) return 0;
  return ((starCount - 1) / 2) * VETERAN_STAR_SPACING + VETERAN_STAR_R * VETERAN_STAR_OUTLINE_SCALE;
}

/**
 * |X| środka ikony ulepszenia dla danej liczby gwiazdek weterana.
 *
 * Kontrola obrysu heksu (twardy limit półszerokości = cos30°·HEX_R = 0,866·HEX_R,
 * limit roboczy zadania = 0,70·HEX_R):
 *   3 gwiazdki: 0,158 + 0,072·1,30 = 0,2516 → |x| = 0,2516 + 0,050 + 0,120 = 0,4216
 *               skrajny punkt sprite'a: 0,4216 + 0,120 = 0,542·HEX_R  ✔
 *   2 gwiazdki: 0,079 + 0,0936 = 0,1726 → |x| = 0,3426 → skrajny 0,463·HEX_R  ✔
 *   0 gwiazdek: 0 → |x| = 0,170 → skrajny 0,290·HEX_R  ✔
 * Najszerszy przypadek 0,542·HEX_R mieści się w limicie roboczym 0,70·HEX_R.
 * Bok 0,24·HEX_R (a nie mniejszy) dobrany PO OGLĘDZINACH ZRZUTU z oddalonej
 * kamery mapy — przy 0,21 ikona schodziła do ~14 px i detal kreski się zlewał.
 */
function iconCenterX(starCount: number): number {
  return starsHalfSpan(starCount) + ICON_GAP + ICON_HALF_W;
}

// ---------------------------------------------------------------------------
// Źródło SVG — WSTRZYKIWANE (powód: patrz nagłówek)
// ---------------------------------------------------------------------------

/** Która ścieżka — decyduje o ikonie i o stronie rządka. */
type BadgePath = 'armor' | 'soft';

export interface UnitUpgradeBadgeAssets {
  /** brandIconSvg('bld-koszary') — ŚCIEŻKA B (Parametry), lewa strona rządka. */
  barracksSvg(): string;
  /** brandIconSvg('bld-kuznia') — ŚCIEŻKA A (Pancerz), prawa strona rządka. */
  forgeSvg(): string;
}

let assets: UnitUpgradeBadgeAssets | null = null;

/**
 * Podpina źródło ikon (main.ts woła to RAZ, przy starcie, zanim powstanie
 * pierwszy żeton). Cache jest przy tej okazji czyszczony, ale BEZ `dispose()` —
 * sprite'y już stojące na mapie nadal trzymają stare tekstury i muszą pozostać
 * żywe; nowe odznaki powstaną z nowego źródła.
 */
export function setUnitUpgradeBadgeAssets(src: UnitUpgradeBadgeAssets | null): void {
  if (assets === src) return;
  assets = src;
  assetByKey.clear();
}

// ---------------------------------------------------------------------------
// Kanwa odznaki: ciemna płytka + obwódka w kolorze poziomu + ikona budynku
// ---------------------------------------------------------------------------

/** Wypełnienie płytki — ciemne, żeby kreskowa ikona miała kontrast na każdym terenie. */
const PLATE_FILL = 'rgba(10,14,22,0.90)';

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Płytka odznaki. Rysowana ZAWSZE — także zanim SVG się wczyta i także wtedy,
 * gdy źródło ikon nie jest wstrzyknięte. To jest wymagany fallback: sama płytka
 * z obwódką w kolorze poziomu, bez rzucania wyjątku.
 */
function drawPlate(ctx: CanvasRenderingContext2D, level: 1 | 2 | 3): void {
  ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
  roundedRectPath(ctx, 7, 7, CANVAS_PX - 14, CANVAS_PX - 14, 24);
  ctx.fillStyle = PLATE_FILL;
  ctx.fill();
  ctx.strokeStyle = badgeColorCss(level);
  ctx.lineWidth = 9;
  ctx.stroke();
}

function drawIcon(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  const off = (CANVAS_PX - ICON_DRAW_PX) / 2;
  ctx.drawImage(img, off, off, ICON_DRAW_PX, ICON_DRAW_PX);
}

// ---------------------------------------------------------------------------
// Cache tekstur i materiałów — PER (IKONA, POZIOM), maks. 6 na całą grę
// ---------------------------------------------------------------------------

interface BadgeAsset {
  texture: THREE.CanvasTexture;
  material: THREE.SpriteMaterial;
}

const assetByKey = new Map<string, BadgeAsset>();

function getBadgeAsset(path: BadgePath, level: 1 | 2 | 3): BadgeAsset | null {
  const key = `${path}:${level}`;
  const cached = assetByKey.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_PX;
  canvas.height = CANVAS_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawPlate(ctx, level);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const asset: BadgeAsset = { texture, material };
  assetByKey.set(key, asset);

  if (!assets) return asset; // fallback: sama płytka z obwódką poziomu
  const raw = path === 'soft' ? assets.barracksSvg() : assets.forgeSvg();
  const svg = prepareSvgForCanvas(raw, badgeColorCss(level), ICON_STROKE_BOOST);
  if (!svg) return asset;
  loadImageInto(svgToDataUri(svg), (img) => {
    drawPlate(ctx, level);
    drawIcon(ctx, img);
    texture.needsUpdate = true;
  });
  return asset;
}

// ---------------------------------------------------------------------------
// Budowa / synchronizacja odznak na żetonie
// ---------------------------------------------------------------------------

/** Klucz w userData żetonu — spakowany stan rządka (do wczesnego wyjścia). */
const UD_STATE = 'upgBadgeRowState';
/** Klucz w userData żetonu — podgrupa z ikonami (do podmiany/usunięcia). */
const UD_GROUP = 'upgBadgeGroup';

/**
 * Spakowany stan rządka w JEDNĄ liczbę: poziom A (0–3), poziom B (0–3) i liczba
 * gwiazdek (0–3, wpływa na pozycję X ikon). Dzięki temu `sync` przy
 * niezmienionym stanie kończy się porównaniem jednej liczby.
 */
function packRowState(armor: UpgradeBadgeLevel, soft: UpgradeBadgeLevel, stars: number): number {
  return armor * 100 + soft * 10 + Math.max(0, Math.min(9, stars));
}

/** Sprite ikony danej ścieżki i poziomu, ustawiony na |x| = `x` (znak nadaje wołający). */
function addIcon(g: THREE.Group, path: BadgePath, level: 1 | 2 | 3, x: number): void {
  const asset = getBadgeAsset(path, level);
  if (!asset) return;
  const sprite = new THREE.Sprite(asset.material);
  sprite.center.set(0.5, 0.5);
  sprite.scale.set(ICON_SPRITE_SIZE, ICON_SPRITE_SIZE, 1);
  sprite.position.set(x, 0, ICON_Z);
  sprite.renderOrder = ICON_RENDER_ORDER;
  g.add(sprite);
}

/**
 * Buduje podgrupę odznak ulepszeń: ikona Koszar po LEWEJ (−X) i/lub ikona Kuźni
 * po PRAWEJ (+X) od środka rządka. Ikona ścieżki o poziomie 0 nie powstaje.
 * Grupa NIE jest obracana (sprite'y same celują w kamerę) i nie posiada
 * NICZEGO na własność — tekstury i materiały są współdzielone.
 */
function buildBadgeRowGroup(
  armorLevel: UpgradeBadgeLevel,
  softLevel: UpgradeBadgeLevel,
  starCount: number,
): THREE.Group {
  const g = new THREE.Group();
  g.name = 'upgradeBadgeRow';
  g.position.y = VETERAN_BADGE_RESERVED_Y;

  const x = iconCenterX(starCount);
  // ŚCIEŻKA B (Parametry) — Koszary, ZAWSZE po lewej.
  if (softLevel !== 0) addIcon(g, 'soft', softLevel, -x);
  // ŚCIEŻKA A (Pancerz) — Kuźnia, ZAWSZE po prawej.
  if (armorLevel !== 0) addIcon(g, 'armor', armorLevel, +x);
  return g;
}

/**
 * Doprowadza odznaki ulepszeń na żetonie do zadanego stanu.
 * IDEMPOTENTNA i tania — przy niezmienionym stanie kończy się porównaniem
 * jednej liczby (wołana z UnitRenderer.sync() dla każdej jednostki w każdej
 * klatce synchronizacji).
 *
 * `starCount` służy WYŁĄCZNIE do wyliczenia pozycji X ikon (żeby nie nachodziły
 * na gwiazdki weterana) — same gwiazdki rysuje render/unitVeteranBadges.ts.
 *
 * PARYTET AI: brak jakiegokolwiek warunku na właściciela.
 */
export function applyUnitUpgradeBadgeRow(
  group: THREE.Object3D,
  armorLevel: UpgradeBadgeLevel,
  softLevel: UpgradeBadgeLevel,
  starCount: number,
): void {
  const state = packRowState(armorLevel, softLevel, starCount);
  if (group.userData[UD_STATE] === state) return;
  const old = group.userData[UD_GROUP] as THREE.Group | undefined;
  if (old) {
    group.remove(old);
    delete group.userData[UD_GROUP];
  }
  group.userData[UD_STATE] = state;
  if (armorLevel === 0 && softLevel === 0) return;
  const badge = buildBadgeRowGroup(armorLevel, softLevel, starCount);
  group.add(badge);
  group.userData[UD_GROUP] = badge;
}

/**
 * Wejście dla renderera mapy: policz OBA poziomy ścieżek (osobno!) oraz liczbę
 * gwiazdek weterana z pól jednostki i zaktualizuj żeton.
 *
 * Liczba gwiazdek liczona jest TĄ SAMĄ funkcją co w unitVeteranBadges.ts
 * (game/veteran.ts::veteranLevel + veteranStars), żeby pozycja ikon nigdy nie
 * rozjechała się z faktyczną szerokością listwy gwiazdek. Poziom 1 (Rekrut)
 * nie ma gwiazdek — wtedy liczymy 0.
 */
export function syncUnitUpgradeBadges(
  group: THREE.Object3D,
  unit: (UnitBuildingProgress & VeteranProgress) | null | undefined,
): void {
  const stars = veteranStarCount(unit);
  applyUnitUpgradeBadgeRow(group, armorPathBadgeLevel(unit), softPathBadgeLevel(unit), stars);
}

/**
 * Zwalnia współdzielone tekstury/materiały modułu — TYLKO dla podglądów i
 * testów, które niszczą cały kontekst WebGL. Gra nigdy tego nie woła
 * (zasoby żyją tyle co scena).
 */
export function disposeUnitUpgradeBadgeResources(): void {
  for (const { texture, material } of assetByKey.values()) {
    texture.dispose();
    material.dispose();
  }
  assetByKey.clear();
}
