# P6-REPIN-EKONOMIA-A - odswiezenie portu Rust do webu 91dc998a (czesc A)

Temat: R-RUSTPORT-REPIN-EKONOMIA-A-Q1. Baza: `fb55afe2` (rust-port/parity-v2). Pin stary: `edb8fb56`. Pin docelowy: `91dc998a`.
Pin w manifestach NIE przesuniety (osobny temat po krokach 1-5 wg REPIN-DELTA §6).

## Metoda

- Kod weba: `git archive <pin> gra/src gra/data` do katalogu tymczasowego poza repo.
- Wektory: generatory z runu `R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1` (`gen-p65b-vectors.mjs`) i `R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1` (`gen-p67a-vectors.mjs`) uruchomione na weba `edb8fb56` odtwarzaja wektory z repo BAJT-W-BAJT (kontrola metody). Na `91dc998a` generowane ponownie; roznice = zmiana zachowania weba.
- Roznice wektorow: `manpower` i `replenish` (p6_5b); `manpower` (p6_7a). Pozostale wektory p6_7a (`edge`, `post_central`, `params`) zmieniaja sie tez przez Czesc B (`population-growth-v85`) i ekonomie (`econParamsRawForBuild`) - NIE regenerowane w tym temacie.

## Tabela: zmiana -> web -> Rust -> test/wektor -> status

| # | Zmiana behawioralna (web 91dc998a) | Web (plik:linia) | Rust (plik:linia) | Test / wektor | Status |
|---|---|---|---|---|---|
| 1 | `civManpowerRegenMult` / `civManpowerMaxMult` / `civManpowerMults`: bonusy civs.json bez wplywu (zawsze 1.0) | `gra/src/game/manpower.ts:415,422,429` | `rust-port/engine/src/domain/recruitment.rs:1766,1771,1776` | `tests/p6_5b_manpower.rs::civ_bonus_multipliers_match_web` (asercje rownosci bez zmian; pokrycie zmienione na liczbe list bonusow); `p6_5b_vectors/manpower.json` `params.civ` | PORTOWANE |
| 2 | `civManpowerMatrixMults` + `ManpowerMatrixOverrides`: `max(0, 1+v)` dla skonczonych pol, inaczej 1; osobny `costMult` | `manpower.ts:447` (+ `matrixMultiplier`) | `recruitment.rs:1838` (`civ_manpower_matrix_mults`, `matrix_multiplier`) | `tests/p6_5b_manpower.rs::civ_matrix_manpower_mults_match_web_formula` (NOWY test jednostkowy: brak pola, override, NaN/Infinity). ZALOZENIE: wektory webu nie podaja `resolveOwnerMatrix`, wiec sciezka override jest pokryta tylko testem jednostkowym | PORTOWANE (czesciowo: klucz cywilizacji - patrz ZALOZENIA) |
| 3 | `scaledManpower`: `Math.max(0, isFinite(m) ? m : 1)` zamiast `max(0.1, m)` | `manpower.ts:464` | `recruitment.rs:2138` (`scaled_manpower`) | `p6_5b_vectors/manpower.json` (`scalar.unitManpowerCost` maxMult 0.05 -> 50, 0 -> 0); `p6_7a_vectors/manpower.json` (37 przypadkow z maxMult 0.05) | PORTOWANE |
| 4 | `costMult` jako koncowy parametr (domyslnie `maxMult`) w: `unitManpowerCostForType` (544), `cityManpowerSnapshot` (koszt jednostki), `canAffordUnitManpower(+Empire)`, `tryDeductUnitSpawnCosts(+Empire)`, `refundUnitSpawnToCity`, `spendManpower` | `manpower.ts:544,610-615,638-643,725-733,741-749,798-804,838-845,877-882` | `recruitment.rs:2160` i funkcje z `cost_mult: f64` na koncu sygnatury | Testy P6.5B przekazuja `costMult = maxMult` (= domyslna wartosc weba). Generator nie podaje `costMult` jawnie, wiec wartosc rozna od `maxMult` NIE jest pokryta wektorami. LUKA: NIE_ZMIERZONO (brak mutacji dla costMult != maxMult) | PORTOWANE (kod); LUKA TESTOWA |
| 5 | `tickManpowerUnitReplenishment`: usunieto wczesne wyjscie `empireMp <= 0`; `unitCost <= 0` juz nie pomija jednostki (tylko skauci); `unitCost === 0` leczy bez zuzycia Manpower | `manpower.ts:269` (petla), `:342` (`unitCost === 0`) | `recruitment.rs:2654` (`tick_manpower_unit_replenishment`), blok `if unit_cost == 0.0` ok. `:2745` | `tests/p6_5b_replenish.rs` (wektory `p6_5b_vectors/replenish.json` zregenerowane z weba 91dc998a; test przechodzi) | PORTOWANE |
| 6 | Parametr `resolveOwnerMatrix` w `tickManpowerUnitReplenishment` (opcjonalny) | `manpower.ts:289` | `recruitment.rs:2654` (`resolve_owner_matrix: Option<&dyn Fn..>`) | `tests/p6_5b_replenish.rs` przekazuje `None` (jak generator) | PORTOWANE |

### Uzupelnienie: wplyw na P6.7A (miasta, wzrost)

- `city_growth.rs:1608` uzywa `civ_manpower_mults_legacy_edb8fb56` (`recruitment.rs:1790`) = DOKLADNIE stare mnozniki z bonusow civs.json (pin edb8fb56). Powod: web `population-growth-v85.ts` (Czesc B, NIE portowana w tym temacie) nadal liczy `maxMult` na starych zasadach w wektorach `p6_7a` `post_central`/`edge`. Bez tego testy P6.7A zgloszylyby regresje. Funkcja KOMPATYBILNOSCI do usuniecia przy porcie Czesci B (przejscie na macierz `civManpowerMatrixMults(ownerCiv)`).

## ZALOZENIA (luki rozstrzygniete zalozeniem)

- Z1: Rust nie ma globalnego `civ-matrix.ts` (`civMatrixParam(civKey,...)`). `civ_manpower_matrix_mults` przyjmuje macierz jawnie (`Option<(&CivMatrixFile, &str)>`); `None` = web `civKey undefined`. Produkcyjny wywolujacy (Czesc B / main) musi podac macierz.
- Z2: `skalowanie_min` w `data/derived/manpower-params.json` (0.1, pin edb8fb56) nie jest juz czytany przez `scaled_manpower`; plik danych NIE zmieniany (allowlista). Zrodlo prawdy: web 91dc998a (`max(0, ...)`).
- Z3: Parametr `_max_mult` w `unit_manpower_cost_for_type` jest nieuzywany - web `unitManpowerCostForType` liczy koszt tylko z `costMult` (`manpower.ts:544-551`).
- Z4: `civ_manpower_mults`/`civ_manpower_regen_mult`/`civ_manpower_max_mult` zachowuja sygnatury z `bonusy` (wywolania testowe), ale zwracaja neutralne 1.0 jak web 91dc998a.

## Pozostale zmiany weba w zakresie czesci A (NASTEPNA-PARTIA)

Zakres dispatchu (poza manpower.ts): `economy.ts`, `production.ts`, `turn-economy.ts`, `work-tax.ts`. Liczba hunkow `git diff -U0 edb8fb56 91dc998a` (wykonane, nie zportowane):

| Plik weba | Hunki | Modul Rust (cytowanie `// web:`) | Status |
|---|---|---|---|
| `gra/src/game/economy.ts` | 41 | NIE_ZMIERZONO (brak mapowania cytowan w tym temacie) | NASTEPNA-PARTIA |
| `gra/src/game/production.ts` | 44 | czesciowo `domain/recruitment.rs` (cytowania `production.ts:417,635-638`), reszta NIE_ZMIERZONO | NASTEPNA-PARTIA |
| `gra/src/game/turn-economy.ts` | 51 | `domain/turn_economy.rs` (nazwa pasuje; cytowania NIE_ZMIERZONO) | NASTEPNA-PARTIA |
| `gra/src/game/work-tax.ts` | nowy plik (77 linii) | brak odpowiednika w Rust (nowy modul `work_tax`) | NASTEPNA-PARTIA |

Dane derived (`unit-gold-states`, `building-work-states`, `improvement-work`): NIE_ZMIERZONO w tym temacie - decyzja w kolejnej partii, nowy plik JSON + wpis w `derived.rs` na koncu.

## Bramki (R1)

- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (dodano `#[allow(clippy::too_many_arguments)]` na `can_afford_unit_manpower_empire` i `try_deduct_unit_spawn_costs_empire`, wzor jak przy `tick_manpower_unit_replenishment`)
- `cargo test --no-fail-fast`: 1266 passed / 0 failed (baza 1265/0 + nowy test jednostkowy matrix)
- `git diff --check`: czysty

## Pomiary R2 (Operator-pomiary, niezalezny weryfikator)

Log: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-A-Q1/pomiary-r2.log`.

- Wektory regenerowane z weba `91dc998a` (generatory R1, bez zmian): `p6_5b` `buildings`, `format`, `manpower`, `replenish` oraz `p6_7a` `empire`, `growth`, `manpower`, `tempo_stawki` - BAJT-W-BAJT zgodne z repo (0 rozbieznosci). `p6_7a` `edge`, `params`, `post_central` - roznia sie (oczekiwane; nie regenerowane, patrz LUKI).
- Etykieta `meta.pin` w wektorach `p6_5b`/`p6_7a` nadal `edb8fb56` (sztywno w `gen-p65b-vectors.mjs:749`). Dane z `91dc998a`. Poprawka generatora: osobna partia.
- Mutacje (`mutate-repin-a.py`, K01-K09): 6/9 WYKRYTA, 3/9 NIEWYKRYTA.
  - NIEWYKRYTA K04 (koszt typu z `maxMult` zamiast `costMult`) i K05 (koszt leczenia z `maxMult`): luka (a) z R1 potwierdzona pomiarem.
  - NIEWYKRYTA K06/K07 (galaz `unitCost === 0`: wylaczona / leczy 0 HP): wektory `replenish` nie zawieraja przypadku `costMult = 0`, bo generator nie podaje `resolveOwnerMatrix` (costMult zawsze 1). Galaz kodu NIE jest pokryta zadnym testem. Luka WIEKSZA niz opisana w R1 (R1 zaklasyfikowala ja jako PORTOWANE na podstawie wektorow).
- Bramki: fmt EXIT=0; clippy EXIT=0; test EXIT=0 (170 binarek, 1266 passed / 0 failed).

### Tabela statusow po pomiarach (aktualizacja wiersza 4 i 5)

| # | Zmiana | Status po R2 |
|---|---|---|
| 4 | `costMult` jako parametr | PORTOWANE (kod); LUKA TESTOWA: K04/K05 NIEWYKRYTA |
| 5 | `unitCost === 0` leczy bez zuzycia | PORTOWANE (kod); LUKA TESTOWA: K06/K07 NIEWYKRYTA - brak wektora i brak testu jednostkowego |

### NASTEPNA-PARTIA (wymagana przed Evaluatorem)

- Test jednostkowy `costMult != maxMult` (np. `unit_manpower_cost_for_type(Some(..), epoka, 2.0, 0.5)` = `unit_manpower_cost(epoka, 0.5)`), zabija K04.
- Test `tick_manpower_unit_replenishment` z `resolve_owner_matrix` zwracajacym `mp_koszt_jednostki_proc = -1` (costMult = 0): jednostka leczy sie bez zmiany puli Manpower; zabija K06/K07.
- Poprawka `meta.pin` w generatorach (etykieta z parametru, nie na sztywno).

## Zalozenia pomiarow

- Z5: K06 pierwotnie dal blad srodowiska (zapis w trakcie braku miejsca na dysku); powtorzenie daje NIEWYKRYTA. Wynik z powtorzenia przyjmowany.
- Z6: `mutate-p65b.py` (R1 P6.5B) nie jest uzywany do mutacji portu 91dc998a - dwa wzorce (M03, M04) nie pasuja; skrypt nie jest zmieniany (poza allowlista).
