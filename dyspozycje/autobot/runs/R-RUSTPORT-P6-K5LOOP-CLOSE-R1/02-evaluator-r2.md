# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — Evaluator (adwersarialny), runda 2

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk blokujących #113/I5; r2: C-FLANK (T4d), `_cavalryAction`, strzelec + odwrót, akcja `Move` (DODATEK r2, D-K5C-r2-1..4).
OCENIANY COMMIT: `ff9a7aaa6` (gałąź `rust-port-wip/k5loop-close-r2`), rodzic `0941c8225` = BAZA r2 z dispatchu (`git merge-base --is-ancestor 0941c8225 ff9a7aaa6` = OK).
WORKTREE EVALUATORA: `.claude/worktrees/wf_7d39535d-6c6-2`, gałąź `eval/k5loop-close-r2` = `ff9a7aaa6` + ten raport.

## Werdykt w skrócie
Bramki zielone i zgodne z raportem Operatora, wektory faktycznie z tekstu pinu i deterministyczne, allowlista dotrzymana.
**FAIL** z jednego powodu merytorycznego (Z1): w nowym kodzie `_cavalryAction` warunek pętli callbacku
`_doMove` odwraca semantykę JS dla `moveLeft = NaN`. Pin robi wtedy dokładnie 1 krok, Rust robi ich wiele,
a w części scenariuszy pętla się nie kończy (sonda: proces 99% CPU, ~6 GB RAM po 10 min; zabity).
Port r1 sam deklaruje parytet `NaN` („NaN przechodzi jak w JS”), a ścieżka piechoty (`advance_after_move`) robi to dobrze.
Poprawka jest jednowierszowa w dwóch miejscach, ale zawieszenie produkcyjnej pętli bitwy to rozbieżność z pinem, której nie można przepuścić do #113.

## Bramki (odtworzone samodzielnie)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad `tgt_eval_k5c_r2` (usunięty po bramkach). Dysk przed pełną bramką: 9,6 GB wolne (>= 8 GB); po sprzątnięciu 12 GB.

| bramka | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --test p6_k5loop_close` | 0 | 5 passed |
| `cargo test --test p6_k5loop_close_r2` | 0 | 5 passed |
| `cargo test --test 'p6_siege*'` | 0 | 40 binarek, 222 passed, 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (w tle `setsid nohup`, EXIT w logu) | 0 | 529 binarek, 3958 passed, 0 failed, 1 ignored (istniejący) |
| generator `node rust-port/engine/tests/p6_k5loop_close_r2_gen.mjs` | 0 | SHA wycinków `c5a5bc11…3619` zgodny; po regeneracji `git status` czysty (760 wektorów bajt w bajt) |

## Allowlista i zakazy
- Zmienione pliki (`git diff --stat 0941c8225 ff9a7aaa6`): `siege_tactics_loop.rs`, `siege_tactics_actions.rs` (D-K5C-r2-2: tylko wariant `Move`, `ActionError::MoveWithoutDto`, jedno ramię w `actions_to_dto`), `tests/p4_1i3_actions.rs` (mechaniczne ramię `match` wymuszone wariantem — dozwolone i wypisane), `tests/p6_k5loop_close.rs`, nowe `p6_k5loop_close_r2.rs`, `p6_k5loop_close_r2_gen.mjs`, `vectors_r2.json`, raport. Zgodne z allowlistą + rozszerzeniem r2.
- Bez zmian: `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, `p6_siege_tactics_loop*`, `p6_k5loop_close_vectors/vectors.json` (r1, 600 wektorów — diff pusty).
- `#[ignore]`: brak nowych (jedyne trafienie „ignore” w diffie to tekst raportu).
- Osłabienie asercji: `p6_k5loop_close.rs` pomija teraz (`continue`) 94 scenariusze r1 z tagiem `krok-naprzod-flanka`. Sprawdzone: rodzina `flank-r1` w `vectors_r2.json` ma **identyczne wejścia** (`acting/atk/def/groupMeta/tiles`) dla wszystkich 120 scenariuszy `flank` r1, w tej samej kolejności, i wszystkie 94 otagowane są w niej porównywane z pełnym pinem z `unported` pustym. Przeniesienie, nie osłabienie — akceptuję.
- Decyzje D-K5C-3 (bez zmian klocków T4/T6): `siege_tactics_cavalry.rs` i inne klocki bez diffu — OK.
- Commit bez `Co-Authored-By` z nazwą modelu (#289): OK.

## Wektory z tekstu pinu
Generator wycina metody z `git show 07d2fbd72:gra/src/battle/battleScene.ts` (`combat.ts`, `formationRules.ts`, `terrain-combat.json`, `combat-params.json`), sprawdza nagłówki linii i końce metod (`_activateUnit`=6299, `_cavalryAction`=6412, `_advanceStep`=8285, `_doMove`=8776), liczy SHA-256 wycinków i transpiluje TS; jedyne podmiany to zmiana nazwy czterech metod na `*Pin` z cienką instrumentacją. Stuby dotyczą wyłącznie gałęzi poza zakresem (strzelec, falanga, ucieczka, mur, okrążenie) i rzucają wyjątek, więc nie mogą po cichu dać wyniku. To wykonanie tekstu pinu, nie reimplementacja. Sprawdziłem w pinie, że `_cavalryAction`, `_cav*ManeuverStep`, C-FLANK i `_doMove` nie losują (brak `Math.random`/rng w `:6313-6501`, `:8198-8285`, `:8487-8600`, `:8685-8776`, `:17486-17560`, `:17736-17775`) — uzasadnienie N/A dla mutacji (c) przyjmuję.

## Tabela wariantów `ActivateEvent`
Tabela Operatora zgadza się z kodem `ProdBody::start` po r2: `AdvanceStep` (front + C-FLANK) i `CavalryAction` wykonywane; `RangedAction`/`FallBackStep` za strażnikiem `strzelec`; `PhalanxAction` → `falanga`, `Flee` → `ucieczka-routed`; doktryna/mur/tryb ręczny za strażnikami. Nowe jawne tagi: `kawaleria-brak-terenu`, `krok-naprzod-brak-terenu` (brak `MoveTerrain`) — jawne, z testami, ale #113 MUSI podać teren (patrz U3).

## Mutacje (kontrola wyrywkowa)
- M7 (emisja `Move` wyłączona: `if false && !planning`) → `p6_k5loop_close_r2` FAIL (2 testy: `flank_i_kawaleria_zgodne_z_pinem`, `move_bez_dto_to_jawny_blad`). Potwierdzone. Plik przywrócony (`git checkout`), drzewo czyste.
- Pozostałych 11 mutantów z raportu nie powtarzałem (czas); M7 zgodny z raportem.

## ZARZUTY

### Z1 (BLOKUJĄCY) — `_cavalryAction`: `moveLeft = NaN` w callbacku `_doMove` daje wiele kroków / zawieszenie zamiast 1 kroku
- Pin `battleScene.ts:6439` (`_cavDirectedManeuverStep`) i `:6496` (`_cavManeuverStep`): w callbacku `_doMove` kontynuacja tylko `if (ru.moveLeft > 0)`; dla `NaN` warunek jest fałszywy → `done()`. `_doMove` (`:8708`, `:8746`) liczy `Math.max(0, ru.moveLeft - stepCost)`, co dla `NaN` daje `NaN`. Wejście do helpera (`if (ru.moveLeft <= 0) return false`, `:6429`, `:6458`) dla `NaN` przepuszcza. Pin = **dokładnie 1 krok**.
- Rust `siege_tactics_loop.rs:2227` i `:2274`: przerwanie pętli `|| move_left <= 0.0` — dla `NaN` fałsz, więc pętla trwa; `gate(NaN) = 1` przepuszcza każdy następny krok helpera T6.
- Dowód (sonda Evaluatora, plik tymczasowy usunięty): kopie scenariuszy `cavalry` z ≥ 2 krokami, `moveLeft` jednostki = `NaN`: `close-cavalry-2` → Rust 11 kroków `Move`, `close-cavalry-4` → 29, `close-cavalry-10` → 6 (pin: 1); `close-cavalry-24` — brak zakończenia w 40 s (`timeout` EXIT 124), w pierwszym uruchomieniu proces rósł do ~6 GB RAM przy 99% CPU przez 10 min.
- Niespójność wewnątrz tematu: ścieżka piechoty (`advance_after_move`, `siege_tactics_advance.rs:154`, `if unit.move_left > 0.0`) i preludium r1 mają `NaN` poprawnie.
- Wymagane w r3: warunek `!(move_left > 0.0)` w obu pętlach jazdy (lub równoważny) + wektory pinu z `moveLeft` `NaN` dla jazdy (generator może podać `NaN` przez osobne pole, JSON nie niesie `NaN`) + mutant odwracający warunek musi dać FAIL.

### Z2 (zakres r2 niepełny, nieblokujący sam w sobie) — pozycja (3) D-K5C-r2-1 nie zrobiona
DODATEK r2 zatwierdzał kolejność (1) C-FLANK, (2) kawaleria, (3) `RangedAction` `:6656` + `FallBackStep` `:7228` (zdjęcie strażnika `strzelec`), rodziny wektorów `ranged`/`fallback` i mutację kolejności RNG w strzelcu. Operator zrobił (1), (2) i `Move`, pozycję (3) jawnie odłożył z liniami pinu. Kryteria końca r1 dopuszczają rundę niepełną z jawną listą — akceptuję jako jawne, ale r3 musi ją zrobić w pierwszej kolejności (blokuje cel „`unported` puste”).

## UWAGI (nieblokujące)
- U1: licznik pokrycia `flank_already` (test, `:598`, asercja `>= 20`) i `flankAlready` w generatorze liczą „0 kroków i 0 ms” w rodzinach flank, a nie gałąź „już w pozycji” `:8212-8214` (którą sam Operator uznaje za nieosiągalną z `_activateUnit`). Nazwa myląca; asercja nie mierzy tego, co sugeruje. Gałąź jest pokryta osobnym testem `flanka_juz_w_pozycji_konczy_bez_akcji` (M10), więc bez szkody — do przemianowania.
- U2: `actions_to_dto` zwraca `Err(MoveWithoutDto)` dla każdej bitwy z ruchem — świadome do I5, ale #113 nie może wołać `actions_dto` przed I5.
- U3: brak `MoveTerrain` = cała tura jazdy bez akcji (tag `kawaleria-brak-terenu`), także bez ciosu w sąsiada. Jawne i uzasadnione; #113 musi zawsze podać teren.
- U4: cios jazdy w cel inny niż szablon adaptera = `cios-bez-szablonu`; adapter #113 musi budować szablon na cel wybrany przez T6.
- U5: NIE_ZMIERZONO z raportu Operatora (czas kroku 240+70 ms, `_targetInRange` z `attackDirection` `:8402`, priorytety UI gracza) — przyjęte.

## TESTY
Jak w tabeli bramek; sonda `NaN` (Z1) i mutant M7 — opis wyżej. Żaden plik kodu ani testu nie został zmieniony przez Evaluatora.

## BLOKADY
Z1 (merytoryczna, do Operatora r3). Brak blokad infrastrukturalnych.

## RUNDY
2/5 (werdykt Evaluatora r2: FAIL)

## NASTĘPNY KROK
Runda 3 tego samego ID (Operator): Z1 (warunek `NaN` w obu pętlach jazdy + wektory + mutant), potem pozycja (3) strzelec `RangedAction`+`FallBackStep` (rodziny `ranged`/`fallback`, mutacja kolejności rzutów RNG), dalej `PhalanxAction` i `_fleeStep` wg D-K5C-r2-1; U1 przy okazji.

## DEPLOY/PUSH
NIE WYKONANO
