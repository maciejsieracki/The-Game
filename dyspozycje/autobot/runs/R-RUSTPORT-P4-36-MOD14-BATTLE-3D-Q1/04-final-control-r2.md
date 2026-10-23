STATUS: PASS (zakres rundy 1: `siegeWall.ts` + inwentarz `battleScene.ts`; MOD-14 jako całość otwarty — części 2–5, ZAŁOŻENIE Z-36-1)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1
GOAL: MOD-14 w `rust-port/renderer`: port 1:1 `battle/siegeWall.ts` (9 stylów + `attachRowBreachPanels`) bit w bit z webem (pin `edb8fb56`, three@0.169.0) + inwentarz `battleScene.ts` z celem każdego symbolu i jawnym podziałem na części.
ROLA: Final Control (Opus 5.5 medium)

ZMIANY/COMMIT: oceniany `4b8f476f` (rodzic `8947d603` ← `ba5dca73`); ten raport jako osobny commit nad `4b8f476f`.
- `git diff --name-only ba5dca73 4b8f476f`: 26 ścieżek, wszystkie w allowliście; `lib.rs` = +1 linia `pub mod battle;`; `Cargo.*`, `gra/**`, moduły zakazane bez zmian; `git diff --check` czysty.
- `merge-base(ba5dca73, origin/rust-port/parity-v2 = c4fa31a2) = ba5dca73`; upstream od bazy nie dotyka `lib.rs` ani `battle*` → próbny merge bez konfliktów.

WERYFIKACJA SAMODZIELNA (na próbnym merge `4b8f476f` + `c4fa31a2`, czysty `CARGO_TARGET_DIR`, `CARGO_PROFILE_DEV_DEBUG=0`, usunięty po pracy):
- `cargo fmt --all -- --check` EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings` EXIT=0
- `cargo clippy --locked --all-targets --features gpu -- -D warnings` EXIT=0
- `cargo test --locked --all-targets` EXIT=0: 389 passed, 0 failed (51 wyników; 377 tematu + testy upstream P4.35)
- `sha256sum -c MANIFEST.sha256`: 6/6 OK
- Niezależna regeneracja wg README (git archive pinu, npm three@0.169.0 + esbuild@0.24.0, node v22.22.0, inny katalog scratch): `cases=95 meshes=11877`; `siege_wall.json` = `bce895d8…fdbf7`, `gen.mjs` = `b60f124d…c637` — identyczne z repo (zarzut 4 zamknięty bajt w bajt).
- Próbka bezpośrednio z funkcji weba (własny `probe.ts`, niezależny od `gen.ts`): `buildSiegeWall('grecja', {6,1,2.5,gate 0|0.5})` → klucze `wallSegsByLocalX` bity `c000…,bff0…,0000…,3ff0…,4000…,4008…`; po `attachRowBreachPanels(w,0,-0,0,5,6,1)` wiersze `0000…` (+0). Fixtura `gate-zero-grecja`/`gate-half-grecja` zawiera dokładnie te bity; test Rust je przechodzi.
- Własne mutanty FC: (a) cofnięcie poprawki `key + 0.0` → KILLED przez `battle3d_siege_wall`; (b) usunięcie gałęzi NaN w `same_value_zero` → KILLED przez `--lib battle`; (c) `key + -0.0` → KILLED.

ORZECZENIA:
1. Klucze Map `-0` → ODDAL (naprawione): `map_set` zgodny z ECMA-262 `Map.prototype.set` krok 4; dowód parytetu wyżej.
2. Luka pokrycia → ODDAL (naprawione): 27 przypadków brzegowych + test jednostkowy SameValueZero; mutant NaN zabity. Pominięcie `tileSize = NaN` uzasadnione (klucze NaN nieosiągalne z API; wzorzec bitów NaN implementacyjny, ECMA-262) — jawnie opisane w README/§3a, nie osłabia kryterium.
3. Inwentarz → ODDAL (naprawione): 731/731 wierszy z celem; 0 wystąpień „heurystyka, weryfikacja”; sprawdzone na pinie linie `BF_ROWS:619`, `_carveBattleBox:3740`, `_tickCameraPanKeys:9953`, `_updateOrderPreview:10683`, `_unitTooltipHtml:11141` i ich przypisania (WSPÓLNA/RUNDA-2, RUNDA-5, RUNDA-3, P5). 17 typów TS ma cel „DTO wg potrzeb rund 2–5” — akceptowalne.
4. `gen.mjs` odtwarzalność → ODDAL (naprawione, potwierdzone regeneracją).
Agregat: same ODDAL → PASS.

TESTY: jak wyżej.
BLOKADY: brak. Ocena wzrokowa NIE_ZMIERZONO (brak GPU; lista w §8 dokumentu). Z-36-1 (osobne ID `-Q2…-Q5` dla części 2–5) i Z-36-3 (teren bitwy jako DTO z P6.13) — do potwierdzenia przez orkiestratora.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora: `4b8f476f` (+ commit tego raportu) na `origin/rust-port/parity-v2` (`c4fa31a2`) — merge/cherry-pick w kolejności `8947d603` → `4b8f476f` → raport FC; bez konfliktów; po integracji ponowić bramki.
DEPLOY/PUSH: NIE WYKONANO
