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

---

## RATYFIKACJA ORKIESTRATORA — runda 2 (2026-09-05)

**Powód: sprzeczność w TYM dispatchu, nie defekt wytworu.** Zażądałem zastąpienia mechanik,
których bramki pilnują, a bramek nie umieściłem w allowliście. Operator ich nie tknął
i zatrzymał się z `DECISION_REQUIRED` — zachowanie prawidłowe (§14, C-054).

**ROZSTRZYGNIĘCIE: allowlista rozszerzona o:**

- `gra/tools/logic-test.cjs` (**wyłącznie** asercja `:1370` na binarny kontrakt
  `religionHappiness`; reszta pliku NIETKNIĘTA — to bramka referencyjna 213/213)
- `gra/tools/society-breakdown-test.cjs` (pełny zakres, nie tylko `happinessBucketsFromPct`)
- `gra/tools/szczescie-zamoznosc-test.cjs`
- `gra/tools/szczescie-skala-normalizacja-test.cjs`
- `gra/tools/building-happiness-test.cjs`
- `gra/tools/r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs`
- `gra/tools/war-happiness-parity-test.cjs`
- `gra/tools/wealth-test.cjs`
- `gra/data/citizen-resource-upkeep.json` (**wyłącznie** `_kara.szczescieZaDostepny` → `2`
  i `_kara.szczescieZaBrakujacy` → `-2`; reszta pliku NIETKNIĘTA)

**BRAMEK NIE WOLNO WYCOFAĆ ANI OSŁABIĆ.** Zakres pracy dla każdej:

1. **Przepisz asercje na nowy kontrakt, zachowując każdą sprawdzaną WŁASNOŚĆ.** Asercja
   pilnująca, że religia wpływa na szczęście, ma dalej tego pilnować — tylko wobec skali
   proporcjonalnej, a nie binarnego przeskoku.
2. **Dla KAŻDEJ przepisanej asercji podaj w raporcie jedno zdanie:** co sprawdzała przed
   i przez co jest sprawdzana po. Jeśli któraś nie ma odpowiednika w nowej mechanice,
   powiedz to wprost zamiast ją po cichu usunąć.
3. **Liczba asercji w każdym pliku nie może spaść** poza przypadkami z punktu 2, jawnie
   wymienionymi. Spadek bez uzasadnienia = osłabienie = FAIL.
4. Po przepisaniu **wszystkie osiem plus nowa bramka mają być ZIELONE**, a `logic-test`
   z powrotem **213/213**.

**G8 — preferowane rozwiązanie docelowe.** Przenieś `±2` wprost do
`citizen-resource-upkeep.json` (`_kara`), a mnożnik obejściowy
`szczescie_zaopatrzenie_na_surowiec` usuń, jeśli staje się zbędny. Jeśli uznasz, że mnożnik
jest lepszy — uzasadnij i zostaw, ale nie trzymaj obu naraz.

**Rozstrzygnięcia do trzech decyzji projektowych Operatora — WSZYSTKIE PRZYJĘTE:**

- **G1 jako pole `dajeSzczescie` per budynek** — trafne. Nowy budynek klasyfikuje się razem
  ze swoim rekordem, bez centralnej listy do zapomnienia. Brak pola = `false` jest dobrym
  domyślnym.
- **G4 przez znormalizowany wskaźnik [−1,+1]** — trafne i lepsze niż to, co miałem
  w głowie. Punkty powstają w JEDNYM miejscu, więc silnik i panel nie mogą się rozjechać.
  To rozwiązuje tryb trzeci reguły anty-halucynacyjnej u źródła.
- **`szczescie_max_pop_wspolczynnik` zostawiony 0,038/0,048/0,058 per trudność** — trafne.
  Dispatch mówił „BEZ ZMIAN, ZOSTAJE"; zrównanie do 0,048 byłoby strojeniem liczby
  właściciela. Dobrze, że nie tknąłeś.

**Zarzutów nie ma — Evaluator jeszcze nie orzekał.** Runda 2 to dokończenie tej samej pracy
po rozszerzeniu allowlisty, nie naprawa defektu.

---

## RATYFIKACJA ORKIESTRATORA — runda 3 (2026-09-05): jedna zmiana liczby

**Decyzja właściciela, podjęta po rundzie 2:**

`szczescie_max_pop_wspolczynnik` = **0,04** — jedna wartość na WSZYSTKICH trzech poziomach
trudności (było 0,038 / 0,048 / 0,058).

**Powód:** ten sam współczynnik przyjęto dla Prawa (`prawo_max_pop_wspolczynnik` = 0,04),
żeby wielkość miasta obciążała oba filary Porządku identycznie. Gracz uczy się jednej
zasady zamiast dwóch, a `PorPct = 0,5 × szPct + 0,5 × prawPct` zachowuje się przewidywalnie.

Zgodne też z zasadą G13: **trudność wyrażana jest WYŁĄCZNIE przez `szczescie_max_epoka`**,
a wszystkie pozostałe parametry mają te same wartości na easy / normal / hard. Współczynnik
per trudność był ostatnim wyłomem od tej zasady.

**To UCHYLA wcześniejszy zapis „`szczescie_max_pop_wspolczynnik` = 0,048 — BEZ ZMIAN,
ZOSTAJE" z G13.** Twoja decyzja z rundy 1, żeby go nie ruszać, była wtedy prawidłowa —
dispatch tak mówił. Teraz właściciel zmienił zdanie.

**Zakres rundy 3:** wyłącznie ta jedna wartość plus aktualizacja asercji w bramkach, które
ją sprawdzają. Nic więcej nie ruszaj.

**Zmierzony skutek** (scenariusz realistyczny, poziom normalny, szMax 30/50/70):

| pop | ep. 1 | ep. 2 | ep. 3 |
|---|---|---|---|
| 8 | 111% → **116%** | 107% → **112%** | 112% → **117%** |
| 12 | 92% → **99%** | 89% → **96%** | 93% → **100%** |
| 20 | 63% → **72%** | 61% → **70%** | 64% → **73%** |

Łagodniej o 5–9 punktów procentowych, im większe miasto tym więcej.

---

## RATYFIKACJA ORKIESTRATORA — runda 3, uzupełnienie (2026-09-05, po obronie rundy 1
## i raporcie Operatora rundy 2)

Trzy blokady zgłoszone przez Operatorów i Evaluatora są rozstrzygnięte niżej. Runda 3 wykonuje
**cztery** rzeczy i nic więcej.

### R3-A. `szczescie_max_pop_wspolczynnik` = 0,04 — jak w ratyfikacji rundy 3 wyżej

Bez zmian wobec zapisu z 21:25. Operator rundy 2 zmierzył skutek: padają dokładnie **trzy**
asercje, wszystkie w `gra/tools/szczescie-skala-normalizacja-test.cjs`:

1. `wspolczynnik Sz per trudnosc easy<normal<hard` (sekcja 5) → **przepisz** na
   `easy === normal === hard` (kontrakt G13), analogicznie do parytetu dołożonego w
   `szczescie-zamoznosc-test`. **Nie usuwaj** — asercja ma nadal pilnować, że nikt nie wróci
   do trójki per trudność, tylko z odwróconym znakiem oczekiwania.
   Bliźniaczą asercję **dla Prawa** (`prawo_max_pop_wspolczynnik`) **zostaw nietkniętą** —
   Prawo nie jest w tym temacie i jego współczynnik nie zmienia się w tej rundzie.
2. `tabela: szMax(pop 12, epoka 1) = 48,0` → nowa wartość policzona samodzielnie (Operator
   rundy 2 przewiduje 44,4 — **przelicz, nie przepisuj z zaufania**).
3. `tabela: szMax(pop 12, epoka 3) = 112,0` → j.w. (przewidywane 103,6).

Kotwica mnożnika `prog(12)/prog(2)` identyczny w epokach 1 i 3 — **zostaje bez zmian**, ma dalej
zielenieć.

### R3-B. ALLOWLISTA ROZSZERZONA o `gra/tools/citizen-resource-upkeep-test.cjs`

**Zakres ściśle ograniczony:** wyłącznie dwie asercje literałowe (`:208`, `:209`), które niosą
uchylone przez G8 liczby `+1` / `−1`. Przepisz je na `+2` / `−2` wraz z komentarzem wskazującym
G8 i tę ratyfikację.

**Zakaz osłabiania:** nie wolno tych asercji usunąć, zakomentować ani zamienić na porównanie
ze stałą symboliczną (to zamieniłoby je w tautologię — reszta pliku już używa
`M.CITIZEN_UPKEEP_HAPPINESS_PER_*` i przechodzi). Literał ma zostać literałem: bramka pilnuje,
czy liczba w danych zgadza się z decyzją właściciela, więc musi ją znać z drugiego nośnika.
Liczba asercji w tym pliku **nie może spaść** — po rundzie 3 ma być 109/0 albo więcej.

Decyzja Operatora rundy 2, żeby przenieść ±2 wprost do `citizen-resource-upkeep.json` i usunąć
mnożnik obejściowy `szczescie_zaopatrzenie_na_surowiec` — **ZATWIERDZONA**. Jeden nośnik liczby,
nie dwa. To była właściwa lektura ratyfikacji rundy 2.

### R3-C. `SZMAX_DEFAULTS` (14/20/28) — fallback dosunięty do danych

Operator rundy 2 zgłosił jako obserwację: to jedyny parametr Szczęścia, w którym kod i dane
mówią co innego — pozostałe fallbacki G4/G7/G9/G10 runda 1 przestawiła, ten został stary.

**Rozstrzygnięcie: przestaw `SZMAX_DEFAULTS` na wartości poziomu NORMALNEGO z G13, czyli
30 / 50 / 70.** Uzasadnienie: fallback jest jednowartościowy (nie zna trudności), a normal jest
w tym repo poziomem odniesienia; ta sama konwencja obowiązuje resztę fallbacków przestawionych
w rundzie 1. **To nie jest zmiana balansu** — dane ładują się statycznie i to one rządzą żywą
grą; fallback dotyka wyłącznie ścieżek z `society = null` (m.in. w bramkach), gdzie dziś kłamie.

Asercje bramek testujących fallback `14` (m.in. sekcja 2 `szczescie-skala-normalizacja-test`)
przepisz na `30/50/70` — **z zachowaniem właściwości**, którą sprawdzały (że fallback istnieje
i jest brany, gdy `society = null`), a dołóż asercję, że fallback **równa się** wartości
`normal` z `society-params.json`. Wtedy każdy przyszły rozjazd kodu z danymi zaczerwieni bramkę,
zamiast siedzieć cicho.

### R3-D. `growth-happiness.ts` — koniec podwójnego liczenia Ceramiki i Spichlerza

Operator rundy 2 zgłosił: `computeGrowthHappinessNetto` nadal dolicza Ceramikę +1 i Spichlerz +1,
choć rozpiska Szczęścia już ich nie liczy (G3). Podgląd wzrostu i silnik rozeszły się o 2 punkty,
a bramka `r-wzrost-szczescie-dubel-wealth-ceramika-test` utrwala rozjazd trzema ZIELONYMI
asercjami (`10+1+1 = 12`).

**Rozstrzygnięcie: usuń oba doliczenia z `computeGrowthHappinessNetto`.** To nie jest nowa
decyzja balansowa i nie wolno jej tak potraktować — G3 właściciela już zapadła („Ceramika liczy
się jak każdy zaopatrzony surowiec, Spichlerz jako budynek +5; osobnych linii nie ma"). Tu
domykamy ją na drugim torze, który ją przeoczył. Bramka `r-wzrost-…-ceramika-test`: asercje
`10+1+1 = 12` przepisz na `10` **wraz z asercją negatywną**, że dodanie
`ceramikaZadowolenie`/`spichlerzZadowolenie` do wejścia nie zmienia wyniku — dokładnie tak, jak
zrobiono to już po stronie rozpiski.

**ALLOWLISTA ROZSZERZONA** o `gra/src/game/growth-happiness.ts` — wyłącznie w tym zakresie
(usunięcie dwóch doliczeń). Reszta pliku nietknięta.

### R3-E. IZOLACJA — jeden pisarz na worktree, bezwzględnie

W rundzie 2 doszło do kolizji: dwa procesy pisały równolegle do `/home/user/wt-szczescie-skala`
i do gałęzi `autobot/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1` (obrona rundy 1 i Operator rundy 2).
Do utraty pracy nie doszło wyłącznie dlatego, że obaj Operatorzy commitowali per plik i robili
mutacje przez kopię pliku zamiast `git checkout -- gra/`. **To była moja pomyłka jako
orkiestratora, nie ich** — obaj zachowali się wzorowo i obaj to zgłosili.

**Runda 3 jest jedynym procesem w tym worktree.** Zanim zaczniesz: `git log -1` i `git status`
mają pokazywać `00afd4d9` i czyste drzewo. Jeśli pokazują cokolwiek innego — **zatrzymaj się
ze statusem `BLOCK`** zamiast pisać do drzewa, w którym może pracować ktoś inny.

### Czego runda 3 NIE robi

- Nie rusza `prawo_max_pop_wspolczynnik` ani niczego po stronie Prawa — osobny temat.
- Nie rusza `main.ts`.
- Nie zmienia żadnej innej liczby balansu. `szczescie_max_epoka` (20/40/60 · 30/50/70 · 35/55/80),
  `szczescie_pct_cap` 120, bonus osiedla [15,12,8,5], cuda po 6, wojna −5, podatki ±10, Wealth
  cap +10 — **wszystkie zostają dokładnie takie, jakie są**.
- Nie zamyka obserwacji „start easy = PorPct 94,8% przy pop 1" — to jest do wiadomości
  właściciela i osobnej decyzji, nie do samodzielnego strojenia.

### KRYTERIA KOŃCA rundy 3 (binarne)

1. `szczescie_max_pop_wspolczynnik` = 0,04 na easy, normal i hard.
2. `SZMAX_DEFAULTS` = 30/50/70 i istnieje asercja wiążąca go z `normal` w danych.
3. `computeGrowthHappinessNetto` nie dolicza Ceramiki ani Spichlerza; istnieje asercja negatywna.
4. `citizen-resource-upkeep-test.cjs` — **109/0 lub więcej**, literały `+2`/`−2`.
5. `tsc --noEmit` zielony; pięć bramek referencyjnych zielonych.
6. Cała rodzina szczęścia/porządku zielona, **bez wyjątku** — po tej rundzie nie ma już
   ani jednej czerwonej bramki do usprawiedliwiania. `border-march-wygasanie-test` 22/4 jest
   jedynym dopuszczalnym wyjątkiem (potwierdzony pomiarem jako identyczny na czystym `main`).
7. Nietautologiczność: dla każdej z czterech zmian (A–D) pokaż mutację, która czerwieni
   dokładnie tę asercję, i cofnij ją, dowodząc `git diff --quiet`.
