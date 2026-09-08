STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL: Stadnina poza złożem konia płatna 50 'kon' z magazynu imperium (jednorazowo per
stadnina); na złożu bez zmian; handel 'kon' realnie możliwy; UI pokazuje koszt/stan.

ZMIANY/COMMIT: BRAK ZMIAN W KODZIE `gra/`. Zero commitów. `git status --short gra/` pusty
w tej rundzie (potwierdzone ponownie).

KOREKTA WOBEC POPRZEDNIEJ WERSJI TEGO RAPORTU (patrz `03-obrona-runda1.md` dla pełnej
odpowiedzi na zarzuty Evaluatora z `02-evaluator-runda1.md`): punkt diagnozy 5 poniżej
zastępuje poprzedni, błędny punkt 5 ("`cena_kon` nie istnieje") — ten wpis w
`gra/data/econ-params.json` ISTNIEJE (linia 785) i został w tej rundzie potwierdzony
żywą próbą, że cały łańcuch handlu 'kon' już działa. Żądanie rozszerzenia allowlisty o
`gra/data/econ-params.json` z rundy 1 jest WYCOFANE.

DIAGNOZA (potwierdzona świeżym czytaniem kodu w tej rundzie, nie z pamięci):

1. `gra/src/game/livestock-unlock.ts::isLivestockUnlockedForPlacement` — dziś dla
   `stadnina`: `hexHasHorseDeposit(hex) || empireUnlocks.has('kon')`. Ten plik JEST na
   allowliście — zmiana wykonalna.

2. `computeEmpireLivestockUnlocks` (ten sam plik) NIE może zmienić znaczenia bez zmiany
   dwóch miejsc poza allowlistą: `main.ts:4619` (wejście do `computeTradeRouteResourceGrants`)
   i `main.ts:6860-6862` (`extraCityPanelConfig` — panel "dostęp do surowców" w UI miasta).

3. RZECZYWISTY PUNKT ZATWIERDZENIA BUDOWY ulepszenia terenu (w tym stadniny) to
   `commitBuildRequest()` w `gra/src/main.ts` (linia ~12921-12969) — tu odejmowana jest
   Praca (`playerPracaPool -= req.kosztPraca`) i tu wchodzi `placedImprovements.set(...)`.
   To JEDYNE miejsce, gdzie wolno dopisać odjęcie 50 'kon' z magazynu imperium (wzorem
   `deductBuildingStockCostAcrossCities` z `game/building-stock-cost.ts`, gdzie 'kon'
   już istnieje jako klucz magazynu — `EMPIRE_STOCK_RESOURCE_KEYS`, `STOCK_RESOURCE_LABEL`).
   `main.ts` NIE JEST na allowliście tego tematu.

4. Sam GATE kwalifikacji (`qualifies()` w `improvement-build.ts`, case `'stadnina'`,
   linia ~1031) potrzebuje aktualnego stanu magazynu 'kon' (>=50) w chwili sprawdzania
   — dziś `ImprovementBuildState` (ten sam plik, allowlisted) nie ma pola na tę liczbę;
   trzeba by je dodać (`horseStockAvailable?: number`) I wypełnić w `main.ts` przy
   budowie obiektu `state` (~linia 12538-12539, obok istniejącego `tradeRouteKonUnlocked`)
   — znowu `main.ts`.

5. [SKORYGOWANE] Punkt 3 zadania (handel 'kon'): ŻYWA PRÓBA w tej rundzie (skrypt poza
   repo, esbuild + prawdziwe moduły silnika, wzorowany na
   `gra/tools/diplomacy-resource-cyclic-trade-test.cjs`) potwierdza że handel 'kon' DZIAŁA
   DZIŚ, bez żadnej zmiany kodu:
   - `diplomacyHandelSurowceCatalog().kon === 5` — `cena_kon` istnieje w
     `gra/data/econ-params.json:785` i jest poprawnie odczytywana.
   - `buildHandelSurowiecCykliczny(sellerId, buyerId, [{typ:'surowiec_ilosc', id:'kon', …}], …)`
     zwraca realną pozycję `{surowiecKey:'kon', pakietyPerTura:60, sellerOwnerId, buyerOwnerId, …}`
     — silnik nie odrzuca klucza 'kon'.
   - `empireDiploResourceFlowPerTurn` na prawdziwym `ActiveDeal` z tą pozycją zwraca
     `inPerTurn`/`outPerTurn` > 0 dla obu stron.
   - `transferSurowiecIlosc('kon', …)` symulowany przez kilka tur realnie przenosi sztuki
     'kon' między magazynami miast — kupujący bez naturalnego dostępu osiąga >=50 sztuk
     wyłącznie drogą handlu.
   - `tradableGoodsForOwner` umieszcza 'kon' w indeksie dóbr handlowych UI.
   Pełny log: `03-obrona-runda1.md` zarzut 2. WNIOSEK: punkt 3 ZADANIA jest już spełniony
   bez zmian kodu — `gra/data/econ-params.json` NIE wymaga rozszerzenia allowlisty.

WNIOSEK: JEDEN plik poza allowlistą pozostaje rzeczywistą blokadą — `gra/src/main.ts`
(punkty 2 i 4 powyżej: dowóz stanu magazynu do bramki kwalifikacji + realne odjęcie 50
'kon' przy `commitBuildRequest()`, oraz spójność `computeEmpireLivestockUnlocks` z nową
semantyką w dwóch miejscach jego użycia). Zgodnie z R-PROC-AUTOBOT.md §14 ("Nie poszerzaj
allowlisty w biegu") Operator nie rozszerza zakresu samodzielnie. Zaimplementowanie
WYŁĄCZNIE tego, co allowlista dziś pozwala (sama zmiana gate'u w `livestock-unlock.ts`/
`improvement-build.ts` bez wpięcia realnego stanu magazynu i bez deduction w `main.ts`)
dałoby efekt GORSZY niż stan obecny: gate przełączony na "sprawdź magazyn", ale bez
dowozu liczby magazynu z `main.ts` domyślnie = 0 → stadnina poza złożem stałaby się
NIEBUDOWALNA dla nikogo, bez żadnej ścieżki zapłaty (bo deduction też nie działa) —
realna regresja funkcjonalna, nie postęp. Zgodnie z REGUŁĄ PRZECIW SAMOOSZUKIWANIU w
dispatchu, odmawiam zgłoszenia takiej połowicznej zmiany jako postępu.

TESTY: żywa próba handlu 'kon' opisana wyżej — 10/10 OK (log w `03-obrona-runda1.md`).
`tsc`/bramki gry nieuruchamiane — zero zmian w kodzie `gra/` do zweryfikowania. Repo w
worktree czyste (`git status` — nothing to commit poza katalogiem `dyspozycje/…` tego
tematu), `origin/main` HEAD 0a56ed01 (branch tematu 2 commity za `origin/main`, bez
konfliktu z tą pracą — same pliki dokumentacyjne/rejestrowe spoza zakresu tego tematu).

BLOKADY:
- Allowlista tego tematu nie obejmuje `gra/src/main.ts` (potrzebny do: wypełnienia
  `ImprovementBuildState.horseStockAvailable` z magazynu ownera ok. linii 12538-12539,
  oraz do realnego odjęcia 50 'kon' w `commitBuildRequest()` ok. linii 12921-12969, oraz
  do zachowania spójności `computeEmpireLivestockUnlocks`/`hasTradeRouteResourceAccess`
  ok. linii 4619 i 6860-6862 z nową semantyką bramki).
- Bez tego pliku punkty 2, 4 ZADANIA i część (a)-(c) żywego dowodu z punktu 5 ZADANIA są
  niewykonalne w tej rundzie. Punkt 3 ZADANIA (handel) NIE jest już blokadą — potwierdzony
  działającym bez zmian (patrz diagnoza pkt 5 i `03-obrona-runda1.md`).

RUNDY: 1/5
NASTĘPNY KROK: wąski DECISION_REQUIRED do orkiestratora/właściciela WYŁĄCZNIE w sprawie
rozszerzenia allowlisty o `gra/src/main.ts` (punktowo: `ImprovementBuildState` ok. linii
12538-12539, `commitBuildRequest()` ok. linii 12921-12969, odczyty
`computeEmpireLivestockUnlocks`/`hasTradeRouteResourceAccess` ok. linii 4619 i 6860-6862).
Po decyzji — runda 2 na tym samym ID i tej samej gałęzi implementuje punkty 2 i 4 ZADANIA
(koszt przy budowie + UI stanu magazynu), punkt 3 uznany za już spełniony bez zmian, i
uzupełnia żywy dowód (a)-(d) z punktu 5 ZADANIA w headless/Chromium.
DEPLOY/PUSH: NIE WYKONANO
