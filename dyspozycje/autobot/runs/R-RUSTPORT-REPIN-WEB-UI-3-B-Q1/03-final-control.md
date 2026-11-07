STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-B-Q1
GOAL: przenieść do `src-tauri/frontend-v2/src/ui/` zmiany weba `86d510c66 → 9b019a7d8` (FALA 509–532) dla armyStackHud, siegeMapPanel, unitRecruitCard, newGameFlow, empireDetailTypes.

ZMIANY/COMMIT:
- Sprawdzany kod: `a9598c272` (obrona r2; na r1 `25d2c3171`/`383bdf3d3`, baza `dde5e9034`). Final Control nie zmienia kodu; jedyny plik FC to ten raport (commit na gałęzi `fc/R-RUSTPORT-REPIN-WEB-UI-3-B-Q1`, rodzic `a9598c272`).
- Diff `dde5e9034..a9598c272`: 41 plików, wszystkie w allowliście (`src/ui/` 5 plików z listy, `viewmodel/types.ts` addytywnie, `tools/**`, `frontend-v2/package.json` skrypty, `P5-REPIN-UI-2.md`, katalog runu). 0 plików w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`. `git diff --check` czysty.

ORZECZENIA:
| Zarzut | Orzeczenie | Dowód |
|---|---|---|
| N1 PNG kreatora nie obejmuje wiersza | ODDAL (naprawione w r2) | mój przebieg: zrzuty `~row` 4 szt., `PIX-ROW` „różne” w obu oknach; obejrzałem `web-ng-k4-autobuild-wl_row_1280x720.png` — wiersz „Automatyzacja budowy: Włączona” widoczny; mutacja N2 teraz `PIX_różnych=4`, EXIT=1 |
| N2 nieaktualne `note` w `ui2c.json` | ODDAL (naprawione w r2) | diff r1→r2: note wymienia tylko hud/empireDetailPanel/work-tax + odnośnik U3B-Z1 |
| N3 DELTA bez historii git = EXIT 0 | ODDAL (naprawione w r2) | kod `verify-repin-ui3-copies.mjs`: bez `--no-git` `fail()` gdy WEB/DELTA < plików; `fail` zwiększa `bad` → EXIT 1. Symulacji atrapą `git` NIE_ZMIERZONO przeze mnie (sandbox worktree blokuje podstawienie), przyjmuję pomiar obrony |
| N4 brak `auto_build_enabled` w `rust-port/engine/data/ui-params.json` | ODDAL dla tej rundy | `rust-port/**` poza allowlistą; jawnie zapisane jako U3B-Z4 → P6 (kontroler/dane v2) |

Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.

TESTY (moje, na `a9598c272`):
- `tsc --noEmit`: EXIT=0. `npm run check`: EXIT=0 (portDomUI3B: plików=5, web 5/5, delta 5/5; UI-3 niezgodnych=0).
- `run-repin-ui3b` (Chromium 141, `git archive 9b019a7d8 gra/src gra/data`): scen=173, kroków=1049, zrzutów=22, PIX_różnych=0, PIX-ROW różne ×2, pokrycie 55/55, błędów strony 0, różnic 0, EXIT=0, 155 s.
- Fixtura z mojego przebiegu bajtowo równa commitowanej (sha256 `72aae713…`); 22/22 moich PNG bajtowo równe PNG w runie.
- `mutate-repin-ui3b`: zakresy [13,19) 6/6 i [19,27) 8/8 wykrytych, EXIT=0. Zakres [0,13) NIE_ZMIERZONO przeze mnie (Evaluator i obrona: 27/27).
- Regresja starszych harnessów: NIE_ZMIERZONO przeze mnie; `src/ui/**` r2 = r1 bajtowo, liczby Evaluatora r1 (L1A, hud, cityux, UI-2-B/C/F, UI-3-A, newgame v4: 0 różnic) i Operatora r1 aktualne.

INTEGRACJA (kolejność względem `origin/rust-port/parity-v2`):
- `parity-v2` przesunęła się do `199ed5798` (zintegrowane UI-3-E i UI-3-C). Próbny `merge --no-commit a9598c272` na `199ed5798`: 6 konfliktów, wszystkie w plikach wspólnych, addytywne: `package.json`, `P5-REPIN-UI-2.md`, `repin-ui2-overlay.mjs`, `repin-ui3-manifest.json`, `verify-repin-ui3-copies.mjs`, `ui2c.json`. Scalenie przerwane, nic nie zapisano.
- Rozstrzygnięcie: w 5 plikach zachować OBA bloki (C i B). Pętle C `portDom*` pomijają `portDomUI3B` (tablica, nie `{files}`) i `portDomUI3BNote` (string), więc nie ma podwójnej nakładki. W `ui2c.json` zostawić tylko `hud.ts` i `work-tax.ts` (C usunęło empireDetailPanel, B usunęło 3 pozostałe) i uzgodnić `note`.
- Po scaleniu orkiestrator powtarza: `tsc`, `npm run check`, `run-repin-ui3b`, `run-repin-ui3c`, `run-repin-ui3e`, `repin-ui2-overlay`.
- SHA do integracji: commit tego raportu na `fc/R-RUSTPORT-REPIN-WEB-UI-3-B-Q1` (kod `a9598c272`). Kolejność: po `199ed5798`, przed UI-3-D albo po nim (D jest rozłączne w `src/ui`, konflikty tylko w plikach wspólnych).

BLOKADY: brak. Do P6: producent `SiegePanelDto.starveFrac`, zapamiętywanie liczby rekrutów, `autoBuildEnabled` → silnik, klucz `auto_build_enabled` w danych Rust.
SPRZĄTANIE: usunięte `node_modules` i kopia weba w scratchpadzie; wolne miejsce 6.5G.
RUNDY: 2/5 (FC po obronie r2)
NASTĘPNY KROK: integracja orkiestratora na `parity-v2` z rozstrzygnięciem konfliktów jak wyżej → ponowne bramki → READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
