STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-AUTO-WEKTORY-V1V5V6-Q1 (K5-LOOP-AUTO-WEKTORY, V1/V5/V6)
GOAL: Wektory pinu 07d2fbd72 dla faz AUTO (V1 kolejność faz, V5 _finishAutoBatchPhase, V6 _haltAutoBattleTurn); mutacje (a)(b)(c) muszą dać FAIL.
ZMIANY/COMMIT: kod i wektory 8bd36fbee, raport Operatora 10e2a1957 (oba potomkowie bazy 75de326bc: `git merge-base --is-ancestor` OK). `git diff --stat 75de326bc 10e2a1957`: wyłącznie allowlista (01-operator.md, p6_k5loop_auto_gen.mjs, p6_k5loop_auto_v1v5v6.rs, p6_k5loop_auto_vectors/{vectors.json,SHA256SUMS}); zero zmian w src portu i w gra/. `git diff --check`: czysto. Cargo.lock nie w commicie. Zakres = V1, V5, V6 (bez V2 i V7-V14). Brak #[ignore] w nowym teście (jedyny ignore w całym drzewie: e2e::dump_tick1_econ_for_web_generator, wcześniejszy).

TESTY (zmierzone przeze mnie na 10e2a1957, CARGO_TARGET_DIR w scratchpadzie, df przed bramką 11 GB):
- cargo test --test p6_k5loop_auto_v1v5v6: 16 passed, 0 failed, 0 ignored.
- cargo fmt --check: EXIT 0.
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo test --all-targets --no-fail-fast (pełny, w tle): FULL_EXIT=0; 502 wyników suite, 3712 passed, 0 failed, 1 ignored (wcześniejszy). Obejmuje p6_8i_pick.
- Weryfikacja kodu z pinem: ciała _finishAutoBatchPhase (battleScene.ts:5961-5973), _beginAutoBatchTurnFromCurrentState (:5696-5704), _beginAutoBatchPhase (:5707-5745), _haltAutoBattleTurn (:17333-17344) odczytane `git show 07d2fbd72:gra/src/battle/battleScene.ts` i zgodne z portem w siege_tactics_autobatch.rs; wektory generowane przez wykonanie ciał pinu (nie przepisywanie).

ZARZUTY EVALUATORA (rozstrzygnięcie):
1. Mutacja (d) przeżyła (usunięcie filtra acted/fading/removed przy budowie listy obrońców w finish_auto_batch_phase, pin :5964) -> POTWIERDZONE przeze mnie (mutacja zastosowana, 16/16 PASS, src przywrócony, git diff src pusty). Przyczyna: w teście Rust pole begin_phase_calls.ids jest wyprowadzane z `st.resolutions`, a nie z listy jednostek przekazanej do begin_auto_batch_phase, więc filtr (nadmiarowy wobec filtrów w snapshot/resolve_auto_batch_phase) nie jest obserwowalny. Generator pinu zapisuje ids z argumentu `units` (gen.mjs:163). Klasyfikacja: ODDAL (niska waga, luka czułości poza mutacjami (a)(b)(c) wymaganymi w dispatchu; zachowanie wynikowe portu zgodne z pinem). Poprawka niskiego kosztu do zleceń przy V2/V7-V14: rejestrować w VecEnv::plan_unit id jednostek przekazanych do planowania i porównywać z ids z pinu.
2. Pełny cargo test EXIT 0 NIE_ZMIERZONO (wg Operatora/Evaluatora) -> ZAMKNIĘTE: zmierzone przeze mnie, EXIT 0. p6_8i_pick/pick_auto_improvements_matches_pinned_web_vectors NIE zawisł: przeszedł w 307 s (test wolny, nie zawieszony; przerwanie u Operatora było przedwczesne). Nie jest regresją tego tematu.

MUTACJE: (a)(b)(c) wg raportu Operatora i Evaluatora (dwa niezależne pomiary: FAIL v1a,v1c / FAIL v5c / FAIL v6a,v6b); (d) wykonana przeze mnie: PRZEŻYŁA (zarzut 1). Dodatkowe mutacje Evaluatora (halt bez token++, finish bez guardu tokenu, usunięty filtr w begin_from_state) dały FAIL.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja 8bd36fbee + raport (potomek 75de326bc) na parity przez orkiestratora; V2 i V7-V14 po zdjęciu blokad (#296); opcjonalnie wzmocnienie obserwacji ids (zarzut 1).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny FC, bez push do parity).
