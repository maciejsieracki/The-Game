# R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1 — Obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1
GOAL: zamrozić w repo wektory pinu `07d2fbd72` dla zmiany prędkości bitwy W TRAKCIE walki i pilnować ich testem silnika bajt w bajt oraz kontrolą czułości.
ZMIANY/COMMIT: baza obrony = kod Operatora `bf6c3dbf1` (BAZA dispatchu `3f98dd284229f975e373b9c3be7a0d28232089d3` jest przodkiem). Commit poprawek `fb64cd745` (2 pliki z allowlisty: `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` +70/−1 linii, `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` +3) + commit tego raportu (SHA w `git log`, gałąź lokalna `obrona-412`). `speed_change_vectors.json` (MD5 `a374deaea878eca21ff4166817fb03a9`), `speed_vectors.json` (MD5 `d764f078f08aa5df274e3f74d09df14b`), `vectors.json`, kod produkcyjny i `gra/` — BEZ ZMIAN.
TESTY: engine `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (4354 passed / 0 failed / 1 ignored, §3); test `zmiana_predkosci_w_trakcie_bitwy_wektory_pinu_bajt_w_bajt` po poprawce 1 passed (68,8 s debug), dwa przebiegi kontrolne z celowo zepsutym plikiem wektorów → FAIL z czytelnym komunikatem (§1, U1).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (03-final-control.md); orkiestrator: wpis w REJESTR-RUST (288 vs 351, nowy plik, dług FQ-SPEED-MIDCHANGE-DIV = #413, uwagi U2–U4 niżej).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Odpowiedzi na zarzuty

Punkty 1–3 listy zarzutów (lokalizacja raportu Evaluatora, odtworzone bramki, powtórzenie generatora 4/4) to potwierdzenia, nie zarzuty — PRZYJMUJĘ do wiadomości, bez zmian.

### U1 — lista rozbieżności maskuje regresję przed zmianą prędkości — PRZYJMUJĘ (poprawka + dowód, `fb64cd745`)

Zarzut zasadny: dla 9 pozycji `ROZBIEZNE_FQ_SPEED_MIDCHANGE` test sprawdzał tylko „są różnice” (`continue` przed jakąkolwiek asercją), więc regresja silnika przy STAŁEJ prędkości (przed zmianą) w tych bitwach przeszłaby niezauważona.

Poprawka (`p6_k5loop_wiring_a_pin.rs`):
- `MidRun.event_t` — czas `t0` (`vNow`) każdego zdarzenia Rusta.
- `przed_pierwsza_zmiana(sv, run)` — dla pozycji listy wymaga: (a) chwila pierwszej zmiany (klatka, `vNow`, `roundNo`, prędkość przed i po) równa pinowi; (b) pierwsze rozbieżne zdarzenie (zarówno po stronie Rusta, jak i pinu) ma `vNow` ≥ `vNow` pierwszej zmiany. Nowa asercja `przed_zmiana.is_empty()` w `zmiana_predkosci_w_trakcie_bitwy_wektory_pinu_bajt_w_bajt`.
- Czułość strażnika wbudowana w test: dla pierwszej pozycji listy, która ma zdarzenia pinu przed zmianą, kopia wektora z podmienionym zdarzeniem sprzed zmiany musi zostać wykryta (`straz_sprawdzona`, asercja, że kontrola się wykonała).

Dowody (binarka testu z `fb64cd745`):

| Przebieg | Wynik |
|---|---|
| Plik z repo | `1 passed` (68,76 s): 9/9 pozycji listy rozbieżnych wyłącznie PO zmianie; kontrola czułości strażnika wykonana; liczby bez zmian (40/31/9, 42 zmiany, 18 par, 22 tury, 3301 zdarzeń) |
| `WIRING_A_SPEED_CHANGE_FILE` = kopia z podmienionym zdarzeniem 70 (`t=257824` < zmiana `259440`) w `sc_fq_rown_mix_d8l_mury_217_x1to2_lunge` | FAIL: `zdarzenie 70 przed zmianą (vNow zmiany 259440): Rust …D atk:a0… t=257824, pin …D atk:regresja… t=257824` |
| kopia z `changes[0].vNow + 16` w `scm_rt_mur_machiny_wylom_1_4_64_2` | FAIL: `chwila pierwszej zmiany Some((272, 4320.0, 2, 1.0, 4.0)) != pin (272, 4336.0, 2, 1.0, 4.0)` |

Przed poprawką oba zepsute pliki przeszłyby (wniosek z kodu `bf6c3dbf1`, nie uruchamiane: obie różnice trafiały do `d` pozycji z listy, a ta kończyła się `continue` bez asercji na treści różnic).

Ograniczenie (jawnie): 7 z 9 pozycji listy nie ma żadnego zdarzenia pinu przed pierwszą zmianą (zmiana w turach 1–22 przed pierwszym starciem); dla nich strażnik sprawdza chwilę zmiany (klatka, `vNow`, `roundNo`, prędkość), nie strumień. Zdarzenia przed zmianą mają 2 pozycje: `..._218_x1to4_lunge` (79/138) i `..._217_x1to2_lunge` (71/118). Mocniej się nie da bez porównania pełnego stanu jednostek w chwili zmiany (pin zapisuje tylko liczniki `inFlight/preHit/moving/lunging`, Rust nie ma ich odpowiedników w API sesji) — poza zakresem tej obrony; temat naprawczy #413 i tak ma kryterium „lista pusta”.

### U2 — rozbieżności 9/40 realne; „32/32 zgodne” za szerokie; potrzebny FQ-SPEED-MIDCHANGE-DIV — PRZYJMUJĘ (bez zmian kodu, D-412-2)

Zgodne z raportem Operatora §4 (klasa L z `siege_tactics_loop.rs:3196`, przypadki 122 `round` i 333 x2→x1 w klasie R). Treść do rejestru (wpis robi orkiestrator): „zmiana prędkości w trakcie bitwy: 31/40 wektorów pinu zgodnych bajt w bajt, 9/40 jawnie rozbieżnych (lista `ROZBIEZNE_FQ_SPEED_MIDCHANGE`); pomiar #407 32/32 dotyczył wyłącznie zmian `{round}` na kandydatach c1 — NIE oznacza pełnej zgodności zmiany w trakcie; naprawa = #413 FQ-SPEED-MIDCHANGE-DIV (kryterium końca: lista pusta)”. Poprawka kodu silnika tutaj byłaby sprzeczna z D-412-2.

### U3 — wąskie pokrycie wypadu wręcz (1 zgodny przypadek, cios w tej samej klatce) — PRZYJMUJĘ jako uwagę, ODRZUCAM rozszerzanie w tym temacie (dowód)

Fakt potwierdzam. Zmiana tuż przed ciosem wręcz jest dokładnie mechanizmem klasy L (cios liczony w `start` siatką sprzed zmiany): 3/4 wygenerowanych przypadków `lunge` są rozbieżne. Dodanie kolejnych wektorów `lunge` w tym temacie dałoby tylko kolejne pozycje listy rozbieżności, nie zgodne pokrycie — a wymóg dispatchu (kryterium 1, chwile „w trakcie ruchu w locie i tuż przed trafieniem”) spełniają: pocisk w locie 15, tuż przed trafieniem 16, krok ruchu 6, wypad 1 (licznik w teście, `cov`). Po U1 pozycje `lunge` z listy są teraz pilnowane do chwili zmiany (2 z nich mają 71–79 zdarzeń przed zmianą). Zalecenie dla #413: kryterium końca „3 przypadki `lunge` z listy zgodne” daje automatycznie zgodne pokrycie zmiany tuż przed ciosem.

### U4 — zamrożono inny (szerszy) zbiór niż pomiar #407; c1 128/128 @1/@16 NIE_ZMIERZONO — PRZYJMUJĘ jako uwagę (bez zmian)

Zgodne z §6 raportu Operatora. Kandydaci c1 nie istnieją w repo (plik scratchpadu obrony #407), więc nie da się ich odtworzyć bez wygenerowania nowego zbioru; kod produkcyjny silnika jest bez zmian (D-412-2), więc wynik #407 obowiązuje. Do rejestru: „#412 zamroził 40 przypadków ze scenariuszy `vectors.json` (nie dosłownie 32 bitwy c1 z #407); c1 128/128 @1/@16 w tym temacie NIE_ZMIERZONO”.

### U5 — czas testów ok. 300 s; ścieżka scalania shardów nieuruchomiona — czas: ODRZUCAM zmianę (dowód); scalanie: PRZYJMUJĘ (uruchomione + poprawka błędu)

Czas: test bajt w bajt trwa 68,8 s, test mutantów (8 mutantów × 31 wektorów z przerwaniem na pierwszej różnicy) — reszta z ~300 s. Pełna bramka engine i tak jest uruchamiana w tle (>10 min); skrócenie oznaczałoby mniej wektorów albo mniej mutantów, czyli osłabienie kryteriów 1–2 dispatchu. Bez zmian.

Scalanie shardów — uruchomione na pinie (node 22, generator z `fb64cd745`), wynik:
- `WIRING_A_SPEED_CHANGE_SHARD=1/2` + `_ONLY` 3 przypadków → 3 wektory (`sc_mur_wieza_obl_las_x8to32_frame`, `sc_fq_wzg_lucz2_d3l_mury_157_x8to32_moving`, `sc_mr_wzg_wieza_df_mury_347_x1to64_moving`); `SHARD=0/2` + `_ONLY` 4 przypadków → 1 wektor (`scm_mi_gory_lucz2_d5_palisada_196_1_2_32`).
- `WIRING_A_SPEED_CHANGE_MERGE=part1,part0` → 4 wektory, kolejność = kolejność pliku w repo, **4/4 identyczne** z wektorami w repo (porównanie JSON), ten sam `pinSha256`, `frameWallMs` 16. (Scalanie zapisuje plik w katalogu wektorów — przywrócony z kopii, MD5 po teście `a374deaea878eca21ff4166817fb03a9` jak w repo.)
- Strażnik duplikatów: `MERGE=part1,part1` → `Error: powtorzony przypadek sc_mur_wieza_obl_las_x8to32_frame`, plik bez zmian.
- **Znaleziony błąd:** shard, który nie wybrał żadnego przypadku, nie ładował pinu i padał mylącym `straznik SHA-256 pinu: e3b0c442… (skrót pusty)`. Poprawka w `fb64cd745`: jawny błąd `czesc bez przypadkow (WIRING_A_SPEED_CHANGE_SHARD / _ONLY nic nie wybraly)` (sprawdzone: komunikat pojawia się dla `SHARD=0/2` + 1 przypadku o indeksie nieparzystym). Treść wektorów i ścieżka bez shardów — bez zmian.

## 2. Allowlista i zakazy

`git diff --stat bf6c3dbf1..fb64cd745`: 2 pliki z allowlisty (test silnika, generator). Brak `#[ignore]`, brak osłabionych asercji (dodana 1 asercja strażnika + 2 asercje czułości), brak zmian w `gra/`, w kodzie produkcyjnym i w plikach wektorów, brak `git add -A`, brak push/integracji, brak nazwy modelu w commitach.

## 3. Bramki (engine, D-412-3)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach), jeden build naraz, wolne 12 GB przed startem.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, log) | EXIT 0: 558 binarek, **4354 passed / 0 failed / 1 ignored** (jak Operator/Evaluator; `ignored` 1 — istniejący przed tematem); w tym `wektory_pinu_pelnej_bitwy_bajt_w_bajt`, `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (288), `zmiana_predkosci_w_trakcie_bitwy_wektory_pinu_bajt_w_bajt`, `zmiana_predkosci_w_trakcie_mutanty_sterownika_daja_fail` — ok |

Target usunięty po bramkach; procesy cargo/node tematu zakończone.

