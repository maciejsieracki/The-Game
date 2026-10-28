# AutoBot Evaluator — audyt zmiany właścicieli miast

**STATUS: PASS-WITH-NOTES**
**ROLA:** niezależny Evaluator, read-only.
**BAZA:** `integration/robocza-all-topics-20261027`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
**ZAKRES:** ocena dowodów stres-testu dla przejścia 3→4 oraz przegląd istniejących ścieżek przejęcia.

## Werdykt

Nie ma wystarczających danych, by rozstrzygnąć, czy zmiana `ownerId` miasta gracza w turze 3→4 była legalnym podbojem, czy naruszeniem pokoju. Stres-JSON zachowuje wyłącznie liczbę miast na właściciela. Pokazuje gracza 40→39, AI `ownerId=1` 15→16 i stałą sumę 137, ale nie zapisuje identyfikatora miasta, statusu relacji ani zdarzenia przejęcia. Nie potwierdzam błędu i nie uznaję zgłoszenia za zamknięte.

## Niezależny odczyt bramek

- `areEnemyOwners(a,b)` zwraca prawdę dla różnych właścicieli tylko przy statusie dyplomacji `wojna` (z wyjątkiem barbarzyńców). To jest wspólna bieżąca kontrola stanu relacji.
- Jedyny runtime caller `executeAiCityMove` w `main.ts` przekazuje `canEngageOwner: targetOwnerId => areEnemyOwners(ownerId,targetOwnerId)`. Wspólny callback `tryAutoCaptureEmptyCityAt` ponownie sprawdza `areEnemyOwners` bezpośrednio przed capture.
- Przejęcie po bitwie/szturmie w `applyMapBattleOutcome` wymaga `areEnemyOwners(atkOwner,cityOwner)` przed `applyCityCaptureToMap`.
- Kapitulacja oblężnicza z głodu ponownie sprawdza wojnę; przy pokoju kończy oblężenie i wraca bez zmiany właściciela.
- `annexCityStateToOwner` jest odrębną pokojową ścieżką, ale pobiera miasta wyłącznie aktualnego `csOwnerId`; nie jest ścieżką przejęcia miasta gracza.

Istniejący test `node tools/ai-city-capture-integration-test.cjs` wykonałem ponownie: **21/21 PASS**. Obejmuje realny executor ruchu AI, odrzucenie komendy po automatycznym pokoju, źródłowe ponowne sprawdzenie wojny w `main.ts` oraz blokadę kapitulacji oblężniczej po pokoju. Test nie odtwarza jednak miasta z t3→4 ani relacji dyplomatycznej z tamtego przebiegu.

## Ograniczenie i dodatkowa obserwacja

Stres-test nie przechwycił per-city ownership delta ani statusu wojny/peace-lock w chwili zmiany. Również późniejsze przesunięcia znikających właścicieli miast-państw i rosnących AI są zgodne z pokojową aneksją miasta-państwa; przyrost sumy miast od tury 35 jest zgodny z zakładaniem nowych miast. Same liczniki nie wystarczają do rozpoznania pochodzenia zmian.

Warto osobno zweryfikować inicjowanie ataków oblężniczych podczas pokoju: `detectAutoSiegeOnCity` i `canInitiateSiege` sprawdzają właściciela, mur i pozycję, ale same nie sprawdzają relacji dyplomatycznej. Nie dowodzi to pokojowego przejęcia miasta, ponieważ ścieżki zmiany właściciela ponownie sprawdzają `areEnemyOwners`; jest to odrębny możliwy problem zachowania ofensywnego.

## Zalecany następny krok

Przyszły harness powinien zapisywać przed i po turze mapę `cityId → ownerId`, a dla każdej różnicy: nazwę/ID miasta, starego i nowego właściciela, relację dyplomatyczną i peace-lock w chwili zmiany oraz kanał przejęcia (`battle`, puste miasto, kapitulacja, wchłonięcie miasta-państwa lub założenie miasta). Bez tego trzeba pozostawić legalność przejścia 3→4 **nierozstrzygniętą**.

Nie zmieniałem kodu produktu ani danych stres-testu. Nie uruchamiałem przeglądarki ani pełnego stres-testu. Nie wykonano merge, deployu ani pushu.
