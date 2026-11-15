# 01 — Operator r1 — R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer, DTO widoku — rozpoznanie, tylko odczyt)
TEMAT: R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1
GOAL: przygotować `renderer/src/view.rs` (#216): mapa DTO `view-model` → wejścia renderera, odpowiedniki w pinie `07d2fbd72`, luki, blokady i podział na wdrożenia — bez wdrażania.

ZMIANY/COMMIT:
- `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` (NOWY),
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1/01-operator-r1.md` (ten raport).
- Gałąź robocza: `wip/R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1` (lokalna, w worktree), baza `origin/rust-port/parity-v2` = `2f9a12786d4056dc499037667edbcf8cb5041fb8`. SHA commitu: podany w odpowiedzi Operatora (commit zawiera ten plik, więc SHA nie może być w jego treści).
- Zero zmian kodu, zero `gra/`, zero `Cargo.lock`. Commit jawnym `git add` dwóch plików.

TESTY: nie dotyczy (rozpoznanie dokumentacyjne; zero `cargo`, zero `npm`). Weryfikacja: `git diff --check` czysty; numery linii pinu sprawdzone `sed -n` na `git show 07d2fbd72:gra/src/main.ts` (39 punktów kontrolnych, 8 poprawionych przed commitem).

WYNIKI (skrót, pełne w dokumencie):
1. Kryterium 1 — tabela §3 (8 grup DTO, ~60 wierszy): DTO → wejście renderera (plik:linia) → pin (plik:linia) → ZGODNE / ROZBIEŻNE / BRAK.
   - ZGODNE (adapter = czyste tłumaczenie): teren + wybrzeże, mgła terenu/miast/cudów/pól robotników, miasta (`City` + 7 domknięć `CityRenderOptions`), cuda, oblężenia (`SiegeMarkerSyncOptions`, `camp_owner_by_hex` z `units[]`), terytorium (dane), szlaki, okolica, pola robotników, warstwa kopalni, bitwa (start).
   - BRAK po stronie renderera (§4, R1–R6): renderer żetonów jednostek (`UnitRenderer.sync`/`setHighlight`/`setSelectionHex`/`setPathRoute`/obwódka wodza), dekor terenu na mapie (las, `hideDecorAtHex`), wstęgi rzek, ulepszenia/zasoby/wioski per heks, plakietki miast (`syncStatChips`), sprite buntu. Te pola DTO nie mają dziś konsumenta.
   - Luki kontraktu DTO (§5, L1–L7): `revealAllLand`, `riverRevealKeys`, filtr widoczności jednostek, stan UI (panel miasta, przełączniki nakładek), place budowy cudów, krycie podświetlenia cudu ≠ ulepszenia, `turnStops` trasy.
2. Kryterium 2 — blokady §6: B-DEP (renderer nie zależy od `civ-view-model`, a allowlista kandydata P4-1G w kontrakcie §8 nie ma `renderer/Cargo.toml`), B-DOC (kontrakt P4-1 nie jest na `parity-v2`), producenci P4-1B/1C/1D/1F (brak lub w toku; gotowy tylko P4-1E), D-DTO-7/P4-1I, integratory R1–R6.
3. Kryterium 3 — podział §7: Q1 core (konwersje, mgła) → Q2 teren ∥ Q3 miasta/cuda/emblemat ∥ Q4 bitwa → Q5 nakładki; Q6 jednostki dopiero po R1. Każdy z allowlistą.
4. Kryterium 4 — §8: 11 pozycji NIE_ZMIERZONO.

UWAGI:
- Dispatch wymienia `BattleEventsDto` — taki typ nie istnieje (D-DTO-7 nierozstrzygnięta; `view-model/src/battle.rs:9-11`). Odnotowane w §1 i §3.8.
- Dispatch podaje do grepa `setOverlay\|renderMap\|applyView` — w pinie 0 trafień; wywołania faktycznie użyte to `setFog`, `*.sync`, `applyFogVisibility`, `build*OverlayGroup`, `setHighlight`, `setSelectionHex`, `setPathRoute` (§9).
- Kontrakt §6 mówi o trzech postaciach `HexCoord`; zmierzone są cztery (dochodzi `f64` w `BuildHighlightHex`/`CampUnit`) plus `HashSet<HexKey>` dla mgły pól robotników.
- Dwa identyczne typy `OwnerEmblemContext` w rendererze (`units/overlay/emblem.rs:28`, `raster/atlas/keys.rs:264`) — do uporządkowania przy Q3.
- Decyzje techniczne do `REJESTR-RUST.md` (orkiestrator): `OwnerRef` → `i32` z błędem przy przepełnieniu, własne `ToInt32` dla `seed`, `MapUiState` jako wejście adaptera spoza DTO (L4). Żadna z luk nie jest odstępstwem od webu; L6/L7 to zmiany kontraktu (bump `CONTRACT_VERSION`).

BLOKADY: brak dla tego rozpoznania. Dla wdrożeń — §6 dokumentu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (weryfikacja tabeli §3 i numerów linii na `2f9a12786` i pinie `07d2fbd72`).
DEPLOY/PUSH: NIE WYKONANO
