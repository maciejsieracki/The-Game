STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-IMPL-Q1 (CULTIMPL), Final Control po obronie r2
GOAL: kultura i religia liczą się do Szczęścia i Prawa miasta (łatwy −10/+10, normalny −15/+5, trudny −20/0 na linię, skala epok ×1,0/×1,6/×2,3); ustawienie „Kultura i religia” w nowej grze; zapisy bez pola = zgodność.
ZMIANY/COMMIT: kandydat 3686694cb23e61ab673d597513fb84fc909cb99f; baza 690947a2a jest przodkiem (merge-base --is-ancestor OK). Diff: 9 plików, +597/−4, wszystkie w allowliście (culture-religion-level.ts nowy, society-breakdown.ts, society-params.json, newGameFlow.ts, main.ts tylko ustawienia/hak civTest, culture-religion-level-test.cjs, docs/obieg/KULTURA-RELIGIA-ZASADY.md, runs/**). Brak zmian gra-robocza/, WERSJE.md, ai-city-garrison.ts, garnizonu 20 pkt, wag Porządku.
TESTY (własne, na 3686694cb, z gra/ po npm ci):
  tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0;
  culture-religion-level 59/0; society-breakdown 56/0; law-garrison 3/0; prawo-siatka-v2 55/0; szczescie-skala-normalizacja 148/0; ai-test 297/0.
  Własne mutacje na źródle: (a) epoka=1 w linii Prawa -> 55/4 (czerwone, zarzut 5 usunięty); (b) udział religii Prawa zafiksowany 0,5/haRel 0 -> 57/2 (czerwone, zarzut 6 usunięty). Źródło przywrócone, drzewo czyste.
OCENA ZARZUTÓW:
  1 (pomiar AI 60 tur): ODDAL/zamknięty — pomiar wykonany w r2 (trudny vs zgodność, brak masowej utraty miast); spadek jednostek AI −30% i puste miasta 55 vs 27 = obserwacja balansowa do decyzji właściciela, nie wada implementacji.
  2 (live kreator + round-trip): round-trip zamknięty (pole w slocie, wznowienie = trudny); live kreator NIE ZMIERZONO — uwaga, nie FAIL (kod UI przejrzany: opcje, domyślne latwy, podsumowanie, normalizacja).
  3 (sekcja docs/obieg): zamknięty, plik KULTURA-RELIGIA-ZASADY.md jest w diffie.
  4 (mutacje pozorne): zamknięty, sekcja 6 przepisana; moje niezależne mutacje są czerwone.
  5, 6: zamknięte własnymi mutacjami (wyżej).
  7 (normalny/łatwy): pokryte testami Prawa łatwy i normalny (w tym epoka 2 normalny, widoczna w asercji).
  8 (PRZED/PO Prawa): zamknięty — 64800 przypadków vs 690947a2a, 0 rozjazdów (wg obrony); nie powtarzałem całej siatki, ścieżka zgodności widoczna w kodzie (cLevel !== null).
  9: zamknięty, haRel jest jednym źródłem (evaluateOrderFromBreakdown przekazuje udziały z happinessInput; brak innych wywołań computeLawBreakdown poza modułem).
  10: odrzucone z dowodem (plik analizy istnieje).
BLOKADY: brak blokujących.
RUNDY: FC po rundzie 2/5.
UWAGI-DLA-ORKIESTRATORA:
  - DECISION_REQUIRED (balans, do właściciela wg ZASAD ABC): na trudnym AI ma ok. 30% mniej jednostek i 36% pustych miast vs 16% w zgodności (garnizony 1/miasto); ai-city-garrison.ts nie zmieniano.
  - NIE ZMIERZONO: live kreator (klik opcji, zrzut rozbicia), bunty jako przyczyna utraty miast, trudność gry inna niż Normalny, wydajność/zapis na GPU.
  - Cel garnizonu 2/3/4 (odp. 24A) niewdrożony — poza zakresem; kolejna runda.
  - Domyślna nowa gra = łatwy = linie Prawa aktywne (do +20 pkt Prawa w epoce 1): zmiana PoR w nowych grach jest zamierzona wg dispatchu; zapisy legacy bez zmian.
NASTĘPNY KROK: integracja orkiestratora (merge do main, bramki), deploy na ROBOCZĄ tylko po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
