#!/bin/bash
# użycie: mkport.sh <ID tematu> [baza] -> kopia szablonu z meta.name = ID tematu (nazwa w UI Workflow = temat)
ID="$1"; SRC="${2:-PORT}"; DIR="$(dirname "$0")"
OUT="$DIR/$SRC-$ID.js"
sed -E "1s/name: '[^']*'/name: '$ID'/; 1s/description: '[^']*'/description: '$ID — Operator, Evaluator, Obrona, Final Control'/" "$DIR/$SRC.js" > "$OUT"
echo "$OUT"
