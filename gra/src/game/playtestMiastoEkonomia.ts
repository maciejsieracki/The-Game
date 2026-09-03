/**
 * playtestMiastoEkonomia.ts
 * Sandbox: jedno miasto gracza do testu panelu (budowa, rekrutacja, podatki, okolica 👤).
 * URL: ?playtest=miasto · Gra-podglad-PLAYTEST-MIASTO.html
 */

import type { GameMap } from '../types/map';
import type { GameData } from '../data/loader';
import { TerenBazowy, Nakladka, Ulepszenie } from '../types/hex';
import type { City } from './cities';
import { DEFAULT_PODZIAL_HANDLU, DEFAULT_PODZIAL_PRACY } from './cities';
import { citySightRadius } from './okolica';
import { freshWealthState } from './wealth';
import { computeVisibleAt } from './visibility';
import { hexDistance, keyOf } from '../units/setup';
import type { CityProduction } from './production';

export const PLAYTEST_MIASTO_SEED = 271828;

export const PLAYTEST_MIASTO_HINT =
  'PLAYTEST MIASTO: panel miasta. Okolica: klik heks = +👤, PPM = −👤. Produkcja = budynki (Buduj). ' +
  'Rekrutacja = sekcja „Kup jednostkę” (Koszary już wybudowane). Tura N = ekonomia.';

export interface PlaytestMiastoResult {
  cities: City[];
  explored: string[];
  visible: string[];
  focusQ: number;
  focusR: number;
  playerCityId: string;
  /** Początkowa kolejka produkcji (Stolarnia w toku). */
  initialProduction: CityProduction;
  /** Id tech zbadanych na start (Kamień + Brąz). */
  grantedTechIds: string[];
}

export function isPlaytestMiastoMode(): boolean {
  if (typeof location === 'undefined') return false;
  const qs = new URLSearchParams(location.search);
  return qs.get('playtest') === 'miasto' || /PLAYTEST-MIASTO/i.test(location.pathname || '');
}

function isLandWorkable(map: GameMap, q: number, r: number): boolean {
  const hex = map.hexes[keyOf(q, r)];
  if (!hex) return false;
  const t = hex.terenBazowy;
  return t !== TerenBazowy.Morze && t !== TerenBazowy.Gory;
}

function findCityCenter(map: GameMap): { q: number; r: number } | null {
  const cq = Math.round((map.szerokoscQ - 1) / 2);
  const cr = Math.round((map.wysokoscR - 1) / 2);

  for (let dq = -6; dq <= 6; dq++) {
    for (let dr = -6; dr <= 6; dr++) {
      const q = cq + dq;
      const r = cr + dr;
      if (!isLandWorkable(map, q, r)) continue;
      let landInRange = 0;
      for (const key of Object.keys(map.hexes)) {
        const parts = key.split(',');
        const hq = Number(parts[0]);
        const hr = Number(parts[1]);
        if (!Number.isFinite(hq) || !Number.isFinite(hr)) continue;
        if (hexDistance(q, r, hq, hr) > 9) continue;
        if (isLandWorkable(map, hq, hr)) landInRange++;
      }
      if (landInRange >= 24) return { q, r };
    }
  }
  return null;
}

/** Różnorodne pola w zasięgu okolicy (do testu profili i 👤). */
function paintOkolicaSandbox(map: GameMap, cq: number, cr: number): void {
  const pattern: TerenBazowy[] = [
    TerenBazowy.Laka,
    TerenBazowy.Laka,
    TerenBazowy.Rownina,
    TerenBazowy.Rownina,
    TerenBazowy.Wzgorza,
    TerenBazowy.PlytkieMorze,
    TerenBazowy.Pustynia,
  ];
  let idx = 0;

  for (const key of Object.keys(map.hexes)) {
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
    const dist = hexDistance(cq, cr, q, r);
    if (dist === 0) {
      const center = map.hexes[key];
      if (center) {
        center.terenBazowy = TerenBazowy.Rownina;
        center.nakladka = Nakladka.Brak;
        center.ulepszenie = Ulepszenie.Brak;
      }
      continue;
    }
    if (dist > 9) continue;
    const hex = map.hexes[key];
    if (!hex) continue;
    if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Gory) continue;

    hex.terenBazowy = pattern[idx % pattern.length]!;
    hex.nakladka = Nakladka.Brak;
    hex.ulepszenie = Ulepszenie.Brak;
    idx++;

    // Jedna farma do testu plonów × ulepszenie
    if (dist === 2 && q === cq + 2 && r === cr) {
      hex.terenBazowy = TerenBazowy.Laka;
      hex.ulepszenie = Ulepszenie.Farma;
    }
    // Las na jednym polu
    if (dist === 3 && q === cq - 2 && r === cr + 1) {
      hex.nakladka = Nakladka.Las;
    }
  }
}

function grantSandboxTechs(data: GameData): string[] {
  const ids: string[] = [];
  for (const row of data.tech) {
    const ep = row.Epoka ?? '';
    const id = row.Technologia;
    if (!id) continue;
    if (ep === 'Kamień' || ep === 'Brąz') ids.push(id);
  }
  return ids;
}

function makePlayerCity(q: number, r: number): City {
  return {
    id: 'city0',
    ownerId: 0,
    q,
    r,
    name: 'Testpolis',
    population: 9,
    magazynZywnosci: 40,
    maMur: false,
    garnizon: 0,
    oblegane: false,
    podzialHandlu: { ...DEFAULT_PODZIAL_HANDLU },
    podzialPracy: { ...DEFAULT_PODZIAL_PRACY },
    okolicaFocus: 'zrownowazone',
    okolicaTryb: 'auto',
    kulturaSkumulowana: 120,
    wealthState: { ...freshWealthState(), pula: 5 },
  } as City;
}

export function buildPlaytestMiastoEkonomia(map: GameMap, data: GameData): PlaytestMiastoResult | null {
  const center = findCityCenter(map);
  if (!center) return null;

  paintOkolicaSandbox(map, center.q, center.r);

  const city = makePlayerCity(center.q, center.r);
  const sight = citySightRadius(city.population, city.kulturaSkumulowana ?? 0);
  const visible = Array.from(computeVisibleAt(center.q, center.r, map, sight));
  const explored = [...visible];

  const initialProduction: CityProduction = {
    kolejka: [
      { kind: 'budynek', id: 'stolarnia', nazwa: 'Stolarnia', koszt: 20 },
    ],
    postep: 8,
  };

  return {
    cities: [city],
    explored,
    visible,
    focusQ: center.q,
    focusR: center.r,
    playerCityId: city.id,
    initialProduction,
    grantedTechIds: grantSandboxTechs(data),
  };
}
