STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-D-Q1
GOAL: Final Control r2. Orzeczenie zarzutów Evaluatora r1 (Z1, Z2) wobec obrony Operatora r2 dla partii UI-2-D (#15 hexContextTooltip, #16 preBattle, #17 buildModeHud, #24 buildingAdapter, #25 improvementAdapter), REPIN do `origin/main` `86d510c66`.

ZMIANY-COMMIT:
- Sprawdzona gałąź `ui2d-q1-r2`, HEAD `e62f2478e`. Commity ponad `origin/rust-port/parity-v2` `2198eaf7e` (zmierzone `git rev-parse` po `git fetch`), po kolei: `e0eef2b84` (kod), `701b4aecf` (doc), `423fcd741` (raport r1), `10ec208db` (poprawka harnessów r2), `f012dc7d3` (doc r2), `e62f2478e` (raport r2).
- Ten raport: gałąź `ui2d-q1-fc`, commit nad `e62f2478e` (SHA w odpowiedzi do orkiestratora).
- Allowlista: `git diff --name-only 2198eaf7e ui2d-q1-r2` daje 20 plików, wszystkie dozwolone (5 portów `src/ui/**`, `viewmodel/types.ts`, `tools/**`, `package.json`, `P5-REPIN-UI-2.md`, run). Zero plików w `gra/`, `rust-port/`, `src-tauri/src/`, `Cargo.*`, `WERSJE.md`, `gra-robocza/`.
- Różnica r1→r2 (`git diff ui2d-q1-r1 ui2d-q1-r2`) dotyka tylko 3 harnessów mutacyjnych, dokumentu i raportu. Kod portu jest bez zmian względem r1.

ORZECZENIA:
- **Z1 (H11 z wzorcem 0×): ODDAL, naprawione w r2.** H11 nie została usunięta, tylko przecelowana na `  if (mag) {` (wiersz `cp-prod-line`, `hexContextTooltip.ts:180`). Doszła H14 na blok „Surowce z terenu (przy 👤)” (`:362`). Mój własny przebieg na nakładce: H11 WYKRYTA (`hex(imp:stadnina@laka/brak)#0/false`), H14 WYKRYTA (`hex(laka/brak/false)#0/true`). Pełna grupa H1–H14: 14/14 wykrytych, EXIT=0.
- **Z2 (NIE_ZMIERZONO tam, gdzie dało się zmierzyć): ODDAL, naprawione w r2.** Operator podał przebiegi w porcjach: mutate-cycles 67/67, mutate-c4 20/20, mutate-level2 34/34. Sam powtórzyłem podzbiory dla plików partii (niżej). Dla wszystkich 121 mutacji sprawdziłem statycznie, że wzorzec występuje w pliku dokładnie 1 raz (bad=0).
- Nie ma zarzutu oznaczonego NAPRAW ani DO DECYZJI CZŁOWIEKA.

TESTY (moje, na `git archive ui2d-q1-r2 src-tauri/frontend-v2`; nakładka `repin-ui2-overlay.mjs` złożona z pinu `edb8fb56` i weba `86d510c66`, EXIT=0, overlayPorts*=3):
- `tsc --noEmit`: EXIT=0.
- `check-no-logic-imports` (`--self-test` oraz `src`): 0 błędów, 0 trafień.
- `verify-pin-copies` i `verify-repin-ui2-copies`: nie uruchomiłem, bo kopia z archiwum nie ma `.git`. Pliki te nie zmieniły się od r1, a Evaluator r1 zmierzył `npm run check` EXIT=0.
- `node --check` na 3 zmienionych skryptach: OK.
- Statyczny licznik wzorców: mutate-cycles 67, mutate-c4 20, mutate-level2 34, wszystkie ze wzorcem 1×.
- `run-cycles --only hexContextTooltip.ts,preBattle.ts`: 1201 przypadków, 0 różnic, jsdomErrors 0, consoleErrors 0.
- `mutate-cycles --only H1..H14`: 14/14 wykrytych, EXIT=0.
- `mutate-level2 --only L5,L6,L7` (buildModeHud): 3/3 wykryte, EXIT=0.
- `mutate-c4 --only C4..C10` (buildingAdapter, improvementAdapter): 7/7 wykrytych, EXIT=0. Przy okazji potwierdza to, że nowe `--only` działa.
- `git diff --check 2198eaf7e ui2d-q1-r2`: czysto.
- Nie powtarzałem: B1–B5 (Evaluator r1 zmierzył 5/5), T/N/A/S z mutate-cycles, C1–C3 i C11+ oraz pozostałe L. Dotyczą plików spoza partii i nie zmieniły się w r2. W tych zakresach opieram się na raporcie Operatora r2.

BLOKADY:
- Brak technicznych.
- INFRA: dysk hosta zapełnił się w trakcie (0 MB). Nieudany `git checkout` w moim worktree przywróciłem przez `reset --hard` i `clean`, worktree jest czysty. Katalogi pin, web, ov i kopię archiwum usunąłem jawnymi ścieżkami.
- NIE_ZMIERZONO (jak w r1): GPU i natywne okno Tauri; producent nowych pól DTO po stronie Rust (P6).

INTEGRACJA:
- SHA końcowy: commit tego raportu na `ui2d-q1-fc`. Rodzicem jest `e62f2478e`, a `2198eaf7e` jest jego przodkiem. Zawartość do scalenia to kod `e62f2478e` plus ten raport.
- Fast-forward nie jest już możliwy. W trakcie kontroli `origin/rust-port/parity-v2` przesunęło się z `2198eaf7e` na `20abbaf40`, bo weszła partia UI-2-C (`aaf1d4966`). Nasza partia ma być scalona po UI-2-C.
- `git merge-tree origin/rust-port/parity-v2 HEAD` daje konflikty treści w 4 wspólnych plikach: `P5-REPIN-UI-2.md`, `package.json`, `tools/repin-ui2-overlay.mjs` i `tools/verify-repin-ui2-copies.mjs`. Pliki portów `src/ui/**` nie mają konfliktów.
- `repin-ui2-overlay.mjs` nie da się scalić przez zwykłe połączenie obu stron. UI-2-C dodało katalog `tools/repin-ui2-overlay-ports/*.json` z własnym `let portFiles`. UI-2-D dodało sekcję manifestu `overlayPortsUI2D` i też deklaruje `let portFiles`. Proste sklejenie obu bloków daje błąd składni przez podwójną deklarację.
- Zalecane rozwiązanie: przenieść 3 wpisy UI-2-D z `overlayPortsUI2D` do `tools/repin-ui2-overlay-ports/ui2d.json` w schemacie UI-2-C. Alternatywą jest zmiana nazwy zmiennej, wtedy oba mechanizmy działają obok siebie. Tak samo trzeba ustalić jeden mechanizm w `verify-repin-ui2-copies.mjs`. `package.json` i dokument wystarczy scalić łącząc obie strony.
- To zadanie integracji orkiestratora. Nie jest wadą tematu i nie zmienia orzeczenia.
- Po scaleniu trzeba powtórzyć: `tsc --noEmit`, `npm run check`, `run-repin-ui2d`, `run-repin-ui2c`, `run-cycles` i `mutate-cycles --only H1..H14` na nakładce. UI-2-C zmieniło `hud.ts`, więc dochodzi jeszcze harness `hud`.

RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora do `rust-port/parity-v2`, potem READY_FOR_DEPLOY (wystawia orkiestrator).
DEPLOY-PUSH: NIE WYKONANO
