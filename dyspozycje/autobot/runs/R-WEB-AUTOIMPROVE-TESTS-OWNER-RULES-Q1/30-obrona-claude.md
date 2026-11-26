STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-TESTS-OWNER-RULES-Q1
GOAL: (a) czerwone testy autoulepszeń sklasyfikowane i naprawione (STARY-PIN przepięty na koszty wg epoki); (b) zasady właściciela z 25A zweryfikowane. Pkt 4(i) (max 50% na polu automatyzacji) to konflikt decyzji właściciela, nie błąd kodu.
ZMIANY/COMMIT: kandydat 5040d8b76 (bez zmian kodu src). Obrona: poprawiony komentarz w gra/tools/autoimprove-owner-rules-test.cjs (zarzut 4, przyjęty), dodany dyspozycje/analizy/AUTOIMPTESTS-2026-11-26.md (tabela klasyfikacji, zarzut 2), ten raport (zarzut 1 i 3). SHA: patrz pole sha w odpowiedzi orkiestratora (czubek gałęzi operatora po commicie).
TESTY (surowe wyniki, obrona):
- autoimprove-owner-rules-test.cjs: WYNIK: 7 OK / 0 FAIL (exit 0)
- autoimprove-stages-q1-test.cjs: 299 passed, 0 failed
- autoimprove-pasture-irrigation-q2-test.cjs: WYNIK: 16 OK / 0 FAIL
- Baza 1bb77a7a0 (pomiar klasyfikacji): stages-q1 291 OK / 8 FAIL (wszystkie 8 = STARY-PIN, patrz analiza); pasture-irrigation-q2 16 OK / 0 FAIL (zarzut „pola poza rzeką” NIE ODTWORZONO)
- git diff --check: czysto
- Bramki ogólne (tsc, logic 213, tech-tree 20, research 33, combat 6, ai-test 297/0) NIE URUCHAMIANE: zmiana dotyczy wyłącznie komentarza w pliku testowym gra/tools/.
ODPOWIEDZI NA ZARZUTY:
1. (maksimum 50% puli) — PRZYJMUJĘ, że brak testu i brak zgłoszenia są błędem procesu; ale NIE poprawiam kodu. Dowód konfliktu: cities.ts:230 MAX_ULEPSZENIA_PRACA_AUTO_PERCENT = 100 (pole (b), celowo przywrócone przez P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1 jako naprawa regresji); cities.ts:466 MAX_PROCENT_PULI_IMPERIUM = 50 dotyczy wyłącznie pola (a). Odpowiedź 25A: max 50%. Dwie decyzje właściciela są ze sobą sprzeczne → DECISION_REQUIRED (sekcja niżej). Test 50/51/60 nie dopisany, bo na obecnym kodzie padłby.
2. (brak tabeli i analizy) — PRZYJMUJĘ. Dopisano dyspozycje/analizy/AUTOIMPTESTS-2026-11-26.md z tabelą test|asercja|przed|klasyfikacja|dowód. Wynik: 8/8 czerwonych na bazie = STARY-PIN (koszt ulepszeń wg epoki 3: farma 80, irygacja 120, kamieniołom 88, wyrąb 10; test zakładał płaskie 20/30/22/2,5). Brak BŁĘDU GRY.
3. (19 farm bez trzody w t24) — PRZYJMUJĘ jako nierozstrzygnięte. Mechanizm NIE ZMIERZONO. ZAŁOŻENIE: luka zgodna z kolejnością właściciela (farmy przed trzodą), orderViol = 0 w pomiarach; do wyjaśnienia w osobnym śledzeniu kolejki pickera.
4. (M2 przechodzi asercję 50%) — PRZYJMUJĘ. Dopisany komentarz w owner-rules-test.cjs: asercja górna nie wykrywa połowienia, wykrywa ją asercja „najlepsza tura >= 90%”. Brak zmiany asercji.
ZMIANA ZA ZGODĄ DISPATCHU (pkt 2, test (e)): próg 46 → 55 w pasture-irrigation-q2-test.cjs jest zmianą LUZUJĄCĄ, a nie naprawą czerwieni (test był zielony na bazie). Uzasadnienie: odp. 25A („irygacja czasem późno — takie są priorytety”). Mutacja E4 (56 tur) nadal powinna dawać FAIL przy 55; pomiar mutacji NIE ZMIERZONO w tej rundzie.
BLOKADY:
- DECISION_REQUIRED (właściciel, jedno pytanie, zasada gry):
  Wariant A: pole „Automatyzacja ulepszeń” ma maksimum 50% (zgodnie z 25A); skutek: gracz i AI nie wydadzą na automat więcej niż połowę Pracy z puli, a suwak kończy się na 50%; wymaga zmiany MAX_ULEPSZENIA_PRACA_AUTO_PERCENT i UI, cofa poprawkę P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1.
  Wariant B: pole zostaje 0–100% (stan obecny, poprawka regresji); skutek: 25A dotyczy tylko domyślnej wartości i ograniczenia pola (a), a gracz może przeznaczyć całą pulę na ulepszenia.
- Pkt 1 (19 farm bez trzody): ZAŁOŻENIE w raporcie, bez pomiaru mechanizmu.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: decyzja właściciela A/B dla maksimum pola automatyzacji (DECISION_REQUIRED); po decyzji osobny temat naprawy z testem 50/51/60 (A) albo zapis B w teście. Osobny temat: śledzenie kolejki pickera w turze 24.
DEPLOY/PUSH: NIE WYKONANO
