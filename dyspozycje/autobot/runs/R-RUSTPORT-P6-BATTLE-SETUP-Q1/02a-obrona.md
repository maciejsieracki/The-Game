# R-RUSTPORT-P6-BATTLE-SETUP-Q1 — Obrona Operatora, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BATTLE-SETUP-Q1
GOAL: T5a — teren + mur pola bitwy w silniku wg pinu 07d2fbd72
ZMIANY/COMMIT: gałąź obrona/battle-setup-q1-r1 na 6be8b3a8f (raport Evaluatora; kod 4ae3c51c4, baza d21caf8f2).
               Zmiany wyłącznie w testach z allowlisty: tests/p6_battle_setup.rs (+1 test), tests/p6_battle_setup_gen.mjs
               (+przemiatanie sideCap, +wektory _carveBattleBox), tests/p6_battle_setup_vectors/vectors.json (regeneracja).
               Kod src/ BEZ ZMIAN. SHA: w commicie tego raportu (podany w odpowiedzi Obrony).
TESTY: fmt --check 0; clippy --all-targets -D warnings 0; p6_battle_setup 15/15 (było 14); mutanty E7/E11 zabite,
       E10 równoważny (dowód §3); pełny cargo test --all-targets: NIE_ZMIERZONO w obronie (dysk 5,4 GB < 8 GB, §1)
BLOKADY: pełna bramka czeka na FC (dysk); wynik Evaluatora z pełnej bramki = INFRA (§1)
RUNDY: 1/5
NASTĘPNY KROK: Final Control — pełny cargo test --all-targets --no-fail-fast przy >= 8 GB wolnego
DEPLOY/PUSH: NIE WYKONANO
```

## Zarzuty i odpowiedzi

### Z1. Pełny `cargo test --all-targets` Evaluatora NIE_ZMIERZONY — PRZYJMUJĘ (z ustaleniem), bez zmian kodu

Odczytałem log Evaluatora po zakończeniu (`scratchpad/bsetup-eval/full.log`): `FULL_EXIT=101`, ale to **INFRA, nie
błąd testów**: `grep -c 'test result: FAILED'` = **0**, `panicked` = **0**, natomiast **237** wpisów
`could not execute process ... (never executed) / No such file or directory (os error 2)` — binarki testów zostały
usunięte z `scratchpad/bsetup-eval/target` w trakcie przebiegu (sprzątanie/presja dysku równoległych tematów).
Zakończone binarki (295 linii `test result:`) wszystkie `ok`. Przebieg Evaluatora nie jest więc ani dowodem PASS,
ani FAIL. Sam nie uruchomiłem pełnej bramki: wolne miejsce na `/` spadło do **5,4 GB** (dispatch: >= 8 GB przed
pełną bramką; równolegle budują inne tematy). Operator (r1) zgłosił EXIT 0 (4002/0/0) na tym samym kodzie
`4ae3c51c4`; obrona nie zmienia `src/`, a dodany test jest samodzielny (tylko `p6_battle_setup`). **Final Control
musi odtworzyć pełną bramkę** (zgodnie z zarzutem).

### Z2. Mutanty Evaluatora E1–E24 NIE_ZMIERZONE — PRZYJMUJĘ: odczytane, 2 luki zamknięte, 1 równoważny

Wynik `scratchpad/bsetup-eval/emut.log` po zakończeniu: 21/24 ZABITE, przeżyły **E7, E10, E11**.

* **E7** (`k < BF_COLS` → `k < 31` w `deploy_rank_cols`) — **PRZYJMUJĘ, luka testów.** `ATK_FRONT_COL=31`,
  `DEF_FRONT_COL=36`: dla k = 31 pin dodaje kolumny 0 i 67 (poza strefą gry, później przykrywa je `_fencePlayableZone`,
  a w scenariuszach były już Plains), więc etapy scenariuszy tego nie widziały. Poprawka: generator wykonuje
  `_carveBattleBox` pinu (`H.Harness.prototype._carveBattleBox`, tekst bez zmian) na syntetycznej siatce bez ani
  jednego Plains (rodzaje 1..7, wzór `(c*5 + r*3 + (c*r)%7) % 7 + 1`) dla preset × sideCap
  {0, 120, 150, 210, 240, 380, 500, 1e6, NaN, -1} → `boxes` (20 wektorów). Nowy test
  `carve_box_na_syntetycznej_siatce_i_przemiatanie_glebokosci_jak_pin` porównuje kafle bajt w bajt i wymaga, by
  kolumna 0 była wycięta w >= 4 wektorach. Dowód: mutant E7 → **ZABITY** (`carve_box_na_syntetycznej_siatce_...`).
  Uwaga: `Infinity` celowo NIE jest w `boxes` — pętla pinu `for (k = 0; k < Infinity; k++)` nie kończy się
  (pierwsze uruchomienie generatora z `Infinity` wisiało > 30 min, przerwane); Rust kończy na `BF_COLS` (decyzja r1,
  udokumentowana w `deploy_rank_cols`), a `setup_battle_field` dostaje sideCap <= 500 z `battle_clear_side_cap`.
* **E11** (`hi >= lo` → `hi > lo` w `battle_safe_cols_f`) — **PRZYJMUJĘ, luka wektorów.** Zakres jednokolumnowy
  (`[10,10]`, `[57,57]`) powstaje przy głębokości 21 (np. sideCap 144.5, bez presetu), której 24 dotychczasowe wektory
  nie zawierały. Poprawka: przemiatanie sideCap 0..520 co 0,5 dla obu wartości `presetActive` (wykonanie
  `battleSafeCols`/`battleClearRanks`/`deployClearRanksFor` pinu) dopisane do `clearRanks` (24 → 2106; pierwsze 24
  bez zmian — sprawdzone porównaniem JSON); 48 wektorów ma zakres jednokolumnowy, test asertuje ich obecność.
  Dowód: mutant E11 → **ZABITY** (`side_cap_glebokosc_i_safe_cols_jak_pin`).
* **E10** (kropka/przecinek bez cyfry wliczana do dopasowania w `match_mult`) — **ODRZUCAM jako mutant równoważny.**
  `match_mult` jest prywatne; jedyny konsument `cavalry_terrain_multiplier` robi `replacen(',', ".", 1)` i
  `parse::<f64>()`. Mutant zmienia przechwycenie tylko z `"N"` na `"N."`/`"N,"` (po separatorze bez cyfry pętla cyfr
  nic nie dodaje), a w Rust `"2.".parse::<f64>() == Ok(2.0)` (zmierzone: `2.`→2.0, `12.`→12.0, `0.`→0.0), więc wynik
  funkcji jest identyczny dla każdego wejścia. Wektor `'x 2.'` już jest w danych i daje 2 w obu wariantach. Ponowny
  przebieg mutanta po poprawkach: PRZEŻYŁ — zgodnie z równoważnością.

### Z3. Bramki odtworzone przez Evaluatora (fmt, clippy, 14/14, MD5, allowlista, brak #[ignore]) — PRZYJMUJĘ (potwierdzenie)

Po poprawkach obrony: `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0,
`cargo test --test p6_battle_setup` **15 passed, 0 failed, 0 ignored**. Generator deterministyczny: 2 uruchomienia →
`vectors.json` MD5 `89b11a92710638ad178ca3b7f20e89d5` (nowe, wcześniej `2be023c8…`), `renderer_parity.json` bez zmian
`d5d76ef6b5e27a5dfd75d57f9c4f3d2c`; strażnik SHA pinu bez zmian (`a17735ed…`, `cc715ed6…`, `52fd18e9…`, fragmenty
`21984ff2…`). Wszystkie pozostałe sekcje `vectors.json` identyczne z r1 (porównanie JSON klucz po kluczu).

### Z4. Mutant równoważny operatora (straż łączności) przyjęty — PRZYJMUJĘ (potwierdzenie), bez zmian

### Z5. Test renderera czyta tekst `field.rs` — ODRZUCAM jako wadę

To celowy strażnik wymagany przez dispatch pkt 4 („równość WYŁĄCZNIE przez fiksturę JSON, bez zależności od crate”):
test nie linkuje crate renderera, a FNV-1a wycinków (`tile_jitter`, `set_index`, `carve_wall_tiles`, stałe) sprawia, że
każda zmiana tych funkcji w rendererze zatrzymuje test i wymusza ponowne wykonanie generatora — dokładnie po to, by
parytet silnik↔renderer nie rozjechał się po cichu. Usunięcie odczytu osłabiłoby ochronę.

### Z6. `js_sin` dla `|x| > 2^19·π/2` wraca do `f64::sin` — ODRZUCAM (poza ścieżką produkcyjną, udokumentowane)

Produkcja (`setup_battle_field` → `battle_generate_opts`) ma stałe `rows = BF_ROWS = 156`, `row_margin = PLAY_ROW0 = 23`,
więc argument z trybu `wide` (`((r - rowMargin)/wavelength)·2π + phase`, `wavelength >= 24`) ma `|x| < ~50`; wektory
`sin` (3000, bit w bit z V8) pokrywają tę dziedzinę. Zakres i fallback są opisane w nagłówku `battle_setup_sin.rs`
(ten sam limit co przyjęty wcześniej `mapgen::masks::js_sin`). Osiągnięcie wymaga publicznego
`generate_battle_terrain` z `row_margin`/`rows` rzędu milionów — wejścia, których pin nigdy nie podaje. Pełna redukcja
Payne-Hanka byłaby kodem bez użycia; zgłaszam jako dług nieblokujący, jeśli orkiestrator uzna inaczej.

### Z7. `tower_spacing: Option<i64>` — ODRZUCAM (kontrakt istniejącego modułu, dane pinu = 4)

Typ pochodzi z istniejącego `domain/city_towers.rs::TowerRowsInput::spacing: Option<i64>` (jest w bazie `d21caf8f2`,
moduł poza allowlistą — dispatch zabrania zmian istniejących modułów). `SiegeFieldInput` tylko go przekazuje. Dane pinu
(`miasto-params.json` `wieze_strzeleckie_odstep_kafli.wartosc`) = 4, a scenariusze `odstep-wiez-1/2/3/brak` pokrywają
całkowite wartości i brak klucza. Wartości niecałkowite/NaN nie występują w danych; zmiana kontraktu `city_towers`
to osobny temat.

### Z8. Raport Evaluatora `6be8b3a8f`, brak push — PRZYJMUJĘ (potwierdzenie)

Obrona zbudowana na `6be8b3a8f` (przodek: `12d87282e` → `4ae3c51c4` → `d21caf8f2`). Brak push/deploy.

## Ślad poleceń

* Mutanty obrony: `scratchpad/bsetup-obrona/mut.py` (E7, E11, E10 na kopii roboczej z przywróceniem pliku).
* Target: `scratchpad/bsetup-obrona/target` (usunięty po bramkach).
