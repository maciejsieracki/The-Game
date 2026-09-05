# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — dispatch

TEMAT: `R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ

Wielogodzinna sesja analityczna z właścicielem, zakończona kompletem wiążących decyzji.
Punkt wyjścia — zgłoszenie właściciela: **„im dalej w las, tym szczęście wyższe"**.

**WSZYSTKIE LICZBY W TYM DISPATCHU POCHODZĄ OD WŁAŚCICIELA.**
Właściciel przypomniał wprost: **balans jest wyłącznie w jego władaniu**.
**MASZ BEZWZGLĘDNY ZAKAZ ICH STROJENIA, ZAOKRĄGLANIA I „POPRAWIANIA".**
Jeśli uznasz którąkolwiek za błędną — zatrzymujesz się ze statusem `DECISION_REQUIRED`
i podajesz pomiar. Nie zmieniasz jej sam.

Pełna metodologia i uzasadnienia: **`dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md`**
(przeczytaj w całości PRZED pracą) oraz wpis `R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`
w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.

## GOAL — piętnaście zmian

### G1. Ryczałt +1 tylko dla budynków szczęściodajnych

`BUILDING_HAPPINESS_BASE_PER_BUILDING` przestaje obowiązywać wszystkie budynki.
Dokładnie **19** budynków daje szczęście, pozostałe **22** dają ZERO:

TAK: `studnia`, `kamienne_kregi`, `palac`, `spichlerz`, `targowisko`, `stela`,
`swiatynia`, `akwedukt`, `palac_ii`, `spichlerz_ii`, `trybunal`, `biblioteka`, `port`,
`teatr`, `laznia_publiczna`, `palac_iii`, `akademia`, `sad`, `port_wielki`.

NIE (zero szczęścia): `dom_starszyzny`, `palisada`, `garncarnia`, `kamieniarski`,
`stolarnia`, `dwor_zarzadcy`, `mury`, `mennica`, `cegielnia`, `odlewnia_brazu`, `magazyn`,
`kuznia`, `koszary`, `pretorium`, `baszta`, `fort`, `odlewnia_zelaza`, `kuznia_zelaza`,
`akademia_wojskowa`, `warsztat_oblezniczy`, `wielka_kuznia`, `wielka_odlewnia`.

Kryterium właściciela: **czy mieszkaniec z budynku korzysta, czy tylko państwo albo wojsko.**
Lista ma być **danymi, nie stałą w kodzie** — tak, żeby dodanie budynku w przyszłej epoce
nie wymagało zmiany TypeScriptu. Sposób zapisu wybierz sam i uzasadnij w raporcie.

### G2. Spichlerz +5

`spichlerz` i `spichlerz_ii` dają **łącznie +5** szczęścia (razem z ryczałtem).
Świątynia, Teatr i Akademia **zachowują dzisiejsze wartości** (3 / 4 / 4 łącznie).

### G3. Cztery wiersze dublujące — USUNĄĆ

Liczyły to samo drugi raz i wprowadzały gracza w błąd:
- `szczescie_swiatynia` (+1) — Świątynia jest już liczona jako budynek
- `szczescie_amfiteatr` (+1) — Teatr i Akademia są już liczone jako budynki
- `Ceramika (dostęp)` (+1) — ceramika liczy się jako zwykły surowiec zaopatrzenia
- `Spichlerz (działający)` (+1) — Spichlerz jest liczony jako budynek

### G4. Kultura i religia proporcjonalnie

```
szczęście = 2·x × udział_własnej − x
```
100% własnej = `+x`, 100% obcej = `−x`, dokładnie zero przy 50/50.
Zastępuje schodki `cultureHappiness` i **binarny przeskok** `religionHappiness`
(dziś +4 przy 51% i −4 przy 49%).

`x` per epoka: **10 / 16 / 23**. Kultura i religia mają tę samą wartość `x`.

### G5. Dwie kary — USUNĄĆ

Skala proporcjonalna `±x` już je zawiera:
- `szczescie_kara_obca_religia` (−4) — linia Religii daje już `−x`
- `conquestUnstableHappinessPenalty` (podbój: obca kultura i religia, −2) — obie linie dają `−x`

**UWAGA:** `conquestNoGarrisonLawPenalty` (kara PRAWA) **ZOSTAJE** — to inny mechanizm,
nie dotykaj go.

### G6. Wealth — nowa formuła, max +10 w każdej epoce

```
zadowolenie = floor( poziom_W × 10 / cap_epoki ),   cap_epoki = epoka × 10
```
Dziś: `floor(poziom / 10) × 1`, co daje max **+1 / +2 / +3** — poziom 100 (epoka 10)
jest potrzebny na +10. Po zmianie: **+10 w każdej epoce**, ale poziom potrzebny rośnie
10 → 20 → 30.

**To zmiana sygnatury** — `wealthZadowolenie` (`wealth.ts:112`) musi dostać epokę.
Wołający: `gra/src/ui/cityPanel.ts:3029, 4595, 4631` oraz `growth-happiness.ts`.

### G7. Podatki liniowo ±10

Zamożność 0% → **−10**, 90% → **+10**, liniowo pomiędzy, 90–100% → +10.
Zastępuje siatkę `szczescie_siatka_zamoznosc` `[-1,0,1,2,3,4,5,6,7,8]`.

### G8. Zaopatrzenie symetryczne

**+2** za każdy dostarczony surowiec epoki, **−2** za brakujący (było +1 / −1).

### G9. Wojna −5 (było −2)

### G10. Bonus osiedla przeskalowany

`szczescie_bonus_osiedle_pop` = **`[15, 12, 8, 5]`** (było `[4, 3, 2, 1]`), pop ≥ 5 = 0.
Powód: stary bonus znosił się z karą za wielkość i przy pop 4 dawał netto ujemne.

### G11. Cuda świata po +6

Sześć cudów dających szczęście ujednolicone na **+6 każdy**:
`koloseum` (było 6), `roquepertuse`, `stupa_sanchi`, `mundo_perdido`, `palac_weiyang`,
`posag_peruna` (wszystkie były 3). Bonus działa na KAŻDE miasto właściciela — dlatego
wartość musi być umiarkowana. **+10 było rozważane i ODRZUCONE.**

### G12. Zagęszczenie — USUNĄĆ

`szczescie_kara_wielkosc_miasta` (−0,75 powyżej pop 5) **znika w całości**.
Wielkość miasta działa odtąd **wyłącznie przez mianownik** (G13).
**NIE dodawaj kary „−1 za obywatela"** — była rozważana i świadomie odrzucona,
bo trzymanie jej razem ze współczynnikiem byłoby podwójnym liczeniem tej samej rzeczy.

### G13. Mianownik

`szczescie_max_epoka` per poziom trudności:

| | Epoka 1 | Epoka 2 | Epoka 3 |
|---|---|---|---|
| easy | **20** | **40** | **60** |
| normal | **30** | **50** | **70** |
| hard | **35** | **55** | **80** |

`szczescie_max_pop_wspolczynnik` = **0,048** — **BEZ ZMIAN, ZOSTAJE.**
`szczescie_pct_cap` = **120** — **BEZ ZMIAN.**

**Trudność wyrażana jest WYŁĄCZNIE przez `szczescie_max_epoka`.** Wszystkie pozostałe
parametry z tego dispatchu mają **te same wartości** w kolumnach easy / normal / hard.
To świadome uproszczenie — dziś prawie każdy parametr ma osobną trójkę i strojenie jest
nieprzewidywalne.

### G14. Siedem martwych parametrów — USUNĄĆ NA STAŁE

Żaden nie ma **ani jednego odczytu** w `gra/src` (trafienia w `gra/tools/.*-bundle.cjs`
to wklejony w całości JSON, nie użycie). To pozostałość po porzuconym modelu
„liczby zadowolonych mieszkańców", zastąpionym modelem procentowym `szPct → PorPct`:

`szczescie_kara_obca_kultura`, `szczescie_bonus_produkcja_wartosc`,
`szczescie_bonus_wzrost_wartosc`, `szczescie_prog_bonus_produkcja`,
`szczescie_prog_bonus_wzrost`, `szczescie_prog_bunt`, `szczescie_prog_strajk_produkcja`.

Usuń też funkcję `happinessBucketsFromPct` (`society-breakdown.ts:952`) — zero wywołań
poza własnym plikiem. **UWAGA:** ma pokrycie w `gra/tools/society-breakdown-test.cjs` —
te asercje też usuń, jawnie wymieniając je w raporcie.

### G15. Panel miasta ma pokazywać nowy rozkład

`cityPanel.ts` liczy szczęście drugim, równoległym torem (`:2961`, `:3022`, `:3029`).
**Musi dawać identyczny wynik co silnik.** Rozjazd tych dwóch torów to znany, powtarzalny
defekt w tym repo.

## KRYTERIA KOŃCA (binarne)

1. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
2. Nowa bramka `gra/tools/szczescie-przebudowa-skali-test.cjs`, minimum:
   - a) każdy z 19 budynków TAK daje szczęście, każdy z 22 NIE daje **dokładnie 0** —
     asercja per budynek, nie zbiorcza;
   - b) suma z budynków = **14 / 25 / 42** dla epok 1–3 (po zwinięciu łańcuchów ulepszeń);
   - c) kultura i religia: 100% → `+x`, 0% → `−x`, 50% → **dokładnie 0**, 75% → `+x/2`;
   - d) Wealth: poziom = cap epoki → **+10** w epokach 1, 2 i 3 osobno;
   - e) podatki: 0% → −10, 90% → +10, 45% → 0;
   - f) zaopatrzenie: `+2` i `−2` na surowiec;
   - g) żaden z 7 usuniętych kluczy nie występuje w `society-params.json` — skan negatywny;
   - h) scenariusz optymistyczny pop 8 = **58 / 85 / 118** pkt, a `szPct` = **120%**
     na poziomie normalnym (obcięty sufitem);
   - i) `cityPanel.ts` i silnik dają **ten sam** wynik dla tego samego miasta (G15).
3. `node gra/tools/society-breakdown-test.cjs` — zielone po aktualizacji asercji.
4. Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.
5. Bramki rodziny szczęścia i porządku — **ZNAJDŹ SAM**
   (`ls gra/tools/ | grep -Ei "szczesc|happy|happiness|porzad|order|society|wealth|kultur|relig"`),
   uruchom WSZYSTKIE, podaj wyniki. Czerwona → sprawdź parytet na czystej bazie PRZED
   zgłoszeniem jako regres.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — strojenie liczb właściciela.** Każda liczba w GOAL jest decyzją właściciela
podjętą na policzonym materiale. Zmiana choćby jednej „bo tak wychodzi lepiej" jest
naruszeniem granicy §9 i oznacza FAIL niezależnie od jakości reszty pracy.

**Tryb drugi — łańcuchy ulepszeń.** Ulepszenie **usuwa** poprzednika z `builtIds`
(`building-resource-gate.ts:357`). Miasto z kompletem ma **11 / 23 / 31** budynków, nie
11 / 26 / 39. Orkiestrator sam się na tym pomylił i musiał korygować całą analizę.
Kryterium 2b sprawdza dokładnie to.

**Tryb trzeci — jeden tor zamiast dwóch.** `cityPanel.ts` liczy szczęście niezależnie od
silnika. Naprawienie tylko jednego toru daje panel kłamiący wobec mechaniki. Kryterium 2i.

**Tryb czwarty — test tautologiczny.** Pokaż, że bramka CZERWIENIEJE po mutacji: zmień
`szczescie_max_epoka[normal][1]` z 30 na 31, uruchom, wklej liczbę faili, cofnij.

## ALLOWLISTA

- `gra/data/society-params.json`
- `gra/data/buildings.json`
- `gra/data/wonders.json`
- `gra/data/econ-params.json` (**tylko** jeśli konieczne dla G6; uzasadnij)
- `gra/src/game/society-breakdown.ts`
- `gra/src/game/culture-religion.ts`
- `gra/src/game/wealth.ts`
- `gra/src/game/economy.ts`
- `gra/src/game/conquest-stability.ts` (**tylko** usunięcie kary szczęścia z G5;
  `conquestNoGarrisonLawPenalty` NIETKNIĘTE)
- `gra/src/ui/cityPanel.ts`
- `gra/src/game/growth-happiness.ts` (**tylko** przepięcie sygnatury Wealth)
- `gra/tools/szczescie-przebudowa-skali-test.cjs` (NOWY)
- `gra/tools/society-breakdown-test.cjs` (**tylko** usunięcie asercji na
  `happinessBucketsFromPct`, jawnie wymienione w raporcie)
- `dyspozycje/autobot/runs/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1/**`

Zakazane bezwzględnie: **`gra/src/main.ts`** (trzyma go
`R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`, §2b — a zmiany z tego tematu go NIE wymagają),
`gra/src/game/order.ts`, `gra/src/game/post-capture-law.ts`, `gra/data/*prawo*`,
pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .`.

## GRANICE

- **Nie dotykasz Prawa** — `prawo_*`, `computeLawBreakdown`, garnizon, `prawMax`.
  To osobny, jeszcze nieotwarty temat.
- **Nie ruszasz `szczescie_pct_cap` ani `szczescie_max_pop_wspolczynnik`.**
- **Nie zmieniasz progów Porządku** (`porPctBand`, `tierFromPorPct`, `orderEffectsFromPorPct`).
- Nie integrujesz, nie deployujesz, nie pushujesz do origin.

## IZOLACJA

Worktree `/home/user/wt-szczescie-skala`, gałąź `autobot/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`,
baza jawnie `origin/main` na SHA podanym przy zakładaniu — potwierdź `git log -1` PRZED pracą.

C-001 (bariera CHRONIONA): „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje JSON)
— dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`".
Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc --noEmit`.
`--outDir` poza drzewem repo, z **unikalnym sufiksem** (PID albo losowy) — stała nazwa
w `os.tmpdir()` powoduje kolizje i fałszywe wyniki w obie strony.

**SZCZEGÓLNA OSTROŻNOŚĆ:** `export-data` nadpisuje pliki JSON danych gry. Ten temat zmienia
trzy pliki danych. Po każdej serii zmian sprawdź `git diff --stat gra/data/` i upewnij się,
że zmieniły się **wyłącznie** zamierzone klucze.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę. Runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.
