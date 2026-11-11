# P6-REPIN-ARMIA-FOLLOW-AUTOMERGE — REPIN web FALA 569

**Temat:** R-RUSTPORT-REPIN-ARMIA-FOLLOW-AUTOMERGE-Q1 (runda 1, Operator Haiku 5.5)
**Web (źródło prawdy):** `origin/main` cffe39cb9 — `gra/src/game/army-follow-auto-merge.ts`,
`gra/src/game/army-stack-limit.ts` (R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1, FALA 569).
**Baza Rust:** `rust-port/parity-v2` 3b15849b5.

## 1. Pomiar: istniejące odpowiedniki w Rust

| Element webowy | Rust przed tematem | Wynik |
|---|---|---|
| `followLeaderAutoMergeDecision` (army-follow-auto-merge.ts:28-41) | brak (grep `follow_leader`, `auto_merge`: 0 trafień) | PORT: `domain/army_follow_auto_merge.rs` |
| `canJoinStackAt` (army-stack-limit.ts:56-66) | brak wspólnej funkcji; `siege_enter_city.rs:88-93` liczy miejsce w stosie miasta po swojemu (lokalny `room`) | PORT: `can_join_stack_at` w nowym module (nie ruszono siege_enter_city) |
| `ownUnitCountAt` (army-stack-limit.ts:24-38) | brak wspólnej funkcji (logika tylko inline w siege) | PORT: `own_unit_count_at` |
| `hexHasRoomFor`, `stackFreeSlots` | nieużyte w tej decyzji | NIE PORTOWANE (poza zakresem) |
| `general_quick_follow.rs` / `generals.rs` `follow_general` | jest pole `follow_general` i logika podążania (REPIN-WOJNA-2) | ZOSTAJE bez zmian; nie jest źródłem decyzji merge |
| Monit scalenia `co_located_for_merge_prompt` (recruitment.rs:560, odpowiednik `armyMerge.ts:110`) | helper istnieje, **brak wywołania w Rust** (grep: tylko definicja) | DŁUG do serii W: podpięcie decyzji automatu w miejsce monitu |
| `promptMergeIfCoLocated` (web gra/src/main.ts:14518, wywołanie decyzji :14574) | nie ma w Rust miejsca wywołania | DŁUG do serii W (NIE BLOCK, zgodnie z dispatchem) |

## 2. Port

- `rust-port/engine/src/domain/army_follow_auto_merge.rs` (nowy): `FollowAutoMergeUnit`,
  `FollowAutoMergeDecision { None, Merge, LimitBlocked }`, `own_unit_count_at`, `can_join_stack_at`,
  `follow_leader_auto_merge_decision`.
- `rust-port/engine/src/domain/mod.rs`: `pub mod army_follow_auto_merge;` (addytywnie).

Zalozenia (ZALOZENIE):
- `undefined` z weba dla `followGeneral` / `isGeneral` -> `false`. Warunki `=== true` / `!== true`
  daja to samo, co potwierdzaja wektory (wpisy `null`).
- `limit` jako `i64` (web `number`, wartosc calkowita dodatnia z jednego zrodla).
- `canJoinStackAt` bierze wlasciciela z `moving[0]`, jak web.

## 3. Wektory z uruchomionego weba

- Generator: `rust-port/engine/tests/p6_repin_armia_follow_gen.mjs` (Node 22.22, `stripTypeScriptTypes`,
  moduly `army-stack-limit.ts` + `army-follow-auto-merge.ts` sklejone bez importu; źródło: `git archive origin/main gra/src` poza repo).
- Wyjście: `rust-port/engine/tests/p6_repin_armia_follow_vectors.json` — **3097 scenariuszy**
  (kartezjański zestaw 1 wodz/wlasna jednostka x 1-2 wchodzace x limity 1,2,3,4,5,500 x dwa heksy;
  + 2400 losowych, PRNG mulberry32 seed 569; wlasne jednostki na innym heksie, obcy właściciel na heksie,
  flagi true/false/undefined, wchodzaca już na heksie).
- Rozkład decyzji webowych: `none` 2531, `merge` 360, `limit-blocked` 206.

## 4. Testy

- `rust-port/engine/tests/p6_repin_armia_follow_auto_merge.rs`: 1 test wektorowy (3097 scenariuszy:
  decyzja + `canJoinStackAt`, z asercją minimalnego pokrycia: merge >= 100, limit-blocked >= 100, none >= 1000)
  + 5 testów jednostkowych (merge z generałem, brzeg limitu N/N+1, brak double-count, obcy właściciel
  i inny heks, brak decyzji bez wodza / bez podążania / wchodzący general).
- Mutacja kontrolna: `<=` zmienione na `<` w `can_join_stack_at` -> 4 testy FAIL; po przywróceniu 6/6 PASS.

## 5. Bramki (wynik)

- `cargo fmt -- --check` (crate `rust-port/engine`): PASS po `rustfmt` nowych plików.
- `cargo clippy --all-targets -- -D warnings`: PASS.
- `cargo test --test p6_repin_armia_follow_auto_merge`: 6 passed, 0 failed.
- `cargo test --lib`: 22 passed, 0 failed.
- Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w worktree (usuwany po bramkach).

## 6. Dług (nie blokuje)

- **W-seria:** wpiąć `follow_leader_auto_merge_decision` w ścieżkę ruchu (odpowiednik `promptMergeIfCoLocated`,
  Rust: `co_located_for_merge_prompt` w recruitment.rs:560 jako punkt wejścia), z decyzją `Merge` -> scal bez monitu,
  `LimitBlocked` -> hint bez scalania, `None` -> dotychczasowy monit.
- Stack-limit w Rust (siege_enter_city) nadal inline; po wpięciu można wspólną `own_unit_count_at` użyć też tam (osobny temat).
