#!/usr/bin/env bash
# Bramki P5.1 r2 (Obrona) — surowe logi z EXIT. Odpowiedź na zarzut 2 Evaluatora r1 (formy importu).
WT=/home/user/The-Game/.claude/worktrees/wf_bcb1b0ee-f7d-3
FE=$WT/src-tauri/frontend-v2
L=$WT/dyspozycje/autobot/runs/R-RUSTPORT-P5-1-UI-SHELL-SKELETON-Q1/r2-logi
TMP=$WT/.r2tmp            # poza commitem; usuwany po pracy
PIN_UI=$TMP/gra/src/ui    # git archive -o $TMP/ui.tar edb8fb56 gra/src/ui && tar -xf … -C $TMP
mkdir -p "$L"
cd "$FE" || exit 2
rm -rf node_modules dist
{ echo "\$ (cwd=src-tauri/frontend-v2) node -v; npm -v"; node -v; npm -v; echo "\$ npm ci --no-audit --no-fund"; npm ci --no-audit --no-fund 2>&1; echo "EXIT=$?"; } > "$L/01-npm-ci.log" 2>&1
{ echo "\$ npx tsc --noEmit"; npx tsc --noEmit 2>&1; echo "EXIT=$?"; } > "$L/02-tsc.log"
{ echo "\$ npm run check"; npm run check 2>&1; echo "EXIT=$?"; } > "$L/03-check.log"
{ echo "\$ npx vite build"; npx vite build 2>&1; echo "EXIT=$?"; } > "$L/04-vite-build.log"
# Kalibracja na pinie (--core-only = regex P5-0 §9 → 220)
{ echo "\$ node tools/check-no-logic-imports.mjs <pin>/gra/src/ui --core-only   (oczekiwane: 220 wg P5-0 §9)"; node tools/check-no-logic-imports.mjs "$PIN_UI" --core-only 2>&1 | sed "s#$PIN_UI#<pin>/gra/src/ui#g"; echo "EXIT=${PIPESTATUS[0]}";
  echo "\$ node tools/check-no-logic-imports.mjs <pin>/gra/src/ui   (CORE+EXT)"; node tools/check-no-logic-imports.mjs "$PIN_UI" 2>&1 | grep -E '\[EXT:|^check-no' | sed "s#$PIN_UI#<pin>/gra/src/ui#g"; echo "EXIT=${PIPESTATUS[0]}"; } > "$L/05-gate-calibration-pin.log"
# Mutacje: każda na świeżej kopii src + index.html, każda osobno musi dać EXIT=1
mut() { # $1 = opis, $2 = plik względny w kopii, $3 = treść dopisywana
  local M=$TMP/mut; rm -rf "$M"; mkdir -p "$M"; cp -r src "$M/src"; cp index.html "$M/index.html"
  printf '%b' "$3" >> "$M/$2"
  echo "\$ [$1] (dopisano do $2: $(printf '%q' "$3")) node tools/check-no-logic-imports.mjs <mut>/src <mut>/index.html"
  node tools/check-no-logic-imports.mjs "$M/src" "$M/index.html" 2>&1 | sed "s#$M#<mut>#g"; echo "EXIT=${PIPESTATUS[0]} (oczekiwane 1)"
  rm -rf "$M"
}
{
  mut "R2-M1 wieloliniowe import(" src/ui/formatPl.ts "\nconst m = import(\n  '../game/x');\n"
  mut "R2-M2 katalog bez segmentu (index)" src/ui/formatPl.ts "\nimport x from '../game';\n"
  mut "R2-M3 util" src/ui/formatPl.ts "\nimport { normPlLabel } from '../util/norm-pl-label';\n"
  mut "R2-M4 buildInfo" src/ui/formatPl.ts "\nimport { CIV_BUILD_STAMP } from '../buildInfo';\n"
  mut "R2-M5 index.html script src" index.html "<script type=\"module\" src=\"/src/game/boot.ts\"></script>\n"
  mut "R2-M6 index.html inline module" index.html "<script type=\"module\">\n  import { a } from '/src/data/loader.ts';\n</script>\n"
  mut "R2-M7 wieloliniowe from" src/main.ts "\nimport {\n  loadGameData,\n} from\n  '../../gra/src/data/loader';\n"
  mut "R2-M8 import.meta.glob" src/main.ts "\nconst g = import.meta.glob('./units/**/*.json');\n"
  mut "R1-M1 data/loader (regresja)" src/ui/formatPl.ts "\nimport { loadGameData } from '../data/loader';\n"
  mut "R1-M2 inline import typu (regresja)" src/ui/formatPl.ts "\ntype E = import('../game/research').EraGateInfo;\n"
  mut "R1-M3 export from (regresja)" src/controller/index.ts "\nexport { x } from '../../game/production';\n"
  echo "\$ (kontrola: kopia bez mutacji) node tools/check-no-logic-imports.mjs <mut>/src <mut>/index.html"
  M=$TMP/mut; rm -rf "$M"; mkdir -p "$M"; cp -r src "$M/src"; cp index.html "$M/index.html"
  node tools/check-no-logic-imports.mjs "$M/src" "$M/index.html" 2>&1 | sed "s#$M#<mut>#g"; echo "EXIT=${PIPESTATUS[0]} (oczekiwane 0)"; rm -rf "$M"
  echo "\$ (mutacja kopii bajtowej: +1 bajt na końcu src/ui/naukaLabel.ts, potem przywrócenie) node tools/verify-pin-copies.mjs"
  cp src/ui/naukaLabel.ts "$TMP/naukaLabel.bak"; printf "\n" >> src/ui/naukaLabel.ts
  node tools/verify-pin-copies.mjs 2>&1; echo "EXIT=$? (oczekiwane 1)"
  cp "$TMP/naukaLabel.bak" src/ui/naukaLabel.ts
  echo "\$ (po przywróceniu) node tools/verify-pin-copies.mjs"; node tools/verify-pin-copies.mjs 2>&1; echo "EXIT=$?"
} > "$L/06-gate-mutation.log"
rm -rf node_modules dist
