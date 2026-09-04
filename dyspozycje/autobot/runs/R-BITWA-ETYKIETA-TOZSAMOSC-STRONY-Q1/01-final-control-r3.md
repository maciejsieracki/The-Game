FINAL CONTROL — R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1 — RUNDA 3/5
DATA: 2026-09-04
MODEL+EFFORT: Sonnet 5, effort high

## Zakres weryfikacji (samodzielne, świeże uruchomienie w tym worktree)

1. `node tools/bitwa-podsumowanie-dispose-test.cjs` → **16/16 PASS**.
2. `node tools/r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs` → **42/42 asercje PASS**
   (21 w sandboxie `?playtest=walka`, 21 w `?playtest=mapa`, szturm miasta). Faktyczny tekst
   werdyktu odczytany ze zrzutu DOM (`/tmp/live-atak-*/dom.txt`, oba sandboxy):
   `WERDYKT` / `Rzymianie wygrywa` — civLabel, NIE nazwa jednostki ("Hastati wygrywa" NIE
   występuje). Pasek nagłówka bitwy: bold lewy "Rzymianie", bold prawy "Grecy", oba medaliony
   to `<img>` portretu władcy (nie `PB_SVG.commander`). Błędy konsoli: 0 w obu przebiegach.
3. `npx tsc --noEmit` → 0 błędów. Bramki referencyjne (§6 R-PROC-AUTOBOT.md):
   `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33,
   `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 — wszystkie zgodne z wynikiem
   referencyjnym. (`unit-power-test.cjs` i `map-gen-regression-test.cjs` pominięte zgodnie
   z notatką tabeli — pierwszy czerwony pre-istniejąco, drugi wolny/uruchamiany osobno;
   żaden z nich nie jest w zakresie tego tematu.)
4. `git diff --stat` względem merge-base `origin/main` (HEAD == merge-base, gałąź
   fast-forwardable): zmienione `gra/src/battle/battleScene.ts`,
   `gra/src/game/battle-summary.ts`, `gra/src/main.ts`, `gra/src/ui/postBattleSummary.ts`,
   `gra/tools/bitwa-podsumowanie-dispose-test.cjs`; nowe (untracked)
   `gra/tools/r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs`,
   `gra/tools/r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs`,
   `gra/tools/r-bitwa-etykieta-tozsamosc-strony-zrodlo-test.cjs`. Poza ratyfikowanym
   rozszerzeniem `main.ts` (7 dodatkowych grup hunków, zmapowanych i ocenionych linia po
   linii przez Evaluatora jako niezbędne do naprawy realnego błędu w zakresie GOAL —
   RATYFIKOWANE przez orkiestratora, nie ocenione tu ponownie jako zarzut) wszystko mieści
   się w allowliście dispatchu: `battleScene.ts` (GOAL 1/2), `battle-summary.ts` (GOAL 2),
   `postBattleSummary.ts` (GOAL 2), nowe/rozszerzone testy w `gra/tools/*-test.cjs`.
   `git diff --check` na zmienionych plikach: czysty (brak konfliktów białych znaków).
5. Kod naprawy `civLabel`:
   - `_sideDisplayLabel()` (`battleScene.ts:8856-8886`) czyta `_civLabelForSideExplicit(side)`
     jako PIERWSZE źródło (linia 8875-8876); dopiero potem custom side-label, potem
     `snaps[0].typeId`/`nazwa jednostki` jako ostatnia linia obrony. Komentarz w kodzie
     dokumentuje, że runda 3 poprawiła wcześniejszy błąd (fallback na nazwę jednostki był
     realnie ZAWSZE osiągalny w prawdziwej grze, bo każdy wołający ustawia custom side-label
     na nazwę jednostki/"Skład (N)").
   - `applyMapBattleOutcomeWithSummary()` (`main.ts:23806-23868`) — druga ścieżka budowania
     `PostBattleSummaryData` (mapowe podsumowanie po "POWRÓT NA MAPĘ", widok ze zgłoszenia
     właściciela). `atkLabel: (summary.atkCivLabel ?? '').trim() || summary.atkLabel` —
     identyczny priorytet civLabel → nazwa jednostki. Ta poprawka jest tym, co naprawił
     werdykt "Hastati wygrywa" → "Rzymianie wygrywa", zweryfikowany żywo w punkcie 2 powyżej.

## Agregat 4 zarzutów rundy 3 Evaluatora

Wszystkie 4 potwierdzone jako naprawione przez drugą weryfikację Evaluatora (ten sam Opus 5):
bramka dispose 16/16, werdykt mapowego podsumowania naprawiony i dowiedziony żywo
("Rzymianie wygrywa" z mutacją 3 czerwoną), allowlist `main.ts` jawnie rozdzielony w raporcie
Operatora. Zero nowych defektów kodu znalezionych przeze mnie w tej weryfikacji.

## Jedyny pozostały punkt: uzasadnienie blokady kryteriów 3/5 (POPRAWIONE, bez fałszu)

Evaluator sam sprawdził w sondażu, że `startNewGame` generuje miasta-państwa (18 MP w jego
próbie) — zdanie "startNewGame daje ZERO miast-państw" użyte we wcześniejszym uzasadnieniu
blokady było **fałszywe** i tu jest wycofane. Prawdziwa, zweryfikowana przyczyna blokady
kryteriów 3 i 5 (brak żywego dowodu ikon miasto-państwo/barbarzyńca w KLIKANEJ bitwie, dowód
istnieje wyłącznie przez wstrzyknięcie danych, uczciwie oznaczone w kodzie jako granica
użycia) jest inna i pozostaje realna:

- Po założeniu stolicy przez `startNewGame` gracz ma **0 jednostek** na mapie — nie ma czym
  kliknąć w bitwę.
- Miasta-państwa i barbarzyńcy, gdy w ogóle powstają, generują się dziesiątki heksów od
  stolicy gracza — poza zasięgiem jakiegokolwiek ruchu/ataku w rozsądnym czasie testu.
- Żaden istniejący preset (`?playtest=walka`, `?playtest=mapa`, `?playtest=odskok3v3`) nie
  stawia miasta-państwa ani barbarzyńcy jako jednej ze stron bitwy — wszystkie trzy presety
  to starcia pełna-cywilizacja vs pełna-cywilizacja (Rzymianie vs Grecy w tej rundzie).

Naprawa tego wymaga nowego presetu testowego (miasto-państwo lub barbarzyńca jako strona
bitwy) — poza obecną allowlistą tego tematu. RATYFIKOWANE przez orkiestratora jako
udokumentowane ograniczenie do osobnego, przyszłego tematu, jeśli właściciel uzna to za
istotne. Nie blokuje integracji GOAL 1 (w pełni dowiedziony, żywo, oba sandboxy) ani GOAL 2
dla pełnych cywilizacji (w pełni dowiedziony — portrety władców zamiast generycznej ikony,
oba rogi, oba sandboxy).

## Werdykt

**GOTOWOŚĆ DO INTEGRACJI: TAK.**

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1
GOAL: GOAL 1 (civLabel zamiast nazwy jednostki — bold nagłówka + oba werdykty) i GOAL 2 dla
pełnych cywilizacji (portret władcy zamiast generycznej ikony) w pełni dowiedzione żywo.
ZMIANY/COMMIT: patrz `git diff --stat` w punkcie 4 wyżej; brak nowego commita w tej rundzie
poza istniejącymi zmianami w working tree tego worktree (integracja/commit poza zakresem
Final Control).
TESTY: dispose 16/16, live-atak 42/42, tsc czysty, logic 213/213, tech-tree 19/19,
research 33/33, unit-replace 13/13, combat 6/6.
BLOKADY: kryteria 3/5 (ikona miasto-państwo/barbarzyńca bez żywego dowodu z klikanej bitwy) —
przyczyna: gracz ma 0 jednostek po założeniu stolicy, miasta-państwa/barbarzyńcy generują się
daleko od startu, brak presetu testowego stawiającego miasto-państwo/barbarzyńcę jako stronę
bitwy. RATYFIKOWANE przez orkiestratora jako ograniczenie do osobnego przyszłego tematu.
RUNDY: 3/5.
NASTĘPNY KROK: integracja orkiestratora (allowlist-only, main.ts rozdzielony jak w punkcie 4).
DEPLOY/PUSH: NIE WYKONANO.
