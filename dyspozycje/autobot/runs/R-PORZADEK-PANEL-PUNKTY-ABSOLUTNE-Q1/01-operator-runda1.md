STATUS: PASS
DOMAIN: GAME
TEMAT: R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1
GOAL: Bloki Szczęście i Prawo w panelu miasta (`gra/src/ui/cityPanel.ts`) pokazują obok
procentu także netto/max w punktach (np. "27% (9/35 pkt)"), zero zmiany balansu/formuły.

ZMIANY/COMMIT:
- `gra/src/ui/orderPanel.ts`: `OrderState` — dwa NOWE opcjonalne pola `szMax?`/`prawMax?`
  (istniejące pola bez zmian).
- `gra/src/ui/cityPanel.ts`:
  - `computeOrderStateLocal` (~L3199): dopisane `szMax: ordPct.sz.szMax`,
    `prawMax: ordPct.prawo.prawMax` do literału `state` (wartości już liczone w silniku,
    `society-breakdown.ts` nietknięty).
  - `resolveOrderState` (~L3067-3072): gałąź `fromEngine: true` też nadpisuje
    `szMax`/`prawMax` z `computed.state` — silnik (`main.ts::cityOrderState`, poza
    allowlistą) jeszcze nie wystawia tych pól, więc bez tego live-branch dawałby
    `undefined` mimo istniejącej wartości lokalnie.
  - `appendW4PctMetricBlock` (~L4506): nowy opcjonalny param `pointsLabel?: string`,
    renderowany jako `<span class="civ-w4-subhd-pts">` obok istniejącego `N%`.
  - Wywołania dla Szczęście/Prawo (~L3294/3304): przekazują
    `(N/M pkt)` zbudowane z `state.szczescie`/`state.szMax` i `state.porzadek`/`state.prawMax`
    (zweryfikowane ręcznie w żywym zrzucie: `porzadek` = `prawo.netto`, potwierdzone —
    "Prawo0%(0/47 pkt)" zgadza się z `ordPct.prawo.netto=0`).
  - `buildPorzadekDetailCard` (~L3396-3404): wiersze "Szczęście"/"Prawo" gridu pokazują
    teraz `N% (netto/max pkt)` zamiast samego `N%` (fallback na sam `%` gdy `szMax`/`prawMax`
    brak — kompat wstecz).
  - CSS: dodana `.civ-w4-subhd-pts` (~L2182) obok istniejącej `.civ-w4-subhd-pct`.
- NOWA bramka `gra/tools/porzadek-panel-punkty-absolutne-real-render-test.cjs` — bunduje
  przez esbuild PRAWDZIWY `cityPanel.ts` (wzorzec identyczny jak
  `citypanel-uwagi-hostcard-removed-real-render-test.cjs`), realnie renderuje w headless
  Chromium (Playwright) `renderSpoleczenstwo` + `buildPorzadekDetailCard` z realnymi danymi
  (`loadGameData()`), 10/10 asercji PASS.
Brak commita SHA — do zrobienia po tym raporcie (patrz niżej, wykonane).

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`): czysto, exit 0.
- `git diff --check`: czysto (brak whitespace errors).
- Istniejące bramki cityPanel/porządek (uruchomione wszystkie znalezione
  `*citypanel*`/`*cityPanel*`/`*porzadek*` w `gra/tools/`):
  - `citypanel-konwerter-produkcja-test.cjs`: 83 pass, 0 fail
  - `citypanel-uwagi-abc-filter-test.cjs`: 35 pass, 0 fail
  - `citypanel-uwagi-hostcard-removed-real-render-test.cjs`: 12 pass, 0 fail
  - `porzadek-panel-czytelnosc-test.cjs`: 93 pass, 0 fail
  - `spichlerz-cap-citypanel-wiring-test.cjs`: 12 pass, 0 fail
  Żaden nie zaczerwienił się.
- NOWA bramka `porzadek-panel-punkty-absolutne-real-render-test.cjs`: 10 pass, 0 fail —
  realny DOM po `renderSpoleczenstwo`: `"Szczęście":"27%(9/35 pkt)"`,
  `"Prawo":"0%(0/47 pkt)"`; karta szczegółów: `"Szczęście: 27% (9/35 pkt)"`,
  `"Prawo: 0% (0/47 pkt)"`.
- DOWÓD WIZUALNY (żywy zrzut Chromium, zgodnie z regułą anty-halucynacyjną): zrzut
  `panel-blocks.png` (headless Chromium, fallback binarka
  `/opt/pw-browsers/chromium-1194/`) pokazuje bezpośrednio w DOM tekst
  "Szczęście27%(9/35 pkt)" i "Prawo0%(0/47 pkt)" — NOWY tekst z liczbami punktów
  obok procentu, nie zgadywany z samego kodu. Zrzut zapisany lokalnie w scratchpadzie
  sesji (poza repo, poglądowy).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow).
DEPLOY/PUSH: NIE WYKONANO
