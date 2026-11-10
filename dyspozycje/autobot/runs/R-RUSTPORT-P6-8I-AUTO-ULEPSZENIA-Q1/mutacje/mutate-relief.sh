#!/usr/bin/env bash
# P6.8I relief: mutacje predykatu rust-port/engine/src/domain/auto_improvements/relief_preserving.rs.
# Kazda mutacja: podmiana jednej galezi, `cargo test --test p6_8i_relief`, oczekiwany FAIL (zabita).
# Uruchamiac z korzenia repo; plik jest przywracany z kopii po kazdej mutacji.
set -u
REPO="$(git rev-parse --show-toplevel)"
F="$REPO/rust-port/engine/src/domain/auto_improvements/relief_preserving.rs"
BAK="$(mktemp -d)/relief_preserving.rs.orig"
cp "$F" "$BAK"
export CARGO_TARGET_DIR=/dev/shm/p6-8i-relief CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
cd "$REPO/rust-port/engine" || exit 2
run() {
  local name="$1" expr="$2"
  cp "$BAK" "$F"
  sed -i "$expr" "$F"
  if cmp -s "$BAK" "$F"; then echo "MUTANT $name: SED_NOOP"; return; fi
  if cargo test --test p6_8i_relief -q >/dev/null 2>&1; then echo "MUTANT $name: SURVIVED"; else echo "MUTANT $name: KILLED"; fi
}
run M1_drop_legacy_kopalnia 's/key == KOPALNIA_LEGACY_KEY || //'
run M2_prefix_contains 's/key.starts_with(KOPALNIA_PREFIX)/key.contains(KOPALNIA_PREFIX)/'
run M3_all_to_any 's/layers.iter().all(/layers.iter().any(/'
run M4_drop_nonempty 's/!layers.is_empty() \&\& //'
run M5_drop_tartak 's/"kamieniolom", "tartak"/"kamieniolom", "tartaX"/'
run M6_drop_explicit_return 's/        return true;/        return false;/'
run M7_legacy_to_prefix_only 's/key == KOPALNIA_LEGACY_KEY || key.starts_with(KOPALNIA_PREFIX)/key.starts_with(KOPALNIA_PREFIX)/'
run M8_negate_all 's/layers.iter().all(|k| preserves_hill_relief_key(k.as_ref()))/layers.iter().all(|k| !preserves_hill_relief_key(k.as_ref()))/'
# X1-X7 (FC r1): mutanty dodatkowe zmierzone przez Final Control
run X1_prefix_no_underscore 's/const KOPALNIA_PREFIX: \&str = "kopalnia_";/const KOPALNIA_PREFIX: \&str = "kopalnia";/'
run X2_drop_bydlo 's/\["bydlo", "owce", "lama", "kamieniolom", "tartak"\]/["bydlX", "owce", "lama", "kamieniolom", "tartak"]/'
run X3_drop_owce 's/\["bydlo", "owce", "lama", "kamieniolom", "tartak"\]/["bydlo", "owcX", "lama", "kamieniolom", "tartak"]/'
run X4_drop_lama 's/\["bydlo", "owce", "lama", "kamieniolom", "tartak"\]/["bydlo", "owce", "lamX", "kamieniolom", "tartak"]/'
run X5_drop_kamieniolom 's/\["bydlo", "owce", "lama", "kamieniolom", "tartak"\]/["bydlo", "owce", "lama", "kamieniolX", "tartak"]/'
run X6_explicit_starts_with 's/PRESERVES_HILL_RELIEF_EXPLICIT_KEYS.contains(\&key)/PRESERVES_HILL_RELIEF_EXPLICIT_KEYS.iter().any(|e| key.starts_with(e))/'
run X7_legacy_starts_with 's/key == KOPALNIA_LEGACY_KEY/key.starts_with(KOPALNIA_LEGACY_KEY)/'
cp "$BAK" "$F"
cmp -s "$BAK" "$F" && echo "RESTORED OK"
