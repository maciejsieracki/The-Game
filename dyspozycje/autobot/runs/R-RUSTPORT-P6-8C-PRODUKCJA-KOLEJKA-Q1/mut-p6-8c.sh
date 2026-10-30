#!/bin/bash
# P6.8C: mutacje galezi sterujacych w rust-port/engine/src/domain/production_queue.rs.
# Kazda mutacja: sed -> cargo test --test p6_8c_vectors -> oczekiwane FAIL (wykryta) -> przywrocenie pliku.
# Uzycie: bash mut-p6-8c.sh <nr_zakresu: 1 albo 2> ; log: stdout (zapisany do dowody/).
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
F="$ROOT/rust-port/engine/src/domain/production_queue.rs"
B="$(mktemp -d)/production_queue.orig.rs.txt"
cp "$F" "$B"
cd "$ROOT/rust-port/engine" || exit 2

run() {
  local label="$1"
  local expr="$2"
  sed -i "$expr" "$F"
  if cmp -s "$F" "$B"; then
    echo "$label: SED_BEZ_ZMIANY (mutacja nie zastosowana)"
    return
  fi
  local out
  out=$(CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 timeout 500 cargo test --test p6_8c_vectors 2>&1)
  local res
  res=$(echo "$out" | grep -E "^test result" | head -1)
  if [ -z "$res" ]; then
    echo "$label: BLAD_KOMPILACJI_LUB_BRAK_WYNIKU"
  elif echo "$res" | grep -q "0 failed"; then
    echo "$label: NIE_WYKRYTA ($res)"
  else
    echo "$label: WYKRYTA ($res)"
  fi
  cp "$B" "$F"
}

if [ "${1:-1}" = "1" ]; then
  run M01-queue-slot-zero "s/index.fract() == 0.0 \&\& index >= 0.0/index.fract() == 0.0 \&\& index > 0.0/"
  run M02-forfeit-le-zero "s/forfeited.is_nan() || forfeited <= 0.0 {/forfeited.is_nan() || forfeited < 0.0 {/"
  run M03-withdraw-gt-zero "s/Some(banked) if banked > 0.0 =>/Some(banked) if banked >= 0.0 =>/"
  run M04-eta-min-one "s/Some(js_max(1.0, (rem \/ praca).ceil()))/Some(js_max(0.0, (rem \/ praca).ceil()))/"
  run M05-advance-threshold "s/if accumulated < front.koszt {/if accumulated <= front.koszt {/"
  run M06-promote-slot-min "s/filter(|\&s| s >= 1)/filter(|\&s| s >= 0)/"
else
  run M07-enqueue-banked-gt "s/kolejka.push(if banked > 0.0 {/kolejka.push(if banked >= 0.0 {/"
  run M08-sanitize-front-legacy "s/Jednostka);\$/Budynek);/"
  run M09-bonus-nonfinite "s/let bonus = if speed_bonus.is_finite() {/let bonus = if true {/"
  run M10-enqueue-empty-branch "s/if prod.kolejka.is_empty() {/if false {/"
  run M11-insert-postep-gt "s/kolejka.is_empty() \&\& prod.postep.is_finite() \&\& prod.postep > 0.0 {/kolejka.is_empty() \&\& prod.postep.is_finite() {/"
  run M12-advance-paused "s/if prod.wstrzymana == Some(true) {/if false {/"
fi

if cmp -s "$F" "$B"; then echo "PLIK_PRZYWROCONY_OK"; else echo "PLIK_NIEPRZYWROCONY"; fi
