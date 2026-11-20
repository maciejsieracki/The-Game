# R-WEB-DIPLO-WAR-LEVEL-SETTING-IMPL-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-LEVEL-SETTING-IMPL-Q1
GOAL: ustawienie „Dyplomacja i wojna” (Łatwa / Normalna / Trudna): kary ×1/×2/×3, bonusy ÷1/÷2/÷3; Łatwa = dziś bit-w-bit.
BAZA: 29a3920b978b2672493d9ea8cc78454cd6e5bca4 (origin/main). Kandydat Operatora: 018bba066. Obrona w tej rundzie: patrz SHA w sekcji ZMIANY-COMMIT.

## Odpowiedzi na zarzuty Evaluatora

1. ai.ts:1478 ekspansja_heurystyka_granica_kara — PRZYJMUJĘ. Wdrożone: `scalePenaltyForWarLevel(getAiParam(...))` w `gra/src/game/ai.ts` (+ import z `./diplomacy-war-level`). Test W12c sprawdza źródło. Łatwa: k=1, wartość -3 bez zmian.
   UWAGA: `ai.ts` NIE jest na allowliście dispatchu. Zmiana jest jednowierszowa i wynika z ZADANIA (2) oraz ABC7 (`ai-params.json` pozycja jest w zadaniu). Orkiestrator musi jawnie dopisać `gra/src/game/ai.ts` do allowlisty albo mi to odebrać.
2. Dowód z żywego Chromium — PRZYJMUJĘ. NIE ZMIERZONO: nie uruchomiono startu gry Łatwa/Normalna/Trudna ani odczytu kary w przeglądarce w tej rundzie.
3. Pomiar 90 tur seed 4242 × 3 poziomy — PRZYJMUJĘ. NIE ZMIERZONO: brak haka poziomu w runnerze; nie rozstrzygnięto sojuszy AI↔AI na Trudnej.
4. W12 tautologiczny — PRZYJMUJĘ i poprawiono. W12 wywołuje teraz realnie `previewVoluntaryTreatyBreakPenalties` z `diplomacy-penalty-preview.ts` (handel -10/-20/-30, traktat -15/-30/-45). Mutant „podgląd zerwania bez ×k” (M5) jest czerwony (1 asercja), wcześniej przechodził zielono.
5. Brak testu zerwanieZaufanie AI↔AI — PRZYJMUJĘ i poprawiono. Eksport `aiAiBreachTrustDeltaDefault()` z `ai-ai-treaty-evaluate.ts` (ta sama ścieżka `treatyParamsDefault`). Test W10b: −20 / −40 / −60. Mutant M4 (bez ×k) czerwony (1 asercja).
6. Brak bazowego wyniku testów — PRZYJMUJĘ, częściowo zmierzone. Na 29a3920b9 uruchomiono testy, które na kandydacie były czerwone (wynik bazowy w nawiasie):
   - diplo-aggressor-mutation-test: baza 19/19, kandydat przed poprawką 17/19 (kotwice w źródle), po poprawce 19/19
   - diplo-civpedia-values-test: baza exit 0, kandydat przed poprawką exit 1 (regex dZ), po poprawce exit 0 (129 sprawdzeń)
   - diplo-json-descriptions-sync-test: baza exit 0, kandydat przed poprawką 44/48, po poprawce 46/46
   - diplo-tick-war-brake-test: baza exit 0, kandydat przed poprawką 50/51, po poprawce 51/51
   - diplo-tick-war-brake-mutation-test: baza exit 0, kandydat przed poprawką build error, po poprawce 17/17
   - diplo-trust-war-n6-cleanup-test: baza exit 0, kandydat przed poprawką build error, po poprawce 17/17
   - diplo-aggressor-unit-test: exit 0 na bazie
   - diplo-all-windows-declutter-real-render-test i diplomacy-audience-status-banner-real-render-test: baza exit 2 (brak /usr/bin/chromium), kandydat exit 2 — ŚRODOWISKOWE, nie regresja
   Pełny bazowy przebieg wszystkich 164 testów diplomacji NIE ZMIERZONO (wykonano tylko powyższe).
7. Uwaga projektowa (stan globalny poziomu) — ODRZUCAM jako blokadę, bez zmiany kodu. Dowód: poziom ustawiany jawnie w `main.ts` przy starcie/wczytaniu (domyślnie ŁATWA); testy ustawiają poziom jawnie i resetują w `withLevel` (gra/tools/diplomacy-war-level-test.cjs). Zostaje jako znane ograniczenie.

## Poprawki testów (zmiana zachowania: brak; zmiana tylko kotwic/regexów)
- diplo-aggressor-mutation-test.cjs: kotwice `AI: delta progu…` i `AI: mnoznik odwrocony` po przejściu przez scale*ForWarLevel.
- diplo-civpedia-values-test.cjs, diplo-json-descriptions-sync-test.cjs: regex `dZ =` akceptuje opcjonalny wrapper `scale…ForWarLevel(…)`; wartość bazowa nadal czytana z kodu (−15 / −10).
- diplo-tick-war-brake-test.cjs, diplo-tick-war-brake-mutation-test.cjs: kotwice P7 (limit/sufit) po ÷k.
- diplo-tick-war-brake-mutation-test.cjs, diplo-trust-war-n6-cleanup-test.cjs: `resolveDir` = gra/src/game (importy względne ./diplomacy-war-level).
- diplomacy-war-level-test.cjs: W12 realny moduł, W10b, W12c, mutanty przez `overrides` na 3 plikach (helper, podgląd, AI↔AI).

## TESTY (surowe wyniki, ta runda)
- node tools/diplomacy-war-level-test.cjs: ORYGINAŁ 28/28; mutant helper 13 czerwonych; M5 1; M4 1; exit 0
- tsc --noEmit: exit 0
- logic-test: 213 PASS / 0 FAIL
- tech-tree-test: 20 pass / 0 fail
- research-test: 33 / 0
- unit-replace-test: exit 0
- combat-test: 6/6
- ai-unit-replace-same-rules-test: 45 passed / 0 failed
- diplomacy-penalty-preview-test: 9 pass / 0 fail
- diplo-* i ai-ai-treaty-* (bez live/measure/run): 164 uruchomione; po poprawkach czerwone tylko 2 testy Chromium (środowisko: brak /usr/bin/chromium, to samo na bazie)

## BLOKADY
- Brak dowodu Chromium (zarzut 2) i pomiaru 90 tur (zarzut 3): NIE ZMIERZONO.
- ai.ts poza allowlistą (patrz zarzut 1).
- Pełny baseline 164 testów NIE ZMIERZONO (zarzut 6 częściowo).

## RUNDY
2/5 (obrona po FC/Evaluator r1). Ostatni werdykt Evaluatora: FAIL (zarzuty 1–7).

## NASTĘPNY KROK
Ponowna ocena Evaluatora na tym SHA; decyzja orkiestratora w sprawie allowlisty `ai.ts` i pomiaru/Chromium (pozostają NIE ZMIERZONO).

## Artefakty
- Worktree kandydata zawiera niescommitowane produkty testów (zmiany PNG w dowody/); przywrócone `git checkout`, nie commitowane. Untracked `dyspozycje/autobot/runs/P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1/dowody/render.png` pochodzi z testu Chromium i nie jest commitowany.
- `gra/node_modules` zainstalowane `npm ci --ignore-scripts` (gitignored); do sprzątania przez orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
