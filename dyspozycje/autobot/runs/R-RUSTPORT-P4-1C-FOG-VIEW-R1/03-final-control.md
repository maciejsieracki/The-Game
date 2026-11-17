# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — Final Control r3

STATUS: PASS-WITH-NOTES
DOMAIN: GAME=nie (producent widoku/DTO mgły; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1
GOAL: producent `FogViewDto` z `PlayableState` dla aktywnego fotela `ME()` (widoczność z unią sojuszników, eksploracja per fotel, `fogOn`/`revealAllLand`) zgodny z pinem `07d2fbd72`.
ZMIANY/COMMIT: kod `a17f28d42` (bez zmian od r1); łańcuch r3: `b48cff1a6` (Operator) → `e894fd007` (Evaluator) → `b031654ac` (Obrona) → ten raport (commit FC na `b031654ac`).
RUNDY: 3/5 (r1 FC FAIL = wyłącznie INFRA; r3 = pełna bramka na niezmienionym kodzie)
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja samodzielna FC (checkout `b031654ac`, detached)

- Ancestry: `git merge-base --is-ancestor 2760b4f0c a17f28d42` = OK; rodzic `a17f28d42` = `2760b4f0c` (baza DODATKU r2/r3). `git log 2760b4f0c..b031654ac` = 8 liniowych commitów (kod + raporty).
- Kod niezmieniony: `git diff --stat a17f28d42 b031654ac` obejmuje wyłącznie 5 raportów w `dyspozycje/autobot/runs/...`; zero zmian w `rust-port`.
- Allowlista (`git diff --stat 2760b4f0c a17f28d42`): `engine/src/domain/state.rs` (+335, wyłącznie moduł `visibility::fog_view`), `engine/tests/p4_1c_fog_view.rs` (+375), `engine/tests/p4_1c_fog_vectors/gen.mjs` (+403), `.../vectors.json` (+32464). Brak `Cargo.lock`, `gra/`, renderer, view-model. W zakresie.
- `#[ignore]` w teście tematu: brak; asercje porównują pełne `fog.state`, `visible`, `explored_for_render` z wektorami pinu.
- DYSK: 9,1 GB na starcie (≥ 8 GB), 8,6–9,1 GB w trakcie bramek, 13 GB po usunięciu `CARGO_TARGET_DIR`.

## Bramki (env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --check` | EXIT 0 |
| engine `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine `cargo test --test p4_1c_fog_view` | EXIT 0, 5 passed |
| engine `cargo test --all-targets --no-fail-fast` | EXIT 0; 522 binaria, 3893 passed, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, sprzed tematu); 0 `FAILED`/`panicked` |
| renderer `cargo fmt --check` | EXIT 0 |
| renderer `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| renderer `cargo test --all-targets --no-fail-fast` | EXIT 0; 77 binariów, 666 passed, 0 failed |
| `node engine/tests/p4_1c_fog_vectors/gen.mjs --check` (Node 22.23.4, wykonuje pin `07d2fbd72`) | EXIT 0, „OK: 7 przypadkow zgodnych” |

Pełną bramkę uruchomiono jednym skryptem w tle z zapisem EXIT każdego kroku do logu (pojedyncze wywołanie pierwszoplanowe ma limit 590 s). Testy zmieniły `rust-port/renderer/Cargo.lock`; przywrócono `git checkout`, nie jest w commicie.

## Mutacje (FC odtworzyła samodzielnie, po każdej przywrócenie i 5/5 zielone)

| Mutacja | Wynik |
|---|---|
| (a) bez unii sojuszników (`visible.extend(current_visible_for_owner(...))` usunięte) | FAIL `p4_1c_fog_vectors_match_pinned_web` |
| (b) eksploracja współdzielona (`get_mut(&me)` → `values_mut().next()`) | FAIL `p4_1c_fog_explored_is_per_seat`, `p4_1c_fog_missing_seat_is_error` |
| (c) pominięty `revealAllLand` (`explored_set_for_render(..., false)`) | FAIL `p4_1c_fog_vectors_match_pinned_web` |

## Zgodność z pinem (odczyt FC)

- `currentVisible` (`main.ts:13007`): unia `currentVisibleForOwner` dla `aiOwnerCivMap.keys()` z sojuszem formalnym, fallback `playerStartHexFor(ME())` / pusty — Rust `current_visible` 1:1.
- `currentVisibleForOwner` (`main.ts:13059`): `computePlayerVisibility` + unia `ownPlayerVisibleHexes` przy sojuszu i `!isMe` — 1:1.
- `refreshFog` (`main.ts:13475`): `addExplored(exploredByHuman.get(ME())!, vis)`, `useFogRender = fogOn || revealAllLand`, `else` → `ALL_KEYS` (kod `Visible` dla każdego heksa) — 1:1.
- Pętla jednostek w `ownPlayerVisibleHexes` i w `computePlayerVisibility` (`visibility.ts:292-295`) — identyczna (brak strażnika `sight`), więc wspólny rdzeń Rust jest równoważny.

## Orzeczenia zarzutów (Evaluator r3 + Obrona r3)

0. Podsumowanie Evaluatora (bramki zielone, mutacje FAIL) — **ODDAL** (nie jest zarzutem; FC potwierdza wszystkie liczby niezależnie: 522/3893/0/1 i 77/666/0, mutacje a/b/c FAIL).
1. Brak wołającego produkcyjnego `refresh_fog`/`fog_view_dto` — **ODDAL** jako zarzut wobec tematu. DODATEK r3 jawnie wyłącza wołającego z zakresu (FOG-WIRE, L6/#308). Warunek integracji: oznaczyć w rejestrze jako „producent gotowy, niewpięty”, nie „wpięty w grę”.
2. Fort z `radius <= 0` (web `ownPlayerVisibleHexes` bez strażnika vs Rust przez `compute_player_visibility_with_extra`) — **ODDAL**. Dowód z pinu: `fortSightSources` (`fort-territory.ts:390-400`) ustawia `radius = cityTerritoryRadius(...)`, które dla fortu/posterunku zwraca stałe `FORT_TERRITORY_RADIUS = 5` / `OUTPOST_TERRITORY_RADIUS = 3` (`map/territory.ts`); gałąź nieosiągalna, brak różnicy obserwowalnej. Strażnik Rust = `visibility.ts:304`.
3. Trailer z nazwą modelu w `f56b2b796` (wbrew #289) — **ODDAL** jako zarzut wobec kodu (kod `a17f28d42` czysty). Poprawka procesowa orkiestratora przy integracji (squash/reword łańcucha raportów).
4. Pełny `cargo test` engine > 590 s; `renderer/Cargo.lock` modyfikowany przez testy — **ODDAL** (informacja; FC potwierdza: uruchomienie w tle z EXIT w logu, `Cargo.lock` przywrócony i poza commitami).

Zero NAPRAW → werdykt PASS-WITH-NOTES.

## Uwagi do integracji (orkiestrator)
- Integrować kod `a17f28d42` (rodzic = baza `2760b4f0c`); raporty z łańcucha `b031654ac` + ten commit FC.
- Rejestr: FOG-WIRE (wołający produkcyjny) jako osobny temat; status FOG-VIEW = „producent gotowy, niewpięty”.
- Trailer `f56b2b796` z nazwą modelu — skorygować przy integracji.
- Decyzje człowieka: brak.

TESTY: jak w tabeli bramek — wszystkie EXIT 0; mutacje a/b/c FAIL.
BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora (FF/merge na `rust-port/parity-v2` po merge-tree), wpis w REJESTR-RUST, potem tematy zależne (F2 TERRITORY-RANGES, L1/L2 REVEAL, FOG-WIRE).

---

# Historia: Final Control r1

STATUS: FAIL (BLOCK INFRA: pełna bramka cargo niewykonana, dysk < 8 GB; kod bez zarzutów merytorycznych)
DOMAIN: GAME=nie (producent widoku/DTO mgły)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1
GOAL: producent `FogViewDto` z `PlayableState` dla aktywnego fotela `ME()` (widoczność z unią sojuszników, eksploracja per fotel, `fogOn`/`revealAllLand`) zgodny z pinem `07d2fbd72`.
ZMIANY/COMMIT: kod `a17f28d42`; łańcuch raportów `ae209859c` → `1e30517ba` → `f56b2b796` → ten raport (commit FC na `f56b2b796`).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja samodzielna FC

- Baza (DODATEK r2): `2760b4f0c`. `git log --oneline 2760b4f0c..f56b2b796` = 4 liniowe commity (a17f28d42, ae209859c, 1e30517ba, f56b2b796) — ancestry liniowa, baza jest przodkiem.
- Allowlista (`git diff --stat 2760b4f0c f56b2b796`): `engine/src/domain/state.rs` (+335), `engine/tests/p4_1c_fog_view.rs` (+375), `engine/tests/p4_1c_fog_vectors/gen.mjs` (+403), `.../vectors.json` (+32464), 3 raporty runs. Brak `Cargo.lock`, `gra/`, view-model, renderer. W zakresie.
- `rustfmt --edition 2021 --check src/domain/state.rs tests/p4_1c_fog_view.rs` (checkout `f56b2b796`): EXIT 0.
- `node tests/p4_1c_fog_vectors/gen.mjs --check`: `OK: 7 przypadkow zgodnych`, EXIT 0 (wektory odtwarzalne z pinu, strażniki SHA zielone).
- `#[ignore]` w `p4_1c_fog_view.rs`: brak.
- DYSK: `df -h /` na starcie FC = 6,4 GB, po checkoucie = 5,3 GB. Próg dispatchu 8 GB. Zgodnie z dispatchem bramek cargo (clippy, `--test p4_1c_fog_view`, `--all-targets --no-fail-fast` w engine i renderer, mutacje) NIE uruchomiono.

## Orzeczenia zarzutów

1. [BLOKUJĄCY, INFRA] Brak pełnej bramki cargo (EXIT 0) — **NAPRAW**. Kryterium końca „BRAMKI (EXIT 0)” nie jest spełnione przez żaden etap (Operator, Evaluator, Obrona, FC); FC potwierdza dysk 5,3–6,4 GB < 8 GB. Nie jest to wada kodu, ale bez bramki nie wolno wystawić PASS. Wymagane w r2 (bez zmian kodu, baza `a17f28d42`/`f56b2b796`): po zwolnieniu dysku do ≥ 8 GB — `cargo fmt --check` i `cargo clippy --all-targets -- -D warnings` w engine i renderer, `cargo test --test p4_1c_fog_view`, `cargo test --all-targets --no-fail-fast` w obu crate'ach, odtworzenie mutacji (a), (b), (c).
2. [NOTA] Brak wołającego produkcyjnego — **ODDAL** (jako zarzut wobec tematu). Zakres dispatchu to sam producent; wpięcie (droga DTO do renderera L6/#308, `ViewerDto.fog_active`, PRIO-3D-10/11) to osobny temat. Orkiestrator zakłada R-RUSTPORT-P4-1C-FOG-WIRE i wpis w REJESTR-RUST (decyzja techniczna orkiestratora, nie właściciela).
3. [NOTA] Z-FOG-2 bez wektora z pinu (pin ma jeden fotel) — **ODDAL**. Zachowanie dla jednego fotela zgodne z pinem (7 wektorów); per-fotel wynika z `exploredByHuman.get(ME())` w pinie. Orkiestrator wpisuje Z-FOG-1..4 do REJESTR-RUST jako decyzje techniczne, nie zmierzony parytet.

Jeden NAPRAW → werdykt FAIL.

## Uwagi do integracji
- Trailer commitów `f56b2b796` (i ewentualnie wcześniejszych) zawiera nazwę modelu, wbrew #289 — do skorygowania przy integracji (squash/reword) przez orkiestratora.
- Decyzje człowieka: brak (wszystkie kwestie są techniczne lub INFRA).

TESTY: rustfmt EXIT 0; gen.mjs --check EXIT 0; cargo — NIE WYKONANO (dysk 5,3 GB < 8 GB).
BLOKADY: INFRA dysk.
NASTĘPNY KROK: r2 tego samego ID po zwolnieniu dysku ≥ 8 GB — wyłącznie bramki na `a17f28d42`, bez zmian kodu; potem Evaluator/FC.
