# R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES: Final Control (runda 2)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES
GOAL: renderer 3D ma ulepszenia, nakładki zasobów i wioski per heks budowane z DTO (R4 kontraktu P4-1), z mgłą podaną na wejściu
ZMIANY/COMMIT: ocena commitu 4d968529b8a06789a62aab212fe576c03133f8c0 (kod: aa9d36ac4, baza 2edc808d7); ten raport to jedyna nowa zmiana
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT 0 (70 zestawów, 577 passed, 0 failed, 0 ignored); improvements_sync_r4 12/12; 2 własne mutacje FC = FAIL
BLOKADY: brak
RUNDY: 2/5
NASTĘPNY KROK: integracja przez orkiestratora (FF/merge na parity-v2 razem z kolejką renderera), wpis w REJESTR-RUST; G5 to osobny temat (#332)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Pochodzenie i zakres

- `4d968529b` ma rodzica `aa9d36ac4`, a ten ma rodzica `2edc808d7` (baza z dispatchu). Zgadza się z DODATKIEM r2.
- `git diff --stat 2edc808d7 4d968529b` obejmuje 9 plików i wszystkie są na allowliście: `src/improvements/{mod.rs,sync/{mod,build,input}.rs}` (nowe), `tests/improvements_sync_r4.rs` i `tests/fixtures/improvements_sync/r4_vectors.json` (nowe), raporty r1 i r2. W `lib.rs` doszła dokładnie jedna linia: `pub mod improvements;`.
- Diff dla `rust-port/view-model`, `rust-port/engine`, `gra` i `Cargo.lock` jest pusty.
- `git diff --check 2edc808d7 4d968529b` zwraca EXIT 0.
- W trailerach obu commitów (`aa9d36ac4` i `4d968529b`) jest tylko `Co-Authored-By: Claude`, bez nazwy modelu.
- `#[ignore]`, `should_panic`, `assert!(true)`, `todo!` i `#[allow]` nie występują ani w module, ani w teście (grep). Test ma 69 asercji, a poziom asercji jest dokładny (`assert_eq!` na geometrii, pozycjach, kolejności i współczynnikach mgły).

## 2. Bramki FC (`rust-port/renderer`, drzewo `4d968529b`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. `CARGO_TARGET_DIR` był unikalny i leżał w scratchpadzie sesji poza repo. Usunąłem go po bramkach (zajmował 473 MB), a `Cargo.lock` przywróciłem przez `git checkout`.

| bramka | `df -h /` przed | wynik |
|---|---|---|
| `cargo fmt --check` | 6.0 GB | **EXIT 0** |
| `cargo clippy --all-targets -- -D warnings` | 6.0 GB | **EXIT 0** |
| `cargo test --all-targets --no-fail-fast` | 5.9 GB | **EXIT 0**: 70 zestawów, **577 passed, 0 failed, 0 ignored**; `improvements_sync_r4` 12 passed |

Uwaga: przed bramkami wolne miejsce wynosiło 5.9–6.0 GB, czyli mniej niż próg 8 GB z dispatchu Operatora. Mimo to przeprowadziłem bramki, bo r1/r2 zmierzyły ich koszt na ok. 0.2–1 GB (zmierzone: target 473 MB). Po sprzątaniu `df` pokazuje 12 GB wolnego.

## 3. Mutacje sprawdzone niezależnie przez FC

Każdą mutację robiłem na kopii pliku, potem przywracałem plik z kopii. `git status` po wszystkim jest czysty.

| mutacja | zmiana | wynik |
|---|---|---|
| (a') `road_mask` z DTO zastąpiony pełną gwiazdą w miejscu wywołania | `build.rs` `build_improvement_group`: `build_improvement_visual(&sectored, &relief, hex.road_mask)` → `…, 0b11_1111)` | **FAIL**: `improvement_mesh_uses_dto_road_mask_and_pin_placement` (11/1) |
| (v) wioska bez warunku `village_present` | `mod.rs` `sync_village_meshes`: `.filter(\|h\| h.village_present)` usunięty | **FAIL**: `later_snapshot_removes_stale_groups`, `no_camp_groups_without_dto_field`, `snapshot_orders_match_pin_call_order`, `villages_follow_dto_and_fog` (8/4) |

Mutacje (a1), (a2), (b) i (c) Operatora r2 są opisane w `01-operator-r2.md` §2. Nie powtarzałem ich. Mutant (c2) uznaję za równoważny: zgodnie z argumentem Operatora `build_styled_resource_overlay` dla `Some("")` przy `Brak`/`Las` zwraca `None`.

## 4. Przegląd zgodności z pinem `07d2fbd72` (`gra/src/main.ts`)

Porównałem kod linia po linii z pinem:

- `compactDepositAtEdge` (3058–3094): stałe 0.62/0.55/0.80/0.34, `Math.max(...) || 1`, `depositDisplayScale || 1`, `min(0.6, …)`, siatka 3×3 reliefu, `+0.01` i `z - edgeR` zgadzają się.
- `isDepositOverlaySuppressed` (3102–3110) i bramki w `syncResourceOverlayAtHex` / `rebuildResourceOverlays` (3207–3219, 3240–3246) idą w tej samej kolejności: przełącznik UI, woda, `hasNakladka || zlozeShown`, typ złoża, ulepszenie dedykowane, `null` z budowniczego. `rotY = q*1.3 + r*0.7` zgadza się.
- `mergedImprovementLayers` (3126–3137) zgadza się, z zastrzeżeniem luki G5 (osobny temat #332). `buildImprovementVisual` (3162–3173) zgadza się: `0xffd54a` i wymagana maska.
- `spawnImprovementMesh` (17043–17102) zgadza się: `Map.set` zachowuje pozycję, puste warstwy oznaczają `delete` + `syncResourceOverlayAtHex`, tarasy na wzgórzu, collapse, `improvementMeshPlacement`, flaga cieni. Kolejność `syncLivestockAndPlacedMeshes` (16234–16251) też.
- `keepsReliefUnderImprovement` (16839–16849) i `improvementReliefOpts` (16857–16864) zgadzają się. Predykat `preservesHillRelief` jest wejściem zewnętrznym (G6).
- `syncVillageMeshes` (3360–3399): kolejność `wanted`, budowa brakujących, usuwanie nadmiarowych, `shadowMap` przy zmianie i pozycja `topYAt` + `rotY` z układu zgadzają się. Warunek „bez miasta” obsługuje producent (`village_present`).
- `syncResourceOverlayFog`, `syncImprovementMeshFog` (część `improvementMeshes`) i `syncSettlementMeshFog` (część wiosek): ciało `hidden = !vis && !explored`, potem `fogBrightnessForHex(…, true)` zgadza się. Kolejność w `refreshFog` też.
- Obozy barbarzyńców: w DTO nie ma pola, więc **NIE_ZMIERZONO**. Jest to zgodne z DECYZJAMI dispatchu, a test pilnuje, żeby żadna grupa obozu nie powstawała.

## 5. Uwagi (nie blokują)

1. `ExternalInputs` (G1–G4, G6) to wejścia spoza DTO. Do czasu rozszerzenia producenta (osobny temat) wołający musi je podać. Brak `Default` jest celowy. Model nie ma jeszcze produkcyjnego konsumenta (`MapObjectsLayer` wołany jest tylko w teście), co jest zgodne z audytem L6 (#308).
2. G5 (normalizacja kluczy i fallback `hex.ulepszenie`) jest poza zakresem, temat #332.
3. Zaniedbane: `clearingMeshes` (las), dekor ulepszeń (R2), duchy budowy i zwalnianie GPU. Jest to jawnie opisane w dokumentacji modułu.
4. `deposit_marker_placement` liczy wartość oczekiwaną tą samą formułą co implementacja. Chroni przed zmianą stałych i kolejności, ale nie jest niezależnym wektorem z przeglądarki. Zgodność pikselowa z webem: NIE_ZMIERZONO (r1 §7 pkt 2).
5. `seed` jest obcinany do `i32` (`seed | 0`, jak w Q1/Q2). Dla seedów spoza `i32`: NIE_ZMIERZONO.

## 6. Werdykt

**PASS-WITH-NOTES.** Zakres jest zgodny z allowlistą, bramki są zielone, mutacje dają FAIL, a kod odpowiada pinowi. Uwagi z §5 są jawnie odnotowanymi lukami lub osobnymi tematami i nie blokują integracji. Nie integrowałem i nie pushowałem.
