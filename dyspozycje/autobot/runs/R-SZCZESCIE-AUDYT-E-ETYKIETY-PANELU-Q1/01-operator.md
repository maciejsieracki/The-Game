# R-SZCZESCIE-AUDYT-E-ETYKIETY-PANELU-Q1 — Operator, runda 1

## Co zrobiono

`cityPanel.ts:3286-3325` (`renderSpoleczenstwo`, blok „Porządek łącznie"): przy istniejącym
`wkladBox` (`.civ-w4-wklad`) dodano — WYŁĄCZNIE kontekst, zero zmiany liczenia
`szWkladPct`/`prawWkladPct`:
1. `wkladBox.title` (natywny tooltip, wzorzec `bilans.title`/`chip.title` już w pliku) —
   tekst wprost rozróżnia „wkład TEJ TURY" (zmienny) od „stałej wagi bazowej mechanizmu".
2. Nowa, WIDOCZNA linia `.civ-w4-wklad-hint`: „Waga bazowa (<trudność>): Szczęście N% /
   Prawo M%" — bo natywny `title` nie maluje się w zrzucie headless Chromium, a temat
   wizualny wymaga tekstu faktycznie widocznego na stronie.

Realna waga: `loadOrderParams(data.societyParams, cfg.difficulty ?? 'normal')` — TA SAMA
funkcja co silnik (`computeOrderStateLocal`, już zaimportowana w pliku), odczyt WYŁĄCZNIE.
`data`/`cfg.difficulty` już były w zasięgu `renderSpoleczenstwo` — **zero nowego pola** w
`OrderState`/`OrderPanelState` (`orderPanel.ts` NIETKNIĘTY, wbrew wstępnemu założeniu
dispatchu „dodaj JEDNO nowe pole" — po sprawdzeniu realnego przepływu okazało się zbędne).

## Cytaty zweryfikowane grepem (przeciw samooszukiwaniu)

- `gra/src/ui/cityPanel.ts:219`: `import { loadOrderParams, type OrderYieldMults } from '../game/order';`
- `gra/src/ui/cityPanel.ts:306`: `difficulty?: Difficulty;` (pole `cfg`, dostępne w `renderSpoleczenstwo`)
- `gra/src/ui/cityPanel.ts:3051`: `const op = loadOrderParams(data.societyParams, difficulty);`
  (dowód: ta sama funkcja już czytana w tym pliku dla identycznego celu)
- `gra/src/game/order.ts:266-267`: `wagaSzczescie: pick(p.porzadek_waga_szczescie, difficulty, f.wagaSzczescie), wagaPrawo: pick(p.porzadek_waga_prawo, difficulty, f.wagaPrawo),`
- `gra/data/society-params.json:667-677`: `porzadek_waga_szczescie` easy/normal/hard =
  0.55/0.5/0.45; `porzadek_waga_prawo` = 0.45/0.5/0.55 (D18-A) — zgodne z GENEZĄ dispatchu.

## Bramki

- `tsc --noEmit` (gra/): czysto, zero błędów.
- `node tools/porzadek-panel-czytelnosc-test.cjs`: **93/0** (baseline PRZED tematem: 81/0,
  zero osłabienia — +12 nowych asercji, sekcja L, wiring tooltipu/linii/guard formuły).
- NOWA `node tools/szczescie-audyt-e-etykiety-panelu-real-render-test.cjs`: **18/0**, żywy
  Chromium (Playwright, fallback `/opt/pw-browsers/chromium-1194`). Pokrywa: tooltip
  natywny, widoczną linię `.civ-w4-wklad-hint`, wartość wagi PODĄŻAJĄCĄ za danymi
  (`data.societyParams` zmutowany W PAMIĘCI na 91/9 → DOM pokazuje 91/9; realny plik
  `hard` → 45/55 zgodnie z D18-A), zero regresji dwóch pasków „N% wkładu", zrzut ekranu.
  Dowód nietautologiczności: drugi bundle z fragmentem tego tematu usuniętym W PAMIĘCI
  (regex na źródle w buforze esbuild, plik w repo nietknięty) — asercje (A2)/(A3)/(B1)/(B2)
  na nim REALNIE czerwienieją (sekcja E, 5/5 potwierdzeń).
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test`
  33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone.

## Zrzut

Zapisany lokalnie w scratchpadzie sesji (nie w repo) — pokazuje panel „Porządek łącznie"
z widoczną linią „Waga bazowa (normal): Szczęście 91% / Prawo 9%" pod dwoma paskami
„Szczęście: 100% wkładu" / „Prawo: 0% wkładu".

## Zero zmiany formuły

`society-breakdown.ts` (`orderContributionPct`/`computePorPct`), `order.ts`,
`data/society-params.json` — NIETKNIĘTE (allowlista). `orderPanel.ts` — NIETKNIĘTY (okazał
się niepotrzebny, patrz wyżej). Zmiana WYŁĄCZNIE w `cityPanel.ts` (allowlista) + 2 bramki.
