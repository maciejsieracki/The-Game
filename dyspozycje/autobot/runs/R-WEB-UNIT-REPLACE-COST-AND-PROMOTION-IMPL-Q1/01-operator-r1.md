STATUS: DECISION_REQUIRED (część D3/Dodatek 2: tabela awansów między typami; D1/D2/Koszary wdrożone i zielone)
DOMAIN: GAME
TEMAT: R-WEB-UNIT-REPLACE-COST-AND-PROMOTION-IMPL-Q1
GOAL: "Zastąp" (gracz i AI, jedna funkcja kosztu) kosztuje pełny koszt rekrutacji nowej jednostki (Pieniądz + surowiec z puli państwa), jednostka zachowuje doświadczenie; awans między typami tylko wg tabeli; Koszary ujednolicone; audyt zamienników E -> E+1.

## Numeracja rundy
Zadanie: runda 2/5 wg harnessu (plik raportu nazwany `01-operator-r1.md` zgodnie z poleceniem). Obowiązujące jest DODATEK 3 (D1 = C, nadpisuje D1 = B), D2 = A, D3 = C, DODATEK 2 (audyt).
BAZA: origin/main 23871b38c (FALA 570), gałąź worktree `worktree-wf_c6611272-aab-1`. Uwaga: tamtejsza gałąź diagnozy `web-wip/R-WEB-REPLACE-OP` (f69125b92) nie jest w BAZIE — jej test `unit-replace-ai-vs-player-test.cjs` nie istnieje na main; zamiast przepisywać go "celowo", dodano nowy test pełnego kosztu (pokrywa te same fakty z odwróconymi asercjami).

## ZMIANY / COMMIT (allowlista)
- `gra/src/game/unit-replace-cost.ts` (NOWY, pure): `unitReplaceFullCost`, `canAffordUnitReplace`, `unitReplaceStockMissing(Label)`, `unitReplaceStockText`, `mergeStockPaid`. Koszt = pełny Pieniądz nowej + pełny `unitStockCost` (Surowiec/Surowiec (ilość) po skali epoki + Konie dla Typ=Mount) — ta sama funkcja co rekrutacja.
- `gra/src/game/ai-era-unit-promotion.ts`: AI płaci PEŁNY Pieniądz nowej (nie różnicę) + opcjonalne `stockCost/canPayStock/payStock`; brak zasobów = pominięcie bez mutacji; typ/kategoria/HP/ruch zmieniane, doświadczenie nietknięte, Manpower nietknięty.
- `gra/src/main.ts`: `performUnitReplace` (gracz) pobiera pełny Pieniądz + surowiec (`deductBuildingStockCostAcrossCities`, pula państwa), dopisuje do `stockPaid` (zwrot 100% przy rozwiązaniu pozostaje spójny: stary ślad + zużycie zamiany); `openUnitReplacePicker` liczy pełny koszt i wyszarza pozycję z powodem po polsku ("Brakuje w magazynie państwa: N Brąz"); `upgradeAiUnitsForEra` ta sama funkcja kosztu + pobór z puli AI; fallback AI do awansu między typami wyłącznie przez pole `Zastąp specjalnie` (D3 = C); Koszary: usunięto `replaceAvailabilityCtxForCity`, `unitReplaceCtx` zawsze używa unii po miastach państwa (`replaceAvailabilityCtxEmpireWide`) — gracz i AI, garnizon i pole; komentarz-nagłówek mechanizmu przepisany.
- `gra/src/ui/unitReplacePicker.ts`: opis "Koszt = pełna rekrutacja nowej jednostki; zachowuje doświadczenie · zużywa ruch tej tury"; karta pokazuje `N 💰 + M Surowiec`; stary komunikat "Dopłata = koszt nowej − koszt starej" usunięty.
- `gra/tools/ai-era-unit-promotion-test.cjs`: asercje kosztu przepisane celowo (różnica -> pełny koszt + pobór Brązu; pominięcie przy braku Pieniądza/surowca; zachowanie `battlesSurvived`).
- `gra/tools/unit-replace-full-cost-test.cjs` (NOWY, 35 asercji): funkcja kosztu, dostępność (o 1 za mało), powód po polsku, AI vs gracz (okablowanie w źródle), zachowanie XP/bonusów/armii/HP%, zwrot przy rozwiązaniu, D2 = A (bez limitu na turę, ograniczenie tylko zasobami), Koszary, awans między typami (Wojownik tyrreński -> Evocati).
- `dyspozycje/autobot/runs/R-WEB-UNIT-REPLACE-COST-AND-PROMOTION-IMPL-Q1/02-tabela-zamiennikow-E-do-E1.md` (NOWY, wygenerowany z żywych danych i `availableReplacementsFor`).
- Dane `gra/data/units*.json`: BEZ ZMIAN (patrz D3 niżej).
- Wpis LEDGER (REPIN Rust): w tym drzewie nie istnieje plik LEDGER REPIN (`rust-port/` zawiera tylko `engine`; wyszukanie `*LEDGER*` trafia wyłącznie w narzędzia pr141/autobot). NIE_ZMIERZONO/NIE_WPISANO — treść do wpisu przez orkiestratora: "REPIN: koszt Zastąp = pełny koszt rekrutacji (Pieniądz + unitStockCost z puli państwa), gracz i AI; stockPaid += koszt zamiany; Koszary = unia po miastach państwa; awans między typami tylko przez `Zastąp specjalnie`; AI pomija zamianę bez pełnych zasobów."
- Commit: patrz sekcja SHA na końcu (commit wykonany po zapisie raportu).

## TESTY
- `node tools/unit-replace-full-cost-test.cjs`: 35 passed, 0 failed.
- `node tools/ai-era-unit-promotion-test.cjs`: 17 passed, 0 failed (było 12; wcześniej zielone).
- `node tools/unit-replace-test.cjs`: 15/15 zielone (bez zmian, `availableReplacementsFor` nietknięte).
- `npx tsc --noEmit`: 3 błędy WYŁĄCZNIE w `src/audio/muzyka-antyczna.ts` (`Float32Array is not generic`, linie 1544/1984/2276) — plik poza zakresem, niezmieniony; przyczyna to wersja TypeScript zainstalowana lokalnie w tym worktree (5.6.x, bez generyków TypedArray), NIE moje zmiany. Zero błędów w plikach tematu.
- Weryfikacja w przeglądarce UI "Zastąp": NIE_ZMIERZONO (chromium/playwright nie uruchamiane w tej rundzie; node_modules zainstalowane tylko pod esbuild/tsc). Okablowanie UI sprawdzone testem źródłowym + tsc. Wymagana weryfikacja wizualna u Evaluatora/FC.
- Build/dev (`npm run build`/`dev`): NIE uruchamiane (zakaz).

## D1/D2/Koszary — wyniki
- D1 = C: Wojownik -> Wojownik z mieczem i tarczą kosztuje teraz pełny Pieniądz nowej + pełny Brąz (nie różnicę); pozycje bez pełnej ilości surowca/Pieniądza są wyszarzone u gracza i pomijane przez AI.
- D2 = A: brak limitu zamian na turę (test: 12 jednostek, zasoby na 5 -> 5 zamian).
- Koszary: dotąd garnizon liczył Koszary tylko z TEGO miasta, pole z unii wszystkich (niespójność z diagnozy). Teraz zawsze unia (wodny dostęp Naval też "którekolwiek miasto"). Skutek uboczny: jednostka w mieście bez Koszar widzi zamienniki, jeśli Koszary ma inne miasto państwa — zgodnie z poleceniem.

## D3 = C i DODATEK 2 — audyt (wynik)
Pełna tabela: `02-tabela-zamiennikow-E-do-E1.md` (260 wierszy jednostka epoki Kamień/Brąz × nacja; 142 bez zamiennika w E+1; 33 różne jednostki).
Kluczowe ustalenia (korekta założeń DODATKU 2):
1. Reguła A w `availableReplacementsFor` to TEN SAM `Typ`, a nie łańcuch "W zamian za". Dlatego nie są lukami: Taran/Taran okuty/Wieża oblężnicza -> Katapulta (wszystkie Typ=Siege), Rydwan (woły) -> Konnica/Rydwan konny (Mount), Wojownik -> Wojownik z mieczem i tarczą (Swordsman). Brak wpisu "W zamian za" nie blokuje zamiany; propozycja z Dodatku 2 (Taran okuty/Wieża -> Katapulta) jest już spełniona bez zmiany danych.
2. Prawdziwe luki (brak jakiegokolwiek zamiennika w E+1) dla wszystkich nacji: **Zwiadowca** (Civilian, 16/16), **Galera** (Naval, 16/16), **Procarz** (Slinger, 16/16).
3. Luki częściowe (brak zamiennika tego samego Typ w E+1 dla części nacji): Oszczepnik 13/16, Łucznik 13/16 (Distance Kamień -> Brąz tylko dla nacji z własnym łucznikiem), Włócznik 12/16, Wojownik z mieczem i tarczą 6/16, Konnica 13/16, Rydwan konny 13/16 (Brąz -> Żelazo; brak jednostek Żelaza danego Typ dla nacji).
4. Wszystkie jednostki narodowe Brązu bez następcy Żelaza tego samego Typ (np. Rydwan egipski/mykeński/sumeryjski/Shang/Kapadokijski, Piechota hetycka/induska, Wojownik Sherden/szekelesz/z toporem, łucznicy akadyjski/asyryjski/nubijski, Hu Ben Wei, Gwardia Królewska Sumeru, Gwardzista z champi, Oszczepnik Zulu, Procarz Huaracoc) — pełna lista w pliku tabeli, sekcja A.
5. Pole `Zastąp specjalnie` jest dziś wypełnione tylko 2 razy (Wojownik mykeński -> Hieros Lochos, Wojownik tyrreński -> Evocati). Mechanizm awansu między typami już działa (reguła B) i jest przetestowany; AI korzysta z niego (fallback). Brakuje DANYCH tabeli.

### DECISION_REQUIRED (ABC dla właściciela — orkiestrator zadaje pytanie; nie zgadywałem progów/ról)
Tabelę awansów między typami (w tym propozycji z dispatchu "Wojownik -> Włócznik/Falanga/Konnica") NIE da się wyprowadzić jednoznacznie z danych: `Typ`, `Klasa`, `Rola (linia)` i "Zmiana na" nie definiują "wyższego rzędu"; pole "Zmiana na" bywa błędne (Galera: "Swordsman"), a "W zamian za" to relacja wariant narodowy -> bazowa, nie awans. Pytanie 1 (luki bez zamiennika: Zwiadowca, Galera, Procarz):
- A) Zostawić bez zamiennika (jednostki pomocnicze/specjalne; zamiana niedostępna). Zalety: zero nowych reguł, brak ryzyka balansu. Wady: ta jednostka "starzeje się" w bieżącej epoce bez możliwości zamiany.
- B) Wpisać w `Zastąp specjalnie` najbliższą rolę: Procarz -> Łucznik/jednostka Distance epoki E+1 danej nacji; Galera -> brak (jedyny Naval w grze; wymagałoby nowej jednostki — poza zakresem); Zwiadowca -> Konnica (zwiad konny). Zalety: pełna ścieżka rozwoju. Wady: zmiana roli (Procarz->łucznik zmienia profil bojowy), arbitralne mapowanie; Galera niemożliwa bez nowej jednostki.
- C) Tylko dla Procarza i Zwiadowcy (B), Galera zostaje bez zamiennika do czasu pojawienia się Naval epoki Żelaza. Rekomendacja: **C** (minimalne, odwracalne wpisy w danych; brak wymyślania nowych jednostek).
Pytanie 2 (awans cross-type "Wojownik -> Włócznik/Falanga/Konnica"):
- A) Nie wprowadzać (zamiana wyłącznie w obrębie Typ + 2 istniejące wpisy). Zalety: zero zmian balansu, "wyszkolony Wojownik" nie staje się lekką jazdą. Wady: brak ścieżki między liniami.
- B) Wprowadzić wąską tabelę piechota <-> piechota: Wojownik -> Włócznik/Falanga (ta sama Rola "Wręcz", Klasa Standardowa); Konnica poza tabelą. Zalety: logiczne w ramach linii wręcz. Wady: Włócznik/Falanga mają inny profil (bonusy vs Mount), to zmiana taktyczna, nie awans.
- C) Pełna tabela z Konnicą. Wady: zmiana roli Wręcz -> Flanka, najwyższe ryzyko balansu AI.
Rekomendacja: **B**, ale dopiero po akceptacji wpisów przez właściciela (liczby i role to decyzja produktowa).
Do czasu decyzji dane `units*.json` nie są zmieniane (zakaz zgadywania).

## RYZYKA (do zgłoszenia)
- Ekonomia AI: masowa zamiana przy wejściu w nową epokę staje się droga (pełny Pieniądz + Brąz/Żelazo) — pożądane, ale AI z dużym skarbem i zapasem nadal może zamienić wiele jednostek w jednej turze (D2 = A, bez limitu). Brak pomiaru na żywo gry: NIE_ZMIERZONO (bez symulacji AI w tej rundzie). Zalecenie dla Evaluatora: krótka symulacja `ai-army-replacement-sim.cjs` / pomiar zużycia Brązu przy wejściu w epokę.
- AI wybiera NAJNOWSZY zamiennik; jeśli jest zbyt drogi, nie schodzi do tańszego (pomija) — zachowanie świadome, do potwierdzenia.
- `stockPaid` = stary + nowy: zwrot przy rozwiązaniu zwraca sumę (zgodne z regułą "100% zużytego"); pieniądz nie wraca.
- Balans cen zamian: koszt Pieniądza zamiany = cena rekrutacji (po bonusach cywilizacji/trudności właściciela), bez rabatu za wyszkolenie.
- Koszary-unia: gracz w mieście bez Koszar może teraz zamieniać, jeśli Koszary ma inne miasto (zgodne z DISPATCH).

## BLOKADY
- DECISION_REQUIRED: dwa pytania ABC wyżej (dane awansów) — blokują wyłącznie uzupełnienie tabeli danych, nie kod.
- Brak weryfikacji w przeglądarce (NIE_ZMIERZONO).
- Brak pliku LEDGER REPIN w repo (wpis do wykonania przez orkiestratora).

## RUNDY
Runda 2/5 (wg harnessu; poprzednia FAIL — odpowiedź na obcą wiadomość). Ta runda: wdrożenie D1(C)/D2/D3(mechanizm)/Koszary + audyt.

## NASTĘPNY KROK
Evaluator: przejrzeć diff (`git diff origin/main --stat`), uruchomić 3 testy wyżej, zweryfikować UI "Zastąp" w przeglądarce (karta: "N 💰 + M Brąz", wyszarzenie z powodem po polsku, brak starego tekstu "Dopłata"), ocenić ryzyko AI. Orkiestrator: zadać właścicielowi pytania ABC 1 i 2; po decyzji — mały temat danych (`Zastąp specjalnie` w units.json) + REPIN Rust.

DEPLOY/PUSH: NIE WYKONANO
