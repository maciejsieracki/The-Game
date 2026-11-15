STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1
GOAL: widok miasta: żetony górnych banerów w jednej linii po obu stronach, boczne panele tuż pod górnym paskiem, bez nachodzenia i poziomego przewijania; tylko układ.
ZMIANY/COMMIT: kandydat do integracji 46201adff (potomek bazy ac3f072dd; git merge-base --is-ancestor = tak). Diff vs baza: gra/src/ui/cityPanel.ts, gra/src/ui/cityUxFrame.ts, gra/tools/city-view-layout-test.cjs, runs/<ID>/ (raporty + 8 PNG). Allowlista zachowana, main.ts i WERSJE.md nietknięte. git diff --check ac3f072dd..46201adff czysty. git merge-tree --write-tree origin/main (3a6b0e405) 46201adff: bez konfliktów (drzewo 5f30078ac).
TESTY (własne uruchomienie, surowe wyjście):
- tsc --noEmit: exit 0.
- city-view-layout-test: PASS=120 FAIL=0; --mutant (baza): PASS=88 FAIL=32.
- logic-test 213/213; tech-tree 20 pass/0 fail; research 33/0; unit-replace 21/21; combat 6/6.
- Zrzut 1366x768 obejrzany (test ładuje prawdziwy showCityPanel + CSS w Chromium; Vite niepotrzebny): oba banery w jednej linii, plakietka OLIMPIA z przyciskami w środku, panele boczne tuż pod banerami.
- Pomiar big 1280x720: żeton 11,0 px, top paneli 48 vs dół banera 39,6.
WERDYKT PER ZARZUT:
1 ODDAL (naprawione w 12fa198fd; fixture z przyciskami, 120/0).
2 DO DECYZJI CZŁOWIEKA (próg czytelności żetonów ~11 px przy 6-7 cyfrach w 1280-1366 px; produktowa, nieblokująca; kryterium GOAL spełnione).
3 ODDAL z notą (overflow-y:auto lewego panelu sprawdzony; długa Produkcja/kolejka i prawy panel NIE_ZMIERZONO).
4 ODDAL (próg 72 px ma zapas: top 48-67; test jest strażnikiem).
5 ODDAL (4 pary PNG dla 4 rozmiarów, odtwarzalne testem --shots).
6 ODDAL (celowe, informacyjnie).
7 ODDAL (merge-tree czysty z aktualnym origin/main).
Żaden zarzut nie wymaga NAPRAW.
BLOKADY: brak. recruitment-panel-compact-row-test 32/7 identyczny na bazie wg obrony (dług wcześniejszy; nie weryfikowano samodzielnie).
RUNDY: FC 1/5.
NASTĘPNY KROK: integracja orkiestratora SHA 46201adff, potem deploy ROBOCZA. Pytanie ABC do właściciela o próg czytelności żetonów (zarzut 2).
UWAGI-DLA-ORKIESTRATORA: CSS zoom na plakietce miasta (Chromium/nowy Firefox). Zmiana capu stosu 1480->1880 px dotyczy też 1920 px. Rzeczywiste wartości w grze: NIE_ZMIERZONO.
DEPLOY/PUSH: NIE WYKONANO
