STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-ANALYSIS-Q1
GOAL: Lancuch Palisada -> Mury kamienne -> Mury ceglane: w miescie najwyzej jedna fortyfikacja, awans przez "Ulepsz" zastepuje poprzednika, zero podwojnego/potrojnego kosztu i utrzymania. Ten temat = analiza + test odtwarzajacy, bez zmian kodu gry.
ZMIANY/COMMIT: gra/tools/fortifications-stack-repro-test.cjs (rozszerzony: sekcje 1b, 2b, asercja P4), ten raport, evidence/*-r2.txt. Brak zmian w gra/src/**, JSON danych, WERSJE.md, rust-port. Start od 8ae4bb21b. SHA koncowy w polu sha odpowiedzi (commit zawiera ten raport).
TESTY (surowe wyjscia w evidence/*-r2.txt): fortifications-stack-repro-test 28 OK / 0 FAIL (bylo 22); tsc --noEmit rc=0 (plik pusty); logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
BLOKADY: brak
RUNDY: obrona po rundzie 1/5
NASTEPNY KROK: Final Control; potem pytania ABC do wlasciciela (10-operator-claude.md sekcja 5, uzupelnione nizej o L2)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (maksPoziom=2, kolizja z "Ulepsz", L2 pominiete) -- PRZYJMUJE
Dowod (test sekcja 1b, evidence/fortifications-stack-repro-r2.txt): poziom budynku NIE jest zapisany per miasto, tylko wyliczany z epoki (`buildingLevelForEpoch`, production.ts ~l.286: poziom = epoka - epokaWejscia + 1, ciety do maksPoziom). Dlatego:
- Nie ma "resetu poziomu" przy awansie lancucha: poziom nowego budynku wynika z biezacej epoki miasta (awans kamienne->ceglane w epoce 3 daje od razu mury L2). Asercje Z1-Z3.
- Poziomy: palisada zawsze L1; mury_kamienne L1 w epoce 1, L2 od epoki 2; mury L1 w epoce 2, L2 od epoki 3.
- Koszty efektywne (Praca) i utrzymanie zl wg poziomu: palisada 22 / 2; kamienne L1 35 / 4, L2 47 / 6 (surowce utrzymania po 3); ceglane L1 70 / 8, L2 94 / 12 (surowce utrzymania po 3). Koszt surowcowy budowy (`buildingStockCost`) nie zalezy od poziomu: 120 drewna / 160x3 / 320x3 (jak w raporcie 10).
- Wariant A (roznica) dla L2: palisada->kamienne L2 = 25 Pracy (47-22) + 40 drewna + 160 kamienia + 160 cegly; kamienne L2->ceglane L2 = 47 Pracy (94-47) + 160/160/160. Wariant B bez zmian (pelny koszt nowego: 47 i 94 Pracy). Wariant C = B minus 50% zastepowanego, wg poziomu zastepowanego budynku.
- Utrzymanie L2 (stan docelowy, jedna fortyfikacja): kamienne L2 6 zl, ceglane L2 12 zl (L1: 4 i 8). Tabela "przed/po" w raporcie 10 dotyczy L1; dla L2 relacja jest ta sama: przed = po, zmienia sie tylko legacy (trzy naraz: 2+6+12=20 zl wobec 12 zl po migracji w epoce 3).
- Kolizja z istniejacym "Ulepsz": ISTNIEJE i trzeba ja rozstrzygnac. W epoce >=2 stojace mury_kamienne L1 maja dwa rozne "awanse": (i) Ulepsz poziomu tego samego id (L1->L2, `buildUpgradeCandidates` auto-manage.ts ~l.284-310 i sekcja "Ulepsz" w cityPanel.ts) oraz (ii) awans lancucha na `mury` (upgradeFrom). Oba pobieraja dzis pelny koszt surowcowy. Rekomendacja do implementacji (nie wybierana tu): w UI rozdzielic etykiety ("Ulepsz poziom" vs "Awansuj na Mury ceglane"), a w wariancie A liczyc roznice kosztu z uwzglednieniem poziomu zastepowanego budynku. To zostaje dopisane jako pyt. 5 do orkiestratora (nie zmienia kodu; do decyzji razem z pyt. 1).

### Zarzut 2 (koszt sumowany recznie, nie faktyczne potracenie) -- PRZYJMUJE
Poprawka: dodana sekcja 2b testu, ktora wywoluje PRAWDZIWE `deductBuildingStockCostAcrossCities` (building-stock-cost.ts l.255, ta sama funkcja co main.ts l.4783/4911/9924) na dwoch miastach z zapasem 1000 kazdego surowca i trzech etapach po kolei. Wynik (surowe): `realnie pobrane z magazynow: drewno=600 kamien=480 cegla=480`; asercja F1 [OK]. Potwierdza O2 na faktycznym odjeciu, nie tylko na cenach. Pozostaje poza zasiegiem testu silnika sam handler kolejki w main.ts (nie importowalny bez UI); jego wywolania wskazane numerami linii wyzej; NIE_ZMIERZONO w zywej grze (Chromium nie uzyty, jak w raporcie 10).

### Zarzut 3 (parytet gracz/AI tylko regexem; logika AI kamienne->ceglane pominieta) -- PRZYJMUJE CZESCIOWO
- Doprecyzowanie analizy AI (ai.ts l.2018-2019 i l.2058-2059): obie sciezki (obrona przy zagrozeniu oraz boost) dodaja kandydata tylko gdy NIE stoi ani `mury`, ani `mury_kamienne` (warunek `!built.includes('mury') && !built.includes('mury_kamienne')`). Wyrazenie `built.includes('mury_kamienne') ? 'mury' : 'mury_kamienne'` jest wiec w tych miejscach w praktyce martwe: te sciezki AI nigdy nie wybieraja ceglanych po kamiennych ani nie dokladaja drugiego etapu. Dodana asercja P4 (regex, oznaczona w ttescie jako pinezka zrodla).
- Konsekwencja dla opcji (a)/2B: wprowadzenie `upgradeFrom` zmieni AI tylko przez wspolna dostepnosc (`availableProduction` / `isBuildingSupersededByUpgrade`); sciezki ai.ts l.2018/2058 trzeba przepisac, jesli AI ma awansowac kamienne->ceglane (dzis tego nie robi tymi sciezkami). To dopisane do ryzyk opcji (a) i do punktu (d) raportu 10.
- ODRZUCAM zadanie uruchomienia ai-buduje-budynki w tym temacie: dispatch zabrania zmian poza allowlista i wymaga testu odtwarzajacego silnika; test AI "ai-buduje-budynki" nalezy do tematu implementacji (opcja (a)/(b)), gdzie jest zmieniane zachowanie AI. Parytet pozostaje udowodniony na poziomie wspolnych funkcji (P1, P2) + pinezek zrodla (P3, P4), NIE na zywej grze. Zalozenie jawne.

### Zarzut 4 (utrzymanie 8 zl; relacja mury + fort) -- PRZYJMUJE
- Poprawka opisu: utrzymanie zl = floor(floor(baza + przyrost*(poziom-1) * R_STAWKI_FALA2_MULT) * mnoznik epoki) (economy-upkeep.ts l.657-658; R_STAWKI_FALA2_MULT w r-stawki-strojenie.ts). Wartosci 2/4/8 (L1) w raporcie 10 pochodza z funkcji `buildingUpkeep`, wiec sa poprawne; blad dotyczyl wylacznie opisu ("baza 2, mnoznik epoki 2" -- wlasciwie baza x FALA2 mult x mnoznik epoki, mury epoka 2). Liczby bez zmian.
- Relacja mury + fort (Cytadela): `applyCompletedBuildingIds` (production.ts l.884-898) po ukonczeniu `fort` NIE usuwa murow; fort i mury to osobne budynki (fort wymaga muru), a straznik tylko blokuje cofniecie palisady/kamiennych gdy stoi fort. Czyli "jedna fortyfikacja" dotyczy wylacznie lancucha palisada/kamienne/ceglane; Cytadela (fort) i Baszta poza zakresem lancucha i mury+fort stoja razem. Do potwierdzenia przez wlasciciela w pyt. 2 (czy Cytadela ma zastepowac mury) -- NIE wybierane tu; jesli wlasciciel chce traktowac fort jako czwarty szczebel, to osobna decyzja.

## Pytania do wlasciciela (po obronie; uzupelnienie sekcji 5 raportu 10)
5. "Ulepsz poziom" a "Awansuj na wyzszy mur" -- w epoce 2+ mury_kamienne maja dwa awanse. Rekomendacja A: dwie osobne etykiety, koszt awansu lancucha liczony wg poziomu zastepowanego budynku; B: awans lancucha mozliwy tylko z maksymalnego poziomu zastepowanego (kamienne L2 -> ceglane); C: jak dzis (bez rozroznienia).
6. Cytadela (fort): ma zastepowac mury (czwarty szczebel) czy zostaje osobnym budynkiem obok murow (A, rekomendacja: zostaje osobna)?
(Pytania 1-4 bez zmian z raportu 10.)
