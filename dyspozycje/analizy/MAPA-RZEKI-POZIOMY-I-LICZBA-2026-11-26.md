# Rzeki: poziomy i liczba źródeł — recon (R-WEB-MAP-RIVER-TIERS-RECON-Q1), runda 3

Baza: `bcee4f3a5` (main; kod gry = `e70abe718`, FALA 911). Zero zmian w `gra/**` (symulacje na kopii w scratchpadzie).
Oznaczenia: ZMIERZONO (surowe wyjście z komendy z sekcji 7) / ZWERYFIKOWANO KODEM (odczyt linii) / ZAŁOŻENIE / NIE ZMIERZONO / NIE ZNALEZIONO.
Liczba „map” = 15 (84×60, 168×120, 240×168 × ziarna 1, 7, 42, 99, 2026; świat „kontynenty”, tier Rzeki = medium) plus dodatkowo mapy innych typów (sekcja 3.4).

## 0. Streszczenie (dla orkiestratora)

1. **Wynik najważniejszy: zmniejszenie siatki źródeł NIE podwaja liczby rzek głównych.** ZMIERZONO: bok komórki 3,5 (= 5/√2) daje 0,95× / 0,98× / 1,02× rzek głównych (mapy 84×60 / 168×120 / 240×168) i na 240×168 podwaja czas generowania. Siatka `mainCell` nie jest ograniczeniem — rzeki główne zaczynają się od ujść na wybrzeżu, a limitem jest **minimalny odstęp między głównymi nurtami `MAIN_RIVER_MIN_PATH_SEP = 3`** (`gra/src/map/gen-helpers.ts:5705`, „Maciej 2026-08-01”).
2. **2× źródeł osiąga się dopiero przy odstępie 1** (rzeki mogą biec w sąsiednich heksach): ZMIERZONO 2,06× rzek głównych na 15 mapach (3940 vs 1911), ale średnich −17%, dopływów −67%, a na mapach „Ziemia”/„Pangea” tylko 1,1–1,25× (sekcja 3.3–3.4). Odstęp 2 daje tylko 1,24×.
3. **Trzeci poziom już istnieje w kodzie jako `tributary`** (i `short`): jest generowany domyślnie (8–146 na mapę), ale **ukryty w renderze** (decyzja FALA 174). Średnie (`medium`) i dopływy (`tributary`) mają dziś TĘ SAMĄ szerokość w renderze (`scene.ts:1323–1329`) — czyli nie ma dziś wizualnej różnicy „boczne” vs „trzeciego poziomu”.
4. **RIVMOUTH (bde050bcf): +2…+8% rzek głównych, nie poprawia wydajności** (ZMIERZONO 11 243 ms vs 11 265 ms, 6 przebiegów 84×60). Deklaracja „+12%” NIEPOTWIERDZONA. Test odstępu ujść: baza 1 pass / 3 fail → z RIVMOUTH 2 pass / 2 fail (nadal czerwony, sekcja 4.2).
5. Każda zmiana generatora rzek zmienia strumień losowy (`rand` jest wspólny dla rzek i późniejszych etapów: las, złoża, starty — `generator.ts:171`, `:507`), więc piny map-zależne całej gry mogą się przesunąć (sekcja 6, NIE ZMIERZONO w testach gry).

## 1. Reguły historyczne (pkt 1)

**Przeszukane ścieżki:** `docs/obieg/**` (70 plików), `docs/decyzje/**` (418), `docs/archiwum/**` (71), `docs/archiwum-procesu/**` (3), `docs/MACIEJ-GOTOWE.md` i pozostałe `docs/*.md`, `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (10 148 linii), `dyspozycje/PYTANIA-OTWARTE.md` (32 699 linii), `dyspozycje/analizy/**`, `gra/data/*river*`, `gra/src/map/*`.
**Frazy (grep -i):** `trzeci(ego) poziom`, `poziom(y) rzek`, `rzek* trzeciego`, `3. poziom`, `poziom 3` obok `rzek`, `dopływ* dopływ`, `rzeki (główne|boczne)`, `boczn* rzek`, `rzek* (średni|krótk)`, `krótk* rzek`, `FALA 17x/18x` obok `rzek|river|dopływ|medium|short|tributary`, `AC-7`, `monoton`.
**Wynik:** **NIE ZNALEZIONO** żadnej decyzji/reguły o „trzecim poziomie rzek” ani o „dopływie dopływu” w przeszukanych plikach (jedyne trafienia na „trzeci poziom” dotyczą pałacu `REJESTR:908` i trudności AI `R-AI-TRUDNOSC-AUDYT.md:118`; `AC-7` w `A3-SPEC-WDROZENIA.md:95` dotyczy ruchu jednostek; `monotonia` w `PYTANIA-OTWARTE.md`/`R-MAPA*` dotyczy gęstości tierów, nie poziomów rzek). Wniosek „NIE ZNALEZIONO” opiera się o powyższe grepy po całym zbiorze, nie o lekturę każdej linii rejestru.

Reguły o rzekach, które ZNALEZIONO:
- **Główny + dopływ (2 poziomy):** `docs/obieg/MAPA-RZEKI-SPEC.md:69–78` (§5): `main` 100% półszerokości, `tributary` **50%**, max ~2 dopływy na długi main (≥12 hex), łączy się z main w połowie trasy, generowany PO siatce main; wpis zmiany `:126` (2026-07-04). `docs/obieg/MAPA-KANON-GENERATOR.md:34–35` (`main` + `tributary` 2× cieńszy; „dopływy nie liczą się do siatki”). `MAPA-RZEKI-SPEC.md:38` — dopływy nie liczą się do pokrycia siatki; min. odstęp źródeł ~0,8·N (`:29–35`).
- **Średnie rzeki (drugi rzut):** `docs/MACIEJ-GOTOWE.md:100` (2026-08-02, FALA 175: „średnie rzeki: main junction, okno skrętu, prune orphan”); `dyspozycje/PYTANIA-OTWARTE.md:1791` (większość średnich nie wpadała do głównej); `dyspozycje/REJESTR-PROSB-I-ZADAN.md:1122` (R-MEDIUM-RIVERS-FOG, FALA 202); `PYTANIA-OTWARTE.md:2698–2712` (średnie/krótkie/dopływy rysowane w paczkach 32–128 tras).
- **Dopływy:** `PYTANIA-OTWARTE.md:1580–1587` (BUG-RZEKI-DOPLYWY 2026-07-29), `:1793`, `:1809–1811` (FALA 187: dopływy bez zawijania, ku centrum), `:1969–1970` (FALA 188).
- **Widoczność domyślna:** `gra/src/render/scene.ts:1511` (komentarz) i `:1531` (`return 2; // FALA 174: główne + średnie (Maciej playtest)`).
- **Odstęp głównych:** `gen-helpers.ts:5704–5705` „Min. odległość między głównymi nurtami — od ścieżki, nie tylko źródeł (Maciej 2026-08-01)”; **odstęp ujść** `:5726–5727` `MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7` („Maciej 2026-08-02, FALA 170”).

Odpowiedź na „co dokładnie ustalono o trzech poziomach”: **dwa poziomy zapisane jako reguła właściciela (główny, dopływ 2× cieńszy)**; w kodzie są cztery rodzaje (`main`, `medium`, `tributary`, `short`) powstałe z kolejnych FAL (175–188), bez zapisanej reguły „trzeci poziom”. Najbliższa reguła: `tributary` (50% szerokości wg specu; w kodzie 0,4/0,55/0,7).

**Rozstrzygnięcie N=15 vs mainCell=5 (ZWERYFIKOWANO DOKUMENTAMI):** `MAPA-RZEKI-SPEC.md:24–29` tabela „B = 15 — Normalnie (wdrożone, Maciej 20:34) — Efekt: woda + miedź”, a `MAPA-FAIR-PLAY-SIATKA.md:9–10,20,29` mówi wprost: **rzeki = „1 źródło / komórkę siatki”, siatka WODY i MIEDZI = 15×15**. Czyli 15 to siatka fair-play wody/miedzi, a nie siatka rzek; siatka rzek (kod) to `riverGridCellSizeForTier` = 10/5/5 (`newGameMapDefaults.ts:280–285`, komentarz „Maciej 2026-08-01: medium 10→5, low 15→10”), nowszy od wpisu specu z 2026-07-04. Dokument „20:34” jako osobny plik NIE ISTNIEJE w repo (to wpis w specu). Niespójność pozostaje w kodzie: `riverCoverageCellSize` bez w,h zwraca 10 dla medium (`gen-helpers.ts:8600–8603`) a z w,h → 5 (nieużywana ścieżka domyślna). Spec nadal opisuje N=14/15 — do poprawki w dokumentacji (RIVERS3).

## 2. Stan kodu (pkt 2)

`RiverPathKind = 'main'|'medium'|'short'|'tributary'` (`gen-helpers.ts` ~8608; w generatorze `generator.ts:506`).

| Rodzaj | Gdzie powstaje | Bramka / limity | Render (`scene.ts`) |
|---|---|---|---|
| `main` | `generateRivers` (`gen-helpers.ts:11790`), etap 1 od ujścia: `tryPlaceMainRiverFromCoast` (`:9981`) → `tryPlaceMainRiverAtMouth` (`:9931`), uzupełnianie luk `topUpMainRiverCoastMouthGaps` (`:9787`) | zawsze; **odstęp od innych main ≥ `MAIN_RIVER_MIN_PATH_SEP`=3 hex** (`:5705`, użycie `:9937,9967`); luka ujść ≤7 (5 na „małej”) | stage ≥1; szerokość `min(1.35, 0.85+len·0.008)` (`:1323–1324`) |
| `medium` | `pushMedium` (~`:11873`), `traceMediumRiver` | przed bramką `isRiverGenFull()`; domyślna faza `main+medium` (`riverGenSwitch.ts:73`) | stage ≥2 (domyślny); szerokość jak `tributary` |
| `tributary` | `pushTributary` (~`:11861`), `addTributariesForMainRiver`, dekoracyjne po `:12007` | przed bramką (zawsze), dekoracyjne tylko w fazie `all` | **stage ≥3 — domyślnie UKRYTE** (`scene.ts:1538–1542`) |
| `short` | etap 3 (`:11888`), tylko przy `isRiverGenFull()` (`:11971`) | faza `all` (`?riverGenPhase=all`); startuje ≤ `SHORT_RIVER_MAX_DIST_FROM_MEDIUM` od `medium` (`:10029`) | stage ≥3 |

Szerokość renderu: `main` j.w.; **wszystko poza `main` — `medium`, `tributary`, `short` — ma wspólną regułę 0,4 (<10 hex) / 0,55 (<18) / 0,7 (≥18)** (`scene.ts:1323–1329`). Czyli dziś „boczne” (`medium`) i „trzeciego poziomu” (`tributary`) nie różnią się grubością; różni je tylko trasa (medium wpada do main, `tributary` wg `riverGenPhase`) i widoczność.
Który jest „bocznym”: `medium` (widoczny, wpada do main). Który mógłby być „trzeciego poziomu”: `tributary` (istnieje, jest generowany, ukryty) albo `short` (faza `all`, krótkie odgałęzienia od medium).

## 3. Pomiar (pkt 3)

**Metoda:** `dyspozycje/analizy/river-count-measure-2x.cjs prepare <SCRATCH>` kopiuje `gra/src`+`gra/data`, nakłada override (env `RIVER_CELL`) i bundluje esbuildem; `measure-one.cjs` woła `generateMap(w,h,seed,kind,{mapSizeMenuLabel:'Standardowy',worldDensity:{rivers:'medium',…}})` i liczy rodzaje, heksy, źródła (= liczba `main`), widoczne domyślnie (`main`+`medium`), czas, naruszenia sąsiedztwa kroków w ścieżce (`assertRiverPathAdjacent`). Wariant odstępu: env `RIVER_PATHSEP` (jednolinijkowy override `MAIN_RIVER_MIN_PATH_SEP` w kopii scratch). Równoległość 4 rdzeni (`nproc`=4): `river-count-run.cjs`. Odtwarzalność: baza zgodna z rundami 1–2 co do sztuki na 84×60 (5/5 map) i 168×120 seed 42 (120/42/67 hex 1423/580/1023, powtórzone w tej rundzie).
**Uwaga o czasach:** przebiegi równoległe na 4 rdzeniach (obciążona maszyna) → czasy między WARIANTAMI z tej samej wiązki są porównywalne, z bazą z rund 1–2 (pojedyncze przebiegi) — nie. Samotny, nieobciążony przebieg 168×120 seed 42: baza 123 155 ms, faza `all` 239 944 ms.

### 3.1 Baza (V0) — 15 map (r1–r2, powtórzone selektywnie)
Per mapa: main / medium / tributary (liczba tras); `short`=0 wszędzie. Źródeł main = liczba main.

| Mapa | V0 main/med/trib | V1 (komórka 3,5) main/med/trib | V2 (odstęp 2) | V3 (odstęp 1) main/med/trib | V3 widoczne |
|---|---|---|---|---|---|
| 84×60 s1 | 47/25/8 | 40/15/18 | 49/19/10 | 92/15/2 | 107 |
| 84×60 s7 | 40/29/18 | 41/18/19 | 54/29/6 | 100/14/0 | 114 |
| 84×60 s42 | 45/16/12 | 38/16/15 | 52/16/6 | 99/12/0 | 111 |
| 84×60 s99 | 45/19/13 | 44/16/14 | 56/23/13 | 102/14/0 | 116 |
| 84×60 s2026 | 45/22/15 | 48/26/17 | 63/21/8 | 97/14/0 | 111 |
| 168×120 s1 | 124/44/81 | 124/46/72 | 160/33/55 | 270/30/18 | 300 |
| 168×120 s7 | 137/50/59 | 130/47/72 | 164/40/40 | 284/31/13 | 315 |
| 168×120 s42 | 120/42/67 | 117/36/76 | 160/37/49 | 270/29/15 | 299 |
| 168×120 s99 | 136/41/74 | 135/36/83 | 177/42/47 | 300/30/10 | 330 |
| 168×120 s2026 | 130/55/63 | 128/62/53 | 166/33/51 | 280/29/30 | 309 |
| 240×168 s1 | 204/87/146 | 223/95/176 | 265/95/107 | 425/93/57 | 518 |
| 240×168 s7 | 213/94/119 | 214/92/136 | 248/73/89 | 426/102/50 | 528 |
| 240×168 s42 | 188/97/141 | 191/92/132 | 245/88/79 | 401/90/47 | 491 |
| 240×168 s99 | 203/103/118 | 227/93/122 | 258/96/94 | 395/84/59 | 479 |
| 240×168 s2026 | 234/96/103 | 210/78/137 | 247/98/113 | 399/97/42 | 496 |

(V0 dla 168×120 i 240×168 z rund 1–2: hexy główne/medium/trib patrz `10-operator-claude.md` r2; V1–V3 hexy: surowe wyjścia w sekcji 7.)

### 3.2 Sumy (15 map, ZMIERZONO) i czas

| Wariant | main | medium | tributary | widoczne domyślnie (main+medium) | main vs V0 |
|---|---|---|---|---|---|
| V0 baza | 1911 | 820 | 1037 | 2731 | 1,00× |
| V1 komórka 3,5 | 1910 | 768 | 1142 | 2678 | 1,00× |
| V2 odstęp 2 | 2364 | 743 | 767 | 3107 | 1,24× |
| V3 odstęp 1 | 3940 | 684 | 343 | 4624 | **2,06×** |

Per rozmiar, main V3/V0: 84×60 2,21×, 168×120 2,17×, 240×168 1,96×; V2/V0: 1,23× / 1,28× / 1,21×; V1/V0: 0,95× / 0,98× / 1,02×.
Średni czas generowania jednej mapy (wiązka równoległa 4 rdzenie): 84×60: V0 16,5 s, V1 17,0 s, V2 15,7 s, V3 12,6 s; 168×120: V1 218 s, V2 153 s, V3 181 s; 240×168: V1 394 s, V2 367 s, V3 217 s (V0 na 168/240 w tej wiązce NIE ZMIERZONO; w r1–r2 pojedynczo 39–142 s i 119–220 s). Wniosek: **V1 (drobniejsza siatka) jest najdroższy (2× na 240×168) i nic nie daje; V3 nie podnosi kosztu** (przy odstępie 1 trasowanie rzek jest tańsze, bo mniej odrzuceń).
Liczba źródeł główna to nie jedyny skutek V3: ZMIERZONO spadek `medium` (−17%) i `tributary` (−67%) — główne zajmują miejsce, którego średnie i dopływy potrzebują. Widoczne domyślnie rośnie 1,69× (nie 2×).
Reguła sąsiedztwa kroków w trasie: ZMIERZONO `nonAdjacentPaths = 0` na wszystkich 74 przebiegach pomiarowych tej rundy (te same asercje co `river-path-adjacency-test`, patrz 6).

### 3.3 Co NIE zmienia się przy zmianie siatki (diagnoza)
Bok komórki 2 / 3 / 3,5 / 4 / 7 / 10 na 84×60 seed 1 (ZMIERZONO): main 41 / 42 / 40 / 35 / 47 / 38 — szum, nie trend. Rzeki główne w etapie 1 wychodzą z ujść na wybrzeżu (`tryPlaceMainRiverFromCoast`), siatka tylko wybiera komórki do próby; limit daje odstęp 3 między ścieżkami (`:9937,9967`) i `topUp…` ujść (max luka 7). Dlatego „N→N/√2” nie działa.

### 3.4 Mapy innych typów (osobno „stałe/Ziemia”), 168×120 (ZMIERZONO)
| Typ, seed | V0 main/med/trib | V2 (odstęp 2) | V3 (odstęp 1) | main V3/V0 |
|---|---|---|---|---|
| ziemia s7 | 51/7/8 | 60/4/9 | 64/5/7 | **1,25×** |
| pangea s42 | 55/27/0 | — | 61/46/0 | **1,11×** |
| wyspy s99 | 261/93/107 | 328/80/91 | 598/46/12 | 2,29× |

Wniosek: na „Ziemia” i „Pangea” odstęp nie jest głównym ograniczeniem (tam źródła stawiają inne ścieżki: `ensureMassRiverGridCoverage` z `gridStride`, `bootstrapMainRiversFromCoast`, `ensurePangeaInteriorMainRivers`, `gen-helpers.ts:11490–11528`). Dla tych typów „2×” wymaga osobnych zmian (NIE ZMIERZONO żadnej).

### 3.5 Faza `all` (krótkie `short` + dekoracyjne), ZMIERZONO
| Mapa | main/med/trib/**short** | razem tras | czas (równolegle) |
|---|---|---|---|
| 84×60 s1 | 53/25/9/**7** | 94 | 40,7 s |
| 84×60 s7 | 50/20/18/**7** | 95 | 47,3 s |
| 84×60 s42 | 48/20/18/**10** | 96 | 35,8 s |
| 84×60 s99 | 47/25/13/**9** | 94 | 30,5 s |
| 84×60 s2026 | 47/23/14/**11** | 95 | 28,4 s |
| 168×120 s42 | 131/59/87/**55** | 332 (V0: 229) | 240 s nieobciążony (baza 123 s) |
Faza `all` ≈ **2× czas** (84×60: 36,5 s vs 16,5 s; 168×120: 1,95×) i zmienia też liczby `main` (53 vs 47 na s1) — dodatkowe przejścia zużywają inny strumień losowy.

## 4. Parametry liczby źródeł i podwojenie (pkt 4)

### 4.1 Co decyduje o liczbie źródeł głównych
1. `MAIN_RIVER_MIN_PATH_SEP = 3` — **decydujący** (ZMIERZONO sekcja 3). 2. `MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7` (5 dla „małej”) — uzupełnianie ujść, tylko górny limit luki. 3. `riverParams.mainCell` (`newGameMapDefaults.ts:281–285,345`) = 10/5/5 — praktycznie bez wpływu. 4. `sourceSep = max(2, floor(mainCell·0,25))` (`:9868`) — dotyczy źródeł `tryPlaceGridSource`, nie ujść. 5. Bufor od morza `RIVER_MIN_INLAND_FROM_SEA`=2 i ogon ujścia `RIVER_MOUTH_TAIL_LEN`=5 (`:5702`). 6. Kreator: tier „Rzeki” → `riverGridCellSizeForTier`, `riverMinPathLengthForTier` 15/25/35. 7. Mapy Ziemia/Pangea: ścieżki z 3.4, nie sam odstęp.

### 4.2 RIVMOUTH (bde050bcf) — pomiar na cherry-picku (ZMIERZONO)
Cherry-pick tylko zmian `gen-helpers.ts` z `e80d07efb..bde050bcf` (+101: `if (nd < 1) continue;` ~`:6386`, `allowForkMouth`, `tryForkMouthAtGap` ~`:9721`) na kopii scratch (patch stosuje się czysto: `gen-helpers.ts` i `generator.ts` bez zmian między `e80d07efb` a bazą) oraz `river-mouth-gap-enforce-test.cjs` z bde050bcf.
| Mapa | baza main/hex main | RIVMOUTH | zmiana |
|---|---|---|---|
| 84×60 ×5 (suma) | 222 / 2060 hex | 228 / 1997 hex | main +2,7%, hex −3,1%, medium 111→103, trib 66→61 |
| 168×120 s42 | 120 / 1423; med 42, trib 67 | 123 / 1344; med 33, trib 61 | main +2,5%, medium −21% |
| 168×120 s99 | 136 / 1681 | 141 / 1463 | main +3,7%, hex −13% |
| wyspy 168×120 s99 | 261 / 2478; med 93, trib 107 | 281 / 2478; med 57, trib 111 | main +7,7%, medium −39% |
**Wydajność:** 6 przebiegów 84×60 (3 ziarna × 2 powtórzenia, naprzemiennie, bez obciążenia): baza 11 243 ms, RIVMOUTH 11 265 ms — **brak +12%** (deklaracja z commita NIEPOTWIERDZONA; różnica w granicach szumu).
**Testy (na tej bazie):** `river-mouth-gap-enforce-test` baza **1 pass / 3 fail** (kontynenty s42 worst 18, 8 złych mas; pangea s7 worst 15) → z cherry-pickiem **2 pass / 2 fail** (kontynenty s42 worst 15, 3 złe masy; pangea s7 worst 10) — nadal czerwony („częściowa naprawa”, zgodnie z decyzją B właściciela). `river-density-test`: 247→236 tras, hexy z krawędzią rzeki 5403→4267 (progi ≥120 / ≥600 nadal zielone). `medium-river-test` 38/0 bez zmian. `river-sea-buffer-test` 6 pass/3 fail zarówno przed, jak po (3 pady istnieją już w bazie: s42 bufor 10 złych, ujścia kont. s42 i pangea s7).
**Kolizje z podwojeniem:** RIVMOUTH zmniejsza medium/dopływy (~−20…−40%) tak samo jak V3; skumulowane (V3 + RIVMOUTH) NIE ZMIERZONO. Reguła sąsiedztwa i bufor morza: `river-sea-buffer-test` przy V3 — ten sam wynik 6/3 (brak nowych padów); `river-path-adjacency` — 0 naruszeń.

### 4.3 Jak podwoić źródła (rekomendacja techniczna)
- **Wybór uzasadniony pomiarem:** NIE komórka N/√2 (nie działa) i NIE „2 starty na komórkę” (starty biorą się z ujść, nie z komórek — nie ma czego podwajać bez zmiany odstępu). Skuteczna jest jedna stała: **`MAIN_RIVER_MIN_PATH_SEP` 3→1** (2,06× main, 15 map). Odstęp 2 = 1,24×.
- Kreator: stała nie zależy od tieru; jeśli „2×” ma dotyczyć wszystkich trzech tierów, trzeba ją uzależnić od tieru (np. 3/2/1) — NIE ZMIERZONO tierów low/high.
- Mapy „Ziemia”/„Pangea”: osobna ścieżka źródeł (3.4); sam odstęp daje tylko 1,1–1,25×.
- **Ryzyka:** (a) odstęp 1 = rzeki główne w sąsiednich heksach (równoległe „podwójne” nurty) — łamie regułę właściciela 2026-08-01 i wymaga zgody; wygląd NIE OGLĄDANY w przeglądarce; (b) medium −17%, dopływy −67% (widoczne +69%, nie +106%); (c) jeśli równolegle włączony RIVMOUTH — dalszy spadek medium; (d) strumień `rand` → przesunięcie pinów (sekcja 6); (e) ujścia: test odstępu ujść pozostaje czerwony bez domknięcia RIVMOUTH.

## 5. Warianty trzeciego poziomu (pkt 5) — skutek dla wyglądu mapy

Dokładnie trzy warianty. Liczby: ZMIERZONO tam, gdzie z tabel 3.x; C = ZAŁOŻENIE (nie ma implementacji).

**A — „Krótkie odnogi” (trzeci poziom = rodzaj `short`).** Gracz zobaczy dodatkowe, krótkie strumyki wpadające w rzeki średnie. Liczba: **7–11 na małej mapie 84×60, 55 na standardowej 168×120 (seed 42)**; wszystkich tras +19% na małych (suma 5 map 474 vs 399) i +45% na standardowej (332 vs 229). Wygląd: cienkie, krótkie (<10 hex, szerokość 0,4); z ukrytymi dopływami razem (stage ≥3) mapa gęstsza. **Koszt generowania ≈ 2×** (ZMIERZONO 36,5 s vs 16,5 s; 240 s vs 123 s). Ryzyko pinów: wysokie — włączenie fazy `all` zmienia też liczby main/medium (strumień losowy); wymaga zmiany domyślnej fazy (`riverGenSwitch.ts:73`) i stage (`scene.ts:1531`), czyli odwraca decyzję FALA 174; testy pokrycia mają `short` w asercjach tylko w fazie `all`.

**B — „Pokazać dopływy, które już są” (trzeci poziom = `tributary`, bez nowego typu).** Zmiana tylko widoczności (domyślny stage 2→3, `scene.ts:1531` + `filterRiverPathsForStage` `:1538–1542`). Gracz zobaczy **+38% rzek** (15 map: 2731 → 3768 widocznych; 84×60 333→399, 168×120 879→1223, 240×168 1519→2146 na 5 map), czyli np. na 240×168 s99 306→424. Koszt generowania **bez zmian** (już generowane). Wygląd: cienkie dopływy wpadają w rzeki; **uwaga: dziś `medium` i `tributary` mają tę samą szerokość**, więc bez dodatkowej zmiany szerokości gracz nie odróżni „bocznych” od „trzeciego poziomu” (trzeba dopisać wąską szerokość dla `tributary`, np. wg spec 50% → w kodzie 0,4×). Ryzyko pinów: niskie dla generatora (zero zmian), średnie dla testów renderu/mgły (`river-fog-visibility-test`, `river-render-*`). Jest to najtańsza realizacja „główne / boczne / trzeciego poziomu” = `main` / `medium` / `tributary`.

**C — „Dopływ dopływu” (nowy czwarty rodzaj).** Nowy `kind` w `gra/src/types/map.ts`, generowanie po `tributary`, render, serializacja zapisu gry, testy. Liczby: **ZAŁOŻENIE** rzędu liczby `short` (7–11 na małej, ~55 na standardowej; górna granica = liczba `tributary`: 8–18 / 59–81 / 103–146) — NIE ZMIERZONO (brak implementacji). Koszt generowania: rośnie jak faza `all` etapu 3 (do ~+100%) — ZAŁOŻENIE. Wygląd: wyraźna hierarchia czterech grubości. Ryzyko: najwyższe (nowy typ w zapisie, piny, render, FoW).

**Zależność od 2× źródeł:** przy V3 liczba dopływów spada 67% (sekcja 3.2), więc B przy V3 pokazuje tylko 343 dopływów na 15 map (vs 1037 dziś) — warianty trzeba rozpatrywać łącznie.

## 6. Testy i piny generatora (pkt 7 dispatchu)

**Uruchomione (ZMIERZONO, kopia scratch, baza `bcee4f3a5`)** — komenda: `node dyspozycje/analizy/river-tests-run.cjs <SCRATCH> <out.jsonl> 4 "<ENV|->" <testy…>`:
| Test | baza | RIVMOUTH | V3 (odstęp 1) |
|---|---|---|---|
| `medium-river-test` | 38/0 | 38/0 | 38/0 |
| `river-density-test` (168×120 s4242; progi ≥120 tras, ≥600 hex) | 2/0 (247 tras, 5403 hex) | 2/0 (236, 4267) | 2/0 (356, 6826) |
| `river-yield-both-sides-test` | 7/0 | NIE URUCHOMIONO | 7/0 |
| `river-confluence-edge-test` | 2/0 | NIE URUCHOMIONO | NIE URUCHOMIONO |
| `river-loop-test` (168×120, ziarna 7/42/99…) | 7/0 | NIE URUCHOMIONO | NIE URUCHOMIONO |
| `river-sea-buffer-test` | **6 pass / 3 fail** (czerwony już w bazie) | 6/3 | 6/3 |
| `river-mouth-gap-enforce-test` | **1 pass / 3 fail** | 2 pass / 2 fail | NIE URUCHOMIONO |
NIE URUCHOMIONO (przekroczenie czasu 560 s przy obciążonej maszynie): `river-map-scale-test`, `map-continents-rivers-test`; `river-path-adjacency-test` (15 map ≈ >20 min) — **zastąpione** tą samą asercją `assertRiverPathAdjacent` w skrypcie pomiarowym na 74 przebiegach tej rundy (0 naruszeń). NIE URUCHOMIONO również `river-grid-coverage-test` (336×238), `map-gen-regression-test`, `world-density-test`, `river-turn-window-test`, `river-fog-visibility-test`.

**Klasyfikacja 46 plików `gra/tools/*river*`** (lista `ls`): testy z progami liczbowymi/pinami zależnymi od generatora — `river-density-test` (≥120 tras, ≥600 hex), `river-grid-coverage-test` (pokrycie `hexMin` 0,75/0,5, mapy 336×238 — ciężki), `river-mouth-gap-enforce-test` (limit ujść 7 / ogon wodny 5), `river-sea-buffer-test` (bufor 2, ujścia ≤7 / ≤42), `river-map-scale-test`, `river-yield-both-sides-test`, `river-loop-test`, `medium-river-test` (`mediumCount>0`, ≥3 hex lądu, `mediumRiverRenderPath ≥2`), `map-continents-rivers-test`, `pangea-river-interior-test`. Lekkie/niezależne od liczb: `river-confluence-edge-test`, `river-path-adjacency-test` (struktura), `river-fog-visibility-test` (hash batcha mgły — zależy od renderu, nie generatora), `mapgen-rivers-fill-centroid-cache-test`. Skrypty diagnostyczne bez asercji: `river-*-debug.cjs`, `river-count-quick.cjs`, `river-density-diag.cjs`, `river-render-diag.cjs`, `_tmp-river-*`. Hashe/golden-pliki generatora (`mapHash`, `golden`): NIE ZNALEZIONO (grep `mapHash|MAP_HASH|golden` w `gra/tools` zwraca testy niezwiązane z mapą).

**Co się przestawi po zmianie (a)/(b)/(c):**
- (a) trzeci poziom = widoczność `tributary` (wariant B): generator bez zmian; do przepięcia tylko testy renderu/mgły (`river-fog-visibility-test`, ewentualnie asercje stage w testach `scene`) — progi `riverGenPhase` w teście `medium-river-test` bez zmian.
  (a′) wariant A/C: zmiana liczby tras → `river-density-test`, `river-grid-coverage-test`, `medium-river-test` (liczby medium), `river-sea-buffer-test`, `river-mouth-gap-enforce-test`.
- (b) 2× źródeł (odstęp 1): `river-density-test` (356 tras — próg ≥120 nie jest przekroczony, ale górne limity gęstości, jeśli dopisane, tak), `river-grid-coverage-test`, `river-sea-buffer-test` (nowy stan: ten sam 6/3), `river-yield-both-sides-test` (7/0 przeszedł), `map-continents-rivers-test`/`river-map-scale-test` (NIE URUCHOMIONO).
- (c) RIVMOUTH: `river-mouth-gap-enforce-test` (nadal 2/2), `river-sea-buffer-test` (6/3), `river-density-test` (4267 hex), `medium-river-test` (38/0).
- Wszystkie trzy: ~226 plików w `gra/tools` odwołuje się do `riverPaths|riverPathKinds|rzeka.obecna`; ponieważ `rand` jest wspólny dla rzek i dalszych etapów (`generator.ts:171,507`), zmiana generatora rzek może przesunąć las, złoża i startowe pozycje — piny gry zależne od konkretnych ziaren (`ai-*`, `spichlerz-*`, `horse-resource-terrain-test`, `hit-mode-test`) NIE ZMIERZONO; trzeba je odpalić jako jedno przepięcie (RIVERS3).
Bramki ciężkie: `river-grid-coverage-test` (336×238), `river-loop-test` (~460 s), `river-sea-buffer-test` (~180–260 s), `river-mouth-gap-enforce-test` (~165–275 s), `river-path-adjacency-test` (>20 min); lekkie: `medium-river-test` (~55 s), `river-confluence-edge-test` (~30 s), `river-density-test` (~140–200 s).

## 7. Odtwarzalność (komendy)
```
node dyspozycje/analizy/river-count-measure-2x.cjs prepare <SCRATCH>      # SCRATCH musi mieć node_modules/esbuild@0.28.2
node <SCRATCH>/measure-one.cjs 84 60 1 base main+medium [kontynenty|ziemia|pangea|wyspy]
RIVER_PATHSEP=1 node <SCRATCH>/measure-one.cjs 168 120 42 base main+medium     # V3
node <SCRATCH>/measure-one.cjs 84 60 1 3.5 main+medium                          # V1
node dyspozycje/analizy/river-count-run.cjs <SCRATCH> jobs.jsonl out.jsonl 4    # wiązka równoległa
node dyspozycje/analizy/river-count-show.cjs out.jsonl                          # tabela
node dyspozycje/analizy/river-tests-run.cjs <SCRATCH> out.jsonl 4 "RIVER_PATHSEP=1" river-density-test.cjs ...
```
`prepare` nakłada oba override'y (`RIVER_CELL`, `RIVER_PATHSEP`) w kopii scratch (nie w repo); bez ustawionych zmiennych środowiskowych zachowanie = stan repo. RIVMOUTH: `git diff e80d07efb bde050bcf -- gra/src/map/gen-helpers.ts | patch -p4 <SCRATCH>/src/map/gen-helpers.ts`. Skrypty NIE modyfikują repo gry.

## 8. Binarne kryterium (stan po rundzie 3)
- Pkt 1 reguły: TAK — przeszukane ścieżki i frazy podane; „trzeci poziom” NIE ZNALEZIONO; N=15 rozstrzygnięte (siatka wody/miedzi, sekcja 1).
- Pkt 2 kod: TAK (sekcja 2, z liniami).
- Pkt 3 pomiar 15 map + 2× źródeł: TAK (sekcje 3.1–3.5; N/√2 nie działa — wykazane; działa odstęp 1).
- Pkt 4 RIVMOUTH: TAK, ze zmierzonym brakiem +12% i testami (4.2); kombinacja V3+RIVMOUTH NIE ZMIERZONO.
- Pkt 5 warianty A/B/C: TAK z liczbami (C = ZAŁOŻENIE).
- Pkt 6 testy/piny: CZĘŚCIOWO — 7 testów uruchomionych, kilka nieuruchomionych z powodu czasu (lista w sekcji 6); wpływ na piny map-zależnych NIE ZMIERZONO.
- `gra/**` bez zmian: TAK.
