STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-B-Q1
GOAL: Orzeczenie końcowe partii UI-2-B repinu UI (#5–#9 `P5-REPIN-UI-2.md`) na podstawie dowodu odtworzonego samodzielnie.

ZMIANY/COMMIT:
- Ocenione: `6d7d31ca6` (kod), `9f537dc9e` (dokument), `6462b89a6` (raport Operatora) na `operator/R-RUSTPORT-REPIN-UI-2-B-Q1`.
- Ten raport: commit na `fc/R-RUSTPORT-REPIN-UI-2-B-Q1` (rodzic `6462b89a6`), tylko ten plik.
- Baza `origin/rust-port/parity-v2` = `2198eaf7e`, przodek gałęzi Operatora (sprawdzone `merge-base --is-ancestor`).
  Integracja = fast-forward `parity-v2` `2198eaf7e` → `6d7d31ca6` → `9f537dc9e` → `6462b89a6` → commit FC.
- Web `origin/main` = `86d510c66`; `git log 86d510c66..origin/main -- gra/src/ui` puste.

TESTY (odtworzone przez FC):
- Allowlista: 17 plików w `git diff 2198eaf7e 6462b89a6`, wszystkie w allowliście; zero zmian w `gra/**`, `rust-port/**`,
  `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`. `types.ts`: tylko `milicjaRegen?: number` w `SiegePanelDto`.
- Kopie bajtowe (`git ls-tree`): #5 `eacc47ba`, #6 `2625b1eb`, #7 `1e1de273` — identyczne bloby web/port.
- Porty DOM porównane z webem `86d510c66`: #8 `affordable && !blockedReason`, title/wiersz przyczyny = web `:162/:188–196`;
  #9 brak „~”, „Milicja odnawia się: za N” z odmianą = web `:267–273` znak w znak; brak pola = 0 jak web bez `militiaRegenLeft`.
- `tsc --noEmit`: EXIT=0. `npm run check`: EXIT=0 (self-test 0 błędów; no-logic-imports 226/0; verify-pin-copies 431/0;
  verify-repin-ui2-copies 7/7, portDomRefs 2/2, 0 niezgodnych).
- `run-repin-ui2b` (Chromium 141, web z własnego `git archive 86d510c66`): EXIT=0, 192×2 sceny, 1356 kroków, 0 różnic,
  14/14 PNG identycznych, 55/55 asercji, 0 błędów strony. Fixtura FC sha256 `cf0ed6125aaf…1dda4e` = commitowana (trzeci
  niezależny weryfikator, po Operatorze i Evaluatorze).
- `mutate-repin-ui2b` zakres DOM-portów [24,37): 13/13 wykrytych (P1–P5, G1–G8). Zakres [0,24) pokryty przez Evaluatora (37/37).
- Regresja L0/L1A/L2/C4/cycles/hud/newgame/cityux: nie powtarzana przez FC (dysk 97%, czas); przyjęta z dwóch zgodnych
  pomiarów (Operator, Evaluator, 0 różnic). Zmiana `run-level1a.mjs` przejrzana: gałąź `typeof … === 'function'` aktywna
  wyłącznie na nakładce, czysty pin bez zmian zachowania.
- `git diff --check`: czysty. Po bramkach `git status` czysty; node_modules i katalogi tymczasowe usunięte jawnymi ścieżkami.
- NIE_ZMIERZONO: GPU, natywne okno Tauri.

ORZECZENIA:
- Zarzuty Evaluatora: brak (0). Obrona: brak.
- U1 (L2 flaky `mainMenu.ts` toast przy obciążeniu): ODDAL dla tej partii — pliki niezmienione względem bazy; do osobnego tematu.
- U2 (L1A pusty DOM `armyMergePanel`, montaż w `<html>`): ODDAL — pokrycie przejmuje `run-repin-ui2b` (M12 wykryta).
- U3 (PNG z przezroczystym paskiem przewijania): ODDAL — CSS w kopiach bajtowych, DOM/scroll porównywane.
- U4 (INFRA scratchpad/dysk): ODDAL — nie dotyczy kodu.
- U5 (FC): obsługa SIGTERM w `mutate-repin-ui2b` jest odroczona — `spawnSync` blokuje pętlę zdarzeń, więc handler
  przywraca plik dopiero po zakończeniu całego zakresu (zmierzone: `timeout 580` → przebieg trwał ~800 s, plik przywrócony,
  `git status` czysty). ODDAL — skutek końcowy poprawny; ulepszenie (async spawn / mniejsze zakresy) do osobnego tematu.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (fast-forward `parity-v2` do commitu FC), potem UI-2-C (C1 = #10 + #12 + #13).
DEPLOY/PUSH: NIE WYKONANO
