# 03 — Final Control r1 — R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer, adapter DTO → wejścia renderera)
TEMAT: R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES
GOAL: adapter `cities[]`/`owners[]`/`wonders[]`/`CityBadgeDto`/`OwnerEmblemContext` → wejścia renderera wg pinu `07d2fbd72`, z mgłą z `FogSets` (Q1).
ZMIANY/COMMIT: oceniany SHA `bb6bd342e09c197164988a52b9b73f086b480cb1` (Obrona r1). Łańcuch: `601ff304c` (baza = `origin/rust-port/parity-v2`) → `232ab2c50` → `7f92fdee1` → `bb6bd342e`. `git merge-base --is-ancestor 601ff304c bb6bd342e` = TAK. Ten raport jest commitem FC na lokalnej gałęzi `wip/R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES-r1-fc` (rodzic `bb6bd342e`).
TESTY: zob. niżej (pomiar własny FC).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` (FF z `bb6bd342e` albo z commitu FC) + wpis w `REJESTR-RUST.md`.
DEPLOY/PUSH: NIE WYKONANO.

## Weryfikacja własna FC (na `bb6bd342e`, worktree detached)

- Allowlista: `git diff --stat 601ff304c bb6bd342e` = 5 plików: `src/view/cities.rs` (nowy), `src/view.rs` (+6: `pub mod cities;` i reeksport), `tests/view_adapter_cities.rs` (nowy), `01-operator-r1.md`, `02a-obrona.md`. Wszystko w allowliście. `view/terrain.rs` nietknięty. `Cargo.lock` nie w diffie (lokalna zmiana po buildzie cofnięta).
- `git diff --check` czysty; `#[ignore]` w kodzie: 0 (dwa trafienia wyłącznie w tekstach raportów).
- `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --all-targets --no-fail-fast` EXIT 0: 65 linii `test result` (1 lib + 64 pliki `tests/*.rs`), 519 passed / 0 failed / 0 ignored; `view_adapter_cities` 17/17.
- Mutacja własna FC: `civ_id: Some(o.civ_icon_id.clone())` dla wszystkich (barbarzyńca dostaje `Some`) → `barbarian_emblem_has_no_civ_id` FAIL (16/17). Plik przywrócony `git checkout`.
- Zgodność z pinem (odczyt `git show 07d2fbd72:gra/src/main.ts`): `_cityRenderOpts` 2939-3005 (getEra/getCiv/getLevel/getWallKind/isVisible/getMapOutlineKind/ownerColorFn), `syncWonderRender` 4314-4316 (tylko `ownerColorFn`), `setOwnerEmblemResolver` 10373-10384 (`civId: isBarbarian ? null`, `ringHex: barb || cityState ? null`), mgła 13503-13504 / 13512-13513 (`vis,true,ME()` / `ALL_KEYS,false`). Adapter odwzorowuje to 1:1.
- `CARGO_TARGET_DIR` FC (scratchpad/tgt-q3-fc) usunięty po bramkach; wolne 6,9 GB.

## Orzeczenia zarzutów Evaluatora

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | Brak produkcyjnego wołającego | ODDAL | Dispatch §ZAKRES pkt 4 i rozpoznanie §7 wyłączają wpięcie (integrator R5 poza zakresem). Obrona wskazała miejsca wpięcia (pętla sync mapy, R5, R1/Q6). Przypisanie ID tematu wpięcia = zadanie orkiestratora (#216), nie defekt tej paczki. |
| 2 | Fixture'y ręczne, parytet bajtowy NIE_ZMIERZONO | ODDAL | Dispatch wymaga wartości z definicji pinu z plik:linia — spełnione. E2E web→DTO→renderer zapisany jako NIE_ZMIERZONO (po producencie B-1B). |
| 3 | Adapter ściślejszy niż pin (błędy zamiast fallbacków) | ODDAL | Fallbacki pinu (`civTypeForOwner`→'grecy', `ikonaIdToBronzeCiv`→'grecja', `OWNER_COLORS_FALLBACK`) działają u producenta przed DTO; nieznany `bronze_civ`/brak w `owners[]` to naruszenie kontraktu DTO. Decyzja techniczna — wpis do `REJESTR-RUST.md` robi orkiestrator (tekst w 02a). |
| 4 | Rozbieżne liczby testów | ODDAL | Mój pomiar na `bb6bd342e`: 65 / 519 — potwierdza Operatora (518 + 1 nowy test Obrony). Liczby Evaluatora (69/563) nieodtworzone; przyczyna NIE_ZMIERZONO (prawdopodobnie inny stan katalogu/target). Bramki zielone u wszystkich. |
| 5 | Ta sama odznaka dla wszystkich miast | ODDAL (naprawione w Obronie) | `bb6bd342e`: `foreign_badge()` / `barbarian_badge()` + test `fixture_badges_follow_their_owner`; zielone. |
| 6 | Współdzielony `CARGO_TARGET_DIR` Operatora | ODDAL (proces) | Nie dotyczy kodu. Sprzątanie `scratchpad/tgt` = orkiestrator, gdy żaden cargo z niego nie korzysta. |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

## Uwagi dla orkiestratora (nie blokują)

1. Wpis do `dyspozycje/rust-port/REJESTR-RUST.md`: adapter zwraca `UnknownBronzeCiv`/`MissingOwner` zamiast fallbacku (fallback jest u producenta).
2. Nadać ID tematu wpięcia `CityInputs`/`WonderInputs`/`apply_*_fog`/`city_badge_input`/`owner_emblem_context` (pętla sync mapy, R5 `syncStatChips`, R1/Q6).
3. NIE_ZMIERZONO: L1 `revealAllLand`, L5 `wonderBuildSites`, integrator R5, L4 (część UI `isVisible`), parytet bajtowy E2E.
4. Usunąć `scratchpad/tgt` Operatora po zakończeniu Q2.
