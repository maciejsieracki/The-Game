# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — Evaluator r3 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (widok/DTO mgły; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1
GOAL: producent `FogViewDto` z `PlayableState` dla aktywnego fotela `ME()`, 1:1 z `refreshFog`/`currentVisible`/`currentVisibleForOwner` pinu `07d2fbd72`; eksploracja per fotel.
ZMIANY/COMMIT: oceniany kod `a17f28d42` (baza `2760b4f0c`, `merge-base --is-ancestor` OK), raport Operatora r3 `b48cff1a6` (`git diff a17f28d42 b48cff1a6 -- rust-port` pusty). Ten raport: commit na `b48cff1a6`, gałąź lokalna `rust-port-wip/p4-1c-fog-view-r3-eval`, bez push.
TESTY: wszystkie bramki odtworzone niezależnie, EXIT 0 (§2). Mutacje 7/7 FAIL (§3).
BLOKADY: brak.
RUNDY: 3/5
NASTĘPNY KROK: Final Control r3.
DEPLOY/PUSH: NIE WYKONANO

## 1. Zakres i allowlista (sprawdzone na `git diff --stat 2760b4f0c a17f28d42`)

| Plik | Allowlista | Uwagi |
|---|---|---|
| `rust-port/engine/src/domain/state.rs` (+335) | tak, „tylko producent” | Wyłącznie dopisany moduł `visibility::fog_view`, zero zmian w istniejącym kodzie. |
| `rust-port/engine/tests/p4_1c_fog_view.rs` (+375) | tak (`p4_1c_fog_*`) | 5 testów. |
| `rust-port/engine/tests/p4_1c_fog_vectors/gen.mjs` (+403) | tak (generator `.mjs`) | |
| `rust-port/engine/tests/p4_1c_fog_vectors/vectors.json` (+32464) | tak (dane testu) | |

Nie zmieniono: `gra/`, renderer, view-model, `Cargo.toml`, `Cargo.lock`. W diffie brak `#[ignore]`, `should_panic`, `todo!` i `unimplemented!`. Nie ma też osłabionych asercji, bo wszystkie testy są nowe.

## 2. Bramki (odtworzone przez Evaluatora; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)

Dysk: 12 GB przed startem i 11 GB przed bramką pełną engine. W trakcie równoległego buildu renderera spadł chwilowo do 7,4 GB; po usunięciu targetu renderera wrócił do 7,9 GB. Na koniec: 12 GB.

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --check` | EXIT 0 |
| engine `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine `cargo test --test p4_1c_fog_view` | EXIT 0, 5 passed |
| engine `cargo test --lib` | EXIT 0, 127 passed |
| engine `cargo test --all-targets --no-fail-fast` | EXIT 0: 522 binaria, 3893 passed, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, test sprzed tematu), 0 wystąpień `FAILED`/`panicked` |
| renderer `cargo fmt --check` | EXIT 0 |
| renderer `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| renderer `cargo test --all-targets --no-fail-fast` | EXIT 0: 77 binariów, 666 passed, 0 failed, 0 ignored |
| `node gen.mjs --check` (Node v22.23.4, wykonuje pin `07d2fbd72` przez `git archive`, straż SHA-256 15 fragmentów `main.ts`) | EXIT 0, „7 przypadkow zgodnych” |

Liczby są zgodne z raportem Operatora r3.

## 3. Mutacje (Evaluator, `--test p4_1c_fog_view`, plik przywracany po każdej)

| # | Mutacja | Wynik |
|---|---|---|
| a | unia sojuszników usunięta z `current_visible` | FAIL (1 test) |
| b | `explored` współdzielone (`values_mut().next()` zamiast `get_mut(&me)`) | FAIL (2 testy) |
| c | `reveal_all_land` → `false` w `explored_set_for_render` | FAIL (1 test) |
| d | sojusz obronny ignorowany w `alliance_formal_kind_between` | FAIL (2 testy) |
| e | kolejność heksów `q`-major zamiast `r`-major | FAIL (1 test) |
| f | `fog_active = fog_on` (bez `\|\| reveal_all_land`) | FAIL (1 test) |
| g | forty i posterunki pominięte (`fort_sight_sources` → pusty wektor) | FAIL (1 test) |

Po przywróceniu: 5/5 passed, a `git diff a17f28d42 HEAD -- rust-port` jest pusty. Uruchomienie testów zmieniło `rust-port/renderer/Cargo.lock`; przywrócono go `git checkout` i nie jest w commicie.

## 4. Parytet z pinem (czytany kod `07d2fbd72`)

- `ownPlayerVisibleHexes` (`main.ts:12968`), `currentVisible` (`:12995-13057`), `currentVisibleForOwner` (`:13059-13075`) i `refreshFog` (`:13475-13513`) mają w Rust odpowiedniki 1:1. Sprawdzone elementy: fallback startu przez `playerStartHexFor(ME())`; unia tylko przy `allianceFormalKindBetween !== null`; `aiOwnerCivMap` odpowiada graczom z `is_human == false` (drugi fotel człowieka bez unii, jest wektor); kolejność `addExplored(exploredByHuman.get(ME())!)` → `exploredSetForRender` → `useFogRender = fogOn || revealAllLand`; gałąź bez mgły daje `ALL_KEYS`.
- `unitSight` w webie to `buildUnitSightResolver(data.units, DEFAULT_SIGHT)` (`main.ts:1971`). Rust używa `build_unit_sight_resolver(defs, None)`, gdzie `None` oznacza `default_sight()`. Zgodne.
- Wektory pochodzą z wykonania kodu pinu, nie z ręcznie wpisanych liczb. Pokrycie: sam fotel; sojusz obronny i pełny; pakt i umowa szlaków bez unii; sojusz z drugim fotelem człowieka bez unii; `revealAllLand`; krąg startu; brak źródeł i brak startu; mgła wyłączona z `revealAllLand` i bez; fort `contestedUseless`; nieznany typ jednostki.
- Eksploracja per fotel (Z-FOG-2) nie ma wektora, bo pin ma jeden fotel. Jest test behawioralny `p4_1c_fog_explored_is_per_seat` i mutacja (b) go łamie. Zgodne z GOAL dispatchu.

## 5. Zarzuty (żaden nie blokuje)

1. **Brak wołającego produkcyjnego.** `refresh_fog` i `fog_view_dto` są wołane tylko w testach. Zależność jest jawna: DODATEK r3 wyłącza ją z zakresu, a `REJESTR-RUST.md` (gałąź `claude/rust-sivvrn`) ma wpis FOG-WIRE (L6/#308, `fog_active` w ViewerDto, odblokowuje #278/#279). Akceptuję jako dług nazwany. Orkiestrator przy integracji nie może oznaczyć tematu jako „wpiętego w grę”.
2. **Teoretyczna różnica przy forcie o promieniu ≤ 0.** Web `ownPlayerVisibleHexes` (`main.ts:12980-12982`) nie pomija źródła fortu z `radius <= 0`; dla promienia 0 `computeVisibleAt` zwraca heks środka. Rust liczy własną widoczność przez `compute_player_visibility_with_extra`, które takie źródło pomija (odpowiada `visibility.ts:304`). Promienie fortu i posterunku to stałe dodatnie (5/3, `cityTerritoryRadius(fortNodeAsCityNode)`), więc obecnie ta gałąź jest nieosiągalna. Bez zmiany kodu; do odnotowania, gdyby promienie fortów stały się zmienne.
3. **Proces: trailery z nazwą modelu w historii tematu.** `f56b2b796` (obrona r1) ma `Co-Authored-By: Claude Opus 5.5`, wbrew #289. Kod `a17f28d42` tego nie dotyczy. Poprawka w gestii orkiestratora przy integracji, jak zgłosił Operator.
4. **Pomiar czasu.** Pełny `cargo test` engine trwa dłużej niż 590 s w jednym wywołaniu pierwszoplanowym. Evaluator, tak jak Operator, uruchomił go w tle z zapisem `EXIT=` do logu. Wynik jest wiarygodny (EXIT 0, liczby zgodne); to tylko informacja dla FC.

## 6. Werdykt

PASS-WITH-NOTES. Kryteria końca dispatchu (producent, wektory pinu, eksploracja per fotel, mutacje a/b/c, bramki pełne engine i renderer) spełnione i odtworzone niezależnie. Zarzuty 1–4 nie blokują.

---

# (historia) Evaluator r1

# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — Evaluator r1 (adwersarialny)

STATUS: FAIL
DOMAIN: GAME (widok/DTO mgły; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1
GOAL: producent `FogViewDto` z `PlayableState` dla aktywnego fotela `ME()`, 1:1 z `refreshFog`/`currentVisible`/`currentVisibleForOwner` pinu `07d2fbd72`; eksploracja per fotel.
ZMIANY/COMMIT: oceniany kod `a17f28d42`, raport Operatora `ae209859c` (baza `2760b4f0c`, zgodna z DODATKIEM r2). Ten raport: commit na `ae209859c` bez push.
TESTY: patrz §2 (bramki cargo NIE odtworzone: dysk 2,9–4,1 GB < 8 GB).
BLOKADY: INFRA dysk (pełna bramka nieuruchomiona ani przez Operatora, ani przez Evaluatora).
RUNDY: 1/5
NASTĘPNY KROK: runda r2 Operatora — wyłącznie pełna bramka na `a17f28d42` po zwolnieniu dysku do ≥ 8 GB (bez zmian kodu), opcjonalnie notatka o braku wołającego (Z-2).
DEPLOY/PUSH: NIE WYKONANO

## 1. Zakres i allowlista (sprawdzone)

`git diff --stat 2760b4f0c ae209859c`: 5 plików —
`dyspozycje/autobot/runs/.../01-operator-r1.md`, `rust-port/engine/src/domain/state.rs` (+335, wyłącznie nowy `visibility::fog_view`),
`rust-port/engine/tests/p4_1c_fog_vectors/{gen.mjs,vectors.json}`, `rust-port/engine/tests/p4_1c_fog_view.rs`.
Wszystko w allowliście. Brak `Cargo.lock`, `gra/`, `view-model`, `renderer`, `domain/mod.rs`. Zależność `civ-view-model` w `engine/Cargo.toml` istniała już na bazie (linia 11).

## 2. Bramki odtworzone przez Evaluatora

| Bramka | Wynik |
|---|---|
| `df -h /` przed bramkami | 4,1 GB → 3,8 GB → 2,9 GB wolnego (spada przez inne workery); próg dispatchu 8 GB |
| `rustfmt 1.9.0 --check --edition 2021` na `state.rs` i `p4_1c_fog_view.rs` z `a17f28d42` (plik `state.rs` nie ma modułów zewnętrznych) | EXIT 0 |
| `node v22.23.4 gen.mjs --check` (pliki z `a17f28d42`, pin przez `git archive 07d2fbd72`) | `OK: 7 przypadkow zgodnych`, EXIT 0 (15 strażników SHA-256 przeszło) |
| `cargo clippy --all-targets -- -D warnings` engine/renderer | NIE ODTWORZONO (dysk < 8 GB) |
| `cargo test --test p4_1c_fog_view` | NIE ODTWORZONO (dysk < 8 GB); wynik Operatora 5/5 — niezweryfikowany |
| `cargo test --all-targets --no-fail-fast` engine i renderer | NIE WYKONANO przez nikogo |
| Mutacje (a)(b)(c) | NIE ODTWORZONO; przegląd statyczny potwierdza, że testy ich dotykają (§3) |

## 3. Przegląd merytoryczny (pin `07d2fbd72`, `gra/src/main.ts`)

- `ownPlayerVisibleHexes` (12968-12985), `currentVisible` (13007-13039), `currentVisibleForOwner` (13059-13075), `refreshFog` (13475-13513), `fogExploredForRender` (12864-12866) przeczytane i porównane z `fog_view`:
  unia sojuszników tylko dla `allianceFormalKindBetween != null` po `aiOwnerCivMap.keys()` (Rust: gracze `!is_human`); obustronna unia w `current_visible_for_owner` z `own_player_visible_hexes` (bez rekursji, jak web); fallback kręgu startu tylko przy pustej widoczności i tylko dla `playerStartHexFor(ME())`; `useFogRender = fogOn || revealAllLand`; bez mgły wszystkie heksy kod 2 (web `setFog(ALL_KEYS, ALL_KEYS)`); `addExplored` przed `exploredForRender` — zgodne.
- Wektory są z URUCHOMIONEGO pinu (fragmenty `main.ts` wycinane i haszowane, moduły `visibility.ts`, `okolica.ts`, `fort-territory.ts`, `diplomacy-treaties.ts` importowane w całości), nie ręczne. Scenariusze pokrywają: pakt/handel bez unii, sojusz AI↔AI (2-3) bez przechodniości, sojusz z drugim fotelem człowieka (5) bez unii, fort `contestedUseless`, miasto pop 0, nieznany typ jednostki (DEFAULT_SIGHT), `revealAllLand` z/bez mgły.
- Mutacje: (a) unia — `fotel_sojusznik` ≠ `sam_fotel` asertowane w `p4_1c_fog_vectors_cover_union_and_reveal_branches`; (b) per fotel — `p4_1c_fog_explored_is_per_seat` sprawdza heksy tylko-A jako `Unexplored` dla B; (c) `revealAllLand` — `reveal_all_land` ≠ `sam_fotel`. Wiarygodne.
- Brak `#[ignore]`, brak osłabionych asercji (asercje `assert_eq!` na pełnych wektorach `fog.state`, `vis`, `exploredForRender`, `exploredAfter`).

## 4. Zarzuty

1. **[BLOKUJĄCY, INFRA] Kryterium końca „BRAMKI (EXIT 0)” niespełnione.** `cargo test --all-targets --no-fail-fast` w `engine` i `renderer` oraz `cargo clippy --all-targets -- -D warnings` w `renderer` nie zostały uruchomione przez Operatora (raport: 5,7–6,2 GB), a Evaluator nie mógł odtworzyć żadnej bramki cargo (2,9–4,1 GB wolnego, próg dispatchu 8 GB). Zielone `fmt` i `gen.mjs --check` nie zastępują kompilacji/clippy/testów. Wymagane: pełna bramka na `a17f28d42` z kodami wyjścia po zwolnieniu dysku; kod bez zmian.
2. **[NOTA] Brak wołającego produkcyjnego.** `git grep 'fog_view::|refresh_fog('` na `a17f28d42` poza `tests/` zwraca tylko definicję — `refresh_fog` jest wołane wyłącznie z testów. Zakres dispatchu (producent) to dopuszcza, ale raport Operatora nie wskazuje jawnej zależności/tematu wpięcia (droga DTO → renderer, audyt L6 / `ViewerDto.fog_active`, PRIO-3D-11). Do dopisania w raporcie r2 lub w REJESTR-RUST przez orkiestratora.
3. **[NOTA] Eksploracja per fotel nie ma wektora pinu** (pin ma jeden fotel: `exploredByHuman = Map([[HUMAN_OWNER_PRIMARY, explored]])`, a `fogExploredForRender` czyta globalny `explored`). Z-FOG-2 jest zgodne z dispatchem, test jest behawioralny Rust — akceptowalne, ale orkiestrator powinien wpisać Z-FOG-2 do REJESTR-RUST jako decyzję techniczną (nie parytet zmierzony).

Brak zarzutów merytorycznych do logiki producenta; jedyny zarzut blokujący to niewykonana pełna bramka.
