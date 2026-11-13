STATUS: PASS-WITH-NOTES
TEMAT: R-WEB-SIEGE-STARVATION-SURRENDER-Q1 (Obrona r1)

Zarzut 1: PRZYJMUJE czesciowo. Zmierzone: war-allin-capital-quick 30 tur, 8 hashy IDENTYCZNE z baza 3aa1b3a2a (gate-war-allin-capital-quick-after.txt); siege-surrender-forecast-live-test w Chromium na realnym buildzie 10/10 (gate-siege-surrender-forecast-live-test.txt). NIE_ZMIERZONO: tabela PRZED/PO per trudnosc w realnej turze Chromium (brak haka do odczytu HP garnizonu i inscenizacji oblegajacego; wymaga nowego haka) oraz siege-tower-breach-everywhere (ENOSPC, dysk ~1 GB). Swiadomy dlug.
Zarzut 2: PRZYJMUJE. siegeMapPanel.ts: "Atrycja" zalezna od etapu (zapasy>0 -> "brak (zapasy)"; zapasy=0 -> "-N% HP/ture (glod)", N z glodWojskaHpFrac przez setSiegePanelStarveFracProvider podpiety w main.ts).
Zarzut 3: PRZYJMUJE jako odstepstwo od allowlisty: cities.ts (pole siegeStarveStartMaxHp), siegeMapPanel.ts (zarzut 2) - minimalne, konieczne.
Zarzut 4: PRZYJMUJE. Hak setSiege ma opcjonalny 4. parametr startMaxHp (stan glodu). Sciezka z garnizonem w Chromium nadal NIE_ZMIERZONO (jak zarzut 1).
Zarzut 5: ODRZUCAM zmiane, zostawiam zalozenie: dispatch "zapas/zuzycie + 7" = tick zera tylko zapisuje start; testy (54/54) to utrwalaja; zmiana to 1 linia w siege-starvation.ts jesli wlasciciel wskaze inaczej.

Testy: tsc 0 bledow; siege-starvation-test 54/0; siege-surrender-forecast-test 57/0. (Pierwsza proba dala 53/1 przez moj `delete` w haku liczony przez test "3 miejsca" - naprawione.)
