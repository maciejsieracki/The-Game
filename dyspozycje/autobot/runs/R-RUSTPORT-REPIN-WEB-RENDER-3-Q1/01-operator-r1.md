STATUS: BLOCK (techniczny: cel portu poza allowlistą; klasyfikacja i narzędzie zakresu wykonane)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-RENDER-3-Q1
GOAL: REPIN renderu 3D-3 — przepiąć zmiany `gra/src/render` web `86d510c66` → `9b019a7d8` (FALA 509–532) do portu Rust/Tauri z parytetem obrazu.

ZMIANY-COMMIT: `63df58c18` na `rust-port/parity-v2` @ `b520768b0` (gałąź `rust-repin-web-render-3-q1`, worktree `wf_5b87feeb-f60-1`), jawny `git add` 4 ścieżek:
- `dyspozycje/rust-port/p5/P5-REPIN-WEB-RENDER-3.md` (nowy; plan/klasyfikacja 3D-3),
- `src-tauri/frontend-v2/tools/repin-render3-scope.json` (manifest: blob SHA 9 plików baza/cel, kotwice luk Rust),
- `src-tauri/frontend-v2/tools/verify-repin-render3-scope.mjs` (weryfikator C1–C3 + `--self-test`),
- `src-tauri/frontend-v2/package.json` (+2 skrypty `verify:repin-render3[:mutate]`, addytywnie; `check` nietknięty — zgodność z równoległym UI-3).
Zero zmian w `src-tauri/frontend-v2/src/**`, `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`.

USTALENIA (dowód, nie założenie):
1. `src-tauri/frontend-v2/src/render/**` NIE ISTNIEJE na bazie; frontend-v2 nie importuje `three` i nie ma go w zależnościach (C1). Render mapy w porcie = `rust-port/renderer` (wgpu) — zakazany w allowliście. Wzorzec P4-REPIN-3D też portował `render/*` do `rust-port/renderer`.
2. Klasyfikacja 9 plików (P5-REPIN-WEB-RENDER-3.md §2): 6 = K (pule geometrii/materiałów, `setOpaqueSort`, scalenie statyczne, zwolnienie kopii CPU) → NIE-DOTYCZY obrazu w Rust (Z-R3-2, jak P4 §2.3/§11.5). Luki wymagające portu w `rust-port/renderer`:
   - **L1** `core/map_style.rs:272` medium `pixel_ratio_max: 1.5` vs web 2.0 (+ fixtura `tests/core_web_parity.rs:1340`),
   - **L2** `core/merge_decor.rs` „ONE non-indexed mesh” vs web `indexIdenticalVertices` (bufor indeksowany, dedup bit w bit),
   - **L3** `smallPartLod` (rzut < 3 px chowany) — brak runtime'u `UnitRenderer`/kompozytora w Rust; odroczone jak B3-rest.
   Kopie bajtowe: 0.

TESTY:
- `npx tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (pin 431/0, UI-2 7/0, kblocks 37).
- `node tools/verify-repin-render3-scope.mjs` EXIT=0 (9 plików, 2 kotwice); `--self-test` 12/12 mutacji zabitych EXIT=0.
- `git diff b520768b0 -- src-tauri/frontend-v2/src` = pusto. Regresja (nakładka `repin-ui2-overlay`, pin `edb8fb56` + web `86d510c66`): L0 3861/0, L1A 3618/0, C4 1649/0 (jsdom 75 jak baza), L2 1784/0 (354/150 jak baza), hud 899/0, cityux 164/0; `run-cycles` 6401/1623 — identyczny `src` jak baza, odniesieniem `run-repin-ui2e-cycles` 9335/0 (jak FC UI-2-E N1). Web `86d510c66`: ui2a 2292/0, ui2b 0 (PIX 0), ui2c 752/0, ui2d 797/0, ui2e 183/0, ui2f 35 scen/0, ui2g 9216/0.
- `run-newgame`: NIE_ZMIERZONO (przekroczony limit czasu wywołania; `src` bez zmian).
- Pomiar pamięci/draw calls, test pikselowy vs web, picking, deferred dim, mgła, LOD w Chromium: NIE_ZMIERZONO — frontend-v2 nie renderuje 3D; renderer Rust poza allowlistą i bez `/dev/dri`.
- Niezależny weryfikator: NIE_ZMIERZONO (brak przeniesionego kodu do weryfikacji; manifest SHA sprawdzalny `git ls-tree`).

BLOKADY:
- B1: GOAL wymaga zmian w `rust-port/renderer/**` (L1, L2; L3 po porcie kompozytora), allowlista dispatchu tego zabrania, a wskazany katalog docelowy nie istnieje. Remedium: temat `R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1` z allowlistą `rust-port/renderer/**` (plan §4) albo DODATEK r2 poszerzający allowlistę.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja klasyfikacji i B1); orkiestrator — korekta allowlisty/temat następczy.
DEPLOY-PUSH: NIE WYKONANO
