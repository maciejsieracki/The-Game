STATUS: PASS-WITH-NOTES (DECYZJA_WYMAGANA: brak jezior w generatorze, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-FRESHWATER-ACCESS-LAKE-Q1
GOAL: „dostęp do wody” = wyłącznie słodka woda (rzeka + jezioro, nie morze); wspólna `hasFreshwaterAccess`; ZERO awaryjnego tartaku/obozu na heksach NA rzece i przy rzece (żywność).
RUNDY: 1/5
BAZA: origin/main 38f309b41. Rola: Operator (Sonnet 5.5). Gałąź worktree: worktree-wf_f2e9e549-fb7-1. DEPLOY/PUSH: NIE WYKONANO.

## ZMIANY/COMMIT
SHA: patrz `git log -1` gałęzi worktree-wf_f2e9e549-fb7-1 (commit tego raportu; SHA nie da się wpisać do pliku, który wchodzi do commitu).
Pliki (jawny `git add`):
- NOWY `gra/src/map/freshwater.ts` — `hasFreshwaterAccess`, `hasRiverWaterAccess`, `isFreshwaterReservedHex`, `getLakeHexSet`/`isLakeHex`/`isLakeAdjacent`, `invalidateFreshwaterCache`; cache D6: rzeki per `riverPaths`, jeziora per `map.hexes` (WeakMap). Moduł map (nie `game/`), bo czysty i wołany z `game/`.
- `gra/src/game/turn-economy.ts` — `cityHasWaterAccess` deleguje do `hasFreshwaterAccess` (stary `__riverHexSetCache` przeniesiony); etykieta zdrowia „Jezioro” gdy wodę daje tylko jezioro.
- `gra/src/game/auto-improvements.ts` — `foodReservedHex` w `keyBlockedOnHex` (tartak/obóz) i `hillTartakPending`; komentarz decyzji właściciela przy kodzie.
- NOWY `gra/tools/freshwater-access-test.cjs`.

## (1) POMIAR JEZIOR (gate-lake-measure.txt, 20 map, ziarna 11/222/3333; ziemia 11)
Jezioro = Morze/PlytkieMorze niepołączone wodą z heksem wodnym przy krawędzi mapy (brak osobnego terenu jeziora). Kontynenty/Pangea/Wyspy × Mały/Standardowy × 3 ziarna + Ziemia × 2 rozmiary = 20 map.
WYNIK: map z ≥1 jeziorem = 0/20; heksów jeziora = 0; pozycji startowych (4 780 łącznie) w zasięgu jeziora = 0. Generator NIE tworzy jezior (gen-helpers.ts:4369 usuwa zamknięte jeziora-morze). Pomocniczo: starty z dostępem rzecznym 3 239 / 4 780 (gate-lake-measure.txt, startsRiver per mapa).
UWAGA metody: pierwsza próba liczyła tylko `Morze` i dawała „jeziora” (artefakt: głębokie Morze otoczone PlytkieMorze); poprawiona na Morze+PlytkieMorze (isWaterTerrain, units/setup.ts:682) — wyniki wyżej są z wersji poprawnej.

## (2) TABELA KONSUMENTÓW
| Konsument | Plik:linia | Znaczenie | Decyzja |
|---|---|---|---|
| `cityHasWaterAccess` → kara `zdrowie_kara_brak_wody`, bonus `zdrowie_rzeka` | turn-economy.ts:423, 516, 1930, 2502 | słodka woda | ZMIENIONY (jezioro TAK, morze NIE); 0 różnic vs stara definicja na 2 realnych mapach |
| etykieta zdrowia „Rzeka” | turn-economy.ts:~530 | słodka woda | ZMIENIONY („Jezioro” gdy tylko jezioro) |
| `cityHasCoastOrRiverAccess` (Port/Naval) | main.ts:5276 | „wybrzeże LUB woda” | NIE ruszony: `isCoastalCity` liczy już dowolny sąsiedni heks wodny; poza allowlistą |
| tartak/obóz — blokada | auto-improvements.ts:1681 | rezerwacja pod żywność | ZMIENIONY: `foodReservedHex` = rzeka (także sąsiad z samym `rzeka.obecna`) + jezioro |
| `hillTartakPending` | auto-improvements.ts:1651 | ta sama rezerwacja | ZMIENIONY (spójność, bez zastoju tartaku na wzgórzach) |
| `hasRiverAccess`/`onRiverHex` (priorytety E1–E3, trzoda, wyrąb, sortowanie) | auto-improvements.ts:1174-1193 | rzeka jako priorytet żywności | NIE ruszony (rzeka-only; E2 wycinka+farma bez zmian) |
| `isRiverAdjacent` (irygacja), tooltip irygacji | improvement-build.ts:965, hexContextTooltip.ts:398-421 | rzeka jako obiekt/wymóg irygacji | NIE ruszony; DECYZJA_WYMAGANA: irygacja przy jeziorze |
| `maRzeke` plon heksu | economy.ts:440, okolica.ts:389, cityPanel.ts:9982 | rzeka jako teren (modyfikator plonu) | NIE ruszony |
| `buildings.json` Port („wybrzeże lub rzeka”), Studnia | buildings.json:393-399, 840 | tekst | NIE ruszony (brak jezior; poza zakresem) |

## (6) TARTAK PRZY RZECE
Stan przed zmianą: jedyna ścieżka stawiania tartaku/obozu przez automat to FAZA 1 (auto-improvements.ts:1756 → `keyBlockedOnHex`); FAZA 0 = tylko posterunek/fort, FAZA 2 = tylko wyrąb, sonda = zero picków; AI (`ai.ts:2705`) i gracz idą przez ten sam picker; brak fallbacku „brak innego lasu”. Dla rzeki z `riverPaths` zakaz OBOWIĄZYWAŁ. LUKA: sąsiad z samym `rzeka.obecna` (bez wpisu w `riverPaths`) nie blokował tartaku — poprawiona. Dowód RED na bazie: test pkt (C) 2 i 3 padają (tartak@11,13 oraz @12,14 na bazie). E2 (wyrąb → farma) zachowany (asercja).
Efekt na realnych mapach (gate-real-maps-regress.txt): lasy zarezerwowane 1350→1611 z 2717 (Pangea Mały, 11), 1290→1379 z 1453 (Kontynenty Mały, 222) — to skutek decyzji właściciela, nie regres.

## TESTY (logi gate-*.txt z `EXIT=`)
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- freshwater-access-test.cjs: 35/35 (A: jezioro/morze/rzeka/ujście/N-1,N,N+1; B: zdrowie, 576/576 heksów identycznie ze starą definicją; C: tartak). Mutacja (stare auto-improvements+turn-economy): 6 FAIL — test czerwienieje.
- Regres PASS: autoimprove-stages-q1 302/302, auto-improvements 46, ai-improvements 56, ai2-heks-po-heksie 37, ai-food-priority 13, wyrab-rzeka-krok0/r2/d1, oboz-lowiecki-wymaga-tartaku 16, auto-fort-claim 63, farma-nie-w-lesie 138, hodowla-las 113, city-clears-forest 18, okolica-isworkable 15, wire-ekonomia 37.
- 3 testy FAIL IDENTYCZNIE NA BAZIE (sprawdzone po `git checkout` obu plików; testy czytają tekst main.ts, którego nie ruszałem): ai4-popyt-obywatele (Q2p), tartak-oboz-wyscig-race (wyjątek), naval-water-access-gate. Poza zakresem.
- NIE_ZMIERZONO: żywa weryfikacja Chromium / 20 tur pełnej gry — jezior brak (kryterium warunkowe nie dotyczy); build bundla zabroniony (`gra/`), zgłoszenie dla orkiestratora jeśli wymagane dla zmiany tartaku.
- `node_modules` usunięty po pracy.

## BLOKADY / ZAŁOŻENIA
1. DECYZJA_WYMAGANA (właściciel): generator nie tworzy jezior; zmiana generatora poza zakresem. Funkcja jest gotowa i bez wpływu na wynik (lakeHex=0).
2. ZAŁOŻENIE do akceptacji: heks przy jeziorze = żywność jak przy rzece (rezerwacja tartaka/obozu); bonus zdrowia „Rzeka” przysługuje też za jezioro.
3. ZAŁOŻENIE: sąsiad z samym `rzeka.obecna` liczy się jako „przy rzece” dla rezerwacji (zdrowie pozostaje bajt-w-bajt jak przed zmianą).
4. Irygacja/trzoda przy jeziorze nie zmieniane (improvement-build.ts poza allowlistą) — DECYZJA_WYMAGANA, o ile jeziora kiedyś powstaną.

## NASTĘPNY KROK
Evaluator R1: weryfikacja mutacyjna testu (C), przegląd rezerwacji 1350→1611, ocena założeń 2–3.
