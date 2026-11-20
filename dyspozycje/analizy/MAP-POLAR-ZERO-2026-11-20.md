# MAP-POLAR-ZERO — dlaczego climate-band-test widzi 0 heksów polarnych

**Temat:** R-WEB-MAP-POLAR-ZERO-INVESTIGATE-Q1 (#64 POLARZERO) · **Baza kodu:** `a3651d373bef071857150b3369e3cbe168995150` (origin/main) · **Data:** 2026-11-20
**Status:** analiza zakończona; werdykt **DECISION_REQUIRED** (decyzja produktowa, nie naprawa). Kod gry i test NIE zmienione.

## 1. Co sprawdza test (`gra/tools/climate-band-test.cjs`)

- Bundluje `climateBandAt`, `applyClimateBandsToHexes`, `latitudinalOceanBufferRows`, `generujSwiat`, `TerenBazowy` (esbuild, entry w `gra/tools/`).
- Asercja w linii 75: `generujSwiat(42, 'standardowy', 'kontynenty', {worldDensity: medium})` → `polar > 0` (liczba heksów `TerenBazowy.Polarny`).
- Asercja w linii 76: pas pustyni ma pustynię (`desert > 0`) — **przechodzi** (228 heksów).
- Asercja w linii 77: górny bufor oceanu bez lądu — **przechodzi** (violations=0).
- Asercja w linii 90: bufor polarny Ziemi (`ziemia`, seed 42) — **przechodzi** (violations=0).
- Wynik na bazie: `FAIL: map has polar terrain (0 hexes)` → `climate-band-test: FAIL (1)` (surowy wynik w 10-operator-claude.md).

Parametry generatora (`gra/src/map/gen-helpers.ts`): `CLIMATE_POLAR_FRAC = 0.05`, bufor oceanu `CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC = 0.05` (dla H=120: 6 wierszy), `innerH = H - 2·buf`. Polarny pas = wiersze relR < 0.05 w obszarze grywalnym (dla H=120: r=6..11 oraz symetrycznie 108..113).

## 2. Mechanizm (ustalone pomiarem)

Dla `kontynenty` / `standardowy` (H=120, W=168) ląd **nie sięga pasów polarnych w ogóle** — na seed 42 wiersze 0–21 są w 100% morzem, a ląd zaczyna się w wierszu 22 (`allRowsLand`: `0:0 … 21:0 22:52 23:106 …`, ostatni ląd w wierszu 97, wiersze 98–119 = 0). Stąd `polar_north` (2016 heksów) i `polar_south` (2016) składają się wyłącznie z `Morze` (2582) i `PlytkieMorze` (1450) — zero `Polarny`.

Przyczyna w kodzie (ustalona przez odczyt, nie przez zmianę):
- `gra/src/map/gen-helpers.ts` ~l. 336–349: środki kontynentów losowane w obszarze `borderMargin = max(2/(w-1), 2/(h-1), 0.12)` → dla kontynentów środki leżą w przedziale 0.12–0.88 wysokości (wiersze ≈ 14–106), a promienie 0.28–0.40. Pas polarny (wiersze 6–11 i 108–113) leży **poza zasięgiem środków kontynentów** już na poziomie projektu układu.
- `marginLandCapForBorderDistance` (l. 1191) ogranicza ląd w pierścieniu d≤10 od krawędzi (d<2 → 0 %, d=3 → 10 %, … d=10 → 45 %). To jest limit **sufitowy**, nie nakaz — nie wymusza braku lądu w d=6–11; brak lądu wynika z układu środków, nie z tego limitu.
- Nakładka klimatu (`applyClimateBandsToHexes`, generator.ts ~l. 421) jest wywoływana po `growMountainRanges`, ale na heksy, które już są lądem; polarny pas bez lądu nie ma czego zamienić.

## 3. Pomiar żywej mapy (realne `generujSwiat`, esbuild bundle z bieżącego `gra/src`)

Komenda powtórzenia (z `gra/`): `node /tmp/<scratch>/polar/diag.cjs <bundle> <seed> <rozmiar> <typ>`, gdzie `<bundle>` = `gra/tools/.climate-band-bundle.cjs` (ten sam entry co test). Skrypt diagnostyczny: `scratchpad/polar/diag.cjs` (poza repo).

| seed | rozmiar | typ | H × W | buf | liczba heksów Polarny | uwagi |
|---|---|---|---|---|---|---|
| 1 | standardowy | kontynenty | 120 × 168 | 6 | **0** | ~115 s |
| 7 | standardowy | kontynenty | 120 × 168 | 6 | **0** | ~96 s |
| 42 | standardowy | kontynenty | 120 × 168 | 6 | **0** | ~114 s (test) |
| 4242 | standardowy | kontynenty | 120 × 168 | 6 | **0** | ~110 s |
| 42 | malenki | kontynenty | 52 × ? | 3 | **0** | ~7 s |
| 42 | standardowy | ziemia | 120 × 168 | 30 | **0** | ~49 s; ziemia bez Antarktydy (projekt) |
| 42 | standardowy | pangea | 120 × 168 | 6 | **146** | rzędy r=8..11 i 108..113 — polarny pas **istnieje** |

Rozkład pasów dla seed 42 kontynenty (`bandCount`): polar_north 2016, temperate_north 6216, plains_north 1344, desert 1008, plains_south 1344, temperate_south 6216, polar_south 2016 — pustynia jest (`desert:Pustynia` 228), polarnych zero.

Wniosek z tabeli: **żywa gra generuje heksy polarne dla Pangei (146 przy seed 42), nie generuje ich dla kontynentów** (we wszystkich zmierzonych ziarnach). Ziemia ma 0 zgodnie z zapisem projektu „Ziemia bez Antarktydy" (WERSJE, FALA 33).

## 4. Historia — czy to regresja?

Historia w tym klonie była płytka; pobrano ją (`git fetch --deepen=200 origin main`) do 1957 commitów. Wyniki:
- Test po raz pierwszy pojawia się w `a99445016` (2026-11-13, merge FC R-WEB-DOCS-CIVPEDIA-DIPLO-REDESIGN-Q1). Ten commit, odtworzony przez `git archive` i zbundlowany tym samym entry, daje **polar = 0** (seed 42, standardowy, kontynenty).
- Commit `851fc3fd8` (wcześniej uznany za „początek historii" przez płytki klon; faktycznie grafted) daje **polar = 0** tym samym pomiarem.
- Baza `a3651d373` daje **polar = 0**.
- Między `a99445016` a bazą zmieniły się w `gra/src/map/` wyłącznie `improvement-build.ts` i `territory.ts` (oraz pliki `gra/src/game/` związane z fortami/ulepszeniami); **`gen-helpers.ts` i `generator.ts` nie zmieniły się** w tym zakresie (potwierdzone `git diff --name-only` dla `gra/src`).
- Commity rzek z 2026-11-14 (`7b06e233c`, `a13a33da4`) zmieniają ścieżki rzek, nie układ lądu i klimatu; nie były jednak osobno zbundlowane.

**Wniosek historyczny:** nie znaleziono commitu, który zmienił wynik testu z zielonego na czerwony — test był czerwony od momentu wprowadzenia w `a99445016`. Ani jeden zmierzony commit nie daje polarnych heksów dla tego układu. Brak dowodu regresji (werdykt A nie jest uzasadniony danymi).

## 5. Werdykt

**DECISION_REQUIRED (ABC do właściciela).** Nie wybieram sam:

- **A (regresja gry)** — NIE potwierdzona: test nigdy nie przeszedł na zmierzonych commitach w tej historii; generator w gałęzi klimatu nie zmienił się.
- **B (stary pin testu)** — prawdopodobna co do mechanizmu (asercja zakłada, że kontynenty sięgają pasa polarnego; układ kontynentów z `borderMargin 0.12` tego nie robi), ale **czy kontynenty mają mieć ląd polarny, jest decyzją produktową** (C-MAP-Q3 mówi o polarnym pasie 5 %, nie precyzuje, czy dotyczy każdego typu mapy). Zmiana asercji bez decyzji byłaby „osłabieniem" testu. Nie wykonano.
- **C (zamierzona zmiana właściciela)** — nie znaleziono wpisu rejestru, który by zmieniał zasięg pasa polarnego dla kontynentów.

### Pytanie ABC do właściciela (propozycja)

- **A —** kontynenty mają zawierać ląd polarny: zmienić układ środków (`borderMargin` / promienie w `gen-helpers.ts` ~l. 336–349) tak, by sięgały wierszy 6–11. Ryzyko: zmiana układu wszystkich kontynentów, hashe map, testy determinizmu, rozkład lądu.
- **B (rekomendacja Operatora) —** test pinuje polarność tam, gdzie generator ją daje: `polar > 0` dla `pangea` seed 42 (146 heksów), a dla `kontynenty` asercja zmienia się na „brak polarnego pasa w układzie kontynentów" (jawnie udokumentowane), bez osłabiania pozostałych asercji. Ryzyko: niskie; zmiana tylko w `gra/tools/climate-band-test.cjs`.
- **C —** zostawić czerwony test do decyzji (TESTDEBT: kategoria D, nie blokuje wdrożeń).

## 6. Co NIE zostało zmierzone

- Pełny wynik `relief-grid-coverage-test` — dwa uruchomienia zakończyły się limitem czasu (280 s i 585 s); częściowy wynik: `PASS: Standard Ziemia: miedź 15×15 ≥85% (3/3)`; reszta NIE ZMIERZONO. Kod gry nie zmieniony, więc wynik względem bazy jest z definicji identyczny, ale liczby nie są kompletne.
- Pozostałe ziarna (poza 1, 7, 42, 4242) i rozmiary (poza standardowy/malenki) — NIE ZMIERZONO.
- Efekt polarnej zmiany na rozgrywkę (AI, osadnictwo) — NIE ZMIERZONO.

## 7. Komendy powtórzenia

```
cd gra && node tools/climate-band-test.cjs            # FAIL: map has polar terrain (0 hexes)
cd gra && node tools/relief-grid-coverage-test.cjs    # długi (>10 min); częściowy PASS
node scratchpad/polar/diag.cjs gra/tools/.climate-band-bundle.cjs 42 standardowy pangea   # polar 146
```
