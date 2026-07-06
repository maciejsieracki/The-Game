#!/usr/bin/env bash
# Odtworzenie środowiska builda INTEGRATORA z KLONU GitHub (workflow od 2026-07-06).
# Zasady (OBIEG / wpis MASTERA [15:05]): build WYŁĄCZNIE ze świeżego klonu gałęzi main;
# konfigi+data też z klonu; push robi WYŁĄCZNIE Maciej; PRZED buildem sprawdź HEAD.
set -e
REPO="https://github.com/maciejsieracki/The-Game.git"
KLON=/tmp/klon
BK=/tmp/bk

echo "== 1. świeży klon (main) =="
chmod -R u+w "$KLON" 2>/dev/null || true; rm -rf "$KLON" 2>/dev/null || true
git clone --depth 1 -b main "$REPO" "$KLON"
git config --global --add safe.directory "$KLON" 2>/dev/null || true
echo "== HEAD =="; git -C "$KLON" log -1 --format='%h · %ci · %s'
echo ">> STOP-CHECK: jeśli HEAD NIE zawiera potrzebnych zmian — wpis 'CZEKAM-NA: Maciej — push' i STOP. Zakaz budowania ze starego HEAD."

echo "== 2. drzewo builda z klonu =="
GR="$KLON/gra-robocza"
chmod -R u+w "$BK" 2>/dev/null || true; rm -rf "$BK" 2>/dev/null || true; mkdir -p "$BK/data"
cp "$GR"/konfigiKopiaMaster/package.json "$GR"/konfigiKopiaMaster/package-lock.json "$GR"/konfigiKopiaMaster/tsconfig.json "$GR"/konfigiKopiaMaster/vite.config.ts "$GR"/konfigiKopiaMaster/index.html "$BK/"
cp -r "$GR/srcKopiaMaster" "$BK/src"
cp "$GR/data — kopia/"*.json "$BK/data/"

echo "== 3. zależności builda =="
cd "$BK"
npm install --no-save --no-audit --no-fund --ignore-scripts esbuild@0.21 vite@5.4 vite-plugin-singlefile@2.3 three@0.169 typescript@5.6

echo "== 4. bramka tsc (smoke) + build =="
npx --no-install tsc --noEmit
npx --no-install vite build --logLevel warn
echo "OK — bundle: $BK/dist/index.html"
echo ">> Dalej ręcznie: stempel (CIV-BUILD-STAMP-PENDING -> 'YYYY-MM-DD HH:MM PL · <md5pre12>') -> deploy cp na 9 plików -> node tools/generate-start-hub.cjs -> kontrola HOST-side (grep stempla+markerów, pending=0)."
