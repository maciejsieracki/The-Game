STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1
GOAL: Analiza żywności/Spichlerza oraz skarbca i kosztów jednostek w Brązie, z wariantami i pytaniami ABC. Bez zmian w grze.
ZMIANY-COMMIT: kandydat 8ec27ef967e80362b073255cdbb44936b556142d (baza ea8f70197c50e61857481a6d713515598313adcf).
- `git merge-base --is-ancestor ea8f701 8ec27ef` = TAK.
- `git diff --stat`: 6 plików, 562 wstawień, wszystkie nowe (A): 2 dokumenty w `dyspozycje/analizy/`, 2 modele w `gra/tools/`, 2 pliki runu (10-operator, 30-obrona). Wszystkie w allowliście.
- `git diff --stat -- gra/src gra/data` = puste. `git diff --check` = czysto.
TESTY (własny przebieg na 8ec27ef, po `npm ci --ignore-scripts`; liczby z surowego wyjścia):
- `npx tsc --noEmit`: exit 0, 0 błędów.
- logic-test 213/213; tech-tree-test 20 pass / 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6 pass / 0 fail.
- `node gra/tools/food-granary-model.cjs`: exit 0, 0 trafień "NaN" (cap 54000, przyrost 2005, V0 cap po 13 t, V2 po 25 t, V3 38796 po 60 t).
- `node gra/tools/treasury-unit-cost-model.cjs`: exit 0, 0 trafień "NaN" (V1 307,4; V2 269,8; V3 232,2; x2 = -31; m* = 1,92).
- Weryfikacja wyrywkowa kodu: `unitUpkeep` (economy-upkeep.ts:1064-1082) nie czyta epoki, mnożnik x4; `upkeepBalance` (l.1281-1296) bez Administratora; `computeCentralFoodCap` i obcięcie nadwyżki do capu bez rozliczenia (empire-food.ts:171-193, ~276-290); `eraRebalansAktywny` = true. Wszystko zgodne z dokumentami.
- Weryfikacja wyrywkowa danych: /tmp/rebal-keep/rebal{0,1}-seed4242.jsonl t60/90/120 (spichlerz stan/max, skarbiecRate, utrzymanie jedn./jednostki) zgodne z tabelami §B3 i §F4.
OCENA ZARZUTÓW (po treści):
1. Brak porównania z jsonl: ODDALONY po obronie. Tabela B3 i F4 z danymi z jsonl istnieje; uczciwie zaznaczono, że zrzut (20 miast, cap 54 000) nie jest odtworzony przez biegi (1-10 miast).
2. F4 dla seed 4242/7: ODDALONY. Tabela F4 jest, liczby zgodne z jsonl.
3. Hipoteza "pasek = flaga OFF": ODDALONY, hipoteza wycofana w dokumencie (B1). Pytanie ABC 1 przeformułowane. Pozostaje otwarta różnica 50 (1096 vs 1046), jawnie NIE_ZMIERZONO.
4. Wartości ulepszeń i 3363: CZĘŚCIOWO. Dodano tabelę z terrain-improvements.json; 3363 nie odtworzono (NIE_ZMIERZONO, jawnie). Akceptowalne dla analizy.
5. Parametry wariantów utrzymania: ODDALONY. Tabela "gdzie wpisać" z plikami i nowymi kluczami; brak modelu per-liczba-jednostek oznaczony jako NOWY/NIE_ZMIERZONO.
6. Niespójność 312 żywności vs 376 ¤: ODDALONY po korekcie (obóz x0,5; mieszanka marsz/obóz spójna), skład NIE_ZMIERZONO.
7. V2 przypisane psuciu: ODDALONY po korekcie; kontrast psucie-bez-zmiany-produkcji (cap po 15 t) jawny.
8. Różnica netto 388 vs 345: CZĘŚCIOWO; Administrator wyjaśnia 2 z 43, reszta 41 NIE_ZMIERZONO. Uczciwie oznaczone, nie wpływa na wnioski wariantów.
9. tsc: ODDALONY; wykonany także niezależnie przez Final Control, exit 0.
Żaden zarzut nie wymaga naprawy (nie ma FAIL).
BLOKADY: brak procesowych. Pozostałe NIE_ZMIERZONO (bez wpływu na PASS dla tematu analitycznego): odtworzenie 3363/1046; skład armii; różnica 50 w pasku; 41/t różnicy netto skarbca; mnożnik dowódcy/prawa; anomalia spichlerzMax 3000 (OFF t120) vs 1000 (ON t120); realne sprzężenie zwrotne AI/gracza przy droższych jednostkach (statyczny model daje górną granicę).
RUNDY: 1/5 (Final Control po obronie)
NASTĘPNY KROK: integracja orkiestratora (dokumenty do main, bez deployu: zmiany czysto analityczne, deploy N/A); pytania ABC do właściciela (flaga w zrzucie; ujście nadwyżki żywności; skala korekty utrzymania jednostek; sposób wdrożenia). Implementacja dopiero po decyzji właściciela jako osobny temat.
UWAGI-DLA-ORKIESTRATORA: (a) Pomiar ON obniża zapas AI o ok. 60% przy t90 (74 113 -> 28 530, s4242). (b) Netto skarbca w biegach jest ujemne (-7 do -111/t) przy obu flagach, więc korekta kosztów jednostek w górę pogłębia deficyt w biegach, a poprawia tylko stan ze zrzutu (+345/t); decyzję o skali podejmuje właściciel po zrozumieniu tej rozbieżności. (c) Utrzymanie pieniężne jednostek nie skaluje się z epoką, a koszt rekrutacji i budowy tak (x2/x4); to kandydat na korektę. (d) Nie tworzono sesji ani zadań.
DEPLOY/PUSH: NIE WYKONANO
