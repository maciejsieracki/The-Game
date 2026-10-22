#!/usr/bin/env bash
# Test negatywny P6.M09: kazda mutacja kodu/tabeli MUSI zostac wykryta przez `cargo test --test p6_m09_*`.
# Uzycie (z rust-port/engine, CARGO_TARGET_DIR ustawiony): ../../dyspozycje/.../mutations.sh
set -u
SRC=src/domain/mapgen/cluster_rivals.rs
JSON=data/derived/mapgen-cluster-rivals.json
cp "$SRC" /tmp/m09-src.bak
cp "$JSON" /tmp/m09-json.bak
restore() { cp /tmp/m09-src.bak "$SRC"; cp /tmp/m09-json.bak "$JSON"; }
trap restore EXIT

run_case() { # nazwa plik sed-expr
  local name="$1" file="$2" expr="$3"
  restore
  sed -i "$expr" "$file"
  if cmp -s "$file" "/tmp/m09-$( [ "$file" = "$SRC" ] && echo src || echo json ).bak"; then
    echo "MUTACJA $name: BRAK ZMIANY W PLIKU (zle wyrazenie sed)"; return
  fi
  local out
  out=$(cargo test --test p6_m09_rivals --test p6_m09_tables 2>&1)
  local failed
  failed=$(echo "$out" | grep -c "^test .* FAILED")
  if [ "$failed" -gt 0 ] || echo "$out" | grep -q "error\["; then
    echo "MUTACJA $name: WYKRYTA (testy FAILED: $failed)"
  else
    echo "MUTACJA $name: NIEWYKRYTA !!!"
  fi
}

run_case "pack_radius ceil->floor" "$SRC" 's/\.ceil() as i64)/.floor() as i64)/'
run_case "[ROWNOWAZNA: ziarno hub-chain nieobserwowalne] hub_chain seed xor zmieniony" "$SRC" 's/0x9e37_79b9/0x9e37_79b8/'
run_case "land_pool d<=packR -> d<packR" "$SRC" 's/\.filter(|(_, d)| \*d <= pack_r)/.filter(|(_, d)| *d < pack_r)/'
run_case "nearest preferred odwrocone" "$SRC" 's/i64::from(b.preferred)/i64::from(a.preferred)/; s/\.cmp(&i64::from(a.preferred))/.cmp(\&i64::from(b.preferred))/'
run_case "[ROWNOWAZNA: ziarno hub-chain nieobserwowalne] retry seed 2 pominiety" "$SRC" 's/seed.wrapping_add(RETRY_SEED_ADDS\[1\])/seed/'
run_case "tabela: margines polplaszczyzny" "$JSON" 's/"wartosc": -0.01/"wartosc": 0.5/'
run_case "tabela: promien min hex 5->4" "$JSON" '0,/"wartosc": 5/s//"wartosc": 4/'
run_case "slots: stolica gracza nie zajmuje nazwy" "$SRC" 's/    used_names.insert(own);/    let _ = own;/'
run_case "hexes_at_distance bez dedupe" "$SRC" 's/if !seen.insert((n.q, n.r)) {/if false \&\& !seen.insert((n.q, n.r)) {/'
run_case "group: odwrocony filtr rywali" "$SRC" 's/        if slot.is_same_type_rival {/        if !slot.is_same_type_rival {/'
run_case "shuffle j = floor(rand*i)" "$SRC" 's/\* ((i + 1) as f64)/* (i as f64)/'
run_case "axis prog 0.25 -> 0.0 (tabela)" "$JSON" 's/"wartosc": 0.25/"wartosc": 0.0/'
run_case "axis: seed % 6 -> seed % 5" "$SRC" 's/(seed as usize) % dirs.len()/(seed as usize) % 5/'
restore
echo "PRZYWROCONO: $(cmp -s /tmp/m09-src.bak "$SRC" && echo src-ok) $(cmp -s /tmp/m09-json.bak "$JSON" && echo json-ok)"
