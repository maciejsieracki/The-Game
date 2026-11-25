# R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1 — raport obrony Operatora (Claude, runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1
GOAL: sojusz nie blokuje wojny epoki; parowanie do skutku z preferencją par bez sojuszu; fallback po trzech; bramki zielone; odpowiedź na zarzuty Evaluatora (74f28a139f5b38583eacaba386477177e70fdfbd).
KANDYDAT: 69c7a0a25056f3860a64e6ca1280c493e1d53766 (baza aa96cfc618de124e48b74408870115854293e6c5)
CZUBEK OBRONY (kod + testy): b703b2d2eceb672b28080e6fcd32fbf4cf699a67 (ten raport jest commitem następnym)

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — test nie pokrywa realnej blokady w isWarTreatyBlocked: PRZYJMUJĘ, naprawione
- Dodano sekcję E1/E2 do `gra/tools/era-war-pairing-alliance-test.cjs`: esbuild bundluje PRAWDZIWY `gra/src/game/war-rules-multiwar.ts`.
- E1: `isWarTreatyBlocked({eraWar:true, hasNap:true, peaceLocked:true, hasAlliance:true}) === false` (prawdziwy moduł).
- E2: MUTACJA ŹRÓDŁA — w tekście źródła podmieniane jest `if (input.eraWar) return false;` na `if (input.eraWar) return input.hasAlliance;`, bundle mutanta w pamięci (stdin), wynik `true` = czerwony. Test pilnuje więc realnej blokady, nie własnej kopii logiki.
- Wynik surowy: `E0 PASS`, `E1 PASS`, `E2 PASS: MUTACJA ŹRÓDŁA ... isWarTreatyBlocked=true`.

### Zarzut 2 — test B1 nie wykrywa utraty preferencji w DP: PRZYJMUJĘ, naprawione
- Zmierzone przed poprawką (sonda na źródle kandydata i na wariancie z wagą `1000 + (isAllied?0:1)` zamienioną na `1000`):
  - przypadek B1 (kolejność 1,5,2,4 z sojuszami 1-2, 3-4): base `1-3,2-4`; bez wagi `1-3,2-4` — NIE dyskryminuje (dlatego B1 był zielony w mutancie).
  - przypadek B1b (kolejność pozycji 0,1,2,3; sojusze 1-2, 3-4): base `1-3,2-4` (obie bez sojuszu); bez wagi `1-2,3-4` (obie sojusznicze) — DYSKRYMINUJE.
- Dodano B1b do testu. Wynik: `B1b: waga preferencji w DP -- obie pary bez sojuszu (1-3, 2-4) PASS`. Wariant bez wagi dałby FAIL (sonda: `allPairsNonAllied=false`).

### Zarzut 3 — nieaktualne komentarze: PRZYJMUJĘ, naprawione
Poprawiono (bez zmiany kodu wykonawczego):
- `gra/src/game/ai.ts` ~7239-7243 — komentarz B3 („cel z aktywnym sojuszem wykluczony”) zastąpiony opisem R-WOJNA-EPOKA-SOJUSZ-NIE-BLOKUJE-Q1 (sojusz nie wyklucza, jest tylko preferencją parowania).
- `gra/src/main.ts` ~47326 — komentarz „blokuje ją tylko sojusz” zastąpiony opisem `isWarTreatyBlocked` = false dla eraWar; osierocony komentarz „R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 … ten sam ostatni guard sojuszu” usunięty.
- `gra/src/game/forced-war-common.ts` — opis `isPairBlocked` („blokuje TYLKO aktywny sojusz”) poprawiony.
- `gra/src/game/war-rules-multiwar.ts` — blok dokumentacji `isWarTreatyBlocked` („blokuje ją WYŁĄCZNIE aktywny sojusz formalny”) poprawiony.
- Kontrola: `grep` na `blokuje.*sojusz`/`ten sam ostatni guard` po zmianie — brak starych sformułowań w tych czterech plikach.

### Zarzut 4 — brak pomiaru kierunkowego seed 4242 i dokumentu ERAWAR-PAROWANIE-2026-11-25.md: PRZYJMUJĘ (nie wykonano w tej rundzie)
- Pomiar NIE został wykonany i nie jest tu deklarowany jako wykonany. Powód: runner `gra/tools/diplomacy-harder-measure-run.cjs` wymaga bundla vite (`--build 1`, poza repo), Chromium (SIGSEGV w poprzednich rundach) i biegu ≥90 tur w odcinkach `--stop-at`; w tej rundzie worktree miał tylko `npm ci` (71 pakietów), bez builda przeglądarkowego.
- Dokument `dyspozycje/analizy/ERAWAR-PAROWANIE-2026-11-25.md` NIE został utworzony (brak danych do opisu).
- Skuteczność w grze (Brąz seed 4242: czy wojna epoki zawiązuje się w oknie zamiast stać 68 tur): NIE ZMIERZONO. Proponuję osobny temat pomiaru dla orkiestratora (nie blokuje DOMAIN GAME, bo decyzja i testy jednostkowe są zielone).

## ZMIANY-COMMIT

Commit kodu/testów: `b703b2d2eceb672b28080e6fcd32fbf4cf699a67` (od kandydata 69c7a0a25; po poprawce komentarza w main.ts ~45886 — usunięto stare „blokuje WYŁĄCZNIE aktywny sojusz”):
- `gra/src/game/ai.ts` — tylko komentarz (B3 → R-WOJNA-EPOKA-SOJUSZ-NIE-BLOKUJE-Q1).
- `gra/src/game/forced-war-common.ts` — tylko komentarz `isPairBlocked`.
- `gra/src/game/war-rules-multiwar.ts` — tylko komentarz bloku dokumentacji.
- `gra/src/main.ts` — tylko komentarze (usunięty osierocony komentarz guardu Żelaza).
- `gra/tools/era-war-pairing-alliance-test.cjs` — dodany B1b (waga DP) i sekcja E1/E2 (prawdziwy moduł + mutacja źródła).
- `gra/tools/forced-war-bronze-main-guard-test.cjs` — RE-PIN: poprzednia asercja wymagała tekstu `!forcedRel.hasAllianceTreaty` w ai.ts (usuniętego decyzją właściciela; test był zielony tylko dzięki komentarzowi, który usunąłem). Nowa asercja: guard `bronzeForceWarTargetId` ma `!forcedRel.stanWojny` i NIE ma `hasAllianceTreaty`. Uzasadnienie: decyzja 2026-11-22.
- Zmian logiki parowania i progów NIE ma (poza zakresem obrony). `git diff --check` czysty. Allowlista zachowana; `git add` tylko ścieżek.

## TESTY (surowe wyniki, na czubku b703b2d2e)

- `npx tsc --noEmit` → exit 0 (`TSC_EXIT=0`)
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/era-war-pairing-alliance-test.cjs` → `19 pass, 0 fail` (A1-A3, B1, B1b, B2, C1, C2a/b, D1, E0-E2)
- `era-war-ignore-treaties-test` → `22 pass, 0 fail`
- `forced-war-stone-test` → `PASSED: 31 / FAILED: 0 / TOTAL: 31`
- `forced-war-bronze-test` → `ALL GREEN`
- `forced-war-bronze-main-guard-test` → `WYNIK: 22 PASS, 0 FAIL` (po re-pinie; przed re-pinem 21/1 — patrz wyżej)
- `forced-war-iron-main-guard-test` → `WYNIK: 36 PASS, 0 FAIL`
- `forced-war-trojstronna-test` → `PASSED: 23 / FAILED: 0 / TOTAL: 23`
- `forced-war-relation-gate-test` → `14 pass, 0 fail`
- `era-war-defer-not-cancel-test` → `29 passed, 0 failed`
- `era-war-player-included-test` → `WYNIK: 10 OK / 0 FAIL`
- `era-war-all-eras-test` → `10 pass / 0 fail`
- `war-epoch-player-first-test` → `33 pass / 0 fail`
- `war-rules-multiwar-main-guard-test` → `21 PASS / 0 FAIL`
- `war-era-counter-test` → `82 pass / 0 fail`
- `era-war-delays-test` → `WYNIK: 55 OK / 0 FAIL`
- Nie przeliczano ponownie `wojna-wymuszona-parowanie-test.cjs` (czerwony od bazy aa96cfc: S2, S7, TypeError — zgodnie z Operatorem r1, poza zakresem).
- Mutacje (surowe): D1 (blokada sojuszem w module parowania) → `assignments=0, unresolved=1,2` CZERWONY; E2 (źródło isWarTreatyBlocked) → `isWarTreatyBlocked=true` CZERWONY; sonda B1b bez wagi DP → `allPairsNonAllied=false` CZERWONY.

## BLOKADY

- Pomiar kierunkowy (zarzut 4) NIE wykonany w tej rundzie — NIE ZMIERZONO (patrz wyżej).
- Brak innych blokad procesu.

## RUNDY

2/5 (runda 1: Operator 10-operator-claude.md; Evaluator 20-evaluator-claude.md = PASS-WITH-NOTES, zarzuty 1-4). Ostatni werdykt: PASS-WITH-NOTES (Evaluator r1). Decyzja wymagana: brak.

## NASTĘPNY KROK

Evaluator (ponowna weryfikacja czubka 8607231b2) → Final Control. Osobny temat pomiaru seed 4242 (ERAWAR-PAROWANIE) po FC, jeśli orkiestrator uzna za potrzebny.

## UWAGI-DLA-ORKIESTRATORA

- Pomiar kierunkowy wymaga builda vite (poza repo) i Chromium; w tej rundzie NIE podjęto. Rekomendacja: osobny temat z runnerem wznawialnym (`--stop-at 30/60/90`).
- `wojna-wymuszona-parowanie-test.cjs` czerwony od bazy aa96cfc (S2, S7, TypeError) — dług testowy (już w #69/#78 w rejestrze).
- `npm ci` w gra/ wykonane w worktree (71 pakietów); node_modules nie jest commitowany.

DEPLOY/PUSH: NIE WYKONANO
