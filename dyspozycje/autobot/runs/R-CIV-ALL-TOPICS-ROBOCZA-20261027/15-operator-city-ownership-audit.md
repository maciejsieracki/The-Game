# AutoBot Operator — audit zmian właścicieli w stres-teście

**STATUS: NIE ROZSTRZYGNIĘTE (dowody runtime nie wystarczają do oceny legalności)**
**BAZA:** `integration/robocza-all-topics-20261027`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`
**ARTEFAKT:** `/tmp/large-empire-stress-summary-37176-efzk9u.json`
**ZAKRES:** read-only audyt zmian liczby miast per owner oraz istniejących lejków przejęcia.

## Co wynika ze stres-testu

Scenariusz startował z 137 miastami: gracz `ownerId=0` miał 40, sześciu głównych AI miało po 15, a siedem miast-państw po jednym. Łączna liczba miast pozostawała 137 do tury 35→36.

Pierwsza zmiana była między turami 3→4: gracz spadł z 40 do 39, a AI `ownerId=1` wzrosło z 15 do 16. Suma pozostała 137. JSON zapisuje tylko sumy `perOwner`, nie identyfikatory przejętych miast ani stan wojny pary w chwili przejęcia, więc nie da się na jego podstawie ustalić, które miasto zmieniło właściciela ani czy para była wtedy w stanie wojny.

Późniejsze zmiany dotyczą miast-państw i odpowiadają wzrostowi sąsiednich ownerów: w turze 21→22 `ownerId=2` i `6` zniknęli, a AI `1` i `5` wzrosły o jedno miasto; w 22→23 zniknęli `10` i `12`, a AI `9` i `11` wzrosły; w 24→25 zniknął `4`, a AI `3` wzrosło. Łączna liczba miast wciąż wynosiła 137. To jest zgodne z istniejącą funkcją pokojowego, dyplomatycznego wchłonięcia miasta-państwa — nie stanowi dowodu na nielegalne przejęcie miasta gracza. Od tur 35→36, 37→38 i 38→39 łączna liczba miast wzrosła do 138, 139, 140; odpowiadające wzrosty AI są zgodne z zakładaniem nowych miast.

## Odczyt istniejących bramek w kodzie

Nie znalazłem oczywistej otwartej ścieżki, którą zwykły AI mógłby przejąć miasto gracza w pokoju:

- Rozkaz ruchu AI otrzymuje `canEngageOwner`, które w egzekucji ponownie sprawdza `areEnemyOwners(ownerId, targetOwnerId)`; po automatycznym pokoju zaplanowany wcześniej rozkaz traci prawo wejścia na obce puste miasto. Zob. `gra/src/main.ts` okolice linii 36788 i `gra/src/game/ai-city-capture-executor.ts`.
- Wspólna ścieżka pustego miasta `tryAutoCaptureEmptyCityAt` ponownie odrzuca przejęcie, jeśli `areEnemyOwners(anchor.ownerId, city.ownerId)` jest fałszywe (`gra/src/main.ts` okolice linii 31275).
- Zwycięstwo map-battle/szturm może zmienić właściciela tylko po `areEnemyOwners(...)` w bramce wyniku bitwy (`gra/src/main.ts` okolice linii 29818–29824).
- Kapitulacja głodowa sprawdza tę samą relację przed zmianą `city.ownerId` (`gra/src/main.ts` okolice linii 15246).
- `annexCityStateToOwner` jest osobną, pokojową ścieżką, ale dotyczy wyłącznie ownera miasta-państwa i nie przejmuje miasta gracza (`gra/src/main.ts` okolice linii 30277+ oraz 480+ w obrębie funkcji inicjalizacyjnych/runtime).

Istniejący `gra/tools/ai-city-capture-integration-test.cjs` pokrywa odrzucenie ruchu po pokoju i statyczne bramki wspólnej ścieżki oraz kapitulacji głodowej. Nie dowodzi jednak, jaki stan dyplomacji występował w stres-teście między turami 3→4.

## Wniosek i minimalny następny krok

Nie można potwierdzić ani wykluczyć naruszenia pokoju na podstawie obecnego artefaktu. Nie ma podstaw, aby zgłosić zmianę w kodzie jako naprawę; najpierw trzeba zachować brakujące zdarzenia z gry. Dla przyszłego stres-run harness powinien zapisać mapę `cityId -> ownerId` przed i po każdej turze oraz dla każdej różnicy: identyfikator/nazwę miasta, stary i nowy owner, `getDiploRelation(old,new).status` przed/po, aktywny peace-lock i typ lejka przejęcia (battle, pusty heks, kapitulacja, dyplomatyczne wchłonięcie). To pozwoli rozdzielić legalny podbój od naruszenia pokoju bez wnioskowania z samych liczników.

Nie uruchamiałem przeglądarki ani dodatkowego stres-testu. Nie zmieniałem kodu produktu. Nie wykonano merge, deployu ani pushu.
