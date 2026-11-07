STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-B-Q1
GOAL: przenieść do `src-tauri/frontend-v2/src/ui/` zmiany weba `86d510c66 → 9b019a7d8` dla armyStackHud, siegeMapPanel, unitRecruitCard, newGameFlow, empireDetailTypes.

ZMIANY-COMMIT: gałąź `op/R-RUSTPORT-REPIN-WEB-UI-3-B-Q1-r2` od commita Operatora r1 `25d2c3171` (kod `383bdf3d3`), worktree `wf_376433ce-6eb-3`. Kod portu (`src/ui/**`, `viewmodel/types.ts`) BEZ ZMIAN; zmienione tylko narzędzia, fixtura, dokumentacja, 4 nowe PNG.

## Odpowiedzi na zarzuty Evaluatora r1

- **N1 PRZYJMUJĘ.** `run-repin-ui3b.mjs`: sceny `ng-k4-ustawienia` i `ng-k4-autobuild-wl` mają pole `scrollTo: 'Automatyzacja budowy'`. Po zebraniu wektorów dla obu okien harness robi osobny zrzut `~row` (wiersz przewinięty `scrollIntoView({block:'center'})`), więc wektory DOM są bez zmian (`webVectorsSha256=08e0c960…` jak w r1). Nowa kontrola `PIX-ROW`: zrzuty `~row` przed i po przełączeniu muszą się różnić, inaczej błąd. Dowód: 22 zrzuty (18 + 4), `PIX-ROW 1280x720 / 360x640: różne`, PIX_różnych=0. Mutacja N2 (wiersz poza siatką): r1 `PIX_różnych=0`, r2 `PIX_różnych=4`. Dodano 4 PNG w `png/*_row_*`; 18 starych PNG jest bajtowo bez zmian. Obejrzałem PNG: na 1280×720 wiersz jest czytelny („Włączona”). Na 360×640 sąsiednie karty siatki nachodzą na siebie. Web i port są tu bajtowo równe, więc to układ weba przy wąskim oknie, nie błąd portu (przyczyny NIE_ZMIERZONO).
- **N2 PRZYJMUJĘ.** W `ui2c.json` pole `note` wymienia już tylko `hud`, `empireDetailPanel` i `work-tax`, z odnośnikiem do przeniesienia (U3B-Z1). Nikt nie czyta pola `note` (grep `\.note` w tools: 0 odczytów tego pliku).
- **N3 PRZYJMUJĘ.** `verify-repin-ui3-copies.mjs`: bez `--no-git` wynik WEB lub DELTA sprawdzone < liczby plików to `fail` (EXIT 1). Z `--no-git` skrypt wypisuje jawnie `DELTA NIE_ZMIERZONO n/5`. Dowód: atrapa `git` (exit 128) na początku PATH, co symuluje brak obiektów. Stara wersja (r1): `delta_sprawdzone=0`, EXIT=0. Nowa: `WEB … 0/5`, `DELTA … 0/5`, EXIT=1. Pełna historia: 5/5/5, EXIT 0.
- **N4 ODRZUCAM jako zarzut tej rundy.** Zgadza się to z ustaleniem r1 (U3B-Z4). Brakuje klucza w `rust-port/engine/data/ui-params.json`, który jest poza allowlistą (zakaz `rust-port/**`). Sprawa należy do P6 i jest jawnie zapisana.

## TESTY (kod końcowy r2)
- `tsc --noEmit` EXIT=0. `npm run check` EXIT=0: portDomUI3B 5, web 5/5, delta 5/5, niezgodnych 0.
- `run-repin-ui3b` (Chromium, `git archive 9b019a7d8`): 173 sceny, 1049 kroków, 22 PNG, PIX_różnych=0, PIX-ROW różne ×2, pokrycie 55/55, błędów strony 0, różnic 0, EXIT=0.
- Niezależny weryfikator: drugi `git archive 9b019a7d8` w osobnym katalogu daje fixturę bajtowo identyczną (sha256 `72aae713…`). Zmiana fixtury względem r1: dochodzą tylko 4 klucze `pngSha256`; `stepSha256_16` bez zmian.
- `mutate-repin-ui3b`: 27/27 wykrytych (przebiegi 13–19, 19–27, 0–6, 6–13).
- Regresja starszych harnessów: nie powtarzałem jej, bo kod `src/ui/**` i nakładka są bajtowo takie jak w r1. Liczby z r1 i od Evaluatora pozostają aktualne; ponowny pomiar r2 NIE_ZMIERZONO.

BLOKADY: brak. P6 bez zmian (starveFrac, liczba rekrutów, autoBuildEnabled, klucz w danych Rust).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator lub Final Control R-RUSTPORT-REPIN-WEB-UI-3-B-Q1.
DEPLOY-PUSH: NIE WYKONANO
