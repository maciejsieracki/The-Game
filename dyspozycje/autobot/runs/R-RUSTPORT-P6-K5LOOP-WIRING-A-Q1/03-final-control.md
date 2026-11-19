# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Final Control r1

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A)
GOAL: SiegeBattleSession (start/step/skip/finish) nad SiegeLoop+ProdBody z adaptera T6 i pola T5, bez mostu
BAZA: dispatch 32006733b (parity-v2 w chwili startu); parity-v2 teraz 24c8f3b75 (I5A, tylko view-model/renderer),
      merge-tree z kodem obrony czysty
OCENIANY KOD: obrona-wiring-a = d1cc6266b (Operator r1 9cb5c8b31 + Evaluator 003e02a2a + obrona 932cdfe0a/4b7814549/d1cc6266b)
ZMIANY/COMMIT: tylko ten raport (gałąź lokalna fc-wiring-a na d1cc6266b)
TESTY: fmt EXIT 0; clippy -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT=0
       (543 x ok, 4134 passed / 0 failed / 1 ignored — istniejący, spoza diffu); p6_k5loop_wiring_a 22/22;
       wektory generatora pinu: BRAK (generator nie istnieje)
BLOKADY: Z1 (główne kryterium końca dispatchu niespełnione)
RUNDY: 1/5
NASTĘPNY KROK: runda r2 Operatora z tym samym ID: generator pinu pełnej bitwy (≥ 6 scenariuszy, guard SHA, MD5)
               na kodzie d1cc6266b; albo DODATEK orkiestratora w 00-dispatch.md wydzielający B1 i formalnie
               zmieniający kryterium końca części A
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Bramki odtworzone samodzielnie (worktree FC, kod d1cc6266b)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`wiringa-fc/target`), usunięty po bramkach (dysk po: 11 GB wolne).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` (`rust-port/engine`) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | `EXIT=0`; 543 × `test result: ok`; 4134 passed / 0 failed / 1 ignored |
| `p6_k5loop_wiring_a` | 22 passed |
| wektory generatora pinu (MD5) | **BRAK** — `engine/tests/p6_k5loop_wiring_a_gen.mjs` i katalog wektorów nie istnieją |
| `git diff --check 32006733b..d1cc6266b` | czysto |
| `#[ignore]` w diffie kodu | brak (trafienia tylko w tekstach raportów) |
| `Co-Authored-By` w commitach tematu | 0 |
| `git merge-tree` z bieżącym `origin/rust-port/parity-v2` (24c8f3b75) | czysty |

Allowlista (`git diff --stat 32006733b..d1cc6266b`): `domain/mod.rs` (+1, `pub mod`), `domain/siege_battle_session.rs`
(nowy), `domain/siege_tactics_loop.rs` (+282/−18: `BlowComposer::compose_tower`/`terrain_defence_mult`, `TowerBlowSite`,
`tower_shooter_cu`, gałąź kompozytora w `tower_blow_full`, `current_tdm`, publiczny krok czasu rzeczywistego),
`tests/p6_k5loop_wiring_a.rs` (nowy), pliki runu. Nic poza allowlistą (`bridge.rs`, `bridge_contract.rs`, `renderer/`,
`view-model/`, `client/`, `src-tauri/`, `gra/**`, `Cargo.*`, `REJESTR-RUST.md` nietknięte). Testy istniejące przed tematem
bez zmian asercji.

## 2. Orzeczenia

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| Z1 — brak wektorów pinu pełnej bitwy (≥ 6 scenariuszy, generator TS z guardem SHA, MD5) | **NAPRAW** | Pierwsze, twarde kryterium końca dispatchu. Operator i Obrona przyznają brak. `zlote_wyniki_sesji` to skrót FNV wyników Rusta — zamrożenie regresji, nie dowód parytetu; Z2 pokazał, że taki skrót utrwalił już raz wynik rozbieżny z pinem (`dcd224435100671a` → `619d9ea6ba687f71`, `mur_machiny` t19 → t38, `mur_taran_katapulta` t43 → t50). Dispatch nie ma DODATKU zmieniającego kryterium; wydzielenie B1 to decyzja techniczna orkiestratora (CLAUDE.md, zasada 9/8), nie właściciela — nie jest to „DO DECYZJI CZŁOWIEKA” w sensie pytania ABC. Do czasu wektorów nie wiadomo, czy wyniki „remis po 150 turach” w 3 z 6 scenariuszy są wynikami pinu. |
| Z2 — trafienie wieży na neutralnym szablonie (Obrona 0 / Pancerz 0 / maxHp 10) | **ODDAL** (zamknięty poprawką obrony) | Sprawdzone w kodzie: `ProdBody::tower_blow_full` przy kompozytorze bierze `BlowComposer::compose_tower` (`siege_battle_session.rs:529-610`): realny `defender` i `max_hp` celu, `def_on_wall` i `civ_wall_defense_multiplier` na koronie, `blow_env_for` (teren kafla celu, obrona miasta), `mods_for_parts` strzelca z bonusami strony obrońcy, trudności obu stron, kontra z `sh.counters`; łuk `relative_hit(facing celu, wallCol, row, q, r)` jak pin `:8880`. Brak strzelca w kompozytorze → jawny tag `wieza-bez-kompozytora`, nie cichy szablon. Mutanty O03–O11 zabite. Zgodność liczbowa z pinem nadal niezmierzona — to część Z1, nie osobny zarzut. |
| Z3 — przeżywające mutanty E2/E3, M16/M23 „równoważne na danych” | **ODDAL** (zamknięty) | Testy `wieza_zabicie_ripple_i_padl`, `wieza_trafienie_uciekajacego_tag_rout`, `kompozytor_mur_cywilizacji_obroncy`, `kompozytor_las_cywilizacji_obroncy` obecne i zielone w pełnym przebiegu FC; skrypt obrony raportuje 17/17 zabitych. |
| Z4a — `terrain_defence_mult` z kafla startowego | **ODDAL** (zamknięty) | `current_tdm` z bieżącego kafla (`_checkRout :9790-9792`) w `check_rout` i przed `_activateUnit`; testy `checkrout_z_biezacego_kafla`, `checkrout_okrazenie_z_biezacego_kafla` zielone. |
| Z4b — `attack_pre` E8/E22/E30 NIE_ZMIERZONO | **ODDAL** | Zmierzone sondą obrony (78 bitew: 43 × `dur = 0`, `attack_pre > 0` = 0); tekst sondy w `02a-obrona-sonda.rs.txt`. Przypadek `> 0` zostaje w długach z odwołaniem do `:8223`/`:8277`. |
| Z4c — walidacja `wall_delta_ms` po `play()` | **ODDAL** (zamknięty) | Walidacja przed `play()`; test `step_niepoprawny_czas_nie_startuje_bitwy` zielony. |
| Z4d — `speedMul`/clamp bez decyzji | **ODDAL** | D-WIRA-12: `speedMul = 1` (UI-only w pinie `:9517-9526`, domyślnie 1 `:2555`), clamp nieaktywny przy klatkach 16 ms. |

Jeden NAPRAW (Z1) → **FAIL**.

## 3. Wymagane w r2 (ten sam ID; baza = d1cc6266b, kod obrony zachować)

1. Generator `engine/tests/p6_k5loop_wiring_a_gen.mjs` wykonujący tekst pinu `07d2fbd72` (guard SHA) od konstruktora
   `BattleScene` (teren, `_carveWallTiles`, `_placeSiegeTowers`, `_placeUnits`) przez `_startBattle`, tury, zegary,
   `_fireSiegeTowers`, `_singleBlow`/`_resolveBlowOutcome` do wyniku, z deterministycznym `Math.random` zgodnym z
   `SessionRolls`; ≥ 6 scenariuszy (z/bez muru, z/bez machin, różne liczności, wyłom, ucieczka, sufit tur);
   wektory w repo + MD5 odtwarzalne; test Rust porównujący wynik sesji bajt w bajt (zwycięzca, HP ocalałych, liczniki
   akcji). Rozbieżności naprawić w sesji/pętli albo zapisać jako blokadę z liniami pinu.
2. Po wektorach zastąpić lub uzasadnić `zlote_wyniki_sesji` (skrót Rusta) — nie może być jedynym dowodem wyniku.
3. Alternatywa (decyzja orkiestratora, nie Operatora): DODATEK w `00-dispatch.md` wydzielający B1 jako
   `R-RUSTPORT-P6-K5LOOP-WIRING-A-PIN-Q1` i formalnie zmieniający kryterium końca części A; wtedy kolejny FC ocenia
   część A wg nowego kryterium.

## 4. Długi (bez zmian względem §6 obrony)

| ID | Stan |
|---|---|
| Z1 / B1 — wektory pinu pełnej bitwy | OTWARTE (powód FAIL) |
| `attack_pre > 0` (E8/E22/E30) | zmierzone jako nieosiągalne w 78 bitwach; osiągalność w pinie `:8223`/`:8277` niezmierzona |
| bonus „leśny” na `Plaskie (rownina/laka)` (podciąg „las”, `terrain_is_forest_or_jungle`) | zachowanie istniejącego portu `bonusApplies`, poza zakresem; do sprawdzenia z pinem przy wektorach (może zmieniać wyniki) |
| pozostałe z `01-operator-r1.md` §7 | bez zmian |

## 5. Uwaga dla integracji (gdy r2 przejdzie)

`origin/rust-port/parity-v2` przesunął się na `24c8f3b75` (I5A, `view-model`/`renderer`); `git merge-tree` z
`d1cc6266b` czysty — r2 może zostać na bazie d1cc6266b.
