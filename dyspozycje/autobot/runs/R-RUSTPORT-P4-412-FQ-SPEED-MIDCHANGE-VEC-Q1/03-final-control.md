# R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1
GOAL: zamrozić w repo wektory pinu `07d2fbd72` dla zmiany prędkości bitwy W TRAKCIE walki i pilnować ich testem silnika bajt w bajt oraz kontrolą czułości (mutanty).
ZMIANY/COMMIT: oceniany kod = czubek Obrony `10ed890c0` (lokalna gałąź `obrona-412`; łańcuch `2195249c6` → `0d57d83dd` → `bf6c3dbf1` → `fb64cd745` → `10ed890c0`). BAZA dispatchu `3f98dd284229f975e373b9c3be7a0d28232089d3` jest przodkiem (`merge-base --is-ancestor` OK). Raport Evaluatora `02-evaluator.md` leży na `origin/rust-port-wip/412-fq-speed-midchange-vec-q1-eval` (`0d37adc5f`, dziecko `bf6c3dbf1`), NIE w łańcuchu Obrony — przy integracji dołączyć go (plik tylko raportowy, bez konfliktu). FC dodaje wyłącznie ten raport.
TESTY: odtworzone przez FC na `10ed890c0` (§2): fmt EXIT 0, clippy EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 — 558 binarek, 4354 passed / 0 failed / 1 ignored.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge `10ed890c0` + `02-evaluator.md` + ten raport na `rust-port/parity-v2`), wpis w `REJESTR-RUST.md` (§5), start #413 FQ-SPEED-MIDCHANGE-DIV.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Allowlista i zakazy (sprawdzone samodzielnie)

`git diff --numstat 3f98dd284..10ed890c0` — 5 plików, wyłącznie dopisane linie (0 usuniętych):

| Plik | +/− | Allowlista |
|---|---|---|
| `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` | +209/0 | tak (rozszerzenie) |
| `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` | +518/0 | tak |
| `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_change_vectors.json` | nowy, 172 339 B | tak |
| `01-operator-r1.md`, `02a-obrona.md` | raporty | tak |

- MD5: `speed_vectors.json` `d764f078f08aa5df274e3f74d09df14b` (bez zmian), `vectors.json` `9ceefda1…`, `pin_data.json` `432eed76…` (bez zmian), `speed_change_vectors.json` `a374deaea878eca21ff4166817fb03a9` (= raporty).
- Brak zmian kodu produkcyjnego (D-412-2), brak `gra/`, brak `#[ignore]`, brak usuniętych asercji (0 linii usuniętych w diffie), opisy commitów bez nazwy modelu (tylko `Claude-Session:`).

## 2. Bramki (engine, D-412-3) — odtworzone przez FC

Env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach), jeden build, wolne 12 GB przed / 14 GB po; brak procesów cargo po zakończeniu.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, log) | EXIT 0; 558 `test result`, **4354 passed / 0 failed / 1 ignored** |
| `wektory_pinu_pelnej_bitwy_bajt_w_bajt` (vectors.json), `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (288) | ok — brak regresji (kryt. 3) |
| `zmiana_predkosci_w_trakcie_bitwy_wektory_pinu_bajt_w_bajt`, `zmiana_predkosci_w_trakcie_mutanty_sterownika_daja_fail` | ok |

Client/renderer: nie dotyczy (D-412-3, brak zmian).

## 3. Kryteria końca

1. **Wektory zmiany w trakcie, ≥ 24 przypadki, generowane pinem, test bajt w bajt** — SPEŁNIONE: 40 przypadków w pliku, 31 zgodnych bajt w bajt (≥ 24 asertowane w teście), chwile: pocisk w locie 15, tuż przed trafieniem 16, krok ruchu 6, wypad 1; generator wykonuje tekst pinu ze strażnikiem SHA-256; Evaluator odtworzył 4/4 wektorów, Obrona 4/4 przez ścieżkę shardów + scalania. 9 przypadków jawnie rozbieżnych (lista `ROZBIEZNE_FQ_SPEED_MIDCHANGE`) — zgodnie z D-412-2 niepoprawiane, zgłoszone jako #413.
2. **Czułość** — SPEŁNIONE: Skip 31/31; 8 mutantów zabitych (SkipLater 6, Late 31, Early 29, WrongSpeed 31, OldGrid 21, NewGridOldClock 31, Grid16 19), test pada, gdy któryś przeżyje.
3. **Brak regresji istniejących wektorów** — SPEŁNIONE dla vectors.json i 288 speed (pełny test). c1 128/128 @1/@16 — NIE_ZMIERZONO (kandydaci c1 nie istnieją w repo); kod produkcyjny bez zmian, więc wynik #407 obowiązuje.
4. **Raport z liczbami i poprawką 288 vs 351** — SPEŁNIONE; FC potwierdza `python3`: `speed_vectors.json` = 288 wektorów.

## 4. Orzeczenia o zarzutach

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z1 | Lista rozbieżności maskuje regresję przed zmianą (Evaluator 7.1) | ODDAL (naprawione w `fb64cd745`) | Strażnik `przed_pierwsza_zmiana` + wbudowana kontrola czułości (`straz_sprawdzona`); FC przejrzał kod: asercje `przed_zmiana.is_empty()`, `zgodne_z_listy.is_empty()`, `n_listed == 9` są twarde; test przechodzi w pełnej bramce. Ograniczenie (7/9 pozycji bez zdarzeń przed zmianą — sprawdzana tylko chwila zmiany) jawnie opisane. |
| Z2 | 9/40 rozbieżności realne; „32/32” za szerokie (Evaluator 5, 7) | ODDAL (w tym temacie) | D-412-2 zabrania naprawy tutaj; rozbieżności udowodnione jako po pierwszej zmianie (9/9, Evaluator §5); temat #413 już w kolejce. Wymaga wpisu w rejestrze (§5). |
| Z3 | Pokrycie wypadu wręcz w zgodnych = 1 (Evaluator 7.2) | ODDAL | Wymóg „tuż przed trafieniem” spełnia `preHit` 16; zmiana tuż przed ciosem wręcz to dokładnie klasa L z #413 — kolejne wektory dałyby tylko kolejne pozycje listy. |
| Z4 | c1 128/128 NIE_ZMIERZONO; zamrożono inny zbiór niż #407 (Evaluator 7.3, 7.5) | ODDAL | Brak zmian produkcyjnych; dispatch wymaga ≥ 24 różnych przypadków, nie dosłownej kopii c1. Do odnotowania w rejestrze. |
| Z5 | Czas nowych testów ~300 s debug (Evaluator 7.4) | ODDAL | Pełna bramka i tak w tle; skrócenie osłabiłoby kryteria 1–2. |
| Z6 | (FC) Liczba zmian w raporcie Operatora: „42 zmian ogółem w pliku” | ODDAL (korekta liczby w tym raporcie, bez zmian kodu) | FC zmierzył `python3`: plik ma **56 zmian** prędkości w 40 przypadkach; **42** z nich w 31 zgodnych przypadkach, 14 w 9 rozbieżnych. Liczba 42 w wydruku testu dotyczy wyłącznie zgodnych. Pary prędkości w pliku 18 (raport), w zgodnych ≥ 6 (asercja). Błąd wyłącznie opisowy — orkiestrator w rejestrze używa 56 / 42. |

Brak orzeczeń NAPRAW; brak DO DECYZJI CZŁOWIEKA (rozbieżności 9/40 to parytet z pinem = naprawa wg webu w #413, nie decyzja gameplay).

## 5. Do rejestru (wpis robi orkiestrator)

- `speed_vectors.json` = **288** wektorów (32 × 9), nie 351.
- Nowy `speed_change_vectors.json`: 40 przypadków, 56 zmian (42 w zgodnych), **31 zgodnych bajt w bajt, 9 jawnie rozbieżnych** (`ROZBIEZNE_FQ_SPEED_MIDCHANGE`), 18 par prędkości, 22 tury zmiany w zgodnych, 3301 zdarzeń pinu; mutanty 8/8 zabite (Skip 31/31).
- Pomiar #407 (32/32) dotyczył tylko zmian `{round}` na c1 — zmiana w trakcie NIE jest w pełni zgodna z pinem; dług = #413 FQ-SPEED-MIDCHANGE-DIV (kryterium końca: lista pusta; klasa L `siege_tactics_loop.rs:3196`).
- c1 128/128 @1/@16 w #412 — NIE_ZMIERZONO.

## 6. Werdykt

**PASS-WITH-NOTES.** Bramki odtworzone przez FC z EXIT 0 (fmt, clippy, pełny engine 4354/0/1), allowlista czysta, kod produkcyjny bez zmian, kryteria 1–4 spełnione; wszystkie zarzuty ODDAL. Uwagi: liczba zmian 56/42 (Z6), raport Evaluatora do dołączenia z gałęzi `-eval` przy integracji, rozbieżności 9/40 → #413.
