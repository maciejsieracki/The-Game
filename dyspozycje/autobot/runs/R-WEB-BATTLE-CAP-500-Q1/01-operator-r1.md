STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-CAP-500-Q1
GOAL: limit jednostek na strone na polu bitwy 120 -> 500 (decyzja wlasciciela 2026-11-07), jedno zrodlo prawdy; 500v500 bez nakladania/NaN, bitwa sie konczy, wydajnosc zmierzona; komunikat rezerwy dziala z nowym limitem; test 600v450 -> 500/450, rezerwa 100 nietknieta

## ZMIANY (baza origin/main fcaa10300, zawiera integracje R-WEB-BATTLE-UNDEPLOYED-UNITS-LOST-Q1)
Plik produkcyjny: tylko `gra/src/battle/battleScene.ts`.
1. `const MAX_PER_SIDE = 500;` (jedno zrodlo). Czytaja ja: `slice(0, MAX_PER_SIDE)` (atkArr/defArr), `MAX_RANKS`, `deployClearRanksFor`, `export const BATTLE_MAX_PER_SIDE` (-> komunikat rezerwy w main.ts 31779/32510/34635 i mapFieldBattle). Zadnego innego literalu 120 zaleznego od limitu w `gra/src` nie bylo (reszta trafien "120" to piksele/CSS/komentarze).
2. Wydajnosc (wyniki identyczne, nie LOD, limit logiczny nietkniety) - pomiar ujawnil, ze sam limit 500 bez tego jest nieuzywalny (patrz TESTY):
   a) `_firstStepAlongPathToAttack`: test celu BFS `_makeCanAttackFromTest(ru)` - jednorazowe przygotowanie (lista wrogow bez blokady muru, indeks pol, romb dla zasiegu <= 4) zamiast `_canAttackFrom` (alokacja `_enemiesOf` + petla po wszystkich wrogach) na KAZDE odwiedzone pole BFS. Rownowaznosc sprawdzana w tescie: 24000 porownan z `_canAttackFrom`.
   b) `place()` w `_placeUnits`: przycinanie wierszy gornym ograniczeniem wyniku (`140 - 3*|rr-idealRow| <= bestScore` -> `continue`; porownanie `sc > bestScore` jest ostre, wiec wynik identyczny). Rownowaznosc: skrypt porownawczy (scratchpad, 5 scenariuszy: 500v500 czysta plansza, 500v500 z 776 zablokowanymi polami i roznym terenem, 120v120, 37v211, 600v450) - pozycje WSZYSTKICH jednostek identyczne ze stara petla; czas rozstawienia 6.0 s -> 1.9 s.
   c) `_compactAttackAllowsStep`: zbior `previous` liczony jednym filtrem z tanim testem rangi przed `isSiegeUnit` (dawny filtr wszystkich sojusznikow przy kazdym kroku). Zbior identyczny.
Testy (allowlista):
- NOWY `gra/tools/battle-cap-500-test.cjs` (51 asercji).
- `gra/tools/battle-undeployed-units-test.cjs`: CAP 120 -> 500, rozmiary skladow wzgledem CAP (A=CAP+180, D=CAP+80), oczekiwania przeliczone; nic nie oslabione (35/35).
- `gra/tools/battle-large-mixed-doctrine-matrix-test.cjs`: tylko komentarz (120 -> 500).
- Dowody bramek w tym katalogu: gate-cap-500-test.txt, gate-tsc.txt, gate-undeployed-test.txt.
Zero zmian w gra-robocza/**, WERSJE.md, rust-port/**, main.ts. Build/dev nie uruchamiane; `gra/node_modules` zainstalowany do testow (npm ci) i NIE dodany do commita.

## TESTY (wyniki dokladne)
- `npx tsc --noEmit` (gra/): EXIT=0.
- `node tools/battle-cap-500-test.cjs`: PASS 51 asercji, EXIT=0. Zakres: BATTLE_MAX_PER_SIDE===500 i jedna stala w zrodle; 500v500 (czysta plansza i 10% zablokowanych pol): 500/500 wystawionych, 1000 unikalnych pol, brak NaN, w granicach planszy i w strefie gry, nikt na zablokowanym polu, armie rozdzielone; 600v450 -> 500/450, rezerwa 100 nie wystawiona, dane rezerwy bez zmian, tablica wejsciowa nadal 600, `battleReserveNotice(600,450,500,'atk')` = "100 jednostek w rezerwie (nie wejdą do bitwy)", brak komunikatu dla 500v500; symulacja logiki (produkcyjny `_activateUnit`, adaptery ruch/obrazenia) 500v500: rozstrzygnieta w 42 turach (zywi jedna strona <= 5% stanu), brak NaN, walka zaszla.
- Pomiar wydajnosci (headless Node, BEZ renderu; maszyna mocno obciazona: load average 13-21 na 4 rdzeniach, wiec liczby sa gorna granica):
  * PRZED optymalizacjami (limit 500, bez zmian a-c): tura 0 przy 250v250 = 25.3 s, przy 500v500 = ~81 s; rozstawienie 500v500 = 4-7 s.
  * PO: tura 0 przy 500v500 = ~7 s (a-c), kolejne tury malejaco (tura 10 ~2 s, tura 20 ~0.2 s); 42 tury: srednia 1.1-1.5 s/ture (1000 aktywacji), p95 3.1-4.7 s, max 5.5-7.4 s; rozstawienie 500v500 = 1.0-2.2 s. Czyli ok. 1-7 ms na aktywacje jednostki; w grze aktywacje sa rozlozone w czasie animacji.
  * Dla porownania 120v120 (ten sam fixture): tura 0 ~0.85 s.
- Regresje: battle-undeployed-units-test 35/0; battle-initial-placement-runtime-test PASS; battle-large-mixed-doctrine-matrix-test 36 scenariuszy 0 red (plik dowodowy `...BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json` przywrocony do HEAD - test go nadpisuje); post-battle-map-test 32/0; auto-battle-loss-audit-test 52/0; map-field-battle-test 24/0; siege-manual-battle-behavior-test 40/0; pre-battle-defender-retreat-test OK.
- NIE_ZMIERZONO: FPS/czas klatki renderu w Chromium/WebGL (brak przegladarki i GPU w srodowisku) - 1000 modeli to ~2.3x wiecej niz dotychczasowe maksimum 240; wymaga pomiaru live przez Evaluatora/wlasciciela. Weryfikacja wzrokowa rozstawienia 500v500 i komunikatu rezerwy: NIE wykonana. Rozstawienie w trybie oblezenia (_placeSiegeDefenders) przy 500 jednostkach: NIE zmierzone (kod nie zmieniany; ma petle awaryjne po calej planszy). pelny `ai-test`/logic-test: nie uruchamiane (zmiana ograniczona do battleScene).

## PROPOZYCJA (bez zmiany limitu logicznego, do ABC jesli potrzebna)
Jesli pomiar live pokaze za niski FPS przy 1000 figurach: LOD/instancing - ograniczyc detal modeli (np. pominiecie pasków HP/morale/amunicji dla jednostek daleko od kamery, uproszczony model z `perTokenGeos` scalonych / InstancedMesh dla jednostek statycznych) bez dotykania `MAX_PER_SIDE`. Profil `makeUnitBars` byl widoczny (~1.3 s z 20 s przy rozstawieniu) - kandydat nr 1.

## UWAGI / ZALOZENIA
- Symulacja ma resztki: po rozstrzygnieciu zostaje do ~5 lucznikow bez amunicji uciekajacych na brzeg pola i czesc wlasnych jednostek stojaca daleko (istniejaca logika kitingu/doktryny `steady` bez grupy w fixture), wiec test uznaje bitwe za rozstrzygnieta przy <= 5% stanu zamiast pelnej eliminacji; przy 120v120 w tym samym fixture eliminacja jest pelna (26 tur). To nie jest skutek limitu, ale nie zostalo zbadane w grze rzeczywistej.
- Zakres odstepstwa od allowlisty: brak (main.ts nie ruszany - stala czytana przez eksport).
- MIGRACJA: nie dotyczy (limit stosowany przy wystawianiu).

BLOKADY: brak (pomiar FPS w przegladarce niemozliwy w srodowisku - oznaczony NIE_ZMIERZONO)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ten sam ID) - w tym pomiar live Chromium 500v500 (FPS, rozstawienie, komunikat rezerwy) lub decyzja o LOD
DEPLOY/PUSH: NIE WYKONANO
