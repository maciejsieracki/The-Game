# R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX) — Final Control, runda 2/5

STATUS: FAIL
DOMAIN: GAME (integralnosc zapisu, priorytet 1)
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1
GOAL: znalezc przyczyne B != A po wczytaniu zapisu i naprawic (B == A przez 6 tur). NIE OSIAGNIETE.
ZMIANY/COMMIT: kandydat 9f7e7f6cd; baza 9d6750a73 jest przodkiem (git merge-base --is-ancestor: OK). git diff --stat baza..kandydat: 2 pliki, 117 wstawien, oba w dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1/ (10-operator-claude.md, 30-obrona-claude.md). Zero zmian w gra/ (git diff --name-only baza..kandydat -- gra = 0 plikow). Allowlista zachowana, ale poprawki kodu brak.

## Ocena zarzutow (bez etykiet rol)
1. Brak poprawki kodu, B != A trwa: SLUSZNY. Kandydat to wylacznie raport; cel nieosiagniety. NAPRAW.
2. Brak potwierdzonej diagnozy: SLUSZNY. Eksperyment r2 odrzucil hipoteze "tylko hexy" (B nadal != A od t4); przyczyna nieznana. NAPRAW (bisekcja stanu poza zapisem).
3. Brak testu continuity, zgodnosci wstecznej, mutacji czerwonej, istniejacych testow zapisu: SLUSZNY. NAPRAW (po znalezieniu przyczyny).
4. Brak dokumentu analizy: SLUSZNY. NAPRAW.
5. Bramki nieuruchomione: formalnie sluszny; dla commita bez zmian gra/ wynik bramek = wynik bazy (brak regresji kodu), ale wymog dispatchu niespelniony. ODDAL (uwaga); wymog wraca w rundzie z kodem.
6. Artefakt harnessu vs realny blad: SLUSZNY i dobrze rozpoznany przez obrone (restoreJson omija mapSnapshot; wczytanie z pauzy w tej samej grze nie odbudowuje mapy). Wymaga testu przed zmiana zachowania. ODDAL jako osobny kandydat BLAD-GRY.

## Odpowiedzi obrony
Obrona przyjela zarzuty 1-6 i uczciwie oznaczyla NIE ZMIERZONO. Wartosc dodana: pomiar r2 (cfg max, seed 4242, zapis po t3, K=6: B != A w t4-t9; nUnits zgodne 49/60/65/74/74/91; przyrost lenNoPP t3->t4 identyczny 1834; stala roznica 2730 to reprezentacja) i odrzucenie hipotezy hexow. To postep diagnostyczny, nie spelnienie celu.

## TESTY (wlasne)
tsc, 5 bramek referencyjnych i testy tematu NIE URUCHOMIONE: kandydat nie zmienia gra/ (kod identyczny z baza 9d6750a73), a test tematu nie powstal. Pomiary obrony przyjete jako deklaracja, nie powtorzone przeze mnie (NIE ZMIERZONO niezaleznie).

## BLOKADY
Przyczyna B != A nieznana; wymaga bisekcji stanu poza zapisem: zrzut map per wlasciciel i cache (aiSkarbiecByOwner, aiPracaPoolByOwner, aiNaukaPoolByOwner, aiBadanaByOwner, ownerDefaultPodzialPracy, citizenUpkeepByOwner, empireFoodStates, goldDeficitStates, territoryHexCountMemo, aiDiploRatesCache, aiDiploTyAll, lastCityKulturaTick, aiWonderPracaTickByCity) w A po t3 vs B po restore, albo ustawianie podzbiorow w B hakiem testowym. Mozliwy JEDEN hak read-only w bloku civTest.

## UWAGI-DLA-ORKIESTRATORA
- Runda 3: Operator ma robic bisekcje zrzutem stanu, nie kolejne hipotezy z odczytu kodu. Warunek Sonneta (2 nieudane rundy Haiku tego samego tematu) jest spelniony po r2, wymaga pisemnego uzasadnienia w dispatchu.
- Osobny kandydat BLAD-GRY: wczytanie z pauzy w tej samej grze (loadNeedsMapRebuild=false) nie odbudowuje mapy; do potwierdzenia testem.
- Przyczyna moze byc niedeterminizmem swiezej sesji, a nie brakiem pol zapisu (dispatch to przewiduje).

RUNDY: 2/5 (FC: FAIL; ostatni Evaluator FAIL, obrona BLOCK; decyzja wymagana: NIE)
NASTEPNY KROK: runda 3 do TEGO SAMEGO ID, baza = kandydat 9f7e7f6cd (lub main), Operator -> Evaluator -> Obrona -> FC.
DEPLOY/PUSH: NIE WYKONANO
