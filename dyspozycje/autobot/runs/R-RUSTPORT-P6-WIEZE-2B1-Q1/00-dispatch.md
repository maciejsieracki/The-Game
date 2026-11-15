# DISPATCH R-RUSTPORT-P6-WIEZE-2B1-Q1 (runda 1)

TEMAT: WIEZE-2B1 — planowanie wystrzałów wież z odroczeniem 180 ms i usunięcie placeholdera `dead = true` (etap 2B z podziału WIEZE-MERGE, CZĘŚĆ 1 z 2). Strzał `_singleBlow` wieży to część 2B2 — NIE w tym temacie.
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: `7b52c3842` (czubek `origin/rust-port/parity-v2`). PRZED pracą: `git merge-base --is-ancestor 7b52c3842 HEAD` musi być prawdą; inaczej przestaw. Gałąź robocza: `wip/R-RUSTPORT-P6-WIEZE-2B1-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/battle/battleScene.ts` — `_fireSiegeTowers` (ok. 4208–4219: pętla po `siegeTowers`, pominięcie `destroyed`, `_destroyTowerAtRow` gdy brak kafla muru, `stagger += 180`, `_schedule(delay, ...)`).

## GOAL (część 1)
1. `fire_siege_towers` (`rust-port/engine/src/domain/siege_tactics_loop.rs` ok. 159–168 — placeholder `dead = true`; wołanie ok. 214–216): zamiast ustawiać `dead` na wybranym celu, PLANUJE wystrzał: dla każdej wieży, która nie jest zniszczona, w kolejności listy, z odroczeniem `stagger` (0, 180, 360 … ms) przez `SeqEvent::Schedule` (`siege_tactics_turnseq.rs` ok. 169, 321, 354). Stagger rośnie tylko dla wież, które faktycznie planują wystrzał (jak pin).
2. Wieża bez kafla muru (`wall_tile_rows` nie zawiera jej rzędu) jest niszczona (`_destroyTowerAtRow`) zamiast planowana — jak pin.
3. Wybór celu (`pick_tower_target`, już podpięty) wykonuje się w chwili wystrzału (w callbacku zaplanowanym), nie w chwili planowania — zgodnie z pinem, gdzie `_fireOneTower` wybiera cel przy odroczeniu.
4. Placeholder `dead = true` USUNIĘTY. Strzał sam (`_singleBlow`) NIE jest zaimplementowany w tym temacie: callback wystrzału zostaje pusty z jawnym komentarzem `// 2B2: strzał _singleBlow wieży` i wpisem w raporcie jako NIE_ZROBIONE. Nie udawaj zadanego obrażenia.

## ZAŁOŻENIA (zasada 9: parytet 1:1)
- Kolejność wież i stagger jak pin. Brak kafla muru → zniszczenie, nie wystrzał.
- Nie zmieniaj `pick_tower_target` ani `SiegeEnv` poza tym, co konieczne do planowania.

## ALLOWLISTA (tylko te pliki)
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (fire_siege_towers, placeholder)
- `rust-port/engine/src/domain/siege_tactics_turnseq.rs` (tylko jeśli potrzebny jest nowy wariant zdarzenia; najpierw sprawdź, czy `SeqEvent::Schedule` wystarcza)
- `rust-port/engine/tests/p6_siege_tactics_loop.rs`, `rust-port/engine/tests/p6_siege_tactics_loop_resume.rs` (tylko jeśli zmienia się sygnatura lub asercje o `dead`; osłabianie asercji ZAKAZANE — zamień na poprawne)
- `rust-port/engine/tests/p6_wieze_2b1.rs` (NOWY): testy planowania: stagger 0/180/360, pominięcie zniszczonej, zniszczenie bez muru, brak `dead = true` po planowaniu
- `rust-port/engine/tests/p6_wieze_2b1_gen.mjs` i `p6_wieze_2b1_vectors/vectors.json` (NOWE): generator wykonuje pin `_fireSiegeTowers` z mockiem `_schedule` (zwraca listę `(delay, wieża)`) i `_destroyTowerAtRow`; strażnik SHA-256 wyciętego fragmentu. Jeśli wyciągnięcie metody z klasy jest niewykonalne — NIE_ZROBIONE z uzasadnieniem, testy na wartościach z pina z cytatem linii.
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-2B1-Q1/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), `git add -A`, push do `parity-v2`.

## KRYTERIA KOŃCA
1. Test czerwony przed zmianą (placeholder ustawia `dead`): kod wyjścia i asercja.
2. Po zmianie: stagger 0/180/360 dla trzech wież, zniszczenie wieży bez kafla, brak `dead` po planowaniu.
3. Brak `#[ignore]`, brak osłabionych asercji, brak wołającego-martwego wrappera w `src/`.
4. Bramki EXIT 0 w `rust-port/engine` (z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_wieze_2b1`; `cargo test --test 'p6_siege*'`.
5. `git diff --stat` tylko na allowliście; `git diff --check` czysty.

## RAPORT I COMMIT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia, czerwony przed zmianą)/BLOKADY (w tym: co NIE zrobione — 2B2 strzał, _destroyTowerAtRow pełny efekt jeśli dotyczy)/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. Commit na `wip/…`, BEZ push. Treść commita bez nazwy modelu; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
