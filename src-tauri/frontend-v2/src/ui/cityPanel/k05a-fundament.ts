/**
 * K05A batch 1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1, runda 1): jednostki K05 bez DOM i bez importów logiki.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56), blok K05 wg `pomiar-r2.json`; wybór wykonany skryptem
 * `tools/dom-harness/select-k05a.mjs` (gate S: lista z `r1-logi/wybrane.json`). Treść przeniesiona bajt-w-bajt
 * z pinu (łącznie z komentarzami), z dopisanym `export` przy deklaracjach najwyższego poziomu.
 * Reguła P5.13: funkcje czysto formatujące/geometryczne; żadna reguła gry nie jest liczona w UI.
 */

export const ENTITY_CARD_BUILDING_STYLE_ID = 'civ-city-panel-entity-card-css-v1';

/** Wstrzykuje `ENTITY_CARD_CSS` (bazowe style `.entity-card*` z `entityCards/renderer.ts`)
 * raz do dokumentu, plus lokalne dopasowanie szerokości karty (434px domyślnie) do
 * hover-docku panelu miasta (`HOVER_DETAIL_DOCK_W`=400px, `hoverDetailDock.ts`) i
 * pływającego tooltipu poza dockiem — bez tego karta (dziś renderowana przez wspólny
 * `renderEntityCard`) przycinałaby się w docku. Zaimplementowane TUTAJ (wewnątrz
 * `buildBuildingDetailCard`, jedynej funkcji z allowlisty T5 dotykającej stylów) zamiast
 * w głównym `ensureStyles()`/`css` template (poza allowlistą T5) — wzorem
 * `ensureUnitInfoCardStyles()` z T4 (`unitInfoCard.ts`), tylko wołane lazily przy
 * pierwszym zbudowaniu karty budynku zamiast osobnej eksportowanej funkcji. */

export function hexDist(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q2 - q1, dr = r2 - r1;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

/** Kompaktowy podgląd (ui-params) rozszerzany o heksy z faktycznym 👤 / auto-przydziałem. */

export function rangeName(R: number): string {
  if (R <= 5) return 'małe miasto';
  if (R <= 10) return 'średnie miasto';
  return 'duże miasto';
}
/** Liczba heksów dodanych przez `rings` pierścieni kultury poza promieniem R. */

export function ringsTiles(R: number, rings: number): number {
  let n = 0;
  for (let k = 1; k <= rings; k++) n += 6 * (R + k);
  return n;
}

export function okStat(key: string, val: string, sub: string): string {
  return `<div class="okstat"><span class="ks">${key}</span><b>${val}</b> <span class="muted">${sub}</span></div>`;
}

/** Mapa `ImprovementKey` (klucz obiektu w `terrain-improvements.json`) → nazwa gracza
 * (`row.nazwa`) — T7b (KARTA-ULEPSZENIA-TERENU), call-site 3/3, sekcja „Ulepszenia
 * w zasięgu". Ten sam wzorzec odwrotny co `IMPROVEMENT_NAME_TO_KEY` w
 * `techDiscoveryNotice.ts`/`technologyAdapter.ts` (Bug B, R-TECH-ULEPSZENIA-TERENU-SYNC-Q1),
 * tylko w drugą stronę (tu KLUCZ jest już znany — z `improvementKeysForHex` — brakuje
 * tylko etykiety do wyświetlenia w wierszu). */
