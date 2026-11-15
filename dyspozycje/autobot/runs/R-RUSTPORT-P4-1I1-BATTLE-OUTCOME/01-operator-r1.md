# 01 — Operator r1: R-RUSTPORT-P4-1I1-BATTLE-OUTCOME

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I1-BATTLE-OUTCOME
GOAL: `BattleOutcomeDto` (web `BattleResult` + `_sideEndStats`) w `view-model` i producent w silniku dla ścieżek końca
E1–E3, E4 jako wariant z danymi z zewnątrz; `log` pusty z jawnym NIE_ZMIERZONO do I3.
ZMIANY/COMMIT: patrz §1; SHA commitu w §6 (gałąź robocza worktree `worktree-wf_8948228b-2a5-1`).
TESTY: §3–§4 (bramki EXIT 0 w obu crate'ach, wektory pinu zielone, 4/4 mutacje FAIL).
BLOKADY: pełny `cargo test --all-targets` silnika nie dobiegł końca w czasie rundy (0 failed w ukończonych binarkach); wymagane powtórzenie przez Evaluatora.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO (zakaz w dispatchu; brak push, brak integracji).

Baza: `origin/rust-port/parity-v2` = `84ec520a52f8ff797ac7dcbb46184b604fbf67b9` (`git rev-parse` przy starcie; zgodne z
dispatchem `84ec520a5`), worktree odłączony od tej bazy. Pin webu `07d2fbd72` — tylko odczyt przez `git show`.
Źródło: `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` (gałąź `origin/claude/rust-sivvrn`) §2a, §2a.1, §1 wiersz 27,
§4 wiersz `R-RUSTPORT-P4-1I1-BATTLE-OUTCOME`.

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/view-model/src/battle.rs` | nowe typy `BattleWinner` (`atakujacy`/`obronca`/`remis`), `BattleSurvivorDto {id, hp}`, `BattleSideEndStatsDto {total, lost, remaining, hp, hpMax}`, `BattleEndStatsDto {atk, def}`, `BattleOutcomeDto {winner, survivors, log, attackerUnitIds, defenderUnitIds, wallBreached, endStats}` + `BattleOutcomeDto::validate()` |
| `rust-port/engine/src/domain/siege_tactics_outcome.rs` (NOWY) | producent `build_battle_outcome`, `EndPath {Victory, Draw, FfRoundCap, InstantSkip}`, `InstantSkipData`, `OutcomeInput`, `OutcomeUnit`, funkcje 1:1 `battle_units_for_map_export`, `unique_unit_ids`, `side_end_stats`, mapowania `EndPath::from_end_check` / `from_round_cap` |
| `rust-port/engine/src/domain/mod.rs` | tylko `pub mod siege_tactics_outcome;` |
| `rust-port/engine/tests/p4_1i1_battle_outcome.rs` (NOWY) | 18 testów: wektory pinu E1–E4 + jednostkowe wektory filtrów |
| `rust-port/view-model/tests/battle_outcome.rs` (NOWY) | round-trip, literały `winner`, klucze nieznane/brakujące, id > 2^53-1, walidacja (NaN/±Inf per pole, `lost+remaining`, unikalność id) |
| `rust-port/view-model/tests/json_keys.rs` | `battle_outcome_keys` (dokładne klucze, `None` = jawny `null`) |
| `rust-port/view-model/tests/validate.rs` | `battle_outcome_validate` (pass + komunikat każdego rodzaju błędu) |
| `rust-port/view-model/tests/common/mod.rs` | fikstura `sample_outcome()` |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1-BATTLE-OUTCOME/` | ten raport, generator wektorów `gen-p4-1i1-vectors.mjs`, jego wynik `p4-1i1-vectors.json`, skrypty mutacji `mut-p4-1i1.{py,sh}` |

Poza allowlistą: zero zmian. `Cargo.lock` (powstał w `rust-port/engine/`) NIE commitowany. `lib.rs` view-model nie jest
na allowliście, więc nowe typy NIE są re-eksportowane z korzenia crate'a — dostęp przez `civ_view_model::battle::…`.

## 2. Odwzorowanie pinu (1:1)

| Element | Pin `07d2fbd72` | Rust |
|---|---|---|
| `winner` | `this._endWinner ?? winner` (`battle/battleScene.ts:10721`; `winner` = argument `_showEndScreen`, które utworzyło domknięcie, `:10666-10669`) | `OutcomeInput.end` (ostatnia ścieżka) → `EndPath::end_winner()`, inaczej `screen_winner` |
| E1 | `_checkEnd` `:10208-10240` (eksport `:10224-10226`) | `EndPath::Victory(side)`; `from_end_check(Ended(side))` |
| E2 | `_finishDraw` `:9467-9479`: `[...export(atk), ...export(def)]` | `EndPath::Draw`; `from_end_check(Draw)`, `from_round_cap(Draw)` (`:9488`) |
| E3 | `_ffRoundCapResult` `:9485-9497` | `EndPath::FfRoundCap(side)`; `from_round_cap(Attacker/Defender)` |
| E4 | `_skipInstantFallback` `:3715-3748` | `EndPath::InstantSkip(InstantSkipData)` — `winner`, `survivors`, `attacker_has_live_siege_unit` podane z zewnątrz; producent stosuje tylko `siegeWallCol >= 0 && …` → `wallEverBreached = true` (`:3720-3722`). `computeInstantResult` NIE portowany (#245) |
| `survivors` | `_battleUnitsForMapExport` `:10246-10250`: `hp > 0 && (!dead \|\| routed)`, `hp: Math.max(0, hp)` | `battle_units_for_map_export` (`js_max0`) |
| `eventLog` | `buildBattleEventLog` (`units/battleRoster.ts:26-39`): `[...new Set(units.map(u => String(u.id)))]` | `unique_unit_ids` (pierwsze wystąpienie, kolejność rosteru) |
| `wallBreached` | `...(siegeWallCol >= 0 ? { wallBreached: wallEverBreached } : {})` `:10728` | `Option<bool>`: `None` poza oblężeniem |
| `end_stats` | `_sideEndStats` `:10257-10269` | `side_end_stats` (`js_max0` na `hp`/`maxHp`, suma w kolejności rosteru) |
| `log` | `this.log` `:10723` | `Vec::new()` — NIE_ZMIERZONO do P4-1I3 (#247), komentarz w kodzie i w doc-u pola |

## 3. Wektory pinu (WYKONANE na tekście pinu)

Generator `gen-p4-1i1-vectors.mjs` składa wycinki pinu bez zmian tekstu (linie jak w tabeli §2 + `onFinish`
`:10719-10730`, `buildBattleEventLog` `battleRoster.ts:26-39`) w klasę-uprząż i uruchamia je `node --experimental-strip-types`
(node v22.23.4). Podstawione są tylko: `computeInstantResult` (zwraca wynik z wektora), `isSiegeUnit` (flaga `bu.siege`),
`_roundCapVerdict` (werdykt z wektora) i `_showEndScreen` (minimum z pinu: `_endScreenShown`, `_sideEndStats`, domknięcie
`onFinish`). Polecenie:

```
git show 07d2fbd72:gra/src/battle/battleScene.ts > /tmp/p41i1-bs.ts
git show 07d2fbd72:gra/src/units/battleRoster.ts > /tmp/p41i1-roster.ts
node dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1-BATTLE-OUTCOME/gen-p4-1i1-vectors.mjs /tmp/p41i1-bs.ts /tmp/p41i1-roster.ts
```

Wynik (11 wektorów) jest zapisany w `p4-1i1-vectors.json` i wklejony bez zmian do testu (`PIN_VECTORS`). Pokrycie:
duplikaty id w rosterze (100 w atk, 3 w def → dedup w `eventLog`, ale duplikat zostaje w `survivors`), kolejność
nieposortowana (`100, 7, 42, 9, 8`), id liczbowe → `String`, rout z hp>0 (także `dead && routed`) w ocalałych, dead z hp 0
i dead bez rout z hp>0 poza, rout z hp 0 poza, E2 z ocalałymi obu stron atk→def, E3 obrońca/atakujący, E3 z remisem = E2,
podwójny koniec (E1 potem `_finishDraw`: `winner = 'remis'` mimo ekranu `'atakujacy'`), `_endWinner === null` (fallback),
`wallBreached` w oblężeniu bez wyłomu / z wyłomem / poza oblężeniem, E4 z żywą machiną / z martwą machiną / bez oblężenia.

Test `p4_1i1_battle_outcome`: 18/18 ok.

## 4. Bramki i mutacje

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(poza repo, osobny dla każdego crate'a). KOREKTA (obrona r1, `02a-obrona.md` zarzut 1): katalog silnika
`tgt-en` (3,1 GB) NIE został usunięty przez Operatora; usunął go Evaluator.

| Crate | `cargo fmt --check` | `cargo clippy --all-targets -- -D warnings` | `cargo test --all-targets --no-fail-fast` |
|---|---|---|---|
| `rust-port/view-model` | EXIT 0 | EXIT 0 | EXIT 0 — 79 passed, 0 failed, 0 ignored |
| `rust-port/engine` | EXIT 0 | EXIT 0 | NIE_ZMIERZONO do końca: 1. przebieg ubity limitem 590 s po 245 binarkach testowych, wszystkie `0 failed`; 2. przebieg (timeout 2 h) w toku przy oddaniu raportu, do tej chwili 50 binarek `0 failed`. Test tematu `p4_1i1_battle_outcome` 18/18 ok. Evaluator musi powtórzyć pełny `cargo test` silnika |

`git diff --check`: pusty. Brak `#[ignore]`, brak osłabionych asercji w istniejących testach (zmiany w istniejących plikach
testów to wyłącznie dopisane testy i fikstura).

Mutacje (`mut-p4-1i1.sh` + `mut-p4-1i1.py`, każda na czystej kopii `siege_tactics_outcome.rs`, test `p4_1i1_battle_outcome`):

| Mutacja | Wynik | Testy FAIL |
|---|---|---|
| M1 kolejność survivors E2 def→atk | FAIL (rc 101, 3 failed) | `e2_draw_survivors_both_sides_atk_then_def`, `e3_round_cap_remis_goes_through_finish_draw`, `winner_is_end_winner_before_screen_winner` |
| M2 `winner` bez `_endWinner ??` (zawsze `screen_winner`) | FAIL (rc 101, 1 failed) | `winner_is_end_winner_before_screen_winner` |
| M3 `wall_breached` zawsze `false` | FAIL (rc 101, 3 failed) | `e3_ff_round_cap_defender_with_breach`, `e4_external_data_siege_machine_assumes_breach`, `wall_breached_present_only_in_siege` |
| M4 `hp 0` w survivors (`hp >= 0`) | FAIL (rc 101, 6 failed) | `e1_attacker_…`, `e2_draw_…`, `e3_ff_round_cap_attacker_no_siege`, `e3_round_cap_remis_…`, `map_export_rout_with_hp_kept_dead_or_zero_hp_dropped`, `winner_is_end_winner_…` |
| przywrócenie | ok, 18 passed | — |

## 5. Decyzje techniczne (do wpisu w `REJESTR-RUST.md` przez orkiestratora)

1. **Id jako `UnitId` (liczba JSON), nie `String`.** D-DTO-2 = B (newtypy w DTO, adapter `Display` → `String`). Web
   `uniqueUnitIds` porównuje `String(u.id)`; id silnika to `u64`, więc równość napisów dziesiętnych = równość liczb.
   Test porównuje `UnitId::to_string()` z `attackerUnitIds`/`defenderUnitIds` pinu (napisy).
2. **`survivors` zawężone do `{id, hp}`** — uzasadnienie w rozpoznaniu §2a.1 (konsumenci mapy czytają tylko `id`, `hp`).
3. **`eventLog` spłaszczony** do `attackerUnitIds`/`defenderUnitIds` (nazwy pól jak w `BattleEventLog`), zgodnie z §2a.
4. **`wallBreached: Option<bool>`**: `None` = web pomija klucz; w JSON jawny `null` (konwencja crate'a, `lib.rs`).
5. **Wejście `OutcomeInput`**: jawny enum ścieżki + `screen_winner`. `end: Option<EndPath>` modeluje `_endWinner === null`
   (`?? winner`). Konstruktor `OutcomeInput::single` dla zwykłego przypadku (ekran otwarty przez tę samą ścieżkę).
6. **Jedna migawka rosterów** dla `survivors`, `eventLog` i `endStats`: web liczy `endStats` w `_showEndScreen`, a resztę
   w `onFinish`; po `finished = true` pętla nie zmienia już `hp`/`dead`/`routed`, więc to ta sama migawka. NIE_ZMIERZONO:
   zmiany rosteru w animacjach po końcu (np. `_removeUnitFromScene` ustawiające `dead`) między ekranem a kliknięciem
   „Zakończ bitwę” — jeśli wystąpią, `endStats` w webie byłyby z wcześniejszej chwili niż `eventLog`.
7. **`BattleOutcomeDto` poza `BattleViewDto`** (osobny typ, nie pole `battle`): wynik jest jednorazowy jak `onFinish`;
   wpięcie do korzenia snapshotu = decyzja przy P4-1I2/I4. `validate.rs` (src) nie jest na allowliście, dlatego walidacja
   jest metodą `BattleOutcomeDto::validate` w `battle.rs` i używa istniejących wariantów `ViewError` (`NonFinite`,
   `LengthMismatch`); nie sprawdza `hp > 0` ocalałych (brak wariantu bez zmiany `validate.rs`).
8. **E4** przyjmuje `attacker_has_live_siege_unit` z zewnątrz (predykat `isSiegeUnit` + `!dead` liczy wywołujący) do czasu
   P4-1I1B (#245).

## 6. Commit

SHA: `475b795a5583582dd93e9c94c1d281105bfb47a0` (korekta placeholdera `COMMIT_SHA` w obronie r1; gałąź `worktree-wf_8948228b-2a5-1`, rodzic `84ec520a5`). Commit jawnym `git add` listy plików z §1.
