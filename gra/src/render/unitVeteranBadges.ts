/**
 * unitVeteranBadges.ts
 *
 * ODZNAKI POZIOMU WETERANA na żetonie jednostki na mapie — dokończenie decyzji
 * właściciela Maciej z 2026-07-25 (pytanie 57). Odznaki ulepszeń budynkowych
 * (render/unitUpgradeBadges.ts) powstały wtedy od razu; gwiazdki weterana
 * zostały wówczas TYLKO zarezerwowane (VETERAN_BADGE_RESERVED_Y) i do 2026-07-26
 * poziom weterana był widoczny wyłącznie jako TEKST w tooltipie i panelu
 * jednostki (ui/hexContextTooltip.ts, ui/unitPanelHud.ts) — na mapie zero
 * sygnału. Ten moduł zamyka tę lukę.
 *
 * ── ŹRÓDŁO DANYCH — DOKŁADNIE TO SAMO CO PANEL/TOOLTIP ────────────────────
 * Poziom liczy `veteranLevel()` z game/veteran.ts (pole RuntimeUnit.battlesSurvived),
 * czyli TA SAMA funkcja, którą main.ts:3090 i main.ts:11829 podaje do
 * `veteranBadgeLabel()` dla panelu jednostki i rosteru przedbitewnego.
 * Poziom NIE jest liczony tu drugi raz — żeby mapa i tooltip nie mogły się
 * rozjechać.
 *
 *   Poziom 1 (Rekrut)       — 0 przeżytych bitew — premia 0%   — BRAK ODZNAKI
 *   Poziom 2 (Doświadczony) — 1 przeżyta bitwa   — premia +10% — 2 gwiazdki
 *   Poziom 3 (Weteran)      — 2+ przeżyte bitwy  — premia +20% — 3 gwiazdki
 *
 * LICZBA GWIAZDEK = `veteranStars(level)` = poziom (2 albo 3), a nie „liczba
 * awansów". To celowe: tooltip pokazuje „★★ Doświadczony +10%" / „★★★ Weteran
 * +20%", więc gracz, który policzy gwiazdki na mapie, dostaje tę samą liczbę,
 * którą przed chwilą widział w panelu. Rozjazd 1★/2★ na mapie vs 2★/3★ w
 * tekście byłby błędem czytelności, nie oszczędnością.
 *
 * POZIOM 1 BEZ ODZNAKI — świadomie (ta sama zasada, co `veteranBadgeLabel()`,
 * które na poziomie 1 zwraca pusty string). Świeża jednostka jest stanem
 * DOMYŚLNYM i najliczniejszym na mapie; oznaczanie jej symbolem zarosłoby mapę
 * i zabrało odznace znaczenie „ta jednostka jest lepsza od zwykłej".
 *
 * ── ODRÓŻNIENIE OD ODZNAK ULEPSZEŃ BUDYNKOWYCH (unitUpgradeBadges.ts) ──────
 * To dwa niezależne systemy i gracz nie może ich mylić. Rozróżnienie działa na
 * TRZECH osiach naraz — kolor jest tylko trzecią z nich, bo sam kolor ginie na
 * tle terenu (raz zielona trawa, raz jasny piasek, raz śnieg):
 *   1. KSZTAŁT — ulepszenia budynkowe to gładkie KULE (bryła obrotowa, brak
 *      jakiejkolwiek narożnej krawędzi) plus heksagonalny kołnierz; weteran to
 *      pięcioramienne GWIAZDY o ostrych, wklęsło-wypukłych ramionach. Sylwetki
 *      nie do pomylenia nawet przy oddalonej kamerze i w odcieniach szarości.
 *   2. POZYCJA — ulepszenia siedzą PRZY PODSTAWIE żetonu (kołnierz na ziemi +
 *      kropki przed stopami, maks. y ≈ 0,14·HEX_R); gwiazdki weterana wiszą
 *      NAD GŁOWĄ figurki (VETERAN_BADGE_RESERVED_Y = 0,92·HEX_R). Zero kontaktu.
 *   3. KOLOR — ulepszenia to metale kuźni (brąz → stal → platyna); weteran jest
 *      ZŁOTY, dokładnie jak ★ w UI. Złoto jest w unitUpgradeBadges.ts świadomie
 *      NIE UŻYWANE właśnie po to, żeby zostało zarezerwowane dla weterana.
 *
 * ── CZYTELNOŚĆ POD KĄTEM KAMERY GRY (52°) ─────────────────────────────────
 * Kamera gry ma STAŁE nastawy (render/camera.ts::_syncCamera): elewacja 52°,
 * azymut 0 (yaw jest polem prywatnym ustawianym na 0 z komentarzem „kamera
 * stała"). Skoro kąt patrzenia jest znany i niezmienny, płytka gwiazdy nie jest
 * ustawiona pionowo — jest ODCHYLONA DO TYŁU o dokładnie 52° (STAR_TILT_RAD),
 * więc jej normalna celuje prosto w kamerę i gracz widzi PEŁNY obrys gwiazdy,
 * bez skrócenia perspektywicznego. Płytka pionowa traciłaby przy 52° około
 * 38% wysokości obrysu (cos 52° ≈ 0,616) i ramiona gwiazdy zlewałyby się w
 * plamę — to był główny powód, dla którego trzeba było tu dołożyć obrót,
 * a nie po prostu wstawić płaski kształt.
 *
 * KONTRAST NIEZALEŻNY OD TERENU — pod gwiazdą stoi DRUGA, ciemna gwiazda
 * powiększona o 30% (STAR_OUTLINE_SCALE), pełniąca rolę obwódki. Bez niej złoto
 * ginie na jasnym piasku i na śniegu (te same wartości jasności), a przy 52°
 * odznaka nie ma pod sobą żadnego stałego tła. Obwódka daje ciemny rant przy
 * KAŻDYM terenie, więc czytelność nie zależy od kafelka pod jednostką.
 *
 * ── PARYTET AI ────────────────────────────────────────────────────────────
 * Żadna funkcja tego modułu nie zna pojęcia `ownerId` — żeton AI dostaje
 * gwiazdki dokładnie tak samo jak żeton gracza (gracz MA widzieć, że wroga
 * jednostka jest ograna i bije mocniej niż jej wpis w encyklopedii).
 *
 * ── ZASOBY ────────────────────────────────────────────────────────────────
 * Geometria gwiazdy i oba materiały to SINGLETONY MODUŁU — jedna geometria
 * współdzielona przez wszystkie gwiazdki wszystkich jednostek na mapie (na
 * mapie potrafi ich być kilkadziesiąt naraz). Nic nie jest tworzone per żeton,
 * więc — tak jak w unitUpgradeBadges.ts — NIC nie trafia do
 * group.userData['mats'] ani ['perTokenGeos']; te dwie tablice niszczy
 * UnitRenderer._disposeToken (units.ts) przy usuwaniu żetonu, a dopisanie tam
 * singletonu skasowałoby odznaki WSZYSTKICH pozostałych jednostek na mapie.
 * Usunięcie żetonu zabiera podgrupę odznaki razem z żetonem (zwykłe dzieci
 * Object3D) i nie zostawia nic do zwolnienia — zero wycieków.
 * Koszt na żeton: maks. 6 mesh / 216 trójkątów (3 gwiazdki × [gwiazda 36 +
 * obwódka 36]).
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';
import { VETERAN_BADGE_RESERVED_Y } from './unitUpgradeBadges';
import { veteranLevel, veteranStars, type VeteranLevel, type VeteranProgress } from '../game/veteran';

// ---------------------------------------------------------------------------
// Geometria — wymiary (wszystko względem HEX_R = 1.0)
// ---------------------------------------------------------------------------

/**
 * Promień zewnętrzny gwiazdy (ramię). 0,075·HEX_R to nieco ponad połowa
 * średnicy głowy figurki (0,13·HEX_R) — na tyle duże, żeby ramiona były
 * policzalne przy oddalonej kamerze, i na tyle małe, żeby trzy gwiazdki
 * zmieściły się w obrysie heksu z zapasem (patrz STAR_SPACING).
 */
const STAR_R = 0.075 * HEX_R;
/** Promień wewnętrzny (wcięcie między ramionami) jako ułamek STAR_R — 0,42 daje wyraźnie ostre ramiona, a nie „pięciokąt z ząbkami". */
const STAR_INNER_FRAC = 0.42;
/** Grubość wyciągnięcia płytki — gwiazda ma być bryłą, nie naklejką; przy 52° widać cień na ściance. */
const STAR_DEPTH = 0.020 * HEX_R;
/**
 * Rozstaw gwiazdek w osi X. Skrajna gwiazdka przy 3 sztukach:
 * |x| = 0,170 + 0,075 = 0,245·HEX_R, a półszerokość heksu pointy-top w osi
 * przechodzącej przez środek wynosi cos(30°)·HEX_R = 0,866·HEX_R —
 * mieści się z zapasem 3,5×.
 */
/** Rozstaw gwiazdek — współdzielony z unitPathFlankBadges (C-OBCE-JEDN-Q2). */
export const STAR_SPACING = 0.170 * HEX_R;
/**
 * Odchylenie płytki do tyłu = elewacja kamery gry (render/camera.ts: 52°).
 * Normalna gwiazdy celuje wtedy prosto w kamerę → pełny obrys, zero skrótu.
 */
export const STAR_TILT_RAD = THREE.MathUtils.degToRad(52);
/** Powiększenie ciemnej gwiazdy-obwódki (kontrast niezależny od koloru terenu). */
const STAR_OUTLINE_SCALE = 1.30;
/** Odsunięcie obwódki ZA gwiazdę w lokalnej osi Z płytki (po obrocie: w głąb, od kamery). */
const STAR_OUTLINE_OFFSET_Z = -0.012 * HEX_R;

/** Złoto weterana — ten sam odcień co ★ w panelu jednostki (ui/unitPanelHud.ts, klasa .veteran-badge). */
export const VETERAN_BADGE_COLOR = 0xffd24a;
/** Obwódka — bardzo ciemny, lekko ciepły brąz (nie czysta czerń: przy 52° czerń zlewa się z cieniem terenu). */
export const VETERAN_BADGE_OUTLINE_COLOR = 0x241703;

// ---------------------------------------------------------------------------
// Singletony zasobów
// ---------------------------------------------------------------------------

let geoStar: THREE.ExtrudeGeometry | null = null;
/**
 * Pięcioramienna gwiazda, pierwszy wierzchołek W GÓRĘ (kąt 90°) — po obrocie
 * o STAR_TILT_RAD gwiazda nadal „stoi na ramieniu dolnym", tak jak znak ★.
 * 10 wierzchołków obrysu → 8 trójkątów przód + 8 tył + 20 ścianka = 36 trójkątów.
 */
function getGeoVeteranStar(): THREE.ExtrudeGeometry {
  if (geoStar) return geoStar;
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? STAR_R : STAR_R * STAR_INNER_FRAC;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) shape.moveTo(r * Math.cos(a), r * Math.sin(a));
    else shape.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  shape.closePath();
  geoStar = new THREE.ExtrudeGeometry(shape, {
    depth: STAR_DEPTH,
    bevelEnabled: false,
    curveSegments: 1,
  });
  return geoStar;
}

let matStar: THREE.MeshStandardMaterial | null = null;
/**
 * Złoto z mocnym `emissive` (45% koloru) — odznaka nie może zgasnąć, gdy
 * jednostka stoi w cieniu góry albo lasu; podniesienie emisji jest tu tańsze
 * i bezpieczniejsze niż rozjaśnianie całej sceny.
 */
function getMatVeteranStar(): THREE.MeshStandardMaterial {
  return (matStar ||= new THREE.MeshStandardMaterial({
    color: VETERAN_BADGE_COLOR,
    emissive: new THREE.Color(VETERAN_BADGE_COLOR).multiplyScalar(0.45),
    roughness: 0.28,
    metalness: 0.85,
  }));
}

let matStarOutline: THREE.MeshStandardMaterial | null = null;
/** Obwódka — matowa i całkowicie nieemisyjna, żeby czytała się jako cień/rant, a nie druga odznaka. */
function getMatVeteranStarOutline(): THREE.MeshStandardMaterial {
  return (matStarOutline ||= new THREE.MeshStandardMaterial({
    color: VETERAN_BADGE_OUTLINE_COLOR,
    roughness: 0.95,
    metalness: 0.0,
  }));
}

// ---------------------------------------------------------------------------
// Budowa / synchronizacja odznaki na żetonie
// ---------------------------------------------------------------------------

/** Klucz w userData żetonu — aktualnie narysowany poziom (do wczesnego wyjścia). */
const UD_LEVEL = 'vetBadgeLevel';
/** Klucz w userData żetonu — podgrupa z gwiazdkami (do podmiany/usunięcia). */
const UD_GROUP = 'vetBadgeGroup';
/** Na meshach gwiazdek — raycast tooltipu (C-OBCE-JEDN-Q3 C). */
export const VETERAN_BADGE_HIT_UD = 'veteranBadgeHit';

/** Rozstaw wyśrodkowany: 2 → [-s/2, +s/2]; 3 → [-s, 0, +s]. */
function starOffsetsX(count: number): number[] {
  const xs: number[] = [];
  const start = -((count - 1) / 2) * STAR_SPACING;
  for (let i = 0; i < count; i++) xs.push(start + i * STAR_SPACING);
  return xs;
}

/**
 * Buduje podgrupę odznaki weterana dla poziomu 2–3 (poziom 1 nigdy tu nie trafia).
 * Wszystkie zasoby to singletony modułu — grupa nie posiada NICZEGO do zwolnienia.
 */
function buildVeteranBadgeGroup(level: 2 | 3): THREE.Group {
  const g = new THREE.Group();
  g.name = 'veteranBadge';
  // Cała listwa gwiazdek jest jedną odchyloną płytką — obrót raz, na grupie.
  g.position.y = VETERAN_BADGE_RESERVED_Y;
  g.rotation.x = -STAR_TILT_RAD;

  const geo = getGeoVeteranStar();
  const mat = getMatVeteranStar();
  const matOut = getMatVeteranStarOutline();

  for (const x of starOffsetsX(veteranStars(level))) {
    const outline = new THREE.Mesh(geo, matOut);
    outline.position.set(x, 0, STAR_OUTLINE_OFFSET_Z);
    outline.scale.set(STAR_OUTLINE_SCALE, STAR_OUTLINE_SCALE, 1);
    outline.userData[VETERAN_BADGE_HIT_UD] = true;
    g.add(outline);

    const star = new THREE.Mesh(geo, mat);
    star.position.set(x, 0, 0);
    star.userData[VETERAN_BADGE_HIT_UD] = true;
    g.add(star);
  }
  return g;
}

/**
 * Doprowadza odznakę weterana na żetonie do stanu odpowiadającego `level`.
 * IDEMPOTENTNA i tania — przy niezmienionym poziomie kończy się jednym
 * porównaniem liczby (wołana z UnitRenderer.sync() dla każdej jednostki
 * w każdej klatce synchronizacji).
 *
 * PARYTET AI: brak jakiegokolwiek warunku na właściciela.
 */
export function applyUnitVeteranBadgeLevel(group: THREE.Object3D, level: VeteranLevel): void {
  if (group.userData[UD_LEVEL] === level) return;
  const old = group.userData[UD_GROUP] as THREE.Group | undefined;
  if (old) {
    group.remove(old);
    delete group.userData[UD_GROUP];
  }
  group.userData[UD_LEVEL] = level;
  if (level === 1) return; // Rekrut — bez odznaki (świadomie, patrz nagłówek).
  const badge = buildVeteranBadgeGroup(level);
  group.add(badge);
  group.userData[UD_GROUP] = badge;
}

/**
 * Wygodne wejście dla renderera mapy: policz poziom jednostki TĄ SAMĄ funkcją,
 * której używa panel/tooltip (game/veteran.ts::veteranLevel) i zaktualizuj żeton.
 */
export function syncUnitVeteranBadges(
  group: THREE.Object3D,
  unit: VeteranProgress | null | undefined,
): void {
  applyUnitVeteranBadgeLevel(group, veteranLevel(unit));
}

/**
 * Zwalnia singletony modułu — TYLKO dla podglądów/testów, które niszczą cały
 * kontekst WebGL. Gra nigdy tego nie woła (zasoby żyją tyle co scena).
 */
export function disposeUnitVeteranBadgeResources(): void {
  geoStar?.dispose();
  geoStar = null;
  matStar?.dispose();
  matStar = null;
  matStarOutline?.dispose();
  matStarOutline = null;
}
