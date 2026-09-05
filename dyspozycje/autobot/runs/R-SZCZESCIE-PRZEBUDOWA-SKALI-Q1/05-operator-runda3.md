# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Operator, runda 3

STATUS: PASS
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
ROLA: Operator · MODEL+EFFORT: **Opus 5, effort high**
GOAL: wykonać R3-A/B/C/D z ratyfikacji rundy 3 (uzupełnienie) i nic poza tym.
IZOLACJA: `/home/user/wt-szczescie-skala`, gałąź `autobot/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`.
Przed pracą: `git log -1` = `54504810` „Ratyfikacja runda 3 (uzupelnienie)", `git status --short`
pusty. **Jedyny pisarz w tym worktree** (R3-E). `gra/src/main.ts` bajt w bajt jak `origin/main`.

## ZMIANY/COMMIT

`3d24a86c` — **7 plików, wszystkie z wąskiej allowlisty rundy 3**, `git add` po jawnych
ścieżkach (zero `git add -A`/`.`), `git diff --check` czysty:
`gra/data/society-params.json` (tylko `szczescie_max_pop_wspolczynnik` — 4 linie w `git diff --stat gra/data/`),
`gra/src/game/society-breakdown.ts` (tylko `SZMAX_BY_ERA_DEFAULT`),
`gra/src/game/growth-happiness.ts`, `gra/tools/{szczescie-skala-normalizacja, citizen-resource-upkeep,
r-wzrost-szczescie-dubel-wealth-ceramika, szczescie-przebudowa-skali}-test.cjs`.

- **R3-A** `szczescie_max_pop_wspolczynnik` = **0,04** na easy/normal/hard (opis klucza przepisany
  na decyzję właściciela; mnożnik na pop 12 = 1,48× na każdej trudności).
- **R3-C** `SZMAX_BY_ERA_DEFAULT` 14/20/28 → **30/50/70**.
- **R3-D** `computeGrowthHappinessNetto` zwraca sam Wealth. **Sygnatura NIETKNIĘTA** (oba parametry
  zostają, wiodące `_`), bo wołający `turn-economy.ts` jest poza allowlistą. `main.ts` nietknięty.
- `SZ_MAX_POP_WSP_DEFAULT = 0.048` (`society-breakdown.ts:233`) **NIE ruszony** — allowlista dopuszcza
  w tym pliku wyłącznie `SZMAX_DEFAULTS`. Bramki zielone; zgłaszam jako obserwację, nie zmieniam sam.

## PRZEPISANE ASERCJE — co sprawdzały przed, co po, dlaczego nie osłabły

Liczba asercji: normalizacja **141 → 146**, przebudowa-skali **517 → 519**, r-wzrost **54 → 59**,
upkeep **109 → 109** (było 107/2, jest 109/0). Nigdzie nie spadła.

| # | plik / asercja | przed | po | dlaczego nie osłabła |
|---|---|---|---|---|
| 1 | normalizacja §1a `szMaxByEra z JSON, nie z fallbacku` (×3 trudności) | `szMaxByEra ≠ SZMAX_DEFAULTS` | wartownik: podmieniam `[997,998,999]` w KOPII danych i żądam tej wartości z loadera | R3-C zrównał fallback z kolumną `normal`, więc porównanie „liczby się różnią" przestałoby cokolwiek mierzyć na `normal`. Wartownik mierzy tę samą właściwość („loader czyta plik, nie stałą") **na każdej trudności** — jest mocniejszy, nie słabszy |
| 2 | normalizacja §2 fallback (5 asercji: `SZMAX_DEFAULTS[1]`, ×2 `'14,20,28'`, `szMax epoki 2`) | liczby 14/20/28 | 30/50/70 (+ dołożone `[2]=50`, `[3]=70`) | właściwość bez zmian: fallback ISTNIEJE i jest brany przy `society = null`. Zmieniły się wyłącznie liczby, które niesie |
| 3 | normalizacja §2 — **NOWA** | — | `SZMAX_DEFAULTS === szMaxByEra('normal') z JSON` | wprost wymagane przez R3-C: przyszły rozjazd kodu z danymi czerwieni bramkę (mutacje M-C i M-C2 — z obu stron) |
| 4 | normalizacja §5 `wspolczynnik Sz per trudnosc` | `easy < normal < hard` | `easy === normal === hard` **+ dołożone** `= 0,04` | odwrócony znak oczekiwania, nie usunięcie: dalej pilnuje, żeby nikt nie wrócił do trójki per trudność (kontrakt G13). Bliźniacza asercja **dla Prawa NIETKNIĘTA** |
| 5 | normalizacja §8 dwie kotwice tabeli | `szMax(12,e1)=48,0`, `(12,e3)=112,0` | **44,4** i **103,6** — przeliczone samodzielnie: `(1+0,04)^(12−2) = 1,48` (zaokrąglenie 2 miejsc w `popScaleMultiplier`), `30×1,48` i `70×1,48` | tabela z raportu nadal przybita do kodu. **Dołożona** kotwica samej wartości mnożnika `1,48×` — bez niej zmiana współczynnika przesunęłaby obie strony istniejącej proporcji `prog(12)/prog(2)` naraz i przeszłaby bez śladu |
| 6 | przebudowa-skali §2g `wspolczynnik = 0,048 bez zmian` | literał 0,048, tylko `normal` | pętla `0,04` po **trzech** trudnościach | ta asercja pilnowała uchylonego zapisu „BEZ ZMIAN, ZOSTAJE" z G13. Klucz nadal musi ISTNIEĆ i nieść liczbę właściciela; pokrycie wzrosło z 1 na 3 poziomy |
| 7 | upkeep `:208/:209` | literały `+1` / `−1` | literały **`+2` / `−2`** | literał został literałem (zakaz z R3-B). To jedyne miejsce w pliku znające liczbę z DRUGIEGO nośnika — reszta porównuje się z `M.CITIZEN_UPKEEP_*` symbolicznie. `−1%` Rozwoju nietknięte (poza decyzją) |
| 8 | r-wzrost `10+1+1 = 12`, `= 11`, `= 10` | suma trzech kanałów | wszystkie **`= 10`** + **asercja negatywna** po 4 kombinacjach flag + kontrola przy Wealth 0 | właściwość tematu („bonus per miasto nie może być mnożony", objaw 111) zostaje i rośnie: skoro oba kanały wnoszą zero, żadne wejście nie wniesie punktu — dubel nie może wrócić. 3 → 7 asercji |

## TESTY

`node ./node_modules/typescript/bin/tsc --noEmit` (tsc 5.9.3 z `gra/node_modules`, C-029) — **0 błędów**.
Zero komend `npm run` (C-001).

**Rodzina szczęścia/porządku — komplet ZIELONY:** szczescie-przebudowa-skali **519/0**,
szczescie-skala-normalizacja **146/0**, szczescie-zamoznosc 88/0, society-breakdown 53/0,
building-happiness 14/0, r-wzrost-…-ceramika **59/0**, war-happiness-parity 21/0, wealth 36/0,
**citizen-resource-upkeep 109/0** (kryterium 4), culture-religion 65/65, happiness-breakdown 38/38,
porzadek-panel-czytelnosc 81/81, empire-religia-panel-coverage 15/15, ai-dlug-porzadki 17/17,
city-orderstate-restore-clear 9/9, diplomacy-border-march 43/43, territory-border 9/9,
territory-border-dense 15/15, border-march-scan 15/15.

**Pięć bramek referencyjnych:** logic **213/213**, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6.

**Jedyna czerwona: `border-march-wygasanie-test` 22/4** — dopuszczony wyjątek. Dowód, że to nie
regres tej rundy: bramka czyta WYŁĄCZNIE `gra/src/main.ts` jako tekst (`:30-31`), a
`git diff --stat origin/main -- gra/src/main.ts` jest **pusty** — plik jest bajt w bajt jak na
czystym `main`, więc wynik jest identyczny z bazą (zgodnie z pomiarami rundy 1 i 2).

### Dowód nietautologiczności — 5 mutacji, każda cofnięta z KOPII pliku (nigdy `git checkout -- gra/`)

| zmiana | mutacja | skutek |
|---|---|---|
| R3-A | `szczescie_max_pop_wspolczynnik.normal` 0,04 → 0,048 | normalizacja **141/5** (parytet, wartość 0,04, obie kotwice tabeli, mnożnik 1,48) + przebudowa-skali **518/1** (2g) |
| R3-B | `citizen-resource-upkeep.json` `_kara.szczescieZaDostepny` 2 → 1 | upkeep **107/2** — czerwienieje przepisany literał `+2` i fixtura netto |
| R3-C | `SZMAX_BY_ERA_DEFAULT` [30,50,70] → [30,50,**71**] (rozjazd od strony KODU) | normalizacja **142/4**, w tym nowa asercja wiążąca |
| R3-C (2) | dane `szczescie_max_epoka.normal` → [30,50,**71**] (rozjazd od strony DANYCH) | normalizacja **140/6**, w tym ta sama asercja wiążąca — łapie w obie strony |
| R3-D | przywrócone `+ (ceramika ? 1 : 0) + (spichlerz ? 1 : 0)` | r-wzrost **53/6** — czerwienieją trzy przepisane asercje i trzy z asercji negatywnej |

Po każdej mutacji `git diff --quiet <plik>` = czysto (potwierdzone jawnie w logu każdej z pięciu).
Stan końcowy: `git status --short` **pusty**, HEAD `3d24a86c`.

## BLOKADY

Brak. Kryteria końca rundy 3, punkty 1–7 — **wszystkie spełnione**.

## OBSERWACJE (bez zmian, do wiadomości orkiestratora)

- `SZ_MAX_POP_WSP_DEFAULT = 0.048` (`society-breakdown.ts:233`) to teraz jedyny fallback Szczęścia
  rozjechany z danymi (0,04) — dokładnie ta sama klasa problemu, którą R3-C domknął dla `SZMAX_DEFAULTS`.
  Allowlista rundy 3 dopuszcza w tym pliku **wyłącznie** `SZMAX_DEFAULTS`, więc nie tknąłem.
  Skutek dziś zerowy dla bramek (dane ładują się statycznie), ale wiązanie „fallback = dane"
  istnieje po zmianie tylko dla mianownika, nie dla współczynnika.
- Obserwacja rundy 2 „start easy = PorPct 94,8% przy pop 1" pozostaje otwarta — nie moja decyzja.

RUNDY: 3/5
NASTĘPNY KROK: Evaluator (to samo ID, ta sama gałąź).
DEPLOY/PUSH: NIE WYKONANO
