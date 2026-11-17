STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T4C-DOMOVE (runda 1, Operator)
GOAL: Efekty STANU z `_doMove` (pin 07d2fbd72, battleScene.ts:8685-8776) w Rust: zajetosc occByKey, pozycja, koszt kroku [1,99], mnoznik brodu, moveLeft >= 0, galaz planowania (intent), wejscie facing; odmowa jako wejscie refused.
BAZA: origin/rust-port/parity-v2 = 417091872 (worktree detached). Pin tylko do odczytu.
ZMIANY/COMMIT: nowe pliki: rust-port/engine/src/domain/siege_tactics_move_effects.rs (MoveWorld, MoveUnit, MoveOutcome, do_move_effects); rust-port/engine/tests/p6_k5doc_t4c.rs; rust-port/engine/tests/p6_k5doc_t4c_gen.mjs; rust-port/engine/tests/p6_k5doc_t4c_vectors/vectors.json; zmiana: rust-port/engine/src/domain/mod.rs (jedna linia pub mod siege_tactics_move_effects;); ten raport. Commit: lokalna galaz, bez push (SHA w odpowiedzi Operatora).
TESTY:
- generator: node rust-port/engine/tests/p6_k5doc_t4c_gen.mjs -> OK: 314 przypadkow (odmowa=44, planowanie=150), wartosci z wykonania pina przez TypeScript; straznik wycinkow pina (brod 982-983, cellKey 1797, isFordTile 1897-1899, _doMove 8685-8776).
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --all-targets --no-fail-fast: EXIT 0, 3841 passed, 0 failed
- cargo test --test p6_k5doc_t4c: 14 passed (w tym vektory_pina_wszystkie_zgodne, 314 wektorow)
- MUTACJE (kazda cofnieta, plik przywrocony i porownany bajt-w-bajt):
  (a) brod: `/ BROD_RUCH_MULT` -> `* BROD_RUCH_MULT`: FAIL (4 testy: brod_na_starcie, brod_na_celu, planowanie_brod_i_clamp, vektory_pina; EXIT 101)
  (b) clamp dolny: `js_max(1.0, ...)` -> `js_max(0.0, ...)`: FAIL (3 testy: koszt_clamp_dolny, planowanie_brod_i_clamp, vektory_pina; EXIT 101)
  (c) usuniecie starego klucza occByKey pominiete: FAIL (12 testow, w tym zwykly_krok i zajetosc_sasiada; EXIT 101)
BLOKADY: brak. Facing (_updateFacing, #107) wchodzi jako wywolanie MoveWorld::update_facing, bez logiki. Animacja, busy, _raf, done() i ru.group/hpBarGroup poza zakresem; done() zwracane jako MoveOutcome.done (synchronicznie tylko dla galezi odmowy i planowania).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) r1 wg dispatchu; integracja orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji do parity-v2)

UWAGI:
1. Zakres wycinka pina: dispatch podaje _doMove 8685-8779; zakonczenie metody to linia 8776 (`  }`), 8777-8779 to inne metody. Uzyto 8685-8776.
2. Sygnatura MoveWorld::move_cost(col,row) zgodna z dispatchem. Web _moveCostForUnit zalezy od ru.mounted (mnoznik kawalerii, pin 7436-7445); port zaklada, ze implementacja swiata jest per jednostka. Decyzja techniczna do rejestru.
3. Odmowa: galaz refused zwraca bez wejscia do intent (zgodnie z pinem: tylko moveLeft=0 i done()).
4. Trailer commita: bez nazwy modelu (wg dispatchu), zachowano linie Claude-Session.
