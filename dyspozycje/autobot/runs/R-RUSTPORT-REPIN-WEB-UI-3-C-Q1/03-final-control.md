STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-C-Q1
GOAL: Przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany weba `86d510c66 → 9b019a7d8` w trzech plikach: `empireDetailPanel`, `hexContextTooltip` i `buildModeHud` (razem z przełącznikiem automatyzacji budowy).

ZMIANY/COMMIT:
- Oceniany stan: `cdd12d070` (kod `4306ccbc9`, raport Operatora `653c34690`, raport Evaluatora `cdd12d070`), baza `dde5e9034`.
- Diff `dde5e9034..cdd12d070`: 29 plików. Wszystkie są w allowliście: 3 pliki `src/ui/*`, `tools/**`, `src-tauri/frontend-v2/package.json` (+2 skrypty), `P5-REPIN-UI-2.md` §11.6 i `runs/…/**`.
- Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md` i `gra-robocza/**`. `viewmodel/types.ts` nie zmieniony. `git diff --check` czysty.
- Usunięte wpisy w nakładce UI-2 (`overlayPortsUI2D` −2, `ui2c.json` −1 `empireDetailPanel`) zgadzają się z regułą dispatchu: wpis przechodzi do manifestu UI-3.

ZARZUTY: Evaluator nie zgłosił zarzutów (`[]`). Obrona: brak. Uwagi Evaluatora 1–5 sprawdziłem tak:
- U1 ODDAL. NIE_DOTYCZY dla znacznika „Wyłącz filtr” w `run-repin-ui2d` zależy od tego, czy źródło weba zawiera `data-ulepszenia-unspent-disable-filter`, i jest wypisany w logu. Przycisk usunięto w webie 9b (SIMPLE-FOOD-RULE-NO-TOGGLES). To nie jest ogólne osłabienie harnessu.
- U2 ODDAL. Domyślna wartość `isAutoBuildEnabled ? … : true` jest taka sama jak w webie 9b `buildModeHud.ts:560`. Podpięcie haka należy do kontrolera P6, poza zakresem dispatchu.
- U3 ODDAL. Reguły po stronie Rust leżą poza allowlistą. Są jawnie odłożone jako U3C-Z2 i U3C-Z5.
- U4 ODDAL. L2 nie należy do bramek partii. Operator raportuje te same liczby.
- U5 ODDAL. To sprawa porządkowa. Ja używam wyłącznie własnego katalogu `fc-ui3c`.

TESTY (odtworzone przez FC na `cdd12d070`, Chromium 141 `/opt/pw-browsers/chromium-1194`):
- `tsc --noEmit` EXIT=0. `npm run check` EXIT=0: 230 plików, 0 trafień; pin 426/0; UI-2 0 niezgodnych; UI-3: portDom 3/3, kopii 12, adapter 1, deps 8, niezgodnych 0.
- WEB86U3 zbudowałem od zera: `git archive` 86d/9b, potem `repin-ui2-overlay --pin-dir WEB86 --web-dir WEB86 --web3-dir WEB3`, niezgodnych 0. Drugi `git archive 9b` dał drugi katalog nakładki.
- `run-repin-ui3c`, wynik identyczny na obu katalogach:
  - 696 przypadków, 12 PNG, PIX_różnych 0, MARKERS 19/19, GONE 0, asercji 14/14, błędów strony 0, różnic 0.
  - Obie fixtury mają sha256 `02fb1180…` i są bajtowo równe zacommitowanej. 12/12 PNG bajtowo równe `runs/…/png`.
- Obserwacja FC: odniesienie zbudowane z `--pin-dir` = pin `edb8fb56` (dane pinu, np. Tartak 200/t) daje inną fixturę (`9d1f0683…`), mimo że port = web nadal ma 0 różnic. Fixtura jest więc odtwarzalna tylko z WEB86U3 opisanym w nagłówku `run-repin-ui3c.mjs:17`. To zgodne z opisem, więc nie zgłaszam zarzutu.
- `mutate-repin-ui3c` (zakresy [0,1), [1,13), [13,27), [27,39)): 39/39 wykrytych, 0 przeżyło. `git status` po mutacjach czysty.
- Regresja, próbka FC na kodzie końcowym:
  - `run-level1a` na pin+UI-2+UI-3: 3618/0, jsdomErrors 0.
  - `run-repin-ui2d` na WEB86U3: 797/0, z jawnym NIE_DOTYCZY dla 1 znacznika.
  - Pozostałe wyniki (L0, L2, C4, hud, cityux, cycles, UI-2-A…G, UI-3-A) przyjmuję z raportów Operatora i Evaluatora. Zgadzają się ze sobą tam, gdzie oba mierzyły.
- NIE_ZMIERZONO przez FC: L0, L2, C4, hud, cityux, cycles, UI-2-A/B/C/E/F/G, UI-3-A, `run-newgame`, GPU i okno Tauri.

INTEGRACJA:
- SHA końcowy do integracji: `cdd12d070` + ten raport (commit FC niżej).
- `origin/rust-port/parity-v2` = `6ce0c14a0`, czyli wyżej niż `dde5e9034`, bo UI-3-E jest już zintegrowane.
- `git merge-tree 6ce0c14a0 cdd12d070` daje 4 konflikty treści: `P5-REPIN-UI-2.md`, `package.json`, `repin-ui3-manifest.json` i `verify-repin-ui3-copies.mjs`.
  - Wszystkie to dopiski obu partii w tym samym miejscu (np. skrypty `ui3e` i `ui3c`; bloki `kblocksE` i `portDom*`).
  - Rozwiązanie: zachować obie strony. Potem uruchomić ponownie `npm run check`, `tsc` i `run-repin-ui3c` na wyniku scalenia.
- Kolejność: scalić UI-3-C PO UI-3-E (już w `6ce0c14a0`), jako merge na aktualny `parity-v2`. Względem B i D: dowolnie, ale pojedynczo, za każdym razem z ponownym `npm run check`.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge na `origin/rust-port/parity-v2` `6ce0c14a0`, rozwiązanie 4 konfliktów addytywnych, bramki po scaleniu)
DEPLOY/PUSH: NIE WYKONANO
