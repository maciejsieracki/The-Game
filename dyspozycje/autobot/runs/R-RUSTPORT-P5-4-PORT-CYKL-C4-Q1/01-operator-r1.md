STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1
GOAL: Port cyklu C4 (PORTING-QUEUE wiersze 16, 17, 19, 20, 22–25, 35, 45: `entityCards/*`, `sciencePicker.ts`, `scienceHubHud.ts`, `techDiscoveryNotice.ts`) razem do `src-tauri/frontend-v2/src/ui/` na DTO/kontrolerze MOCK, z harnessem DOM vs pin `edb8fb56`.
ZMIANY/COMMIT: baza `origin/rust-port/parity-v2` @ `9ec9c9d8`; commit w worktree (SHA w odpowiedzi Operatora), bez push.
  - 10/10 modułów (0 pominiętych): 8 zmienionych (dane → `StaticCatalogDto`; reguły → `BuildingCardRulesDto`, `ResearchViewDto.{techs[].effectiveCost, treeEpoch, hubEntries}`, `techTerrainUnlockLabels`, `constants.researchQueueMax`, `EraGateInfoDto`, `unitCategory`) + 2 kopie bajtowe (`entityCards/renderer.ts`, `entityCards/wonderAdapter.ts`); + `controller/entityCardRules.ts` (NOWY), `controller/index.ts`, `controller/mockCatalog.ts`, `viewmodel/types.ts`, `ui/portCycleC4.ts` (NOWY), `main.ts`, `tools/pin-manifest.json` (+2), `tools/dom-harness/run-c4.mjs`, `mutate-c4.mjs`, `package.json` (skrypty), `PORTING-QUEUE.md`.
  - Dokument: `dyspozycje/rust-port/p5/P5-4-PORT-CYKL-C4.md` (tabela modułów §2, import → DTO §3, rejestr rozszerzeń §3a, reguły → DTO + przegląd ręczny `scienceHubSnapshotLogic`/`slug`/`techIcons` §4, harness §6, ZAŁOŻENIA §8).
TESTY (`r1-logi/`): npm ci EXIT=0; tsc --noEmit EXIT=0; npm run check EXIT=0 (`plików=95 plików_z_trafieniami=0 trafień=0`, `verify-pin-copies plików=413 niezgodnych=0`); vite build EXIT=0; harness C4 1649 przypadków / 0 różnic, asercje v2 9/9 (EXIT=0); mutacje 20/20 wykryte (EXIT=0); regresja P5.2 3861/0 i P5.3 3618/0 (EXIT=0); kalibracja bramy: pin 38 trafień w 8/10 plikach (EXIT=1) → v2 0 w 12 plikach (EXIT=0); SHA-1 blobów kopii 2/2.
BLOKADY: brak. NIE_ZMIERZONO: realny WebView/Tauri, komendy Rust dla nowych DTO, miniatura po rAF (D-UI-3), Escape/klik poza panelem/DnD w harnessie, fallback legacy karty technologii (dokument §6, §10).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO

Ścieżki zmienione (allowlista): `src-tauri/frontend-v2/**`, `dyspozycje/rust-port/p5/P5-4-PORT-CYKL-C4.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1/**` (`r1-logi/13-allowlist-git-status.log`). Brak zmian w `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**`.
