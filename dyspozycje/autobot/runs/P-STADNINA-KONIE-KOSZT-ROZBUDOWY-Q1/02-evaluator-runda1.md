STATUS: BLOCK
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL: Stadnina poza złożem konia płatna 50 'kon' z magazynu imperium (jednorazowo per
stadnina); na złożu bez zmian; handel 'kon' realnie możliwy; UI pokazuje koszt/stan.

WERYFIKACJA WSTĘPNA (niezależna od raportu Operatora):
- `git status`/`git diff origin/main -- . ':!dyspozycje/autobot/runs/.../*'` w worktree
  potwierdzają ZERO zmian w `gra/` — Operator faktycznie nic nie zaimplementował, zgodnie
  z własną deklaracją BLOCK. Repo czyste poza plikami runu tego tematu.

ZARZUTY:

1. [Miejsce: `01-operator-runda1.md`, DIAGNOZA pkt 5, oraz `gra/data/econ-params.json`]
   Naruszenie: Operator twierdzi wprost — "`gra/data/econ-params.json::handel_surowce` …
   NIE MA wpisu `cena_kon` (sprawdzone wszystkie klucze `cena_*` w pliku)". To twierdzenie
   jest FAŁSZYWE. Zweryfikowane niezależnie: wpis `"cena_kon"` ISTNIEJE w
   `gra/data/econ-params.json` (linia 785: `{"easy":5,"normal":5,"hard":5,"jednostka":"PN/blok
   10 szt.","opis":"Maciej 2026-07-29; …"}`) — potwierdzone zarówno bezpośrednim odczytem
   pliku, jak i `node -e "Object.keys(require('./econ-params.json').handel_surowce)
   .filter(k=>k.startsWith('cena_'))"`, które zwraca `cena_kon` wśród 15 innych kluczy.
   Wpis istnieje w historii repo od co najmniej 2026-07-29 (`git log -p` na tym pliku).
   Dlaczego ma znaczenie: to fałszywe ustalenie jest jedną z DWÓCH przesłanek, na których
   Operator opiera wniosek DECISION_REQUIRED żądający rozszerzenia allowlisty o
   `gra/data/econ-params.json` dla punktu 3 ZADANIA (handel koniem — "bez tego wpisu
   'kon' nigdy nie trafi na listę towarów wycenionych"). Żądanie w tej części nie ma
   pokrycia w rzeczywistym stanie pliku i może skłonić orkiestratora/właściciela do
   niepotrzebnego poszerzenia zakresu allowlisty w kolejnej rundzie.

2. [Miejsce: łańcuch plików — `gra/data/terrain-improvements.json:107-109`,
   `gra/src/game/turn-economy.ts:1508-1531` i `:1769-1799`,
   `gra/src/game/diplomacy-goods.ts:80-103`, `gra/src/game/diplomacy-value-catalog.ts:257-309,
   424-429`, `gra/src/game/empire-diplo-resource-flow.ts:18-37`]
   Naruszenie: Operator zamyka punkt 3 ZADANIA (handel koniem) jako zablokowany przez brak
   pliku na allowliście, BEZ jakiejkolwiek żywej próby — mimo że dispatch wprost zakazuje
   takiego założenia w którymkolwiek kierunku ("Zakaz założenia, że UI handlu już wspiera
   'kon' bez sprawdzenia na żywo"). Niezależna analiza statyczna, po całym łańcuchu
   (nie pojedynczym pliku), silnie wskazuje że handel koniem może już DZIAŁAĆ bez żadnej
   zmiany kodu:
     - `stadnina` w `terrain-improvements.json` ma `"surowiec_ilosc_tura": 25` — realna
       produkcja ILOŚCIOWA 25 'kon'/turę do magazynu państwa (SUROW-TERYT-01), NIE sam
       boolean odblokowania.
     - `turn-economy.ts` kredytuje ten yield (`credit('kon', terrYield.kon)` /
       `creditTerritory('kon', terrYield.kon)`) i realnie zapisuje go z powrotem do
       `City.surowce` przez `assignOwnerResourceStockFromPool(cities, ownerId, pool)`.
     - `diplomacy-goods.ts::tradableGoodsForOwner` jest czysto data-driven na
       `citySurowceSum[key]` — ZERO specjalnego wykluczenia dla 'kon'. Nagłówkowy komentarz
       tego pliku (linia ~45: "koń … bez sztuk", grupujący 'kon' z zasobami czysto boolean)
       jest NIEAKTUALNY względem kodu — to samo grupowanie obejmuje 'sol', które jednak
       jest jawnie kredytowane ilościowo (SPICHLERZ_DRAIN_SOL_PER_TURN) — komentarz nie
       nadążył za SUROW-TERYT-01.
     - `diplomacy-value-catalog.ts` (`HANDEL_SUROWCE_CENA_ROW`, `diplomacyHandelSurowceCatalog`)
       już zawiera klucz `'kon'` i poprawnie rozwiązuje jego cenę z (realnie istniejącego)
       `cena_kon`.
     - `empire-diplo-resource-flow.ts::empireDiploResourceFlowPerTurn` jest w pełni
       surowiec-agnostyczny (potwierdzone czytaniem całej funkcji) — zero wykluczenia 'kon'.
     - Brak jakiegokolwiek blacklisty/wykluczenia 'kon' w `main.ts`
       (`quantityTradableGoodOptions`/`priceableTradableGoodOptions`) ani w
       `diplomacyTradeBasket.ts`.
   Dlaczego ma znaczenie: bez własnej żywej próby (Chromium/headless) Operator nie ma
   podstaw twierdzić ani że handel koniem działa, ani że NIE działa — a obecny raport
   de facto przyjmuje to drugie (klasyfikując cały punkt 3 jako zablokowany przez plik
   poza allowlistą), co jest nieuzasadnionym założeniem w kierunku przeciwnym do
   wprost zakazanego w dispatchu, ale tej samej kategorii błędu: brak dowodu na żywo
   przed wnioskiem.

TESTY (własne, niezależne):
- `git diff origin/main` ograniczony do `gra/`: pusty — potwierdza (b) stadnina na złożu
  bez zmian/regresji i (c) bydło/owce/lama nietknięte — trywialnie prawdziwe, bo w ogóle
  brak zmian kodu.
- (a) odjęcie 50 'kon' przy potwierdzeniu budowy: NIE zachodzi — `commitBuildRequest()`
  (`gra/src/main.ts:12921-12969`, czytane w całości) odejmuje wyłącznie `playerPracaPool`;
  brak jakiegokolwiek haka do magazynu surowców dla ulepszeń terenu. Zgodne z diagnozą
  Operatora w tym punkcie — potwierdzone niezależnie.
  Analogicznie potwierdzone: `isLivestockUnlockedForPlacement` (livestock-unlock.ts:139-147)
  i `qualifies()`/case `'stadnina'` (`improvement-build.ts:1023-1030`) nadal czysty gate
  boolean, `computeEmpireLivestockUnlocks` faktycznie używane poza allowlistą w
  `main.ts:4619` i `main.ts:6860-6862` — zgodne z diagnozą Operatora, potwierdzone
  niezależnym `grep`.
  `ImprovementBuildState` budowany w `main.ts:12538-12539` (obok `tradeRouteKonUnlocked`)
  poza allowlistą — zgodne z diagnozą Operatora.
- (d) handel koniem do 50 sztuk: BRAK żywego dowodu (ani od Operatora, ani wykonanego
  przeze mnie — poza zakresem Evaluatora uruchamianie Chromium dla tematu, który Operator
  zablokował bez zmian kodu). Analiza statyczna (zarzut 2) wskazuje że mechanizm może już
  działać — wymaga potwierdzenia żywą próbą w kolejnej rundzie, NIE przyjęcia żadnego
  z dwóch kierunków na słowo.
- `tsc --noEmit` i 5 bramek referencyjnych: nie uruchamiane (brak zmian kodu do
  weryfikacji) — spójne z zerowym diffem.

BLOKADY:
- Allowlista tematu faktycznie nie obejmuje `gra/src/main.ts`, który jest jedynym
  miejscem realnego zatwierdzenia budowy (`commitBuildRequest`) i budowy
  `ImprovementBuildState` — potwierdzone niezależnie, potrzebne dla punktów 2 i 4
  ZADANIA. Ta część BLOCK-a jest zasadna.
- Twierdzenie że `gra/data/econ-params.json` również wymaga rozszerzenia allowlisty
  (dla punktu 3 ZADANIA) NIE jest poparte dowodem — patrz zarzuty 1-2. Ta część BLOCK-a
  wymaga korekty/ponownej weryfikacji przed eskalacją do właściciela.

RUNDY: 1/5
NASTĘPNY KROK: Obrona/runda 2 na tym samym ID — Operator koryguje diagnozę pkt 5
(potwierdza żywo, czy handel 'kon' już działa dziś bez zmian — jeśli tak, punkt 3
ZADANIA odpada z listy blokad i `gra/data/econ-params.json` znika z żądania rozszerzenia
allowlisty) i dopiero wtedy kieruje do orkiestratora/właściciela WĄSKIE, potwierdzone
dowodem DECISION_REQUIRED wyłącznie w sprawie `gra/src/main.ts` (punkty 2 i 4 ZADANIA).
DEPLOY/PUSH: NIE WYKONANO
