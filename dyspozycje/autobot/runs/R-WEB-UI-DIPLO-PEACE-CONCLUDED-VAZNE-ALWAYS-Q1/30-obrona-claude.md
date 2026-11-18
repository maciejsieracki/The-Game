# 30-obrona-claude — R-WEB-UI-DIPLO-PEACE-CONCLUDED-VAZNE-ALWAYS-Q1 (odpowiedź na zarzuty Evaluatora b992e3fb0)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/powiadomienia)
TEMAT: R-WEB-UI-DIPLO-PEACE-CONCLUDED-VAZNE-ALWAYS-Q1
GOAL: wpis „Pokój zawarty” w „Ważne” dokładnie raz przy każdym pokoju z udziałem gracza; AI↔AI bez wpisu.
BAZA: 98c988d7c (origin/main). KOD OPERATORA: 855dcd499 (kod gry w main.ts bez zmian w tej rundzie).
ZMIANY-COMMIT: gra/tools/peace-vazne-always-test.cjs (wzmocnienie testu) oraz ten raport. Kod gry bez zmian.

## Odpowiedzi na zarzuty
1. Test strukturalny (regexy), nie wykonanie ścieżek: PRZYJMUJĘ CZĘŚCIOWO. Wiring wymaga teraz, by przy P3 (forced-peace) i P4 (truce-peace) warunek deduplikacji i `warEventLog.unshift(` stały bezpośrednio za `const evId`. Odrzucono pełne wykonanie ścieżek w main.ts: wymagałoby uruchomienia boot() z DOM, poza zakresem testu. Test to pokrycie strukturalne plus behawioralne logPeaceVazne, a nie asercja „dokładnie 1 wpis na realnej ścieżce”.
2. Słabe mutanty: PRZYJMUJĘ. M3 usuwa teraz zapis (warunek -> false, bez unshift) zamiast zmiany id. Dodano M4 (P1: usunięte logPeaceVazne w cywAction 'pokoj') i M5 (P4: warunek -> false). Wynik: M1–M5 wykryte.
3. NIE ZMIERZONO w Chromium: PRZYJMUJĘ jako stan faktyczny. W tej rundzie nie uruchamiano przeglądarki. Test diplo-war-peace-live kończy się „A1 DOM: #civ-hi” (brak DOM w środowisku), więc nie jest to dowód wizualny.
4. Skrót „AI” w tekście dla gracza: ODRZUCAM. Istniejące teksty już go używają: gra/src/main.ts:46170 `'Atak AI — ' + ownerDiploLabel(ownerId)` oraz main.ts:39810 `'AI ' + atkOwner`. Nowy tekst „Oferta pokoju od AI przyjęta przez gracza” jest zgodny z tą terminologią. Zmiana terminologii to osobna decyzja.
5. Hotseat (ME() = aktywny fotel): ODRZUCAM jako zmianę kodu. Bramka `if (a !== ME() && b !== ME()) return;` realizuje zapis „z udziałem gracza”, bo aktywny fotel to gracz w danej turze. Zgodne z dispatchem, bez regresji.

## TESTY (surowe wyniki w tym środowisku, gra/ po npm ci)
- tsc --noEmit: exit 0
- logic-test: exit 0, „LOGIC OK (213/213)”
- tech-tree-test: exit 0, „20 pass, 0 fail”
- research-test: exit 0, „PASSED: 33 / FAILED: 0 / TOTAL: 33”
- unit-replace-test: exit 0, „WSZYSTKIE TESTY ZIELONE (21/21)”
- combat-test: exit 0, „6/6 passed”
- peace-vazne-always-test.cjs: exit 0, „WYNIK: ZIELONE”, mutanty M1–M5 wykryte
- Cztery testy dyplomacji, które w przebiegu wyglądały podejrzanie (ai-losing-war-asks-peace-vs-player, diplo-peace-ai-ai-nonnegative, diplo-truce-impl, diplo-truce-until-turn): exit 0 na kandydacie 855dcd499 ORAZ na bazie 98c988d7c. Brak regresji. (Wcześniejsze „FAIL” w tym przebiegu było dopasowaniem tekstu, nie kodem wyjścia.)
- Pełny przebieg wszystkich testów dyplomacji (peace/truce/weariness/war-peace, bez *-live): NIE ZMIERZONO w całości. Przebieg przerwany (limit czasu, background zabity). Nie wykonano: diplo-war-peace-live i diplo-truce-saveload-live (wymagają DOM/Chromium); load-game-blockers-exec (ReferenceError) nie porównano z bazą.

## BLOKADY
- Brak Chromium w tej rundzie (NIE ZMIERZONO widoczności wpisu w zakładce Ważne).
- Pełny przebieg testów dyplomacji i testy live: NIE ZMIERZONO (patrz TESTY).

## RUNDY
2/5 (runda obrony po zarzutach Evaluatora b992e3fb0).

## UWAGI-DLA-ORKIESTRATORA
- Testy *-live nie działają bez DOM w tym środowisku. Pomiar w przeglądarce wymaga osobnego tematu lub ręcznej weryfikacji.
- load-game-blockers-exec nie był porównany z bazą; nie wiadomo, czy ReferenceError jest pre-existing.

## NASTĘPNY KROK
Evaluator: ponowna weryfikacja testu i raportu; ewentualna bramka Chromium przed Final Control.

DEPLOY/PUSH: NIE WYKONANO
