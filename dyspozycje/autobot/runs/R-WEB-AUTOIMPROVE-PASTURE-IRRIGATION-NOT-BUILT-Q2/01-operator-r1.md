STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — auto-ulepszenia terenu
TEMAT: R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2
GOAL: trzoda i irygacja stawiane na polach obywateli przy rzece; trzoda także poza rzeką; reguła „tylko pola obywateli” bez zmian.
RUNDY: 1/5

## Diagnoza (realny przepływ)
1. Zywa gra: bundle gra-robocza/Gra-ROBOCZA.html (07503d86) w Chromium, `?civTest=1`, mapa Malenki seed 18, 7 miast, Zrownowazone 33%, pula 3000, realne `endTurn` (main.ts:38389 -> pickAutoImprovements). Po 26 turach pola obywateli przy rzece: 20x [farma+bydlo+irygacja] + kolejne warianty z gliniankami/drogami; 0 pol przy rzece bez farmy/trzody poza 1 w kolejce. Czyli przy domyslnych ustawieniach i niezalezna od liczby miast przeplyw DZIALA — tej wersji nie udalo mi sie odtworzyc w stanie z zrzutu (NIE_ZMIERZONO: zapis wlasciciela / 26 miast / brazowe tech).
2. ZNALEZIONA I ODTWORZONA przyczyna blokady calosci (auto-improvements.ts, `pickAutoImprovementsStaged`, dawna sonda ok. :1002): „etap czeka na Prace” liczyl kandydatow z budzetem nieograniczonym i `getPracaBudgetPercent: undefined`, ignorujac miasta z efektywnym % puli = 0. Jedno takie miasto mialo „cel” w E1/E2, przebieg rzeczywisty go nie budowal, `earlierStageIsPending` wstrzymywal WSZYSTKIE nizsze etapy WSZYSTKICH miast (E3 trzoda, E4 irygacja, E5). Pomiar (picker + dane jak main.ts, 6 miast, 30 tur): pula 2525 -> 3725, 0 pickow od tury ~10, tylko farmy (dokladnie objaw „same farmy, duza niewydana pula”).
3. Pierwsza bramka odrzucajaca trzode POZA rzeka: `keyBlockedOnHex` (auto-improvements.ts ~:1957, dawne `!onRiverHex` dla bydlo/owce/lama). Irygacja poza rzeka: `qualifies` -> `isRiverAdjacent` + data/terrain-improvements.json `irygacja.warunek` („TYLKO pole sasiadujace z rzeka lub na rzece”) — NIE dopuszczam (reguła danych, nie bug). Mapowanie rzeki: `onRiverHex` = `isHexNearRiver` (UNIFY) spojne z qualifierem, brak rozjazdu.
4. Bisect po wskazanych commitach: NIE WYKONANO — nie znaleziono regresu na domyslnym przeplywie (zywa gra buduje), a przyczyna z pkt 2 jest strukturalna (sonda), nie wprowadzona jednym commitem.

## Zmiany
- gra/src/game/auto-improvements.ts: (a) wspolna `unlimitedBudgetProbe` + `cityMayBuild` — sonda „pending” pomija miasta z % = 0 (4 miejsca: etapy, sciezka zapasowa, niedobor, fort; fort zachowuje swoj surplusReport); (b) `keyBlockedOnHex`: bydlo poza rzeka dozwolone na farmie tego heksa, owce/lama bez wymogu rzeki (rzeka nadal PRIORYTETEM w `orderedHexes`: na rzece < przy rzece < reszta); usuniety martwy warunek w `rzekiDoZagospodarowania`; komentarz E3.
- NOWY gra/tools/autoimprove-pasture-irrigation-q2-test.cjs (11 asercji, produkcyjny picker + workedHexCoordsForCity + lostToSibling + realna mapa generatora): (a) rzeka: 87/87 pol z farma ma trzode i irygacje; (b) poza rzeka: 6/6 farm ma trzode, 0 irygacji poza rzeka (94/94 irygacji przy rzece); (c) 0 ulepszen zywnosciowych poza polami obywateli; (d) miasto 0% nie blokuje pozostalych (81/81). Na kodzie sprzed naprawy: 9 OK / 2 FAIL ((b) 0/6, (d) 0/81) — pada.
- Testy kodyfikujace stara regule „trzoda tylko przy rzece” zaktualizowane z uzasadnieniem w komentarzach: autoimprove-irrigation-after-farms-test (B: irygacja 0, trzoda >0), wyrab-rzeka-r2-test (#5), ai2-heks-po-heksie-test, auto-improve-q3-test (fixtura: farma+bydlo), auto-fort-claim-test (fixtura: farma+bydlo).

## Testy
tsc --noEmit: 0 bledow. logic-test 213/213. ai-test 274 OK / 20 FAIL (bez zmian wzgledem bazy, ROBOCZA manifest). Autoimprove: stages-q1 299/0, irrigation-after-farms 42/0, river-forest-first 12/0, no-citizen-unit 17/0, ai-improvements 56/0, ai-food-priority-stages 13/0, ai-food-only-worked 69/0, hodowla-las 113/0, irrigation-river-unify 30/0, simple-food-rule 36/0, auto-improvements 46/0, no-item-cap 15/0, percent 28/0, autoclear-priority 60/0, wyrab-rzeka-d1/krok0/r2 OK, auto-improve-q3 41/0, ai2-heks 39/0, autobuild-toggle 39/0, oboz-lowiecki-las 94/0, farma-nie-w-lesie 138/0, production-overflow 213/0. Bez zmian wzgledem bazy (te same FAIL na HEAD): praca-jeden-podzial-kontrakt 2 FAIL, ai4-popyt-obywatele 17 FAIL, auto-fort-claim 2 FAIL.

## Blokady / uwagi
- NIE_ZMIERZONO: zywa weryfikacja KODU PO NAPRAWIE w Chromium (wymaga buildu vite; zabroniony w gra/). Zywa gra zmierzona tylko na bundlu sprzed naprawy.
- Brak dowodu, ze to dokladnie ta przyczyna dala zrzut Aten (26 miast): odtworzona klasa blokady (suwak miasta 0%) jest realna i naprawiona; jesli u wlasciciela miasta maja niezerowe %, Evaluator/FC powinien zażądać zapisu gry do odtworzenia.
- Poza rzeka bydlo wymaga farmy (kolejnosc farma -> trzoda); owce/lama (wzgorza) bez farmy. ZALOZENIE udokumentowane w kodzie. Zero DECISION_REQUIRED.
- Zmiana dotyczy tez AI (ten sam picker); ai-test bez nowych FAIL.

## Zmiany/Commit
SHA: patrz commit na gałęzi worktree (jawny git add: auto-improvements.ts, 6 testow, ten raport). DEPLOY/PUSH: NIE WYKONANO.
NASTEPNY KROK: Evaluator (zweryfikowac sonde + test, ewentualnie zywa weryfikacja po buildzie poza repo).
