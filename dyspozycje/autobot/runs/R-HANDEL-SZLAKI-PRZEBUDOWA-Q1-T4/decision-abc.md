# decision-abc.md — R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4

Konflikt kontraktu: allowlista dispatchu vs. rzeczywisty zakres plików wymagany,
żeby kryterium sukcesu 1 dispatchu faktycznie działało w rozgrywce (nie tylko
w izolowanych testach jednostkowych economy.ts/trade-routes.ts).

## Opis konfliktu (bez proponowanego rozwiązania jako rozstrzygnięcia — patrz sekcja Propozycja)

Allowlista T4 obejmuje wyłącznie: `gra/src/game/trade-routes.ts`,
`gra/src/game/economy.ts`, cztery pliki testów. Recon (przed jakimkolwiek
kodem) pokazał, że stary mechanizm `ctx.liczbaAktywnychTrasHandlowych`
(`economy.ts:954-957`) jest zasilany LICZBĄ tras (`Map<string, number>`)
budowaną przez `computeTradeRouteCountByCity` i przekazywaną przez TRZY
warstwy poza allowlistą:

1. `gra/src/game/turn-economy.ts` — dwie funkcje przyjmujące
   `tradeRouteCountByCity: ReadonlyMap<string, number>` jako parametr
   (linie ~1852, ~2270) i budujące z niej `ctx.liczbaAktywnychTrasHandlowych`
   (linie ~2000/2036, ~2562/2598) przekazywane do `cityYieldPerTurn`.
2. `gra/src/main.ts` — buduje tę mapę (`computeTradeRouteCountByCity(tradeRoutes)`,
   8 miejsc: deklaracja + odświeżenie po każdej rundzie tras + `.clear()` przy
   resecie tury + wywołanie `advanceCityEconomy(...)`) i osobno karmi nią
   `getCityBuildingFlags()` (2 miejsca) konsumowane przez panel miasta.
3. `gra/src/ui/cityPanel.ts` — linia 10364-10365/10504-10521: osobna,
   ZDUPLIKOWANA kopia starej formuły (`aktywneTrasyCount * 5%`, stała
   `TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE`, jawny komentarz „musi zgadzać się
   z hardcoded 0.05 w game/economy.ts") do wyświetlenia jednej linii „premia za
   trasy handlowe: +X%" w rozbiciu Podatku. Ten tekst NIE czyta wyniku
   silnika — powiela jego założenie. Zmiana silnika na sumę per-trasowych
   bonusów bez zmiany tej linii UI zostawi w grze WIDOCZNY dla gracza, BŁĘDNY
   napis (dokładnie wg starej, uchylanej reguły), niezależnie od poprawności
   samego silnika.

Nowy mechanizm z ECHO Q3 (suma per-trasowych kwot 5% × własny dochód
dystansowy, liczona TYLKO dla tras z `budynekOdblokowany=true`) wymaga danych
NA POZIOMIE TRASY (dystans, medium, flaga budynku) — nie da się go wyrazić
jako sama liczba tras. Nie istnieje więc sposób poprawnie zasilić
`economy.ts` tą sumą bez zmiany kształtu danych przekazywanych przez
`turn-economy.ts`/`main.ts`, ani utrzymać poprawności widocznego dla gracza
tekstu bez zmiany `cityPanel.ts`. Bez tych trzech plików: albo (a) nowy
mechanizm zostaje martwym kodem (pole ctx nigdy niepopulowane z rozgrywki —
kryterium 1 dispatchu niespełnione w praktyce, tylko w testach jednostkowych
wołających `cityYieldPerTurn` bezpośrednio z ręcznym ctx), albo (b) usunięcie
starego mnożnika bez zastąpienia go działającym nowym zostawia miasta BEZ
JAKIEGOKOLWIEK bonusu za trasy do czasu kolejnej rundy (inna, ale wciąż realna,
niezgodność z decyzją właściciela).

## Charakter konfliktu

Czysto inżynierski — mechaniczne podłączenie już zdecydowanej (ECHO Q3)
formuły do istniejących punktów wpięcia, dokładnie tym samym wzorcem, jakim
`tradeRouteCountByCity`/`computeTradeRouteCountByCity` jest już wpięty dziś
(1:1 podmiana kształtu mapy w tych samych ~8 miejscach). Nie zmienia formuły,
liczb ani decyzji balansowej — wyłącznie listę plików. Bez wpływu na
gameplay/UX POZA koniecznością (b) wyżej, jeśli zostanie zignorowany.

## Propozycja (lekka ścieżka, nie turniej C-018 — brak wpływu na gameplay/balans)

Rozszerzyć allowlistę T4 o:
- `gra/src/game/turn-economy.ts` (zamiana kształtu parametru z liczby tras na
  mapę per-trasowych sum bonusu, ten sam mechanizm podłączenia co dziś),
- `gra/src/main.ts` — WYŁĄCZNIE 8 istniejących miejsc budowy/czyszczenia/
  przekazania `tradeRouteCountByCity` (nie `buildEmpireTradeSnap()`, który
  zostaje poza zakresem zgodnie z dispatchem — T6),
- `gra/src/ui/cityPanel.ts` — WYŁĄCZNIE funkcja `activeTradeRouteCountForCity`/
  linia z `TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE` (jedna linia tekstu „premia
  za trasy handlowe", nie żaden inny fragment panelu miasta).

Nie proponuję wariantów B/C — nie widzę alternatywy, która spełnia kryterium 1
dispatchu (realne działanie w rozgrywce) bez dotknięcia tych plików.
