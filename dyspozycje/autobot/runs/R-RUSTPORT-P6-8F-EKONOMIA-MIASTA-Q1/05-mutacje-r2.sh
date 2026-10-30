#!/bin/bash
# Mutacje na economy_city_fns.rs (runda 2). Plik ORYGINALNY przywracany po kazdej mutacji z kopii.
# Uzycie: mut.sh <indeks_od> <indeks_do>
set -u
ENGINE=/home/user/The-Game/.claude/worktrees/wf_71a7ae3a-5c3-4/rust-port/engine
SRC=$ENGINE/src/domain/economy_city_fns.rs
BAK=/tmp/tmp.PGaLvrVcaw/economy_city_fns.rs.orig
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
cp "$SRC" "$BAK"
cd "$ENGINE" || exit 1

IDS=(M1 M2 M3 M4 M5 M6 M8 M9 M11 M12 M13 M14 M15 M16)
DESCS=(
"productionProgress: >= zamienione na >"
"productionProgress: bez Math.floor na praca"
"redukcja: bez sprawdzenia obecnosci budynku"
"sufit redukcji 0.60 -> 1.00"
"happiness: continue -> break przy nieznanym id"
"js_min: bez galezi NaN"
"happiness: ostatni (nie pierwszy) wpis katalogu"
"corruption_rate: bez min z capem"
"city entries: ostatni wpis (rposition)"
"corruption_rate: wspolczynnik miast zamiast dystansu"
"corruption_rate: dzielnik 100 -> 10"
"redukcja: bez sufitu js_min"
"redukcja: 0.30 -> 0.25 na budynek"
"happiness: levelFor pominiete"
)
EXPRS=(
's/if nowa >= current_build_cost/if nowa > current_build_cost/'
's/praca_per_turn\.floor\(\)/praca_per_turn/'
's/if built_ids\.contains\(&id\) \{/if true {/'
's/const KORUPCJA_REDUKCJA_SUFIT: f64 = 0\.60;/const KORUPCJA_REDUKCJA_SUFIT: f64 = 1.00;/'
's/else \{\n            continue;/else {\n            break;/'
's/if a\.is_nan\(\) \|\| b\.is_nan\(\) \{/if false {/'
's/catalog\.iter\(\)\.find\(\|b\| b\.id == \*bid\)/catalog.iter().rev().find(|b| b.id == *bid)/'
's/js_min\(cap_pct, strata_pct\) \/ 100\.0/strata_pct \/ 100.0/'
's/catalog\.iter\(\)\.position\(\|b\| b\.id == \*bid\)/catalog.iter().rposition(|b| b.id == *bid)/'
's/liczba_wszystkich_miast \* params\.wspolczynnik_miast/liczba_wszystkich_miast * params.wspolczynnik_dystansu/'
's/js_min\(cap_pct, strata_pct\) \/ 100\.0/js_min(cap_pct, strata_pct) \/ 10.0/'
's/js_min\(KORUPCJA_REDUKCJA_SUFIT, suma\)/suma/'
's/const KORUPCJA_REDUKCJA_NA_BUDYNEK: f64 = 0\.30;/const KORUPCJA_REDUKCJA_NA_BUDYNEK: f64 = 0.25;/'
's/let level = level_for\(bdef\);/let level = { let _ = \&mut level_for; 1.0 };/'
)

FROM=${1:-0}; TO=${2:-$((${#IDS[@]}-1))}
for ((i=FROM; i<=TO && i<${#IDS[@]}; i++)); do
  ID=${IDS[$i]}; DESC=${DESCS[$i]}; EXPR=${EXPRS[$i]}
  cp "$BAK" "$SRC"
  perl -0pi -e "$EXPR" "$SRC"
  if cmp -s "$BAK" "$SRC"; then
    echo "$ID NIE-ZASTOSOWANA ($DESC) EXIT=2"; continue
  fi
  timeout 300 cargo test --lib economy_city_fns > /tmp/tmp.PGaLvrVcaw/mut-$ID-unit.log 2>&1; UE=$?
  timeout 300 cargo test --test economy_city_vectors > /tmp/tmp.PGaLvrVcaw/mut-$ID-vec.log 2>&1; VE=$?
  UK=$([ $UE -ne 0 ] && echo tak || echo nie)
  VK=$([ $VE -ne 0 ] && echo tak || echo nie)
  if [ $UE -ne 0 ] || [ $VE -ne 0 ]; then ST=ZABITA; else ST=PRZETRWALA; fi
  echo "$ID $ST | $DESC | zabita_jednostkowymi=$UK (EXIT=$UE) | zabita_wektorami=$VK (EXIT=$VE)"
done
cp "$BAK" "$SRC"
cmp "$BAK" "$SRC" && echo "RESTORE_OK EXIT=0"
