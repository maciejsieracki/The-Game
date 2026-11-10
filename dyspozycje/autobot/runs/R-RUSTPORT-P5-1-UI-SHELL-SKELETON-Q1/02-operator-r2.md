STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1
GOAL: Szkielet frontendu Tauri `src-tauri/frontend-v2/` (UI-Q1=A). Runda 2 (Obrona): odpowiedź na zarzuty 1–2 i uwagi (a)–(b) Evaluatora r1.
ZMIANY/COMMIT: baza = commit Operatora r1 `f6db0040`, worktree `wf_bcb1b0ee-f7d-3`, gałąź `p51-r2`; SHA tej rundy w raporcie końcowym (commit tworzony po tym pliku). Pliki:
- `src-tauri/frontend-v2/tools/check-no-logic-imports.mjs` (brama r2),
- `src-tauri/frontend-v2/package.json` (`check` skanuje `src index.html vite.config.ts`),
- `src-tauri/frontend-v2/src/controller/commands.ts:49` (`raw_percent`),
- `src-tauri/frontend-v2/PORTING-QUEUE.md` (akapit „Reguły wpisane bez importu”),
- `dyspozycje/rust-port/p5/P5-1-UI-SHELL-SKELETON.md` (§0, §6 pkt 1–5, §8 Z10–Z11, §9 pkt 1, nowa §11),
- `dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/{02-operator-r2.md, r2-logi/*.log, r2-pomiar/gates.sh}`.

ODPOWIEDZI NA ZARZUTY:
1. **PRZYJMUJĘ.** Przeczytałem w całości wszystkie 34 moduły TS zbioru CZYSTEGO. Wynik: 3 REGUŁA, 6 GRANICZNY, 25 CZYSTY.
   - REGUŁA: `aiCivPicker.ts:22-25,31-36,49-65,74-76` → `NewGameOptionsDto` (proponowane `aiCivCap`, `aiCivCandidateIds`); `scienceHubSnapshotLogic.ts:53-70,89-134` → `ResearchViewDto` (+ `hubEpoch`); `mapUnitCursor.ts:75-116` → proponowane `HexContextDto.cursorAction`. Tego ostatniego Evaluator nie wskazał, a rozstrzyga legalność ataku pod kursorem.
   - GRANICZNY: `empireMiastaTable.ts:74-87,119-143` (średnia `:138`) → `EmpireDetailDto.citiesSummary`; `sideListHud.css.ts:115-126` → `ArmyStackDto.cards[].status`; `empirePanelSectionMap.ts:121-126` (routing, bez pola); `entityCards/slug.ts:30-49` → `EntityCardDto.id`; `techIcons.ts:14-47` → klucz `TechId`; `triumphCityStateNotice.ts:81-92` (tekst).
   - Wyniki wpisane w `P5-1-UI-SHELL-SKELETON.md` §6 pkt 5 i w `PORTING-QUEUE.md`. Nowe pola DTO są propozycjami (ZAŁOŻENIE P5.1-Z11); `types.ts` pozostaje 1:1 z P5-0.
2. **PRZYJMUJĘ.** Zmiany w bramie:
   - skan całego tekstu zamiast linii (wieloliniowe `import(`/`from`);
   - łapany ostatni segment będący katalogiem logiki (`'../game'`). Fałszywe trafienie `entityCards/*` → `'./types'` rozstrzyga sprawdzenie na dysku, czy to plik;
   - EXT obejmuje `util` i `buildInfo` (Z10);
   - w HTML łapane `src=`/`href=` i inline `<script type="module">`, dodatkowo `import.meta.glob` i `new URL`;
   - cele skanu: `src`, `index.html`, `vite.config.ts`.

   Każdy przypadek z zarzutu jest w self-teście (33 pozytywne, 15 negatywnych, 1 test linii) oraz w osobnej mutacji (R2-M1..M8, każda EXIT=1).
- (a) **PRZYJMUJĘ.** `rawPercent` → `raw_percent` (`commands.ts:49`).
- (b) Bez zmian. Orkiestrator powinien świadomie potwierdzić Z9.

TESTY (`r2-logi/`, `r2-pomiar/gates.sh`):
- `npm ci` EXIT=0 (13 pakietów).
- `npx tsc --noEmit` EXIT=0, bez wyjścia.
- `npm run check` EXIT=0: self-test `błędów: 0`, `plików=43 trafień=0`, `verify-pin-copies niezgodnych=0`.
- `npx vite build` EXIT=0, 12 modułów.
- Kalibracja na pinie: `--core-only` daje 220 w 49 plikach (bez zmian, P5-0 §9); pełna brama 231 (+1 `buildInfo`: `perfReport.ts:4`).
- Mutacje: 11/11 EXIT=1, kontrola EXIT=0, +1 bajt kopii daje EXIT=1, po przywróceniu EXIT=0.
- Po bramach `node_modules` i `dist` usunięte.

BLOKADY: brak. W trakcie rundy dysk był chwilowo pełny (ENOSPC w `/tmp`, zapełniony przez inne zadania sesji). Ustąpiło samo, nie usuwałem cudzych plików.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2. Weryfikuje bramę r2 (self-test, mutacje), tabelę §6 pkt 5 na 34 plikach i `PORTING-QUEUE.md`.
DEPLOY/PUSH: NIE WYKONANO
