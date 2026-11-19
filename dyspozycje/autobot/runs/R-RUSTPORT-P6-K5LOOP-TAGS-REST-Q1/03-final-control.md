# R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-TAGS-REST-Q1
GOAL: zdjąć z `ProdBody::unported` ostatnie tagi „nieportowane” (`dowodca-rout`, `dowodca-fade`, `kontratak-strzelec`, `krok-naprzod-atak`, `ucieczka-oblezenie` + M19); `doktryna-rozkaz-ruchu` zostaje z uzasadnieniem; tagi błędów wejścia (`*-brak-terenu`, `*-bez-szablonu`, `ucieczka-routed`) zostają.
ZMIANY/COMMIT: oceniany HEAD Obrony `73c116902` (gałąź `obrona/tags-rest-q1`; kod Operatora `cd94d7665`, `24c6e5359`, `faa8841f2`, raport `4d649d2d2`; Evaluator `2f3251db0`). `merge-base 73c116902 origin/rust-port/parity-v2` = `1e20c2da9` = BAZA dispatchu (parity-v2 bez ruchu od dispatchu). FC nie zmienia kodu; jedyny plik: ten raport (commit na gałęzi `fc/tags-rest-q1` od `73c116902`).
TESTY: fmt EXIT 0; clippy `--all-targets -D warnings` EXIT 0; lista dispatchu + `close`, `close_r2`, `close_r3` EXIT 0 (14 binarek `ok`, 0 ignored); pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (541 bloków, 4085 passed, 0 failed, 1 ignored sprzed tematu); generatory odtworzone, 4 pliki wektorów bajt w bajt (MD5 OK); mutanty E4, E14, M19 odtworzone niezależnie przez FC — wszystkie ZABITE.
BLOKADY: brak technicznych. Decyzje orkiestratora (rejestr): U1 (zmiany w `p6_k5loop_close.rs`, `p6_k5loop_close_r4.rs` poza listą plików), U2 (nowy kontrakt `flee_after` i tag `ucieczka-konflikt-zegara`).
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge `73c116902` + ten raport na `rust-port/parity-v2`), wpisy D-… dla U1/U2 w `REJESTR-RUST.md`, długi do T6/T7.
DEPLOY/PUSH: NIE WYKONANO

## 1. Środowisko

- Worktree `wf_332bf894-0ad-4`, sparse `rust-port dyspozycje src-tauri`, gałąź `fc/tags-rest-q1` = `73c116902`.
- Dysk na starcie: 1,2 GB wolnego (pełny test T6 ADAPTER w `scratchpad/adapter/t2`, 11 GB). FC nie startował buildu do zwolnienia miejsca (12 GB o 02:38), potem jeden build; `CARGO_TARGET_DIR=scratchpad/tagsrest/fc/t` (usunięty po bramkach, 9,7 GB wolnego na końcu), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Pełny test w tle (`setsid nohup`, `FULL_EXIT` w `tagsrest/fc/gates.log`).

## 2. Bramki (odtworzone przez FC)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_tags_rest --test p6_k5loop_siege_atk_b --test p6_k5loop_siege_atk_a --test p6_k5loop_siege_def --test p6_siege_tactics_loop_body --test p6_siege_tactics_loop_body_pin --test p6_k5loop_outcome_pin --test p6_k5loop_close --test p6_k5loop_close_r2 --test p6_k5loop_close_r3 --test p6_k5loop_close_r4 --test p6_k5doc_t8 --test p4_1i3_actions --test bridge_contract` | EXIT 0: tags_rest 5, atk_b 9, atk_a 7, siege_def 10, loop_body 8, loop_body_pin 2, outcome_pin 10, close 5, close_r2 6, close_r3 6, close_r4 9, k5doc_t8 6, p4_1i3 9, bridge_contract 9 — 0 failed, 0 ignored |
| pełny `cargo test --all-targets --no-fail-fast` | EXIT 0; 541 bloków `test result`, 4085 passed / 0 failed / 1 ignored (`p6_order_lane.rs`, sprzed tematu). Evaluator miał 4084 na `4d649d2d2`; +1 = nowy test Obrony `ucieczka_laczenie_ta_sama_wartosc_bez_konfliktu`. |
| `node tests/p6_k5loop_tags_rest_gen.mjs` | EXIT 0, strażnik `tags e30f68e6…` (stała, bez furtki env — U6 zamknięte), 640 sekwencji, `secShooterCounter` 42, `primaryNoBaseCounter` 18, `cmdHalfCapped` 50 |
| `node tests/p6_k5loop_tags_rest_siege_gen.mjs` | EXIT 0, strażnik `489ddf8e…`; 660/160/200 przypadków |
| MD5 4 plików `p6_k5loop_tags_rest_vectors/*.json` przed/po regeneracji | wszystkie OK (deterministyczne) |
| Trailery commitów `1e20c2da9..73c116902` | tylko `Claude-Session:`; brak `#[ignore]` w nowych testach |

## 3. Allowlista (diff `1e20c2da9..73c116902`, 15 plików)

- Kod: wyłącznie `rust-port/engine/src/domain/siege_tactics_loop.rs` — w allowliście. Brak zmian w `siege_battle_adapter*`, `battle_setup*`, `renderer/`, `view-model/`, `bridge.rs`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md`, `siege_tactics_actions.rs` (brak nowych `BattleAction`).
- Nowe: `tests/p6_k5loop_tags_rest.rs`, `…_gen.mjs`, `…_siege_gen.mjs`, `…_vectors/*.json` (4) — w allowliście (drugi generator mieści się w `…_gen.mjs`/wzorcu tematu).
- Zmienione testy z listy „DOZWOLONE ZMIANY”: `p6_k5loop_outcome_pin.rs`, `p6_k5loop_siege_def.rs` — opisane w `01-operator-r1.md`, bez osłabienia (nowe asercje liczbowe dowódcy, `executed + stuck == 80`).
- Poza listą plików: `p6_k5loop_close.rs` (oczekiwany tag `krok-naprzod-atak` → `cios-bez-szablonu`), `p6_k5loop_close_r4.rs` (test `ucieczka_przy_murze_jawny_tag` oczekiwał tagu `ucieczka-oblezenie` → pełne `check_activation` dla wszystkich 400 przypadków `flee` przy murze; kontrakt `flee_after`; dwa nowe testy łączenia). Wektory `p6_k5loop_close_*` NIETKNIĘTE (sprawdzone diffem). Patrz zarzut F1.

## 4. Zgodność z pinem (`07d2fbd72`, `git show … gra/src/battle/battleScene.ts`, czytane przez FC)

- `_startRout` `:9799-9806`: `routed`, potem `isArmyCommander → _removeCommanderMoraleBonus + _disableManualIfCommanderLost`, potem `acted`, `_checkMeleeScreenLost` — Rust `start_rout`: `commander_lost` przed kaskadą osłony; zgodne.
- `_startFade` `:9927-9937`: efekty dowódcy przed `_removeUnitFromScene` — Rust `start_fade` `:4856-4860`; zgodne.
- `_removeCommanderMoraleBonus` `:9993-10005`: iteracja po całej stronie, `frac <= 0 → continue` (NaN przechodzi — Rust `frac <= 0.0` identycznie), `ratio = moraleMax > 0 ? max(0, min(1, morale/moraleMax)) : 0`, `frac = 0`, `base = moraleBaseFor * (def ? 1.5 : 1)`, `moraleMax = base`, `morale = min(base, ceil(base*ratio))` — Rust `commander_lost` 1:1 (wejście `morale_base_plain`; brak wejścia = jawny błąd wejścia `dowodca-bez-bazy-morale`).
- `_disableManualIfCommanderLost` `:10007-10015`: w AUTO bez bramki ręcznej wraca od razu; przy bramce planuje `_schedule(0)` bez skutku w AUTO — Rust nie planuje (dług U4, poniżej).
- `_defenderCounters` `:9079-9091`: `if (!primaryRanged) return true; return !canShoot(defender)` — Rust `if da.primary_ranged && da.can_shoot { return }`; zgodne, teraz z pokryciem (`shooter2`).
- Ucieczka przy murze: `_siegeApproachRestricted` zwraca `false` dla `ru.routed`; `mover_routed` ustawiane po `_startRout` — M19 zabity.
- `doktryna-rozkaz-ruchu`: tag zostaje; uzasadnienie (skirmish tylko z UI, domyślna `steady`) zgodne z dispatchem („jeśli wymaga trybu ręcznego → zostaje jawnym tagiem”).

## 5. Mutanty odtworzone przez FC (jedna podmiana, przebieg `tags_rest` + `close_r4` + `outcome_pin`, plik przywrócony `cmp` OK)

| Mutant | Wynik |
|---|---|
| E4: `if da.can_shoot` (bez `primary_ranged`) | ZABITY (`dowodca_i_kontratak_strzelca_zgodne_z_pinem` FAILED) |
| E14: `morale = (base*ratio).ceil()` (bez `min(base, …)`) | ZABITY (ten sam test) |
| M19: `routed: false` w `ApproachUnit` | ZABITY (3 testy `siege::*` FAILED) |

Łącznie z mutantami Operatora (T01–T20 + M19, 21/21) i Evaluatora/Obrony (E1, E3, E5, E6, E15, E17, E18, E20, E31 zabite; E9, E19, E25 równoważne z uzasadnieniem; E8/E22/E30 — patrz F3) kryterium „>= 15 mutantów, zabite albo jawnie równoważne, M19 zabity” spełnione.

## 6. Orzeczenia zarzutów

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z1 | E4 przeżywa (brak `rangedBase && !primaryRanged`) | ODDAL (naprawione przez Obronę) | rodzina `shooter2`, liczniki 42/18 z progami; E4 zabity także w przebiegu FC |
| Z2 | E14 przeżywa (baza niecałkowita, `ratio = 1`) | ODDAL (naprawione) | rodzina `cmdHalf`, `cmdHalfCapped` 50 ≥ 40; E14 zabity w przebiegu FC |
| Z3 | E5/E6 łączenie zgodnych wartości | ODDAL (naprawione) | nowy test w `close_r4` (478 pól liczbowych, 536 flag, progi) — przechodzi w FC |
| Z4 / F3 | `attack_pre` bez pokrycia (E8/E22/E30) | ODDAL | ścieżka `_advanceStep` → cios po kroku w tej samej aktywacji wymaga zmiany `_canAttackFrom` w oknie `STEP_GAP_MS` przez obcy zegar (pin `:8223`, `:8277` kończy po kroku z celem obok); w wektorach i sondzie 2700 bitew — 0 przypadków. Równoważność warunkowa jawnie opisana, osiągalność NIE_ZMIERZONO → dług T7. Kod odpowiada pinowi dla tego przypadku (czas = kroki + cios). |
| U3 | prawie pusta asercja `siege_def` | ODDAL (naprawione) | `executed + stuck == 80`, `executed >= 1`; liczby z pinem w `tags_rest::siege` |
| U6 | furtka env w strażniku SHA | ODDAL (naprawione) | stała `EXPECTED_TAGS_SHA256`, `throw` zawsze (sprawdzone w pliku) |
| U7 | `ammoLeft` przy wystrzale vs trafieniu | ODDAL | poza tematem (stara rozbieżność), bez wpływu na nową gałąź w AUTO |
| U4 | pusty `_schedule(0)` z `_disableManualIfCommanderLost` | ODDAL (dług T7) | w AUTO bez skutku stanu; wpływ na kolejność zegarów NIE_ZMIERZONO — wpis w Długach |
| U5 | `cios-bez-szablonu` w pełnej bitwie | ODDAL (dług T6) | identyczna liczba na bazie; błąd wejścia adaptera dopuszczony dispatchem (`*-bez-szablonu`) |
| F1 (=U1) | zmiany `p6_k5loop_close.rs` / `p6_k5loop_close_r4.rs` poza listą plików | DO DECYZJI (orkiestrator, decyzja techniczna) | oba testy oczekiwały zdejmowanych tagów (`krok-naprzod-atak`, `ucieczka-oblezenie`) — duch D-INT-2 dispatchu; wektory r1–r4 nietknięte; asercje wzmocnione (20 → 400 przypadków pełnym `check_activation`). FC rekomenduje przyjęcie i wpis D-… |
| F2 (=U2) | kontrakt `flee_after`: twarda asercja stanu → łączenie trójstronne + tag `ucieczka-konflikt-zegara` | DO DECYZJI (orkiestrator, decyzja techniczna) | konieczne, bo przy murze zegary (wieże, `BodyTimer`) zmieniają jednostki w oknie start..complete; asercja jednostki zostaje twarda; konflikt jawnie tagowany (0 w 2700 bitwach sondy). Nowy tag jest jawny, nie cichy. FC rekomenduje przyjęcie i wpis D-… |
| F4 | kryterium „test pełnej bitwy AUTO z murem (wektory pinu sekwencji)” — test `pelna_bitwa_auto_z_murem_bez_tagow_poza_wejsciowymi` jest Rust-only (12 bitew, brak tagów poza wejściowymi), bez porównania z pinem | ODDAL z uwagą | parytet całej bitwy wymaga adaptera T6 (szablony ciosu na każdy cel, dowódca/baza morale) — poza allowlistą; każda zmieniona gałąź ma wektory pinu (`fx` 640 sekwencji, `siege` 1020 przypadków), a pin-sekwencje `p6_siege_tactics_loop_body_pin` przechodzą. Operator jawnie: NIE_ZMIERZONO. Do T7 (#369). |

Brak zarzutów NAPRAW → werdykt PASS-WITH-NOTES.

## 7. Długi (T6 / T7 #369 / I5b)

- D-B2: `BodyTimer` przed `BodyDone` — bez zmian; łączenie `flee_after` zakłada zegary w oknie ucieczki; osiągalność konfliktu w produkcyjnej pętli NIE_ZMIERZONO.
- `gate_hp` — bez zmian.
- I5b: brak nowych `BattleAction` (efekty dowódcy bez akcji DTO, jak pin).
- T6: adapter musi wypełnić `is_army_commander`, `army_leader_bonus_frac`, `morale_base_plain` (bez mnożnika strony) i szablon ciosu dla każdego celu `_pickAdjacentTargetByPriority`.
- T7: parytet pełnej bitwy z pinem; `attack_pre` (E8/E22/E30); pusty `_schedule(0)` (U4).
- K5EXEC-T3: `doktryna-rozkaz-ruchu`.

## 8. Sprzątanie

Target FC `tagsrest/fc/t` usunięty; skrypty/logi w `tagsrest/fc/` (`gates.sh`, `gates.log`, `full.log`, `mut.sh`). Worktree czysty poza tym raportem. Worktree etapów `wf_332bf894-0ad-2` (Evaluator, `refs/keep/TAGS-REST-eval-r1`) i `wf_332bf894-0ad-3` (Obrona, `73c116902` — brak jeszcze `refs/keep`/push) zostawione orkiestratorowi.
