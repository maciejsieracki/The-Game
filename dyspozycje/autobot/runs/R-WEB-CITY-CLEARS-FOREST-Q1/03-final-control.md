STATUS: PASS
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-CITY-CLEARS-FOREST-Q1
GOAL: Heks z miastem nigdy nie ma nakładki Las; założenie miasta usuwa las natychmiast, bez kosztu Pracy; stary zapis z lasem pod miastem jest po wczytaniu naprawiany.

ZMIANY/COMMIT:
- SHA końcowy do integracji: `4145670827a8103d7434b25e8009c427cdd8a41a` (kod w `c1bc0443546c0f50520122c7ab5c1f5a1bfe40bc`), baza `ac952c567` = `origin/main`. Branch Operatora: `worktree-wf_e805c750-f58-1`.
- Diff do allowlisty (`git diff --name-only ac952c567 4145670827a8`): `gra/src/game/city-hex-clear.ts`, `gra/src/main.ts`, `gra/tools/city-clears-forest-test.cjs`, `gra/tools/city-clears-forest-live-test.cjs`, katalog runu. Zero zmian w `auto-improvements.ts`, `gra-robocza`, `WERSJE.md`, `rust-port`, `src-tauri`. `git diff --check`: czysto.
- Przeczytałem pełny diff kodu: wspólna `clearForestFromHex`/`clearForestUnderCity`, `enforceNoForestUnderCities` (wołana z `reapplyCityHexDecorHides` i na granicy tury), hak testowy `__cityForestTestDebug` (tylko fixture i odczyt). Migracja zmienia wyłącznie Las i tartak/obóz na heksie miasta, jest idempotentna, nie rusza `centerWorkedTile`.

TESTY (własny przebieg FC na 4145670):
- `tsc --noEmit`: EXIT=0.
- city-clears-forest 18/0; city-clears-forest-live (Chromium, realny build) 17/0, zero pageerror.
- diplomacy 148/0; war-era-counter 82/0; ring 15/0; autoimprove-stages-q1 111/0; auto-improvements 45/0; ai-improvements 53/0; hodowla-las 113/0; battle-standoff wszystkie PASS, EXIT=0; defeat-last-city 14/0. Zgodne z dispatchem.
- Mutacje M1-M3: nie powtarzałem, opieram się na logach `mut-M*` w runie.
- `gra/node_modules` usunięty po etapie.

ROZSTRZYGNIĘCIE ZARZUTÓW: Evaluator zgłosił 0 zarzutów. Jego 4 uwagi (AI tylko okablowanie tekstowe, heurystyczne okno 30 linii w B1, redundantne wywołanie w `clearHexForCityCenter`, plon starych zapisów NIE_ZMIERZONO) to ODDAL: żadna nie jest wadą wymagającą naprawy w tym temacie, a ścieżka AI jest wspólna (`finalizeCityFounding`). NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0 (brak konfliktu ze starymi uzgodnieniami, brak DECISION_REQUIRED).

BLOKADY: brak
RUNDY: 1/5 (Operator PASS, Evaluator PASS-WITH-NOTES, Final Control PASS)

KOLEJNOŚĆ INTEGRACJI: temat dotyczy wyłącznie `gra/` (web) i bazuje na `origin/main` (`ac952c567`). `origin/rust-port/parity-v2` to osobna linia (merge-base `f4c89d008`, zmiany w `gra/` brak między merge-base a parity-v2). Integrować do `main` niezależnie, w dowolnej kolejności względem parity-v2; konflikt możliwy tylko jeśli parity-v2 dotknie `gra/src/main.ts` (nie dotyka). Nie tworzy zależności dla portu Rust.

NASTĘPNY KROK: integracja orkiestratora (cherry-pick/merge `4145670` do `main`, potem bramki PO), następnie READY_FOR_DEPLOY wystawia wyłącznie orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
