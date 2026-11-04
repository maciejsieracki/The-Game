STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-F-Q1
GOAL: Przepiąć kreator nowej gry `src-tauri/frontend-v2/src/ui/newGameFlow.ts` (port DOM) z pinu `edb8fb56` na web `86d510c66` (= `origin/main`) i udowodnić zgodność web↔port w Chromium 141.

ZMIANY/COMMIT:
- Oceniane: kod `886fd50b0`, raport Operatora `98fd73cba` (gałąź `op/R-RUSTPORT-REPIN-UI-2-F-Q1`, baza `2198eaf7e`). Ten plik to jedyny commit Final Control, na gałęzi `fc/R-RUSTPORT-REPIN-UI-2-F-Q1` nad `98fd73cba`.
- `git diff --name-only 2198eaf7e 98fd73cba` daje 10 plików, wszystkie na allowliście. Brak zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`. `git diff --check` czysty. `git log 86d510c66..origin/main -- gra/src/ui` puste.
- Wspólne pliki: `package.json` (+2 skrypty), `repin-ui2-overlay.mjs` (nowa pętla `repin-ui2*-ported.json` plus zmieniona końcowa linia logu), `P5-REPIN-UI-2.md` (wiersz #23 i §6). `repin-ui2-manifest.json` i `pin-manifest.json` bez zmian; to poprawne, bo port DOM nie jest kopią bajtową.
- `diff -u` web `86d510c66` ↔ port: 10 hunków, wszystkie to adaptacje P5.7 r2, zgodnie z oceną Evaluatora.

TESTY (zmierzone samodzielnie na `98fd73cba`):
- `tsc --noEmit`: EXIT 0.
- `npm run check`: EXIT 0. Self-test 33/15/1, 0 błędów; 225 plików, 0 trafień; pin 433/0; repin 4/0.
- sha256 weba `newGameFlow.ts` = `dd158388…c4ae`, zgodne z `repin-ui2f-ported.json`.
- `run-repin-ui2f` na świeżym `git archive 86d510c66` (katalog z `mktemp -d`): EXIT 0. 35 scenariuszy, PNG 24×2, `pageerror`+`console.error` = 0, zapytania silnika 11/11, różnic = 0. Mój `--out` ma sha256 `f976fa89…beae`, bajtowo równy commitowanej fiksaturze. To trzeci niezależny `git archive` (po Operatorze i Evaluatorze).
- `mutate-repin-ui2f`, próbka zakresów 1–6 i 33–34 z `--old-port`: wykryte 6/6 i 3/3, 0 błędów harnessu. M00 daje 232 różnice. Pełne 34/34 zmierzył Evaluator.
- Nakładka `edb8fb56` + `86d510c66`: plików 4, portów DOM 1, niezgodnych 0.
- Regresja na nakładce:
  - `run-newgame --only-label zredukowane`: 506 przypadków, 0 różnic, asercje 12/12, jsdomErrors i consoleErrors 0. Grupa obejmuje `s5`, czyli zapasowy selektor startu.
  - `run-cityux`: 164 przypadki, 0 różnic.
  - `run-hud-empire`: 927 przypadków, 0 różnic.
  - Pozostałe grupy oraz L0/L1A/C4/L2/cycles przyjmuję z raportów Operatora i Evaluatora; tych harnessów sam nie uruchamiałem. Nie importują `newGameFlow.ts`.

ORZECZENIA:
- E1 (Evaluator: M00 opisane jako 225, zmierzone 232): ODDAL. Kosmetyka; wynik (wykryta) się zgadza. Orkiestrator poprawia liczbę w §6 przy integracji.
- E2 (komentarze w porcie odsyłają do numerów linii pinu): ODDAL. Kosmetyka, nie wpływa na zachowanie.
- E3 (kolizje w scratchpadzie): ODDAL. Sprawa środowiska, nie pracy tematu.
- E4 (dane nowych ustawień i statusów z Rusta, GPU i okno Tauri): ODDAL. Poza zakresem (P6), zgodnie z dispatchem NIE_ZMIERZONO.
- FC1 (konflikty przy scaleniu z obecnym `parity-v2` `692bfd994`): ODDAL jako wada pracy. Partia pracowała, jak nakazał dispatch, na `2198eaf7e`, a w międzyczasie zintegrowano UI-2-C i D. `git merge-tree` pokazuje konflikty treści w 3 wspólnych plikach: `package.json`, `repin-ui2-overlay.mjs`, `P5-REPIN-UI-2.md`. Wszystkie wynikają z dopisywania na końcu tych samych miejsc. Pod tym ID to instrukcja integracji, nie zarzut.

INSTRUKCJA INTEGRACJI:
- Kolejność: scalić `fc/R-RUSTPORT-REPIN-UI-2-F-Q1` na `origin/rust-port/parity-v2` (obecnie `692bfd994`, po UI-2-C i D).
- Rozwiązanie konfliktów, zachować oba zestawy:
  - `package.json`: skrypty ui2c, ui2d i ui2f.
  - `repin-ui2-overlay.mjs`: jeden import `readdirSync`; zachować wszystkie trzy mechanizmy portów (C: `repin-ui2-overlay-ports/`, D: `overlayPorts*`, F: `repin-ui2*-ported.json`); końcowa linia logu z licznikami wszystkich mechanizmów.
  - `P5-REPIN-UI-2.md`: wiersz #23 i §6 dla F obok sekcji C i D. Przy tej okazji zmienić M00 na 232.
- Po scaleniu orkiestrator powtarza: `tsc`, `npm run check`, budowę nakładki (niezgodnych 0, wszystkie porty C+D+F), `run-repin-ui2f` i `run-newgame` (co najmniej grupy `zredukowane` i `dane/brak`) na nakładce scalonej.
- Później warto ujednolicić trzy mechanizmy portów w nakładce w jeden; to osobny temat, poza tą partią.

BLOKADY: brak.
RUNDY: 1/5 (Operator r1 → Evaluator r1 → Final Control r1).
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` wg instrukcji wyżej.
DEPLOY/PUSH: NIE WYKONANO
