STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1
GOAL: bonus obwarowania dla obroncow na murze lub za murem + zasieg x2 strzelcow na koronie (bez zmian procentow, R1-R4, Milicji, machin, wiezyczek).
ZMIANY/COMMIT: kod bez zmian wzgledem 4d41f3060 / 5ba4d3bbb. Obrona dodaje tylko dowody w runs/R-WEB-WALL-DEFENDERS-BONUS-RANGE-Q1/ (02-obrona-r1.md, e2e-tura-strzelec.cjs, gate-e2e-tura-PRZED.txt, gate-e2e-tura-PO.txt, gate-test-PO-mutacje-obrona.txt).

ZARZUT 1 (zrzuty PRZED/PO identyczne): PRZYJMUJE. Hash identyczny, bo zrzut jest robiony na starcie sceny, a zmiana nie jest wizualna na starcie (podswietlenie zasiegu pojawia sie dopiero przy aktywacji). Zrzuty NIE sa dowodem. Dowodem sa logi pomiarowe, w tym nowy, rozrozniajacy PRZED/PO (zarzut 3). Nie fabrykuje sztucznej roznicy w obrazie.

ZARZUT 2 (mutacje sceny nie odtworzone, OOM): PRZYJMUJE jako ograniczenie sandboxu Ewaluatora, a odtwarzam u siebie. TMPDIR=/dev/shm, pelny przebieg testu: 58 ok / 0 fail, EXIT=0; wszystkie 7 mutacji czerwone: A-MUT x4 oraz B-MUT inside, skip, range (log gate-test-PO-mutacje-obrona.txt).

ZARZUT 3 (brak pomiaru pelnej tury): PRZYJMUJE i domykam. Skrypt e2e-tura-strzelec.cjs na prawdziwej scenie (?playtest=oblezenie-duze, Chromium, dwa buildy vite: src z 1117c6515 i src z 5ba4d3bbb): strzelec na koronie z rangeBase=3, jedyny wrog na ziemi w odleglosci 5 (manhattan), uruchomiona prawdziwa _activateUnit:
- PRZED: range=3, _rangedTargetInRange=false, aktywacja konczy sie bez strzalu, ammo 12 -> 12.
- PO: range=6, _rangedTargetInRange=true, aktywacja oddaje strzal, ammo 12 -> 11. Brak bledow JS.
NIE_ZMIERZONO: spadek HP celu (obiekt jednostki nie ma prostego pola liczbowego HP wykrytego sondą; dowodem strzalu jest zuzycie amunicji) oraz dojscie callbacku done w 8 s (animacja pocisku w headless).

UWAGI Ewaluatora:
- Auto (main.ts structureDefenseBonusFor) liczy bonus dla calego rostera na heksie miasta - bez zmian, zgodne.
- Zalozenie (c) (atakujacy na koronie traci dawny bonus): PODTRZYMUJE zalozenie do akceptacji wlasciciela; dispatch: "bonus nie dotyczy atakujacych".
- 4 czerwone testy identyczne przed/po (mur-paradoks, auto-battle-simultaneous, battle-loot, pr141-combat-defense-owner-route) nadal NIE_ZMIERZONO przez Ewaluatora; nie dotycza tematu.

TESTY: tsc i reszta bramek jak w 01-operator-r1.md; test glowny 58/0 powtorzony tu z mutacjami (EXIT=0); e2e PRZED/PO jw.
BLOKADY: brak.
RUNDY: 2/5 (obrona)
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
