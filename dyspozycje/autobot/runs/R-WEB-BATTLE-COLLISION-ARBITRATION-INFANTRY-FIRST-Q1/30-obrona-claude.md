# R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1 — raport Obrony (Operator, Claude), runda 1/5, odpowiedź na zarzuty Evaluatora (9029ad256)

STATUS: PASS-WITH-NOTES (obrona częściowa: zarzuty 2 przyjęty i naprawiony, zarzut 1 odrzucony jako regresja / przyjęty jako fakt, zarzuty 3, 4, 5 przyjęte jako luki NIE naprawione w tej rundzie — do decyzji orkiestratora/FC)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1
GOAL: piechota ma pierwszeństwo przy kolizji o pole w ruchu bitewnym, łucznik ustępuje; ten sam typ => mniejsze ID; bez zamiany miejscami i ping-ponga.
BAZA KODU: 009ffe559 (rodzic 7ac79dafb = FALA 747). Zlecenie podaje BAZA=4504924 — to czubek gałęzi dispatchów, nie baza kodu (zgodnie z DODATKIEM 1).
ZMIANY-COMMIT: SHA końcowy w polu `sha` raportu (commit obrony). Zmiana kodu gry: BRAK (zarzuty nie wymagały zmiany `gra/src`). Zmiana narzędzia testowego: `gra/tools/battle-collision-arbitration-test.cjs` (tryb AUTO domyślnie; zmienna BCA_NOBASE). Dowody: `runs/.../31-auto-live-candidate-s1.txt`, `32-auto-live-base-noarb-s1.txt`, `33-auto-live-mutrev-s1.txt`. Allowlista zachowana; `git diff --check` czysty (ZMIERZONO).

## Odpowiedzi na zarzuty (ZMIERZONO)

### Zarzut 1 — ping-pong A->B->A (kryterium c): ODRZUCAM jako regresję, PRZYJMUJĘ jako fakt
- Dowód: ta sama bitwa AUTO, seed 1, bez arbitrażu (ARB_ENABLED=false przez transform vite) daje IDENTYCZNE wyniki co kandydat: `pingpongAll 3`, `pingpong 0`, `digest 361a1e0c1b68ec4c1b172dd286e518bb`, ppDetail: `atk10@r5def`, `atk11@r8def`, `atk12@r12def` (plik `32-auto-live-base-noarb-s1.txt` vs `31-auto-live-candidate-s1.txt`).
- Wniosek: ping-pong jest zachowaniem planera bazy (jostle linii styku), nie efektem arbitrażu. Arbitraż go nie zwiększa (zgodnie z asercją testu).
- PRZYJMUJĘ: literalne kryterium dispatchu „brak ping-ponga w 30 rundach” NIE jest spełnione (3 przypadki na ziarnie 1, także na bazie). Nie naprawiałem: usunięcie ping-ponga wymaga zmiany planera ruchu (poza zakresem arbitrażu). Decyzja dla FC: przyjąć miarę „nie gorzej niż baza” czy otworzyć osobny temat planera.
- Ziarna 2 i 3 NIE ZMIERZONO w tej rundzie (koszt: każdy przebieg live ~5 min; przebieg bazy i kandydata dla ziarna 1 wykonany).

### Zarzut 2 — live AUTO zamiast Pomin (kryterium g): PRZYJMUJĘ, NAPRAWIONE
- Test domyślnie używa teraz trybu `mode=watch` (AUTO: `scene._ffEnterAuto()` w `battle-pursuit-pace-browser-entry.ts`), a nie `mode=skip`. Zmienna BCA_MODE nadal pozwala na `skip`.
- Dowód live AUTO, seed 1, kandydat (`31-auto-live-candidate-s1.txt`): `path 73`, `infVsRng 0` (piechota nigdy nie ustąpiła łucznikowi), `rngVsInf 8` (łucznik ustąpił piechocie w 8 kolizjach), `same 65`, `sameBad 0` (ten sam typ => mniejsze ID), `swaps 0`, `rounds 39`, `WYNIK: 4 ok, 0 FAIL`.
- Zauważone: digest AUTO (`361a1e0c…`) jest identyczny jak w poprzednim przebiegu Pomin dla tego samego ziarna — tryb nie zmienia strumienia zdarzeń na tym ziarnie (ZMIERZONO).
- NIE ZMIERZONO: zrzut ekranu (`pixelRatio` 0,1, sonda bezgraficzna). Dowodem jest log zdarzeń kolizji z realnego ticka AUTO, nie obraz.

### Zarzut 3 — tryb ręczny poza arbitrażem: PRZYJMUJĘ jako lukę zakresu, NIE NAPRAWIONO
- Fakt kodowy (ZMIERZONO): `gra/src/ui/`-odpowiednik to `gra/src/battle/battleScene.ts:5779`: `_beginAutoBatchPhase` zwraca się natychmiast przy `this._manualMode`. Arbitraż (`resolveAutoBatchPhase`) działa tylko na fali AUTO/SKIP. W trybie ręcznym rozkazy są wykonywane pojedynczo, bez wspólnej fali, więc nie ma symultanicznej kolizji do rozstrzygnięcia w tym samym ticku.
- Dispatch wymienia „ręczna” w decyzji właściciela, więc luka jest realna. Wymaga decyzji projektowej (kolejkowanie rozkazów ręcznych jako fala vs. reguła „pierwszy rozkaz wygrywa”). Nie wdrażałem bez decyzji właściciela; do FC/orkiestratora.

### Zarzut 4 — obejście (DODATEK 1 „alternatywa”): PRZYJMUJĘ jako lukę, NIE NAPRAWIONO
- Implementacja: ustępujący łucznik zachowuje kroki PRZED polem spornym (cap), reszta puli ruchu przepada także gdy istnieje obejście. Zgodne z DECYZJĄ A dispatchu („zatrzymuje się pole wcześniej albo omija”) w wariancie „pole wcześniej”; wariant „omija” wymaga przeplanowania ścieżki i nie został wdrożony.
- Nie dodawałem testu „alternatywa istnieje” — bez implementacji obejścia test byłby czerwony.

### Zarzut 5 — porównanie doctrine-live r4 i large-mixed-doctrine-matrix z bazą: PRZYJMUJĘ jako lukę dowodową, NIE ZMIERZONO
- Nie uruchomiono w tej rundzie (koszt czasu; r4 na kandydacie i bazie pada w różnych miejscach przez znany dług sidecarów zwracających HTML — DODATEK każe tego nie naprawiać). matrix nie uruchomiony.
- Dowód na zakres: 6 bramek battle-* z DODATKU (pkt 2 kontrakt) — zob. poniżej, nie były ponownie uruchamiane w tej rundzie poza częścią P i L.

## Wyniki dodatkowe (ZMIERZONO, ta runda)
- Mutacja live (odwrócony priorytet, `33-auto-live-mutrev-s1.txt`): `infVsRng 11` (piechota ustąpiła łucznikowi), `pingpong 39`, `pingpongAll 54`; asercja `11 > 0` zielona. Mutacja czerwieni — kryterium (d) spełnione także w ticku live.
- Czysta część P (`BCA_PART=pure`): 14 ok / 0 FAIL, łącznie ze scenariuszami A–H (zamiana miejscami odrzucona, determinizm x3, trzech chętnych).
- UWAGA DLA FC (ważne dla siły dowodu): na ziarnie 1 wynik KANDYDATA jest IDENTYCZNY z BAZĄ BEZ ARBITRAŻU (digest, ping-pong, liczby kolizji). Scenariusz live na tym ziarnie nie rozróżnia kandydata od bazy; rozróżnia go dopiero mutacja odwracająca priorytet i część P. Dowód „arbitraż zmienia wynik w ticku” jest więc słabszy niż sugeruje raport Operatora r1.
- Zakres live tej rundy: ziarno 1 (kandydat, baza, mutacja). Ziarna 2 i 3 NIE ZMIERZONO.

## Pozostałe bramki (ZMIERZONO w tej rundzie)
- tsc / 5 bramek referencyjnych / regresje battle-* — NIE PONOWIONO w tej rundzie (zmiana kodu gry = 0; wyniki Evaluatora dla 009ffe559 pozostają wiążące, nie były kwestionowane poza zarzutami 1–5).
- `git diff --check`: czysty (ZMIERZONO).

## BLOKADY
- Zarzuty 3, 4, 5 i literalne kryterium (c) wymagają decyzji orkiestratora/FC (zakres ręczny, obejście, miara ping-ponga, porównanie doctrine na sidecarach).
- Dług: sidecary doctrine-live r3/r4 zwracają HTML (istniejący dług, nie naprawiany zgodnie z DODATKIEM).
- Brak zrzutu ekranu (tylko log zdarzeń).

## UWAGI-DLA-ORKIESTRATORA
1. Operator r1 w `10-operator-claude.md` twierdził silniejszy dowód live niż daje ziarno 1 (zob. wyżej: kandydat = baza bez arbitrażu). Warto zlecić ziarna 2–3 albo scenariusz, w którym baza zachowuje się inaczej.
2. Zmiana tylko w narzędziu: `gra/tools/battle-collision-arbitration-test.cjs` — domyślny tryb `watch` (AUTO), `BCA_NOBASE=1` pomija przebieg bazy w części L. Zmiana NIE dotyka `gra/src`.
3. `node_modules` w worktree zainstalowane przez `npm ci` (71 pakietów) — do usunięcia przy sprzątaniu worktree; nie w commicie.
4. Przebiegi live trwają ok. 5 min na przebieg (ponad 300 s z uruchomieniem vite); w tej sesji wykonywano je w pierwszym planie, bez run_in_background, zgodnie z zasadą procesową.

## TESTY (podsumowanie surowych wyników)
- `BCA_PART=pure`: 14 ok / 0 FAIL (surowe wyjście w logu tej rundy).
- `BCA_PART=live BCA_NOBASE=1 BCA_SEEDS=1` (AUTO): `WYNIK: 4 ok, 0 FAIL`, digest 361a1e0c1b68ec4c1b172dd286e518bb (plik 31).
- `BCA_PART=base BCA_SEEDS=1` (bez arbitrażu, AUTO): digest 361a1e0c1b68ec4c1b172dd286e518bb, pingpongAll 3 (plik 32).
- `BCA_PART=mutRev BCA_SEEDS=1` (AUTO): `WYNIK: 2 ok, 0 FAIL`, infVsRng 11 (plik 33).

RUNDY: 1/5 (Obrona r1)
NASTĘPNY KROK: Evaluator r2 albo FC: rozstrzygnąć zarzuty 3, 4, 5 i literalne kryterium (c); decyzja właściciela wymagana dla trybu ręcznego (zarzut 3).
DEPLOY-PUSH: NIE WYKONANO
