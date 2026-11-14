#!/bin/bash
# Przegląd ziaren: mapgen-rivers-seed22-diag-sweep.sh <gen.js> <outdir> <limit_s> <rozmiar> <seed...>
# Dla każdego ziarna: czas generacji [s] albo TIMEOUT(limit) z ostatnią fazą. Wynik: <outdir>/sweep-<rozmiar>.tsv
GEN="$1"; OUT="$2"; LIM="$3"; SZ="$4"; shift 4
mkdir -p "$OUT"
LABEL=Standardowy; [ "$SZ" = "maly" ] && LABEL="Mały"
for S in "$@"; do
  L0=$(cut -d' ' -f1 /proc/loadavg)
  T0=$(date +%s.%N)
  timeout "$LIM" node "$GEN" "$S" "$SZ" "$LABEL" > "$OUT/run-$SZ-$S.log" 2> "$OUT/run-$SZ-$S.err"
  RC=$?
  T1=$(date +%s.%N)
  EL=$(echo "$T1 - $T0" | bc)
  LAST=$(grep -E '^PHASE' "$OUT/run-$SZ-$S.log" | tail -1 | sed 's/^PHASE //')
  if [ $RC -eq 124 ]; then R="TIMEOUT(${LIM}s)"; else R="OK"; fi
  printf "%s\t%s\t%s\t%.1f\tload=%s\tlast=%s\n" "$S" "$SZ" "$R" "$EL" "$L0" "$LAST" >> "$OUT/sweep-$SZ.tsv"
done
echo SWEEP_DONE >> "$OUT/sweep-$SZ.tsv"
