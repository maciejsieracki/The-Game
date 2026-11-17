STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T5B-MARSZ
GOAL: Obrona operatora (Haiku) na zarzuty Evaluatora z rundy 1; poprawki dokumentacyjne/adnotacyjne bez zmiany logiki portu; bramki cargo pozostają NIE_ZMIERZONO (dysk).
ZMIANY/COMMIT: baza 625624d97; commit obrony (detached, na bazie commitu operatora 2701a2065) — SHA w sekcji „Podsumowanie SHA” poniżej. Zmienione pliki: rust-port/engine/src/domain/siege_tactics_ranged_forward.rs (+6 linii komentarza), rust-port/engine/tests/p6_k5doc_t5b.rs (+6 linii komentarza), dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5B-MARSZ/02a-obrona.md. Logika, wektory i Cargo.lock NIETKNIĘTE.
TESTY: NIE_ZMIERZONO w tej rundzie — `df -h /` = 4.8 GB wolne (wymagane >= 8 GB). Brak nowych EXIT 0. Ostatni pomiar operatora (r1): fmt/clippy/test NIE_ZMIERZONO. Komentarze są jedyną zmianą; nie zmieniają kodu, więc nie unieważniają wcześniejszych wyników, ale nie są też zmierzone cargo.
BLOKADY: dysk < 8 GB (patrz zarzut 1); mutacje Rust NIE_ZMIERZONO (zarzut 2).
RUNDY: 1/5 (obrona w ramach rundy 1); kolejna runda wymagana: DODATEK r2 z bazą 625624d97 po zwolnieniu dysku przez orkiestratora.
NASTĘPNY KROK: orkiestrator zwalnia dysk do >= 8 GB (nie usuwałem cudzych targetów); potem DODATEK r2: bramki cargo fmt/clippy/test i mutacje (a), (b), (d) na Rust z oczekiwanym FAIL, przywrócenie, i (c) z dowodem równoważności.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (INFRA, blokujący): bramki cargo nieodtworzone — PRZYJMUJĘ (nie do naprawienia w tej rundzie)
Dowód: `df -h /` przed bramką = 4.8 GB wolne (wcześniej 5.0 GB), poniżej 8 GB z dispatchu. Nie uruchamiałem cargo na pół, zgodnie z dispatchem. Nie usuwałem targetów innych sesji (zasada: nie ruszać działających). Wymagana runda DODATEK r2 z bazą 625624d97 po zwolnieniu dysku przez orkiestratora.

### Zarzut 2 (mutacje a, b, d tylko na transkrypcji JS, nie na Rust) — PRZYJMUJĘ
Dowód: w tej rundzie nie zmierzono mutacji na module Rust (wymaga cargo, patrz zarzut 1). Wyniki JS z r1 (a: 67/621 FAIL, b: 1/621 FAIL, d: 1/621 FAIL) są tylko wynikiem transkrypcji i nie zastępują mutacji Rust. Zaplanowane na DODATEK r2: zmiana w siege_tactics_ranged_forward.rs, `cargo test p6_k5doc_t5b` z oczekiwanym FAIL, przywrócenie i sprawdzenie hash.

### Zarzut 3 (mutant b słabo testowany, prośba o adnotację) — PRZYJMUJĘ (zrobione)
Dowód: dodano w `rust-port/engine/tests/p6_k5doc_t5b.rs` (przy `best_granica_nc_ge_bf_cols_odrzuca_e`) blok „MOC TESTU”. Argument równoważności (sprawdzony ręcznie na pinie `:6822-6893`): mutant `nc > BF_COLS` różni się od pina tylko dla `me.q == BF_COLS-1` (BF_COLS = 68) i kandydata E `nc == BF_COLS`. Dla wroga na planszy (`nearest.q <= 67`) kandydat E ma `forwardGain = (me.q - nq) - (68 - nq) = -1` i `rowGap = 0`, więc jest odrzucany w obu wersjach (równoważny). Zabijany tylko wektorem z wrogiem poza planszą (`nearest.q = 69`, `forwardGain = +1`). Adnotacja jawnie przyjmuje słabą moc testu.

### Zarzut 4 (nieprzeczytany _siegeMachineRange i gałąź APPROACH) — PRZYJMUJĘ (lektura wykonana, dowód poniżej)
Lektura pinu `07d2fbd72:gra/src/battle/battleScene.ts`:
- `_rangedAction` gałąź 3 „APPROACH” (`:6735-6738`, komentarz `:6675`) wola `this._rangedForwardStep(ru, done)` (`:6738`). APPROACH = `_rangedForwardStep`, czyli dokładnie to, co portuje T5b. Wylaczenie APPROACH z portu nie zachodzi — zakres jest zgodny z pinem.
- `_rangedApproachStep` (`:7257-7283`) NIE ma zewnętrznego wołającego: `git show ... | grep -n _rangedApproachStep` daje tylko definicję (`:7257`) i rekurencję (`:7283`). Jest martwa dla ścieżki strzelca i nie wchodzi do zakresu. Udokumentowane w nagłówku modułu.
- `_siegeMachineRange` (`:7530-7534`) wołana tylko z katapultowej ścieżki (`:6200`). Nie jest wołana z `_rangedForwardStep` ani `_bestForwardStep` (potwierdzone grep). Czyta stan gry (`_attackRangeFor`, `_isCatapult`, bonusy cywilizacji), więc wg dispatchu NIE PORTOWANA (poza modułem). Udokumentowane w nagłówku modułu.

### Zarzut 5 (drobne: klucz kroku zwracany przed bramką lineAllowsRangedStep) — PRZYJMUJĘ jako udokumentowane
Zgodne z dispatchem (wpięcie w T8). Nagłówek modułu już to opisuje (`ranged_forward_step_key` zwraca klucz PRZED `lineAllowsRangedStep` `:6791-6798` i PRZED `_doMove` `:6800`). Bez zmiany kodu.

### Sprawdzone bez zarzutów (potwierdzone przez obronę)
Brak zmian poza allowlistą w commitcie operatora (6 plików, brak gra/, brak Cargo.lock) — potwierdzone `git show --stat 2701a2065`. Brak `#[ignore]` i `should_panic`. Commit 2701a2065 ma parent 625624d97 (baza zgodna z dispatchem).

## Podsumowanie SHA
- Baza: 625624d97
- Commit operatora (r1): 2701a2065
- Commit obrony (r1, adnotacje): podany w odpowiedzi orkiestratora po `git rev-parse HEAD` w worktree wf_5291e068-ccd-3 (detached). Brak push, brak integracji.
