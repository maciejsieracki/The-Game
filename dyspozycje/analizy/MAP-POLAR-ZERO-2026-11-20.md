# MAP-POLAR-ZERO — dlaczego climate-band-test widzi 0 heksów polarnych

**Temat:** R-WEB-MAP-POLAR-ZERO-INVESTIGATE-Q1 (#64 POLARZERO) · **Baza kodu (runda 1):** `a3651d373bef071857150b3369e3cbe168995150` (origin/main) · **Kandydat (runda 2):** `c611a62ea` · **Data:** 2026-11-20
**Status:** werdykt **A** (zmiana zachowania generatora w `40a29e4c6`, FALA 142; test wykrywa ją poprawnie). Kod gry i test NIE zmienione w tym temacie. Decyzja właściciela dotyczy tylko tego, czy przywrócić ląd polarny dla kontynentów (naprawa = osobny temat).

**Korekta rundy 2:** wersja z rundy 1 miała błędny werdykt DECISION_REQUIRED/B. Mechanizm „brak lądu w pasie polarnym przez `borderMargin`" został obalony (sekcja 2), a twierdzenie „test był czerwony od wprowadzenia" obalone historią (sekcja 4).

## 1. Co sprawdza test (`gra/tools/climate-band-test.cjs`)

- Bundluje `climateBandAt`, `applyClimateBandsToHexes`, `latitudinalOceanBufferRows`, `generujSwiat`, `TerenBazowy` (esbuild, entry w `gra/tools/`).
- Asercja (linia 75): `generujSwiat(42, 'standardowy', 'kontynenty', {worldDensity: medium})` → `polar > 0` (liczba heksów `TerenBazowy.Polarny`).
- Asercje pustyni, bufora górnego i bufora polarnego Ziemi przechodzą (na bazie i na czerwonym commicie `40a29e4c6`, sprawdzone w rundzie 2 w pełnym przebiegu testu).
- Plik testu ostatnio zmieniony w `f776d4d60` (FALA 33, „strefy klimatyczne"). Od tego commitu asercja polarna jest ta sama.
- Parametry (`gra/src/map/gen-helpers.ts`): `CLIMATE_POLAR_FRAC = 0.05`, bufor oceanu 5 % (dla H=120: 6 wierszy). Pas polarny = wiersze 6–11 i 108–113.

## 2. Bisekcja i mechanizm (zmierzone w rundzie 2)

### 2a. Wynik testu na commitach (pełny przebieg `node tools/climate-band-test.cjs`)

| commit | opis | wynik |
|---|---|---|
| `f776d4d60` | FALA 33, pierwsze wprowadzenie testu | **PASS** |
| `9c4320be0` | fix(mapa) bramki ujść (ostatni zielony przed FALA 142) | **PASS** |
| `40a29e4c6` | FALA 142: land% slider, spawn, half-plane A | **FAIL** (`map has polar terrain (0 hexes)`) |

Pierwszy czerwony commit: **`40a29e4c6`**, jego rodzic `9c4320be0` jest zielony. Pozostałe commity z zarzutu 2 (`853c0e320`, `6f96f0825`, `6be6be373`) NIE ZWERYFIKOWANE w rundzie 2; zakres 6 commitów między `9c4320be0` a `40a29e4c6` jest mierzony bezpośrednio.

### 2b. Co zmienia `40a29e4c6` w generatorze

`git diff 9c4320be0 40a29e4c6 -- gra/src/map/gen-helpers.ts gra/src/map/generator.ts` — cztery hunki w `gen-helpers.ts` i jeden w `generator.ts`:

1. `applyLandFractionByScore` (`gen-helpers.ts` ~l. 3132): kandydaci do erozji lądu: `!== Morze` → `isDryLandTerrain(...)`.
2. `applyLandFractionByContinent` (`gen-helpers.ts` ~l. 3206): liczenie lądu w kontynencie: `!== Morze` → `isDryLandTerrain(...)`.
3. `applyLandFractionByContinent` (`gen-helpers.ts` ~l. 3229): kandydaci do erozji: `!== Morze` → `isDryLandTerrain(...)`.
4. Nowa funkcja `enforceTargetDryLandFraction` (`gen-helpers.ts` ~l. 4223) oraz wywołanie w `generator.ts` ~l. 418–420 (dla `typ !== 'ziemia'`).

`isDryLandTerrain(tb)` (`gen-helpers.ts` l. 3348) zwraca `tb !== Morze && tb !== Wybrzeze`. Zatem od `40a29e4c6` Wybrzeże nie jest liczone jako ląd w trzech powyższych miejscach. Commit opisany jako „land% slider" — semantyka „land%" = suchy ląd jest zamierzona w nowym kodzie (komentarz `enforceTargetDryLandFraction`), ale jej efekt uboczny jest widoczny w teście.

### 2c. Eksperymenty przyczynowe (pomiar: liczba `Polarny` i wiersze, seed 42, standardowy, kontynenty)

| wariant | Polarny | land (heksy nie-woda) | uwagi |
|---|---|---|---|
| `9c4320be0` (zielony) | **81** | 9473 | polarRows `6:1 7:11 8:21 9:12 10:11 11:6 108:4 109:5 110:5 111:4 112:1` |
| `40a29e4c6` (czerwony) | **0** | 9820 | wiersze 4–11: tylko `Morze` i `Wybrzeze` (+ rzadkie `Wzgorza`/`Gory`) |
| `40a29e4c6` + `enforceTargetDryLandFraction` wyłączone (`generator.ts` ~l. 418) | **0** | 9009 | NIE przywraca polarnych → wywołanie nie jest przyczyną |
| `40a29e4c6` + 3 hunki z pkt 1–3 cofnięte do `!== Morze` | **81** | 10548 | polarRows **identyczne** z `9c4320be0` → przyczyna = hunki 1–3 |

Eksperymenty były wykonane na lokalnych, cofniętych po pomiarze zmianach (`git checkout --` po każdym); żadna zmiana nie została zacommitowana.

### 2d. Mechanizm (ustalony częściowo)

- Konwersja klimatu (`applyClimateBandsToHexes`, `gen-helpers.ts` l. 3016; wywołanie `generator.ts` l. 396) zamienia tylko heksy lądowe inne niż `Morze`, `Wybrzeze`, `Gory`, `Wzgorza` (l. 3026–3033). Pas polarny staje się `Polarny` tylko tam, gdzie w tym kroku jest suchy ląd bazowy.
- Na `40a29e4c6` pas 4–11 zawiera praktycznie wyłącznie `Morze`/`Wybrzeze`, więc nie ma czego zamienić. W `9c4320be0` ten sam pas zawiera ląd (`Laka`/`Rownina`/`Polarny` po konwersji).
- Hunki 1–3 zmieniają liczenie i erozję lądu w `applyLandFraction*`; to one przesuwają ląd z pasa polarnego. **NIE ZMIERZONO** dokładnego etapu (przed czy po l. 396), w którym ląd pasa znika — pomiar potwierdza tylko, że zmiana filtra w tych trzech miejscach jest warunkiem wyniku.
- Hipoteza z rundy 1 (`borderMargin = 0.12` w `gen-helpers.ts` ~l. 336–349 wyklucza pas) jest **ODRZUCONA**: ten fragment nie zmienił się w `40a29e4c6`, a ląd w wierszach 5–11 istnieje (`9820` heksów nie-woda, w tym wiersze 5–11 z `Wybrzeze`).

## 3. Pomiar żywej mapy (runda 1, NIE powtórzony w rundzie 2)

Tabela z rundy 1 (baza `a3651d373`, `generujSwiat` z bieżącego `gra/src`, seed × rozmiar × typ):

| seed | rozmiar | typ | buf | liczba `Polarny` |
|---|---|---|---|---|
| 1 | standardowy | kontynenty | 6 | 0 |
| 7 | standardowy | kontynenty | 6 | 0 |
| 42 | standardowy | kontynenty | 6 | 0 |
| 4242 | standardowy | kontynenty | 6 | 0 |
| 42 | malenki | kontynenty | 3 | 0 |
| 42 | standardowy | ziemia | 30 | 0 (projekt: Ziemia bez Antarktydy) |
| 42 | standardowy | pangea | 6 | 146 |

Wnioski z tabeli z rundy 1 — **uogólnienie „żywa gra generuje polar tylko dla Pangei" NIE ZOSTAŁO POTWIERDZONE** i jest wycofane. Potwierdzone w rundzie 2: kontynenty, seed 42, standardowy = 0 na bazie `a3651d373`/`40a29e4c6`/`c611a62` oraz 81 na `9c4320be0`. Pozostałe seedy i typy — NIE ZMIERZONO w rundzie 2.

## 4. Historia — korekta

- Test (plik `gra/tools/climate-band-test.cjs`) pochodzi z `f776d4d60` (FALA 33). Pojawienie się w `a99445016` z rundy 1 było tylko miejscem pierwszego zaobserwowania czerwieni przez Operatora, nie wprowadzeniem testu.
- Test był zielony na `f776d4d60` (PASS) i `9c4320be0` (PASS), czerwony na `40a29e4c6` (FAIL). Zatem jest to regresja zachowania generatora w zakresie 6 commitów `9c4320be0..40a29e4c6`.
- Płytki klon z rundy 1 był uzupełniony (`--deepen`); pełna historia jest dostępna lokalnie (10543 commitów).

## 5. Werdykt

**A — zmiana zachowania generatora w `40a29e4c6`** (`gra/src/map/gen-helpers.ts`, `applyLandFractionByScore` ~l. 3132 i `applyLandFractionByContinent` ~l. 3206, ~l. 3229: filtr `isDryLandTerrain` zamiast `!== Morze`).

- Odtworzenie: w `gra/` na commicie `40a29e4c6` → `node tools/climate-band-test.cjs` → `FAIL: map has polar terrain (0 hexes)`; na `9c4320be0` → `PASS`.
- Zamierzona czy nie: zmiana semantyki „land%" jest zamierzona w kodzie (`enforceTargetDryLandFraction`), ale jej efekt uboczny (zanik pasa polarnego w kontynentach) NIE był zamierzony według dostępnych zapisów. **Decyzja właściciela (ABC):** A1 — przywrócić ląd polarny dla kontynentów (korekta trzech hunków lub osobny warunek dla pasa polarnego; ryzyko: zmiana hashy map i determinizmu); A2 — zaakceptować (wtedy test wymaga zmiany asercji w osobnym temacie z decyzją właściciela); C — zostawić czerwony jako dług kategorii D.
- Operator **nie** rekomenduje wariantu B (osłabienie asercji): przesłanka „stary pin" została obalona.

## 6. Co NIE zostało zmierzone

- Pełny wynik `relief-grid-coverage-test` (runda 1: limity czasu 280 s i 585 s; częściowo PASS). NIE ZMIERZONO w rundzie 2.
- Pozostałe ziarna i rozmiary poza wymienionymi w sekcji 2c/3 — NIE ZMIERZONO.
- Wpływ zaniku pasa polarnego na rozgrywkę (AI, osadnictwo, widok mapy) — NIE ZMIERZONO.
- Wyniki pozostałych commitów z zarzutu 2 (`853c0e320`, `6f96f0825`, `6be6be373`) — NIE ZWERYFIKOWANE w rundzie 2.

## 7. Komendy powtórzenia

```
# z katalogu gra/ na danym commicie (node_modules = symlink do działającego gra/node_modules)
node tools/climate-band-test.cjs                      # 40a29e4c6: FAIL (0 hexes); 9c4320be0 i f776d4d60: PASS
# diagnostyka per wiersz (skrypt poza repo, w scratchpad Operatora): liczy Polarny i lądy wg wiersza
#   node <scratchpad>/polar-diag.cjs <abs-path-gra> <tag> 42 kontynenty
# 9c4320be0: polar 81; 40a29e4c6: polar 0; 40a29e4c6 z cofniętymi hunkami 1–3: polar 81
```
