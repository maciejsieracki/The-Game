STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1
GOAL: Port 21 jednostek DOM bloku K06 (1 312 LOC, pin edb8fb56, gra/src/ui/cityPanel.ts) do src-tauri/frontend-v2/src/ui/cityPanel/k06b-*.ts; 3D/MAPA odłożone (placeholdery); harness DOM z pinem; mutacje; typecheck i check zielone.
ZMIANY-COMMIT: baza origin/rust-port/parity-v2 @ 364a5356 (detached). Kod + harness + dossier: 987fd563 (9 plików: k06b-deps/garnizon/jednostki/kolejki.ts, run-k06b-units.mjs, mutate-k06b-units.mjs, k06b-ranges.json, PORTING-QUEUE.md, P5-8-K06B.md). Logi r1-logi/ i ten raport: commit po 987fd563 (SHA w `git log`). Zero zmian w gra/**, package.json, WERSJE.md, viewmodel/, controller/.
TESTY:
- Harness: `node tools/dom-harness/run-k06b-units.mjs --pin-dir <PIN>` → 28 porównań, 0 różnic, EXIT 0 (log: r1-logi/harness-run-k06b-units.log).
- Mutacje: `mutate-k06b-units.mjs` → 8 mutantów, 7 zabitych, 1 przeżył (M3, gałąź fullEraPreview nieosiągalna w fixture; log: r1-logi/mutate-k06b-units.log).
- `npm ci` EXIT 0; `npm run typecheck` EXIT 0 (r1-logi/typecheck.log); `npm run check` EXIT 0: self-test 33/15, 179 plików, 0 trafień, verify-pin-copies 435 niezgodnych=0 (r1-logi/check.log).
- Bez run_in_background; wszystkie wywołania na pierwszym planie.
BLOKADY: brak blokad technicznych. Otwarte luki (NIE_ZMIERZONO): (1) wiring kontrolera K06A (setK06aDeps/setK06aCfg, akcesory) — zadanie dodatkowe dispatchu NIE zrobione; (2) bramka verify-k06b-copies.mjs (ORPHAN=0) NIE zrobiona; (3) partie ≤8 z commitem po każdej: jeden przebieg generatora, jeden commit; (4) głębokość ścieżek w harnessie (stuby uniwersalne); (5) zgodność DTO z viewmodel/types.ts (typy = any); (6) dryf pinu vs origin/main nie przepinowany (P5-8 §7); (7) zachowanie w przeglądarce NIE_ZMIERZONO.
ZAŁOŻENIA (rozstrzygnięte w dossier, K06B-Z1..Z9): kopie treści generowane z pinu; delegaty dep()/valueProxy()/constStr(); stałe literalne lokalnie; typy any; stan K06A przez akcesory; placeholdery 3D/MAPA (P5-8 §6); K06B-Z9: allowlista dispatchu wymienia P5-8-K05A.md, a treść tematu wskazuje P5-8-K06B.md — utworzono K06B.md.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja kopii i harnessu) i Final Control; następnie Operator r2 na lukach 1–2 (wiring kontrolera, verify-k06b-copies.mjs) i pokrycie M3.
DEPLOY/PUSH: NIE WYKONANO
