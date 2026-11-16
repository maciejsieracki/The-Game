# 02a — Obrona Operatora, R-RUSTPORT-P4-1I1-BATTLE-OUTCOME (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I1-BATTLE-OUTCOME
GOAL: BattleOutcomeDto (view-model) + producent wyniku bitwy dla E1–E3 (E4 z zewnątrz), parytet z pinem `07d2fbd72`.
ZMIANY/COMMIT: commit obrony na `69c2b7eb9` (Evaluator) ← `475b795a5` (Operator) ← `84ec520a5` (baza z dispatchu); SHA w odpowiedzi końcowej. Pliki: 5 (wszystkie na allowliście, lista w §2).
TESTY: §3.
BLOKADY: lib.rs / validate.rs / NIEPODPIETE-MODULY.md poza allowlistą (zarzuty 2, 3), decyzja orkiestratora.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Odpowiedzi na zarzuty

### Zarzut 1 [niska, dokumentacja]: placeholder SHA i fałszywe „usunięto CARGO_TARGET_DIR”: PRZYJMUJĘ

Poprawka w `01-operator-r1.md`:
- §6: `COMMIT_SHA` → `475b795a5583582dd93e9c94c1d281105bfb47a0`;
- §4: zdanie „usunięty po bramkach” zastąpione jawną korektą: `tgt-en` (3,1 GB) nie został usunięty przez Operatora, usunął go Evaluator.

Dowód: `git diff 69c2b7eb9 -- dyspozycje/.../01-operator-r1.md` w commicie obrony. W tej rundzie katalog celu obrony (`scratchpad/tgt-obr`) został usunięty po bramkach; dowód w §3.

### Zarzut 2 [niska, wpięcie]: brak wołającego, brak źródła maxHp, brak tematu wpięcia: PRZYJMUJĘ CZĘŚCIOWO

Poprawki w kodzie (allowlista):
1. `rust-port/engine/src/domain/siege_tactics_outcome.rs`, doc modułu: nowa sekcja „Wpięcie”. Mówi, że moduł nie ma wołającego w produkcji. Wpięcie należy do #113 `K5LOOP-WIRING` (wywołanie w miejscu web `onFinish`); P4-1I2 (#246) i P4-1I4 (#248) tylko czytają DTO. Sekcja podaje też mapowanie adaptera `SiegeLoop` → `OutcomeInput`:
   - `wall_ever_breached` pochodzi z `SiegeEnv.wall_ever_breached` (`siege_tactics_loop.rs:327`). Osobny konstruktor nie jest potrzebny, bo `OutcomeInput::single` przyjmuje go jako argument;
   - `siege_wall_col = -1` oznacza brak oblężenia;
   - `null` w `wallBreached` oznacza brak klucza w webie (to łączy się z zarzutem 4).
2. Źródło `maxHp`: nowa funkcja `OutcomeUnit::from_seq_with_setup(&SeqUnit, &[BattleUnitSpawnDto]) -> Option<OutcomeUnit>`. Bierze `max_hp` z `BattleUnitSpawnDto::max_hp` (`view-model/src/battle.rs:104-105`, = `bu.maxHp` przy spawnie), dopasowując jednostkę po id.
   Dowód z pinu, że wartość ze spawnu = wartość w `onFinish`: `git grep -nE "maxHp\s*[-+*]?=[^=]" 07d2fbd72 -- gra/src/battle/battleScene.ts` znajduje tylko deklaracje `const maxHp = …` (`:9724`, `:10407`). Pin nigdy nie przypisuje `bu.maxHp` w scenie bitwy, wszystkie miejsca to odczyty.
3. Test `outcome_unit_from_seq_with_setup_takes_max_hp_by_id` (`engine/tests/p4_1i1_battle_outcome.rs`). W setupie `hp != max_hp`, a brak id daje `None`. Mutacja `s.max_hp → s.hp` daje FAIL (rc 101), dowód w §3.

ODRZUCAM część „dopisać do indeksu #119”: `dyspozycje/rust-port/NIEPODPIETE-MODULY.md` nie jest na allowliście dispatchu, a plik jest generowany skryptem (`R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1/dowody/gen-raport.py`). Heurystyka tego skryptu przypisuje moduły `siege_tactics_*` do #113 `K5LOOP-WIRING` (np. wiersze 61, 63, 64), więc przy regeneracji `siege_tactics_outcome` trafi tam automatycznie. Regenerację indeksu po integracji wykonuje orkiestrator.

Samego wołającego w produkcji nie dodaję. Dispatch go nie obejmuje: allowlista nie zawiera `siege_tactics_loop.rs`, a GOAL to DTO i producent, bez wpięcia.

### Zarzut 3 [niska, zakres]: brak sprawdzenia hp > 0 ocalałych, brak re-eksportu: PRZYJMUJĘ CZĘŚCIOWO

Poprawka: `BattleOutcomeDto::validate` (`view-model/src/battle.rs`) odrzuca teraz `survivors[i].hp <= 0`. Niezmiennik obowiązuje na WSZYSTKICH ścieżkach pinu, nie tylko E1–E3:
- E1–E3: filtr `u.bu.hp > 0` (`battleScene.ts:10248`, `_battleUnitsForMapExport`);
- E4: `computeInstantResult`, filtr `u.hp > 0` (`:20574-20575`).

Nie dodaję nowego wariantu `ViewError`, bo `validate.rs` jest poza allowlistą. Użyłem istniejącego `ViewError::OutOfRange { field: "survivors[i].hp", value: ceil(hp), min: 1, max: i64::MAX }`. Dla skończonego `hp` zachodzi `hp > 0 ⇔ ceil(hp) ≥ 1`, więc granica jest wyrażona dokładnie. Ułamkowe `hp ∈ (0,1)` przechodzi, co sprawdza test. Kolejność sprawdzeń: najpierw `NonFinite` (bez zmian), potem `hp > 0`.

Test `survivor_hp_must_be_positive` (`view-model/tests/battle_outcome.rs`) sprawdza 0, -0, -0.5 i -3 (błąd z dokładnym `value`) oraz 0.25 (OK). Mutacja `<= 0.0 → < 0.0` daje FAIL (rc 101).

ODRZUCAM część „re-eksport z korzenia crate'a”: `view-model/src/lib.rs` jest poza allowlistą. Typy są dostępne jako `civ_view_model::battle::…`, tak jak w producencie i testach. Jeśli orkiestrator chce mieć re-eksport, potrzebny jest osobny drobny temat (lib.rs, jedna linia `pub use`).

### Zarzut 4 [informacyjny]: `wallBreached: None` serializuje się jako `null`: ODRZUCAM jako wadę, kontrakt udokumentowany

Taka serializacja to konwencja crate'a (`view-model/src/lib.rs:15-19`) i jest przypięta testem `json_keys.rs`. Zmiana na pomijanie klucza złamałaby spójność z resztą DTO. Zgodnie z rekomendacją Evaluatora dopisałem do doc-u producenta (sekcja „Wpięcie”), że konsument traktuje `null` jak brak klucza w webie, czyli brak oblężenia.

### Zarzut 5 [informacyjny, NIE_ZMIERZONO]: `end_stats` z migawki w `onFinish`: ODRZUCAM jako wadę, pozostaje NIE_ZMIERZONO

Założenie jest jawne w doc-u modułu i w raporcie (§5.6). Wektora nie da się zbudować w tym temacie. Trzeba by pokazać, że między `_showEndScreen` (`:10677-10678`) a kliknięciem `onFinish` pętla pinu nie zmienia `hp`, `dead` ani `routed`. To zachowanie runtime sceny (timery, `_endScreenShown`, `:10669`), a w Rust producentem migawki będzie dopiero pętla z #113. Wektor należy więc do #113 `K5LOOP-WIRING`: test „ostatni krok pętli → build_battle_outcome = statystyki z tej samej migawki”. Status zostaje NIE_ZMIERZONO, bez zmiany kodu.

## 2. Zmiany (allowlista dispatchu)

| Plik | Zmiana |
|---|---|
| `rust-port/view-model/src/battle.rs` | `validate`: `survivors[i].hp > 0` (OutOfRange, min 1) + doc |
| `rust-port/view-model/tests/battle_outcome.rs` | test `survivor_hp_must_be_positive` |
| `rust-port/engine/src/domain/siege_tactics_outcome.rs` | doc „Wpięcie”; `OutcomeUnit::from_seq_with_setup` |
| `rust-port/engine/tests/p4_1i1_battle_outcome.rs` | test `outcome_unit_from_seq_with_setup_takes_max_hp_by_id` |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1-BATTLE-OUTCOME/01-operator-r1.md` | korekta SHA §6 i zdania o CARGO_TARGET_DIR §4 |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1-BATTLE-OUTCOME/02a-obrona.md` | ten raport |

`mod.rs`, `lib.rs`, `validate.rs` i `Cargo.lock` są bez zmian. Brak `#[ignore]` i brak usuniętych asercji.

## 3. Bramki (obrona, worktree `wf_8948228b-2a5-3`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR=<scratchpad>/tgt-obr` (poza repo, usunięty po bramkach).

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| view-model | EXIT 0 | EXIT 0 | EXIT 0: 80 passed, 0 failed, 0 ignored (79 + 1 nowy) |
| engine | EXIT 0 | EXIT 0 | 484 binarki testowe, łącznie 3550 passed, 0 failed, 1 ignored (3549 u Evaluatora + 1 nowy; ignored = istniejący `p6_order_lane.rs:1530`) |

Pełny test silnika: `cargo test --all-targets --no-fail-fast` przekroczył limit 580 s po 261 wynikach (lib + 260 binarek testowych, 2012 passed, 0 failed). Resztę 222 binarek (od `p6_m12_compute`, którą ucięto, włącznie) uruchomiłem bezpośrednio z tego samego buildu, z `cwd` = katalog crate'a: wszystkie rc 0, 1534 passed, 0 failed, 1 ignored. Bench `engine_modules` w trybie testu: 4 passed. Każdy target `--all-targets` przeszedł dokładnie raz, a liczba binarek (484) zgadza się z Evaluatorem.

`p4_1i1_battle_outcome`: 19/19 (18 + 1 nowy).

Mutacje obrony (obie muszą dać FAIL):
- M5 `validate`: `s.hp <= 0.0 → s.hp < 0.0`: `survivor_hp_must_be_positive` FAILED, rc 101;
- M6 `from_seq_with_setup`: `s.max_hp → s.hp`: `outcome_unit_from_seq_with_setup_takes_max_hp_by_id` FAILED, rc 101.

Po przywróceniu kodu: 19/19 i 9/9. Mutacje M1–M4 z rundy Operatora nie dotyczą zmienionych linii.

`git diff --check` czysty, a Cargo.lock nie jest w commicie.

## 4. Do decyzji orkiestratora

1. Re-eksport typów wyniku w `view-model/src/lib.rs` i ewentualny dedykowany wariant `ViewError` w `validate.rs` jako drobny temat. Bez niego walidacja jest kompletna, przez `OutOfRange`.
2. Regeneracja `NIEPODPIETE-MODULY.md` po integracji: moduł `siege_tactics_outcome` powinien trafić do #113.
3. Wektor zgodności `end_stats` z migawką (zarzut 5) w #113.
4. Merge-tree względem aktualnego `origin/rust-port/parity-v2` (`02a1560e3` wg Evaluatora) przy integracji.
