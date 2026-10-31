STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-STAGES-Q1
GOAL: K2/K3 niedobor otwiera tylko ulepszenie brakujacego surowca; drogi po zywnosci i surowcach; centrum miasta zwyklym heksem (K1/K2/K3).
ZMIANY/COMMIT: ostatni commit kodu/testow `225b339cc` (Obrona R4, nad `d601f293b` i `552537fe8`), baza `origin/main` `d8b2766b4`. Allowlista zgodna: ai.ts, auto-improvements.ts, 5 testow gra/tools, katalog runu; main.ts bez zmian; `git diff --check` czysty. SHA koncowy do integracji: commit zawierajacy ten plik (nad `225b339cc`, tylko katalog runu). Poprzedni raport FC rundy 3 (`03-final-control.md`) zostaje bez zmian.
TESTY (odtworzone samodzielnie na 225b339cc): autoimprove-stages-q1 184/0, auto-improvements 46/0, ai-improvements 53/0, ai-food-improvement-priority-stages 13/0, ai2-heks-po-heksie 37/0, ai4-popyt-obywatele 55/0, ai-ulepszenia-malo-budowane 13/0, city-clears-forest 18/0, hodowla-las 113/0, wyrab-rzeka krok0 3/0, r2 10/0, d1 2/0, tsc EXIT=0. NIE przeuruchomiono (kod bez zmian od przebiegu Operatora/Evaluatora, logi gate-r4-* z EXIT=0): spichlerz-hud-params-parity 66/0, diplomacy 148, war-era-counter 82, ring 15.

WERDYKT PER ZARZUT
1. Brak Chromium: ODDAL. Obrona wykonala realny przebieg (pomiar-r4o-live-chromium-k2.txt, live-r4o-chromium.cjs): centrum dostalo farme/bydlo/irygacje, niedobory dalyl kamieniolom/tartak/warzelnie, zero drog/fortow. NIE_ZMIERZONO (jawnie): wieloturowa wycinka gracza w zywej grze (przelacznik wyrabu nie w DOM).
2. Rozkazy bez obywateli: ODDAL. pomiar-r4o-bez-obywateli-centrum-vs-inne.txt: w scenariuszu A wszystkie 19 to CENTRUM (centrum zawsze pracowane, workedHexCoordsForCity je pomija), drog na heksach nie-centrum bez obywateli 0. Scenariusze B/C pokazuja tartak/oboz na heksach INNYCH bez obywateli: to sciezka AI "surowce wszedzie" (ECHO 2026-09-08), nie drogi. Wpis CENTRUM:tartak=1 w B to artefakt fikstury (produkcyjne centrum nie ma lasu po R-WEB-CITY-CLEARS-FOREST-Q1) — notatka.
3. Drogi przy trwalym niedoborze drewna: DO DECYZJI CZLOWIEKA (realna decyzja produktowa, nieblokujaca). Wdrozone A (drogi startuja po limicie tartakow; scenariusz B: droga=14, droga_brukowana=14). Pytanie ABC zadaje orkiestrator (K2/K3): A jak teraz (rekomendacja), B czekaja na zaspokojenie niedoboru, C po N turach.
4. Fikstura nakladka='brak': ODDAL. Luka pokrycia zamknieta asercja (k3) w autoimprove-stages-q1-test.cjs (centrum z lasem i niedoborem drewna -> tartak jak zwykly heks, K2=K3). Fikstura odwzorowuje produkcje.

WLASNA WERYFIKACJA: diff do allowlisty; bramki jw.; mutacja M1 (usuniecie warunku `stagedPicks.length === 0 && !earlierStageIsPending` w kroku drog) -> 175/4 (zgodnie z logiem Operatora); logi gate-r4-*/gate-r4o-* maja po jednej linii EXIT=. Zmiany oczekiwan w istniejacych testach maja uzasadnienie decyzjami wlasciciela; brak nieuzasadnionego oslabienia.
BLOKADY: brak. Pytania ABC nieblokujace (zadaje orkiestrator): (a) drogi przy niedoborze bez miejsca na ulepszenie (zarzut 3); (b) obrona AI: forty/posterunki w K2/K3 (niezalezna sciezka planExpansionFortBuilding nietknieta).
RUNDY: FC po R4, 0 NAPRAW.
KOLEJNOSC wzgledem origin/rust-port/parity-v2: niezalezne. Temat dotyka tylko gra/ i katalogu runu; origin/main == d8b2766b4 (0 commitow przed baza), parity-v2 jest 773 commity za baza i dotyczy Rusta. Rekomendacja: zintegrowac ten temat do main pierwszy (maly, gotowy), parity-v2 potem, bez zaleznosci.
NASTEPNY KROK: integracja orkiestratora SHA koncowego; READY_FOR_DEPLOY po jego weryfikacji.
DEPLOY/PUSH: NIE WYKONANO
