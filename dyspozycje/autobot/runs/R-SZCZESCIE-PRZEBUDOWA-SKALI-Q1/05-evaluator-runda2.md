# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Evaluator, runda 2

STATUS: PASS-WITH-NOTES (werdyktu nie wydaję — Final Control)
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
ROLA: Evaluator · MODEL+EFFORT: Opus 5, effort high
GOAL: sprawdzić realnie, czy runda 2 PRZEPISAŁA osiem bramek na kontrakt G1–G15 bez ich
osłabienia, czy liczby balansu właściciela są nietknięte i czy parytet panel↔silnik (G15)
jest rozwiązany u źródła.
IZOLACJA: worktree `/home/user/wt-szczescie-skala`, gałąź `autobot/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`.
Baza `f570a91a301af83c06c3eb2544fd2ce9fb68aabb`. **Stan oceniany: `54504810`** (drzewo gra/ =
`643c4abe`; `54504810` dokłada wyłącznie tekst dispatchu).

## SPOSÓB PRACY — dlaczego mierzyłem POZA głównym worktree

Na starcie `git status` w `/home/user/wt-szczescie-skala` był czysty, HEAD = `00afd4d9`.
W trakcie mojej pracy gałąź przesunęła się do `54504810`, a drzewo zabrudziło się trzema
plikami (`gra/data/society-params.json`, `gra/src/game/growth-happiness.ts`,
`gra/src/game/society-breakdown.ts`) — to praca Operatora rundy 3, w locie. Żeby nie mierzyć
cudzej niezacommitowanej pracy i **żeby jej nie skasować**, wszystkie pomiary i wszystkie
mutacje wykonałem w osobnych, własnych worktree:

```
git worktree add --detach /tmp/eval-r2-base f570a91a301af83c06c3eb2544fd2ce9fb68aabb   # PRZED
git worktree add --detach /tmp/eval-r2-head 54504810                                    # PO
```

Pomiary zrobione wcześniej w brudnym drzewie powtórzyłem w czystym `/tmp/eval-r2-head` —
wyszły **co do liczby identycznie**, więc kontaminacji nie było. W głównym worktree nie
zapisałem nic poza tym raportem.

---

## PUNKT 1 — CZY BRAMKI ZOSTAŁY PRZEPISANE, CZY OSŁABIONE

Liczba asercji policzona **własnym uruchomieniem** obu wersji (`OK + FAIL` z linii
podsumowania każdej bramki), nie z raportu Operatora.

| bramka | PRZED (`f570a91a`) | PO (`54504810`) | Δ |
|---|---:|---:|---:|
| `logic-test.cjs` | 213 | 213 | 0 |
| `society-breakdown-test.cjs` | 43 | 53 | **+10** |
| `szczescie-zamoznosc-test.cjs` | 60 | 88 | **+28** |
| `szczescie-skala-normalizacja-test.cjs` | 132 | 141 | **+9** |
| `building-happiness-test.cjs` | 8 | 14 | **+6** |
| `r-wzrost-…-ceramika-test.cjs` | 52 | 54 | **+2** |
| `war-happiness-parity-test.cjs` | 18 | 21 | **+3** |
| `wealth-test.cjs` | 28 | 36 | **+8** |
| `citizen-resource-upkeep-test.cjs` (spoza ósemki) | 109 (109/0) | 109 (107/**2**) | 0 / czerwona |

**Ani w jednym pliku liczba asercji nie spadła.** `logic-test` utrzymuje 213, bo jego harness
liczy jeden `assert(...)` jako jeden test — przepisana asercja `:1370` urosła wewnętrznie
z 3 do 6 warunków (`0.8`, `-0.8`, `0`, `1`, `-1`, `0.5`).

Poza ósemką sprawdziłem też, czy nie zniknęło pokrycie w reszcie rodziny — PRZED vs PO
identycznie: `happiness-breakdown` 38/38, `culture-religion` 65/65, `porzadek-panel-czytelnosc`
81/81, `empire-religia-panel-coverage` 15/15, `ai-dlug-porzadki` 17/17,
`city-orderstate-restore-clear` 9/9.

### Czy przepisane asercje coś mierzą, czy są tautologiami

Skan wszystkich dziewięciu plików (własny skrypt) na `assert(true)`, `ok(true)` oraz
porównania wyrażenia z samym sobą (`eq(X, X, …)` / `near(X, X, …)`) — **zero trafień**.

Odczyt treści potwierdza, że asercje niosą liczby właściciela jako literały, a nie odczyt
z implementacji, m.in.:

- `szczescie-zamoznosc-test.cjs:70` — `const SKALA = [-90/9, -70/9, …, 90/9]` z komentarzem
  „liczby wypisane WPROST z reguły, nie odczytane z implementacji”; 0% → −10, 90% → +10,
  45% → 0 sprawdzane osobno (`:97-102`).
- `logic-test.cjs:1379-1384` — sześć literałów `0.8 / -0.8 / 0 / 1 / -1 / 0.5`, nie
  `=== religionParams.cokolwiek`.
- `society-breakdown-test.cjs:196-202` — skan po ŹRÓDLE `society-breakdown.ts` na
  `happinessBucketsFromPct`, z jawnym uzasadnieniem, że
  `typeof M.happinessBucketsFromPct === 'undefined'` byłoby tautologią (entry point i tak
  tej funkcji nie eksportuje).
- `war-happiness-parity-test.cjs:145-158` — trzy asercje antydryfowe: JSON = `-5`, kara
  z JSON = kara ze stałej TS, `easy === normal === hard`.

Dwa przypadki, w których asercja jest **mocniejsza** niż przed:
`szczescie-skala-normalizacja-test.cjs:169-170` dokłada warunek, że `szMaxByEra` **różni się**
od `SZMAX_DEFAULTS` — przy dawnych równych liczbach (14/20/28 w obu nośnikach) nie dało się
odróżnić „wczytano z JSON” od „wzięto fallback”; oraz `szczescie-zamoznosc-test.cjs:120-131`,
gdzie 18 asercji granic bracketów zamieniono na 18 asercji **braku schodków** (`w(10) < w(19)`
itd. — pary, które przed G7 dawały identycznie).

Jedna asercja jawnie **bez odpowiednika** i tak nazwana w raporcie Operatora: `karaBrakReligii`
przy rozłamie 50/50. W jej miejscu `logic-test` sprawdza teraz `=== 0` (skala proporcjonalna
daje przy 50/50 dokładnie zero) — to decyzja G4 właściciela, nie usunięcie pokrycia.

**Wniosek punktu 1: bramki zostały przepisane, nie osłabione.**

---

## PUNKT 2 — CZY LICZBY BALANSU SĄ NIETKNIĘTE

Własny odczyt (`python3 json.load` po plikach z `/tmp/eval-r2-head`, czyli z commitu, nie
z brudnego drzewa) plus strukturalny diff `f570a91a` → `54504810` klucz po kluczu.

| pozycja dispatchu | wartość w danych | zgodność |
|---|---|---|
| kultura/religia 10/16/23 | `szczescie_skala_kultura_religia` easy/normal/hard = `[10,16,23]` ×3 | ✅ |
| podatki −10…+10 | `szczescie_podatki_min` −10 ×3, `szczescie_podatki_max` 10 ×3, `prog_pct` 90 ×3 | ✅ |
| zaopatrzenie ±2 | `citizen-resource-upkeep.json` → `_kara.szczescieZaDostepny: 2`, `szczescieZaBrakujacy: -2` | ✅ |
| wojna −5 | `szczescie_kara_wojna` = −5 ×3 | ✅ |
| osiedle `[15,12,8,5]` | `szczescie_bonus_osiedle_pop` = `[15,12,8,5]` ×3 | ✅ |
| cuda +6 | `koloseum`, `roquepertuse`, `stupa_sanchi`, `mundo_perdido`, `palac_weiyang`, `posag_peruna` = 6; **i tylko te sześć** ma `miasto.zadowolenie` | ✅ |
| Spichlerz +5 | `spichlerz.baza.zadowolenie = 4`, `spichlerz_ii = 4` (+1 ryczałt = 5); Świątynia 2+1=3, Teatr 3+1=4, Akademia 3+1=4 — bez zmian | ✅ |
| `szczescie_max_epoka` | easy `[20,40,60]`, normal `[30,50,70]`, hard `[35,55,80]` | ✅ |
| `szczescie_pct_cap` 120 | 120 ×3 | ✅ |

Strukturalny diff `society-params.json` (bez pól `opis`/`jednostka`) — **wyłącznie** to,
czego żąda dispatch:

- USUNIĘTE (13 kluczy): 7 martwych z G14 (`szczescie_kara_obca_kultura`,
  `szczescie_bonus_produkcja_wartosc`, `szczescie_bonus_wzrost_wartosc`,
  `szczescie_prog_bonus_produkcja`, `szczescie_prog_bonus_wzrost`, `szczescie_prog_bunt`,
  `szczescie_prog_strajk_produkcja`) + `szczescie_swiatynia`, `szczescie_amfiteatr` (G3)
  + `szczescie_kara_obca_religia`, `szczescie_kara_podboj_podwojna_obca` (G5)
  + `szczescie_kara_wielkosc_miasta` (G12) + `szczescie_siatka_zamoznosc` (G7).
- DODANE: `szczescie_podatki_min/max/prog_pct` (G7), `szczescie_skala_kultura_religia` (G4).
- ZMIENIONE: wyłącznie `szczescie_bonus_osiedle_pop`, `szczescie_kara_wojna`,
  `szczescie_max_epoka`.
- `szczescie_max_pop_wspolczynnik` = **0,038 / 0,048 / 0,058 — NIETKNIĘTY**, zgodnie z
  §GRANICE dispatchu rundy 1. Ratyfikacja rundy 3 (0,04 ×3) to zakres rundy 3, nie 2.
- `szczescie_zaopatrzenie_na_surowiec` (obejście z rundy 1) **usunięty** z danych i z kodu;
  jedyne wystąpienia to komentarz i asercja NEGATYWNA w bramce. Jeden nośnik liczby, nie dwa.

`buildings.json`: diff to wyłącznie 41 × `dajeSzczescie` + dwa `zadowolenie` Spichlerza.
Własna klasyfikacja 41 rekordów wobec list dispatchu: **19 × `true`, 22 × `false`, zero
rozbieżności, zero brakujących/nadmiarowych id.** `wonders.json`: pięć razy `3 → 6`,
`koloseum` już miało 6. `econ-params.json`: jeden klucz (`wealth_zadowolenie_na_10pkt` →
`wealth_zadowolenie_max` = 10 ×3), uzasadniony G6 — allowlista tego wprost dopuszcza.

Własne przeliczenie `BUD` po zwinięciu łańcuchów `upgradeFrom` (niezależnie od bramki):
**11 / 23 / 31 budynków → BUD = 14 / 25 / 42.** Zgodne z dispatchem co do jedności.

`git diff f570a91a 54504810 --check` → czysto (exit 0), brak skażenia `export-data`.

**Wniosek punktu 2: zero odstępstw. Żadna liczba właściciela nie została strojona.**

---

## PUNKT 3 — `logic-test` 213/213 i zakres diffu

```
$ cd /tmp/eval-r2-head/gra && node tools/logic-test.cjs | tail -1
 LOGIC OK (213/213)
```

`git diff f570a91a301af83c06c3eb2544fd2ce9fb68aabb -- gra/tools/logic-test.cjs` to
**dokładnie jeden hunk `@@ -1366,11 +1366,29 @@`** — komentarz nad asercją plus sama asercja
`:1370`. Poza tym jednym miejscem plik jest bajt w bajt jak baza. Zakres ratyfikacji rundy 2
(„wyłącznie asercja `:1370`; reszta pliku NIETKNIĘTA”) dotrzymany.

---

## PUNKT 4 — `gra/src/main.ts`

```
$ git diff f570a91a301af83c06c3eb2544fd2ce9fb68aabb 54504810 --name-only | grep -c "main.ts"
0
```

25 plików w diffie, **`gra/src/main.ts` nieobecny**. Wszystkie 25 mieszczą się w allowliście
po ratyfikacjach rund 2 i 3 (12 z commitu rundy 2 + `cityPanel.ts`, `culture-religion.ts`,
`wealth.ts`, `economy.ts`, `conquest-stability.ts`, `buildings.json`, `wonders.json`,
`econ-params.json` z rundy 1 + pliki runu).

---

## PUNKT 5 — PARYTET PANEL ↔ SILNIK (G15), SPRAWDZONY W KODZIE

**Punkty Szczęścia powstają w JEDNYM miejscu.** `computeHappinessBreakdown`
(`gra/src/game/society-breakdown.ts:617`) jest opisane w nagłówku jako „JEDYNE miejsce,
w którym powstają punkty Szczęścia” i faktycznie tak działa:

- `culture-religion.ts:821` — `religionHappiness()` zwraca teraz `2 * religionOwnShare(...) - 1`,
  czyli **znormalizowany wskaźnik [−1,+1]**, a nie punkty. Komentarz mówi to wprost, a
  sygnatura zachowuje `_params`/`_hasSwiatynia` tylko dla zgodności wywołań.
- `society-breakdown.ts:636-655` — dopiero tu wskaźnik jest mnożony przez `x(epoka)`
  (`kultReligScaleForEra` × `proporcjonalneSzczescie`).
- `cityPanel.ts:3054-3140` — panel **nie liczy własnej linii Kultury/Religii**. Podaje surowy
  `ownCultureShare` i wskaźnik `haRel` do `evaluateOrderFromBreakdown`, czyli do tego samego
  kodu, który woła silnik. Karta Religii idzie przez `religiaSzPunkty()` (`:2990-2997`), który
  używa `kultReligScaleForEra` + `proporcjonalneSzczescie` + `ownShareFromSignal`
  **importowanych z `society-breakdown`**, nie własnej skali.
- `cityPanel.ts:3134-3138` — `haCuda` i `atWar` czytane z `cfg.getOrderState(city.id)?.szLines`,
  czyli z linii, które silnik już policzył (naprawa zarzutu 2 rundy 1). Panel nie mnoży
  cudów ani nie zamraża wojny na `false`.
- `wealth.ts:134` — `wealthZadowolenie(poziom, p, epoka: number)`: trzeci argument jest
  **wymagany**, a `tsc --noEmit` przechodzi, więc każdy wołający w TS podaje epokę.

Bramka pilnuje tego **funkcjonalnie, nie tekstowo**: sekcja `2i (8)` w
`szczescie-przebudowa-skali-test.cjs:600-771` buduje `cityPanel.ts` esbuildem, ładuje go w
jsdom i URUCHAMIA przez szew `__cityPanelOrderStateLocalForTest`, po czym porównuje wynik
z niezależnie złożonym wejściem silnika (5 scenariuszy: epoki 1–3, cuda 0/6/12/36, wojna
tak/nie, pop 4–12), linia po linii, plus `szPct`, `porPct`, `bandLabel`, `netto`.
Brak szwu = jawny `FAIL`, nie ciche pominięcie (`:663`).

**Sprawdziłem to własną mutacją — patrz M4 niżej.** Ta sama podmiana, którą Evaluator rundy 1
zrobił i której stara bramka NIE złapała (`era` → literał `1` w `cityPanel.ts`), dziś daje
5 czerwonych asercji. Zarzut 1 rundy 1 jest realnie zamknięty.

Rezydualne, udokumentowane w kodzie ograniczenie (nie zarzut): w sandboxie/playteście, zanim
silnik policzy pierwszą turę, panel dostaje `haCuda = 0` i `atWar = false` — bo `main.ts`
trzyma inny temat (§2b) i nie ma dla nich haka w `CityPanelConfig`. W żywej rozgrywce
wartości pochodzą z werdyktu silnika, więc rozjazdu nie ma.

---

## PUNKT 6 — NIETAUTOLOGICZNOŚĆ: SZEŚĆ WŁASNYCH MUTACJI

Wszystkie wykonane w moim worktree `/tmp/eval-r2-head`, **nigdy** w
`/home/user/wt-szczescie-skala` (pracuje tam Operator rundy 3). Każda cofnięta z kopii
i zweryfikowana `git status --short` = pusto.

| # | obszar | mutacja | skutek |
|---|---|---|---|
| M1 | DANE | `szczescie_max_epoka` normal `30 → 31` | `szczescie-przebudowa-skali-test` **515/2** (exit 1), `szczescie-skala-normalizacja-test` **133/8** (exit 1) |
| M2 | DANE | `buildings.json` `spichlerz.baza.zadowolenie 4 → 3` (G2) | `szczescie-przebudowa-skali-test` **513/4**: „G2: Spichlerz łącznie +5 — got 4”, „2b: BUD(epoka 1) = 14 — got 13”, „2h: pop 8 epoka 1 = 58 — got 57” |
| M3 | MODUŁ CZYSTY | `culture-religion.ts`: `2 * religionOwnShare(...) - 1` → `religionOwnShare(...)` (kasuje normalizację) | `logic-test` **212/213**, czerwienieje dokładnie przepisana asercja `:1370` (`own90=0.9 foreign90=0.1 split=0.5`); `szczescie-przebudowa-skali-test` **512/6** |
| M4 | DRUGI TOR (panel) | `cityPanel.ts:3066` `wealthZadowolenie(…, era)` → `…, 1` | `szczescie-przebudowa-skali-test` **512/5**, w tym `2i(8): linia "wealth" identyczna — got 10, want 5`, `szPct panelu == szPct silnika — got 21, want 16.5`. **To jest mutacja, którą stara bramka przepuszczała (0 FAIL w rundzie 1).** |
| M5 | BRAMKA | usunięty eksport szwu `__cityPanelOrderStateLocalForTest` z entry pointu bramki | exit **1**, `[FAIL] 2i(8): harness panelu zbudowany` — bramka nie potrafi „zzielenieć przez pominięcie” |
| M6 | DANE | `buildings.json` `mury.dajeSzczescie false → true` | `szczescie-przebudowa-skali-test` **507/10** (asercje per budynek 2a), `building-happiness-test` **8/6** |

Dodatkowo mutacja pomiarowa **M7 (symulacja R3-A)**: `szczescie_max_pop_wspolczynnik`
= 0,04 na wszystkich trzech poziomach — wynik w ZARZUCIE 1.

Po każdej mutacji plik przywrócony z kopii, `git status --short` w `/tmp/eval-r2-head` puste.

---

## BRAMKI URUCHOMIONE PRZEZE MNIE (stan `54504810`, czysty worktree)

- `node ./node_modules/typescript/bin/tsc --noEmit` — **exit 0, zero błędów.**
- **Osiem bramek z ratyfikacji rundy 2 — komplet ZIELONY:** `logic-test` **213/213**,
  `society-breakdown-test` 53/0, `szczescie-zamoznosc-test` 88/0,
  `szczescie-skala-normalizacja-test` 141/0, `building-happiness-test` 14/0,
  `r-wzrost-…-ceramika-test` 54/0, `war-happiness-parity-test` 21/0, `wealth-test` 36/0.
- Nowa bramka `szczescie-przebudowa-skali-test` — **517/0** (Operator rundy 2 raportował
  446 w swoim commicie; różnicę dołożyła równoległa obrona rundy 1, commit `643c4abe`).
- **Pięć bramek referencyjnych:** logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6.
- **Rodzina szczęścia/porządku (pełny grep kryterium 5):** culture-religion 65/65,
  happiness-breakdown 38/38, porzadek-panel-czytelnosc 81/81, empire-religia-panel 15/15,
  ai-dlug-porzadki 17/17, city-orderstate-restore-clear 9/9, diplomacy-border-march 43/43,
  territory-border 9/9, territory-border-dense 15/15, border-march-scan 15/15 — zielone.
- `border-march-wygasanie-test` **22/4 — potwierdzam „nie regres”**: uruchomiłem tę bramkę
  na własnym worktree bazy `f570a91a` i dostałem **identycznie 22/4**, ten sam fail
  (`onEventDismiss('border-march-…') usuwa z borderMarchEventLog`).
- `citizen-resource-upkeep-test` **107/2** — patrz ZARZUT 2.

---

## ZARZUTY

### 1. Pomiar skutku ratyfikacji R3-A w raporcie rundy 2 jest NIEPEŁNY — czerwienieją CZTERY asercje, nie trzy, a czwarta leży we WŁASNEJ bramce Operatora

`04-operator-runda2.md`, BLOKADY punkt 2, twierdzi: „wszystkie bramki zielone poza trzema
asercjami, **wszystkie w jednym pliku** `gra/tools/szczescie-skala-normalizacja-test.cjs`”.
Orkiestrator przyjął tę liczbę wprost do ratyfikacji R3-A („padają dokładnie **trzy** asercje,
wszystkie w `szczescie-skala-normalizacja-test.cjs`”), więc runda 3 dostała niepełną listę.

Mój pomiar (M7 — `szczescie_max_pop_wspolczynnik` = 0,04 na easy/normal/hard, mutacja
cofnięta, drzewo czyste):

```
== szczescie-przebudowa-skali-test :: 516 OK, 1 FAIL
  [FAIL] 2g: szczescie_max_pop_wspolczynnik = 0,048 bez zmian -- got 0.04, want 0.048
== szczescie-skala-normalizacja-test :: 138 OK, 3 FAIL
  [FAIL] wspolczynnik Sz per trudnosc easy<normal<hard (0.04 < 0.04 < 0.04)
  [FAIL] tabela: szMax(pop 12, epoka 1) = 48,0  got 44.4 expected 48
  [FAIL] tabela: szMax(pop 12, epoka 3) = 112,0 got 103.6 expected 112
```

Czwarta asercja to `gra/tools/szczescie-przebudowa-skali-test.cjs:418-419`:

```js
eq(society.szczescie.szczescie_max_pop_wspolczynnik.normal, 0.048,
  '2g: szczescie_max_pop_wspolczynnik = 0,048 bez zmian');
```

Nie jest to plik dołożony przez kogoś innego po pomiarze — sprawdziłem
`git show 5ba58273:gra/tools/szczescie-przebudowa-skali-test.cjs`: ta asercja stała tam już
w **commicie rundy 2** (a nawet w rundzie 1, `2c08deed:378`). Operator zmierzył skutek
mutacji na siedmiu bramkach, ale **pominął własną nową bramkę**.

**Poprawka (jedna, konkretna):** R3-A ma objąć także
`gra/tools/szczescie-przebudowa-skali-test.cjs:418-419` — przepisać `0.048` na `0.04`
i dołożyć (analogicznie do `war-happiness-parity-test:157`) asercję
`easy === normal === hard`, żeby zrównanie było pilnowane, a nie tylko dopuszczone.
Pozostałe trzy asercje — jak w R3-A. Kryterium końca rundy 3 nr 6 („ani jednej czerwonej
bramki”) bez tej poprawki nie da się spełnić.

### 2. `citizen-resource-upkeep-test.cjs` jest CZERWONA na gałęzi (107/2), zielona na bazie (109/0) — kryterium końca „rodzina zielona” niespełnione w ocenianym stanie

Własny pomiar, oba stany:

```
f570a91a : citizen-resource-upkeep-test: 109 passed, 0 failed
54504810 : citizen-resource-upkeep-test: 107 passed, 2 failed
  FAIL: kanon: +1 Szczęście za dostępny surowiec (got 2, want 1)
  FAIL: kanon: -1 Szczęście za brakujący surowiec (got -2, want -1)
```

To są dwa literały uchylone przez G8. **Nie zarzucam tego Operatorowi rundy 2 jako defektu
wykonania** — plik był poza allowlistą, Operator go nie tknął i zgłosił wprost (BLOKADY 1),
a ratyfikacja R3-B już rozszerzyła allowlistę i opisała zakres. Odnotowuję, bo w ocenianym
stanie `54504810` kryterium końca pozostaje niespełnione i musi je domknąć runda 3.
Potwierdzam przy okazji, że liczba asercji w tym pliku **nie spadła** (107 + 2 = 109),
czyli warunek R3-B „109/0 albo więcej” jest osiągalny samą zmianą dwóch literałów.

### 3. `SZMAX_DEFAULTS` w kodzie (14/20/28) kłamie wobec danych (30/50/70) — jedyny parametr Szczęścia, w którym kod i dane mówią co innego

`gra/src/game/society-breakdown.ts:190-195`:

```ts
const SZMAX_BY_ERA_DEFAULT: readonly [number, number, number] = [14, 20, 28];
export const SZMAX_DEFAULTS: Readonly<Record<number, number>> = { 1: …, 2: …, 3: … };
```

wobec `society-params.json → szczescie_max_epoka.normal = [30, 50, 70]`. Sąsiednie fallbacki
G4/G7/G9/G10 runda 1 przestawiła (`KULT_RELIG_BY_ERA_DEFAULT` = `[10,16,23]`,
`PODATKI_MIN/MAX_DEFAULT` = ∓10, kara wojny `-5`, osiedle) — ten został stary.
Skutek jest ograniczony do ścieżek z `society = null`, ale to właśnie te ścieżki mierzą
bramki. **Znów: nie jest to defekt rundy 2** (runda 2 = wyłącznie bramki, a Operator zgłosił
to sam w OBSERWACJACH); ratyfikacja R3-C już to rozstrzygnęła. Odnotowuję, bo w ocenianym
stanie rozjazd istnieje.

### 4. Drobne: asercja w `szczescie-skala-normalizacja-test.cjs:449` niesie w komunikacie nieaktualną liczbę

```js
eq(sz.szPct, szPrzed.szPct, 'zrzut PO zmianie: SzPct bez zmian wobec PRZED (114,3%)');
```

Sama asercja jest poprawna i coś mierzy (neutralność startowa przy pop = populacji
odniesienia), ale opis mówi „114,3%”, podczas gdy obie strony wynoszą dziś **90,7%** — i ta
sama linia pliku (`:441`, `:446`) już to poprawnie odnotowuje. Komunikat asercji wprowadzi
w błąd następnego czytającego. **Poprawka:** `(114,3%)` → `(90,7%)`.

---

## OBSERWACJE (bez zarzutu)

- **Kolizja izolacji trwa nadal.** W trakcie mojej rundy gałąź przesunęła się
  `00afd4d9 → 54504810`, a drzewo `/home/user/wt-szczescie-skala` zabrudziło się trzema
  plikami Operatora rundy 3. R3-E zamyka to na przyszłość, ale w tej chwili w jednym
  worktree pracują równolegle Operator rundy 3 i Evaluator rundy 2. Rozwiązałem to po swojej
  stronie osobnymi worktree (`/tmp/eval-r2-base`, `/tmp/eval-r2-head`) i nie zapisałem w
  głównym drzewie nic poza tym raportem, commitowanym `git add` po jednej ścieżce.
- **Zdanie „Liczba asercji rośnie w każdym pliku” z raportu rundy 2 jest nieścisłe dla
  `logic-test`** (213 → 213). Ratyfikacja wymaga tylko, żeby nie spadła — warunek spełniony,
  a sama asercja urosła wewnętrznie z 3 do 6 warunków. Nit redakcyjny, nie osłabienie.
- **Liczby „PRZED” w raporcie rundy 2 są liczone od stanu po rundzie 1, nie od bazy dispatchu**
  (np. `society-breakdown-test` „42 → 53”; wobec `f570a91a` jest 43 → 53). Nie zmienia to
  werdyktu — wobec bazy każda bramka rośnie.
- **`szczescie-przebudowa-skali-test` przy braku szwu panelu kończy się wyjątkiem** po
  wypisaniu `[FAIL] 2i(8): harness panelu zbudowany`, więc nie drukuje linii podsumowania.
  Exit code = 1, więc cichej zieleni nie ma; warto jednak owinąć wywołania `P.…` tak, żeby
  bramka zawsze domykała raport.
- **Domyślne udziały są asymetryczne i tak udokumentowane:** brak `ownCultureShare` → udział
  1,0 (linia Kultury `+x`), brak `haRel`/`ownReligionShare` → `ownShareFromSignal(0)` = 0,5
  (linia Religii 0). Sprawdziłem `main.ts:29195` — `ownCultureShare: cultureMixActive ? … :
  undefined` jest bezpieczne, bo `resolveOwnCultureShare` i tak domyśla 1, a miasto zdobyte
  zawsze ma pole `ownCultureShare` (`cityCultureMixActive` = obecność pola). Bez defektu.
- **`pickOsiedlePopBonus` (`society-breakdown.ts`) twardo zwraca 0 dla `pop > 4`**, więc
  legacy `szczescie_male_miasto_bonus` nie może przywrócić bonusu przy pop ≥ 5 (G10). Sprawdzone
  w kodzie, nie z raportu.
- **Start easy = PorPct 94,8% przy pop 1** (pasmo „Ład”) potwierdzony własnym uruchomieniem
  `society-breakdown-test`. To wynik liczb właściciela (G10: osiedle 4 → 15), nie strojenie —
  do decyzji właściciela, jak zapisano w R3 („Czego runda 3 NIE robi”).

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
GOAL: przepisać osiem bramek na kontrakt G1–G15 bez osłabienia; liczby właściciela nietknięte;
parytet panel↔silnik rozwiązany u źródła.
ZMIANY/COMMIT: Evaluator nie zmienia kodu. Oceniony stan `54504810` (drzewo gra/ = `643c4abe`),
25 plików wobec bazy `f570a91a`, wszystkie z allowlisty, `gra/src/main.ts` nieobecny.
Zapisany artefakt: `dyspozycje/autobot/runs/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1/05-evaluator-runda2.md`.
TESTY: `tsc --noEmit` 0 błędów · osiem bramek ratyfikacji ZIELONE (logic 213/213,
society-breakdown 53/0, szczescie-zamoznosc 88/0, szczescie-skala-normalizacja 141/0,
building-happiness 14/0, r-wzrost 54/0, war-happiness-parity 21/0, wealth 36/0) ·
nowa bramka 517/0 · pięć referencyjnych 213/19/33/13/6 · rodzina szczęścia/porządku zielona ·
`border-march-wygasanie` 22/4 = identycznie na bazie (nie regres) ·
`citizen-resource-upkeep` 107/2 (ZARZUT 2) · 7 własnych mutacji, każda cofnięta.
BLOKADY: cztery ponumerowane zarzuty niżej; zarzuty 2 i 3 mają już rozstrzygnięcie
orkiestratora (R3-B, R3-C) i nie są defektem wykonania rundy 2.
ZARZUTY:
  1. Pomiar skutku R3-A niepełny — czerwienieją 4 asercje, nie 3; czwarta to
     `gra/tools/szczescie-przebudowa-skali-test.cjs:418-419` (`0.048`), obecna już w commicie
     rundy 2 `5ba58273`. R3-A trzeba rozszerzyć o ten plik.
  2. `gra/tools/citizen-resource-upkeep-test.cjs` czerwona na gałęzi (107/2) wobec 109/0 na
     bazie — kryterium „rodzina zielona” niespełnione w ocenianym stanie (rozstrzygnięte R3-B).
  3. `SZMAX_DEFAULTS` = 14/20/28 wobec danych 30/50/70 — kod i dane mówią co innego
     (rozstrzygnięte R3-C).
  4. `gra/tools/szczescie-skala-normalizacja-test.cjs:449` — komunikat asercji podaje
     nieaktualne „114,3%” zamiast 90,7%.
RUNDY: 2/5
NASTĘPNY KROK: Obrona Operatora (lista zarzutów niepusta, §3c), potem Final Control —
to samo ID, ta sama gałąź. Zarzut 1 jest jedynym, który wymaga zmiany w wytworze przed
rundą 3; zarzuty 2 i 3 domyka runda 3 wg R3-B / R3-C.
DEPLOY/PUSH: NIE WYKONANO
