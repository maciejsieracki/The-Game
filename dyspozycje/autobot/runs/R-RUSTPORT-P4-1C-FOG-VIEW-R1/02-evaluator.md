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
