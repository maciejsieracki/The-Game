# 30 — Obrona Operatora (runda 2) — R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1

STATUS: PASS-WITH-NOTES (wszystkie 3 zarzuty Evaluatora PRZYJĘTE i naprawione; 1 punkt dispatchu NIE_ZROBIONY, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1
GOAL: okno przed bitwą (preBattle) pokazuje ostrzeżenie o osłabieniu jednostek strony przez głód wojska / deficyt złota; tylko wyświetlanie; brak ostrzeżenia bez kary; barbarzyńcy nigdy.
ZMIANY-COMMIT: `b107be3d0` (poprawka r2, 5 plików: `gra/src/ui/battle-weakened-note.ts` [przeniesiony z `gra/src/game/`], `gra/src/ui/preBattle.ts`, `gra/src/battle/mapFieldBattle.ts`, `gra/src/main.ts`, `gra/tools/prebattle-weakened-warning-test.cjs`). Kandydat r1: `65a7357e3`. Baza: `origin/main` `359d2df9c`. Raport: ten plik. Brak zmian w `gra/data`, `combat.ts`, `WERSJE.md`, `gra-robocza`, `rust-port`.

## Odpowiedzi na zarzuty Evaluatora (a778ee70e)

### Zarzut 1 — render `weakenedHtml` w `preBattle.ts` nieobjęty testem: PRZYJMUJĘ
- Dowód z Evaluatora potwierdzony u mnie: mutacja usunięcia linii `weakenedHtml +` dawała exit 0 przy starym teście.
- Poprawka: test `gra/tools/prebattle-weakened-warning-test.cjs`, nowa sekcja (h)-(k) `domChecks()`. Buduje stronę przez vite (ten sam pipeline co gra, bo `preBattle.ts` używa `import.meta.glob` i `?raw`), wywołuje prawdziwe `showPreBattle()` i zrzuca DOM przez `chromium --headless --dump-dom`.
- Wyniki z surowego wyjścia testu (po poprawce): `(h) glod wojska: pb-weak=1 [OK]`, `(i) deficyt zlota: pb-weak=1 [OK]`, `(i2) obie kary: pb-weak=1 [OK]`, `(j) bez kary: pb-weak=0 [OK]`, kontrola renderu „Legion” [OK], `(k) blok barbarzyncow nie zawiera ostrzezenia [OK]`. Końcowy wiersz: `== WYNIK: 22 OK, 0 FAIL ==`, exit 0.
- Dowód mutacyjny (wykonany, potem przywrócone `git checkout -- gra/src/ui/preBattle.ts`): po `sed` usuwającym linię `weakenedHtml +` test daje `(h) pb-weak=0 [FAIL]`, `(i) pb-weak=0 [FAIL]`, `(i2) pb-weak=0 [FAIL]`, `== WYNIK: 19 OK, 3 FAIL ==`, exit 1. Mutacja jest czerwona.
- Uwaga: pozycja (k) jest słabym strażnikiem: harness nie ustawia `oslabienie` na stronie barbarzyńców, więc sprawdza tylko brak ostrzeżenia w bloku barbarzyńców. Właściwą ochronę (d) daje test modułu (`barbarian: true` → brak notatki) plus filtr w `preBattleWeakenedForRoster`, który nie wpisuje `oslabienie` barbarzyńcom (`isBarbarian` w `main.ts`).

### Zarzut 2 — brak realnej weryfikacji w Chromium: PRZYJMUJĘ (częściowo wykonane)
- Wykonane: `/usr/bin/chromium` 141.0.7390.37, headless, render prawdziwego `preBattle.ts` / `showPreBattle()` (strona zbudowana vite do katalogu roboczego poza repo). Zrzuty ekranu w 1280x800:
  - z karą obu stron (`both`): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/pbh/shot-both.png` — linia „▼ Osłabieni: głód wojska −25%, deficyt złota −25% (poza pancerzem)” pod „2 oddziałów” w karcie atakującego, zawija się na dwie linie, karta nie wychodzi poza ramkę, okno przed bitwą nie jest rozpychane (układ ok.).
  - bez kary (`none`): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/pbh/shot-none.png` — brak linii, karta jak dotąd.
- NIE_ZMIERZONO: scenariusz z prawdziwej gry (doprowadzenie kampanii do głodu wojska / deficytu i wywołanie bitwy z mapy) nie był uruchomiony w tej rundzie. Render sprawdzony na harnessie z tymi samymi danymi `PreBattleSide.oslabienie`; ścieżka `main.ts → preBattleWeakenedForRoster → showPreBattle` nie była klikana w grze. Pełna weryfikacja live — do orkiestratora / po deployu na ROBOCZĄ.
- Nie zmierzono długich nazw jednostek w tym samym wierszu co kara przy wielu oddziałach (poza testowym zestawem 2 jednostek).

### Zarzut 3 — plik `battle-weakened-note.ts` poza allowlistą: PRZYJMUJĘ
- Przeniesiony `gra/src/game/battle-weakened-note.ts` → `gra/src/ui/battle-weakened-note.ts` (`git mv`, rename 100%). Zaktualizowane importy: `gra/src/ui/preBattle.ts`, `gra/src/battle/mapFieldBattle.ts`, `gra/src/main.ts`, oraz ścieżka w teście. Plik mieści się teraz w allowliście (`gra/src/ui/*.ts` związane z preBattle).

## Punkt dispatchu (6) — Civpedia/wiki: NIE_ZROBIONE w tej rundzie
- Dispatch wymagał jednego zdania o karze głodu/deficytu w haśle o walce, jeśli istnieje właściwe hasło, z regeneracją `wikiBundle` narzędziem `gra/tools/bundle-wiki-for-game.cjs`. Nie zostało to zrobione i nie było w zarzutach Evaluatora. Decyzja dla orkiestratora: zrobić jako osobny krok po FC albo uznać za poza zakresem. Nie wykonywałem regeneracji `wikiBundle` (ryzyko konfliktu, a zakres był wąski).

## Bramki (liczby z surowego wyjścia, kandydat `b107be3d0`)
- `tsc --noEmit` (gra/): exit 0 (brak wyjścia błędów).
- `logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `research-test.cjs`: `ALL GREEN`, exit 0.
- `unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `combat-test.cjs`: `All sanity checks passed.`, exit 0.
- `prebattle-weakened-warning-test.cjs`: `== WYNIK: 22 OK, 0 FAIL ==`, exit 0.
- `git diff --check`: exit 0 (czysto).
- Merge `b107be3d0` z `origin/main` (`359d2df9c`): `git merge-tree --write-tree` exit 0, bez konfliktów (wynikowe drzewo `582085e32`). Integracja nadal po stronie orkiestratora.
- `npm ci` wykonane w worktree (71 pakietów); `npm run build`/`dev` NIE uruchamiane.

## BLOKADY
- Civpedia/wikiBundle (punkt 6 dispatchu) — nie zrobione, patrz wyżej.
- Ścieżka live w grze (kampania → bitwa z mapy) — NIE_ZMIERZONO.
- Nie uruchamiałem `gra/src/ui/` budowy produkcyjnej (vite build do katalogu roboczego był tylko dla harnessu w scratchpadzie).

## RUNDY
- Runda obrony 1 (dispatch → kandydat `65a7357e3`); Evaluator runda 1/5. Ta odpowiedź = runda 2 (obrona po zarzutach). Limit 5 nie przekroczony.

## UWAGI-DLA-ORKIESTRATORA
- `gra/node_modules` powstał w worktree przez `npm ci` (ignorowany przez git, nie został zacommitowany). Sprzątanie worktree po integracji.
- Pliki dowodowe (zrzuty, harness) są w scratchpadzie, poza repo; nie zostały dodane do commita.
- Nie tworzyłem żadnych sesji, zadań ani wyzwalaczy; nie pushowałem na `main`.

NASTĘPNY KROK: Evaluator (runda 2) — weryfikacja `b107be3d0`: test (h-k) + mutacja + przeniesienie modułu. Potem Final Control (Sonnet). Integracja i deploy wyłącznie po FC PASS, decyzją orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
