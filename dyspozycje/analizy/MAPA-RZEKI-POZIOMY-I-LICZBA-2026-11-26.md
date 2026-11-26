# Rzeki: poziomy i liczba źródeł — recon (R-WEB-MAP-RIVER-TIERS-RECON-Q1), runda 2 (po obronie r2)

Baza: origin/main `e70abe718` (ROBOCZA 1953d354, FALA 911). Zero zmian w `gra/**`.
Oznaczenia: ZMIERZONO / NIE ZMIERZONO / ZWERYFIKOWANO KODEM (odczyt linii) / NIE ZNALEZIONO.
Liczby z kodu podane jako plik:linia. Pomiary: sekcja 3.

## 0. Korekty względem rundy 1

- **Domyślna faza generacji to `main+medium`, nie `main`.** `gra/src/map/riverGenSwitch.ts:73` (`return 'main+medium'`); `gra/src/map/generator.ts:493` (`isRiverGenMainOnly`) jest prawdziwe tylko dla `main`. Runda 1 błędnie napisała „domyślnie tylko główne”. ZMIERZONO w logu pomiaru: `[civ] riverGenPhase: main+medium`.
- **Domyślnie generowane są też dopływy (`tributary`).** Miejsca powstania `gra/src/map/gen-helpers.ts:11861` (`pushTributary`) i `:11873` (`pushMedium`) leżą PRZED bramką `if (!isRiverGenFull())` w `gen-helpers.ts:11971`. Bramka blokuje etap 3 (`short`, od `gen-helpers.ts:11888`) i dekoracyjne dopływy od ~12007. ZMIERZONO: domyślnie typy `main`, `medium`, `tributary` na każdej z 15 map; `short` = 0 na wszystkich 15.
- **Filtr renderu, nie generator, ukrywa dopływy.** `gra/src/render/scene.ts` (`filterRiverPathsForStage`, ok. l.1539–1546): stage 2 dodaje tylko `main` i `medium`; `tributary` i `short` dopiero przy stage ≥ 3. Domyślny stage = 2 (`scene.ts`, `return 2; // FALA 174: główne + średnie (Maciej playtest)`). Czyli ukrycie dopływów jest decyzją właściciela z playtestu FALA 174, a nie usterką — ZWERYFIKOWANO KODEM.
- Wniosek: „trzeci poziom” nie brakuje w generatorze w sensie kodu (`short` istnieje, ale jest zablokowany bramką `all`). Brakuje decyzji właściciela, który typ ma być trzecim poziomem i czy pokazywać `tributary` domyślnie (sekcja 5).

## 1. Reguły historyczne (co ustalono o poziomach)

**Przeszukane ścieżki:** `docs/obieg/**`, `docs/decyzje/**`, `docs/archiwum/**`, `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, `dyspozycje/PYTANIA-OTWARTE.md`, `gra/data/*river*`, `gra/src/map/*`.
**Słowa (grep, bez rozróżnienia wielkości liter):** `trzeci poziom`, `trzeciego poziomu`, `poziom 3` + rzek, `krótk… rzek`, `dopływ`, `tributary`, `AC-7`, `FALA 170`, `monoton…`.
**Wynik:** trzeci poziom rzek — NIE ZNALEZIONO w `docs/archiwum/**` ani `docs/decyzje/**` ani w rejestrze. Trafienia słów kluczowych dotyczą innych tematów (np. `docs/decyzje/R-AI-TRUDNOSC-AUDYT.md:118` „Poziom 3 — Trudny”; `docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md:102,210` „dopływy 0 naruszeń”; `docs/decyzje/A3-SPEC-WDROZENIA.md:95` „AC-7” dotyczy ruchu jednostek, nie rzek; `FALA 170` nie występuje w przeszukanych plikach o rzekach). NIE PRZESZUKANO jeszcze wszystkich 1500+ linii `REJESTR` pod kątem każdego zdania — wniosek NIE ZNALEZIONO dotyczy wyników grepa.

Reguły o rzekach, które ZNALEZIONO (cytowane):
- **Główny nurt i dopływ:** `docs/obieg/MAPA-RZEKI-SPEC.md:69–78` (§5 „Główny nurt + dopływy”): główny nurt 100% półszerokości, dopływ `tributary` **50%** (2× cieńszy), max ~2 dopływy na długi main (≥12 hex), łączy się z main w połowie trasy, generowany PO siatce main. Wpis zmiany: `MAPA-RZEKI-SPEC.md:126` (2026-07-04, „main/tributary”).
- **Pokrycie siatki:** `MAPA-RZEKI-SPEC.md:38` „Dopływy nie liczą się do pokrycia siatki”; min. odstęp źródeł ~0,8·N (`MAPA-RZEKI-SPEC.md` §2, ok. l.29–40).
- **Dopływy (historia, bez trzeciego poziomu):** `docs/obieg/MAPA-KANON-GENERATOR.md:34–35` (`main` + `tributary` 2× cieńszy; „dopływy nie liczą się do siatki”); `dyspozycje/PYTANIA-OTWARTE.md:1580–1587` (BUG-RZEKI-DOPLYWY, 2026-07-29: dopływy mają łączyć się z rzekami głównymi albo wpadać do morza); `:1793` (2026-08-02, opcja 2: dopływy od main co 4 boki hex, prostopadle); `:1809–1811` (FALA 187: dopływy wpadają najbliższym połączeniem bez zawijania, kierują się ku centrum 5×5); `:1969–1970` (FALA 188: rzeki wzdłuż boków Pangei, brak widocznych dopływów — regres).
- **Widoczność domyślna:** `gra/src/render/scene.ts` (komentarz FALA 174, patrz sekcja 0) — właściciel świadomie zostawił domyślnie główne + średnie.

Wniosek: w dokumentacji istnieją dwa poziomy (główny, boczny = `tributary`/`medium`); reguła „trzeciego poziomu” nie została nigdzie zapisana.

**Otwarte w dokumentacji (N=15 vs 5):** `MAPA-RZEKI-SPEC.md:29` i tabela §2 (`:32–35`): N=15 to wartość dla tieru kreatora „Normalnie” i jest opisana kolumną „Efekt: woda + miedź” oraz „wdrożone, Maciej 20:34”. `MAPA-FAIR-PLAY-SIATKA.md` opisuje 15×15 jako siatkę WODY. Kod rzek: `gra/src/map/newGameMapDefaults.ts:281–285` (`riverGridCellSizeForTier`, komentarz „Maciej 2026-08-01: medium 10→5, low 15→10”) daje 5 dla medium, 10 dla low, 5 dla high. Ten komentarz jest NOWSZY od wpisu specu (2026-07-04), więc kod odzwierciedla późniejszą decyzję właściciela; ale tabela specu nadal podaje N=15 jako siatkę rzek. Dokument wdrożenia „20:34” NIE ODCZYTANO, więc rozstrzygnięcie pozostaje NIE ROZSTRZYGNIĘTE. Dodatkowo: fallback `gra/src/map/gen-helpers.ts:8600–8602` (`riverCoverageCellSize` bez w,h) zwraca **10** dla medium, a `newGameMapDefaults.ts:285` daje 5 — niespójność w kodzie, do wyjaśnienia (ZWERYFIKOWANO KODEM).

## 2. Stan kodu — rodzaje rzek i miejsca powstawania

| Rodzaj | Gdzie powstaje | Bramka | Render (stage) |
|---|---|---|---|
| `main` | `generateRivers` (`gen-helpers.ts:11790`), siatka `mainCell` | zawsze | stage ≥1; szerokość `scene.ts:1323–1324` `min(1.35, 0.85+len·0.008)` |
| `medium` | `pushMedium` (`gen-helpers.ts:11873`), `traceMediumRiver` (≈9478) | przed bramką (zawsze, także domyślnie) | stage ≥2 (domyślny) |
| `tributary` | `pushTributary` (`gen-helpers.ts:11861`), `addTributariesForMainRiver` (8537/8586), dekoracyjne ~12007 | przed bramką (zawsze); dekoracyjne pomijane dla Pangei/`largeMapPerf` | **stage ≥3 — domyślnie UKRYTE** (`scene.ts`) |
| `short` | etap 3, `generatePhase3ShortRivers` (od `gen-helpers.ts:11888`) | tylko `isRiverGenFull()` (`gen-helpers.ts:11971`), czyli `?riverGenPhase=all` | stage ≥3 |

Szerokość renderu dopływów/krótkich (`scene.ts:1325–1328`): `widthMul` 0,4 (<10 hex) / 0,55 (<18) / 0,7 (≥18) względem półszerokości głównej. Spec §5 (`MAPA-RZEKI-SPEC.md:76`) podaje 50% dla `tributary`. Wartość „25%” z rundy 1 usunięta — brak źródła.

Siatka źródeł: `resolveRiverMapParams` (`newGameMapDefaults.ts:338`), `mainCell = riverGridCellSizeForTier(tier)` (`newGameMapDefaults.ts:281–285`): low=10 · medium=5 · high=5. `tributaryCell = max(3, round(mainCell·0,5))`. `mainGridStride = 1`.

## 3. Pomiar

**Metoda (odtwarzalna):** bundle esbuild z `gra/src/map/generator.ts` (eksport `generateMap`), wywołanie `generateMap(w, h, seed, 'kontynenty', { mapSizeMenuLabel: 'Standardowy', worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' } })`, zliczenie `riverPathKinds` i długości `riverPaths`, czas = `Date.now()` wokół wywołania. Skrypt (`measure.cjs`, `esbuild.buildSync` do `bundle.cjs`) leży w scratchpadzie sesji, NIE w repo (zgodnie z allowlistą). Pozycje siatki map: `gra/tools/river-path-adjacency-test.cjs:25–29` (`seeds = [1, 7, 42, 99, 2026]`, `sizes = [[84,60],[168,120],[240,168]]`).

**Pomiar ponowiony w tej rundzie (ZMIERZONO):**
- 240×168 seed 99: main 203 / 2684 hex, medium 103 / 1466, tributary 118 / 1879; czas 205 016 ms (poprzedni przebieg 207 031 ms) — zgodne.
- 240×168 seed 2026: main 234 / 2917, medium 96 / 1338, tributary 103 / 1554; czas 213 193 ms (poprzedni 211 042 ms) — zgodne.

**Pozostałe 13 map (ZMIERZONO w poprzedniej rundzie tym samym torem; NIE PONOWIONO w tej rundzie):**

| Rozmiar | Seed | main (liczba / hex) | medium | tributary | źródeł main | czas gen. (ms) |
|---|---|---|---|---|---|---|
| 84×60 | 1 | 47 / 425 | 25 / 273 | 8 / 98 | 47 | 10 535 |
| 84×60 | 7 | 40 / 385 | 29 / 301 | 18 / 229 | 40 | 3 957 |
| 84×60 | 42 | 45 / 408 | 16 / 173 | 12 / 142 | 45 | 4 345 |
| 84×60 | 99 | 45 / 417 | 19 / 220 | 13 / 178 | 45 | 3 575 |
| 84×60 | 2026 | 45 / 425 | 22 / 195 | 15 / 180 | 45 | 3 954 |
| 168×120 | 1 | 124 / 1473 | 44 / 549 | 81 / 1285 | 124 | 142 443 |
| 168×120 | 7 | 137 / 1662 | 50 / 711 | 59 / 934 | 137 | 58 503 |
| 168×120 | 42 | 120 / 1423 | 42 / 580 | 67 / 1023 | 120 | 60 849 |
| 168×120 | 99 | 136 / 1681 | 41 / 554 | 74 / 1067 | 136 | 55 009 |
| 168×120 | 2026 | 130 / 1504 | 55 / 763 | 63 / 1047 | 130 | 39 179 |
| 240×168 | 1 | 204 / 2518 | 87 / 1199 | 146 / 2159 | 204 | 219 828 |
| 240×168 | 7 | 213 / 2790 | 94 / 1403 | 119 / 1848 | 213 | 119 238 |
| 240×168 | 42 | 188 / 2574 | 97 / 1377 | 141 / 2119 | 188 | 150 350 |

Zbiorczo: wszystkie 15 map ZMIERZONO (13 w poprzedniej rundzie, 2 ponownie w tej). `tributary` na mapę: **8–146** (min. 8 = 84×60 seed 1; max 146 = 240×168 seed 1). `short` = 0 na wszystkich 15.

Typu `short` nie ma w żadnej mapie w domyślnej fazie (bramka, sekcja 2).

**Widoczne domyślnie (`main`+`medium`) i ukryte (`tributary`) — 240×168:** seed 99 = 203+103 = 306 widoczne, 118 ukryte; seed 2026 = 234+96 = 330 widoczne, 103 ukryte. Na 168×120 seed 42: 120+42 = 162 widoczne, 67 ukryte.

**Źródła i podwojenie:** ZMIERZONO liczbę startów `main` (= źródeł): 40–47 (84×60), 120–137 (168×120), 188–234 (240×168). NIE ZMIERZONO wpływu zmiany `mainCell` ani 2 startów na komórkę na tę liczbę (wariant NIE wykonany — wymagałby zmiany kodu w worktree; poza zakresem recon).

**Czasy:** pojedyncze przebiegi na współdzielonej maszynie; wariancja duża (168×120 seed 1 = 142 s vs seed 7 = 58 s; 240×168 seed 2026 zmierzony dwukrotnie: 211 s i 213 s). Traktować jako rząd wielkości.

## 4. Parametry liczby źródeł i podwojenie

- Źródła główne = komórki siatki `mainCell` × 1 start na komórkę (stride 1).
- **Podwojenie źródeł:** dwie możliwości — (a) zmniejszenie boku komórki: (5/4)² = 1,56× dla boku 4; ×2 wymaga boku ≈ 3,5, nieosiągalnego przez całkowite `Math.floor(q/cellSize)`; (b) zachować bok 5 i dać 2 starty na komórkę (zmiana pętli startów). NIE ZMIERZONO liczby rzek ani czasu po żadnym z wariantów.
- Parametr min. odstępu źródeł `~0,8·N` trzeba przeliczyć przy zmianie boku, inaczej źródła się zlepią (spec §2).
- **RIVMOUTH-wip/fc3 = bde050bcf (ODCZYTANO W DIFFIE):** commit NIE jest przodkiem `f341dd5` (baza). `git diff f341dd5 bde050bcf` pokazuje 11 plików / +214 −463, z czego większość to COFNIĘCIE zmian już wdrożonych w main. Właściwa zmiana generatora to `gra/src/map/gen-helpers.ts` (+101): (1) `if (nd < 1) continue;` ok. `gen-helpers.ts:6386` w `collectInlandDrainGrowCandidates`; (2) pole `allowForkMouth?` w `GridSourcePlaceCtx` (~9381); (3) funkcja `tryForkMouthAtGap` (~9721), wołana ok. 9878 — dokłada odnogę ujściową 3 hex od istniejącego main; plus test `gra/tools/river-mouth-gap-enforce-test.cjs` (+106). WNIOSEK: nie scalać gałęzi całościowo; integracja = cherry-pick tych zmian na aktualny main.
- **„+12% wydajności” z RIVMOUTH:** liczba pochodzi z wiadomości commita bde050bcf („wydajnosc +12% potwierdzona”) i NIE ZOSTAŁA zweryfikowana w tej rundzie. Traktować jako twierdzenie autora, nie fakt.
- **Ryzyka (NIE ZMIERZONO, testy nie uruchomione):** reguła sąsiedztwa (`river-path-adjacency-test.cjs`), bufor od morza (`river-sea-buffer-test.cjs`), odstęp ujść (`river-mouth-gap-enforce-test.cjs` — tylko w gałęzi), wpływ bde050bcf na liczbę rzek i czas (wymagałby checkoutu gałęzi).

## 5. Projekt trzeciego poziomu (warianty do wyboru, skutek dla gracza)

Warianty różnią się skutkiem dla wyglądu mapy. Liczby z sekcji 3; koszt generowania NIE ZMIERZONO dla żadnego wariantu.

- **Wariant A — trzeci poziom = `short`:** włączyć etap 3 domyślnie (`getRiverGenPhase` → `all`) i pokazać `short` domyślnie (stage ≥3). Gracz zobaczy krótkie odgałęzienia; `short` na mapach obecnie = 0 (bramka), więc liczba rzek widocznych wzrośnie o wynik etapu 3 — NIE ZMIERZONO. Za: kod istnieje (FALA 174/177). Przeciw: czas generowania rośnie o etap 3 (NIE ZMIERZONO); wymaga zmiany domyślnego filtra renderu; odwraca decyzję FALA 174 (domyślnie tylko główne + średnie).
- **Wariant B — pokazać domyślnie `tributary` (bez nowego typu):** zmiana wyłącznie w `filterRiverPathsForStage` / domyślnym stage. Gracz zobaczy dopływy, już generowane. Liczba widocznych rzek (ZMIERZONO): 240×168 seed 99 306 → 424 (+118); seed 2026 330 → 433 (+103); 168×120 seed 42 162 → 229 (+67). Za: najmniejsza zmiana kodu, bez zmiany koszt generacji. Przeciw: dopływy 2× cieńsze będą gęstszym siatkiem na mapie; odwraca decyzję FALA 174; trzeci poziom nie powstaje — jest tylko „boczny” pokazany.
- **Wariant C — nowy czwarty typ (dopływ dopływu), generowany po `tributary`:** nowy `kind` w `gra/src/types/map.ts`, render w `scene.ts`, serializacja i testy. Za: wyraźna hierarchia główne → boczne → trzeciego poziomu, bez zmiany znaczenia istniejących typów. Przeciw: najwięcej pracy i ryzyka dla pinów; liczba i koszt NIE ZMIERZONO.

Decyzja wymagana (pytanie ABC do właściciela, nie rozstrzyga Operator): (1) czy „trzeci poziom” = `short` (A), pokazany dopływ (B) czy nowy typ (C); (2) czy dopływy (`tributary`) mają być widoczne domyślnie — to zmiana wyglądu, bo są już generowane; (3) siatka rzek 5 (kod) czy 15 (spec §2) — sekcja 1.

## 6. Testy i piny zmieniane przez (a) trzeci poziom, (b) 2× źródeł, (c) RIVMOUTH-wip/fc3

Odczytano przez grep (linie podane) — NIE URUCHOMIONO żadnego testu w tej rundzie. Progi poniżej to stan zapisany w pliku, nie wynik.

- `gra/tools/river-path-adjacency-test.cjs:25–29` — `seeds` (5 ziaren), `sizes` (3 rozmiary), `M.generateMap(w,h,seed)` (domyślna faza); asercje: długość trasy ≥2, `assertRiverPathAdjacent` (l.~37–40). Zmiana (b) i (c) może zmienić liczbę tras, nie warunek sąsiedztwa. Lekki.
- `gra/tools/river-density-test.cjs:48` — `generateMap(168,120,4242,'kontynenty',…)`; asercje l.63–64: ≥120 tras, ≥600 heksów z krawędzią rzeki. Zmiana (a) (widoczność) i (b) (2× źródeł) może przekroczyć lub nie dojść do progu — **pin do przepięcia przy (b)**. Średni.
- `gra/tools/river-grid-coverage-test.cjs:81–83` (mapy: 168×120 kontynenty seed 42, 168×120 ziemia seed 7, 336×238 ziemia seed 99); progi pokrycia siatki `hexMin` 0,75 (kontynenty) / 0,5 (ziemia) l.156; minimalna masa 150 / 200 hex l.160. Zmiana (b) zmienia gęstość siatki — **pin do przepięcia przy (b)**. Ciężki (336×238).
- `gra/tools/medium-river-test.cjs:84–142` — mapy 120×90 (pangea seed 42, standardowy seed 99); asercje `mediumCount>0` (l.142), `countMediumInlandLandHexes ≥3` (l.129), `mediumRiverRenderPath ≥2` (l.131). Zmiana (a) (B: widoczność) nie zmienia tych progów; zmiana (c) może. Lekki.
- `gra/tools/map-gen-regression-test.cjs`, `river-sea-buffer-test.cjs`, `river-confluence-edge-test.cjs`, `river-yield-both-sides-test.cjs`, `river-turn-window-test.cjs`, `map-continents-rivers-test.cjs`, `world-density-test.cjs` — NAZWY ZNANE, zawartość i progi NIE ODCZYTANE w tej rundzie. Przypisanie do (a)/(b)/(c) = hipoteza po nazwie.
- `gra/tools/river-mouth-gap-enforce-test.cjs` — istnieje tylko w gałęzi bde050bcf (+106); (c).
- Piny/hashe: NIE ZMIERZONO — nie przeszukano `dyspozycje/` pod kątem pinów rzek.

## Binarne kryterium (stan po rundzie 2)
- Pkt 1 (reguły): CZĘŚCIOWO — przeszukane ścieżki i słowa z sekcji 1; trzeci poziom NIE ZNALEZIONO w przeszukanych plikach; nie przeczytano w całości REJESTRU i pełnych `docs/archiwum/**`.
- Pkt 2 (kod): TAK — sekcja 0 i 2, z liniami.
- Pkt 3 (pomiar 15 map): CZĘŚCIOWO — 15/15 ZMIERZONO (2 ponownie w tej rundzie, zgodne z poprzednim pomiarem). Liczba źródeł po podwojeniu: NIE ZMIERZONO.
- Pkt 4: CZĘŚCIOWO — parametry i miejsca wskazane; RIVMOUTH odczytany (sekcja 4); wpływ na liczbę rzek i „+12%” NIE ZMIERZONO.
- Pkt 5: TAK w wariantach A/B/C (sekcja 5) z liczbami widoczności; koszt generowania NIE ZMIERZONO.
- Pkt 6: nazwy i progi z linii plików TAK (sekcja 6); uruchomienie NIE.
- Pkt 7 (uruchomienie lekkich testów rzek i piny): NIE ZMIERZONO.
- `gra/**` bez zmian: TAK.

Kryterium dispatchu (pkt 1–7 spełnione) NIESPEŁNIONE — pozostają: 2× źródeł (pkt 3/4), uruchomienie testów (pkt 7), koszt wariantów (pkt 5).
