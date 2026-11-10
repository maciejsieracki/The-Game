STATUS: PASS-WITH-NOTES (runda 1 = grupa C3 + `sceneTimingReport.ts` wg jawnego podziału na rundy; temat NIE jest domknięty — `newGameFlow.ts` r2, cykl C1 r3–r4)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1
GOAL: Szósta partia portu paneli UI do `src-tauri/frontend-v2/` (C1, C3, `newGameFlow.ts`, narzędzia D-UI-7) — DTO/kontroler MOCK, harness DOM vs pin `edb8fb56`, mutacje, regresja P5.2–P5.6.
ZMIANY/COMMIT: baza `origin/rust-port/parity-v2` @ `51a62a89`; port `hud.ts` (+ rejestracja mostu `armyStackHudSuppression`), `empireDetailPanel.ts`, `empireDetailTypes.ts`, `sceneTimingReport.ts`; nowe `controller/empireQueries.ts`, `ui/portHudEmpire.ts`, harness `tools/dom-harness/run-hud-empire.mjs` + `mutate-hud-empire.mjs`; `viewmodel/types.ts`, `mockCatalog.ts`, `controller/index.ts`, `main.ts`, `package.json` (skrypty), `PORTING-QUEUE.md`; dokument `dyspozycje/rust-port/p5/P5-7-PORT-HUD-CITYPANEL.md`; logi `r1-logi/`. SHA: `c3f84c3d` (rodzic `51a62a89`; uzupełnione w r2 — zarzut 9 Evaluatora r1; pierwotnie „patrz commit worktree”). Uwaga r2: twierdzenie „`git diff --check` czysto” dotyczyło drzewa roboczego przed dodaniem nowych plików i było błędne dla commita (zarzut 4) — poprawka w `02-operator-r2.md`.
TESTY: `npm ci` EXIT=0; `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (`plików=140 trafień=0`, pin-copies 434/0); `vite build` EXIT=0; harness P5.7 924 przypadki / 0 różnic, asercje v2 6/6; mutacje 29/29 wykrytych (jeden przebieg, EXIT=0); regresja P5.2/P5.3/P5.4/P5.5/P5.6: 3861/0, 3618/0, 1649/0, 1784/0, 6401/0.
BLOKADY: brak technicznych. `perfTestPanel.ts` pominięty z powodem (D-UI-7: `THREE.WebGLRenderer` + `generujSwiatAsync`). ZAŁOŻENIA P5.7-Z0..Z3 w dokumencie §1, §3.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (C3 + `sceneTimingReport.ts`); po akceptacji Operator r2 = `newGameFlow.ts`, r3 = cykl C1 (`cityPanel.ts`, `cityUxFrame.ts`) z pinu `edb8fb56`.
DEPLOY/PUSH: NIE WYKONANO
