#!/usr/bin/env bash
# P6 COMBAT-NAN-INF-MUTACJE (R-RUSTPORT-P6-NAN-INF-WEKTORY-Q1, #137, V-K3): mutacje petli dystansu
# `ranged_phase::resolve_ranged_phase` (src/domain/combat.rs):
#   M1: limit rund `total_rounds > max_rounds` -> `>=`,
#   M2: warunek amunicji `ammo > 0` -> `ammo >= 0` (wszystkie wystapienia w module ranged_phase).
# Oczekiwane: HARNESS=FAIL dla testu p6_combat_nan_inf (wiersze V-A*, V-K2; V-M* sa w p6_combat_harness).
#
# Uruchamiany RECZNIE (nie jest czescia `cargo test`):
#   bash rust-port/engine/tests/p6_combat_nan_inf_mutacje.sh
#
# Dla kazdej mutacji: kopia combat.rs -> sed w zakresie modulu ranged_phase -> `cargo test --test <t>`
# -> przywrocenie combat.rs (takze przy przerwaniu: trap EXIT) -> sprawdzenie, ze combat.rs jest jak w HEAD.
#
# Werdykt per mutacja i test:
#   HARNESS=FAIL  -> test wykryl mutacje (mutant zabity; oczekiwany wynik),
#   HARNESS=PASS  -> mutant przezyl (luka w wektorach),
#   BLAD          -> mutacja nie zastosowana albo blad kompilacji (wynik niewazny).

set -u

ENGINE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ENGINE_DIR/src/domain/combat.rs"

START="$(grep -n '^pub mod ranged_phase {' "$SRC" | head -1 | cut -d: -f1)"
if [ -z "$START" ]; then
  echo "BLAD: nie znaleziono 'pub mod ranged_phase' w $SRC" >&2
  exit 1
fi
END="$(awk -v s="$START" 'NR>s && /^}/ {print NR; exit}' "$SRC")"
RANGE="${START},${END}"

export CARGO_INCREMENTAL=0
export CARGO_PROFILE_DEV_DEBUG=0
export CARGO_PROFILE_TEST_DEBUG=0

CREATED_TARGET=0
if [ -z "${CARGO_TARGET_DIR:-}" ]; then
  CARGO_TARGET_DIR="$(mktemp -d "${TMPDIR:-/tmp}/civ-nan-inf-mutacje-XXXXXX")"
  CREATED_TARGET=1
fi
export CARGO_TARGET_DIR

BACKUP="$(mktemp "${TMPDIR:-/tmp}/civ-combat-nan-inf-backup-XXXXXX.rs")"
cp "$SRC" "$BACKUP"

restore() {
  cp "$BACKUP" "$SRC"
  if ! cmp -s "$BACKUP" "$SRC"; then
    echo "BLAD KRYTYCZNY: nie udalo sie przywrocic $SRC" >&2
  fi
  rm -f "$BACKUP"
  if [ "$CREATED_TARGET" = 1 ]; then
    rm -rf "$CARGO_TARGET_DIR"
  fi
}
trap restore EXIT

TESTS=(p6_combat_nan_inf p6_combat_harness)

run_test() {
  # Wynik na stdout: linie cargo; ostatnia linia "EXIT=<n>".
  local t="$1" out rc
  out="$(cd "$ENGINE_DIR" && cargo test --test "$t" 2>&1)"
  rc=$?
  printf '%s\n' "$out"
  echo "EXIT=$rc"
}

echo "== Test bazowy (bez mutacji) =="
for t in "${TESTS[@]}"; do
  BASE_OUT="$(run_test "$t")"
  if ! printf '%s\n' "$BASE_OUT" | grep -q '^test result: ok\.'; then
    echo "BLAD: test bazowy $t nie przechodzi; mutacje nie sa wiarygodne" >&2
    printf '%s\n' "$BASE_OUT" | tail -40 >&2
    exit 1
  fi
  echo "BAZA $t: PASS"
done

NAMES=(
  "M1 limit rund: total_rounds > max_rounds -> >="
  "M2 warunek amunicji: .ammo > 0 -> .ammo >= 0"
)

apply_mutation() {
  case "$1" in
    1)
      sed -i "${RANGE}s/if total_rounds > max_rounds {/if total_rounds >= max_rounds {/" "$SRC"
      ;;
    2)
      sed -i "${RANGE}s/\.ammo > 0/.ammo >= 0/g" "$SRC"
      ;;
  esac
}

ERRORS=0
for i in 1 2; do
  echo "== ${NAMES[$((i-1))]} =="
  cp "$BACKUP" "$SRC"
  apply_mutation "$i"
  if cmp -s "$BACKUP" "$SRC"; then
    echo "BLAD: mutacja M$i nie zmienila combat.rs"
    ERRORS=$((ERRORS+1))
    continue
  fi
  echo "zmienione linie w zakresie ranged_phase: $(sed -n "${RANGE}p" "$SRC" | diff - <(sed -n "${RANGE}p" "$BACKUP") | grep -c '^>')"
  for t in "${TESTS[@]}"; do
    OUT="$(run_test "$t")"
    RC_LINE="$(printf '%s\n' "$OUT" | tail -1)"
    if printf '%s\n' "$OUT" | grep -q '^test result: FAILED'; then
      echo "$t: HARNESS=FAIL ($RC_LINE) - mutant wykryty"
      printf '%s\n' "$OUT" | grep -E '^test .* FAILED$' | head -5
    elif printf '%s\n' "$OUT" | grep -q '^test result: ok\.'; then
      echo "$t: HARNESS=PASS ($RC_LINE) - mutant PRZEZYL"
    else
      echo "$t: BLAD (brak 'test result', prawdopodobny blad kompilacji) ($RC_LINE)"
      printf '%s\n' "$OUT" | grep -E '^error' | head -5
      ERRORS=$((ERRORS+1))
    fi
  done
  cp "$BACKUP" "$SRC"
done

restore
trap - EXIT
if (cd "$ENGINE_DIR" && git diff --quiet -- src/domain/combat.rs); then
  echo "PRZYWROCENIE: combat.rs identyczny z HEAD"
else
  echo "PRZYWROCENIE: UWAGA combat.rs rozni sie od HEAD" >&2
  exit 1
fi
echo "bledy=$ERRORS"
exit 0
