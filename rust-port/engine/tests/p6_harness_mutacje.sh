#!/usr/bin/env bash
# P6 HARNESS-MUTACJE (R-RUSTPORT-P6-HARNESS-MUTACJE-Q1): skrypt mutacyjny dla petli dystansu
# `ranged_phase::resolve_ranged_phase` (src/domain/combat.rs) wobec wektorow pinu `p6_combat_harness`.
#
# Uruchamiany RECZNIE (nie jest czescia `cargo test`):
#   bash rust-port/engine/tests/p6_harness_mutacje.sh
#
# Dla kazdej z 4 mutacji:
#   1. zapisuje kopie combat.rs,
#   2. stosuje mutacje (sed, zakres linii modulu ranged_phase),
#   3. uruchamia `cargo test --test p6_combat_harness`,
#   4. przywraca combat.rs z kopii (takze przy przerwaniu: trap EXIT) i sprawdza, ze jest identyczny z HEAD.
#
# Werdykt per mutacja:
#   HARNESS=FAIL  -> harness wykryl mutacje (mutant zabity; to oczekiwany wynik),
#   HARNESS=PASS  -> harness przepuscil mutacje (mutant przezyl; luka w wektorach),
#   BLAD          -> mutacja nie zastosowana albo blad kompilacji (wynik niewazny).
#
# Kod produkcyjny combat.rs jest przywracany po kazdej mutacji; skrypt konczy sie kodem 0,
# gdy wszystkie mutacje zostaly ocenione (werdykty FAIL/PASS/BLAD), 1 przy bledzie infrastruktury.
#
# Katalog celu Cargo: CARGO_TARGET_DIR (domyslnie poza repo, w TMPDIR), usuwany na koncu,
# gdy skrypt go utworzyl.

set -u

ENGINE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ENGINE_DIR/src/domain/combat.rs"
REL="rust-port/engine/src/domain/combat.rs"

# Zakres modulu ranged_phase (linie 1059..koniec modulu); wyznaczany dynamicznie po nazwie.
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
  CARGO_TARGET_DIR="$(mktemp -d "${TMPDIR:-/tmp}/civ-harness-mutacje-XXXXXX")"
  CREATED_TARGET=1
fi
export CARGO_TARGET_DIR

BACKUP="$(mktemp "${TMPDIR:-/tmp}/civ-combat-backup-XXXXXX.rs")"
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

# Test bazowy (bez mutacji) musi przechodzic, inaczej wynik mutacji nie ma znaczenia.
run_harness() {
  # Wynik na stdout: linie "test result" z cargo; kod wyjscia cargo jako ostatnia linia "EXIT=<n>".
  local out rc
  out="$(cd "$ENGINE_DIR" && cargo test --test p6_combat_harness 2>&1)"
  rc=$?
  printf '%s\n' "$out"
  echo "EXIT=$rc"
}

echo "== Test bazowy (bez mutacji) =="
BASE_OUT="$(run_harness)"
if ! printf '%s\n' "$BASE_OUT" | grep -q '^test result: ok\.'; then
  echo "BLAD: test bazowy nie przechodzi; mutacje nie sa wiarygodne" >&2
  printf '%s\n' "$BASE_OUT" | tail -40 >&2
  exit 1
fi
echo "BAZA: PASS"

# Mutacje: nazwa | wyrazenie sed (zakres RANGE) .
NAMES=(
  "M1 roll<=hit (granica trafienia: < -> <=)"
  "M2 odwrocenie klucza (pancerz celu w strzale ATK <-> DEF)"
  "M3 usuniecie budzetu rund (if total_rounds > max_rounds -> if false)"
  "M4 zmiana zaokraglenia (obrazenia HP: damage_exact -> damage_exact.round())"
)

# Liczniki wystapien `attacker.armor,` i `defender.armor,` w zakresie modulu: "ATK DEF".
armor_counts() {
  local r
  r="$(sed -n "${RANGE}p" "$SRC")"
  printf '%s %s\n' "$(printf '%s\n' "$r" | grep -c 'attacker\.armor,')" "$(printf '%s\n' "$r" | grep -c 'defender\.armor,')"
}

# Ustawiane przez M2: 1 = zamiana pelna (kazde wystapienie zamienione), 0 = czesciowa.
ARM_SWAP_OK=1

apply_mutation() {
  case "$1" in
    1)
      sed -i "${RANGE}s/let hit = roll < hit_pct;/let hit = roll <= hit_pct;/" "$SRC"
      ;;
    2)
      read -r ARM_A_BEFORE ARM_D_BEFORE <<< "$(armor_counts)"
      sed -i "${RANGE}s/defender\.armor,/@@ARM_A@@/; ${RANGE}s/attacker\.armor,/defender.armor,/; ${RANGE}s/@@ARM_A@@/attacker.armor,/" "$SRC"
      read -r ARM_A_AFTER ARM_D_AFTER <<< "$(armor_counts)"
      # Oczekiwany ksztalt: dokladnie jedno `attacker.armor,` i jedno `defender.armor,` (strzal i kontrastrzal)
      # przed i po zamianie. Inaczej zamiana nie jest pelna/symetryczna i wynik bylby falszywy - wtedy BLAD.
      if [ "$ARM_A_BEFORE" = 1 ] && [ "$ARM_D_BEFORE" = 1 ] && [ "$ARM_A_AFTER" = 1 ] && [ "$ARM_D_AFTER" = 1 ]; then
        ARM_SWAP_OK=1
      else
        ARM_SWAP_OK=0
      fi
      ;;
    3)
      sed -i "${RANGE}s/if total_rounds > max_rounds {/if false \&\& total_rounds > max_rounds {/" "$SRC"
      ;;
    4)
      sed -i "${RANGE}s/hp -= damage_exact;/hp -= damage_exact.round();/" "$SRC"
      ;;
  esac
}

SUMMARY=()
KILLED=0
SURVIVED=0
ERRORS=0
for i in 1 2 3 4; do
  name="${NAMES[$((i-1))]}"
  echo "== $name =="
  cp "$BACKUP" "$SRC"
  ARM_SWAP_OK=1
  apply_mutation "$i"
  if cmp -s "$BACKUP" "$SRC"; then
    echo "BLAD: mutacja M$i nie zmienila combat.rs"
    SUMMARY+=("M$i: BLAD (mutacja nie zastosowana)")
    ERRORS=$((ERRORS+1))
    continue
  fi
  if [ "$ARM_SWAP_OK" != 1 ]; then
    echo "BLAD: mutacja M$i niepelna (zamiana pancerza nie objela wszystkich wystapien)"
    SUMMARY+=("M$i: BLAD (mutacja niepelna) - $name")
    ERRORS=$((ERRORS+1))
    cp "$BACKUP" "$SRC"
    continue
  fi
  OUT="$(run_harness)"
  RC_LINE="$(printf '%s\n' "$OUT" | tail -1)"
  if printf '%s\n' "$OUT" | grep -q '^test result:'; then
    if printf '%s\n' "$OUT" | grep -q '^test result: FAILED'; then
      echo "HARNESS=FAIL ($RC_LINE)"
      SUMMARY+=("M$i: HARNESS=FAIL (mutant wykryty) - $name")
      KILLED=$((KILLED+1))
    else
      echo "HARNESS=PASS ($RC_LINE)"
      SUMMARY+=("M$i: HARNESS=PASS (mutant PRZEZYL) - $name")
      SURVIVED=$((SURVIVED+1))
    fi
  else
    echo "BLAD: brak 'test result' (prawdopodobny blad kompilacji), $RC_LINE"
    printf '%s\n' "$OUT" | grep -E '^error' | head -5
    SUMMARY+=("M$i: BLAD (kompilacja) - $name")
    ERRORS=$((ERRORS+1))
  fi
  cp "$BACKUP" "$SRC"
done

echo
echo "== PODSUMOWANIE =="
for s in "${SUMMARY[@]}"; do echo "$s"; done
echo "zabite=$KILLED przezyte=$SURVIVED bledy=$ERRORS (z 4)"

# Weryfikacja przywrocenia kodu produkcyjnego wzgledem HEAD.
restore
trap - EXIT
if (cd "$ENGINE_DIR" && git diff --quiet -- src/domain/combat.rs); then
  echo "PRZYWROCENIE: combat.rs identyczny z HEAD"
else
  echo "PRZYWROCENIE: UWAGA combat.rs rozni sie od HEAD" >&2
  exit 1
fi
exit 0
