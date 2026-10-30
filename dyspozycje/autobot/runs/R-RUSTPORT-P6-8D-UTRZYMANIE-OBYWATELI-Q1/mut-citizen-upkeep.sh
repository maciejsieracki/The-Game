#!/bin/bash
# Mutation checks for P6.8D citizen upkeep (poprawka r2: odtwarzalnosc).
# Uruchomienie z dowolnego katalogu wewnatrz worktree:
#   bash dyspozycje/autobot/runs/R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1/mut-citizen-upkeep.sh
# Sciezki wzgledne wzgledem korzenia worktree (git rev-parse), kopia oryginalu w mktemp,
# trap przywraca plik nawet po przerwaniu (Ctrl-C / blad). Zadnych hardkodowanych worktree.
set -u
ROOT="$(git rev-parse --show-toplevel)" || exit 1
ENGINE="$ROOT/rust-port/engine"
cd "$ENGINE" || exit 1
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$ENGINE/target}"
F=src/domain/resource_production.rs
ORIG="$(mktemp)" || exit 1
cp "$F" "$ORIG" || exit 1
restore() {
  if [ -f "$ORIG" ]; then
    cp "$ORIG" "$F"
    rm -f "$ORIG"
  fi
}
trap restore EXIT INT TERM

mutate() {
  local expr="$1"
  local label="$2"
  cp "$ORIG" "$F"
  sed -i "$expr" "$F"
  if cmp -s "$F" "$ORIG"; then
    echo "MUT [$label]: SED NO-OP"
    return
  fi
  if timeout 250 cargo test -q --test p6_8d_citizen_upkeep >/dev/null 2>&1; then
    echo "MUT [$label]: SURVIVED"
  else
    echo "MUT [$label]: KILLED"
  fi
}

mutate 's/if drained >= need {/if drained > need {/' 'drained>=need to >'
mutate 's/if positive_stock(empire_stock, key) > 0.0 {/if positive_stock(empire_stock, key) >= 0.0 {/' 'gate >0 to >=0'
mutate 's/let need = (pop \* CITIZEN_UPKEEP_RATE_PER_CITIZEN).floor();/let need = (pop * CITIZEN_UPKEEP_RATE_PER_CITIZEN).round();/' 'need floor to round'
mutate 's/era.floor().max(1.0) as i64/era.floor() as i64/' 'era max(1) removed'
mutate 's/        value: -qty,/        value: qty,/' 'display missing sign'
mutate 's/if drained > 0.0 {/if drained >= 0.0 {/' 'deductions >0 to >=0'
mutate 's/let pop = if population.is_finite() \&\& population > 0.0 {/let pop = if population.is_finite() {/' 'drain pop nonpositive guard removed'

cp "$ORIG" "$F"
if cmp -s "$F" "$ORIG"; then echo "RESTORED"; fi
