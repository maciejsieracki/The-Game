STATUS: OBRONA
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL: Stadnina poza złożem konia płatna 50 'kon' z magazynu imperium (jednorazowo per
stadnina); na złożu bez zmian; handel 'kon' realnie możliwy; UI pokazuje koszt/stan.

Odpowiedź na KAŻDY zarzut Evaluatora z `02-evaluator-runda1.md`, z osobna, z dowodem.

## Zarzut 1 — "econ-params.json NIE MA cena_kon" jest fałszywe

PRZYJMUJĘ. Trafny, mój błąd w rundzie 1.

DOWÓD: świeży odczyt pliku w tej rundzie —

```
$ grep -n "cena_kon" gra/data/econ-params.json
785:    "cena_kon": {
```

Linia 785: `"cena_kon": { "easy": 5, "normal": 5, "hard": 5, "jednostka": "PN/blok 10 szt.",
"opis": "Maciej 2026-07-29; R-DYPLO-CENNIK-SKALA-5X-Q1: 5 PN za blok Konia. …" }`. Wpis
istnieje, jest wypełniony na wszystkich trudnościach, z historią sięgającą 2026-07-29.
W rundzie 1 przeszukałem plik zbyt pobieżnie (szukałem prawdopodobnie błędnego klucza albo
przerwałem grep za wcześnie) — to nie jest rozbieżność interpretacyjna, tylko zwykły błąd
odczytu z mojej strony. Korekta: `gra/data/econ-params.json` NIE wymaga rozszerzenia
allowlisty — wycena 'kon' już tam jest i nie trzeba jej dopisywać.

## Zarzut 2 — zamknięcie punktu 3 ZADANIA (handel koniem) bez żywej próby, na samym
   założeniu "nie działa"

PRZYJMUJĘ. Trafny. W tej rundzie wykonałem żywą próbę (skrypt tymczasowy w scratchpadzie,
NIE w repo — wyłącznie dowód, wzorowany 1:1 na istniejącym
`gra/tools/diplomacy-resource-cyclic-trade-test.cjs`, uruchamiający prawdziwy kod silnika
przez esbuild, bez żadnej modyfikacji `gra/`):

```
$ node kon-trade-live-trial.cjs
kon-trade-live-trial
  OK: diplomacyHandelSurowceCatalog().kon = 5 (oczekiwano liczby > 0)
  OK: diplomacyHandelSurowcePakietWielkosc('kon') = 10 (oczekiwano 10, krok10 jak drewno)
  OK: buildHandelSurowiecCykliczny zwrocil 1 pozycji dla 'kon'
  OK: znaleziono pozycje handelSurowiecCykliczny z surowiecKey === 'kon':
      {"surowiecKey":"kon","pakietyPerTura":60,"sellerOwnerId":2,"buyerOwnerId":5,
       "zaplataTyp":"zloto","zaplataPerTura":30}
  OK: sellerOwnerId/buyerOwnerId poprawne: 2->5
  OK: pakietyPerTura (sztuki 'kon' na ture) = 60 (>0 wymagane)
  OK: owner 5 (kupujacy) inPerTurn['kon'] = 60 (>0 wymagane)
  OK: owner 2 (sprzedajacy) outPerTurn['kon'] = 60 (>0 wymagane)
  OK: po symulowanych turach magazyn kupujacego (owner 5) 'kon' = 60 (cel: >=50)
  OK: tradableGoodsForOwner zwraca pozycje 'kon': {"key":"kon","label":"Koń","ilosc":60}

WYNIK: 10 OK, 0 FAIL
```

Skrypt wywołuje BEZPOŚREDNIO prawdziwe funkcje silnika (nie atrapy): `buildHandelSurowiecCykliczny`
(`diplomacy-proposals.ts`) — buduje realną pozycję cyklicznego handlu z `surowiecKey: 'kon'`,
silnik jej NIE odrzuca; `empireDiploResourceFlowPerTurn` (`empire-diplo-resource-flow.ts`) —
liczy realny przepływ `inPerTurn`/`outPerTurn` dla 'kon' z prawdziwego `ActiveDeal`;
`transferSurowiecIlosc` (`diplomacy-basket-transfer.ts`) — realnie przenosi sztuki 'kon'
między magazynami miast, symulacja kolejnych tur osiąga >=50 sztuk w magazynie kupującego
BEZ NATURALNEGO DOSTĘPU do konia, wyłącznie drogą handlu cyklicznego; `tradableGoodsForOwner`
(`diplomacy-goods.ts`) — potwierdza że 'kon' trafia do indeksu dóbr handlowych UI.

Uzupełniająca analiza statyczna potwierdzająca ten sam wniosek (cytowana przez Evaluatora,
zweryfikowana przeze mnie niezależnie w tej rundzie):
- `gra/src/game/diplomacy-value-catalog.ts:257-273` — `HANDEL_SUROWCE_CENA_ROW` zawiera
  `kon: 'cena_kon'` na równi z pozostałymi 13 surowcami ilościowymi.
- `gra/src/game/diplomacy-value-catalog.ts:284-296` — `HANDEL_SUROWCE_KROK10` zawiera `'kon'`
  w tym samym zbiorze co drewno/glina/sól/żelazo — krok handlu 10 szt., bez wyjątku.
- `gra/src/game/turn-economy.ts:1531` — `credit('kon', terrYield.kon)` w tej samej pętli
  kredytującej co `sol`/`zloto` (żadnego wykluczenia 'kon' z realnego magazynu miasta).
- `gra/src/game/diplomacy-goods.ts:80-103` — `tradableGoodsForOwner` jest czysto
  data-driven po `activeResourceLabels`/`citySurowceSum`, zero listy wykluczeń surowców.
- `gra/src/main.ts:3089-3101` (`quantityTradableGoodOptions`) i `:3347` (katalog kart z
  `{ id: 'kon', label: 'Koń', … }`) — 'kon' jest już pełnoprawną pozycją UI ofert handlu
  ilościowego (`giveQuantityResourceOptions`/`receiveQuantityResourceOptions`,
  `sellerOptions` przy dealach cyklicznych, linie 15934-15935/18410/18585-18586).

WNIOSEK: punkt 3 ZADANIA (handel koniem) działa DZIŚ bez żadnej zmiany kodu — mechanizm
handlu cyklicznego jest surowiec-agnostyczny end-to-end (koszyk → przepływ per turę →
realny transfer między magazynami → indeks UI), a 'kon' ma już cenę w katalogu. Nie ma
tu nic do zaimplementowania w ramach punktu 3 poza (opcjonalnie) kosmetycznym potwierdzeniem
w Chromium, jeśli Final Control tego zażąda — silnik jest już dowiedziony żywą próbą powyżej.
Zakaz z dispatchu ("zakaz założenia że UI handlu już wspiera 'kon' bez sprawdzenia na żywo")
został w tej rundzie spełniony w kierunku przeciwnym do rundy 1: sprawdzone na żywo, wspiera.

## Skutek dla wniosku DECISION_REQUIRED z rundy 1

Korekta zakresu: żądanie rozszerzenia allowlisty o `gra/data/econ-params.json` WYCOFANE —
plik nie jest potrzebny, wycena 'kon' już istnieje. Punkt 3 ZADANIA odpada z listy blokad —
działa bez zmian.

Podtrzymuję wyłącznie wąską część bloku: `gra/src/main.ts` pozostaje poza allowlistą, a jest
to jedyne miejsce (`commitBuildRequest()` ok. linii 12921-12969, budowa `ImprovementBuildState`
ok. linii 12538-12539) gdzie można wpiąć: (a) realny stan magazynu 'kon' do bramki
`qualifies()`/`isLivestockUnlockedForPlacement` w chwili sprawdzania, (b) realne odjęcie 50
'kon' przy faktycznym potwierdzeniu budowy stadniny poza złożem. Bez tego pliku punkty 2, 4
i część (a)-(c) żywego dowodu z punktu 5 ZADANIA pozostają niewykonalne w tej rundzie —
`computeEmpireLivestockUnlocks` (ten sam plik `livestock-unlock.ts`, ale ta konkretna funkcja
jest czytana w `main.ts:4619` i `main.ts:6860-6862`, poza allowlistą) też nie może zmienić
znaczenia bez jednoczesnej zmiany tych dwóch miejsc.

RUNDY: 1/5
NASTĘPNY KROK: wąski DECISION_REQUIRED do orkiestratora/właściciela WYŁĄCZNIE w sprawie
rozszerzenia allowlisty o `gra/src/main.ts` (punktowo: `ImprovementBuildState` ok. linii
12538-12539, `commitBuildRequest()` ok. linii 12921-12969, oraz odczyty
`computeEmpireLivestockUnlocks`/`hasTradeRouteResourceAccess` ok. linii 4619 i 6860-6862 —
te ostatnie już dziś istnieją i tylko muszą pozostać spójne z nową semantyką bramki w
`livestock-unlock.ts`). Po decyzji — runda 2 implementuje punkty 2 i 4 ZADANIA (koszt/UI
magazynu), punkt 3 uznany za już spełniony bez zmian, punkt 5 żywy dowód (a)-(d) uzupełniony
w Chromium/headless w tej samej rundzie.
DEPLOY/PUSH: NIE WYKONANO
