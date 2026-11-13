# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — raport Operatora (runda 3/5)

STATUS: PASS-WITH-NOTES (zarzut 2 / punkt 2 dispatchu r3 domknięty: wiązanie pozycji militarnej w jednej funkcji, mutacje M12/M13 zabite; punkt 3 — martwe mapowanie — ZOSTAWIONE, bo testy na nim polegają; patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1
GOAL: rozejm i pokój wg siły militarnej: słabsza strona szuka rozejmu/pokoju, silniejsza go odrzuca, opór silniejszej przełamuje wyłącznie miasto (cena PN jak dotąd); złoto i surowce NIE są słodzikiem (D2). Dotyczy gracza i AI.
BAZA: 7465018358 (origin/main, detached) + `git merge --no-ff origin/main` (f0853a6cc, FALE 682–683) → commit operatora r3 (SHA w polu sha wyniku).
RUNDY: 3/5 (Operator r3; poprzedni werdykt FC rundy 2: FAIL, raport 408c37b6d)
MODEL: Operator = Haiku (zasada 2). Brak eskalacji do Sonneta.

## Odpowiedź na zarzut FC rundy 2 (brak dowodu behawioralnego okablowania main.ts)

Zrobione w tej rundzie:
- Nowa funkcja `peaceStanceOf(self, partner, progRozniceProc, params)` w `gra/src/game/diplomacy-military-strength.ts` (obok `peaceMilitaryPosition`). Konwertuje id przez `String()` i wywołuje `peaceMilitaryPosition` z kolejnością (self, partner). To jedyne miejsce wiązania.
- `gra/src/main.ts`: `diploProposalWarState` (self = respondent, partner = proposer) i `gateVerdict` AI↔AI (self = zwycięzca, partner = przegrany) wołają wyłącznie `peaceStanceOf`. Zero bezpośrednich wywołań `peaceMilitaryPosition` w main.ts.
- `gra/src/game/ai.ts` (`decideAIDiplomacy`): wywołanie przez `peaceStanceOf` (self = `inp.myPlayerId`, partner = `rel.partnerId`). Remis rozstrzyga ten sam klucz w obu ścieżkach.

## Zmiany (pliki, allowlista r3)

- `gra/src/game/diplomacy-military-strength.ts` — +`PeaceStanceSide`, +`peaceStanceOf`.
- `gra/src/main.ts` — 2 call-site'y przepięte na `peaceStanceOf`; import (lista z `militaryBrakeOutcome`) zamieniony `peaceMilitaryPosition` → `peaceStanceOf`.
- `gra/src/game/ai.ts` — 1 call-site przepięty; import zamieniony.
- `gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs` — eksport `peaceStanceOf`; nowe asercje a6–a11: kolejność stron (M12), pasmo przez stance, zgodność remisu dla id liczbowych (main) i napisowych (ai), odwrócenie stron przy remisie.
- `gra/tools/diplo-peace-stance-wiring-test.cjs` (NOWY) — kontrola strukturalna: s1 brak `peaceMilitaryPosition(` w main.ts i ai.ts; s2a/s2b kolejność (self, partner) w obu miejscach main.ts; s3 ai.ts; s4 konwersja `String()` w `peaceStanceOf`. Potrzebna, bo main.ts nie jest importowalny w harnessie cjs (M13 nie da się zabić testem behawioralnym).
- `gra/tools/diplo-peace-gate-mutation-run.cjs` — +M12 (odwrócenie stron w `peaceStanceOf`, killer: weaker-seeks test), +M13 (zamiana kolejności w gateVerdict main.ts, killer: wiring test).
- `gra/tools/city-state-cluster-diff-test.cjs` — T7b przepisana na regułę D2 (była: „pełne AI w wojnie może oferować trybut za pokój", czyli stara reguła złota; teraz: NIE oferuje). Ten test padał od r2 (regresja r2, nie zgłoszona w raporcie r2) — naprawione tu, bo wynika z tej samej decyzji D2.

## Punkty dispatchu r3

1. Wiązanie pozycji militarnej do czystej funkcji — ZROBIONE (`peaceStanceOf`). main.ts tylko zbiera dane i wywołuje. ai.ts używa tej samej funkcji.
2. Mutacje M12 i M13 + test zgodności tie-breaku ai.ts vs main.ts — ZROBIONE (M12 zabita przez `diplo-peace-weaker-seeks-city-only-test` FAIL=6; M13 zabita przez `diplo-peace-stance-wiring-test` FAIL=1). Test zgodności: asercje a9–a11 (liczba vs napis przy remisie daje ten sam wynik; odwrócenie stron zmienia wynik).
3. Usunięcie martwego mapowania `oferuj_trybut_za_pokoj` w `diplomacy-proposals.ts` i `main.ts` — NIE WYKONANO, bo testy na nim polegają (dispatch: „jeśli test polega — zostaw i opisz"):
   - `tools/ai-war-nearest-city-peace-2t-test.cjs:381` sprawdza tekst `main.ts` pod kątem `cmd.type === 'oferuj_trybut_za_pokoj'` (rejestracja prośby AI→AI); usunięcie z main.ts zrywa asercję wiringu.
   - `tools/diplomacy-layers-test.cjs:156` i `tools/city-state-cluster-diff-test.cjs:231` używają typu jako wejścia filtra (miasta-państwa).
   - `diplomacy-proposals.ts` (`enrichAiCommandWithTreasury`, `aiCommandToPendingProposal`, `formatAiDiplomacyPlayerMessage`): usunięcie zmienia typ `AIDiplomacyCommand` w `ai.ts` (union l. ~6602), który jest także używany w `diplomacy-layers.ts`. To szerszy diff niż dozwolona allowlista r3.
   - ZAŁOŻENIE: AI nie emituje już tego typu (r2), więc mapowanie jest martwe w ścieżce AI. Propozycja: osobny temat „usuń typ oferuj_trybut_za_pokoj z AIDiplomacyCommand i main.ts/diplomacy-layers/testów" — do decyzji orkiestratora.
4. Reszta bez zmian — ZROBIONE (krok 4b, minimalny czas wojny, rozejm/pokój, D3 — bez zmian).

## TESTY (surowe wyniki z tej rundy)

- `npx tsc --noEmit -p .` → exit 0
- `tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `tools/diplo-peace-balance-accept-test.cjs` → `diplo-peace-balance-accept-test: 32 pass / 0 fail`
- `tools/diplo-war-peace-main-guard-test.cjs` → `diplo-war-peace-main-guard-test: 35 pass / 0 fail`
- `tools/ai-test.cjs` → `ai-test: 297 passed, 0 failed`
- `tools/diplomacy-test.cjs` → `[diplomacy-test] 149 passed, 0 failed (total 149)`
- `tools/diplo-war-declare-zero-trust-test.cjs` → `43 OK, 0 FAIL`
- `tools/diplo-trust-numbers-test.cjs` → `[diplo-trust-numbers-test] 22 pass, 0 fail`
- `tools/diplo-json-descriptions-sync-test.cjs` → `WYNIK: 36/36 OK, FAIL: 0`
- `tools/diplo-peace-weaker-seeks-city-only-test.cjs` → `32 pass / 0 fail`
- `tools/diplo-peace-stance-wiring-test.cjs` → `6 pass / 0 fail`
- `tools/ai-losing-war-asks-peace-vs-player-test.cjs` → `WYNIK: 12 PASS / 0 FAIL`
- `tools/city-state-cluster-diff-test.cjs` → `=== city-state-cluster-diff-test: 31 passed, 0 failed ===` (po przepisaniu T7b; przed: 30/1)
- `tools/diplo-war-peace-sim-test.cjs` → `19 pass / 3 fail` (FAIL: S3, S4b, M_TUR — dług bazowy, bez zmiany liczby)
- `tools/diplo-peace-gate-mutation-run.cjs` → `MUTACJE BRAMEK: 13/13 zabite` (M1 2+3 FAIL; M2 1; M3 2; M4 5+1; M5 2+1; M6 1; M7 3; M8 1; M9 3; M10 3; M11 1; M12 6; M13 1 — surowy wynik z tego uruchomienia)
- `git diff --check` → czysto.
- Ogólnie: `npm ci --ignore-scripts` w `gra/` → exit 0; `npm run build` / `dev` NIE uruchamiane (zakaz).

## ZAŁOŻENIA

- `peaceStanceOf` przyjmuje id jako `number | string`; konwersja `String()` jest w środku funkcji, nie u wywołującego (zamyka rozjazd remisu liczba/napis).
- Test M13 jest strukturalny (regex na tekst main.ts) — zgodnie z lekcją W45/W47 jest to jedyna dostępna kontrola dla wywołania w main.ts, a nie zastępstwo za test zachowania; zachowanie samej funkcji jest pokryte M12.
- T7b w `city-state-cluster-diff-test` przepisana na D2 (asercja odwrócona: brak złota za pokój). Zakres: tylko ta asercja.

## BLOKADY

- Punkt 3 dispatchu (martwe mapowanie `oferuj_trybut_za_pokoj`) — NIE WYKONANO; powód i zakres wyżej. Wymaga decyzji orkiestratora (osobny temat).
- Dług bazowy `diplo-war-peace-sim-test` (3 FAIL: S3, S4b, M_TUR) — poza zakresem, bez zmiany.

## UWAGI-DLA-ORKIESTRATORA

- Regresja r2 (nie zgłoszona w raporcie r2): `tools/city-state-cluster-diff-test.cjs` T7b padał po usunięciu gałęzi złota w `ai.ts`. Naprawione w tej rundzie (przepisanie asercji na D2). Zalecam dopisanie tego testu do pakietu regresji tematu.
- Nie tworzyłem żadnych sesji, zadań ani kart „Suggested task"; nie integrowałem, nie pushowałem na main, nie deployowałem.
- Commit operatora zawiera wyłącznie pliki z allowlisty r3 (podane po nazwie, bez `git add -A`), plus ten raport.

## NASTĘPNY KROK

Final Control rundy 3 (Sonnet): sprawdzić `git merge-base --is-ancestor <SHA operatora> <SHA FC>` i `git diff --stat` względem 7465018358 + f0853a6cc; zwłaszcza kolejność argumentów w `peaceStanceOf` w main.ts (2 miejsca) i w ai.ts (1 miejsce).

DEPLOY/PUSH: NIE WYKONANO
