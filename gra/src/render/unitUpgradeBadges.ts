/**
 * unitUpgradeBadges.ts
 *
 * ODZNAKI ULEPSZEŃ BUDYNKOWYCH na żetonie jednostki na mapie
 * (decyzja właściciela Maciej, 2026-07-25, pytanie 57 = A + B jednocześnie:
 * „odznaki ulepszeń jednostek: kropki przy żetonie ORAZ kolorowa obwódka").
 *
 * ŹRÓDŁO DANYCH — dwie niezależne ścieżki z game/unit-building-bonuses.ts:
 *   ŚCIEŻKA A — Pancerz    (RuntimeUnit.pancerzBonusProc),   maks. +45 pp
 *               (kuznia 15 + kuznia_zelaza 15 + wielka_kuznia 15)
 *   ŚCIEŻKA B — Parametry  (RuntimeUnit.parametryBonusProc), maks. +50 pp
 *               (koszary 20 + akademia_wojskowa 20 + warsztat_oblezniczy 10)
 *   RAZEM maksimum osiągalne w grze: 45 + 50 = 95 punktów procentowych (pp).
 *
 * ── WYPROWADZENIE PROGÓW (nie zgadywane — z maksimum danych gry) ───────────
 * Żeton pokazuje JEDEN, zgrubny „poziom ulepszenia" (0–3). Rozbicie na
 * ścieżkę A i B zostaje w tooltipie (ui/hexContextTooltip.ts, ui/unitPanelHud.ts)
 * — na mapie liczy się odpowiedź „czy i jak mocno ta jednostka jest ulepszona".
 *
 * Suma obu ścieżek S = pancerzBonusProc + parametryBonusProc ∈ [0, 95] pp.
 * Trzy równe tercje zakresu [0, 95]:  95/3 = 31,67  →  granice 31,67 i 63,33
 * → zaokrąglone do liczb całkowitych pp: 31 i 63.
 *
 *   0 kropek — S = 0 pp                (żaden budynek wojskowy)
 *   1 kropka — 0 < S ≤ 31 pp           (dolna tercja; KAŻDA niezerowa premia
 *                                       daje co najmniej jedną kropkę — gracz
 *                                       musi widzieć nawet +10 pp z samego
 *                                       Warsztatu oblężniczego)
 *   2 kropki — 31 < S ≤ 63 pp          (środkowa tercja)
 *   3 kropki — S > 63 pp               (górna tercja, do maks. 95 pp)
 *
 * Kontrola na realnych kombinacjach budynków (weryfikacja, że progi nie
 * degenerują się do „wszystko na jednym poziomie"):
 *   koszary                                   20 pp → 1 kropka
 *   kuznia                                    15 pp → 1 kropka
 *   kuznia + koszary                          35 pp → 2 kropki
 *   kuznia + kuznia_zelaza + koszary          50 pp → 2 kropki
 *   kuznia+kuznia_zelaza + koszary+akademia   70 pp → 3 kropki
 *   pełny komplet 6 budynków                  95 pp → 3 kropki
 *
 * ── ODRÓŻNIENIE OD GWIAZDEK WETERANA (game/veteran.ts) ────────────────────
 * To DWA NIEZALEŻNE systemy i gracz nie może ich mylić. Stan na 2026-07-26:
 * gwiazdki weterana SĄ już rysowane — render/unitVeteranBadges.ts, dokładnie
 * w miejscu zarezerwowanym tu jako VETERAN_BADGE_RESERVED_Y (poniżej).
 * Rozróżnienie na trzech osiach naraz:
 *   1. POZYCJA — ulepszenia budynkowe siedzą PRZY PODSTAWIE żetonu (obwódka
 *      na ziemi + kropki przed stopami); gwiazdki weterana mają zarezerwowane
 *      miejsce NAD GŁOWĄ figurki. Żadnego kontaktu wizualnego.
 *   2. KSZTAŁT — kropki są KULAMI (gładka bryła obrotowa); weteran ma
 *      GWIAZDKI (ostre ramiona) — sylwetki nie do pomylenia nawet w zoomie out.
 *   3. KOLOR — ulepszenia to progresja METALI KUŹNI: brąz → stal → platyna
 *      (ciepły brąz, średni szary, jasna biel). Weteran jest ZŁOTY (★ w UI,
 *      veteranBadgeLabel). Złoto jest tu świadomie NIE UŻYWANE.
 * Paleta omija też wszystkie kolory graczy z OWNER_COLORS (units.ts): złoty,
 * czerwony, zielony, niebieski, pomarańczowy, fioletowy, morski, różowy —
 * brąz/szary/biel nie występują w tamtej palecie, więc obwódka ulepszenia nie
 * udaje obwódki właściciela.
 *
 * ── PARYTET AI ────────────────────────────────────────────────────────────
 * Żadna funkcja tego modułu nie zna pojęcia `ownerId` — żeton AI dostaje
 * odznaki dokładnie tak samo jak żeton gracza (gracz MA widzieć, że wroga
 * jednostka jest ulepszona).
 *
 * ── ZASOBY ────────────────────────────────────────────────────────────────
 * Geometrie i materiały to SINGLETONY MODUŁU (jedna geometria obwódki, jedna
 * geometria kropki, 3 materiały — po jednym na poziom). Nic nie jest tworzone
 * per żeton, więc NIC nie trafia do group.userData['mats'] / ['perTokenGeos']
 * (te tablice są niszczone przez UnitRenderer._disposeToken przy usuwaniu
 * żetonu — dopisanie tam singletonu zabiłoby odznaki wszystkich pozostałych
 * jednostek na mapie). Koszt na żeton: maks. 4 mesh / 288 trójkątów
 * (obwódka 48 + 3 kropki × 80).
 *
 * ── CZYTELNOŚĆ POD KĄTEM KAMERY GRY (52°) ─────────────────────────────────
 * Płaski pierścień na ziemi przy 52° elewacji jest mocno skrócony
 * perspektywicznie, dlatego obwódka NIE jest płaska — to niski kołnierz
 * WYCIĄGNIĘTY w pionie (UPG_RING_HEIGHT), który pokazuje kamerze pionową
 * ściankę, a nie samą górną krawędź. Kropki z tego samego powodu są uniesione
 * nad ziemię (kule, nie plamy) i stoją PRZED figurką (+Z = strona kamery,
 * pointy-top hex), więc nie chowa ich ani model, ani obwódka.
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';
import {
  unitPancerzBonusProc,
  unitParametryBonusProc,
  type UnitBuildingProgress,
} from '../game/unit-building-bonuses';

// ---------------------------------------------------------------------------
// Model poziomu
// ---------------------------------------------------------------------------

export type UpgradeBadgeLevel = 0 | 1 | 2 | 3;

/** Maksimum ścieżki A (Pancerz): kuznia 15 + kuznia_zelaza 15 + wielka_kuznia 15. */
export const UPGRADE_MAX_PANCERZ_PP = 45;
/** Maksimum ścieżki B (Parametry): koszary 20 + akademia_wojskowa 20 + warsztat_oblezniczy 10. */
export const UPGRADE_MAX_PARAMETRY_PP = 50;
/** Maksimum sumy obu ścieżek — podstawa podziału na tercje. */
export const UPGRADE_MAX_TOTAL_PP = UPGRADE_MAX_PANCERZ_PP + UPGRADE_MAX_PARAMETRY_PP; // 95

/**
 * Górne granice tercji sumy premii w punktach procentowych (pp):
 * ⌊95/3⌋ = 31 i ⌊2·95/3⌋ = 63. Trzecia tercja to wszystko powyżej 63 pp.
 */
export const UPGRADE_LEVEL_MAX_PP: readonly [number, number] = [
  Math.floor(UPGRADE_MAX_TOTAL_PP / 3),       // 31
  Math.floor((UPGRADE_MAX_TOTAL_PP * 2) / 3), // 63
];

/**
 * Poziom odznaki (= liczba kropek) z sumy obu ścieżek w pp.
 * Zero premii = poziom 0 = brak jakiejkolwiek odznaki (żeton wygląda jak dziś).
 */
export function upgradeBadgeLevelFromTotalPp(totalPp: number): UpgradeBadgeLevel {
  if (!Number.isFinite(totalPp) || totalPp <= 0) return 0;
  if (totalPp <= UPGRADE_LEVEL_MAX_PP[0]) return 1;
  if (totalPp <= UPGRADE_LEVEL_MAX_PP[1]) return 2;
  return 3;
}

/**
 * Poziom odznaki jednostki. Odczyt obu pól IDZIE PRZEZ funkcje
 * unit-building-bonuses.ts (wymóg tamtego modułu — normalizacja
 * undefined/NaN/wartości ujemnych ze starych zapisów do 0).
 */
export function upgradeBadgeLevelForUnit(unit: UnitBuildingProgress | null | undefined): UpgradeBadgeLevel {
  return upgradeBadgeLevelFromTotalPp(unitPancerzBonusProc(unit) + unitParametryBonusProc(unit));
}

/** Liczba kropek = poziom (0–3). Osobna nazwa, żeby czytelnie brzmiało w wywołaniach. */
export function upgradeBadgeDots(level: UpgradeBadgeLevel): number {
  return level;
}

/**
 * Kolor odznaki (obwódka i kropki mają ZAWSZE ten sam kolor — jeden odczyt
 * wzrokowy). Progresja metali kuźni; złoto zarezerwowane dla weterana.
 *   1 — brąz/miedź  (ciemny, ciepły)
 *   2 — stal/srebro (średni, chłodny szary)
 *   3 — platyna     (bardzo jasna biel — czytelna nawet w odcieniach szarości)
 */
export const UPGRADE_BADGE_COLOR: Readonly<Record<1 | 2 | 3, number>> = {
  1: 0xc9762c,
  2: 0x9aa8b6,
  3: 0xf4f8fc,
};

/** Etykieta poziomu do UI/tooltipu (poziom 0 = pusty string). */
export const UPGRADE_BADGE_LABEL: Readonly<Record<1 | 2 | 3, string>> = {
  1: 'Ulepszenie I (brąz)',
  2: 'Ulepszenie II (stal)',
  3: 'Ulepszenie III (platyna)',
};

export function upgradeBadgeLabel(level: UpgradeBadgeLevel): string {
  return level === 0 ? '' : UPGRADE_BADGE_LABEL[level];
}

// ---------------------------------------------------------------------------
// Geometria — wymiary (wszystko względem HEX_R = 1.0)
// ---------------------------------------------------------------------------

/**
 * Obwódka: heksagonalny kołnierz WEWNĄTRZ obwódki właściciela z units.ts
 * (OWNER_RING_OUTER = 0.90·HEX_R, OWNER_RING_INNER = 0.855·HEX_R), żeby oba
 * pierścienie były rozróżnialne i żeby nic nie wychodziło poza obrys heksu.
 */
const UPG_RING_OUTER  = 0.845 * HEX_R;
const UPG_RING_INNER  = 0.775 * HEX_R;
/** Wysokość wyciągnięcia — pionowa ścianka widoczna pod kątem kamery 52°. */
const UPG_RING_HEIGHT = 0.055 * HEX_R;
/** Uniesienie nad kafelek (nad OWNER_RING_LIFT = 0.006, żeby nie migotało z płaskim pierścieniem). */
const UPG_RING_LIFT   = 0.010 * HEX_R;

/**
 * Promień kropki. Wartość 0.072 dobrana PO OGLĘDZINACH ZRZUTU przy kącie 52°
 * i dystansie odpowiadającym oddalonej kamerze mapy — przy 0.058 kropki
 * gubiły się na trawie (pierwsza wersja podglądu), przy 0.072 są czytelne
 * i nadal 3× mniejsze od głowy figurki (0.13·HEX_R), więc nie udają elementu modelu.
 */
const UPG_DOT_R       = 0.072 * HEX_R;
/** Wysokość środka kropki — kule wiszą tuż nad kafelkiem, mają własną sylwetkę. */
const UPG_DOT_Y       = 0.100 * HEX_R;
/**
 * Wysunięcie kropek do przodu (+Z = strona kamery przy pointy-top hex).
 * Skrajny punkt kropki: 0.600 + 0.072 = 0.672·HEX_R — z zapasem wewnątrz
 * otworu obwódki ulepszenia (0.775) i obrysu heksu.
 */
const UPG_DOT_Z       = 0.600 * HEX_R;
/** Rozstaw kropek w osi X. Skrajna kropka: |x| = 0.175 + 0.072 = 0.247·HEX_R,
 *  a półszerokość heksu na wysokości z = 0.600 wynosi 0.693·HEX_R — mieści się. */
const UPG_DOT_SPACING = 0.175 * HEX_R;

/**
 * MIEJSCE NA GWIAZDKI WETERANA (game/veteran.ts, 2–3 gwiazdki) — od 2026-07-26
 * WYKORZYSTANE przez render/unitVeteranBadges.ts (ten moduł jest jedynym
 * właścicielem tej stałej; unitVeteranBadges.ts ją importuje, żeby wysokość
 * miała jedno źródło prawdy).
 * Odznaki ulepszeń trzymają się PODSTAWY żetonu (maks. y = UPG_RING_HEIGHT +
 * UPG_DOT_Y + UPG_DOT_R ≈ 0.14·HEX_R), więc cała przestrzeń nad głową figurki
 * (~0.58·HEX_R) jest wolna. Gwiazdki stoją na tej wysokości, wyśrodkowane w x,
 * ZŁOTE i o gwiaździstym obrysie — oba systemy pozostają rozróżnialne pozycją,
 * kształtem i kolorem naraz.
 * Wysokość 0.92·HEX_R jest WYŻEJ niż czaszka głodu (0.78·HEX_R, sprite
 * półprzezroczysty, tylko przy głodzie) i wyżej niż badge stosu (0.55·HEX_R),
 * więc gwiazdki nie wejdą w kolizję z żadnym istniejącym elementem żetonu.
 * Zweryfikowane na zrzucie podglądu (mock gwiazdek w tools/.upgrade-badges-preview-entry.ts).
 */
export const VETERAN_BADGE_RESERVED_Y = 0.92 * HEX_R;

// ---------------------------------------------------------------------------
// Singletony zasobów
// ---------------------------------------------------------------------------

/** Sześciokąt pointy-top (ta sama konwencja kątowa co appendPointyTopHex w units.ts). */
function appendPointyTopHex(path: THREE.Path | THREE.Shape, radius: number, reverse: boolean): void {
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  for (let j = 0; j < 6; j++) {
    const i = order[j]!;
    const angle = Math.PI / 2 + (i * Math.PI) / 3;
    if (j === 0) path.moveTo(radius * Math.cos(angle), radius * Math.sin(angle));
    else path.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
  }
  path.closePath();
}

let geoUpgRing: THREE.ExtrudeGeometry | null = null;
/** Kołnierz heksagonalny — 48 trójkątów (góra 12 + dół 12 + ścianka zewn. 12 + wewn. 12). */
function getGeoUpgradeRing(): THREE.ExtrudeGeometry {
  if (geoUpgRing) return geoUpgRing;
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, UPG_RING_OUTER, false);
  const hole = new THREE.Path();
  appendPointyTopHex(hole, UPG_RING_INNER, true);
  shape.holes.push(hole);
  geoUpgRing = new THREE.ExtrudeGeometry(shape, {
    depth: UPG_RING_HEIGHT,
    bevelEnabled: false,
    curveSegments: 1,
  });
  return geoUpgRing;
}

let geoUpgDot: THREE.SphereGeometry | null = null;
/** Kropka — 8×6 segmentów = 80 trójkątów; gładka kula, bez ostrych ramion (≠ gwiazdka). */
function getGeoUpgradeDot(): THREE.SphereGeometry {
  return (geoUpgDot ||= new THREE.SphereGeometry(UPG_DOT_R, 8, 6));
}

const matByLevel = new Map<1 | 2 | 3, THREE.MeshStandardMaterial>();
/**
 * Materiał wspólny dla obwódki i kropek danego poziomu. Lekki `emissive`
 * (30% koloru) sprawia, że odznaka nie ginie w cieniu terenu przy 52° —
 * bez rozjaśniania całej sceny.
 */
function getMatForLevel(level: 1 | 2 | 3): THREE.MeshStandardMaterial {
  const cached = matByLevel.get(level);
  if (cached) return cached;
  const color = UPGRADE_BADGE_COLOR[level];
  const mat = new THREE.MeshStandardMaterial({
    color,
    // Poziom 1 (miedź) jest najciemniejszy i najłatwiej ginie na zielonym
    // kafelku — dostaje mocniejszy `emissive` (0.45 vs 0.30), sprawdzone na zrzucie.
    emissive: new THREE.Color(color).multiplyScalar(level === 1 ? 0.45 : 0.30),
    roughness: level === 1 ? 0.50 : 0.35,
    metalness: level === 1 ? 0.65 : 0.80,
  });
  matByLevel.set(level, mat);
  return mat;
}

// ---------------------------------------------------------------------------
// Budowa / synchronizacja odznaki na żetonie
// ---------------------------------------------------------------------------

/** Klucz w userData żetonu — aktualnie narysowany poziom (do wczesnego wyjścia). */
const UD_LEVEL = 'upgBadgeLevel';
/** Klucz w userData żetonu — podgrupa z odznakami (do podmiany/usunięcia). */
const UD_GROUP = 'upgBadgeGroup';

/** Rozstaw kropek wyśrodkowany: 1 → [0]; 2 → [-s/2, +s/2]; 3 → [-s, 0, +s]. */
function dotOffsetsX(count: number): number[] {
  const xs: number[] = [];
  const start = -((count - 1) / 2) * UPG_DOT_SPACING;
  for (let i = 0; i < count; i++) xs.push(start + i * UPG_DOT_SPACING);
  return xs;
}

/**
 * Buduje podgrupę odznaki dla poziomu 1–3: kołnierz (obwódka) + `level` kropek.
 * Wszystkie zasoby to singletony modułu — grupa nie posiada NICZEGO do zwolnienia.
 */
function buildBadgeGroup(level: 1 | 2 | 3): THREE.Group {
  const g = new THREE.Group();
  g.name = 'upgradeBadge';
  const mat = getMatForLevel(level);

  const ring = new THREE.Mesh(getGeoUpgradeRing(), mat);
  ring.rotation.x = -Math.PI / 2;   // płaszczyzna kształtu → XZ, wyciągnięcie → +Y
  ring.position.y = UPG_RING_LIFT;
  g.add(ring);

  const dotGeo = getGeoUpgradeDot();
  for (const x of dotOffsetsX(level)) {
    const dot = new THREE.Mesh(dotGeo, mat);
    dot.position.set(x, UPG_DOT_Y, UPG_DOT_Z);
    g.add(dot);
  }
  return g;
}

/**
 * Doprowadza odznaki na żetonie do stanu odpowiadającego `level`.
 * IDEMPOTENTNA i tania — przy niezmienionym poziomie kończy się jednym
 * porównaniem liczby (wołana z UnitRenderer.sync() dla każdej jednostki
 * w każdej klatce synchronizacji).
 *
 * PARYTET AI: brak jakiegokolwiek warunku na właściciela.
 */
export function applyUnitUpgradeBadgeLevel(group: THREE.Object3D, level: UpgradeBadgeLevel): void {
  if (group.userData[UD_LEVEL] === level) return;
  const old = group.userData[UD_GROUP] as THREE.Group | undefined;
  if (old) {
    group.remove(old);
    delete group.userData[UD_GROUP];
  }
  group.userData[UD_LEVEL] = level;
  if (level === 0) return;
  const badge = buildBadgeGroup(level);
  group.add(badge);
  group.userData[UD_GROUP] = badge;
}

/**
 * Wygodne wejście dla renderera mapy: policz poziom z pól jednostki
 * (pancerzBonusProc / parametryBonusProc) i zaktualizuj żeton.
 */
export function syncUnitUpgradeBadges(
  group: THREE.Object3D,
  unit: UnitBuildingProgress | null | undefined,
): void {
  applyUnitUpgradeBadgeLevel(group, upgradeBadgeLevelForUnit(unit));
}

/**
 * Zwalnia singletony modułu — TYLKO dla podglądów/testów, które niszczą cały
 * kontekst WebGL. Gra nigdy tego nie woła (zasoby żyją tyle co scena).
 */
export function disposeUnitUpgradeBadgeResources(): void {
  geoUpgRing?.dispose();
  geoUpgRing = null;
  geoUpgDot?.dispose();
  geoUpgDot = null;
  for (const m of matByLevel.values()) m.dispose();
  matByLevel.clear();
}
