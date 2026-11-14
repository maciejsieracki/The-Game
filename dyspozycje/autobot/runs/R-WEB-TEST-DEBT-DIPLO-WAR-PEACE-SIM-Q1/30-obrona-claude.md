# R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1 — Obrona Operatora, runda 2 (odpowiedź na zarzuty Evaluatora 0a73dc1fb)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1
GOAL: opcja A — AI nie proponuje pokoju przed 10. pełną turą wojny (dla wszystkich cywilizacji); sim-test 24/24+ bez FAIL; tsc 0; testy pokoju zielone.
BAZA: e51dcd18a (kandydat r2), worktree odłączony na tym SHA. Bez zmian kodu w tej rundzie.

## Odpowiedzi na zarzuty

### Zarzut 1 (h3 w diplo-peace-weaker-seeks-city-only-test, regresja z e51dcd18a) — PRZYJMUJĘ, NIE NAPRAWIONO (wymaga decyzji orkiestratora)
- Dowód regresji (surowe wyjście, uruchomione tu):
  - baza 551034cb3: `diplo-peace-weaker-seeks-city-only-test: 29 pass / 3 fail` (FAIL: h2, h4, h5)
  - kandydat e51dcd18a: `28 pass / 4 fail` (FAIL: h2, h3, h4, h5), h3 = `[]`
- Przyczyna: h3 wywołuje `aiDecide(5, 5000, 6, 100, 200)` (turnsAtWar=5). Nowa bramka AI `Math.max(minTurWojny, PEACE_PROPOSAL_MIN_WAR_TURNS)` wymaga 10 tur.
- Dowód poprawki (scratch, cofnięte, NIE scommitowane): zmiana `aiDecide(5,` na `aiDecide(10,` w tym pliku na kandydacie daje `29 pass / 3 fail`, FAIL tylko h2, h4, h5. h3 przechodzi.
- Dlaczego nie zmieniam: plik `gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs` jest POZA allowlistą rundy 2 (TYLKO `gra/tools/diplo-war-peace-sim-test.cjs`, `gra/src/game/ai.ts` w obrębie aiPeaceTimeOk, `runs/**`). Edycja byłaby naruszeniem granic. Decyzja: orkiestrator rozszerza allowlistę o ten plik albo przypisuje zmianę do tematu długu (jedna linia: tury 5 → 10 w h3, z opisem w komentarzu testu).

### Zarzut 2 (h2, h4, h5 czerwone już na bazie) — ODRZUCAM jako regresję tego tematu, POTWIERDZAM jako dług
- Dowód: baza 551034cb3 daje FAIL h2, h4, h5 (patrz wyżej). Kandydat daje te same trzy FAIL plus h3 z zarzutu 1.
- Powód FAIL (kandydat, wyjście): `koniec zmeczenia wojna (zmeczenie 1.00, tury wojny=30): pokoj bezwarunkowy (bez miasta i zaplaty)`. To reguła „koniec zmęczenia", nie bramka czasu. Poza zakresem tego tematu. Do osobnego tematu długu testowego.

### Zarzut 3 (kandydat nie zawiera origin/main f196422) — PRZYJMUJĘ jako uwagę, NIE SCALAŁEM
- `git merge-base HEAD origin/main` = a994450166; origin/main = f196422ef.
- Próba `git merge-tree --write-tree HEAD origin/main` (bez zapisu): `ai.ts` scala się automatycznie. KONFLIKT tylko w `gra/tools/diplo-war-peace-sim-test.cjs` (origin/main zmienia ten plik: 30 insertions, 82 deletions względem e51dcd18a). Plik jest w allowliście, ale rozwiązanie konfliktu zmienia zakres testu. To decyzja orkiestratora, nie autonomiczne merge. Nie scalałem.

### Zarzut 4 (M_HEALTH przeniesiony na asercję braku zmiany) — PRZYJMUJĘ jako uwagę, bez zmian
- Wyjście: `PASS: M_HEALTH (przeniesiony): wyłączenie sygnału zdrowia nie zmienia decyzji słabszej militarnie AI`. Opisane w teście, zgodne z regułą siły militarnej. Brak poprawki.

## Wyniki bramek (kandydat e51dcd18a, surowe wyjście)
- `npx tsc --noEmit`: exit 0
- `node tools/diplo-war-peace-sim-test.cjs`: `25 pass / 0 fail` (M_TUR, M_GATE, M_STRONG, M_REV, M_FEEL, M_WEAR, M_HEALTH wykryte)
- `node tools/diplo-peace-weaker-seeks-city-only-test.cjs`: `28 pass / 4 fail` (baza 29/3)
- Nie mierzono w tej rundzie: ai-test, diplomacy-test, pozostałe testy pokoju z listy (zob. raport Evaluatora, bez powtórki).

## ZMIANY/COMMIT
- Brak zmian kodu w tej rundzie. Commit tylko tego raportu.

## BLOKADY
1. Zarzut 1: poprawka h3 wymaga pliku spoza allowlisty — decyzja orkiestratora.
2. Konflikt z origin/main w `diplo-war-peace-sim-test.cjs` — decyzja orkiestratora przed integracją.
3. Dług h2/h4/h5 (reguła zmęczenia) — osobny temat.

## RUNDY
2/5. Ostatni werdykt Evaluatora: PASS-WITH-NOTES (0a73dc1fb). Decyzja wymagana.

## NASTĘPNY KROK
Orkiestrator: (a) rozszerzyć allowlistę o `gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs` i zastosować tury 5 → 10 w h3, albo przypisać do długu; (b) rozstrzygnąć konflikt z origin/main w sim-teście; (c) założyć temat długu h2/h4/h5.

DEPLOY/PUSH: NIE WYKONANO
