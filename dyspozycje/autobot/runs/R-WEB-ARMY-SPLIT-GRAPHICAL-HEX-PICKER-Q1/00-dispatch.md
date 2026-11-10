# R-WEB-ARMY-SPLIT-GRAPHICAL-HEX-PICKER-Q1
STATUS: REGISTERED — etap1/11
DOMAIN: GAME
GOAL: zastąpić listę współrzędnych w Rozdziel armię graficznym wyborem pola: heks źródłowy z jednostką pośrodku i sześć heksów sąsiednich wokół, zgodnie z kierunkami mapy. Gracz klika sąsiedni heks docelowy. Nie wdrażać samych numerów jako głównego interfejsu.
KRYTERIA: czytelne zaznaczenie wyboru, niedostępne pola wyszarzone z powodem i bez możliwości zatwierdzenia, widoczność rzeczywistego sąsiedztwa/terenu tam gdzie dane pozwalają, zachowane reguły przechodniości/ruchu/limitu stosu/pozostawienia jednostki źródłowej, zachowany wybór tego samego heksu w mieście. Układ mieści się w ekranie także przy150%powiększenia, obsługa klawiaturą i dostępne opisy kierunków.
MODEL: Operator/Evaluator/FinalControl gpt-6-luna high, osobne sekwencyjne role; max4 aktywne tematy.
BAZA: origin/main poFALI608; dokładnySHA zapisać w raporcie.
ALLOWLISTA początkowa: gra/src/ui/armySplitPanel.ts, własny test wgra/tools/, tenrun. Jeśli brakuje danych sąsiednich pól, przed zmianą rozszerzyć jawnie zakres o minimalny adapter/callback; nie zmieniać reguł gry.
TESTY: 6kierunków→poprawnycel, sourcecitychoice, disabled/edge-of-map/terrain, potwierdzenie wybranychjednostek, layout150%, klawiatura. Przeglądarka systemowa/usr/bin/chromium i HTTP, file:// jest ograniczone; nie podawać niezmierzonegoPASS.
NASTĘPNY KROK: faktyczny dispatch Operatora, potem niezależne bramki ażdo11/11 z integracjąmain/deployRobocza/push/readback/cleanup.
