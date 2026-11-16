#!/usr/bin/env bash
# MUTANT (R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1, zarzut 4 Evaluatora): usuniecie ochrony Array.isArray
# przy odczycie orderMultByCity w bundlu biezacego kodu. Powtarzalne z repo:
#   1) kopia bundla (zbudowanego vite z gra/src, poza repo) do katalogu MUTANT,
#   2) sed: `if(Array.isArray(ke))for` -> `if(true)for` (dokladnie 1 wystapienie, inaczej przerwanie),
#   3) narzedzie --phase new na zapisie STAREGO kodu (save-old-6t.json), port 8774,
#   4) wynik narzedzia zapisany jako mutant-result.json; oryginalny new-result.json przywrocony.
# Uzycie: bash mutant-run.sh <katalog-bundla-biezacego> <plik-zapisu-old-6t.json> <katalog-gra>
set -eu
DIST="$1"; SAVE="$2"; GRA="$3"
EV="$(cd "$(dirname "$0")" && pwd)"
MUT="$(mktemp -d "${SCRATCH:-/tmp}/mutant-XXXXXX")"
cp -r "$DIST"/. "$MUT"/
N=$(grep -o 'if(Array.isArray(ke))for' "$MUT/index.html" | wc -l)
[ "$N" = "1" ] || { echo "BLAD: wystapien guardu=$N (oczekiwano 1)"; exit 2; }
sed -i 's/if(Array.isArray(ke))for/if(true)for/' "$MUT/index.html"
cp "$EV/new-result.json" "$MUT/orig-new-result.json" 2>/dev/null || true
set +e
(cd "$GRA" && node tools/save-load-old-save-compat-live.cjs --phase new --new-dist "$MUT" --save-in "$SAVE" --port 8774) > "$EV/mutant-new-run.txt" 2>&1
RC=$?
set -e
cp "$EV/new-result.json" "$EV/mutant-result.json"
[ -f "$MUT/orig-new-result.json" ] && cp "$MUT/orig-new-result.json" "$EV/new-result.json"
echo "EXIT=$RC (oczekiwano 1 = narzedzie wykrylo regresje)"
grep -E '^(PASS|FAIL|NIE_ZMIERZONO|WYNIK)' "$EV/mutant-new-run.txt" | cut -c1-240
rm -rf "$MUT"
