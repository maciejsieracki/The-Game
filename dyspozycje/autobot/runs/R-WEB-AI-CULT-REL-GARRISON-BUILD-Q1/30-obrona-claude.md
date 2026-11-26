STATUS: PASS-WITH-NOTES (obrona wykonana na wszystkie 6 zarzutów; KRYTERIUM EFEKTU W GRZE NIESPEŁNIONE, patrz pkt 3)
DOMAIN: GAME (AI)
TEMAT: R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1
GOAL: normalny/trudny AI trzyma garnizon wg potrzeby miasta i buduje budynki Prawa/Szczescia; pomiar PRZED/PO na poziomie maksymalnym (gra Trudny + Kultura i religia Trudny), seed 4242 i 7, 60 tur.
BAZA: 054af88a0 -> kandydat 052492e94 (r3) -> obrona: ada7614d3 (kod + testy), c6e6c1526 (hak pomiaru difficulty). Czubek pracy: patrz pole sha w StructuredOutput.

## ZARZUTY -- ODPOWIEDZI
1. PRZYJMUJĘ (naprawione). Preferencja budynkow wydzielona z chooseCityProduction do eksportowanej funkcji applyOrderDeficitBuildingBonus (gra/src/game/ai.ts) z warunkiem: need >= 1, bez kopii defensywnej. Nowy test T5 (gra/tools/ai-city-order-need-wiring-test.cjs): garnizon +40 (Prawo), swiatynia +40 (Szczescie), koszary bez zmian; need=0, brak pola, kopia defensywna -> bez zmian. Nowe mutanty MW6 (bonus 40->0), MW7 (pominiety warunek kopii), MW8 (gate >= 0) -- wszystkie wykryte. Residual: sam wpis wywolania applyOrderDeficitBuildingBonus w chooseCityProduction nie jest pokryty testem jednostkowym (sprawdzony przegladem kodu); test end-to-end chooseCityProduction nie byl robiony.
2. PRZYJMUJĘ (zmierzone). Dodano licznik przyczyn zejscia jednostek (unitFlow, --unit-flow 1) i porownanie z kontrola zgodnosci. Wynik (surowe: dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1/40-pomiar-r4-surowy.txt):
   - Straty AI NIE tlumacza roznicy: rozwiazanie-ai 54 (PRZED) / 37 (PO) / 58 (zgodnosc) na seed 4242; 36 / 47 / 12 na seed 7. Glod armii i deficyt zlota: 0 we wszystkich biegach. Spadek liczby miast AI: 0-1 w calym biegu.
   - Roznica jest w REKRUTACJI: nowe jednostki AI przez 60 tur: seed 4242 PRZED 252, PO 242, zgodnosc 365; seed 7 PRZED 258, PO 269, zgodnosc 368. Trudny ma ok. 30% mniej nowych jednostek przy podobnych stratach.
   - Mechanizm, dlaczego trudny rekrutuje mniej (produkcja miast pod kara Porzadku, priorytet budowy, limit), NIE ROZSTRZYGNIETY: brak licznika produkcji jednostek per miasto. Bunty: NIE ZMIERZONO (rekord tury nie ma pola buntu; brak haka).
3. PRZYJMUJĘ jako wynik: efekt wpiecia na trudnym (max) jest pomijalny i kryterium "mniej pustych miast i brak rozpadu AI" NIE JEST spelnione w sensie znaczacym.
   - seed 4242 t60: jednostki PRZED 182 -> PO 187; puste miasta 32,1% -> 31,4%; bud. Prawa 35 -> 40; bud. Szczescia 82 -> 91.
   - seed 7 t60: jednostki 205 -> 205; puste 34,7% -> 34,5%; bud. Prawa 30 -> 26; bud. Szczescia 90 -> 80.
   - Roznice mieszcza sie w szumie jednego biegu na wariant; nie dokladalem kolejnych ziaren w tej rundzie. Rekomendacja: NIE traktowac wpiecia garnizonu jako poprawy balansu; decyzja o zostawieniu kodu (bez efektu mierzalnego) lub wycofaniu -- po stronie orkiestratora.
4. PRZYJMUJĘ (naprawione). Hak startGame przyjmuje teraz difficulty (main.ts, domyslnie Normalny jak dotad); runner ai-cult-rel-measure-run.cjs ma --difficulty (domyslnie trudny = maksimum). Wszystkie pomiary r4 (PRZED, PO i kontrola zgodnosci) robione przy grze Trudny i Kultura i religia = trudny (zgodnosc: kr = brak ustawienia, gra Trudny). Stare liczby (gra Normalny) zastapione.
5. PRZYJMUJĘ (naprawione). Komentarz "Wojsko na heksie miasta - bonus Prawo w Porzadku" wraca nad lawGarrisonCountForCity (gra/src/main.ts), blok AICULT ma wlasny komentarz.
6. PRZYJMUJĘ (naprawione). Potrzeba garnizonu liczona jest z ordPct, ktory faktycznie wchodzi w bunt: PO applyCivMatrixHappinessModifier i PO applyPostCaptureLawOverride (gra/src/main.ts, blok po `const ordPct = ...`). Pomiar PO r4 zawiera te zmiane (build z ada7614d3 + c6e6c1526).

## ZMIANY/COMMIT
- ada7614d3: gra/src/game/ai.ts (applyOrderDeficitBuildingBonus), gra/src/main.ts (komentarz; need z ordPct), gra/tools/ai-city-order-need-wiring-test.cjs (T5, MW6-MW8).
- c6e6c1526: gra/src/main.ts (hak startGame difficulty, opcjonalny), gra/tools/ai-cult-rel-measure-run.cjs (--difficulty).
- dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1/30-obrona-claude.md, 40-pomiar-r4-surowy.txt (ten commit).
- Zmiany poza kodem gry: node_modules w gra/ zainstalowane przez npm ci (nie w repo, do posprzatania po integracji); pliki pomiaru poza repo w scratchpadzie.

## TESTY (surowe wyniki, ada7614d3 / c6e6c1526)
- tsc --noEmit: exit 0.
- ai-city-order-need-wiring-test: 231 passed, 0 failed (T1-T5 + mutanty MW1-MW8 wykryte).
- ai-city-order-need-test: 35 passed, 0 failed.
- ai-city-garrison-min-one-test: 38 passed, 0 failed.
- society-breakdown-test: 56 OK, 0 FAIL.
- culture-religion-level-test: 59 pass / 0 fail.
- culture-religion-test: 65 passed, 0 failed.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: ALL GREEN.
- unit-replace-full-cost-test: 40 passed, 0 failed.
- unit-replace-promotion-table-test: PASS (32 wpisow, 63 krawedzi, brak cykli).
- combat-test: All sanity checks passed.
- ai-test: 297 passed, 0 failed (bez zmian).
- Nie uruchamiane w tej rundzie: pozostale unit-replace-* poza dwoma powyzszymi.

## POMIAR (poziom maksymalny: gra Trudny, Kultura i religia trudny; 60 tur; Chromium; surowe w 40-pomiar-r4-surowy.txt)
| wariant | seed | jednostki t60 | puste t60 | bud. Prawa | bud. Szczescia | nowe jedn. AI (1-60) | straty rozwiazanie-ai |
| PRZED (54af88a0e) | 4242 | 182 | 51/159 (32,1%) | 35 | 82 | 252 | 54 |
| PO (c6e6c1526 + ada7614d3) | 4242 | 187 | 50/159 (31,4%) | 40 | 91 | 242 | 37 |
| kontrola zgodnosc | 4242 | 273 | 56/190 (29,5%) | 68 | 155 | 365 | 58 |
| PRZED | 7 | 205 | 58/167 (34,7%) | 30 | 90 | 258 | 36 |
| PO | 7 | 205 | 57/165 (34,5%) | 26 | 80 | 269 | 47 |
| kontrola zgodnosc | 7 | 337 | 38/194 (19,6%) | 47 | 170 | 368 | 12 |
Diagnoza: spadek jednostek przy Trudny to mniej rekrutow (ok. 30%), nie straty (glod i zloto 0; rozwiazania podobne jak w zgodnosci). Przyczyna produkcji nieustalona. Efekt wpiecia: pomijalny.

## BLOKADY
- Brak blokad technicznych.
- Bunty i utrata miast: NIE ZMIERZONO (brak haka; rekord tury bez pola buntu).
- Mechanizm mniejszej rekrutacji: NIE ROZSTRZYGNIETY (wymaga licznika produkcji per miasto; poza tym tematem bez zmiany gry).
- Efekt wpiecia (wariant PO): kryterium binarne NIE spelnione (pkt 3); tylko 2 ziarna x 1 bieg.

## ZALOZENIA
- (a) Poziom maksymalny gry = Trudny (opcje Normalny/Trudny/Latwy; Trudny to najwyzszy); Kultura i religia maksimum = trudny.
- (b) Bonus budynkow 40 zostaje jako minimalna waga (nie zmieniany w tej rundzie).
- (c) Potrzeba liczona z ordPct po macierzy cywilizacji (zmiana z r3, pkt 6).

## RUNDY
4/5 (r1 FAIL, r2 BLOCK, r3 PASS-WITH-NOTES, r4 = ta obrona).

## NASTĘPNY KROK
Evaluator: ocena r4 (kod + pomiar na maksimum). Orkiestrator: decyzja, czy wpiecie garnizonu i preferencje budynkow zostaja (efekt pomijalny), czy kolejny temat diagnostyczny z licznikiem produkcji jednostek per miasto (rekrutacja). Zadnej zmiany balansu tu nie wykonano.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch wskazywal runner R-WEB-CULT-REL-IMPL-Q1, ktorego nie ma w repo; uzyty gra/tools/ai-cult-rel-measure-run.cjs (kopia ai-economy-measure-run z --kr i --difficulty).
- Pomiar wykorzystuje istniejacy hak unitFlowTurn (--unit-flow 1); brak pola buntu w rekordzie tury.
- Zgodnosc jako kontrola: startGame z kr = zgodnosc, difficulty trudny (uruchomiona 2 razy, bez mieszania zmiennych).
- Build: vite z gra/ (bez npm run build), outDir w scratchpadzie; node_modules zainstalowane przez npm ci w worktree -- usunac po integracji.
- Sprzatanie: scratchpad/aicult zawiera bundle i surowe pliki (poza repo).

DEPLOY/PUSH: NIE WYKONANO
