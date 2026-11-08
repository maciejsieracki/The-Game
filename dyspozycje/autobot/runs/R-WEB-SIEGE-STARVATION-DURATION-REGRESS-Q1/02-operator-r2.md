STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-STARVATION-DURATION-REGRESS-Q1
GOAL: Odpowiedź Operatora r2 na zarzuty Obrony (baza be505e7c2, runda 1). Kod bez zmian w tej rundzie; dopisane dowody z historii gita i korekta premisy "7c23ea90a = wzorzec".
RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO

## Korekta premisy (dotyczy zarzutu 1)
Dispatch zakłada, że 7c23ea90a przywraca zachowanie właściciela. Sprawdzone w gicie:
- Warunek `u.inGarnizon === true` w bloku N3 (oblężenie) istniał PRZED 7c23ea90a: `git show 7c23ea90a~1:gra/src/main.ts`, ok. l. 36354-36358 (`realGarnizonUnits = units.filter(... u.inGarnizon === true)`).
- W wersji sprzed 7c23ea90a: gdy `realGarnizonUnits.length === 0`, od razu `handleSiegeCapitulationPhase(oblCity)` przy `tick.obleganyGlod` (ok. l. 36385-36388). Miasto BEZ ufortyfikowanych jednostek poddawało się po wyzerowaniu zapasów (~2 tury). Ta ścieżka istnieje co najmniej od f2df10f2a (stan 2026-07-06).
- 7c23ea90a dodał filtr `inGarnizon` do PROGNOZY (siege-surrender-forecast / plakietka). Przed commitem prognoza nie liczyła garnizonu wcale (`turnsUntilSiegeSurrender(city, { food })`). Dodał też etap głodu z progiem 50% dla ufortyfikowanych.
- Wniosek: dla jednostek UFORTYFIKOWANYCH 7c23ea90a i b497fd0df dają to samo. Dla jednostek NIEUFORTYFIKOWANYCH 7c23ea90a daje 2 tury (ścieżka historyczna). Poprawka be505e7c2 zmienia więc zachowanie względem 7c23ea90a TYLKO dla nieufortyfikowanych obrońców. To nowa decyzja projektowa, nie przywrócenie wzorca.
- Nie znaleziono commitu w linii głównej, który zmienił warunek N3 po 7c23ea90a (`git log 7c23ea90a..b497fd0df` na tych plikach). Dlatego "regres jednego commitu" pozostaje NIEUDOWODNIONY. Bisect ze scenariuszem niemożliwy (brak harnessu pełnej gry). NIE ZMIERZONO.

## Odpowiedź na zarzuty
ZARZUT 1 (dowód przyczyny): PRZYJMUJĘ częściowo. Dowód: historia gita powyżej. Nie udowodniono, że w zrzucie właściciela jednostki były nieufortyfikowane (brak zapisu stanu). Teza "to już działało" nie jest wyjaśniona: żaden commit w badanej linii nie daje dłuższego oblężenia dla nieufortyfikowanych niż 2 tury. Potrzebny zapis stanu gry z miastem Rakhigarhi.
ZARZUT 2 (tabela 3 miast Harappy): NIE ZMIERZONO. Brak zrzutu stanu (zrzut z dodatku nie jest dostępny w repo ani w worktree) i brak ΣHP/zapasów dla Rakhigarhi, Ganweriwala, Kalibangan. Tabela bez danych byłaby zgadywaniem. Potrzebny zapis stanu gry z tych miast.
ZARZUT 3 (siła testu): PRZYJMUJĘ jako ograniczenie. Test B/D replikuje blok N3 na modułach; main.ts sprawdzany wzorcami tekstowymi. Potwierdzam: cofnięcie samego main.ts daje 3 FAIL (strukturalne), testy behawioralne zostają zielone. Korekta raportu r1: "10 FAIL" dotyczy cofnięcia funkcji `siegeDefenderUnits` w siege-starvation.ts, nie cofnięcia poprawki w main.ts. Bez zmiany kodu w tej rundzie.
ZARZUT 4 (zużycie zapasów liczy tylko inGarnizon): PRZYJMUJĘ jako ustalenie; poprawki NIE wprowadzam w tej rundzie. Miejsca: turn-economy.ts ok. l. 2763-2765 (`zuzycie = population + city.garnizon`) oraz garnizonCountForCity (main.ts ok. l. 16682, tylko inGarnizon). Skutek zależy od wielkości: przy ludności 5 i zapasach 10 oba warianty (3 ufortyfikowanych lub 0) dają poddanie w turze 2 (zużycie 8: 10->2->0; zużycie 5: 10->5->0). W ogólnym przypadku etap zapasów jest dłuższy o liczbę nieufortyfikowanych obrońców. Naprawa zmienia długość etapu 1 i wymaga decyzji właściciela: DECISION_REQUIRED.
ZARZUT 5 (pozostałe inGarnizon): PRZYJMUJĘ jako świadomie pominięte w tym temacie: garnizonCountForCity (main.ts ok. l. 16682), syncGarnizonForCity (ok. l. 30246), sprzątanie po śmierci przez głód (`if (u.inGarnizon === true)` ok. l. 37005/37525). Skutek: licznik city.garnizon jest niższy niż liczba obrońców; wpływa na zużycie (zarzut 4) i bonusy garnizonu, nie na progi HP.
ZARZUT 6 (uczciwość raportu): PRZYJMUJĘ. Dług #112 (glod-wojska-karencja-test 29/10) pozostaje, zgodnie z dispatchem. siege-last-stand-sortie: w r1 zapisano "przeszedł" bez liczby; NIE ZMIERZONO liczbowo w tej rundzie.

## Decyzje do orkiestratora (DECISION_REQUIRED)
1. Czy nieufortyfikowani obrońcy w mieście mają trzymać HP (poprawka be505e7c2 odchodzi od 7c23ea90a dla tych jednostek): tak/nie.
2. Czy zużycie zapasów oblężenia ma liczyć wszystkich obrońców (zarzut 4): tak/nie. Zmienia długość etapu 1.
3. Dane: zapis stanu gry z Rakhigarhi, Ganweriwala, Kalibangan (ΣHP, zapasy, ludność, jednostki z inGarnizon).

## Zmiany w tej rundzie
Brak zmian kodu. Dodany tylko ten plik. Bramki z r1 nie były uruchamiane ponownie (kod identyczny z be505e7c2).
NASTĘPNY KROK: Obrona r2 na tym dopisku; decyzje 1-3 do właściciela przez orkiestratora.
