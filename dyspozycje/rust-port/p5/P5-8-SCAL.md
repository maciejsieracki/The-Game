# P5.8 SCAL — scalenie duplikatów K02 ↔ K01 (temat `R-RUSTPORT-P5-8-CITYPANEL-SCAL-K01K02-Q1`, runda 1/5)

**Status:** SCALONE (refaktor importów, bez zmiany zachowania). Zamyka R1 z `P5-8-K02.md` (duplikaty stałych układu, `BreakdownLine`, `statChip`, `LIST_ROW_HEIGHT_EM`, `applyBuildButtonVisualState`, `BUILDING_REQ_SECTION_LABELS`, lokalny `el`). Dokumentuje punkt wejścia orkiestracji dla Z10a (`bindTechHintLinkDelegation`). Pin: `edb8fb56` (`gra/src/ui/cityPanel.ts`), baza: `rust-port/parity-v2` @ `d123d988`.

## Zakres (allowlista)

`src-tauri/frontend-v2/src/ui/cityPanel/**` (k02-*, bez zmian w k01a/k01b), `src-tauri/frontend-v2/tools/dom-harness/**` (run/mutate k02), `PORTING-QUEUE.md` (dopisek), ten plik. Zero zmian w `gra/**`, `rust-port`, `WERSJE.md`.

## Tabela było / jest

| Symbol | Było (K02) | Jest (SCAL) | Źródło |
|---|---|---|---|
| `el(tag, cls?)` | lokalna kopia w `k02-breakdown.ts` i `k02-units.ts` | `import { el } from './k01b-dom'` (wywołania bez `html`, DOM identyczny) | `k01b-dom.ts:17` |
| `statChip` | lokalna kopia w `k02-units.ts` | `import { statChip } from './k01a-fundament'` | `k01a-fundament.ts:596` |
| `LIST_ROW_HEIGHT_EM` | lokalna kopia w `k02-styles.ts` i `k02-units.ts` | import z `k01a-fundament` (2.75) | `k01a-fundament.ts:334` |
| 8 stałych układu CSS (`STYLE_ID`, `CITY_PANEL_ICON_GLYPH_EM`, `CITY_PANEL_ICON_RAIL_VERT_EM`, `LIST_SCROLL_VISIBLE`, `LIST_ROW_HEIGHT_COMPACT`, `RECRUIT_QUEUE_VISIBLE`, `BUILD_QUEUE_VISIBLE`, `QUEUE_ROW_EM`) | lokalne kopie w `k02-styles.ts` | import z `k01a-fundament` (wartości bez zmian) | `k01a-fundament.ts:298-327` |
| `applyBuildButtonVisualState` | lokalna kopia w `k02-units.ts` | `import { applyBuildButtonVisualState } from './k01b-dom'` | `k01b-dom.ts:66` |
| `BUILDING_REQ_SECTION_LABELS` | lokalna kopia w `k02-units.ts` | import z `k01a-fundament` | `k01a-fundament.ts:705` |
| `BreakdownLine`, `TabIndicatorChip`, `BuildingReqChip`, `BuildingReqChipKind` | `src/ui/cityPanel/types.ts` | typy importowane z `k01a-fundament` (`import type`); plik `types.ts` USUNIĘTY (jedyni konsumenci: k02-*) | `k01a-fundament.ts:612,623,679-690` |

Pozostałe jednostki K02 (`appendBreakdownLines`, `fillIconElement`, `createScrollList`, …, `bindTechHintLinkDelegation`) — bez zmiany sygnatur i treści; zmieniono tylko importy.

## Lista zmian API względem pinu i względem K02 r3

- Sygnatury eksportów K02 **bez zmian**. Eksport `ensureCityPanelStyles`, `appendBreakdownLines` i pozostałe jednostki jak w `P5-8-K02.md`.
- Usunięty moduł `src/ui/cityPanel/types.ts` (typy przeniesione do `k01a-fundament.ts`; kod poza K02 go nie importował).
- `el` pochodzi teraz z `k01b-dom.ts` (sygnatura nadzbiór: `el(tag, cls?, html?)`; K02 wywołuje tylko z `tag` i `cls`, więc zachowanie identyczne).
- Nowa zależność czasu ładowania: moduły K02 importują K01 (`k01a-fundament` → `uiParams` → katalog statyczny). **Import K02 przed `installStaticCatalog` rzuci błąd** (ZAŁOŻENIE P5.2-Z1). `main.ts` instaluje katalog przed panelami, więc produkcja jest bezpieczna; integracja K09 musi zachować kolejność.
- Nowa zależność: `k01b-dom.ts` ciągnie `../hoverDetailDock` (import `attachInteractiveDetail`). Zachowano.

## Z10a — punkt wejścia orkiestracji (K09), dokumentacja bez zmiany kodu

`bindTechHintLinkDelegation(openPreview)` (`k02-units.ts`, komentarz przy funkcji) MUSI być wywołane **dokładnie raz** przy starcie UI:

```ts
bindTechHintLinkDelegation((techName) =>
  showTechDiscoveryNotice({ techName, eraIndex: 1, kind: 'preview' }));
```

- Pin (`gra/src/ui/cityPanel.ts:7293`) wiązał delegację automatycznie przy ładowaniu modułu; port tego nie robi (nie ma dostępu do `showTechDiscoveryNotice`). Bez wywołania kliknięcie i Enter/spacja na `.cp-tech-hint-link` nie działają.
- Wielokrotne wywołanie jest bezpieczne (flaga `techHintLinkDelegationBound`, pomiar: mutacja M26 wykryta).
- Stan: BLOKADA integracji pozostaje otwarta do czasu podpięcia w K09 (poza zakresem tego tematu).

## Harness i mutacje — zmiany narzędzi (bez osłabiania)

1. `run-k02-units.mjs`, `run-k02-styles.mjs`, `run-k02-breakdown.mjs`: bundlowanie razem z `controller/staticCatalog.ts`; katalog instalowany z `gra/data/ui-params.json` pina przed importem bundla v2 (wzorzec z `run-k01a.mjs`). Dodano `findFile` (wyjście esbuild przy wielu wejściach zachowuje podkatalogi).
2. `mutate-k02-units.mjs`, `mutate-k02-styles.mjs`: po scaleniu wzorce (statChip, etykiety wymagań, `applyBuildButtonVisualState`, stałe układu) leżą w `k01a-fundament.ts` / `k01b-dom.ts`. Każda mutacja trafia w plik, w którym wzorzec występuje dokładnie raz (sprawdzane po wszystkich kandydatach). Mutacja M6 (statChip) ma kotwicę `pctSubheadHtml` — w pliku K01 wzorzec `cv ${cls}` występuje dwukrotnie (statChip i statChipBrand).
3. `mutate-k02-breakdown.mjs`, `run-k02-breakdown` wzorce bez zmian (kod w `k02-breakdown.ts`).

## Pomiary (runda 1)

Wszystkie wykonane lokalnie w `src-tauri/frontend-v2/` po `npm ci`; pin wyciągnięty `git archive edb8fb56 gra/src gra/data` do katalogu poza repo.

| Bramka | Wynik |
|---|---|
| `npm run typecheck` | EXIT 0 |
| `npm run check` | EXIT 0 (self-test 33/15; 156 plików, 0 trafień; verify-pin-copies 435/0) |
| `run-k02-units --pin-dir` | asercji 50, różnic 0, jsdomErrors 0 |
| `mutate-k02-units` | 34/34 wykryte, przywrócenie bajtowe OK |
| `run-k02-styles --pin-dir` | asercji 14, różnic 0, CSS 103530 = 103530 |
| `mutate-k02-styles` | 8/8 wykryte, przywrócenie OK |
| `run-k02-breakdown --pin-dir` | asercji 12, różnic 0 |
| `mutate-k02-breakdown` | 9/9 wykryte, przywrócenie OK |
| `run-k01a --pin-dir` | ZIELONE (A,B,C,D,S,T,I,V,E,F) |
| `mutate-k01a --pin-dir` | 9/9 wykryte |
| `run-k01b --pin-dir` | ZIELONE (X,E,F,P,N,J) |
| `mutate-k01b --pin-dir` | 9/10 wykryte; linia behawioralna zielona (wynik jak przed zmianą, pliki K01 nietknięte) |
| `git diff --check` | czysto |

Pliki K01 (`k01a-fundament.ts`, `k01b-*.ts`) NIE zmieniły się w tym temacie.

## NIE_ZMIERZONO (uczciwie)

- Przeglądarka i wizualna równoważność: nie sprawdzono (tylko harness jsdom).
- Pełna macierz wejść: harnessy obejmują przypadki zestawu, nie całą przestrzeń.
- Dryf po pinie (P5-8 §7) dla całego `cityPanel.ts`: nie mierzono w tej rundzie; dla zakresu K01/K02 wynik harnessów 0 różnic.
- Ścieżka emoji (`cpInlineIcons`) dla K02: jak w `P5-8-K02.md` — statycznie bez emoji w K02, nie mierzono dynamicznie.
- Integracja K09 (wywołanie Z10a, kolejność instalacji katalogu, podpięcie `openPreview`): poza zakresem tematu.
