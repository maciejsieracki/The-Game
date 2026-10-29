/**
 * K05A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1, runda 2): jednostki K05 bez DOM i bez importów wartości logiki gry.
 *
 * Każdy blok poprzedzony markerem `// pin edb8fb56 gra/src/<plik>:A-B` jest kopią linii A..B pinu, łącznie z komentarzami
 * dokumentacyjnymi (bramka `tools/dom-harness/verify-k05a-copies.mjs`). Jedyna zmiana bajtowa: `export ` przy deklaracjach
 * najwyższego poziomu (dopuszczone przez verify). Wyjątki udokumentowane w P5-8-K05A.md §5:
 *   K05A-Z1 — lokalne kopie typów/enum z pinu (`TerenBazowy` z types/hex.ts, `OkolicaTryb` z game/cities.ts);
 *   K05A-Z2 — w `okolicaPreviewRadius` parametr `city: City` zastąpiony typem `CityHexRef` (DTO: pola q, r).
 * Reguła P5.13: funkcje tylko formatują i liczą geometrię podglądu; żadna reguła gry nie jest liczona w UI.
 */

import { UI_PARAMS } from '../uiParams';

/** ZAŁOŻENIE K05A-Z2: pozycja miasta z DTO (jedyne pola `City` używane przez okolicaPreviewRadius). */
export type CityHexRef = { readonly q: number; readonly r: number };

// pin edb8fb56 gra/src/types/hex.ts:12-24
export enum TerenBazowy {
  Laka     = 'laka',
  Rownina  = 'rownina',
  Wzgorza  = 'wzgorza',
  Gory     = 'gory',
  /** Płytkie morze — teren WODNY (patrz isWaterTerrain w units/setup.ts); nazwa "wybrzeże"
   *  myliła (P-MAPGEN-PANGEA-OBRYS P4, 2026-09-03) — zmieniona na PlytkieMorze/'plytkie_morze'. */
  PlytkieMorze = 'plytkie_morze',
  Morze    = 'morze',
  Pustynia = 'pustynia',
  /** Strefa polarna (śnieg) — niezamieszkana, C-MAP-Q3b. */
  Polarny  = 'polarny',
}

// pin edb8fb56 gra/src/game/cities.ts:48-48
export type OkolicaTryb = 'auto' | 'reczny';

// pin edb8fb56 gra/src/ui/cityPanel.ts:7465-7465
export const ENTITY_CARD_BUILDING_STYLE_ID = 'civ-city-panel-entity-card-css-v1';

// pin edb8fb56 gra/src/ui/cityPanel.ts:9495-9500
export const TEREN_COL: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '#0d2236', [TerenBazowy.PlytkieMorze]: '#14506a',
  [TerenBazowy.Laka]: '#243a24', [TerenBazowy.Rownina]: '#3f3815',
  [TerenBazowy.Pustynia]: '#4a3a18', [TerenBazowy.Wzgorza]: '#3a2f18', [TerenBazowy.Gory]: '#2e2e2e',
  [TerenBazowy.Polarny]: '#d8e4f0',
};

// pin edb8fb56 gra/src/ui/cityPanel.ts:9501-9506
export const TEREN_LETTER: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '~', [TerenBazowy.PlytkieMorze]: '~',
  [TerenBazowy.Laka]: 'Ł', [TerenBazowy.Rownina]: 'R',
  [TerenBazowy.Pustynia]: 'P', [TerenBazowy.Wzgorza]: 'W', [TerenBazowy.Gory]: 'G',
  [TerenBazowy.Polarny]: '❄',
};

// pin edb8fb56 gra/src/ui/cityPanel.ts:9507-9510
export function hexDist(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q2 - q1, dr = r2 - r1;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9512-9539
/** Kompaktowy podgląd (ui-params) rozszerzany o heksy z faktycznym 👤 / auto-przydziałem. */
export function okolicaPreviewRadius(
  city: CityHexRef,
  Rwork: number | undefined,
  worked: { q: number; r: number }[] | undefined,
  reczne: Record<string, number> | undefined,
  tryb: OkolicaTryb,
): number {
  const fallback = Math.max(UI_PARAMS.panel_miasta.okolica_promien, 3);
  const cap = Rwork ?? fallback;
  let displayR = Math.min(fallback, cap);
  const bump = (q: number, r: number) => {
    const d = hexDist(city.q, city.r, q, r);
    if (d <= cap && d > displayR) displayR = d;
  };
  if (tryb === 'reczny') {
    for (const [key, count] of Object.entries(reczne ?? {})) {
      if (!count || count <= 0) continue;
      const parts = key.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      if (Number.isFinite(q) && Number.isFinite(r)) bump(q, r);
    }
  } else {
    for (const t of worked ?? []) bump(t.q, t.r);
  }
  return displayR;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9541-9545
export function rangeName(R: number): string {
  if (R <= 5) return 'małe miasto';
  if (R <= 10) return 'średnie miasto';
  return 'duże miasto';
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9546-9551
/** Liczba heksów dodanych przez `rings` pierścieni kultury poza promieniem R. */
export function ringsTiles(R: number, rings: number): number {
  let n = 0;
  for (let k = 1; k <= rings; k++) n += 6 * (R + k);
  return n;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9552-9554
export function okStat(key: string, val: string, sub: string): string {
  return `<div class="okstat"><span class="ks">${key}</span><b>${val}</b> <span class="muted">${sub}</span></div>`;
}
