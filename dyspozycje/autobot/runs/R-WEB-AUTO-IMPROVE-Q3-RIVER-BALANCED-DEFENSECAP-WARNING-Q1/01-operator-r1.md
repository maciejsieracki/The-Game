STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTO-IMPROVE-Q3-RIVER-BALANCED-DEFENSECAP-WARNING-Q1
GOAL: (1) wycinka lasu na/przy rzece takze w K2 „Zrownowazone”; (2) farma na wycietym heksie rzeki BEZ obywatela przy „Tylko pola z obywatelami” ON (K1+K2); (3) likwidacja `defenseCap`; (4) staly wskaznik „Budzet niewydany”.
ZMIANY/COMMIT: baza `57a7ada40` (origin/main). SHA: patrz ostatnia linia (commit z jawnym `git add`, brak push).
- `gra/src/game/auto-improvements.ts`: (1) `riverForestPrepHex` dopuszcza `zrownowazone`; (2) nowe `riverClearedFarmHex` + wyjatek w `hexAllowsKey`/filtrze kandydatow TYLKO dla klucza `farma`; rejestr `autoClearedByMap` (WeakMap po obiekcie mapy, zasilany w opakowaniu `pickAutoImprovements` z kazdego picka `wyrab`); (3) usuniete `defenseCap` i warunek `have >= defenseCap` w FAZIE 0; (4) `AutoImprovementSurplusReport.filterWaitingKeys`, `UnspentBudgetWarning`, `unspentBudgetWarning()`, licznik pol czekajacych za filtrem (po sondzie kandydatow).
- `gra/src/main.ts` (tylko wskaznik): zmienna `playerUnspentBudgetWarning`, liczona co EOT z `playerSurplusReport`; `getUnspentBudgetWarning`/`onUnspentBudgetDisableFilter` w configu HUD; toast nadwyzki wygaszony, gdy wskaznik go zastepuje.
- `gra/src/ui/buildModeHud.ts`: element `.civ-build-unspent` (pod suwakiem „Z puli imperium na prace automatyczna”) + przycisk „Wyłącz filtr”.
- NOWY `gra/tools/auto-improve-q3-test.cjs` (44 asercje, w tym realny render Chromium). Zaktualizowane testy (uzasadnienie nizej): `autoclear-river-forest-priority-test.cjs`, `wyrab-rzeka-d1-test.cjs`, `auto-fort-diag-test.cjs`.
- Run: `dyspozycje/autobot/runs/R-WEB-AUTO-IMPROVE-Q3-.../**` (logi `gate-*`, `mut-*`, `evidence/`).

## Decyzje projektowe / ZALOZENIA
1. (2) Rozwiazanie konfliktu z Q2: prosty wyjatek (kazdy otwarty heks przy rzece) lamal `autoclear-priority-q1`, `autoimprove-stages-q1`, `ai-food-improvement-priority-stages`, bo te testy opisuja sytuacje BEZ wycinki (otwarte pola przy rzece, E1 „zrobione”). Wyjatek zawezony do heksow, z ktorych AUTOMAT wycial las (rejestr po mapie) -> te trzy testy przechodza BEZ zmian (nie trzeba bylo ich „aktualizowac”). Pozostale ulepszenia (trzoda, irygacja, obóz...) nadal za filtrem (test 2b, mutacja M3).
2. Zakres „na/przy rzece” = `onRiverHex` (heks rzeki lub jej sasiad), jak wycinka Q2.
3. OGRANICZENIE (jawne): rejestr nie jest zapisywany w save — po wczytaniu zapisu heksy wyciete PRZED zapisem nie maja wyjatku (wracaja do starej reguly, farma po objeciu przez obywatela). Trwaly znacznik wymaga zmiany w `main.ts` (poza zakresem). Wyciecie reczne i naturalnie otwarte pola wyjatku nie dostaja (test 2e).
4. (2) „Wolno wycinac las” OFF gasi wyjatek (test 2c2, mutacja M6).
5. (3) `JEDEN_NA_ILU_OBYWATELI` ZOSTAJE (uzywana takze przez `lesneMin`, auto-improvements.ts ~1689). `lesneMin` nietkniete: to MINIMUM (tartak+oboz jako warunek wyrebu POZA rzeka w profilach Surowce/Infrastruktura), nie limit liczby na miasto -> nie zmieniano. DECYZJA_WYMAGANA (do orkiestratora, bez ABC ode mnie): czy wlasciciel uwaza i to za „limit na miasto”.
6. (3) Zostaje jeden pick na klucz na wywolanie FAZY 0 (rozlozenie w czasie), budzet Pracy, zwloka `plonoweWPromieniu >= pop`, `qualifies` (`isOutpostPlacementAllowed`) i inkluzja kol U-3. Konsekwencja zmierzona na fixture (pop 5, 44x44 rownina, Praca 100000, 12 wywolan): 11 posterunkow + 12 fortow (PRZED: 1+1). Realny sufit = budzet; zachowanie w zywej grze NIE_ZMIERZONO (profile Surowce/Infra).
7. (4) Warunek wskaznika: `!anyCandidate && !deficitActive && filtr ON (efektywny dla >=1 miasta auto) && pula > rezerwa (30) && >=1 pole czeka za filtrem`; liczone od nowa co EOT (znika sam). Dotyczy profili, w ktorych picker nie znalazl kandydata (nie tylko `surplus` K2). Wskaznik zalezy od EOT: po wczytaniu zapisu pojawi sie po pierwszej turze. Przycisk wylacza filtr na poziomie PANSTWA; gdy miasto ma wlasny override filtra, przycisk go nie zmieni (NIE_ZMIERZONO).
8. K1 (profil Zywnosc) nie ma „raportu nadwyzki” w sensie `surplus`, ale wskaznik dziala dla kazdego profilu z `workedKeys` (K1 tez).

## TESTY
- RED (kod sprzed zmian, `AUTO_Q3_SRC_DIR=/dev/shm/q3pre/gra/src`): 19 OK / 12 FAIL, EXIT=1 (`gate-RED-auto-improve-q3-test.txt`). Padaja: wycinka K2, farma po wycince (K1/K2), brak limitu fortow, eksport `unspentBudgetWarning`, cala sekcja UI.
- GREEN (po): 44 OK / 0 FAIL, EXIT=0 (`gate-GREEN-...`). Prawdziwy `pickAutoImprovements`, realny `createBuildModeHud` w Chromium (`/opt/pw-browsers/chromium`, `--no-sandbox --headless=new`): wskaznik jest, tekst dokladnie „Budżet niewydany: włączony filtr „Tylko pola z obywatelami” (7 pól czeka). Wyłącz filtr, by go wydać.”, pod suwakiem, klik przycisku wywoluje callback i wskaznik znika, jeden element przy wielu renderach, 320 px bez poziomego przewijania (doc 320, panel 268/268), 0 bledow strony. Zrzuty: `evidence/q3-wskaznik-niewydany-320.png`, `-900.png`, `q3-wskaznik-zniknal-320.png`.
- Mutacje (`mut-*.txt`, wszystkie CZERWONE EXIT=1): M1 przywrocony defenseCap; M2 K2 bez wycinki rzecznej; M3 wyjatek dla kazdego klucza; M4 wyjatek dla kazdego otwartego pola (brak rejestru); M5 wskaznik ignoruje filtr; M6 wyjatek farmy mimo skipWyrab; M8 UI bez wskaznika. M7 (wyjatek farmy w profilach Surowce/Infra) = mutant ROWNOWAZNY: te profile nie maja `farma` na liscie (auto-improvements.ts:146-153), wiec zawezenie jest tylko jawnym zakresem.
- Zaktualizowane testy (nie oslabione):
  * `autoclear-river-forest-priority-test` d4: kodowalo zawezenie K2 z Q2 -> odwrocone (K2 wycina las rzeczny; las bez rzeki poza polami obywateli nadal nie). e2 pin „ON: 0 farm” (znane ograniczenie Q2) -> ta sama, silniejsza asercja dla ON i OFF (kazda wycinka konczy sie farma). 20 OK.
  * `wyrab-rzeka-d1-test` kontrola 2: fixture zawsze ma las NA rzece bez obywatela; asercja „zaden wyrab” liczy teraz wyrab POZA rzeka (cel: minimum lesne), plus nowa asercja wyrab rzeczny K2. 3 passed.
  * `auto-fort-diag-test` C: asercja „posterunek w kole obcego fortu” byla artefaktem pulapu (cap blokowal `fort` przy istniejacym forcie). Test izoluje posterunek jawnie (bez techu Wojskowosc): obcy fort nie blokuje, wlasny blokuje — pelna sila zachowana; dziala tez na kodzie PRZED. 18 passed.
- Regresje PRZED vs PO (logi `gate-PRE-*`/`gate-PO-*`): ai-food-improvement-priority-stages, ai-improvements, auto-fort-claim, auto-fort-diag, auto-improve-no-item-cap, auto-improvements, autoclear-priority-q1, autoclear-river-forest-priority, autoimprove-stages-q1, farma-nie-w-lesie, food-hodowla, fort-outpost-hard-territory, fort-outpost-placement-rules, fort-strazniaca-zasieg-zakladania, hodowla-las, oboz-lowiecki-wymaga-tartaku, wyrab-rzeka-d1/krok0/r2, ai2-heks-po-heksie, civ-ai-allocation: EXIT=0 PRZED i PO. `oboz-lowiecki-las`: EXIT=1 PRZED i PO, identyczny zestaw 19 FAIL (md5 linii FAIL zgodne) — istniejace na bazie.
- tsc `--noEmit`: EXIT=0 (`gate-tsc.txt`). `git diff --check` czysty.
- POMIAR NA ZYWO (Chromium, bundle vite z kopii w /dev/shm PRZED=origin/main i PO, harness `tools/autoclear-priority-live-test.cjs` bez zmian, ta sama mapa, stolica 29,49 pop 1, wolno=ON, onlyWorked ON, pula 300, 33%, 15 tur; `evidence/live-*.json`), 0 bledow strony:
  | | ulepszenia (bez wycinek) | wycinki | farmy | pula po 15 turach |
  | K1 PRZED | 8 | 22 | 3 | 160 |
  | K1 PO | 10 | 22 | 9 | 51 |
  | K2 PRZED | 9 | 0 | 2 | 66 |
  | K2 PO | 7 | 9 | 2 | 26 |
  K1 PO: farmy na wycietych heksach bez obywatela (np. 26,49 26,51 25,49 25,51 25,52 26,52) w t3-t6 zamiast trzody/irygacji-tylko; pula niewydana 160 -> 51. K2 PO: wycinka 9 heksow w t5 (PRZED 0); farm na wycietych heksach w 15 turach NIE zaobserwowano — pula K2 (<=59) x 33% < koszt farmy, wiec budzet, nie filtr (NIE_ZMIERZONO dluzszy przebieg). Wiring wskaznika (`main.ts` -> HUD) NIE zweryfikowany na zywo (brak naturalnego stanu `!anyCandidate` w 15 turach); zweryfikowane: tsc + realny render komponentu + czysta funkcja na prawdziwym raporcie pickera.

## BLOKADY
Brak. Nie uruchamiano `npm run build/dev` w `gra/`; bundle przez vite z kopii poza repo (/dev/shm). Zero zmian w `gra-robocza/**`, `WERSJE.md`, `rust-port/**`.

## NIE_ZMIERZONO / DO EVALUATORA
- Persist rejestru wyciec po save/load (pkt 3); zywy fort/posterunek bez limitu (pkt 6); wskaznik live w main.ts; override filtra per miasto vs przycisk panstwa; dluzszy przebieg K2.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r1) tego samego ID.
DEPLOY/PUSH: NIE WYKONANO
