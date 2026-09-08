STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-BUDOWA-AUTO-NIE-LADUJE-ULEPSZEN-Q1
GOAL: Zdiagnozuj i napraw brak wczytywania ulepszeń budynków (przycisk "Ulepsz" — kolejny
poziom/wariant już zbudowanego budynku, np. Targowisko→Rynek, Stolarnia, Stela/Pomnik,
Kamienne kręgi, Warsztat kamieniarski, Studnia) do automatycznej kolejki produkcji miasta,
mimo że są dostępne i widoczne w panelu manualnym. Docelowa reguła (podana przez właściciela):
priorytet DWUPOZIOMOWY — najpierw budynki, które NIE są ulepszeniami (nowe budynki), a
dopiero gdy lista takich się wyczerpie, auto-budowa powinna ładować i budować ulepszenia.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (zrzut panelu "PRODUKCJA" → "DOSTĘPNE DO BUDOWY"): sekcja "Ulepsz"
  pokazuje kilka budynków z aktywnym niebieskim przyciskiem "Ulepsz" (Stolarnia, Targowisko
  (Rynek), Stela/Pomnik, Kamienne kręgi, Warsztat kamieniarski, Studnia — Garncarnia wyszarzona/
  niedostępna), sekcja "Jeszcze zablokowane (epoka Brąz)" pokazuje budynki wymagające epoki
  (Akwedukt, Mennica, Mury, Spichlerz II). Właściciel: "automatyczna budowa nie ładuje ulepszeń
  do puli budynków w liście produkcji... najpierw budynki, które nie są ulepszeniami, powinny
  być zbudowane, ale jeśli jest wolna lista, to powinny się ładować ulepszenia i być budowane
  automatycznie, gdy wybrana jest automatyczna budowa."
- Świeżo zweryfikowany przez orkiestratora rurociąg auto-budowy (`gra/src/game/auto-manage.ts`,
  `gra/src/game/production.ts` — numery linii mogły się przesunąć, sprawdź świeżo):
  1. `buildableProduction()` (`production.ts` ok. 780-858) generuje listę kandydatów budynków —
     WŁĄCZA budynki z `upgradeFrom` (jeśli prerekwizyt zbudowany, `builtList.includes(upgradeFrom)`)
     jako zwykłe `ProductionItem{kind:'budynek'}` — na pierwszy rzut oka ulepszenia NIE są
     jawnie wykluczone z tej listy kandydatów.
  2. `pickAutoBuildItem()` (`auto-manage.ts` ok. 266-293) wywoływane TYLKO gdy front kolejki
     pusty i `city.budowaTryb` to `'priorytet'`, `'lista'` LUB `'zrownowazone'` — trzy RÓŻNE
     ścieżki, każda z INNĄ logiką, sprawdź WSZYSTKIE trzy jako osobne kandydatury przyczyny:
     a. `tryb === 'lista'` → `pickNextFromBudowaLista(city.budowaLista, candidates)` (ok.
        219-228) — skanuje TYLKO identyfikatory jawnie wpisane przez gracza do
        `city.budowaLista`. Jeśli gracz skonfigurował listę dawno temu z samymi ID nowych
        budynków (bez ID budynków-ulepszeń, np. `rynek`/nazwa docelowa Targowiska), ulepszenia
        NIGDY nie zostaną wybrane — funkcja zwraca `null` zamiast spaść na jakikolwiek inny
        kandydat. To jest SILNY kandydat na przyczynę zgłoszenia.
     b. `tryb === 'zrownowazone'` → `bestCandidateForFocus(candidates, data, 'zrownowazone')`
        (ok. 283-284) — `buildingMatchesFocus(kat, 'zrownowazone')` zwraca `true` dla
        KAŻDEJ kategorii (ok. 126-130), więc na pierwszy rzut oka ulepszenia POWINNY być
        widoczne w tym trybie — zweryfikuj czy naprawdę tak jest w praktyce (live symulacja),
        nie ufaj samej lekturze kodu.
     c. `tryb === 'priorytet'` → iteruje `budowaPriorytetTypowFor(city)` (lista kategorii-
        ogniska, ok. 287-291), wywołując `bestCandidateForFocus` per kategoria — jeśli żadna
        z wybranych przez gracza kategorii ogniska nie obejmuje `kategoria` konkretnego
        budynku-ulepszenia (`buildingMatchesFocus` poza `'zrownowazone'` filtruje `kategoria in
        map`, ok. 126-130), ulepszenie nigdy nie zostanie wybrane mimo dostępności — DRUGI
        silny kandydat na przyczynę.
  3. Sprawdź też czy `affordableCandidates()` (ok. 250-264) czasem odfiltrowuje ulepszenia z
     innego powodu (koszt surowcowy, `canAffordBuildingStock`) niepowiązanego z samym faktem
     bycia ulepszeniem.

ZADANIE:
1. Odtwórz problem z dowodem — headless harness (żywe wywołanie `pickAutoBuildItem`/
   `autoManageCity` na realnych danych z `data/buildings.json`) w scenariuszu z ekranu:
   miasto z kilkoma zbudowanymi budynkami mającymi dostępny `upgradeFrom`-łańcuch (np.
   Targowisko→Rynek — sprawdź świeżo prawdziwe ID w `buildings.json`), front kolejki pusty,
   PO KOLEI każdy z trzech trybów (`priorytet`/`lista`/`zrownowazone`) z realistyczną
   konfiguracją gracza (typowe `budowaPriorytetTypow`/`budowaLista` — nie wymyślaj
   nierealistycznego wejścia). Zmierz: czy `pickAutoBuildItem` KIEDYKOLWIEK zwraca ulepszenie,
   i w jakich warunkach nie.
2. Ustal DOKŁADNĄ przyczynę (może być więcej niż jedna z trzech ścieżek — nie zakładaj że to
   tylko jedna).
3. Zaimplementuj regułę dwupoziomową właściciela: PRIORYTET dla budynków bez `upgradeFrom`
   (nowe), FALLBACK na budynki z `upgradeFrom` (ulepszenia) gdy pierwsza pula wyczerpana — w
   KAŻDYM z trybów, gdzie diagnoza (pkt 2) potwierdzi że dziś tego brakuje. Zachowaj istniejące
   zachowanie trybu `'lista'` gdy lista NIE jest pusta i faktycznie zawiera pasujące ID (nie
   psuj świadomego, ręcznego sterowania gracza) — dotyczy WYŁĄCZNIE przypadku gdy lista/ognisko
   nie ma ŻADNEGO dopasowania i auto-budowa stoi bezczynnie mimo dostępnych ulepszeń.
4. Żywy dowód PRZED/PO: ta sama symulacja z punktu 1 — PO naprawie auto-budowa faktycznie
   wybiera ulepszenie, gdy pula nowych budynków jest wyczerpana, w scenariuszu gdzie PRZED
   zwracała `null` mimo dostępnych kandydatów.

BINARNE KRYTERIUM SUKCESU: auto-budowa (dowolny z trybów priorytet/lista/zrownowazone) ładuje
ulepszenia budynków do kolejki gdy pula nowych budynków jest wyczerpana, potwierdzone
symulacją PRZED/PO. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone, istniejące testy
`auto-manage`/`pickAutoBuildItem` (jeśli istnieją, np. plik z "auto-build"/"auto-manage" w
nazwie w `gra/tools/`) nadal zielone lub świadomie rozszerzone.

ALLOWLISTA:
- `gra/src/game/auto-manage.ts` (WYŁĄCZNIE `pickAutoBuildItem`, `bestCandidateForFocus`,
  `pickNextFromBudowaLista`, `budowaPriorytetTypowFor` i bezpośrednio powiązane funkcje)
- `gra/src/game/production.ts` (WYŁĄCZNIE jeśli diagnoza wskaże że przyczyna leży w
  `buildableProduction`/`affordableCandidates` — nie zgaduj z góry)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo rozszerzenie istniejącej)
- `dyspozycje/autobot/runs/P-BUDOWA-AUTO-NIE-LADUJE-ULEPSZEN-Q1/*`
Zakaz `git add -A`. Zakaz zmiany zachowania panelu MANUALNEGO (przyciski "Ulepsz"/"Buduj"
klikane ręcznie przez gracza) — temat dotyczy WYŁĄCZNIE auto-budowy.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej
symulacji (nie samo czytanie kodu i domysł — analiza orkiestratora wyżej to HIPOTEZY do
zweryfikowania, nie gotowa diagnoza). Zakaz "naprawienia" tylko jednego z trzech trybów jeśli
symulacja pokaże że więcej niż jeden ma tę samą wadę.

IZOLACJA: worktree `/home/user/wt-budowa-auto-ulepszenia`, gałąź
`autobot/P-BUDOWA-AUTO-NIE-LADUJE-ULEPSZEN-Q1`, baza `origin/main` @ `c98515ea`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
