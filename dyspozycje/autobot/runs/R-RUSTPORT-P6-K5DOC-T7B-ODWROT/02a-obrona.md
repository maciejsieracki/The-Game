STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T7B-ODWROT
GOAL: Obrona Operatora (Haiku) na zarzuty Evaluatora z commitu 82a744d28: zarzut 1 (mutant granicy dMin <= 1) i zarzut 2 (mutant galezi finished w fall_back_after_move) przyjete, z poprawka wektorow i dowodem na pinie.
ZMIANY/COMMIT: baza 4d9fc8917 (runda r4). Zmienione pliki: rust-port/engine/tests/p6_k5doc_t7b_gen.mjs, rust-port/engine/tests/p6_k5doc_t7b.rs, rust-port/engine/tests/p6_k5doc_t7b_vectors/vectors.json (regenerowany), dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T7B-ODWROT/02a-obrona.md. Kod produkcyjny siege_tactics_fallback.rs bez zmian. Commit: SHA podany w odpowiedzi orkiestratora (git log -1 na galezi roboczej).
TESTY: generator (node tests/p6_k5doc_t7b_gen.mjs) EXIT 0: 426 przypadkow (bylo 424); straznik `want` wykonany przez pin dla obu nowych przypadkow. rustfmt --check tests/p6_k5doc_t7b.rs EXIT 0. cargo fmt/clippy/test: NIE_ZMIERZONO (df / = 6,1 GB < 8 GB, wg dispatchu BLOCK przed bramka; bramki musi odtworzyc Final Control po zebraniu wolnego miejsca).

## Odpowiedzi na zarzuty

1. Zarzut: przezyty mutant granicy `dMin <= 1` -> `< 1` (test p6_k5doc_t7b przechodzi).
   WERDYKT: PRZYJMUJE. Zarzut jest sluszny: w starych wektorach zaden kandydat nie mial dMin == 1 przy dNow <= 1, wiec warunek `<= 1` nie byl rozrozniany od `< 1`.
   POPRAWKA: nowy przypadek nazwany `dmin_le_1_przy_sasiedztwie_wroga` w p6_k5doc_t7b_gen.mjs. Jednostka (10,10) atk->def (is_atk=false), wrogowie (10,11) i (10,8), nearest (10,11), zajete (11,10) i (10,11). Kandydat N (10,9) ma dMin=1 (wrog (10,8)) i dNow=1. Pin odrzuca N przez `dMin <= 1`; wynik = W (9,10), dMin=2, score 902. Mutant `< 1` przepuszcza N (score 1001) i wybralby N.
   DOWOD (wykonanie pina, nie reka): mutant d_dmin_lt1 podany do generatora (kopia ze zmienionym tekstem pina, zrodlo w scratchpadzie) -> wyjscie EXIT != 0: `pin != oczekiwany (nazwany dmin_le_1_przy_sasiedztwie_wroga): pin=best [10,9] want=[9,10]`. Oryginalny pin daje [9,10], zgodnie z wartoscia nazwana.
   W Rust: test p6_k5doc_t7b porownuje best_fall_back_step z tym przypadkiem; mutant `d_min < 1.0` dalej daje Some(N) != Some(W), czyli FAIL. (Dowod Rust nie wykonany, patrz TESTY.)

2. Zarzut: przezyty mutant galezi `finished` w `fall_back_after_move` (usuniecie `if finished { Done }`).
   WERDYKT: PRZYJMUJE. Pole `finished` wektora bylo jednoczesnie guardem poczatkowym i stanem po ruchu, wiec `fall_back_after_move(true, >0)` nigdy nie bylo testowane. Pin ma osobny stan: callback `_doMove` (battleScene.ts:7239) czyta `this.finished` PO efektach ruchu.
   POPRAWKA:
   - gen: nowe pole wejsciowe `finished_after` (domyslnie false; wektory losowe dostaja `finished_after: false` bez zmiany sekwencji RNG). Stub `_doMove` w klasie pina ustawia `this.finished = this.finishedAfter` przed `cb()`, czyli dokladnie tyle, ile robi pin po ruchu.
   - nowy przypadek `finished_po_ruchu_done_bez_schedule`: finished=false, finished_after=true, move_left_after=5 -> pin: moves [[10,9]], scheduled null, done_calls 1.
   - Rust (p6_k5doc_t7b.rs): pole `#[serde(default)] finished_after: bool`; wywolanie `fall_back_after_move(c.input.finished_after, c.input.move_left_after)` zamiast `c.input.finished`. Guard `fall_back_step_decide` nadal dostaje `c.input.finished`.
   - lista nazwanych przypadkow w testach pokrycia rozszerzona o oba nowe nazwy.
   DOWOD: mutant e_no_finished_cb (usuniety guard w callbacku `_doMove` w tekscie pina) -> generator EXIT != 0: `pin != oczekiwany (nazwany finished_po_ruchu_done_bez_schedule): pin=scheduled_ms 70, done_calls 0; want=scheduled null, done_calls 1`.
   W Rust mutant `if finished { Done }` w fall_back_after_move daje Schedule{70} dla (finished_after=true, move_left_after=5), wiec assert `after == AfterStep::Done` pada: FAIL (wykonanie Rust nie zrealizowane, patrz TESTY).

3. Noty nieblokujace z FC r3 (a) nearest==None przy niepustej liscie wrogow, (b) brak wektorow pola nearest z pina, (c) filtr routed z _enemiesOf nieobjety wektorami.
   WERDYKT: ODRZUCAM jako zarzut do poprawki w tej rundzie (sa notami, nie zarzutami blokujacymi wg FC r3 i dispatchu). Stan: (a) wejscie nearest=None przy niepustej liscie jest dopuszczone przez gen jako przypadek `najblizszy_null_przy_niepustych_wrogach` (wynik zgodny z pinem); produkcyjna osiagalnosc zalezy od producenta W8/ProdBody i jest odnotowana jako zaleznosc. (b) pole nearest jest wejsciem sceny, nie wynikiem pina; zostaje do rejestru. (c) filtr routed nalezy do producenta wejsc enemies; odnotowany jako zaleznosc, bez zmiany wektorow.

## Mutacje (pin-level, wszystkie 5, wynik generatora)
- a `dMin < dNow` -> `<=`: FAIL (mutacja_a_dmin_rowne_dnow_przyjety)
- b `score > bestScore` -> `>=`: FAIL (zajete_pole_odrzucone; pin=[10,11] zamiast [10,9])
- c homeBias odwrocony: FAIL (zajete_pole_odrzucone; pin=[11,10])
- d `dMin <= 1` -> `< 1`: FAIL (dmin_le_1_przy_sasiedztwie_wroga) - NOWE
- e usuniety guard finished w callbacku: FAIL (finished_po_ruchu_done_bez_schedule) - NOWE

## Dowod i ograniczenia
- Pliki z mutantami zyja w scratchpadzie poza repo; w repo nie ma zmian poza wymienionymi.
- Plik tymczasowy .pin_scene_tmp.ts usuniety z worktree przed commitem.
- Bramki cargo nie uruchomione (dysk 6,1 GB < 8 GB). To jest NIE_ZMIERZONO, nie PASS. Final Control ma je odtworzyc: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test p6_k5doc_t7b`, a po zwolnieniu dysku pelny test.

NASTEPNY KROK: Evaluator (Sonnet) odtwarza mutacje d i e w Rust oraz bramki cargo; Final Control po nim.
RUNDY: 4 (obrona w rundzie r4, zarzuty z FC rundy r4 w commicie 82a744d28).
BLOKADY: brak zmian w kodzie produkcyjnym; cargo NIE_ZMIERZONO (dysk).
DEPLOY/PUSH: NIE WYKONANO (push do rust-port/parity-v2 zabroniony dispatchem).
