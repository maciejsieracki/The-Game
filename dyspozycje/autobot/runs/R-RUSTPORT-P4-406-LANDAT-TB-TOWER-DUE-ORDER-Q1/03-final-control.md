# R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1: Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1
GOAL: kolejność trafienia wieży (`due = t0 + 380`) wobec innych zegarów tej samej klatki (`due ∈ (t0 + 380, t0 + 384]`) zamrożona w wektorach z wykonania pinu `07d2fbd72` i pilnowana testem bajt w bajt; czasy `t0 + 384` / `t0 + 704` przy 16 ms jako kontrakt; EV6 i mutanty kolejności zmierzone.
ZMIANY/COMMIT: oceniany kod Operatora `79c722678` (raporty Evaluatora `727604a1d` i Obrony `7c2a5a7fb` nad nim), baza `81bf861d24f543b6718f043f34a8ce29a3294a80` = `origin/rust-port/parity-v2` (zgodna z dispatchem, `merge-base --is-ancestor` OK). Final Control dodaje wyłącznie ten raport (gałąź `rust-port-wip/406-tower-due-order-q1-fc` nad `7c2a5a7fb`). Kodu nie zmieniał.
TESTY: odtworzone samodzielnie (§1, §3).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF `parity-v2` do kodu `79c722678` / raportów `7c2a5a7fb` + ten raport), wpisy w `REJESTR-RUST.md` (§4)
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki engine odtworzone przez Final Control (HEAD `7c2a5a7fb`, kod = `79c722678`)

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach i mutantach), jeden build naraz, brak procesów cargo na końcu. Wolne: 12 GB na starcie, 13 GB na końcu.

| bramka | wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, log z EXIT) | EXIT 0; suma 558 linii `test result`: **4372 passed / 0 failed / 1 ignored** (baza 4370 + 2 nowe). `kolejnosc_trafienia_wiezy_w_klatce_wektory_pinu_bajt_w_bajt` ok, `wieza_w_locie_nominalny_due_a_land_at_z_siatki_klatki` ok |
| `git diff --check 81bf861d2 HEAD` | czysto |

Client i renderer nietknięte (D-406-3) — bramek nie uruchamiano.

## 2. Allowlista, zakazy, D-406-1..3 (sprawdzone samodzielnie)

- `git diff --stat 81bf861d2 7c2a5a7fb`: `p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin.rs`, nowy `p6_k5loop_wiring_a_pin_vectors/tower_due_order_vectors.json`, `siege_tactics_loop.rs`, katalog runu. Nic spoza allowlisty.
- `siege_tactics_loop.rs`: diff to wyłącznie nowy `#[test]` w module `tower_target_tests` (hunk `@@ -7974,6 +7974,74 @@`). Kod produkcyjny bez zmian (D-406-2).
- W katalogu wektorów zmienia się tylko nowy plik (diff stat: 1 plik); `vectors.json`, `speed_vectors.json`, `speed_change_vectors.json`, `pin_data.json` bez zmian (D-406-1). Nowy plik: 801 607 B, MD5 `8fcae53473e7cd4d367df427cc96c483` (zgodne z raportami, ≤ ok. 1 MB).
- Brak `#[ignore]`, brak osłabionych asercji. Test 406 sprawdza: pinSha256, tryb `realtime`, `otherRandom == 0`, kontrakt `fire − t0 = frame_sched(F, nominał)` i literalnie 384/704 przy 16 ms, kolejność w każdej `pairFrames` (inny zegar po `towerHit`), cały strumień zdarzeń, loty wież/kamieni i wynik bitwy bajt w bajt, pokrycie par przy 16 i 8 ms oraz obecność `tower@16:384`, `boulder@16:704`, `tower@8:384`, `boulder@8:704`.
- Brak push na `parity-v2`, deployu, integracji; commity bez nazwy modelu.

## 3. Mutanty uruchomione przez Final Control (skrypt `01-operator-r1-mutanty.py`, `MUT_FULL=1`; po przebiegu `git status` czysty)

Wybrałem EV6 (kryterium 2) oraz Q4 i Q5, których nie odtworzył ani Evaluator, ani Obrona.

| ID | LIB (`--lib wieza_`) | WEKTOR 406 (EXIT, rozb.) | pełne (`--lib` / `--test p6_k5loop_wiring_a_pin`) | wynik |
|---|---|---|---|---|
| EV6 | 101 | 0, 0 | — | ZABITY (lib) — zgodne z Operatorem i Evaluatorem |
| Q4 (FIFO w klatce) | 0 | 0, 0 | 101 / 101 | ZABITY (pełne) — zgodne z Operatorem |
| Q5 (`due` wszystkich zegarów z siatki) | 0 | 0, 0 | 101 / 101 | ZABITY (pełne) — zgodne z Operatorem |

Łącznie po trzech etapach kontroli: EV6, Q2, Q3, Q4, Q5, Q6 oraz E1, E2, E3, E5 zmierzone niezależnie co najmniej dwukrotnie lub przez FC; Q1, Q7, Q8 tylko u Operatora. Kryterium 2 (EV6 FAIL + ≥ 4 mutanty kolejności zabite) spełnione z zapasem.

## 4. Orzeczenia dla każdego zarzutu / uwagi

| # | zarzut | orzeczenie | uzasadnienie |
|---|---|---|---|
| E-1 | przesłanka „EV6 przeżywa lib” nieaktualna na bazie (istniejący test już go zabija) | ODDAL | Fakt potwierdzony (EV6 LIB EXIT 101). Nie wpływa na kod ani kryteria; korekta zapisu E-2 #400 w `REJESTR-RUST.md` to czynność orkiestratora przy integracji (brzmienie zaproponowane w Obronie §2). |
| E-2 | EV6/E3 dają 0 rozbieżności w 74 wektorach | ODDAL | Kryterium 2 wymaga FAIL EV6 i zmierzonej liczby rozbieżnych przypadków — jest (FAIL lib, 0 wektorów, zmierzone trzykrotnie). Wyjaśnienie strukturalne (zegar z `due` 380 odpala pierwszy w `_drainTimers`, więc wpisu osi z `ord ∈ [t0+380, t0+384)` jeszcze nie ma) jest spójne z tekstem pinu; wektor rozróżniający wymagałby ścieżki spoza pinu (D-406-1/2). Jawne NIE_ZMIERZONO. |
| E-3 | bliźniak 8 ms to równoważność modelu | ODDAL | Wzorzec D-PIN2-2 (#401/#412); empirycznie 37/37 bitew 8 ms bajt w bajt w moim pełnym teście. |
| E-4 | 43/86 klatek pary obserwowalnych bezpośrednio | ODDAL | Test porównuje cały strumień i wynik; czułość zmierzona (Q2/Q3/Q6 = 5/7/12 rozbieżnych wektorów). |
| E-5 | D-406-OP-1 (czas rzeczywisty zamiast `skip`) — wpis do rejestru | ODDAL | Decyzja techniczna w zakresie Operatora, uzasadniona długiem PRE-SKIP-RAF (#405); wpis do `REJESTR-RUST.md` przy integracji (orkiestrator). |
| E-6 | kamień (E2) zabijany tylko nowymi wektorami | ODDAL | Wartość dodana, nie brak. |
| FC-1 (własna) | asercja pokrycia par to `p > 0`, nie dokładnie 41/45 | ODDAL | Liczby par pochodzą z zamrożonego pliku (MD5 stały, `pinSha256` sprawdzany); zmiana pliku i tak zmienia strumień porównywany bajt w bajt. Uwaga kosmetyczna. |

Brak orzeczeń NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA (temat czysto techniczny, gameplay = pin).

## 5. Kryteria końca dispatchu

1. Wektor z pinu z parami (41 przy 16 ms, 45 przy 8 ms), test bajt w bajt, czasy 384/704 zamrożone — SPEŁNIONE (test zielony u FC).
2. EV6 FAIL (lib; 0 rozbieżnych wektorów), ≥ 4 mutanty kolejności zabite (Q2, Q3, Q4, Q5, Q6) — SPEŁNIONE.
3. Istniejące wektory bez zmian treści, pełny `cargo test` engine 4372/0/1 — SPEŁNIONE.
4. Raport z liczbami i NIE_ZMIERZONO — SPEŁNIONE (Operator §3/§6, Obrona §3).

## 6. NIE_ZMIERZONO (Final Control)

- Pełna regeneracja wektorów (zmierzone łącznie 11/74 przez Evaluatora i Obronę; FC nie regenerował).
- Mutanty Q1, Q7, Q8 (wyłącznie wynik Operatora).
- Wektor, w którym EV6/E3 zmienia wynik (strukturalnie nieosiągalny w pinie).
- Pary przy `speedMul` > 1 i przy zmianie prędkości w trakcie bitwy; tryb `skip` z czasem bezwzględnym (#405).
- Bramki client/renderer (niezmienione).

## 7. Dla orkiestratora (integracja)

1. Kod do integracji: `79c722678` (raporty do `7c2a5a7fb` + ten raport). Bez konfliktu z bazą (dziecko `81bf861d2`).
2. `REJESTR-RUST.md`: korekta zapisu E-2 #400 (E-1) i decyzja D-406-OP-1 (E-5).

## Werdykt

**PASS-WITH-NOTES** — wszystkie zarzuty ODDAL, brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.
