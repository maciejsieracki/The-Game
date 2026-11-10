STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1
GOAL: Final Control rundy 2. Orzeczenie o zarzutach Evaluatora r1 wobec Obrony `e2c662cc` (szkielet `src-tauri/frontend-v2/`, UI-Q1=A).

ZMIANY/COMMIT: oceniony `e2c662cc2f5254e0c0d2802ea9307a771019634` (rodzic `f6db0040`, baza `8761c6c3`). Commit Obrony istnieje, nie trzeba go odtwarzać. Final Control dodaje tylko ten plik (commit na `e2c662cc`).
Integracja: `8761c6c3` jest przodkiem `origin/rust-port/parity-v2` @ `d925acb3`. `git merge-tree --write-tree origin/rust-port/parity-v2 e2c662cc` daje drzewo `2e8b07e9` bez konfliktów. Między `8761c6c3` a `d925acb3` nie zmieniono żadnego pliku w `frontend-v2/` ani w ścieżkach P5.1. Kolejność integracji: rebase lub cherry-pick `f6db0040` → `e2c662cc` → commit FC na `d925acb3`.

ORZECZENIA:
1. Zarzut 1 (brak przeglądu ręcznego 34 plików): ODDAL, bo naprawiono. `PORTING-QUEUE.md:23-38` i dokument §6 pkt 5 mają tabelę 3 REGUŁA + 6 GRANICZNY z plik:linia i docelowym DTO. Jest tam `aiCivPicker.ts:22-25` → `NewGameOptionsDto` oraz `empireMiastaTable.ts:138`. Doszedł też `mapUnitCursor.ts:75-116`, którego Evaluator nie wskazał. Kontrola próbkowa plików uznanych za CZYSTE (`unitCtxDockDiploGate`, `treasuryBalanceFormat`, `empireBalance`, `civpediaOpenGate`, `armyStackPrompt`, plus grep arytmetyki w 7 kolejnych) nie znalazła reguły gry, tylko formatowanie i routing UI.
2. Zarzut 2 (luki bramki): ODDAL, bo naprawiono. Mutacje odtworzyłem sam w czystej kopii `git archive e2c662cc`, każda daje EXIT=1: wieloliniowy `import(`, `'../game'`, `'../game/'`, `../util/…`, `../buildInfo`, `../data/loader`, inline `import('../map/…')`, `export * from`, `require(`, wieloliniowy `from "../render/x"`, side-effect `import '../game/x'`, szablon `` import(`../game/x`) ``, `import.meta.glob`, `<script type="module" src="/src/game/…">` w `index.html`. Kopia bez mutacji daje EXIT=0. Bramka łapie też ścieżki w komentarzach, ale taki nadmiar jest bezpieczny.
3. Uwaga (a): ODDAL, bo naprawiono. `commands.ts` ma `raw_percent`.
4. Uwaga (b), Z9 `-whitespace` dla `techIcons.ts`: ODDAL. Bajty muszą zostać zgodne z pinem, a wyłączenie jest jawne i dotyczy jednego pliku. Do świadomego potwierdzenia przez orkiestratora przy integracji. Uwaga: `git diff --check` liczony z drzewa bez `frontend-v2/.gitattributes` zgłosi `techIcons.ts:77`. Z checkoutem `e2c662cc` daje EXIT=0.

TESTY (samodzielnie, czysty katalog z `git archive e2c662cc src-tauri/frontend-v2`):
- `npm ci` EXIT=0. `npx tsc --noEmit` EXIT=0, bez wyjścia. `npm run check` EXIT=0: self-test 33/15/1, 0 błędów; 43 pliki, `trafień=0`; `verify-pin-copies` 39 plików, `niezgodnych=0`. `npx vite build` EXIT=0 (`dist/index.html` 1.83 kB, JS 10.08 kB).
- sha256 policzone niezależnie (Python) dla kopii, pinu z `git archive edb8fb56 gra` i `pin-manifest.json`: 39/39 zgodnych na trzech źródłach. Żaden plik w `src/ui` nie jest poza manifestem.
- Allowlista `8761c6c3..e2c662cc`: 0 ścieżek poza dozwolonymi, 0 plików `node_modules`/`dist`. `git diff --check` EXIT=0 (z checkoutem commitu).
- `node_modules` i `dist` usunięte.

BLOKADY: brak. NIE_ZMIERZONO: renderowanie w webview (brak okna/GPU, zgodnie z dispatchem).
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (rebase na `d925acb3` w podanej kolejności, ponowne bramki w `main` integracji), potwierdzenie Z9, potem READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
