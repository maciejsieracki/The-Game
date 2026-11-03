/**
 * city-towers.ts
 *
 * R-WEB-PALISADE-BATTLE-WALL-RULES-Q1, runda 2 (R4): wiezyczki strzeleckie wzdluz
 * muru I palisady miasta (decyzja wlasciciela 2026-11-03):
 *  - powstaja AUTOMATYCZNIE i ZA DARMO przy kazdym obwarowaniu (palisada ALBO mur);
 *    budynek Baszta (+100% obrony) bez zmian i bez ostrzalu;
 *  - co N-ty (domyslnie 4) kafel obwodu muru/palisady stoi wiezyczka;
 *  - wiezyczka strzela moca NAJMOCNIEJSZEJ jednostki dystansowej dostepnej w epoce
 *    wlasciciela miasta (miara = ta sama co w combat.ts / battleScene: `missileAttack`,
 *    fallback `Atak dystansowy`); strzal liczy scena jak strzal tej jednostki;
 *  - zasieg = zasieg tej jednostki, nie mniej niz 2 (miasto-params.json);
 *  - zniszczenie kafla muru/palisady usuwa wiezyczke stojaca na tym kaflu;
 *  - model drewniany przy palisadzie, kamienny przy murze.
 *
 * Czyste funkcje, bez zaleznosci od sceny/mapy -- ta sama arytmetyka dla gracza i AI.
 */
import type { CityFortificationKind } from './city-fortification';

/** Wiezyczki sa budowane tylko przy obwarowaniu (palisada albo mur). */
export type TowerMaterial = 'drewno' | 'kamien';

export function towerMaterialFor(kind: CityFortificationKind): TowerMaterial | null {
  if (kind === 'palisada') return 'drewno';
  if (kind === 'mur') return 'kamien';
  return null;
}

export const DEFAULT_TOWER_SPACING = 4;
export const DEFAULT_TOWER_MIN_RANGE = 2;

export interface TowerSlotInput {
  /** Pierwszy i ostatni rzad (kafel) muru/palisady, wlacznie. */
  rowLo: number;
  rowHi: number;
  /** Rzedy bramy (wlacznie) -- tam wiezyczki nie stoja. */
  gateRowLo: number;
  gateRowHi: number;
  /** Odstep miedzy wiezyczkami w kaflach obwodu (domyslnie 4). */
  spacing?: number;
}

/**
 * Rzedy kafli muru/palisady, na ktorych stoja wiezyczki: co `spacing`-ty kafel
 * obwodu liczony od rowLo (pierwsza wiezyczka na rowLo + 2). Rzedy bramy pomijane.
 */
export function towerRows(inp: TowerSlotInput): number[] {
  const spacing = Math.max(1, Math.floor(inp.spacing ?? DEFAULT_TOWER_SPACING));
  const rows: number[] = [];
  const first = inp.rowLo + Math.min(2, Math.max(0, inp.rowHi - inp.rowLo));
  for (let r = first; r <= inp.rowHi; r += spacing) {
    if (r >= inp.gateRowLo && r <= inp.gateRowHi) continue;
    rows.push(r);
  }
  return rows;
}

const ERA_NAMES = ['Kamień', 'Brąz', 'Żelazo'] as const;

export function eraName(era: number): string {
  const i = Math.max(1, Math.min(3, Math.round(era))) - 1;
  return ERA_NAMES[i]!;
}

/** BronzeCiv (render) -> wartosc kolumny `Nacja` w units.json. */
const CIV_TO_NACJA: Record<string, string> = {
  egipt: 'Egipt', sumer: 'Sumer', inka: 'Inkowie', zulu: 'Zulu', asyria: 'Asyria',
};

function str(v: unknown): string { return typeof v === 'string' ? v : ''; }
function num(v: unknown): number { return typeof v === 'number' && Number.isFinite(v) ? v : 0; }

type UnitRow = Record<string, unknown>;

/** Sila strzalu dystansowego -- ta sama miara co battleScene.toCombatUnit/attackRange. */
export function missilePower(u: UnitRow): number {
  return num(u['missileAttack'] ?? u['Atak dystansowy']);
}

/** Zasieg jednostki dystansowej w kaflach (kolumna `Zasięg ataku (hex)`), 0 gdy brak. */
export function unitReach(u: UnitRow): number {
  return num(u['Zasięg ataku (hex)'] ?? u['Zasieg ataku (hex)']);
}

function availableIn(u: UnitRow, era: string): boolean {
  const list = str(u['Dostępna w epokach']) || str(u['Epoka']);
  return list.split(';').map(s => s.trim()).includes(era);
}

function nationOk(u: UnitRow, nacja: string | null): boolean {
  const n = str(u['Nacja']).trim();
  return n === '' || n === '—' || (nacja !== null && n === nacja);
}

/**
 * Najmocniejsza jednostka DYSTANSOWA (Rola (linia) = 'Dystans': luk/proca/oszczep;
 * bez machin oblezniczych i bez jazdy/piechoty z pociskami pobocznymi) dostepna
 * w epoce wlasciciela miasta. Jednostki narodowe liczone tylko dla swojej nacji.
 *
 * ZALOZENIE (do akceptacji): gdy w danej epoce nie ma zadnej takiej jednostki
 * (np. Zelazo -- w units.json brak standardowego strzelca), bierzemy najlepsza
 * z epok WCZESNIEJSZYCH (pierwsza epoka wstecz, w ktorej cos jest). Remis mocy:
 * dluzszy zasieg, potem kolejnosc w danych (deterministycznie).
 */
export function strongestRangedUnitForEra(
  units: readonly UnitRow[],
  era: number,
  civ?: string | null,
): UnitRow | null {
  const nacja = civ ? (CIV_TO_NACJA[civ] ?? null) : null;
  const pool = units.filter(u =>
    str(u['Rola (linia)']) === 'Dystans' && missilePower(u) > 0 && nationOk(u, nacja));
  const e0 = Math.max(1, Math.min(3, Math.round(era)));
  for (let e = e0; e >= 1; e--) {
    const name = eraName(e);
    let best: UnitRow | null = null;
    for (const u of pool) {
      if (!availableIn(u, name)) continue;
      if (best === null) { best = u; continue; }
      const p = missilePower(u), bp = missilePower(best);
      if (p > bp || (p === bp && unitReach(u) > unitReach(best))) best = u;
    }
    if (best) return best;
  }
  return null;
}

/** Zasieg wiezyczki: zasieg jednostki, nie mniej niz `minRange` (domyslnie 2). */
export function towerRangeFor(unit: UnitRow | null, minRange: number = DEFAULT_TOWER_MIN_RANGE): number {
  return Math.max(minRange, Math.round(unit ? unitReach(unit) : 0));
}

export interface TowerTarget {
  q: number; r: number; hp: number; dead?: boolean;
}

/**
 * Cel ostrzalu: najblizszy wrog w zasiegu (odleglosc Manhattan jak w scenie),
 * remis -> najmniej HP, potem pierwszy w liscie. Zwraca indeks lub -1.
 */
export function pickTowerTarget(
  tower: { q: number; r: number },
  range: number,
  enemies: readonly TowerTarget[],
): number {
  let bestI = -1; let bestD = Infinity; let bestHp = Infinity;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (e.dead) continue;
    const d = Math.abs(tower.q - e.q) + Math.abs(tower.r - e.r);
    if (d < 1 || d > range) continue;
    if (d < bestD || (d === bestD && e.hp < bestHp)) { bestI = i; bestD = d; bestHp = e.hp; }
  }
  return bestI;
}

/**
 * Wiezyczki, ktore PRZEZYLY: stoja na kafelku muru/palisady, ktory nadal ma
 * wytrzymalosc (zniszczenie kafla = wylom usuwa wiezyczke).
 */
export function aliveTowerRows(rows: readonly number[], intactWallRows: ReadonlySet<number>): number[] {
  return rows.filter(r => intactWallRows.has(r));
}
