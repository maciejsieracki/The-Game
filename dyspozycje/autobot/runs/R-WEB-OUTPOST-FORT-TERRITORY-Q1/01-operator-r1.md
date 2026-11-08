STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB — `gra/`, nie port Rust)
TEMAT: R-WEB-OUTPOST-FORT-TERRITORY-Q1
GOAL: posterunek (r=3) i fort (r=5) tworzą TWARDE terytorium właściciela jak miasto (obcy nie buduje ulepszeń ani miast; właściciel buduje i rezerwuje pod przyszłe miasta/surowce; limit miast nie dotyka terytorium fortu); decyzja właściciela 2026-10-31 zastępuje Q2=B z 2026-08-09.

## 1. Pomiar stanu DZISIAJ (przed zmianą)
- `gra/src/map/territory.ts` `cityTerritoryRadius`: fort 10, posterunek 5 (stałe).
- `gra/src/main.ts` `buildAllTerritoryNodes` (~l.4581): tylko `cities.map(...)` — forty/posterunki NIE wchodziły do `territoryOwnerAt`, render granic (`refreshTerritoryBorderOverlay` → `collectTerritoryHexKeysByOwner(nodes)`), `isTerritoryHexOwnedBy`, bramek budowy (`assertPlayerTerritoryForBuild`, AI `buildImprovement` ~l.34383) ani ownershipu. Fort działał WYŁĄCZNIE przez `foundingNodesForOwner` (`fort-territory.ts`, `foundingTerritoryOpts` main.ts ~l.10029): miękka rezerwacja prawa założenia miasta. Nagłówek `fort-territory.ts:1-6` (Q2=B: „granice terytorium się NIE przesuwają").
- Obcy: mógł budować ulepszenia w promieniu cudzego fortu (brak węzła terytorium) i zakładać miasto (blokował go tylko brak własnego zasięgu; `canFoundCity` nie sprawdzał obcych fortów).
- Dane: `terrain-improvements.json` fort `zasieg_terytorium` 10 (l.278), posterunek 5 (l.402); `zasieg_pol`/`zasieg_kontroli` 10/5; teksty „promień 10/5 pól"; `decyzje_EKONOMIA` l.8.
- Dowód: baseline logi `gate-pre-*.txt`, `gate2-pre-*.txt`; test nowy czerwony PRZED: `gate-red-before-fort-outpost-hard-territory.txt` (9 passed / 19 failed na źródłach HEAD).

## 2. Implementacja (zmiany)
- `gra/src/map/territory.ts`: `FORT_TERRITORY_RADIUS=5`, `OUTPOST_TERRITORY_RADIUS=3` (`cityTerritoryRadius`), komentarze.
- `gra/src/game/fort-territory.ts`: nowe `fortTerritoryNodes(forts)` (węzły terytorium z fortów; `contestedUseless` NIE tworzy terytorium) i `isHexInForeignFortTerritory(q,r,ownerId,forts,allNodes)`; nagłówek: adnotacja „Q2=B ZASTĄPIONE decyzją 2026-10-31".
- `gra/src/main.ts` (minimalnie): `const fortNodes` przeniesione przed `buildAllTerritoryNodes` (TDZ); `buildAllTerritoryNodes` dolącza `fortTerritoryNodes(fortNodes)` → jedno źródło prawdy dla ownershipu/granic/bramek (gracz, AI, ekonomia okolicy); `foundingTerritoryOpts` blokuje zakładanie miasta w terytorium obcego fortu (literalne `cityNodesForOwner(ownerId)` zachowane — strażnik ai-founding-territory); `registerFortNodeIfNeeded`/`unregisterFortNodeIfNeeded` odświeżają pas granic; backfill przy wczytaniu starego zapisu (forty w `placedImprovements` bez wpisu w `meta.fortNodes` dostają właściciela wg najbliższego miasta i od razu dają twarde terytorium; fort poza zasięgiem każdego miasta zostaje bez terytorium — brak danych właściciela); hak testowy `window.__fortTerritoryTestDebug` (wywołuje REALNE funkcje).
- `gra/data/terrain-improvements.json`: `zasieg_terytorium` fort 5 / posterunek 3, `zasieg_pol`/`zasieg_kontroli` zsynchronizowane (5/3), teksty `warunek`/`uwagi`/`decyzje_EKONOMIA` „teren zabezpieczony… promień 5/3 pól". Karty (`improvementAdapter.ts:188-195`) czytają te pola — bez zmiany kodu.
- Render granic: BEZ zmiany kodu (`territory-border.ts`/`rangeOverlay.ts` rysują granice z węzłów) — dowód w zrzucie.
- Testy: nowy `gra/tools/fort-outpost-hard-territory-test.cjs` (28), nowy `gra/tools/fort-outpost-territory-live-test.cjs` (Chromium, 15); zmienione oczekiwania w `fort-strazniaca-zasieg-zakladania-test.cjs` (A1a 10→5, A1b 5→3, C2 fortRadius 10→5) — uzasadnienie: decyzja 2026-10-31 (`territory.ts` promienie; stara reguła: `fort-strazniaca-...-test.cjs` l.115-116 sprzed zmiany).
- Konflikt reguł: Q2=B (fort-territory.ts:4-6, stary) ZASTĄPIONE decyzją 2026-10-31; reguły 3 (kontestacja) i 4 (przejęcie przy zakładaniu miasta) zachowane bez zmian logiki. Skutek uboczny: budowa fortu w terytorium obcego fortu jest teraz odrzucana przez istniejącą bramkę `rivalCityTerritory` (improvement-build.ts ~l.1070; main.ts ~l.34358), więc ścieżka `contestedUseless` stała się praktycznie nieosiągalna (zostaje jako zabezpieczenie).

## 3. Które budynki wojskowe rozszerzają teren
Tylko `posterunek` i `fort` (jedyne klucze z `zasieg_terytorium`: terrain-improvements.json l.278 i l.402; jedyne rozpoznawane przez `registerFortNodeIfNeeded` main.ts ~l.12778 i `fortNodeAsCityNode`). Obóz łowiecki/inne ulepszenia wojskowe: brak `zasieg_terytorium` — NIE rozszerzają. Lista jest jednoznaczna → bez ABC.

## 4. AI
AI stawia forty/posterunki ścieżką `registerFortNodeIfNeeded` (main.ts ~l.32314 i ~l.34458) → od teraz także tworzą twarde terytorium AI; to samo `buildAllTerritoryNodes`. FAZA 0 w `auto-improvements.ts` NIE edytowana. Skutek na przebiegu długiej symulacji (ile terenu AI zajmie fortami): NIE_ZMIERZONO (poza zakresem; test jednostkowy/hak dowodzi mechanizmu dla owner ≠ gracz: obcy nie buduje, właściciel buduje).

## 5. Limit miast
`cityLimitBase` egzekwuje wyłącznie `canFoundCity` (cities.ts l.~1180). Terytorium fortu liczone jest niezależnie od liczby miast: test `fort-outpost-hard-territory-test` C4/C5/C6 (limit 10/10 blokuje miasto, 91 heksów fortu pozostaje własnością; pod limitem zakładanie w terytorium fortu dozwolone).

## 6. TESTY / bramki (logi w katalogu runa, każdy z jedną linią `EXIT=`)
- tsc --noEmit: PASS (EXIT 0).
- Nowy `fort-outpost-hard-territory-test`: PRZED 9/19 (czerwony) → PO 28/0 (`gate2-post-fort-outpost-hard-territory.txt`, `gate-red-before-...txt`). Mutacje (`gate-mut1..4.txt`): M1 promienie 10/5 → 9 FAIL; M2 powrót do miękkiej rezerwacji (`buildAllTerritoryNodes` bez fortów) → 1 FAIL (strażnik tekstowy E1; zachowanie pada też w live-teście); M3 `fortTerritoryNodes` pusta → 12 FAIL; M4 `foundingTerritoryOpts` bez blokady obcego fortu → 1 FAIL (E2).
- Chromium (headless, vite build do scratch poza repo): `gate-live-fort-outpost-territory.txt` 15/0: fort → 91 heksów gracza przed=0, dist 6 poza; posterunek → 37; obcy: brak budowy ulepszeń (środek i brzeg) i brak zakładania miasta; właściciel buduje, zakładanie nie odrzucone jako „poza terytorium"; zero console.error. Zrzut: `live-fort-border.png` (granica sześciokąta r=5 wokół fortu).
- Bramki PRZED→PO (te same liczby): fort-strazniaca 85/0 (po aktualizacji 3 oczekiwań; przed: 85/0 na starych), fort-nodes-save-load 18/0, improvement-territory-gate 6/0, territory-border 9/0, territory-border-dense 15/0, auto-improvements 45/0, ai-improvements 52/0 (dispatch mówi 53 — baseline na tym branchu = 52, bez zmiany), diplomacy 148/0, map-improvement-qualify 133/0, ai-home-defense-vs-barbarians 42/0, ai-ulepszenia-malo-budowane 13/0, auto-wyzywienie-live-recalc 60/0, city-defense-terrain-gate 34/0, civpedia-ulepszenia-historia-batch 116/0, fortify-pole 41/0, hotseat-etap6d-podetap-b-exec 48/0, trade-routes-hud-filter 59/0, dyplo-kara-granica-realna EXIT 0.
- Czerwone IDENTYCZNE przed i po (pre-existing, niezwiązane): ai-founding-territory 25/1 (B1e-a), tartak-oboz-wyscig-race (błąd uruchomienia), ai2-heks-po-heksie 32/3, grupa-b-lane 44/5, hotseat-etap6d-podetap-d-exec 39/2, okolica-load-reconcile 21/23, okolica-ownership-change-reconcile 12/15, hotseat-etap5-no-leak EXIT 124 (timeout 200 s; A/B PASS).
- NIE_ZMIERZONO / brak plików na tym branchu: war-era-counter 82, ring 15, autoimprove-stages-q1, city-clears-forest 18/0, defeat-last-city 14/0, ai-test 274/20 (pliki testów nie istnieją w `gra/tools` na `claude/sprawdzenie-funkcjonalnosci-ek4ra0`).
- Zapis/wczytanie: `meta.fortNodes` już zapisywane (main.ts ~l.29901) i wczytywane; teraz od razu tworzy terytorium; `fort-nodes-save-load-test` 18/0; backfill starych zapisów pokryty strażnikiem E3 (zachowanie backfillu w żywej grze NIE_ZMIERZONO).

## 7. DECISION_REQUIRED (ABC dla orkiestratora; nie blokuje reszty, stary mechanizm w miejscu spornym zostawiony)
Q-A. Utrata fortu (zburzenie/zdobycie/przejęcie przez nowe miasto reguła 4): terytorium znika/zmienia właściciela automatycznie (wynika z rejestru; `unregisterFortNodeIfNeeded` tylko przy cofnięciu budowy, main.ts ~l.13255; przejęcie `applyFortTakeoverOnCityFounded` fort-territory.ts ~l.164). Zburzenia/zdobycia fortu przez wojnę NIE rozpoznano jako osobnej ścieżki (NIE_ZMIERZONO, brak wywołania rejestru poza cofnięciem i przejęciem). A) fort zdobyty przez wroga przechodzi na niego wraz z terytorium; B) zdobycie niszczy fort, terytorium znika; C) bez zmian (fort stoi, terytorium przy dotychczasowym właścicielu). Rekomendacja: B.
Q-B. Dwa forty różnych cywilizacji z nachodzącym zasięgiem: rozstrzyga najbliższy węzeł (jak miasta, `territoryOwnerAt`; remis → pierwszy w tablicy). A) tak jak teraz; B) remis → wcześniejszy fort; C) remis → sporny heks neutralny. Rekomendacja: B (wymaga znacznika czasu budowy w `FortNode`).
Q-C. Fort w terytorium cudzego miasta: dziś zablokowane (reguła 1 — improvement-build.ts ~l.1070). A) bez zmian; B) wolno, ale bez terytorium; C) wolno z przejęciem spornych heksów. Rekomendacja: A.
Q-D. Czy dokumentacja poza allowlistą ma zostać zsynchronizowana: `gra/data/tech.json:360` („zasięg 10"), `gra/src/data/wikiBundle.json` (wygenerowane teksty „promień 10 pól"/„+10 pól"), `docs/` — poza allowlistą, NIE zmieniane; opisy dla gracza w tych miejscach nadal mówią 10/5 → osobny temat (regeneracja wikiBundle).

## BLOKADY
Brak twardych. Uwagi: (1) teksty poza allowlistą (Q-D); (2) skutek AI w długiej symulacji NIE_ZMIERZONO; (3) niektóre bramki z dispatchu nie istnieją na tym branchu.

## RUNDY
1/5

## ZMIANY/COMMIT
Allowlista przestrzegana: `gra/src/game/fort-territory.ts`, `gra/src/map/territory.ts`, `gra/src/main.ts`, `gra/data/terrain-improvements.json`, `gra/tools/*-test.cjs` (nowe: fort-outpost-hard-territory-test, fort-outpost-territory-live-test; zmieniony: fort-strazniaca-zasieg-zakladania-test), `dyspozycje/autobot/runs/R-WEB-OUTPOST-FORT-TERRITORY-Q1/**`. Brak zmian: auto-improvements.ts, gra-robocza, WERSJE.md, rust-port, src-tauri. node_modules i scratch (dist, zrzuty poza repo) usunięte. Branch roboczy: `op-fort-territory-q1` (z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, b60cd4623). SHA commitu implementacji: 070e6dc6202d68e45d45e1b7200896b94d7193c1 (branch op-fort-territory-q1; raport dopisany osobnym commitem docs).

## NASTĘPNY KROK
Evaluator (R1) → Obrona → Final Control; orkiestrator zadaje ABC Q-A..Q-D właścicielowi.

DEPLOY/PUSH: NIE WYKONANO
