# 02 — Evaluator (adwersarialny) — R-RUSTPORT-P4-1B-Q3-MAP-VIEW, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q3-MAP-VIEW
GOAL: producent `MapViewDto` + `HexDynDto` z `&SnapshotMap` (P4-1B / #211), walidacja `riverRenderPaths.len == rivers.len`
ZMIANY/COMMIT: oceniany kod `6b1b5c8ed`, raport `81befe806`; rodzic `2f9a12786` (= `origin/rust-port/parity-v2` w chwili startu; parity od tego czasu poszło do `400fd0bd1` — P4-1J generalTarget, rozłączne pliki). Ten raport: commit na gałęzi `worktree-wf_c431c5de-ee5-2`, bez push.
TESTY: niżej (odtworzone samodzielnie, CARGO_TARGET_DIR w scratchpad poza repo).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona → Final Control
DEPLOY/PUSH: NIE WYKONANO

## Allowlista (`git diff --stat 2f9a12786 81befe806`)

11 plików, wszystkie w allowliście: `engine/src/domain/map_view.rs` (nowy, 466), `domain/mod.rs` (+1 linia `pub mod map_view;`), `view-model/src/validate.rs` (+15/-2), `view-model/tests/validate.rs` (+59), `engine/tests/p4_1b_map_view.rs` (nowy), `p4_1b_map_view_vectors/{gen.mjs,vectors.json}` (nowe), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-Q3-MAP-VIEW/**` (raport, 2 skrypty mutacji, dowód). Brak `Cargo.lock`, brak zmian w `gra/`.
(Uwaga: `git diff` względem AKTUALNEGO parity pokazuje „usunięcia” plików P4-1J — to tylko ruch parity po starcie, nie zmiana Operatora; integrator musi zrobić merge, nie podmianę.)

## Bramki odtworzone (kody wyjścia)

| Bramka | EXIT |
|---|---|
| `cargo fmt --check` (engine) | 0 |
| `cargo fmt --check` (view-model) | 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | 0 |
| `cargo clippy --all-targets -- -D warnings` (view-model) | 0 |
| `cargo test --lib` (engine) | 0 — 121 passed (patrz zarzut 6) |
| `cargo test --test p4_1b_map_view` | 0 — 12 passed |
| `cargo test` (view-model, wszystkie binarki) | 0 |
| `node gen.mjs --check` (Node v22.23.4, pin `07d2fbd72`) | 0 — „OK: vectors.json zgodny (6 map)” |
| `mutate-r1.py` (M1–M7) + `mutate-vm-r1.py` (M8), uruchomione ponownie | 8/8 WYKRYTA (exit 101) |
| Mutacje dodatkowe Evaluatora (skrypt w scratchpad, źródło przywrócone) | 4/4 wykryte |

Mutacje dodatkowe Evaluatora (wszystkie czerwone):
- E1 `terraces: false` → `hex_dyn_bajt_w_bajt_z_pinem`;
- E2 brak rodzaju → `Some(Main)` zamiast `None` w `rivers` → `map_view_bajt_w_bajt_z_pinem`;
- E3 `covering_improvement` = „jakikolwiek klucz” (droga też) → `hex_dyn_bajt_w_bajt_z_pinem`;
- E4 `mainPathsForJunction` tylko z jawnym `Some(Main)` (bez `?? 'main'`) → `map_view_bajt_w_bajt_z_pinem`.

`grep` po diffie: brak `#[ignore]`, brak `should_panic`, brak osłabionych asercji (asercje bajt w bajt na serializacji DTO, liczniki pokrycia liczone w Rust).

## Zgodność z pinem (sprawdzone ręcznie w `git show 07d2fbd72:...`)

- `scene.ts:1306` `mainPathsForJunction = paths.filter((_, i) => (kinds[i] ?? 'main') === 'main')` — Rust `kind_of(i)` = `None → Main`. Zgodne.
- `scene.ts:1312-1318`: `medium` → `trimMediumRenderPathAtMain` → `mediumRiverRenderPath`; reszta → `landRiverRenderPath(path)`. Zgodne.
- `scene.ts:2873-2874` + `filterRiverPathsForStage` (`:1534-1553`): domyślny etap 2 = main+medium; filtr zachowuje WSZYSTKIE trasy main (`stage >= 1`), więc trim średnich liczony na pełnym zbiorze main w producencie daje ten sam wynik co web po filtrze. Filtry długości `<2`, `>512`, `>480` pozostają w rendererze — producent zwraca trasę dla każdej rzeki (1:1). Poprawne.
- `main.ts:3144-3147` `hexHasRoadAt` = `!!hex && hexHasRoad(hex)` bez mgły — Rust `road_keys.contains(hex_key(q,r))`. Zgodne.
- `main.ts:3365-3368` wioska: `hex.wioska.istnieje` i brak miasta na `(q,r)`. Zgodne.
- `terrain-improvements.ts:358-392`, `road-movement.ts:59-67`: `nakladka` nie wpływa na klucze → `HexLike.nakladka = None` bezpieczne (Z-Q3-5).
- Generator wykonuje kod pinu (cały `mapSnapshot.ts` i `road-network.ts`, fragmenty ze strażnikiem SHA-256 i kontrolą sygnatury/zamknięcia funkcji), nie ręcznie pisane oczekiwania. Wektory: 6 map, w tym 1×1, mapy tasowane, bez `riverPathKinds`, `riverPathKinds` krótsze; rodzaje main/medium/short/tributary/None ≥ 3 każdy.

## Wołający

Brak produkcyjnego wołającego `build_map_view` / `build_hex_dyn` w Rust — jawna, zapisana zależność: P4-1G (renderer/src/view.rs, składanie `RenderViewDto`), zgodnie z kryterium 4 dispatchu (NIE_ZMIERZONO w raporcie Operatora §NIE_ZMIERZONO pkt 1). Akceptowalne dla tego tematu.

## Zarzuty (ponumerowane; żaden nie blokuje)

1. **Odstępstwo od sygnatury dispatchu (Z-Q3-2).** Dispatch: `build_map_view(map) -> MapViewDto`, `build_hex_dyn(..) -> Vec<HexDynDto>`; kod zwraca `Result<_, MapViewError>`. Uzasadnienie techniczne poprawne (pola tekstowe `SnapshotMap` vs typowane enumy DTO; brak cichej podmiany), opisane w raporcie, ale musi trafić do `REJESTR-RUST.md` przy integracji, a P4-1G musi obsłużyć błąd.
2. **Brak nowego wariantu błędu w `view-model`.** Dispatch mówi „reguła długości i wariant błędu”; Operator użył istniejącego `ViewError::LengthMismatch` z polem `"map.riverRenderPaths"` i rozszerzył tylko doc-komentarz. Funkcjonalnie wystarczające (test M8 czerwony po usunięciu reguły), ale to świadome odstępstwo od literalnego brzmienia — FC ma je przyjąć albo odrzucić.
3. **Testy `mutacja_*` w `p4_1b_map_view.rs` budują mutanta w teście**, a nie mutują producenta; czułość producenta na mutacje dowodzą dopiero skrypty `mutate-r1.py`/`mutate-vm-r1.py` w katalogu runu, które NIE są bramką `cargo`. Odtworzyłem je (8/8) i dodałem 4 własne (4/4), więc dowód istnieje; to uwaga o trwałości (regresja nie zostanie złapana przez same testy „mutacja_*”, choć łapią ją testy bajt w bajt).
4. **`mutacja_bez_sortowania_daje_fail`** sprawdza `validate_map → HexOrder` zamiast rozjazdu z wektorami — słabsza forma; samą mutację M4 łapią jednak testy bajt w bajt i permutacyjny.
5. **Generator wymaga Node ≥ 22.18 (eksperymentalne `stripTypeScriptTypes`).** Działa na v22.23.4; ostrzeżenie ExperimentalWarning. Ryzyko na przyszłość przy zmianie Node, nie wpływa na wynik.
6. **Jednorazowe EXIT 101 `cargo test --lib -q`** przy pierwszym uruchomieniu (zaraz po równoległym clippy w tym samym target dir), bez linii wyniku w przefiltrowanym logu; dwa kolejne przebiegi i przebieg pełny bez `-q`: EXIT 0, 121 passed, 0 failed. Nie odtworzyłem błędu — prawdopodobnie artefakt środowiska (blokada/target), ale zapisuję uczciwie: NIE_ZMIERZONO przyczyny.
7. **Pełny `cargo test` silnika (wszystkie testy integracyjne): NIE_ZMIERZONO** — także przez Evaluatora (poza bramkami dispatchu). Integrator powinien uruchomić pełny test po merge z aktualnym parity (`400fd0bd1`).
8. **NIE_ZMIERZONO (przeniesione z raportu Operatora, potwierdzone):** wołający w rendererze (P4-1G); `placedImprovements` jako źródło `tarasy` (rozpoznanie §1.3, pkt 2 — zawężone, nie zamknięte); zmiana terenu w trakcie gry (producent liczy z bieżącej mapy, brak testu odświeżania).

## Werdykt

PASS-WITH-NOTES — bramki odtworzone z EXIT 0, wektory pinu wykonują kod pinu i zgadzają się bajt w bajt, 12/12 mutacji (8 Operatora + 4 Evaluatora) wykrytych, allowlista dotrzymana. Zarzuty 1–2 to świadome, udokumentowane odstępstwa techniczne do akceptacji przez FC; 3–8 to uwagi/NIE_ZMIERZONO.
