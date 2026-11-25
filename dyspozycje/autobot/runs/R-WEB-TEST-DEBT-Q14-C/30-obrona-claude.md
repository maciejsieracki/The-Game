# R-WEB-TEST-DEBT-Q14-C — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-C
GOAL: Cztery testy AI zgodne z decyzjami właściciela 2026-11-25; zarzuty Evaluatora rozstrzygnięte z dowodem.
BAZA/KANDYDAT: cdb6ecfec (obrona, detach); poprawka w commicie 7dc11935b (plik: gra/tools/rydwan-bierny-atak-test.cjs). Zero zmian w gra/src i gra/data.

## Odpowiedzi na zarzuty

### Zarzut 1 — rydwan B/C/D bez mocy dowodowej: PRZYJMUJĘ (naprawione w 7dc11935b)
Przyczyna (zmierzona): ruch rydwana w starych B/C/D nie pochodził z galęzi flankingTarget.
- Nakładka `applyArmySeeksEnemyArmy` (gra/src/game/ai.ts, ok. l. 3877) ciągnęła rydwan do wroga (przy ruchu bez limitu w scenariuszu z miastem wroga).
- Dla B/C/D ruch wynikał z obrony domu (`homeDefenderAssignments`, dom (0,0)) lub bezczynnego powrotu do domu.
Poprawki w teście:
- `aiParams.ai_wojna_armia_szuka_armii_wlaczone = 0` (izolacja galęzi rydwana; moduł seek ma własne testy; A bez zmian),
- dom w (0,4), daleko od wroga (obrona domu nie przejmuje rydwana),
- B: wróg w odległości 4 (= ruch 4) → zbliżenie wymagane,
- C: wróg poza zasięgiem ruchu (odl. 8) → brak ataku i brak zbliżenia,
- D: ruchLeft=2, wróg w odl. 4 → brak zbliżenia (budżet = ruchLeft, nie ruch).

Dowód mutacji (surowe wyjście `node tools/rydwan-bierny-atak-test.cjs`, źródło przywrócone po każdej mutacji, `git diff --check` czysty):
| Wariant źródła | Wynik testu | Exit |
|---|---|---|
| Bez zmian (7dc11935b) | 8 passed, 0 failed | 0 |
| M1: `const flankingTarget = false && isFlankingUnit(...)` (galąź wyłączona) | 7 passed, 1 failed | 1 |
| M2: `isFlankingUnit` zwraca false | 7 passed, 1 failed | 1 |
| M3: `activeFlankingUnitIds` bez rydwanów (`false && isFlankingUnit(u, data)`) | 7 passed, 1 failed | 1 |
| M4: warunek zasięgu usunięty (`... <= unit.ruchLeft` → `true`) | 6 passed, 2 failed | 1 |
| MR: `<= Math.max(unit.ruchLeft, unit.ruch)` (błąd z commitu 64d5ac663) | 7 passed, 1 failed | 1 |

Uwaga: stare asercje B/C/D po mutacji M1 dawały 6 passed/0 failed (potwierdzenie zarzutu Evaluatora, zmierzone przed poprawką).

### Zarzut 2 — asercja C testuje zbliżanie poza zasięgiem: PRZYJMUJĘ (naprawione)
Stara C wymagała zbliżenia do wroga w odl. 8 przy ruchu 4 — sprzeczne z kodem (warunek `hexDistance <= unit.ruchLeft`, ai.ts ok. l. 4721-4735). Nowa C: brak ataku i dystans do wroga nie maleje. Zbliżenie w zasięgu sprawdza nowe B.

### Zarzut 3 — zakres 40–60% nie jest asercją wprost: ODRZUCAM (z dowodem), do rozstrzygnięcia przez orkiestratora
- Nagłówek testu `ai-army-composition-per-civ-test.cjs` (l. 7-8) i sekcja D (ok. l. 246) ustawiają kontrakt: `|pct.wrecz − cel| <= 10`. Dla celu 50% (Sumer, Babilonia, Asyria; tabela l. 59-61) to dokładnie zakres 40–60%, czyli decyzja właściciela pkt 1 jest wdrożona w miejscu, gdzie był próg 50% w runtime. Dziesięć czerwonych z poprzedniej rundy to wartości mierzone w sekcji D (np. Sumer 48,3%, Asyria 46,7%).
- Pozostałe „50%” (A4 `t.wrecz >= 50`, A6, A8, A11) sprawdzają walidator celu i zatwierdzoną tabelę. Walidator opiera się na stałej `ARMY_MIN_MELEE_PCT = 50` w gra/src/game/ai-army-composition.ts (l. 23, użycie l. 79). Plik src nie jest na allowliście i decyzja nie wymaga zmiany walidatora.
- Wynik: `ai-army-composition-per-civ-test.cjs` — 295 passed, 0 failed (exit 0).
- Ryzyko do decyzji (pytanie do właściciela, nie zmieniam sam): czy stała walidatora `ARMY_MIN_MELEE_PCT` ma też spaść do 40 (zmiana src, poza tym tematem). Bez tej decyzji test zostaje zgodny z kodem.

## Dodatkowo (poza zarzutami, zmierzone)
- Nakładka `applyArmySeeksEnemyArmy` maskowała galąź rydwana w testach jednostkowych. Test rydwana wyłącza ją parametrem; to zmienia tylko scenariusze tego pliku.
- Pozostałe trzy testy z allowlisty (zgodnie z decyzją 3 i 4, już w cdb6ecfec): `ai-army-replacement-concentration-test.cjs` — 35 passed, 0 failed; `ai-move-full-range-test.cjs` — 20 passed, 0 failed.

## Bramki
- `npx tsc --noEmit` (gra/): exit 0, 0 linii wyjścia.
- rydwan-bierny-atak-test.cjs: 8 passed, 0 failed (exit 0).
- ai-army-composition-per-civ-test.cjs: 295 passed, 0 failed (exit 0).
- ai-army-replacement-concentration-test.cjs: 35 passed, 0 failed (exit 0).
- ai-move-full-range-test.cjs: 20 passed, 0 failed (exit 0).
- Pełne bramki z dispatchu (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6, ai-test 297/0, era-war-pairing 19/0, ai-ai-alliance) NIE URUCHOMIONE w tej rundzie: zmiana dotyczy wyłącznie pliku testowego jednego testu, src nietknięty (`git diff --stat HEAD -- src` puste).

## BLOKADY
Brak twardych blokad. Otwarte pytanie: patrz zarzut 3 (stała ARMY_MIN_MELEE_PCT).

## RUNDY
2/5 (obrona). Ostatni werdykt Evaluatora: zarzuty 1-3 jak w dispatchu.

## UWAGI-DLA-ORKIESTRATORA
1. Zarzut 3: decyzja, czy walidator (`ARMY_MIN_MELEE_PCT`, src) ma też przejść na 40% — zmiana produktowa poza allowlistą.
2. Nakładka `applyArmySeeksEnemyArmy` (ai-war-army-seeks-army) potrafi przejąć ruch jednostek poza flankowymi — warto sprawdzić, czy jej testy pokrywają scenariusz rydwana.
3. Sprzątanie: gra/node_modules zainstalowany przez `npm ci --ignore-scripts` w worktree; usunięty po bramkach.

NASTĘPNY KROK: Evaluator (runda 2) na commicie 7dc11935b i tym raporcie; po PASS — Final Control.
DEPLOY/PUSH: NIE WYKONANO
