STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1
GOAL: obrona operatora po zarzutach Evaluatora (kandydat 6a621223d, baza 44af89169). Odpowiedź na każdy zarzut: PRZYJMUJĘ albo ODRZUCAM z dowodem. Zmiany kodu gra/: BRAK.
BAZA/KANDYDAT: 44af89169 (origin/main) -> 6a621223d (raport operatora r1). Worktree fast-forward do 6a621223d przed pracą.

## Odpowiedzi na zarzuty Evaluatora (raport 20-evaluator-claude.md, SHA 10c95cf4f)

### Zarzut 1 — brak testu Chromium na realnym oknie dyplomacji: PRZYJMUJĘ
Uzasadnienie operatora r1 („pomiar wymaga decyzji o etykietach”) było NIETRAFNE: pomiar AKTUALNEGO kodu nie wymaga zmiany etykiet. Test Chromium NIE został wykonany w tej rundzie (NIE_ZMIERZONO). Wniosek „11,6 = zapisana relacja, 90 = power-based” jest hipotezą z czytania kodu, bez dowodu dla jednej pary. Otwarte do R2 (wymaga Vite poza repo i stanu gry z parą W31).

### Zarzut 2 — tabela „UI → źródło” niekompletna: PRZYJMUJĘ
Potwierdzone czytaniem kodu:
- gra/src/main.ts:21164 i :21213 — `relTotal = treatyEvalRelationTotal(...)` (okno propozycji na stole, zapisana relacja) -> `computePlayerAcceptanceSides` (main.ts:21277) -> `relCurrent` -> wiersz „Wpływ Relacji na deal” (gra/src/ui/diplomacyAcceptanceBalance.ts:107-130, `relTotal = side.relCurrent` w :145, `their.relCurrent` w :638). To jest JEDYNE okno, w którym pojawia się wartość zapisana „11,6”.
- gra/src/ui/diplomacyTradeBasket.ts:1129 i :2065 — `rel = ctx.relacjaTotal` (koszyk audiencji, panel PW tej sekcji) dostaje wartość z main.ts:25762 = `audienceRelTotal(...)` (NOMINALNA power-based), NIE zapisaną relację. Ten wiersz NIE pokazuje „11,6”.
Tabela w sekcji „Tabela” poniżej uzupełniona o te wiersze.

### Zarzut 3 — trzy wielkości, nie dwie; błędne przypisanie 90/200 do getNegotiationContext: PRZYJMUJĘ
Potwierdzone:
- zapisana: `treatyEvalRelationTotal` = `relationTotal` = clamp(zaufanie + respekt, 0, 200) (gra/src/game/diplomacy-pn-engine.ts:147-148), z clampRelationForWar gdy status „wojna” (gra/src/game/diplomacy-proposals.ts:712-715).
- nominalna power-based: `audienceRelTotal` = round(clamp(zaufanie + objectiveRespektPctToward)) (gra/src/main.ts:25306-25308). Steruje bramkami handlu/daru i koszykiem: gra/src/main.ts:25762 (`relacjaTotal: audienceRelTotal(ownerId, rel)`, komentarz w 25636-25638 potwierdza „nominalna zostaje jako gate w buildAudienceActions/getNegotiationContext”).
- efektywna power-based: `audienceRelTotalEffective` = round(clamp(zaufanie + objectiveRespektPctTowardEffective)) (gra/src/main.ts:25354-25358), wyświetlana jako „90/200” w prawym panelu audiencji: gra/src/main.ts:25639 (`relacjaTotal: audienceRelTotalEffective(ownerId, rel)`).
Błąd operatora r1: zdanie „90/200 steruje ... progiem handlu (getNegotiationContext.relacjaTotal)” jest NIEPRAWDZIWE. Próg handlu używa wersji NOMINALNEJ. Wariant B etykiet musi rozróżniać efektywną od nominalnej (dwie różne liczby z tego samego zaufania i respektu).

### Zarzut 4 — czynnik wojny (clampRelationForWar) nierozpatrzony: PRZYJMUJĘ jako lukę; NIE_ZMIERZONO status pary
Mechanizm istnieje: diplomacy-proposals.ts:712-715 stosuje clampRelationForWar gdy `rel.status === 'wojna'`; clampRelationForWar (gra/src/game/diplomacy.ts:1121-1133) obniża Zaufanie, potem Respekt, gdy `relationScore` (ważony mnożnikami DIPLOMACY_PARAMS, diplomacy.ts:839-843) przekracza WAR_RELATION_SCORE_CAP. Uwaga: skala cap (29) jest w wadze `relationScore`, a nie w surowej sumie, więc nie da się wykluczyć przycięcia wojennego analizą samego kodu. Status pary W31 w chwili pomiaru NIE został ustalony (NIE_ZMIERZONO). Wniosek „11,6 = zapisana” wymaga sprawdzenia, czy para nie była w „wojnie”.

### Zarzut 5 — diplomacyAudience.ts poza allowlistą: PRZYJMUJĘ
Wariant B z raportu r1 zmienia etykiety w diplomacyAudience.ts (prawy panel audiencji, linia „Relacja X / 200”). Allowlista DODATKU (diplomacyAcceptanceBalance.ts + „okno dyplomacji, tylko wyświetlanie”) tego pliku NIE wymienia wprost. Nie zmieniam allowlisty samodzielnie. Decyzja dla orkiestratora przed R2: (a) rozszerzyć allowlistę o gra/src/ui/diplomacyAudience.ts (tylko etykiety), albo (b) ograniczyć R2 do diplomacyAcceptanceBalance.ts (etykieta „Wpływ Relacji na deal” i nagłówek PW), a rozdział etykiet audiencji przenieść do osobnego tematu.

### Zarzut 6 — bramki tsc i 5 referencyjnych NIE_ZMIERZONO: PRZYJMUJĘ, zmierzone w tej rundzie
Worktree: `npm ci --ignore-scripts` w gra/ (exit 0). Surowe wyjścia (kandydat 6a621223d = kod 44af89169, bez zmian gra/):
- `npx tsc --noEmit` — exit 0 (bez błędów w wyjściu).
- `node tools/logic-test.cjs` — exit 0; ostatnia linia: „LOGIC OK (213/213)”.
- `node tools/tech-tree-test.cjs` — exit 0; „tech-tree-test: 20 pass, 0 fail”.
- `node tools/research-test.cjs` — exit 0; „PASSED: 33 / FAILED: 0 / TOTAL: 33”.
- `node tools/unit-replace-test.cjs` — exit 0; „WSZYSTKIE TESTY ZIELONE (21/21)”; 21 linii [OK], 0 FAIL.
- `node tools/combat-test.cjs` — exit 0; „COMBAT TEST: 6/6 pass”; „All sanity checks passed.”
Logi: /tmp/claude-0/tsc-R1.log, /tmp/claude-0/logic-test-R1.log, /tmp/claude-0/tech-tree-test-R1.log, /tmp/claude-0/research-test-R1.log, /tmp/claude-0/unit-replace-test-R1.log, /tmp/claude-0/combat-test-R1.log.

## Tabela: miejsce w UI -> źródło -> znaczenie (uzupełniona)

| Miejsce w UI | Źródło (kod) | Znaczenie |
|---|---|---|
| Okno propozycji na stole, wiersz „Wpływ Relacji na deal” (ten sam panel PW) | main.ts:21164/21213 `treatyEvalRelationTotal(rel)` -> main.ts:21277 `computePlayerAcceptanceSides` -> diplomacyAcceptanceBalance.ts:145, :638 `relCurrent` | ZAPISANA relacja (clamp(zaufanie+respekt,0,200); z clampRelationForWar przy wojnie). Steruje modyfikatorem PW i bramką pwBalance. Jedyne miejsce z „11,6”. |
| Koszyk audiencji / panel PW w koszyku, „Wpływ Relacji na deal” w koszyku | diplomacyTradeBasket.ts:1129, :2065 `ctx.relacjaTotal` <- main.ts:25762 `audienceRelTotal` | NOMINALNA power-based (zaufanie + respekt z mocy, zaokr.). Bramki handlu/daru. NIE pokazuje zapisanej wartości. |
| Prawy panel audiencji „Relacja 90 / 200”, linia „Stan bieżący” | main.ts:25639 `audienceRelTotalEffective` (main.ts:25354-25358) | EFEKTYWNA power-based (z bonusami weterana/fortyfikacji/trudności), zaokr. Wyświetlana wartość. NIE steruje progiem handlu. |
| Bramki handlu / daru / diplomacyFairGivePn | main.ts:25762 `audienceRelTotal` (nominalna) | Mechanika progów; nominalna, nie efektywna i nie zapisana. |

## Wniosek (poprawiony względem r1)

Trzy wielkości, nie dwie:
1. zapisana (11,6 w oknie PW) — silnik,
2. nominalna power-based — bramki handlu i koszyk,
3. efektywna power-based (90/200) — wyświetlana na audiencji.

Hipoteza „11,6 = zapisana, 90 = efektywna power-based” pozostaje NIEZWERYFIKOWANA na żywo (zarzut 1), a status wojny pary (zarzut 4) jest nieustalony. Rozjazd progów (zapisana vs nominalna dla handlu) jest decyzją produktową/silnikową poza allowlistą tego tematu.

## Testy / bramki (ta runda, kandydat = kod 44af89169)

- tsc: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: 33/33.
- unit-replace-test: 21/21.
- combat-test: 6/6.
- Test Chromium (okno dyplomacji, para W31): NIE_ZMIERZONO w tej rundzie.
- Mutacja: nie dotyczy (brak poprawki kodu).

## ZMIANY/COMMIT

- Kod gra/: BRAK zmian.
- Plik raportu: dyspozycje/autobot/runs/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1/30-obrona-claude.md (jedyny zacommitowany plik tej rundy).

## BLOKADY

- Decyzja właściciela (ABC): wariant A/B/C oraz nazwy etykiet (jak r1).
- Decyzja orkiestratora (zarzut 5): allowlista dla diplomacyAudience.ts.
- Otwarte pomiary: test Chromium (zarzut 1) i status wojny pary W31 (zarzut 4) — NIE_ZMIERZONO.

## RUNDY

2/5 (runda obrony po r1 operatora; orkiestrator decyduje o R2).

## NASTĘPNY KROK

Orkiestrator: (1) ABC właściciela wariant A/B/C; (2) rozstrzygnięcie allowlisty dla diplomacyAudience.ts; (3) po wyborze — Operator R2: pomiar Chromium (para z W31, zapisana vs nominalna vs efektywna, z ustaleniem statusu wojny) i etykiety, potem mutacja, tsc i 5 bramek.

DEPLOY/PUSH: NIE WYKONANO
