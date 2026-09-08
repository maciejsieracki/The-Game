STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP6A-FOLLOWUP-MGLA-TEST-Q1
GOAL: Naprawić FAIL w `gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` po integracji
Etapu 6a — bez zmian w `gra/src/**`.

WERYFIKACJA WSTĘPNA (przed zmianą, na worktree = origin/main @ 550014be + dispatch):
uruchomienie testu dało **3 FAIL** (dispatch wspominał 2 — zweryfikowano świeżo, nie
skopiowano z raportu Final Control Etapu 6a):
1. blok `if (pathHexes.length > 0)` — main.ts ma dziś `isMe(u.ownerId)` (linia ~33729),
   test szukał literału `u.ownerId === 0`.
2. blok `if (result.movePath.length > 0)` (applyMarchSegmentInstant) — main.ts ma dziś
   `u.ownerId === humanOwnerId` (linia ~23654), NIE `isMe`, ani stary literał — trzeci,
   nieprzewidziany w dispatchu wariant strażnika tożsamości.
3. `currentVisible()` — funkcja została ZREFAKTORYZOWANA (R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1,
   już na main): pętla po jednostkach gracza przeniesiona do nowej `ownPlayerVisibleHexes()`,
   filtr `u.ownerId === ME()` zamiast `=== 0`. Test szukał starej, inline'owej postaci.

ZMIANY/COMMIT: wyłącznie `gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` (allowlista).
Podejście: BEHAWIORALNE tam gdzie to proste — trzy asercje static rozszerzone na
alternatywę równoważnych, realnie istniejących w main.ts zapisów strażnika tożsamości
(`ownerId === 0` | `isMe(u.ownerId)` | `ownerId === humanOwnerId`) dla dwóch bloków
hutCollected, oraz dwuwariantowa asercja (inline LUB delegacja przez
`ownPlayerVisibleHexes()` z `ME()`) dla `currentVisible()` — bez przebudowy testu (pełne
odtworzenie zachowania wymagałoby bundlowania main.ts, co jest świadomie odrzucone przez
istniejący wzorzec repo, patrz nagłówek pliku). Zero zmian w `gra/src/**`.

TESTY:
- `node gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` → **17 pass, 0 fail** (pełny plik,
  było 12 pass / 3 fail przed zmianą).
- `node ./node_modules/typescript/bin/tsc --noEmit` (w `gra/`) → czysto, exit 0.
- 5 bramek referencyjnych — wszystkie zielone:
  logic-test 213/213, tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13,
  combat-test 6/6.
- `git status --short` / `git diff --stat` → wyłącznie 1 plik z allowlisty zmieniony.
- `git diff --check` → czysto.

Uwaga proceduralna: `gra/node_modules` nie istniał w tym worktree (sparse checkout) —
wykonano `npm install` w `gra/` (dozwolone, to NIE jest `npm run build`/`dev`, C-001
nienaruszone) żeby test mógł się w ogóle uruchomić (wymaga `esbuild`).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
