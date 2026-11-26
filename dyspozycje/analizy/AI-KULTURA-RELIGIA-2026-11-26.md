# AI na poziomie „Kultura i religia” — diagnoza i stan wdrożenia (R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1, AICULT #189)

Status dokumentu: diagnoza z kodu + stan wdrożenia na kandydacie r2. Pomiar PRZED/PO na poziomie trudnym
NIE został wykonany w tej rundzie (oznaczone NIE_ZMIERZONO). Liczby oznaczone „z notatek FALI 924” pochodzą
z wcześniejszego pomiaru zapisanego w rejestrze, nie z tej rundy.

## 1. Stan kodu (zweryfikowany na kandydacie 24db8cbd2)

- Garnizon AI jest dziś binarny: miasto albo ma na swoim heksie kwalifikującą się jednostkę bojową, albo nie.
  Źródło: `gra/src/game/ai-city-garrison.ts`, `cityNeedsGarrison` (pusta lista jednostek na heksie = potrzeba).
- Rekrutacja garnizonu: `gra/src/game/ai.ts` `emptyCityGarrisonRecruitIds` (ok. linia 1981) zwraca zbiór
  id miast (jedno `build` na miasto). Konsumenci: ok. linia 4112 (decideAITurn) i ok. linia 5705
  (defensiveCopy). Zbiór nie niesie liczby jednostek, więc wymagany garnizon „n jednostek” nie ma tu miejsca.
- Wykluczenie garnizonu z puli armii: `getCityGarrisonUnitIds` zwraca JEDNĄ jednostkę na miasto
  (najsłabszą kwalifikującą się). Dodatkowe jednostki stojące w mieście wracałyby do armii, więc
  wpięcie „n jednostek” wymaga zmiany wszystkich konsumentów `garrisonUnitIdSet` (ok. linie 3818, 3913,
  4336, 4967, 5540, 5886 w ai.ts).
- Funkcja potrzeby `aiCityGarrisonNeed` i bramka `aiGarrisonNeedApplies` (`gra/src/game/ai-city-order-need.ts`)
  istnieją jako czysta funkcja z testem `gra/tools/ai-city-order-need-test.cjs` (35/0), ale NIE są
  importowane przez żaden kod gry poza testem. Zachowanie AI na żadnym poziomie się przez nie nie zmienia.
- Wejście do funkcji potrzeby (Szczęście %, netto Prawa bez garnizonu, mianownik Prawa) liczy silnik w
  `gra/src/game/society-breakdown.ts` (`computeHappinessBreakdown`, `computeLawBreakdown`, `prawMaxForCity`).
  Wywołanie `computeLawBreakdown` z danymi miasta jest po stronie `gra/src/main.ts`; ai.ts nie dostaje
  tych danych. To jest główna przeszkoda wpięcia (wymaga przekazania wyliczonego wejścia przez `opts`).
- Budowa AI: `chooseCityProduction` (ai.ts, ok. linia 2005) ma stałe kategorie punktowe
  (ekonomia/wojsko/obrona/nauka). Brak jakiejkolwiek preferencji budynków Prawa (Garnizon, Pretorium)
  ani Szczęścia (Świątynia i inne z `buildings.json`) zależnej od poziomu „Kultura i religia”.

## 2. Diagnoza przyczyny −30% jednostek i 36% pustych miast (poziom trudny, seed 4242)

- Wartości (−30% jednostek 171 vs 243; puste miasta 36% vs 16%) pochodzą z notatek FALI 924 (CULTIMPL),
  NIE z tej rundy. Nie zostały ponownie zmierzone.
- Na podstawie kodu z punktu 1 hipotezy są następujące (żadnej nie potwierdzono pomiarem):
  - H1: AI nie dostaje jednostki garnizonu w miastach, w których Porządek jest w buncie skrajnym, bo
    garnizon jest binarny (1 jednostka) i nie rośnie z potrzebą. Przy trudnym poziomie obca kultura i
    religia wymagają 4 jednostek do wyjścia z buntu (model CULTMODEL2, 221bfd05c), więc 1 jednostka
    nie wystarcza i miasto nadal jest w buncie.
  - H2: brak budynków Prawa/Szczęścia w planiście AI powoduje, że Porządek nie rośnie bez garnizonu.
  - H3: ekonomia utrzymania jednostek (koszt rośnie z liczbą jednostek) — NIE sprawdzone; ewentualna
    poprawka dotykałaby balansu, więc wymagałaby decyzji właściciela (DECISION_REQUIRED).
- Rozstrzygnięcie H1 vs H3 wymaga pomiaru z licznikiem powodów (bunt, utrata miasta, brak produkcji,
  brak zasobów). NIE_ZMIERZONO w tej rundzie.

## 3. Potrzeba garnizonu (funkcja czysta, do wpięcia)

- `aiCityGarrisonNeed(input)` zwraca najmniejsze n w [0..capUnits], przy którym Porządek nie jest w buncie
  skrajnym (próg REVOLT_CRITICAL_POR_PCT = 12). Liczy wzorem silnika (`computePorPct`, `pctFromNetto`,
  `porPctBand`), więc nie rozjeżdża się z grą.
- Zakres: tylko poziom normalny i trudny (`aiGarrisonNeedApplies`). Łatwy i tryb zgodności (null)
  zostają przy dzisiejszym zachowaniu.
- Tabela wzorcowa CULTMODEL2 (normalny 3/3, trudny 4 do wyjścia z buntu, pop 5, epoka 1, obca kultura
  i religia) wymaga PEŁNEGO wejścia z silnika miasta. Test w `ai-city-order-need-test.cjs` używa wejścia
  uproszczonego i tej tabeli NIE sprawdza (zobacz zastrzeżenie w jego nagłówku).

## 4. Co wdrożono w tej rundzie

- Brak zmian w kodzie gry. Kandydat r2 = kandydat r1 (`4617cc91b`) plus raporty Operatora.
- Bramki uruchomione na kandydacie 24db8cbd2 (po `npm ci --ignore-scripts` w `gra/`):
  - `npx tsc --noEmit -p .` w `gra/`: EXIT=0.
  - `node tools/ai-city-order-need-test.cjs`: 35 passed, 0 failed (of 35).
  - `node tools/ai-city-garrison-min-one-test.cjs`: 38 passed, 0 failed (of 38).
  - logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0: NIE_ZMIERZONO w tej rundzie.
    Powód: wyniki byłyby informatywne dopiero po wpięciu; dla bieżącego kodu gry niezmienionego są
    nieinformatywne, ale nie zostały uruchomione.

## 5. Co pozostaje (BLOCK do kolejnej rundy)

1. Wpięcie `aiCityGarrisonNeed` w rekrutację garnizonu (ai.ts `emptyCityGarrisonRecruitIds` i
   konsumenci), tylko dla `aiGarrisonNeedApplies(getCulturaReligiaLevel())`; wejście miasta przekazane
   z main.ts przez `opts`; wykluczenie wszystkich jednostek garnizonu z puli armii.
2. Preferencja budynków Prawa (Garnizon, Pretorium) i Szczęścia (Świątynia i inne z `buildings.json`)
   w `chooseCityProduction` przy deficycie Porządku, tylko dla normalny/trudny.
3. Testy wpięcia i mutacje (wpięcie odwrócone, bramka poziomu zniesiona, wykluczenie tylko jednej jednostki).
4. Pomiar PRZED/PO na poziomie trudnym, seed 4242 i 7, 60 tur, z licznikiem powodów. NIE_ZMIERZONO.
5. Decyzja o ewentualnej zmianie balansu utrzymania jednostek (H3): DECISION_REQUIRED, jeśli okaże się
   przyczyną.

## 6. Runda 3 -- wpiecie i pomiar (kandydat r3)

Zmiany (kod): `emptyCityGarrisonRecruitIds` i 6 konsumentow puli garnizonu w `ai.ts` uzywaja celu `max(1, need)` TYLKO gdy silnik
poda `opts.cityGarrisonNeed` (main.ts, tylko gdy poziom = normalny/trudny; wejscie = `aiCityGarrisonNeedFromOrder` z pelnego
rozbicia `evaluateOrderFromBreakdown`, bez duplikacji wzorow). Brak pola = zachowanie dotychczasowe (ai-test 297/0 bez zmian).
Preferencja budynkow: +`AI_ORDER_DEFICIT_BUILDING_BONUS` (40) do score budynkow grupy "Prawo i administracja" oraz `dajeSzczescie`
w miescie z need >= 1 (tylko normalny/trudny). Test: `gra/tools/ai-city-order-need-wiring-test.cjs` (119/0, 5 mutacji czerwonych;
tabela CULTMODEL2 z pelnego wejscia: normalny 3, trudny 4). Preferencja budynkow NIE ma osobnego testu jednostkowego (NIE ZMIERZONO testem).

Pomiar (zywa gra, bundle vite, Chromium; poziom MAKSYMALNY "Kultura i religia" = trudny; hak startGame ustawia trudnosc gry Normalny
i tempo kosztow jednostek niski; 60 tur; AI = wlasciciele != 0 razem z miastami-panstwami; runner `ai-cult-rel-measure-run.cjs`).
Surowe wyniki: `dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1/20-pomiar-r3-surowy.txt`.

| t60 | miasta | jednostki | puste miasta | bud. Prawa | bud. Szczescia |
|---|---|---|---|---|---|
| zgodnosc 4242 | 166 | 243 | 27 (16,3%) | 42 | 140 |
| PRZED trudny 4242 | 154 | 171 | 55 (35,7%) | 12 | 60 |
| PO trudny 4242 | 151 | 156 | 51 (33,8%) | 11 | 45 |
| zgodnosc 7 | 194 | 268 | 53 (27,3%) | 11 | 110 |
| PRZED trudny 7 | 146 | 164 | 44 (30,1%) | 3 | 41 |
| PO trudny 7 | 163 | 204 | 45 (27,6%) | 13 | 58 |

Wniosek: PRZED na trudnym potwierdza notatke FALI 924 (171 vs 243 jednostek, 35,7% vs 16,3% pustych). Na trudnym AI ma o 57-70%
mniej budynkow Szczescia i o ok. 30% mniej jednostek niz w zgodnosci -- spojne z oslabiona produkcja miast w pasmach
Niepokoj/Bunt (kary Porzadku), ale przyczyna NIE jest rozstrzygnieta (brak licznika powodow/buntow w hooku; NIE ZMIERZONO).
Efekt wpiecia (PO vs PRZED) jest MIESZANY: ziarno 7 poprawa (jednostki 164 -> 204, puste 30,1% -> 27,6%, bud. Prawa 3 -> 13),
ziarno 4242 bez poprawy (jednostki 171 -> 156, puste 35,7% -> 33,8%). Biegi roznia sie trajektoria (inne decyzje AI), wiec
pojedyncze ziarno nie jest dowodem. Cel "brak rozpadu AI" NIE jest osiagniety. Utrata miast i bunty: NIE ZMIERZONO
(liczba miast AI rosnie we wszystkich biegach).
