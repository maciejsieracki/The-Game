# REPIN-DELTA-20261029 — delta webu względem pinu portu `edb8fb56`

**Temat:** `R-RUSTPORT-REPIN-DELTA-Q1` · **Runda:** 1/5 · **Rola:** Operator · **Status:** dokument (ZERO zmian kodu).

**Pin:** `edb8fb56` · **Cel (web):** `91dc998a5f1b51ad29e0f4785edfd45655445c53` (origin/main w chwili pomiaru; `git rev-list --count edb8fb56..origin/main` = 87 commitów; pin jest przodkiem origin/main).

**Zakres:** `git diff --name-only edb8fb56 origin/main -- gra/src gra/data` = **94 pliki** (70 M, 24 A). Pliki poza `gra/src` i `gra/data` (np. `gra/tools`) są poza zakresem tematu i nie są klasyfikowane; wektory z `gra/tools` użyte są wyłącznie jako dowód wpływu.

## 1. Metodyka i komendy kontrolne

- Liczba plików: `git diff --name-only edb8fb56 origin/main -- gra/src gra/data | wc -l` → **94**.
- Statusy: `git diff --name-status edb8fb56 origin/main -- gra/src gra/data | awk '{print $1}' | sort | uniq -c` → **70 M, 24 A**.
- Kopie webu bez checkoutu: `git archive <rev> gra/src gra/data | tar -x -C <katalog>` (katalogi w scratchpadzie sesji, poza repo); `sha256` każdego pliku pin vs main.
- Manifest portu: `dyspozycje/rust-port/manifest-gra-edb8fb56.sha256.tsv` (2116 wierszy, na docs-branch). Dla 70 plików M sha z manifestu = sha256 pinu (kolumna `tsv=OK`); 24 pliki A nie istnieją w pinie (`NA`).
- Kopie bajtowe: `src-tauri/frontend-v2/tools/pin-manifest.json` (branch `origin/rust-port/parity-v2`, 435 wpisów, `pin`=edb8fb56). Z 94 zmienionych plików **jeden** jest w tym manifeście: `gra/src/ui/armyMergePanel.ts` (sha = pin → po zmianie web kopia jest STARA).
- Port frontend-v2: `src-tauri/frontend-v2/src/` na `origin/rust-port/parity-v2` zawiera 12 plików o tej samej ścieżce względnej co zmienione pliki `gra/src/ui/**` oraz `src/main.ts`. Porównanie bajtowe z pinem: 11 × `ROZNY_OD_PINU` (adaptacja DTO), 1 × `KOPIA_PINU` (`armyMergePanel.ts`), `main.ts` to osobna implementacja (jej nagłówek: „Nie jest kopią `gra/src/main.ts`”).
- Rust: `src-tauri/src/` na `origin/rust-port/parity-v2` = `lib.rs`, `main.rs` — **brak modułów Rust z regułami gry**. Dlatego każda zmiana logiki/danych ma „zaportowany = NIE”, chyba że jest w UI frontend-v2.
- Wektory/testy: liczba plików `gra/tools/**` (na origin/main) zawierających nazwę pliku źródłowego jako osobny token (granice: nie `[A-Za-z0-9_-]`). Heurystyka — może zawyżać przy wspólnych nazwach; traktować jako wskaźnik wpływu, nie dowód.
- Plan P1/P6: liczba plików `dyspozycje/rust-port/**` (docs-branch) wymieniających nazwę pliku (ta sama heurystyka tokenowa). Dla A oznacza `0` brak odpowiednika w planie.
- Typ 3D: plik realnie importuje `three` (regex `from 'three'` na origin/main). Trafienia `THREE.` w komentarzach nie liczą się (np. `ui/cityPanel.ts` ma tylko komentarz „no THREE.”).

## 2. Podsumowanie zliczeń

| Grupa | Zakres | Liczba plików |
|---|---|---|
| G1 | dane (params JSON, `civs.json`, `units.json`, `wikiBundle.json`, `loader.ts`) | 11 |
| G2 | reguły wojny i armii (w tym 4 nowe moduły wojny/armii) | 18 |
| G3 | dyplomacja (logika) | 7 |
| G4 | AI, ekonomia, miasta, zapis, audio | 30 |
| G5 | UI-2D (`gra/src/ui/**`) | 15 |
| G6 | ODŁOŻONE 3D: `render/**`, `battleScene.ts`, `main.ts` (spoiwo z `three`) | 13 |
| | suma | 94 |

Zaportowany do Rust/frontend-v2: **0** plików logiki/danych (brak modułów Rust); **11** plików UI częściowo (adaptacja), **1** UI jako kopia bajtowa, **main.ts** nie. Kopie bajtowe w pin-manifest do odświeżenia: **1** (`armyMergePanel.ts`).

## 3. Tabela klasyfikacji (94 wiersze = 94 pliki z `git diff --name-only`)

Kolumny: # · plik · status (M/A) · +/- (numstat) · typ zmiany · grupa (kolejność §5) · zaportowany · kopia w pin-manifest · wektory (refs w gra/tools) · plan P1/P6 (trafienia w docs) · odłożone 3D.

| # | Plik | St | +/- | Typ zmiany | Grupa | Zaportowany | Kopia pin-manifest | Wektory (gra/tools) | Plan P1/P6 | 3D odłożone |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `gra/data/army-consolidation-params.json` | A | +17/-0 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 0 | 0 — NOWY, brak w planie P1/P6 | nie |
| 2 | `gra/data/civs.json` | M | +180/-489 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 86 | 35 (dyspozycje/rust-port) | nie |
| 3 | `gra/data/diplomacy-tick-params.json` | A | +22/-0 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 2 | 0 — NOWY, brak w planie P1/P6 | nie |
| 4 | `gra/data/econ-params.json` | M | +12/-12 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 46 | 17 (dyspozycje/rust-port) | nie |
| 5 | `gra/data/ui-params.json` | M | +26/-0 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 46 | 15 (dyspozycje/rust-port) | nie |
| 6 | `gra/data/units.json` | M | +4/-4 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 394 | 82 (dyspozycje/rust-port) | nie |
| 7 | `gra/data/war-allin-params.json` | A | +17/-0 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 1 (dyspozycje/rust-port) | nie |
| 8 | `gra/data/war-rules-params.json` | A | +9/-0 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 0 | 0 — NOWY, brak w planie P1/P6 | nie |
| 9 | `gra/src/audio/filePlayer.ts` | M | +4/-3 | audio (nie 3D) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 6 | 5 (dyspozycje/rust-port) | nie |
| 10 | `gra/src/audio/muzyka-antyczna.ts` | M | +2/-2 | audio (nie 3D) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 35 | 7 (dyspozycje/rust-port) | nie |
| 11 | `gra/src/battle/battleScene.ts` | M | +184/-151 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 33 | 29 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 12 | `gra/src/battle/formationRules.ts` | A | +127/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 13 | `gra/src/data/loader.ts` | M | +4/-2 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 383 | 42 (dyspozycje/rust-port) | nie |
| 14 | `gra/src/data/wikiBundle.json` | M | +1/-1 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 16 | 17 (dyspozycje/rust-port) | nie |
| 15 | `gra/src/game/ai-city-capture-executor.ts` | M | +31/-1 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 5 | 7 (dyspozycje/rust-port) | nie |
| 16 | `gra/src/game/ai-era-unit-promotion.ts` | A | +63/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 17 | `gra/src/game/ai-general-war-campaign.ts` | A | +164/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 18 | `gra/src/game/ai-move-range.ts` | A | +112/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 4 | 1 (dyspozycje/rust-port) | nie |
| 19 | `gra/src/game/ai.ts` | M | +416/-130 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 126 | 29 (dyspozycje/rust-port) | nie |
| 20 | `gra/src/game/army-consolidation.ts` | A | +177/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 5 | 0 — NOWY, brak w planie P1/P6 | nie |
| 21 | `gra/src/game/army-leadership.ts` | A | +63/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 22 | `gra/src/game/armyMerge.ts` | M | +3/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 21 | 19 (dyspozycje/rust-port) | nie |
| 23 | `gra/src/game/auto-improvements.ts` | M | +3/-1 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 27 | 8 (dyspozycje/rust-port) | nie |
| 24 | `gra/src/game/barbarians.ts` | M | +49/-3 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 26 | 48 (dyspozycje/rust-port) | nie |
| 25 | `gra/src/game/civ-ai-data.ts` | M | +32/-34 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 11 | 9 (dyspozycje/rust-port) | nie |
| 26 | `gra/src/game/civ-bonuses.ts` | M | +106/-98 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 18 | 14 (dyspozycje/rust-port) | nie |
| 27 | `gra/src/game/civ-matrix-semantic.ts` | M | +91/-43 | logika (dyplomacja) | G3 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 6 | 14 (dyspozycje/rust-port) | nie |
| 28 | `gra/src/game/cluster-start.ts` | M | +35/-1 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 24 | 14 (dyspozycje/rust-port) | nie |
| 29 | `gra/src/game/combat.ts` | M | +4/-2 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 44 | 55 (dyspozycje/rust-port) | nie |
| 30 | `gra/src/game/culture-religion.ts` | M | +43/-21 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 14 | 21 (dyspozycje/rust-port) | nie |
| 31 | `gra/src/game/diplomacy-ai-offer-balance.ts` | M | +24/-1 | logika (dyplomacja) | G3 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 8 | 7 (dyspozycje/rust-port) | nie |
| 32 | `gra/src/game/diplomacy-layers.ts` | M | +32/-0 | logika (dyplomacja) | G3 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 16 | 9 (dyspozycje/rust-port) | nie |
| 33 | `gra/src/game/diplomacy-peace-lock.ts` | M | +1/-1 | logika (dyplomacja) | G3 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 7 (dyspozycje/rust-port) | nie |
| 34 | `gra/src/game/diplomacy-proposals.ts` | M | +5/-2 | logika (dyplomacja) | G3 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 30 | 15 (dyspozycje/rust-port) | nie |
| 35 | `gra/src/game/diplomacy-resource-trade-pick.ts` | M | +10/-2 | logika (dyplomacja) | G3 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 2 | 7 (dyspozycje/rust-port) | nie |
| 36 | `gra/src/game/diplomacy-sensible-deals.config.json` | A | +6/-0 | dane | G1 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 0 | 0 — NOWY, brak w planie P1/P6 | nie |
| 37 | `gra/src/game/diplomacy-sensible-deals.ts` | A | +170/-0 | logika (dyplomacja) | G3 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 2 | 0 — NOWY, brak w planie P1/P6 | nie |
| 38 | `gra/src/game/diplomacy-tick-war-brake.ts` | A | +216/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 3 | 0 — NOWY, brak w planie P1/P6 | nie |
| 39 | `gra/src/game/dirtyRenderSync.ts` | A | +31/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 40 | `gra/src/game/economy.ts` | M | +116/-213 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 80 | 31 (dyspozycje/rust-port) | nie |
| 41 | `gra/src/game/embarkation.ts` | M | +2/-2 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 7 | 13 (dyspozycje/rust-port) | nie |
| 42 | `gra/src/game/forced-war-bronze.ts` | M | +1/-1 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 6 | 7 (dyspozycje/rust-port) | nie |
| 43 | `gra/src/game/forced-war-common.ts` | M | +99/-15 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 15 | 7 (dyspozycje/rust-port) | nie |
| 44 | `gra/src/game/forced-war-iron.ts` | M | +15/-2 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 4 | 7 (dyspozycje/rust-port) | nie |
| 45 | `gra/src/game/forced-war-stone.ts` | M | +1/-1 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 7 | 7 (dyspozycje/rust-port) | nie |
| 46 | `gra/src/game/fsa-autosave.ts` | M | +55/-1 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 3 | 12 (dyspozycje/rust-port) | nie |
| 47 | `gra/src/game/generals.ts` | A | +53/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 5 | 0 — NOWY, brak w planie P1/P6 | nie |
| 48 | `gra/src/game/manpower.ts` | M | +80/-48 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 27 | 29 (dyspozycje/rust-port) | nie |
| 49 | `gra/src/game/order.ts` | M | +23/-2 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 41 | 19 (dyspozycje/rust-port) | nie |
| 50 | `gra/src/game/planned-march.ts` | M | +15/-4 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 4 | 10 (dyspozycje/rust-port) | nie |
| 51 | `gra/src/game/playerState.ts` | M | +1/-7 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 6 | 20 (dyspozycje/rust-port) | nie |
| 52 | `gra/src/game/population-growth-v85.ts` | M | +37/-6 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 25 | 22 (dyspozycje/rust-port) | nie |
| 53 | `gra/src/game/production.ts` | M | +216/-55 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 137 | 26 (dyspozycje/rust-port) | nie |
| 54 | `gra/src/game/relief-preserving-improvements.ts` | M | +5/-6 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 2 | 7 (dyspozycje/rust-port) | nie |
| 55 | `gra/src/game/retained-side-panel-events.ts` | A | +26/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 56 | `gra/src/game/save-presence.ts` | A | +118/-0 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 57 | `gra/src/game/save.ts` | M | +6/-1 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 95 | 36 (dyspozycje/rust-port) | nie |
| 58 | `gra/src/game/society-breakdown.ts` | M | +33/-0 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 27 | 20 (dyspozycje/rust-port) | nie |
| 59 | `gra/src/game/terrain-improvements.ts` | M | +15/-7 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 99 | 44 (dyspozycje/rust-port) | nie |
| 60 | `gra/src/game/trade-routes.ts` | M | +42/-13 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 22 | 20 (dyspozycje/rust-port) | nie |
| 61 | `gra/src/game/turn-economy.ts` | M | +95/-164 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 77 | 22 (dyspozycje/rust-port) | nie |
| 62 | `gra/src/game/war-rules-multiwar.ts` | A | +249/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 5 | 0 — NOWY, brak w planie P1/P6 | nie |
| 63 | `gra/src/game/warAllInCapital.ts` | A | +667/-0 | logika (wojna/armia) | G2 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 5 | 0 — NOWY, brak w planie P1/P6 | nie |
| 64 | `gra/src/game/wealth.ts` | M | +20/-0 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 15 | 17 (dyspozycje/rust-port) | nie |
| 65 | `gra/src/game/work-tax.ts` | A | +77/-0 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 2 | 0 — NOWY, brak w planie P1/P6 | nie |
| 66 | `gra/src/main.ts` | M | +2824/-447 | spoiwo logika+UI, import three | G6 | NIE: frontend-v2/src/main.ts to osobna implementacja (spoiwo, P5.13) | nie | 638 | 102 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 67 | `gra/src/map/gen-helpers.ts` | M | +24/-16 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 127 | 30 (dyspozycje/rust-port) | nie |
| 68 | `gra/src/render/braz-rydwan-woly-opus5.ts` | M | +2/-2 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 0 | 5 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 69 | `gra/src/render/bronzeCityRoblox.ts` | M | +2/-1 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 0 | 10 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 70 | `gra/src/render/cities.ts` | M | +70/-4 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 317 | 50 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 71 | `gra/src/render/kopalnia-cyny-opus5.ts` | M | +4/-3 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 6 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 72 | `gra/src/render/kopalnia-zlota-opus5.ts` | M | +4/-3 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 0 | 6 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 73 | `gra/src/render/memDebug.ts` | A | +59/-0 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 1 | 1 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 74 | `gra/src/render/stoneCityRoblox.ts` | M | +2/-1 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 0 | 9 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 75 | `gra/src/render/transientObjectResources.ts` | A | +68/-0 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 2 | 0 — NOWY, brak w planie P1/P6 | ODŁOŻONE (3D) |
| 76 | `gra/src/render/unitStatPlate.ts` | M | +5/-5 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 3 | 13 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 77 | `gra/src/render/unitVeteranBadges.ts` | M | +36/-0 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 6 | 9 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 78 | `gra/src/render/units.ts` | M | +66/-43 | 3D-render | G6 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 394 | 82 (dyspozycje/rust-port) | ODŁOŻONE (3D) |
| 79 | `gra/src/ui/aiOwnerProgressFrame.ts` | A | +16/-0 | UI-2D | G5 | NIE: UI nieprzeniesione do frontend-v2 (brak pliku o tej ścieżce) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 80 | `gra/src/ui/armyMergePanel.ts` | M | +28/-19 | UI-2D | G5 | TAK: frontend-v2/src/ui/armyMergePanel.ts (kopia bajtowa, = pin) | TAK, sha = pin → STARA po zmianie | 3 | 10 (dyspozycje/rust-port) | nie |
| 81 | `gra/src/ui/armyStackHud.ts` | M | +6/-6 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/armyStackHud.ts (adaptacja, bajty != pin) | nie | 3 | 8 (dyspozycje/rust-port) | nie |
| 82 | `gra/src/ui/cityPanel.ts` | M | +259/-73 | UI-2D | G5 | NIE: UI nieprzeniesione do frontend-v2 (brak pliku o tej ścieżce) | nie | 97 | 30 (dyspozycje/rust-port) | nie |
| 83 | `gra/src/ui/diploListHud.ts` | M | +44/-0 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/diploListHud.ts (adaptacja, bajty != pin) | nie | 2 | 9 (dyspozycje/rust-port) | nie |
| 84 | `gra/src/ui/diplomacyAudience.ts` | M | +4/-17 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/diplomacyAudience.ts (adaptacja, bajty != pin) | nie | 20 | 14 (dyspozycje/rust-port) | nie |
| 85 | `gra/src/ui/empireDetailPanel.ts` | M | +85/-165 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/empireDetailPanel.ts (adaptacja, bajty != pin) | nie | 35 | 17 (dyspozycje/rust-port) | nie |
| 86 | `gra/src/ui/entityCards/buildingAdapter.ts` | M | +3/-3 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/entityCards/buildingAdapter.ts (adaptacja, bajty != pin) | nie | 7 | 8 (dyspozycje/rust-port) | nie |
| 87 | `gra/src/ui/entityCards/improvementAdapter.ts` | M | +7/-1 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/entityCards/improvementAdapter.ts (adaptacja, bajty != pin) | nie | 9 | 7 (dyspozycje/rust-port) | nie |
| 88 | `gra/src/ui/hud.ts` | M | +8/-2 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/hud.ts (adaptacja, bajty != pin) | nie | 47 | 19 (dyspozycje/rust-port) | nie |
| 89 | `gra/src/ui/newGameFlow.ts` | M | +179/-39 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/newGameFlow.ts (adaptacja, bajty != pin) | nie | 23 | 35 (dyspozycje/rust-port) | nie |
| 90 | `gra/src/ui/preBattle.ts` | M | +33/-10 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/preBattle.ts (adaptacja, bajty != pin) | nie | 30 | 18 (dyspozycje/rust-port) | nie |
| 91 | `gra/src/ui/recruitHudLabel.ts` | A | +5/-0 | UI-2D | G5 | NIE: UI nieprzeniesione do frontend-v2 (brak pliku o tej ścieżce) | nie | 1 | 0 — NOWY, brak w planie P1/P6 | nie |
| 92 | `gra/src/ui/unitRecruitCard.ts` | M | +124/-38 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/unitRecruitCard.ts (adaptacja, bajty != pin) | nie | 7 | 12 (dyspozycje/rust-port) | nie |
| 93 | `gra/src/ui/unitReplacePicker.ts` | M | +18/-2 | UI-2D | G5 | CZĘŚCIOWO: frontend-v2/src/ui/unitReplacePicker.ts (adaptacja, bajty != pin) | nie | 1 | 8 (dyspozycje/rust-port) | nie |
| 94 | `gra/src/units/setup.ts` | M | +2/-0 | logika (AI/ekonomia/miasta/save) | G4 | NIE: brak modułu Rust (parity-v2 src-tauri/src = lib.rs, main.rs) | nie | 279 | 29 (dyspozycje/rust-port) | nie |


Legenda grup: G1 dane → G2 reguły wojny/armii → G3 dyplomacja → G4 AI/ekonomia/miasta/zapis/audio → G5 UI-2D → G6 ODŁOŻONE 3D (na koniec, gdy zostanie miejsce w limicie). Kolejność G1→G5 wynika z zależności: logika i dane muszą być w porcie przed panelami UI (P5.13: UI nie liczy reguł).

## 4. Nowe pliki web (24 × A) bez odpowiednika w planie P1/P6

Dispatch wymienia `war-rules-multiwar.ts`, `army-consolidation.ts`, `diplomacy-sensible-deals.ts` — wszystkie trzy są w tabeli jako A i mają **0** wpisów w planie P1/P6 (poza wzmiankami w dokumentach `R-*` tematów webowych i w tym dispatchu).

Bez wpisu w planie P1/P6 (21 plików, kolumna „0 — NOWY”): `army-consolidation-params.json`, `diplomacy-tick-params.json`, `war-rules-params.json`, `battle/formationRules.ts`, `ai-era-unit-promotion.ts`, `ai-general-war-campaign.ts`, `army-consolidation.ts`, `army-leadership.ts`, `diplomacy-sensible-deals.config.json`, `diplomacy-sensible-deals.ts`, `diplomacy-tick-war-brake.ts`, `dirtyRenderSync.ts`, `generals.ts`, `retained-side-panel-events.ts`, `save-presence.ts`, `war-rules-multiwar.ts`, `warAllInCapital.ts`, `work-tax.ts`, `render/transientObjectResources.ts`, `ui/aiOwnerProgressFrame.ts`, `ui/recruitHudLabel.ts`.

Z trafieniem w `dyspozycje/rust-port` (wzmianka, nie wpis do P1/P6 — NIE_ZMIERZONO, czy plan je obejmuje): `war-allin-params.json` (LEDGER), `ai-move-range.ts`, `render/memDebug.ts`.

Nowe pliki wymagają decyzji o zakresie portu przed przeniesieniem; do czasu decyzji są „poza planem” i nie należy ich traktować jako zaportowane.

## 5. Rekomendowana kolejność i podział na tematy

Każdy wiersz to jeden temat (≤ 1 temat na zlecenie). Wszystkie tematy poza G6 są bez grafiki 3D.

| Krok | Temat (propozycja ID) | Pliki (grupa) | Uwagi |
|---|---|---|---|
| 0 | `R-RUSTPORT-REPIN-DECYZJA-Q1` | brak zmian kodu | Decyzja właściciela o zakresie portu nowych plików (§4) i o momencie zmiany pinu (§6). |
| 1 | `R-RUSTPORT-REPIN-DANE-Q1` | G1 (11) | Najpierw dane: `loader.ts`, `wikiBundle.json`, 7 plików params/config (A), `civs.json`, `econ-params.json`, `ui-params.json`, `units.json`. Uwaga: `units.json` to dane, nie grafika; jeśli właściciel rozumie „jednostki” szerzej, przenieść go do G6. |
| 2a | `R-RUSTPORT-REPIN-WOJNA-NOWE-Q1` | G2, nowe moduły (`war-rules-multiwar`, `warAllInCapital`, `army-consolidation`, `army-leadership`, `generals`, `ai-general-war-campaign`, `ai-era-unit-promotion`, `diplomacy-tick-war-brake`, `dirtyRenderSync`, `retained-side-panel-events`, `formationRules`) | Nowe pliki: wymaga decyzji z kroku 0. |
| 2b | `R-RUSTPORT-REPIN-WOJNA-ZMIANY-Q1` | G2, zmienione (`forced-war-*`, `armyMerge`, `ai-move-range`, `planned-march`) | Zależy od 1 i 2a. |
| 3 | `R-RUSTPORT-REPIN-DYPLO-Q1` | G3 (7) | Zależy od 1 i 2a (`diplomacy-sensible-deals`). |
| 4a | `R-RUSTPORT-REPIN-AI-Q1` | `ai.ts`, `ai-city-capture-executor`, `auto-improvements`, `barbarians`, `cluster-start`, `embarkation`, `civ-ai-data`, `civ-bonuses`, `civ-matrix-semantic`, `combat`, `order` | `ai.ts` (+416/-130) jest największym pojedynczym ryzykiem; osobny temat. |
| 4b | `R-RUSTPORT-REPIN-EKONOMIA-Q1` | `economy`, `production`, `manpower`, `turn-economy`, `wealth`, `work-tax`, `society-breakdown`, `culture-religion`, `trade-routes`, `terrain-improvements`, `population-growth-v85`, `relief-preserving-improvements`, `playerState`, `gen-helpers`, `units/setup.ts` | Po 1. |
| 4c | `R-RUSTPORT-REPIN-ZAPIS-AUDIO-Q1` | `save.ts`, `save-presence`, `fsa-autosave`, `audio/*` | Po 1 (format zapisu). |
| 5 | `R-RUSTPORT-REPIN-UI-Q1` | G5 (15) | Zależy od 1–4 (DTO). 12 plików ma już odpowiednik w frontend-v2 (11 adaptacji do odświeżenia, `armyMergePanel` = kopia pinu); 3 nowe (`aiOwnerProgressFrame`, `recruitHudLabel`, `cityPanel` — `cityPanel` +259/-73 nieskopiowany w P5). |
| 6 | `R-RUSTPORT-REPIN-3D-ODLOZONE-Q1` | G6 (13): `battleScene.ts`, `render/**`, `main.ts` | **ODŁOŻONE (3D)** — na sam koniec, gdy zostanie wolne miejsce przed końcem limitu. `main.ts` (+2824/-447) ma też część niegraficzną; rozdzielić przed startem tematu. |

## 6. Propozycja nowego pinu

- **Kandydat:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` (origin/main w chwili pomiaru; `git rev-list --count edb8fb56..origin/main` = 87; pin `edb8fb56` jest przodkiem origin/main).
- **Kiedy:** nie w tym temacie. Pin przesuwać jednym ruchem dopiero po krokach 1–5 (G1–G5 zamknięte). Do tego czasu `edb8fb56` pozostaje pinem frontend-v2. Krok 6 (G6) pójdzie po przesunięciu pinu i będzie oznaczony ODŁOŻONE.
- **Co z wektorami i kopiami:**
  - `pin-manifest.json` (435 wpisów): zmienia się 1 wpis (`ui/armyMergePanel.ts`, obecnie `sha = pin`, po zmianie STARA); regeneracja z `git archive` + `sha256`.
  - `manifest-gra-edb8fb56.sha256.tsv` (2116 wierszy): regeneracja jako manifest nowego pinu; 94 zmienione pliki mają nowe sha, 24 pliki A dochodzą.
  - Wektory/testy w `gra/tools` odwołujące się do zmienionych modułów (kolumna „Wektory” w §3; najwięcej odwołań heurystycznie: `units.json` 394, `units.ts` 394, `loader.ts` 383, `civs.json` 86, `ai.ts` 126) oznaczyć jako „do przeliczenia na nowym pinie”. **Nie osłabiać i nie usuwać testów** (zasada bramki).
  - Kontrola: `git diff --name-only edb8fb56 91dc998a5f1b51ad29e0f4785edfd45655445c53 -- gra/src gra/data | wc -l` = 94.

## 7. Kontrola kryteriów tematu

- Liczba wierszy tabeli §3 = liczba plików z `git diff --name-only`: komenda `grep -cE '^\| [0-9]+ \| `gra/' dyspozycje/rust-port/REPIN-DELTA-20261029.md` → **94** (= `git diff --name-only edb8fb56 origin/main -- gra/src gra/data | wc -l` → 94).
- Każdy plik ma klasyfikację (typ, grupa, zaportowany, kopia, wektory, plan, 3D). Sekcja NIE_ZMIERZONO: §8.

## 8. NIE_ZMIERZONO

- Semantyka zmian w grze (co dokładnie zmieniły reguły wojny, dyplomacji, AI): nie analizowano treści diffów, tylko status, rozmiar, zależności i ślad w pinie/porcie.
- Testy webu na origin/main i gra/tools: **nie uruchamiano** (dokument, zero zmian kodu). Wektory z gra/tools to wyłącznie heurystyczne dopasowanie nazw.
- Zgodność frontend-v2 z nowym kodem: nie zmierzona; porównano jedynie bajty z pinem (kolumna „zaportowany”).
- Rust: `src-tauri/src` na `origin/rust-port/parity-v2` zawiera tylko `lib.rs` i `main.rs`; nie stwierdzono modułów reguł. Gałęzie robocze inne niż `parity-v2` nie były sprawdzane.
- Heurystyka tokenowa (nazwa pliku jako osobny token) może przeoczyć odwołania przez ścieżki względne lub dynamiczne importy; może też zawyżać przy wspólnych nazwach.
- Plan P1/P6: sprawdzono tylko `dyspozycje/rust-port/**` w gałęzi docs; `P6-25-MAPA-GAP.md` istnieje, jego treści względem nowych plików nie analizowano.

## 9. Założenia rozstrzygające luki (zamiast pytań)

- Z-1: „zaportowany” = plik o tej samej ścieżce względnej istnieje w `src-tauri/frontend-v2/src` na `origin/rust-port/parity-v2`; bez oceny pełności.
- Z-2: „3D” = realny import `three` w pliku (regex na `origin/main`); wzmianki `THREE.` w komentarzach nie liczą się.
- Z-3: `units.json` i `units/setup.ts` traktowane jako dane/logika, nie grafika (patrz uwaga w kroku 1).
- Z-4: kolejność G1→G5, G6 na końcu — zgodnie z poleceniem, że ciężkie prace 3D są odkładane.
- Z-5: pin przesuwany jednym ruchem po G1–G5 (§6).
