# R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 — Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 (#404, krok T3)
GOAL: `_performPlayerOrder` `hold`/`none`/`move` (pin `07d2fbd72` `battleScene.ts:18280-18353`), `_firstStepTowardMoveDestination` (`:18478-18527`) i rozkaz ruchu doktryny `skirmish` wykonywany w pętli bitwy zamiast tagu `doktryna-rozkaz-ruchu`.
ZMIANY/COMMIT: oceniany stan = `df4d48801` (gałąź `rust-port-wip/404-move-order-obrona`; kod Operatora `474d6f855` + Obrona `37f8fbc09`); baza `origin/rust-port/parity-v2` = `6793a7da4` (`merge-base --is-ancestor` = TAK). Final Control dodaje wyłącznie ten raport (gałąź `fc/R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1`).
TESTY: §2 (odtworzone samodzielnie).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF `parity-v2` do commitu FC), wpis D-404-OP-1 do `REJESTR-RUST.md`, mapa kroków T4/T5/H3/H4 z wymaganiami z §4.
DEPLOY/PUSH: NIE WYKONANO

## 1. Zakres i allowlista (sprawdzone na `git diff --name-status 6793a7da4 df4d48801`)

- W allowliście: `player_order_move.rs` (nowy), `mod.rs` (+1), `siege_tactics_loop.rs`, `tests/p4_404_move_order.rs` (nowy), `tests/p6_k5loop_wiring_a_pin.rs` (dopisek), `tests/p6_k5loop_wiring_a_gen.mjs` (dopisek, strażnik SHA-256 `3eeeb760…` bez zmian), 2 NOWE pliki wektorów, raporty runu.
- Spoza allowlisty: `siege_battle_session.rs` +3 linie (`body.move_order_exec = true;` + komentarz) — uzasadnione (bez tego tag nie znika w sesji produkcyjnej; wzorzec `march_incremental`). Akceptuję.
- Istniejące pliki wektorów: nietknięte (w katalogu wektorów tylko 2 pliki `A`).
- Brak nowych `#[ignore]`, `git diff --check` czysty, brak zmian w `gra/`, kliencie, rendererze, kontrakcie mostu. W commitach brak nazw modeli (tylko `Claude-Session:`).

## 2. Bramki odtworzone (CARGO_TARGET_DIR w scratchpadzie, CARGO_INCREMENTAL=0, debug=0; target usunięty)

| bramka | wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| pełny `cargo test --all-targets --no-fail-fast` (engine, w tle) | EXIT 0 — **4378 passed, 0 failed, 1 ignored** (zgodne z Obroną; ignored sprzed tematu) |
| regeneracja `move_order_step_vectors.json` (`WIRING_A_MOVE_ORDER_STEPS=1`, wykonanie tekstu pinu) | MD5 `8f2c1cbee02088696f16c5659415411c` = plik w repo (bajt w bajt) |
| regeneracja 2 bitew INNYCH niż próbka Evaluatora (`mo_las_mury_baszta`, `mo_palisada_jazda4`; obie z wyłomem, zdarzeniami i krokami BFS) | identyczne z `move_order_vectors.json` (JSON kanoniczny). Łącznie niezależnie zweryfikowane 5/32 bitew (Evaluator 3 + FC 2) |
| renderer / client | nie dotyczy (D-404-4) |

Odczyt pinu (`git show 07d2fbd72:gra/src/battle/battleScene.ts`): `:18278-18353`, `:18476-18527`, `:18060-18124`, `:6060-6100`, `:17621-17630`. `move_order_step` i `first_step_toward_move_destination` odpowiadają tekstowi pinu (kolejność testów pola BFS, `head < maxVisited`, `firstStepByKey ?? nextKey`, `allowFirstStep` tylko dla sąsiadów startu, bramka zwarcia przed `nc === tc`, potem blokada, `previousPosition` tylko przy uniku cofania). Zerowanie `playerOrder` na starcie aktywacji AUTO (`:6093`) potwierdza model ciała (`ProdOps::player_order = None`).

## 3. Mutanty Final Control (własne, `p4_404_move_order`; źródło przywrócone, MD5 = HEAD)

| # | mutant | wynik |
|---|---|---|
| F1 | `prev` zawsze `Some(pos)` (zapis `lastAutoMoveFrom` bez `_shouldAvoidAutoBacktrack`) | ZABITY |
| F2 | `allowFirstStep` na każdym poziomie BFS | ZABITY |
| F3 | gałąź `none` ignoruje `meta.doctrine !== 'manual'` | PRZEŻYŁ — **równoważny**: `_isUnitDoctrineAuto` (`:17622-17623`) zwraca `false` dla `manual`, więc test `!== 'manual'` po nim jest w pinie nadmiarowy (port `is_unit_doctrine_auto` identycznie) |
| F4 | `order_done` zawsze `false` | ZABITY |

Razem z 16 mutantami Operatora, 14 Evaluatora (+E02, E06 zabite w Obronie) kryterium 3 spełnione.

## 4. Orzeczenia zarzutów

| zarzut | orzeczenie | uzasadnienie |
|---|---|---|
| N-E1 granice BFS (E02 przeżywał) | **ODDAL** (domknięte w Obronie) | Obrona dodała 240+240 przypadków krawędzi z pinu (scena bez ogrodzenia); E02 zabity; prefiks starych przypadków bajt w bajt; MD5 potwierdzony przeze mnie regeneracją. Ustalenie o `_fencePlayableZone` (gra nigdy nie dochodzi do krawędzi) — zgodne z tekstem pinu. |
| N-E2 `siege_manual` bezwarunkowo | **ODDAL** (domknięte w Obronie) | parametr = wynik `_performSiegeManualOrder`, test kontraktu, E06 zabity; wymaganie dla H3 zapisane. Brak wołającego produkcyjnego. |
| N-E3 bitwy pokrywają tylko krok zachłanny prosty + BFS | **ODDAL** (jako zarzut wobec T3) | w AUTO rozkaz ruchu wydaje wyłącznie `skirmish` (`:18087-18124`): sąsiedni wróg sprawdzony wcześniej, `skirmish ≠ steady`, blokada AUTO nieaktywna. Pozostałe klasy kryterium 1 pokryte wektorami kroku wykonanymi z pinu (1140 przypadków). Wymaganie dla T5/H4: wektory bitew z rozkazem gracza. |
| N-E4 ścieżka atomowa ciała bez wołającego; jazda na `niedostepne` | **ODDAL** (dług jawny) | ścieżka atomowa ma to samo uzasadnienie co istniejący przełącznik `march_incremental`; nie wpływa na produkcję. Do decyzji przy T5/H4 (usunąć albo pokryć) + scena z terenem niedostępnym dla jazdy. |
| N-E5 brak sekcji „Pliki spoza allowlisty” | **ODDAL** (domknięte w Obronie) | tabela w `02a-obrona.md`. D-404-OP-1 do wpisu orkiestratora w `REJESTR-RUST.md`. |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0 (wszystkie sprawy techniczne, bez odstępstw gameplay od webu).

## 5. NIE_ZMIERZONO

- Niezależna regeneracja 27/32 bitew (zweryfikowane 5/32: Evaluator 3, FC 2 — wszystkie zgodne).
- Teren `NIEDOSTEPNE` dla jazdy w scenach kroku (N-E4).
- Client, renderer (nie zmieniane).
- Mutanty Operatora nie powtarzane przez FC.

## 6. Werdykt

PASS-WITH-NOTES: bramki zielone (fmt 0, clippy 0, pełny test 4378/0/1), wektory = wykonanie tekstu pinu (kroki bajt w bajt, bitwy 5/32 niezależnie), allowlista dotrzymana (jeden plik spoza z uzasadnieniem), wszystkie zarzuty oddalone, brak NAPRAW. Uwagi do mapy kolejnych kroków: H3 (wynik `_performSiegeManualOrder` ⇒ gałąź `none`), T5/H4 (wektory bitew z rozkazem gracza, decyzja o ścieżce atomowej, jazda na terenie niedostępnym), rejestr D-404-OP-1.
