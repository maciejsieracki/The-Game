# Decyzje właściciela 2026-10-31 — auto-ulepszenia, centrum miasta, forty, zapis (rejestr przekazania do operatorów)

Cel pliku: jedno miejsce, w którym widać KAŻDĄ decyzję właściciela z tej sesji, temat, który ją wdrożył, SHA i status w ROBOCZEJ. Źródło: czat właściciela; dispatche: `dyspozycje/autobot/runs/<ID>/00-dispatch.md`.

| # | Decyzja właściciela | Temat / dispatch | Wdrożone (SHA / ROBOCZA) | Status |
|---|---|---|---|---|
| 1 | Kolejność żywności przy rzekach: farma na heksie bez lasu → wycinka + farma → trzoda (heksy przy rzece z obywatelem) → irygacja; potem poza rzeką wycinka + farmy | R-WEB-AUTOIMPROVE-STAGES-Q1 (E1–E5) | `8e2e8ae2f`, ROBOCZA `bdd45872` | WDROŻONE |
| 2 | „Wolno wycinać las” + „tylko z obywatelami” działają razem (iloczyn); bez obywatela nie budujemy | j.w. (D2) | j.w. | WDROŻONE |
| 3 | Wycinka przy rzece bez progu lasu i bez wymogu tartaku/obozu; tam, gdzie stoi tartak, las nie jest wycinany | j.w. (D1, ABC-3=B) | j.w. | WDROŻONE |
| 4 | Trzoda nie wymaga złoża ani zasobów; trzoda i owce NIE na lesie (blokada zostaje); lama na lesie zostaje | j.w. (Q1, ABC-2=B, ABC-E=A) | j.w. | WDROŻONE |
| 5 | Trzoda i irygacja poza limitem % puli Pracy; rezerwacja budżetu na najdroższą pozycję | j.w. (Q2=B, ABC-6=A) | j.w. | WDROŻONE |
| 6 | Profil „Żywność”: tylko żywność, bez odwołań do niedoborów, bez tartaku i obozu | j.w. (ABC-1, ABC-A=C) | `91abebc39`, ROBOCZA `dcbf2d10`/`bdd45872` | WDROŻONE |
| 7 | „Zrównoważone” gracza = dokładnie te same zasady co AI; niedobór przestawia priorytet na brakujący surowiec, po zaspokojeniu powrót do żywności | j.w. (K2=K3, parytet) | j.w. | WDROŻONE |
| 8 | Tartak tylko przy niedoborze drewna; obóz tylko na heksie z tartakiem | j.w. (ABC-B=B) | j.w. | WDROŻONE |
| 9 | Próg niedoboru zostaje „<10 szt.” (pomiar: aktywny w 100% tur) | R-WEB-LIVE-MEASURE-CLEARING-DEFICIT-Q1 | pomiar `3e26efc64` | BEZ ZMIAN KODU (decyzja A) |
| 10 | AI bez limitu 1 budowa/miasto | R-WEB-AUTOIMPROVE-STAGES-Q1 (ABC-D=B) | ROBOCZA `bdd45872` | WDROŻONE |
| 11 | Niedobór otwiera TYLKO ulepszenia brakującego surowca (bez dróg/fortów/posterunków z „reszty listy”) | R-WEB-AUTOIMPROVE-STAGES-Q1 R4 | `551f7ae4b`, ROBOCZA `3feaf884` | WDROŻONE |
| 12 | Centrum miasta = zwykły heks (farma/trzoda/irygacja/inne; tartaku nie ma, bo nie ma lasu); zastępuje wcześniejsze F=A | j.w. R4 | j.w. | WDROŻONE |
| 13 | Drogi dopiero po zaspokojeniu żywności i surowców (nie zakazane, najniższy priorytet) | j.w. R4 | j.w. | WDROŻONE (ABC o niedoborze bez możliwego ulepszenia otwarte, domyślnie A) |
| 14 | Miasto automatycznie wycina las pod sobą (też stare zapisy, presety, granica tury) | R-WEB-CITY-CLEARS-FOREST-Q1 | `9f6dd193f`, ROBOCZA `bdd45872` | WDROŻONE |
| 15 | Posterunek r=3, fort r=5 = twarde terytorium jak miasto; obcy nic nie zbuduje; limit miast nie dotyczy; cenne tereny (góry) pod przyszłe surowce | R-WEB-OUTPOST-FORT-TERRITORY-Q1 R1–R3 | `5aa6fe127`, ROBOCZA `3feaf884`/`e20eea75` | WDROŻONE |
| 16 | Zdobycie fortu: wejście wojska na heks w stanie wojny (z terytorium); w pokoju nie wolno; armia właściciela = trzeba wygrać bitwę | j.w. (Q-A) | `5aa6fe127`, ROBOCZA `e20eea75` | WDROŻONE |
| 17 | Spór dwóch fortów: wcześniejszy fort; zdobyty fort zachowuje wiek; fort w obcym terytorium zablokowany | j.w. (Q-B, Q-C, Q-F) | j.w. | WDROŻONE |
| 18 | Bitwa dwóch wojowników bez wodza nie stoi w miejscu | R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1 | `4bbf752f9`, ROBOCZA `76516344` | WDROŻONE |
| 19 | Przegrana po utracie ostatniego miasta (także na rzecz barbarzyńców) | R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 | `7f19b499d`, ROBOCZA `dcbf2d10` | WDROŻONE |
| 20 | Rozejm AI na stole i zapis w rozejmie | R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1 | `fbdec50e0`, ROBOCZA `dcbf2d10` | WDROŻONE |
| 21 | Spichlerz z JSON + podgląd w panelu miasta | R-WEB-SPICHLERZ-DRAIN-KEYS-Q1, -HUD-PARAMS-Q1 | `37148c80a`, `905ffeb0e`, ROBOCZA `76516344`/`8bad46d9` | WDROŻONE |
| 22 | Pula Pracy w zapisie: naprawić, nie zerować | R-WEB-SAVELOAD-PRACA-POOL-Q1 | w toku (runda 1) | W TOKU |
| 23 | Po zakończeniu: merge do main + deploy do ROBOCZEJ + push (stała zgoda; tematy webowe) | LEDGER.md | — | OBOWIĄZUJE |

## Otwarte (czekają na właściciela)
- Drogi przy trwałym niedoborze bez możliwego ulepszenia/miejsca (A: po limicie tartaków — dziś; B: po zaspokojeniu; C: po N turach).
- Czy automat (gracz „Zrównoważone”, AI) ma sam stawiać forty/posterunki, by zajmować cenne tereny (góry pod surowce) — dziś nie stawia z listy niedoboru; AI ma osobną ścieżkę `planExpansionFortBuilding` (nietknięta).
- Znacznik „Agresor” na liście HUD, filtr „Inne cyw.”, kontrast obwódek, niepokój po cesji miasta (wstrzymane wcześniej).

## Aktualizacje (po pierwszym zapisie)
- **24 (ODWOŁUJE #5 i ABC-R5-3):** ustawiony procent budżetu Pracy na auto-ulepszenia jest TWARDYM SUFITEM — żaden krok automatu (żywność, niedobór, trzoda, irygacja, drogi, AI) nie wydaje więcej niż procent; bez mnożników, bonusów i wyjątków. Wdrożenie: R-WEB-AUTOIMPROVE-STAGES2-Q1 (w toku).
- **25:** niedobór bez limitu liczby ulepszeń brakującego surowca (stare ECHO „1 na 10 obywateli” nieaktualne); tartak/obóz nie na heksie rzeka+las (we wszystkich profilach automatu); farma ma pierwszeństwo na lesie pod farmę. R5 `a6bd3712c` + STAGES2 (w toku).
- **26:** pula Pracy zachowana przy wczytaniu zapisu — ROBOCZA `871276f8`.
- **27:** automat (gracz „Zrównoważone” i AI) ma sam zajmować cenne tereny fortami (górskie złoża), gdy limit miast wyczerpany — temat po STAGES2 (kolejka).
