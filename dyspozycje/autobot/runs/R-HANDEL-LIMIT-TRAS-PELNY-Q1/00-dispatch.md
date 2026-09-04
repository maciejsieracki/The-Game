TEMAT: R-HANDEL-LIMIT-TRAS-PELNY-Q1
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (logika ekonomii, nie UI wizualne)
ŚCIEŻKA: gra/src/game/trade-routes.ts (rdzeń) + gra/src/main.ts (WYŁĄCZNIE
miejsce wywołania refreshTradeRoutes i budowy jego argumentów — patrz ALLOWLISTA)
MODEL+EFFORT: claude-sonnet-5, effort HIGH (Operator, podniesiony z medium ze
względu na złożoność algorytmiczną i wydajnościową) / claude-sonnet-5, effort
high (Evaluator) — reguła bazowa R-PROC-AUTOBOT.md §5a, bez wymogu Opus 5 (nie
jest to temat wizualny/UX). Final Control Sonnet 5, effort high.

WYZWALACZ (seria wiadomości właściciela, 2026-09-04, ze zrzutem: licznik
„Handel +542", gęsta pajęczyna żółtych linii tras między dwiema cywilizacjami)
1. "Trzeba wprowadzić ograniczenie handlu, ponieważ po podpisaniu umowy, jeśli
   nie ma limitu między miastami, sumy stają się gigantyczne."
2. "Pierwsza moja propozycja [...] ograniczyć liczbę możliwych dróg handlowych,
   tak aby miasto bez budynków miało tylko jedną drogę handlową i mogło
   handlować z jednym miastem. Kolejne budynki, takie jak rynek, umożliwiałyby
   kolejne drogi handlowe. Za każdy kolejny budynek powinna być kolejna droga
   dostępna. Ograniczenie połączeń obowiązuje także dla innych cywilizacji.
   Nawet jeśli mamy wolne drogi do handlu, a druga strona w danym mieście
   wykorzysta swój zasób dróg, nie można tam ustawić połączenia. Na przykład,
   jeżeli dana cywilizacja ma 10 miast, w których nie ma żadnych budynków, ma
   10 wolnych dostępnych dróg. Jeśli nasza cywilizacja miałaby 10 miast, a
   każde miałoby dodatkowe budynki, czyli dwie drogi, łącznie 20, to i tak z
   tą cywilizacją możemy ustawić tylko 10 dróg."
3. "Oczywiście każde miasto zawsze wybiera drogę najbardziej lukratywną, czyli
   najdalszą, ale jeżeli już jest niedostępna, to potem dobiera drogi bliższe.
   Z kolei jeżeli chodzi o drogi morskie, też obowiązuje tu ilość zgodnie z
   ilością portów i budynków portowych."
4. "Te same ograniczenia muszą obejmować państwa-miasta i inne cywilizacje AI.
   [...] w sytuacji, gdy dana cywilizacja gracza, inna cywilizacja lub
   państwo-miasto nie mają żadnej umowy wymiany, mogą handlować pomiędzy
   swoimi miastami. Ale w momencie, gdy taka umowa zostanie podpisana, system
   powinien zawsze wybrać najlepszą możliwą opcję wymiany, czyli miasto
   bardziej oddalone. Z czasem wymiana pomiędzy własnymi miastami zostanie
   zastąpiona wymianą z innymi cywilizacjami, jeśli te są dalej."
ECHO właściciela (pytania ABC zadane i odpowiedziane 2026-09-04):
- Magazyn/Mennica NIE liczą się do limitu slotów (zostają jak dziś — tylko
  Targowisko/Port/Port wielki).
- Tech-gate „Wymiana" (pkt 6 poniżej w RECON) dotyczy CAŁEGO handlu łącznie z
  wewnętrznym — realizowany jako OSOBNY, SEKWENCYJNY temat
  `R-HANDEL-WYMIANA-TECH-GATE-Q1` PO integracji tego tematu (ten sam plik,
  nie dispatchuj równolegle) — NIE w zakresie tego dispatchu.

RECON (wykonane przez orkiestratora — zweryfikowane bezpośrednim odczytem kodu
2026-09-04, dwa niezależne przebiegi Explore, nie powtarzaj, buduj na tym)

(A) Formuła dochodu (`tradeRouteDistanceIncome`/`tradeRouteTotalDistanceIncome`,
`trade-routes.ts:1263-1297`) — BEZ ZMIAN w tym temacie: rośnie liniowo z
dystansem, baza 5→40 do sufitu przy 12 heksów (ląd)/20 (morze), finalnie
`max(1,round(baza/5))` — ląd 1→8¤/turę, morze (×2) 2→16¤/turę. Obie strony
trasy dostają PEŁNĄ kwotę (`computeTradeRouteIncomeByCity`, linie 1344-1361),
sumowane bez capu.

(B) Limit dystansu USUNIĘTY 2026-09-03 (commit `9b31997d`,
`R-HANDEL-SZLAKI-LIMIT-DYSTANSU-USUN-Q1`) na wyraźną prośbę właściciela — mapy
"superogromne" blokowały handel między realnie połączonymi (BFS) stolicami,
tylko dlatego że leżały daleko w linii prostej. NIE COFAĆ tej zmiany —
`ladMaxDist`/`morzeMaxDist` (12/20) ŻYJĄ DALEJ wyłącznie jako referencyjny
dystans SZCZYTU krzywej dochodu (część A), rozdzielone celowo od connectivity
(`computeCityConnection`, linie 652-726, sufit BFS skalowany do wymiarów mapy).

(C) Limit liczby tras na miasto — NIE ISTNIEJE dziś (usunięty T3,
`R-HANDEL-SZLAKI-PRZEBUDOWA-Q1`). `tradeRouteLimitForCity(cityId,
builtByCity)` (linie 823-837) liczy WYŁĄCZNIE budynki z `TRADE_BUILDING_IDS =
{'targowisko','port','port_wielki'}` — dziś gatinguje TYLKO pole
`TradeRoute.budynekOdblokowany` (+5% bonus w `economy.ts`, konsumowane w T4),
NIE decyduje o istnieniu trasy. To jest DOKŁADNIE mechanizm z GOAL 2 poniżej —
trzeba go PRZEROBIĆ, żeby gatingował istnienie, nie tylko bonus.

(D) Architektura traktatów JUŻ generyczna per-dowolna-para ownerId
(`activeDeals: ActiveDeal[]`, każdy z polem `strony:[number,number]`,
`diplomacy-treaties.ts`, `pairKey`/`dealsForPair`/`hasSzlakowTreaty` linie
177-236) — działa poprawnie dla DOWOLNEJ pary, w tym AI-AI. UWAGA NAZEWNICZA
KRYTYCZNA: traktat gatingujący istnienie tras to konkretnie
`RodzajTraktatu.UmowaSzlakow` (`types/diplomacy.ts:24-26`), NIE
`UmowaHandlowa` (nazwa legacy, hydratuje się do `UmowaSzlakow`/`UmowaWymiany`)
ani `UmowaWymiany` (koszyk PN, inny traktat) — dispatch/dokumentacja/komentarze
kodu w `trade-routes.ts` używają dziś mylącej nazwy legacy „Umowa Handlowa" w
prozie, ale realnie sprawdzany enum to `UmowaSzlakow`. Zachowaj tę
DOKŁADNOŚĆ przy generalizacji — `hasTradeTreatyFn` już wstrzykiwane z
`main.ts:13670` jako `(a,b) => hasSzlakowTreaty(activeDeals,a,b)`, poprawnie
generyczne, gotowe do użycia dla dowolnej pary bez zmian.

(E) AI JUŻ DZIŚ samodzielnie zawiera Umowy Handlowe (`UmowaSzlakow` +
opcjonalnie `UmowaWymiany`) z innym AI, w pełni produkcyjnie —
`formAiAiTradeAgreementsIfEligible()` (`main.ts:17460+`), throttling
per-para + globalny, obejmuje AI-AI i AI-państwo-miasto. Infrastruktura
traktatów jest więc GOTOWA — jedyny brakujący element to fakt, że
`refreshTradeRoutes` dziś IGNORUJE te już istniejące traktaty AI-AI/AI-CS
przez sztywny filtr `playerCities`/`foreignCities` (`ownerId===0` vs `!==0`,
linie 1097-1099, 1138, 1165-1166) — generalizacja NIE wymaga budowy dyplomacji
AI-AI od zera, tylko odblokowania candidate-generation dla wszystkich par
właścicieli obecnych w przekazanym `cities`.

(F) Handel wewnątrz-cywilizacyjny (miasto A↔B tego samego ownera) NIE ISTNIEJE
dziś pod żadną nazwą (grep „handel wewnetrzny/krajowy/domestic/internal
trade" w `gra/src/game/` — zero trafień) — nowy byt, zero ryzyka duplikacji.
Kod dziś STRUKTURALNIE wyklucza takie trasy (`from.ownerId !== 0 ||
to.ownerId === 0` na linii 1138 to filtr „musi być gracz->obcy", eliminuje
zarówno ten sam owner jak i AI-AI).

(G) Skala/wydajność: mapa superogromna 672×476 (`map-gen-params.json:87-97`),
do ~20 podmiotów jednocześnie (gracz + 10 AI-rywali + 9 państw-miast,
`e-start-params.json:71-80`), realistycznie ~100-150 miast. Rozszerzenie z
O(N_gracz×N_obcy) na "każda para właścicieli × każda para miast" to rząd
O(10⁴) par miast/turę, każda potencjalnie wołająca `findCityConnection`
(pathfinding) — BRAK istniejących testów/bramek wydajnościowych dla
`refreshTradeRoutes`/`tradeRoutes` (sprawdzone: zero plików
`gra/tools/*trade*perf*`/`*handel*perf*`). Zachowaj/rozszerz istniejący
mechanizm cache'owania granic lądowych per-para-właścicieli
(`landBorderCache`, liczone RAZ na wywołanie `refreshTradeRoutes` — linia
1105) — NIE regresuj tej optymalizacji przy przechodzeniu z 1 pary
gracz-obcy na N par dowolnych właścicieli.

GOAL

1. Nowa funkcja `tradeRouteExistenceLimitForCity(cityId, builtByCity): number`
   w `trade-routes.ts`, obok istniejącej `tradeRouteLimitForCity` (ZERO zmian
   w tej ostatniej — zostaje buildings-only, dalej gatinguje WYŁĄCZNIE
   `budynekOdblokowany`): zwraca `1 + tradeRouteLimitForCity(cityId,
   builtByCity)` — baza 1 slot nawet bez żadnego budynku handlowego, +1 za
   KAŻDY zbudowany budynek z `TRADE_BUILDING_IDS` (bez zmian w tym zbiorze —
   Magazyn/Mennica WYKLUCZONE, ECHO właściciela).

2. W `refreshTradeRoutes` — DRUGI, NIEZALEŻNY tor slotów (obok istniejącego
   `usedSlots`/`hasRoom`/`useSlot`/`grantBuilding` dla bonusu +5%, który
   zostaje BEZ ZMIAN w swojej semantyce — buildings-only, zero baseline):
   nowy `usedExistenceSlots`/`hasExistenceRoom`/`useExistenceSlot`, pojemność
   z `tradeRouteExistenceLimitForCity`. Trasa (Pass 1 — kontynuacja istniejącej
   z poprzedniej tury; Pass 2 — nowa kandydatura) jest TWORZONA/ZACHOWANA
   TYLKO gdy OBIE strony (`from` i `to`) mają wolny existence-slot w momencie
   przetwarzania — jeśli nie, trasa jest POMIJANA CAŁKOWICIE (nie trafia do
   wyniku `kept[]`), nie tylko traci `budynekOdblokowany`. Konsumuj
   existence-slot obu miast gdy trasa faktycznie zostaje utworzona/zachowana.
   Bonus `budynekOdblokowany` (istniejący, osobny tor) działa PO tym gatingu,
   na przetrwałej (existence-gated) liście — bez zmian algorytmu, tylko mniej
   kandydatów na wejściu.

3. ZMIANA PRIORYTETU kandydatów (dotyczy OBU torów — existence i bonus —
   ujednolić na tę samą kolejność): dziś nowe kandydatury sortowane są
   `(a,b) => a.distance - b.distance || a.id.localeCompare(b.id)` (rosnąco —
   najbliższe pierwsze, linia 1176). Zmień na MALEJĄCO wg dochodu/dystansu —
   najpierw najbardziej lukratywna (najdalsza, do sufitu krzywej z części A),
   dopiero gdy niedostępna (slot zajęty po drugiej stronie) — kolejne, bliższe
   kandydatury. Użyj `tradeRouteTotalDistanceIncome`/dochodu jako klucza
   sortowania (nie surowego dystansu) — dla lądu i morza dochód rośnie
   monotonicznie z dystansem do sufitu, więc malejący dochód ⇔ malejący
   dystans do sufitu, ale użyj dochodu wprost, żeby uwzględnić bonus morski
   ×2 w porównaniach między kandydatami lądowymi i morskimi (dalszy szlak
   lądowy może dawać mniej niż bliższy morski). Zachowaj istniejącą regułę
   stabilności: kandydatury KONTYNUUJĄCE trasę z poprzedniej tury (Pass 1)
   nadal przetwarzane PRZED nowymi (Pass 2) — ale w razie potrzeby
   przemyśl, czy sama kolejność Pass1-then-Pass2 (bez zmian) nadal daje
   pożądany efekt „stopniowego wypierania" z GOAL 5 (patrz kryterium 5) —
   jeśli test na żywo pokaże, że trzeba osadzić Pass 1 i Pass 2 we WSPÓLNYM
   sortowaniu (nie dwóch odrębnych przebiegach) żeby nowa, znacznie bardziej
   lukratywna trasa mogła wyprzeć istniejącą słabszą PRZED wyczerpaniem jej
   slotu — zrób to, dokumentując decyzję i dowód w raporcie.

4. UOGÓLNIENIE na wszystkie pary właścicieli (nie tylko gracz↔obcy): zmień
   candidate-generation w `refreshTradeRoutes` z `playerCities`/
   `foreignCities` (linie 1097-1099, filtr `ownerId===0` vs `!==0`, linie
   1138, 1165-1166) na iterację po WSZYSTKICH parach RÓŻNYCH właścicieli
   obecnych w przekazanym `cities` (grupuj miasta po `ownerId`, iteruj
   unikalne pary właścicieli, dla każdej pary zastosuj te same filtry
   `isAtWar`/`hasTradeTreatyFn` co dziś — WAŻNE: sprawdź poprawną nazwę enuma
   z części D, `UmowaSzlakow`, nie „UmowaHandlowa" w żadnym nowym kodzie/
   komentarzu). Zachowaj/rozszerz `landBorderCache` (część G) na wszystkie
   pary właścicieli, nie tylko gracz-obcy — cache musi być per-para-
   właścicieli (jak dziś), liczony raz na wywołanie.

5. NOWY mechanizm — handel WEWNĄTRZ jednej cywilizacji: dla KAŻDEGO właściciela
   (gracz, każde AI, każde państwo-miasto) generuj DODATKOWO kandydatury tras
   między parami miast TEGO SAMEGO ownera — bez wymogu traktatu (nie można
   mieć traktatu z samym sobą) i bez wymogu wspólnej granicy lądowej
   (irrelewantne dla tego samego właściciela — miasta jednej cywilizacji nie
   potrzebują "granicy" ze sobą), ALE z wymogiem fizycznej łączności BFS
   (`computeCityConnection`/`findCityConnection`, bez zmian w tej funkcji —
   użyj jej wprost, pomijając TYLKO sprawdzenie granicy) i bez zmian wymogu
   fizycznego Portu dla medium morskiego. Te kandydatury WCHODZĄ DO TEGO
   SAMEGO wspólnego poola co kandydatury zewnętrzne z GOAL 4, konkurując o te
   same existence-sloty na RÓWNYCH zasadach wg priorytetu z GOAL 3 (dochód
   malejąco) — efekt naturalny: gdy pojawi się bardziej dochodowa trasa
   zewnętrzna (po zawarciu Umowy Szlaków), wyprze słabszą trasę wewnętrzną z
   zajętego slotu, bez potrzeby osobnego warunku "czy istnieje traktat
   zewnętrzny" — to WYNIKA z jednolitego sortowania po dochodzie, nie wymaga
   dodatkowej logiki warunkowej. Zweryfikuj to żywo (kryterium 5 niżej).

6. Wydajność: napisz nowy test/benchmark (`gra/tools/*-test.cjs`) mierzący
   czas wykonania `refreshTradeRoutes` dla scenariusza zbliżonego do
   superogromnej mapy (rząd 100-150 miast, kilkanaście właścicieli) — zmierz
   NA ŻYWO aktualny czas wykonania (nie zgaduj limitu z góry) i udokumentuj
   wynik w raporcie jako punkt odniesienia; jeśli okaże się rzędu sekund (nie
   dziesiątek/setek ms), zaproponuj i zaimplementuj optymalizację (np.
   ograniczenie pełnego BFS tylko do par bez wcześniej ustalonego wyniku w
   cache'u tej tury) — ale NIE kosztem poprawności wyniku.

7. Zaktualizuj docstring `refreshTradeRoutes` (linie 1005-1050) i inne
   komentarze w pliku, które dziś opisują NIEAKTUALNE już decyzje ("TYLKO
   ZEWNĘTRZNY: Własne<->własne NIGDY", "T3: sloty budynkowe NIE decydują już
   o istnieniu trasy") — zastąp je opisem NOWEGO stanu, cytując ten temat
   (`R-HANDEL-LIMIT-TRAS-PELNY-Q1`) jako źródło ECHO odwracającego poprzednie
   decyzje. Nie usuwaj historycznego kontekstu (czemu T3 zrobił to co zrobił)
   — dopisz, że został on świadomie odwrócony, z cytatem uzasadnienia
   właściciela.

KRYTERIA KOŃCA (binarne)
1. Miasto z 0 budynków handlowych ma DOKŁADNIE 1 slot istnienia trasy — żywy
   test: miasto połączone z 2+ równoważnymi kandydatami (zewnętrznymi lub
   wewnętrznymi) ma DOKŁADNIE 1 aktywną trasę po `refreshTradeRoutes`.
2. Miasto z N budynków handlowych (Targowisko/Port/Port wielki, dowolna
   kombinacja) ma DOKŁADNIE 1+N slotów — test dla N=1 i N=2.
3. Przykład arytmetyczny właściciela ODTWORZONY DOSŁOWNIE: cywilizacja A = 10
   miast × 0 budynków (10 slotów łącznie); cywilizacja B (gracz) = 10 miast ×
   1 budynek każde (20 slotów łącznie) — całkowita liczba tras między A i B
   po `refreshTradeRoutes` = DOKŁADNIE 10 (ograniczone słabszą stroną), nie
   20, nie więcej.
4. Miasto obcej cywilizacji, które wyczerpało swoje sloty gdzie indziej, NIE
   przyjmuje kolejnej trasy — żywy test: 1 miasto obce (0 budynków, 1 slot)
   już połączone z partnerem-1; nasze miasto próbuje połączyć się z TYM SAMYM
   miastem obcym — połączenie NIE POWSTAJE mimo wolnego slotu po naszej
   stronie.
5. Priorytet "najbardziej lukratywna wygrywa": żywy test z 3 kandydatami
   różnej odległości/dochodu dla jednego miasta z 1 slotem — trasa
   ISTNIEJĄCA to ta o NAJWYŻSZYM dochodzie spośród dostępnych (nie
   najbliższa). Osobny test na "stopniowe wypieranie": miasto z handlem
   WEWNĘTRZNYM (brak jeszcze traktatu zewnętrznego) ma aktywną trasę
   wewnętrzną; po zawarciu Umowy Szlaków z cywilizacją oferującą BARDZIEJ
   dochodowego partnera zewnętrznego — trasa wewnętrzna znika, zastąpiona
   zewnętrzną, BEZ specjalnej logiki warunkowej "czy jest traktat" (czysty
   efekt sortowania po dochodzie).
6. Uogólnienie na dowolne pary: żywy test z 3 właścicielami (gracz + 2 AI, LUB
   2 AI bez gracza) z aktywną Umową Szlaków (`UmowaSzlakow`, nie
   „UmowaHandlowa") między KAŻDĄ parą — trasy powstają MIĘDZY KAŻDĄ parą
   spełniającą warunki, w tym AI↔AI BEZ udziału gracza.
7. Handel wewnętrzny: żywy test — cywilizacja BEZ żadnego traktatu z nikim ma
   aktywne trasy MIĘDZY WŁASNYMI miastami (o ile fizycznie połączone), z
   dochodem i slotami liczonymi identycznie jak trasy zewnętrzne.
8. Zero regresji: istniejący mechanizm bonusu `budynekOdblokowany` (+5%) nadal
   działa identycznie w swojej WŁASNEJ semantyce (buildings-only, bez
   baseline) na przetrwałej (existence-gated) liście tras — miasto z 0
   budynków NIGDY nie dostaje bonusu, nawet jeśli ma swój 1 baseline-owy
   slot zajęty.
9. Wydajność zmierzona żywo na scenariuszu ~100-150 miast/kilkanaście
   właścicieli, udokumentowana liczbowo w raporcie (patrz GOAL 6) — brak
   arbitralnego wymogu liczbowego z góry, ale wynik musi być rzeczywiście
   zmierzony, nie oszacowany z kodu.
10. `tsc --noEmit` czysty, WSZYSTKIE istniejące testy dotykające handlu (grep
    `gra/tools/*handel*-test.cjs`, `gra/tools/*trade*-test.cjs`) nadal
    zielone lub świadomie zaktualizowane (z uzasadnieniem — stare testy
    zakładające "brak limitu"/"tylko gracz-obcy" mogą wymagać aktualizacji
    pod NOWĄ, jawnie zamierzoną semantykę — udokumentuj każdą taką zmianę w
    raporcie z uzasadnieniem, analogicznie do poprzednich tematów w tym
    repo), 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/trade-routes.ts (nowa funkcja `tradeRouteExistenceLimitForCity`;
  przebudowa wnętrza `refreshTradeRoutes` zgodnie z GOAL 2-5; aktualizacja
  sortowania kandydatów; aktualizacja docstringów zgodnie z GOAL 7; ZERO zmian
  w `tradeRouteDistanceIncome`/`tradeRouteTotalDistanceIncome`/
  `computeTradeRouteIncomeByCity`/`TRADE_BUILDING_IDS`/`tradeRouteLimitForCity`
  poza tym co jawnie wymienione).
- gra/src/main.ts (WYŁĄCZNIE miejsce wywołania `refreshTradeRoutes` — dziś
  przekazuje `playerCities`/tylko traktaty gracza; jeśli wymaga to
  przekazania WSZYSTKICH miast wszystkich właścicieli zamiast tylko
  gracz+obcy, zmień WYŁĄCZNIE budowę argumentów tego jednego wywołania, zero
  zmian w `formAiAiTradeAgreementsIfEligible`/logice AI/dyplomacji poza tym).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana `diplomacy-treaties.ts`/`diplomacy-proposals.ts`
(infrastruktura traktatów już gotowa, nie dotykaj), zmiana
`formAiAiTradeAgreementsIfEligible` poza ewentualnym przekazaniem dodatkowych
danych do `refreshTradeRoutes` jeśli okaże się to konieczne (uzasadnij w
raporcie, jeśli dotykasz), zmiana formuły dochodu/progów dystansu (części A/B
RECON — NIE cofać usunięcia limitu 12/20), zmiana `TRADE_BUILDING_IDS`
(Magazyn/Mennica zostają wykluczone, ECHO właściciela), tech-gate „Wymiana"
(osobny, sekwencyjny temat `R-HANDEL-WYMIANA-TECH-GATE-Q1`, NIE w tym
dispatchu), dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json,
playbook.json.

IZOLACJA
worktree /home/user/wt-handel-limit-tras-pelny, gałąź
autobot/R-HANDEL-LIMIT-TRAS-PELNY-Q1, baza jawnie: origin/main (najnowszy
commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryteriów 1-8 za spełnione przez samo przeczytanie kodu bez
żywego, deterministycznego testu z REALNYMI danymi gry (fikstury miast/
traktatów/budynków), pokazującego dokładne liczby (nie przybliżenia) zgodne z
KRYTERIAMI. Zakaz uznania kryterium 3 (przykład arytmetyczny właściciela) za
spełnione bez odtworzenia GO DOSŁOWNIE (10 miast × 0 budynków vs 10 miast × 1
budynek, wynik = dokładnie 10, nie "coś mniejszego niż 20"). Zakaz uznania
kryterium 9 (wydajność) za spełnione przez oszacowanie złożoności
algorytmicznej z kodu — zmierz `performance.now()`/analogiczny stoper na
REALNYM przebiegu z fiksturami rzędu 100-150 miast. Zakaz mylenia
`RodzajTraktatu.UmowaSzlakow` z `UmowaHandlowa`/`UmowaWymiany` w nowym
kodzie/testach — to trzy RÓŻNE wartości enuma (część D RECON), pomyłka
unieważnia cały mechanizm gatingu.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM
SAMYM ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach:
LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują i nie pushują.

OBIEG
Operator (Sonnet 5, effort HIGH) → Evaluator (Sonnet 5, effort high) →
Operator (obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort
high) → integracja orkiestratora.

---

# RUNDA 2 — ROZSZERZENIE ALLOWLISTY (ratyfikacja orkiestratora, 2026-09-04)

## Powód

Runda 1: Operator PASS, Evaluator zgłosił 4 zarzuty (1-3 KRYTYCZNE, 4 MAJOR),
Obrona PRZYJĘŁA wszystkie 4 jako trafne, przygotowała zweryfikowane łatki, ale je
**wycofała** i zgłosiła BLOCK — poprawnie, bo leżą poza allowlistą rundy 1
(`main.ts` był zawężony WYŁĄCZNIE do miejsca wywołania `refreshTradeRoutes`,
linia ~13682). Obrona nie poszerzyła allowlisty jednostronnie (R-PROC-AUTOBOT.md
§14) i eskalowała decyzję do orkiestratora. To jest zachowanie wzorcowe.

**Orkiestrator ratyfikuje rozszerzenie allowlisty.** Uzasadnienie: bez tych czterech
poprawek zmiana z rundy 1 NIE realizuje GOAL, tylko go odwraca — globalna tablica
`tradeRoutes` po generalizacji (GOAL 4-5) zawiera trasy AI↔AI i wewnętrzne
WSZYSTKICH właścicieli, a konsumenty w `main.ts` sumują/rysują ją bez filtra
właściciela. Gracz zobaczyłby dochód i sieć handlową całego świata — dokładnie
objaw z wyzwalacza tematu („Handel +542", gęsta pajęczyna), tylko spotęgowany o
~15 cywilizacji AI. Integracja rundy 1 bez tych poprawek byłaby regresją.

## GOAL RUNDY 2 (wyłącznie zarzuty 1-4, nic więcej)

R2-1. `main.ts:16523-16539` (chip HUD „Handel", `handelIncome`/`handelRouteCount`):
   filtruj `tradeRoutes` do tras, w których stroną jest gracz (`ownerId === 0 ||
   toOwnerId === 0`), z poprawną obsługą trasy WEWNĘTRZNEJ gracza (obie strony to
   gracz — nie licz jej podwójnie). Zaktualizuj nieaktualny komentarz-inwariant
   (16524-16525, „tradeRoutes zawiera WYŁĄCZNIE pary gracz<->obcy") na opis stanu
   po generalizacji, z odwołaniem do tego tematu.

R2-2. `main.ts:14664-14726` (`buildEmpireTradeSnap`, panel imperium „Handel"):
   ten sam filtr właściciela; trasa wewnętrzna gracza ma dać sensowny wiersz
   (Obrona zaproponowała 2 wiersze z osobnymi id — zdecyduj i uzasadnij).
   Zaktualizuj komentarz 14666-14668.

R2-3. `main.ts:11004-11020` (`refreshTradeRoutesOverlay`): rysuj wyłącznie trasy,
   w których stroną jest gracz — nakładka mapy nie pokazuje sieci handlowej obcych
   cywilizacji ani ich handlu wewnętrznego.

R2-4. `main.ts:13717-13791` (`reportTradeRouteEvents`, wołane z
   `recomputeTradeRoutesNow`): `diffTradeRoutes`/toasty/wpisy do dziennika
   WYDARZENIA wyłącznie dla tras gracza. Zaktualizuj nieaktualne komentarze-
   inwarianty `13415-13420` i `13649-13656` („route.fromCityId jest zawsze miastem
   gracza"/„AI<->AI tu nie istnieje"). Zwróć szczególną uwagę na „wysyp" toastów
   przy pierwszym uruchomieniu po zmianie (handel wewnętrzny powstaje naraz dla
   każdej cywilizacji) — po filtrze zostaną tylko trasy gracza, ale zweryfikuj to
   żywo, nie deklaratywnie.

## ALLOWLISTA RUNDY 2 (rozszerzona względem rundy 1 — nic poza tym)

- gra/src/game/trade-routes.ts (jak w rundzie 1; zmiany z rundy 1 zostają).
- gra/src/main.ts — DODATKOWO do miejsca wywołania `refreshTradeRoutes`:
  WYŁĄCZNIE cztery funkcje wskazane w R2-1..R2-4 (chip HUD `handelIncome`,
  `buildEmpireTradeSnap`, `refreshTradeRoutesOverlay`, `reportTradeRouteEvents`)
  wraz z ich komentarzami-inwariantami. Zero zmian w innych funkcjach `main.ts`.
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bez zmian: `diplomacy-*.ts`, `formAiAiTradeAgreementsIfEligible`, formuła
dochodu/progi dystansu, `TRADE_BUILDING_IDS`, tech-gate „Wymiana", WERSJE.md,
ROBOCZA-MANIFEST.json, playbook.json.

## KRYTERIA KOŃCA RUNDY 2 (dodatkowo do 1-10 z rundy 1, które zostają w mocy)

R2-K1. Żywy test: przy co najmniej 2 cywilizacjach AI mających własne trasy
   (AI↔AI oraz wewnętrzne) chip HUD „Handel" gracza pokazuje DOKŁADNIE sumę
   dochodu gracza z jego własnych tras — zweryfikowane liczbowo względem
   niezależnie policzonej wartości, nie „wygląda sensownie".
R2-K2. Panel imperium „Handel" nie zawiera ANI JEDNEGO wiersza trasy, w której
   gracz nie jest stroną.
R2-K3. Nakładka mapy rysuje wyłącznie trasy gracza — policz linie w żywym
   renderze i porównaj z liczbą tras gracza.
R2-K4. Toasty/dziennik: po pierwszym przeliczeniu tras w świecie z AI mającym
   nowy handel wewnętrzny gracz NIE dostaje ani jednego komunikatu o cudzej
   trasie (zweryfikuj licznikiem wywołań `showHintMessage`, nie na oko).
R2-K5. Trasa WEWNĘTRZNA gracza (miasto↔miasto gracza) jest liczona w chipie
   dokładnie RAZ, nie dwa razy.
R2-K6. `tsc --noEmit` czysty, wszystkie bramki handlu i 5 bramek referencyjnych
   zielone (jak w rundzie 1).

## OBIEG RUNDY 2
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator
(obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort high) →
integracja orkiestratora.
