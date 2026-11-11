# P6-ZAPIS-MIGRACJE-FALA509 — pomiar luk zapisu (runda 1)

Baza: `origin/rust-port/parity-v2` @ `7f38322ae`. Web: `origin/main` (rewizja z dispatchu). Oznaczenia: ZMIERZONO = grep/odczyt pliku w tej rundzie; NIE_ZMIERZONO = nie sprawdzone.

## 1. Tabela luk

| Pozycja | Web (origin/main) | Rust (baza) | Status |
|---|---|---|---|
| `meta.autoBuildEnabled` | `main.ts:46701` `autoBuildEnabled = autoBuildFromSaveMeta(saved.meta?.autoBuildEnabled)`; `game/auto-build-gate.ts:38` (tylko `=== true`); brak pola = WYŁ. | Helper `auto_improvements/auto_build_gate.rs:42` `auto_build_from_save_meta` istnial, bez wywolania w sciezce zapisu. Pole w `SaveMeta.extra` (flatten) — round-trip zachowany. | ZROBIONE (accessor `SaveMeta::auto_build_enabled`, test). Podpiecie wartosci do stanu gry po wczytaniu: NIE_ZMIERZONO (konsument `pickAutoImprovements` nie przeszukany). |
| `meta.playerEpochWarEnabled` | `main.ts:46706` `typeof === 'boolean' ? v : true`; zapis `main.ts:9991` | Helper `diplomacy_multiwar.rs:209` `player_epoch_war_enabled` (uzywany tylko w testach). | ZROBIONE (accessor `SaveMeta::player_epoch_war_enabled`, test). Konsument: NIE_ZMIERZONO. |
| `warRulesEraWarCountByCiv` (ZAPIS-ERAWAR) | zapis/odczyt `main.ts:35745`, `:44950` | `save_load.rs` `era_war_count_by_civ`, `diplomacy_multiwar::restore_era_war_counts` | ZGODNE, juz zintegrowane — NIE duplikowane. |
| Nadmiar wodzow ponad limit epoki (migracja) | `game/generals.ts:38` `planGeneralLimitDemotions` (najstarsi zostaja, reszta = zwykla jednostka); wywolanie `main.ts:46568` | `domain/generals.rs:48,70` `general_limit_for_era`, `general_slots_used`; BRAK funkcji demotion (0 trafien `demot`/`planGeneral`) | LUKA. Wymaga migracji na `GameStateDto` (flaga wodza + epoka wlasciciela) przy wczytaniu. NIE wykonano w tej rundzie. |
| Siatka stosu >limit na starcie tury | `game/army-stack-limit.ts` (`stackLimitBlockMessage`, `stackLimitSplitNotice`), relokacja nadwyzki `main.ts:4350` (w trakcie marszu, nie migracja zapisu) | 0 trafien limitu stosu w `rust-port/engine/src` (`stack_limit`, `STACK_LIMIT`) | LUKA; NIE_ZMIERZONO, czy web ma migracje przy wczytaniu (nie znaleziono grepem `migr.*stos` w `save.ts`/`main.ts`). |
| Niespojny wlasciciel cudu | Web: NIE ma migracji zapisu (0 trafien `wonder.*migr`, `cud.*migr` w `save.ts`/`main.ts`) | — | Zgodnie z dispatchem: NIE portowano migracji. NIE_ZMIERZONO w `wonders-data.ts`. |
| `plannedMarches` | `planned-march.ts:485` | `save_load.rs:97` pole `planned_marches` (`SavedPlannedMarch`, lenient `destQ/destR`), `pathfinding.rs:2250` | ISTNIEJE; zgodnosc formatu z webem NIE_ZMIERZONO w szczegolach. |
| Pola dyplomacji/oblezenia (W1 raw JSON) | — | `WarTurnState` w `meta` (W1, `save_load.rs:178`) | NIE_ZMIERZONO (zakres poza ta runda). |
| Wektory z weba (Node 22, `git archive origin/main gra/src gra/data`) | — | — | NIE WYKONANO w tej rundzie. |

## 2. Zmiany w tej rundzie

- `rust-port/engine/src/domain/save_load.rs`: dwa accessory na `SaveMeta` (`auto_build_enabled`, `player_epoch_war_enabled`) + importy `#[cfg(not(test))]`/`#[cfg(test)]` (wzorzec pliku, sciezka testowa).
- `rust-port/engine/tests/p6_zapis_migracje_meta_flags.rs` (nowy): 5 testow `p6_zapis_migracje_*`.

## 3. Otwarte (nastepna runda)

1. Migracja nadmiaru wodzow (`planGeneralLimitDemotions`) przy wczytaniu — Rust, `domain/save_migrations*.rs`.
2. Podpiecie `auto_build_enabled` / `player_epoch_war_enabled` do stanu gry po wczytaniu (konsumenci w Rust).
3. Limit stosu na starcie tury — potwierdzic najpierw, czy web ma migracje przy wczytaniu.
4. Wektory z weba dla testow z pelnym `SaveSnapshot` (stary i nowy zapis).
