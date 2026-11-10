#!/usr/bin/env bash
# Bramki P5.1 r1 — surowe logi z EXIT. Uruchamiane z katalogu src-tauri/frontend-v2.
WT=/home/user/The-Game/.claude/worktrees/wf_bcb1b0ee-f7d-1
FE=$WT/src-tauri/frontend-v2
L=$WT/dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/r1-logi
PIN_UI=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/pin/gra/src/ui
MUT=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/mutation
cd "$FE" || exit 2
rm -rf node_modules dist
{ echo "\$ (cwd=src-tauri/frontend-v2) node -v; npm -v"; node -v; npm -v; echo "\$ npm ci --no-audit --no-fund"; npm ci --no-audit --no-fund 2>&1; echo "EXIT=$?"; } > "$L/01-npm-ci.log" 2>&1
{ echo "\$ npx tsc --noEmit"; npx tsc --noEmit 2>&1; echo "EXIT=$?"; } > "$L/02-tsc.log"
{ echo "\$ npm run check"; npm run check 2>&1; echo "EXIT=$?"; } > "$L/03-check.log"
{ echo "\$ npx vite build"; npx vite build 2>&1; echo "EXIT=$?"; echo "\$ ls -la dist dist/assets"; ls -la dist dist/assets; } > "$L/04-vite-build.log"
# Kalibracja bramy na pinie (gra/src/ui @ edb8fb56, wypakowane git archive do scratch)
{ echo "\$ node tools/check-no-logic-imports.mjs <scratch>/pin/gra/src/ui --core-only   (oczekiwane: 220 wg P5-0 §9)"; node tools/check-no-logic-imports.mjs "$PIN_UI" --core-only 2>&1 | sed "s#$PIN_UI#<pin>/gra/src/ui#g"; echo "EXIT=${PIPESTATUS[0]}";
  echo "\$ node tools/check-no-logic-imports.mjs <scratch>/pin/gra/src/ui   (CORE+EXT)"; node tools/check-no-logic-imports.mjs "$PIN_UI" 2>&1 | tail -n 1 | sed "s#$PIN_UI#<pin>/gra/src/ui#g"; echo "EXIT=${PIPESTATUS[0]}"; } > "$L/05-gate-calibration-pin.log"
# Mutacja: kopia src + wstrzyknięte importy zakazane → brama musi dać EXIT 1
rm -rf "$MUT"; mkdir -p "$MUT"; cp -r src "$MUT/src"
printf "import { loadGameData } from '../data/loader';\ntype E = import('../game/research').EraGateInfo;\n" >> "$MUT/src/ui/formatPl.ts"
printf "export { x } from '../../game/production';\n" > "$MUT/src/controller/leak.ts"
{ echo "\$ (mutacja: +2 linie w src/ui/formatPl.ts, +1 plik src/controller/leak.ts) node tools/check-no-logic-imports.mjs <mut>/src"; node tools/check-no-logic-imports.mjs "$MUT/src" 2>&1 | sed "s#$MUT#<mut>#g"; echo "EXIT=${PIPESTATUS[0]} (oczekiwane 1)";
  echo "\$ (mutacja kopii: +1 bajt \\\\n na końcu src/ui/naukaLabel.ts w drzewie roboczym, potem przywrócenie) node tools/verify-pin-copies.mjs"; } > "$L/06-gate-mutation.log"
# Mutacja kopii: zmiana pliku w drzewie roboczym i przywrócenie
cp src/ui/naukaLabel.ts "$MUT/naukaLabel.bak"
printf "\n" >> src/ui/naukaLabel.ts
{ node tools/verify-pin-copies.mjs 2>&1; echo "EXIT=$? (oczekiwane 1)"; } >> "$L/06-gate-mutation.log"
cp "$MUT/naukaLabel.bak" src/ui/naukaLabel.ts
{ echo "\$ (po przywróceniu) node tools/verify-pin-copies.mjs"; node tools/verify-pin-copies.mjs 2>&1; echo "EXIT=$?"; } >> "$L/06-gate-mutation.log"
rm -rf "$MUT"
# Niezależne porównanie sha256 kopii z `git show edb8fb56:<ścieżka>`
{ echo "\$ python3 -I shatable.py <worktree> <table>   (sha256 kopii vs git show edb8fb56:<ścieżka>)"; python3 -I /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/scripts/shatable.py "$WT" /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/sha-table.md 2>&1; echo "EXIT=$?"; } > "$L/07-sha256-vs-git-show.log"
