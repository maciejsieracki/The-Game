STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza, bez kodu)
TEMAT: R-WEB-NNS-T1-FOOD-UPGRADE-ANALYSIS-Q1 (zadanie #154)
GOAL: dokument z faktami i wariantami po polsku dla (a) bramki „Zakończ turę” NNS w turze 1 i (b) kosztu ulepszeń w żywności vs automatyczne pastwiska i irygacja. Zero zmian kodu i danych.
ZMIANY-COMMIT: kandydat dcfb097898ae268bd4bd51c5e0835e26089edd6b (baza 8ad1d555d). Obrona zmienia dwa pliki allowlisty: dyspozycje/analizy/NNS-T1-I-KOSZT-ULEPSZEN-ZYWNOSC-2026-11-26.md (przepisana sekcja (b) i Ograniczenia) oraz ten raport. Brak zmian w gra/src, gra/data, WERSJE.md, manifeście. Commit: patrz sekcja SHA w odpowiedzi orkiestratora.
TESTY:
  - Odpowiedź na zarzut 1 (PRZYJMUJĘ): dokument źle czytał „14/3". Pełny plik gra/tools/autoimprove-pasture-irrigation-q2-test.cjs, flaga true, baza 8ad1d555d (ZMIERZONO, ok. 55 s): WYNIK 14 OK / 3 FAIL. Trzy niespełnione asercje: (1) „pola obywateli POZA rzeką z farmą: 0 (>=1)"; (2) „(e) pierwsza irygacja w turze 7 (<=6)"; (3) „(e) w turze 24 każda farma ma trzodę (brak: 38)". Dokument teraz wymienia wszystkie trzy. „3 z 14 ziaren" zostaje jako osobna pętla bisect (SEED 1..14), oznaczona jako inny pomiar.
  - Odpowiedź na zarzut 2 (PRZYJMUJĘ): flaga false, ten sam plik, cofnięte przez git checkout (ZMIERZONO): WYNIK 15 OK / 2 FAIL, asercje (1) i „(e) w turze 24 ... (brak: 19)". Wariant B w dokumencie przepisany: naprawia irygację (asercja (2) przechodzi) i zmniejsza lukę trzody 38→19, ale nie czyni testu zielonym. Usunięto obietnicę „test (e) wraca do zielonego". Wariant C zaznacza, że asercja (1) wymaga osobnej decyzji.
  - Odpowiedź na zarzut 3 (PRZYJMUJĘ): dokument podaje teraz obie metryki: `starved` (bisect) i `gapGrow` (farmy bez trzody w turze 24): 38 przy flagi true, 19 przy false (ZMIERZONO, wynik testu i bisect). Interpretacja „głodowania" oparta na samym starved została usunięta.
  - Odpowiedź na zarzut 4 (PRZYJMUJĘ): pełny test uruchomiony (ok. 55 s, obie flagi). Dokument zawiera wyniki z surowego wyjścia, nie z pamięci. Asercja (1) „pola POZA rzeką" pada niezależnie od flagi i jest opisana w wariantach (C).
  - Odpowiedź na zarzut 5 (PRZYJMUJĘ, niższa waga): uruchomiono tanie testy bramki NNS (ZMIERZONO): gra/tools/no-negative-stocks-test.cjs 25 passed / 0 failed; gra/tools/end-turn-gate-projection-only-test.cjs 49 passed / 0 failed (w tym asercja (11e) o braku NNS_WOLNE_TURY w main.ts); gra/tools/no-negative-stocks-ai-from-turn1-test.cjs 27 passed / 0 failed. Te testy nie mierzą prognozy tury 1 przy domyślnych podatkach; liczby −2/−3 i 89 s / 250 s dalej pochodzą z rejestru (NIE ZMIERZONO).
  - Zarzuty bez dowodu obalającego: 0 (wszystkie przyjęte).
  - Odpowiedź na pytanie 1 (a): zasada „gracz wolny w turach 1–10" została usunięta decyzją z 2026-11-14; blokada tury 1 jest zgodna z kodem (wyjatekTur = false, no-negative-stocks.ts:87). Ustalone przez odczyt kodu i testy (ZMIERZONO), nie przez rozstrzygnięcie za właściciela.
BLOKADY: brak technicznych. Liczby prognozy tury 1 (−2/−3) i czasów 89 s / 250 s nie były ponownie mierzone (NIE ZMIERZONO).
RUNDY: 2/5 (runda Operatora 2; poprzednia runda: ocena Evaluatora FAIL, 5 zarzutów).
UWAGI-DLA-ORKIESTRATORA:
  1. Asercja (1) „pola obywateli POZA rzeką z farmą ≥ 1" w gra/tools/autoimprove-pasture-irrigation-q2-test.cjs pada na bazie 8ad1d555d przy obu wartościach flagi (na ziarnie 1 brak takiego pola). To nie jest skutek kosztu żywności. Decyzja inżynierska (scenariusz testu, nie balans): do rozstrzygnięcia przez orkiestratora, nie przez właściciela.
  2. Luka trzody w turze 24 (gapGrow) przy fladze false wynosi 19 farm i nie jest wyjaśniona przyczynowo w tej rundzie (NIE ZMIERZONO). Ziarno 3 głodzi także przy fladze false (2 tury). Oba to tematy do osobnego śledzenia, nie do decyzji właściciela.
  3. Dispatch podawał „3 z 14 głoduje" jako wynik testu; to pomyłka. Wynik testu to 14 OK / 3 FAIL. Zalecana korekta wpisu rejestru #128(c) / #154.
  4. Pytanie ABC do właściciela (koszt żywności: wariant A/B/C) należy zadać po ECHO wg zasad ABC, z wariantami z dokumentu; rekomendacja orkiestratora tylko po stronie orkiestratora.
  5. Gra w przeglądarce nie była uruchamiana (NIE ZMIERZONO).
  6. Do sprzątania: gra/node_modules zainstalowano przez `npm ci --ignore-scripts` tylko na potrzeby harnessu; usunąć po rundzie (wymóg sprzątania dysku).
NASTĘPNY KROK: runda ewaluacji Evaluatora na kandydacie po tym commicie (sprawdzić: 5 zarzutów przyjęte, liczby z wyjścia testu zgodne z dokumentem, allowlista czysta). Po PASS: orkiestrator zadaje pytanie ABC (koszt żywności) i aktualizuje rejestr (#154, #128c).
DEPLOY/PUSH: NIE WYKONANO
