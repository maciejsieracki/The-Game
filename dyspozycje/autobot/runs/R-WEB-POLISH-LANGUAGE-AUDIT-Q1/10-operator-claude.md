# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Operator, runda 4/5 (naprawa FC FAIL r3)

STATUS: PASS-WITH-NOTES (czeka na Evaluator r4 / Final Control r4 — orkiestrator decyduje o integracji)
DOMAIN: GAME (TEKSTY / PROCES JAKOŚCI)
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1
GOAL: zamknąć dwie luki z FC r3: (NAPRAW 1) etykiety rozmiaru mapy `Malenki`/`Super Huge` w ekranie generowania i w linii kontekstu zapisu; (NAPRAW 2) odmiana „tur” w komunikatach dyplomacji (`przez N tur` → biernik). Bez zmiany kluczy, liczb i logiki.
BAZA: 430cf74cf (kandydat, gałąź web-wip/R-WEB-POLISH-LANGUAGE-AUDIT-Q1) + merge origin/main b0b0e3f86 (merge commit e0bb88efd; merge-tree czysty przed merge).

## ZMIANY / COMMIT
Allowlista: gra/src/ui/newGameFlow.ts, gra/src/ui/saveLoadDialog.ts, gra/src/game/diplomacy-display.ts, gra/tools/polish-language-audit-q1-guard-test.cjs, gra/tools/terminology-trade-vs-tax-test.cjs, dyspozycje/autobot/runs/R-WEB-POLISH-LANGUAGE-AUDIT-Q1/10-operator-claude.md.

- NAPRAW 1 (etykiety rozmiaru mapy):
  - gra/src/ui/newGameFlow.ts:2231 — wiersz „Rozmiar mapy” w renderGenStep: `p.mapSize` → `mapSizeDisplayLabel(p.mapSize)` (import już był).
  - gra/src/ui/saveLoadDialog.ts:49 — linia kontekstu zapisu (formatSaveContext): `f.mapSize` → `mapSizeDisplayLabel(f.mapSize)`; dodany import z `../util/map-size-display`.
  - Efekt: „Malenki” → „Maleńki”, „Super Huge” → „Bardzo ogromny” (źródło: gra/src/util/map-size-display.ts, bez zmian). Klucze nietknięte.
- NAPRAW 2 (odmiana tur, gra/src/game/diplomacy-display.ts):
  - 6 miejsc: `przez ${turns} tur` (4×) → `przez ${formatTurCountAcc(turns)}`; `(umowa na ${turns} tur)` (2×) → `(umowa na ${formatTurCountAcc(turns)})`. Dodany import `formatTurCountAcc` z `../ui/formatPl`.
  - Efekt: 1 → „1 turę”, 2–4 → „N tury”, 5+ → „N tur” (formatTurCountAcc, biernik).
- Poprawka pokrewna (wykryta przez strażnika po objęciu diplomacy-display.ts): gra/src/game/diplomacy-display.ts:35 — `„Wpływ Relacji na deal"` (ASCII zamykający cudzysłów) → `„Wpływ Relacji na deal”`. Czysto typograficzna (kategoria 3, pewna).
- Strażnik gra/tools/polish-language-audit-q1-guard-test.cjs: dopisano `gra/src/game/diplomacy-display.ts` do GAME_TEXT_FILES; reguły `Maleński` oraz `przez ${turns} tur` / `umowa na ${turns} tur` (z mutacją); sekcja 4 sprawdza, że newGameFlow (Rozmiar mapy), saveLoadDialog (linia kontekstu) i diplomacy-display (import) faktycznie używają nowych helperów, z mutacją każdego regexu.
- Test gra/tools/terminology-trade-vs-tax-test.cjs:172 — asercja „[P] Mennica (karta odkrycia)” dopasowywała stary tytuł `Mennica: ×1,50 podatku w każdym mieście`; aktualna karta w data/tech-cards-top5.json (od R-WEB-CURRENCY-MULT-PER-CIV-Q1, już w 430cf74cf) to `Mennica: podatek ×1,38 lub więcej (zależnie od cywilizacji)`. Zaktualizowano oczekiwany tekst i regex na aktualną kartę (test nadal sprawdza tytuł karty). Dane kart NIE zmienione. Ta asercja była czerwona także przed tą rundą (799/0 z DODATKU 2 nie odpowiadało już bazie kandydata).
- wikiBundle: `node tools/bundle-wiki-for-game.cjs` uruchomione po merge; `git status` nie pokazuje zmiany gra/src/data/wikiBundle.json → regeneracja odtwarzalna (wynik identyczny z zacommitowanym).
- Commit: SHA w polu sha wyniku (commit „R-WEB-POLISH-LANGUAGE-AUDIT-Q1: runda 4 — etykiety rozmiaru mapy, odmiana tur, cudzysłów, strażnik”).

## TESTY (liczby z surowego wyjścia)
- `cd gra && npm ci --ignore-scripts` — exit 0 (bez `npm run build`/`dev`).
- `npm run typecheck` (tsc --noEmit) — exit 0.
- `node tools/polish-language-audit-q1-guard-test.cjs` — exit 0; „runda 2, UI: 5114 ok, 0 fail”; „ogół: 7160 ok, 0 fail” (przed poprawką regexu sekcji 4 wynik był 2 fail — naprawiony regex sprawdzający, nie wynik kodu).
- `node tools/ids-leak-audit-test.cjs` — exit 0; „WYNIK: 1648 ok, 0 FAIL”.
- `node tools/wonder-text-no-raw-ids-test.cjs` — exit 0; „WYNIK: 132 ok, 0 FAIL”.
- `node tools/terminology-trade-vs-tax-test.cjs` — exit 0; „799 pass, 0 fail” (po aktualizacji asercji Mennica; przed: 798/1).
- `node tools/hud-gross-net-rest-test.cjs` — exit 0; „808 ok, 0 fail”.
- `node tools/civpedia-wikihubhud-rys-historyczny-duplikacja-test.cjs` — exit 0; „7 pass, 0 fail”, „ALL GREEN”.
- `node tools/city-administrator-test.cjs` — exit 0; „119 passed, 0 failed”.
- `node tools/diplomacy-display-test.cjs` — exit 0; „44 OK, 0 FAIL”.
- `node tools/newgame-defaults-test.cjs` — exit 0; „62 pass · 0 fail”.
- 5 bramek referencyjnych (R-PROC-AUTOBOT §Bramki): logic-test 213/213 (exit 0); tech-tree-test 20 pass/0 fail (exit 0; dokument podaje 19/19 jako punkt odniesienia z 2026-08-20 — wynik lepszy, nie regresja); research-test ALL GREEN (exit 0); unit-replace-test 21/21 (exit 0); combat-test „All sanity checks passed” (exit 0).
- `git diff --check` — exit 0.
- Uwaga: `node tools/ui-language-count-renderer-test.cjs` — NIEZIELONY, błąd esbuild „Build failed with 25 errors” (stuby testowe `brand-assets-stub`/`diplo-display-stub` nie eksportują nowszych importów z plików buildModeHud.ts, cityPanel.ts, diploListHud.ts, diploUiSkin.ts). Żaden z błędów nie dotyczy plików zmienionych w tej rundzie. Nie sprawdzono na czystym origin/main (NIE_ZMIERZONO), wygląda na dług testowy po merge z main.
- Nie uruchamiano przeglądarki ani testów realnego renderu (NIE_ZMIERZONO) — zmiany tekstowe bez zmiany układu.
- Test newgame-defaults zapisał dwa pliki evidence/*.png w worktree; przywrócone `git checkout` (nie wchodzą do commita).

## BLOKADY
Brak blokad procesowych. Otwarte poza zakresem (zgodnie z DODATKIEM — nie ruszane): „upgrade” w polu wymagania, „Zrówn.”, „×N”, Dur-Sharrukin, Emporion/Wielka Kuźnia w top3, „złoto” vs „Pieniądz”, „(poniżej N tur)”, „≥ N tur”. Audyt nadrzędny UI/CIVPEDIA pozostaje CZĘŚCIOWY.

## ZAŁOŻENIA
- Dla odmiany „tur” w zdaniach „umowa na …” przyjęto formatTurCountAcc (biernik: „na 1 turę”, „na 2 tury”, „na 5 tur”), zgodnie z istniejącym helperem projektu.
- Aktualizacja asercji Mennica uznana za wyrównanie testu do zatwierdzonej karty (per-civ), a nie zmianę tekstu gry.

RUNDY: 4/5
NASTĘPNY KROK: Evaluator r4 (Sonnet) na commicie operatora → Final Control r4 → integracja orkiestratora (nie Operator).
DEPLOY/PUSH: NIE WYKONANO
