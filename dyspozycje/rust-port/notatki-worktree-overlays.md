# Notatki czytelnika: worktree-overlays/ (niezmergowane patche, 4 kandydaty)

Temat: R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1, runda 1/5. Zwrócone inline przez subagenta (zasada
subagenta zabraniała mu zapisu własnego pliku raportu) — zapisane przez orkiestratora z treści
odpowiedzi.

## Ogólnie
Wszystkie 4 overlaye są **NIEZMERGOWANE**. Żaden z 27 post-image blobów (np. `bridge.rs` 0b8a1865,
`playable.rs` (P118) 1c4bc742, `mod.rs` (P2-12) 15e421a1) nie istnieje w repo. Pre-image pasuje do
`78d494c7` lub `a317fb7a`. Lokalny clone jest shallow (ancestry niedostępna poza widocznym zakresem).

## Znaleziska

1. **Błędy terenu w ŻYWEJ gałęzi `78d494c7`, poprawka tylko w overlayu BRIDGE (TG-RUST-PORT-P2-BRIDGE-SAVELOAD).
   Najkonkretniejsze znalezisko tej rundy.**
   - `ai_turn.rs:101`: Desert = koszt 1. Web (`gra/data/terrain-movement.json`, main): `"Pustynia": 2`.
     Pathfinder jest poprawny (koszt 2) — **AI i gracz liczą koszt inaczej, to realny bug w żywym kodzie.**
   - `barbarians.rs:73-75`, `trade.rs:142-143`: Tundra traktowana jako przejezdna. Web: `"Polarny": 99`
     (nieprzejezdna).
   - Błąd jest w 78d494c7 **ZMERGOWANY (żyje)**; poprawka jest **NIEZMERGOWANA** (tylko patch).

2. **Bridge SaveGame/LoadGame/GetReplayLog + web_save v3** (`bridge.rs` +170/-2, `domain/web_save.rs`
   nowy, 193 linii). W 78d494c7 brak tych symboli. Silnik replay JEST żywy (`replay.rs:307`
   `ReplayRecorder`) ale niepodłączony do bridge. NIEZMERGOWANE (wiring).

3. **AssetKey** (`domain/assets.rs`, 125 linii). Slugi zgodne z żywym kodem (`improvements.rs`,
   `diplomacy.rs`, `building_costs.rs`). Terrain i jednostki świadomie pominięte w tym patchu.
   NIEZMERGOWANE.

4. **Hot-seat dwóch foteli** (P118: `playable.rs` +70/-9, `playable_slice.rs` +58,
   `src-tauri/frontend/main.js` +12/-2, `tests/frontend_contract.cjs` +81/-1, untracked
   `hotseat_turn_boundary.rs` 102 linie). Żywy kod: 0 trafień `human_seat_ids`/`humanSeat`.
   NIEZMERGOWANE. **Ryzyka przy ewentualnej integracji:**
   a) `PlayableState` dostaje nowe pola bez `#[serde(default)]`, a `PLAYABLE_STATE_VERSION` (=1) nie
      jest podbita — stare snapshoty przestaną się deserializować, bramka wersji z BRIDGE tego nie złapie.
   b) `hotseat_turn_boundary.rs` dopasowuje `BridgeResult` tylko do wariantu `State` — po merge BRIDGE
      (nowe warianty komend) przestanie się kompilować.
   c) P118 i BRIDGE modyfikują `playable.rs` z tym samym base `6715a556` — **konflikt przy próbie
      zastosowania obu naraz.**

5. **P2-12 Population Matrix.** Baza `54fc0af8` to ZDALNA gałąź
   `hermes/integration/R-CYWILIZACJE-MACIERZ-REMAINDER-49-CONTRACT-Q1-20260922` — **NIE jedna z 4
   gałęzi Rust zweryfikowanych w P0.** Web: `gra/src/game/population-growth-v85.ts:105`
   `PopulationMatrixResolved`. Rust: 0 trafień w 4 gałęziach. NIEZMERGOWANE. **Konflikt: nowe pliki
   P2-12 zajmują ścieżki żywe w 78d** (`city_growth.rs`, `playable.rs`, `save_load.rs`, `bridge.rs`).
   Najostrzejszy: `city_growth.rs:330` (78d) ma `apply_hunger_penalty(population, fed, unfed_turns)`,
   a overlay ma `apply_hunger_penalty(population, fed, debt, multiplier)` — **różne sygnatury tej samej
   funkcji, scalenie wymaga zmiany nazw/refaktoru.**

6. **Kolizje WEWNĄTRZ overlayów** (ta sama ścieżka, inna treść między patchami): `domain/web_save.rs`
   (P2-12: 99 linii vs BRIDGE: 193 linie), `bridge.rs` (P2-12 `resolve_city_tick` vs BRIDGE
   `EngineBridge`), `domain/save_load.rs` (P2-12 `CitySaveDto` vs BRIDGE `SaveSnapshot`). **Te dwa
   patche NIE dają się zastosować razem bez ręcznego scalenia.**

7. **P1-01** (base `f4c89d00`): NIE-DOTYCZY gameplayu. "PASS" dotyczy niezależnego modelu 3×3, nie
   `gra/` ani Rust. Receipt uczciwie podaje że cargo/tsc/jsdom/przeglądarka nie działały.

8. **Poza zakresem Rust, dotyczy `gra/**`:** BRIDGE patch dotyka `gra/src/map/gen-helpers.ts` (+8/-1)
   i `gra/src/ui/newGameFlow.ts` (+16), dodaje `gra/src/ui/newGameHistory.ts`. **To koliduje z zasadą
   GOAL "Zero zmian w gra/** w ramach tego projektu" — do oceny syntezy/właściciela.**

## Wniosek
Żaden overlay nie pokazuje systemu bardziej dokończonego niż audyt sugerował, bo **nic nie jest
zmergowane**. Jedyne wartościowe znalezisko to potwierdzony błąd terenu w żywym `78d494c7` (pkt 1) —
istotne dla decyzji o bazie startowej (P0.4/P0.5), bo oznacza, że `real24-staging` ma znany,
niepoprawiony defekt gameplayu.

## Pokrycie
Przeczytane w całości: `STATUS.tsv`, wszystkie 4 patche (P2-12 94 l., P118 212 l., BRIDGE 1573 l.),
wszystkie 14 plików untracked. Liczby (`git apply --numstat`): BRIDGE +842/-267 w 21 plikach, P118
+221/-12 w 4, P2-12 +29/-6 w 2. Weryfikacja tylko odczytem (`git cat-file`, `git grep`, `git ls-tree`).
Nie uruchamiano cargo ani tsc.

DEPLOY/PUSH: NIE WYKONANO
