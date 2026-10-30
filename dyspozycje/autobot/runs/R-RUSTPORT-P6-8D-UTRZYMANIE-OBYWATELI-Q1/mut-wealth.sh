#!/bin/bash
# Mutacje dla P6.8D-P2 wealth.ts (modul `wealth` w rust-port/engine/src/domain/turn_economy.rs).
# Uruchomienie z dowolnego katalogu wewnatrz worktree:
#   bash dyspozycje/autobot/runs/R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1/mut-wealth.sh [OD] [DO]
# Kopia oryginalu w mktemp, trap przywraca plik.
set -u
ROOT="$(git rev-parse --show-toplevel)" || exit 1
ENGINE="$ROOT/rust-port/engine"
cd "$ENGINE" || exit 1
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
F=src/domain/turn_economy.rs
ORIG="$(mktemp)" || exit 1
cp "$F" "$ORIG" || exit 1
restore() {
  if [ -f "$ORIG" ]; then
    cp "$ORIG" "$F"
    rm -f "$ORIG"
  fi
}
trap restore EXIT INT TERM

# Kazda mutacja: "sed-expr|etykieta" (wzorce zweryfikowane grepem na tym pliku)
MUTS=(
  's/        js_max(0.0, epoka.floor()) \* p.cap_na_epoke/        epoka.floor() * p.cap_na_epoke/|cap: max(0,floor(epoka)) bez max'
  's/        js_max(1.0, 1.0 + (poziom - 1.0) \* p.mnoznik_na_poziom)/        1.0 + (poziom - 1.0) * p.mnoznik_na_poziom/|mnoznik: bez max(1)'
  's/        if poziom <= 0.0 {/        if poziom < 0.0 {/|zadowolenie: W=0 nie daje kary'
  's/        let poz = js_min(poziom, cap);/        let poz = poziom;/|zadowolenie: bez przyciecia do capu'
  's/        (poz \* p.zadowolenie_max \/ cap).floor()/        (poz * p.zadowolenie_max \/ cap).ceil()/|zadowolenie: ceil zamiast floor'
  's/        let frac = js_min(1.0, js_max(0.0, poziom \/ cap));/        let frac = js_max(0.0, poziom \/ cap);/|rownowaga: bez clamp gora'
  's/        p.prog_na_poziom \* (poziom + 1.0) \* js_max(1.0, epoka.floor())/        p.prog_na_poziom * (poziom + 1.0) * epoka.floor()/|prog: bez max(1, epoka)'
  's/        if pula < 0.0 {/        if pula <= 0.0 {/|spadek: pula==0 wyzwala spadek'
  's/                pula = (pula \* p.zachowanie_po_awansie).floor();/                pula = pula * p.zachowanie_po_awansie;/|awans: pula bez floor'
  's/            if poziom > min_poz {/            if poziom >= min_poz {/|spadek: minPoziom inklusywnie'
  's/        let min_poz = js_max(0.0, min_poziom.unwrap_or(0.0).floor());/        let min_poz = js_max(0.0, min_poziom.unwrap_or(1.0).floor());/|minPoziom domyslny 1'
)

OD="${1:-1}"
DO="${2:-${#MUTS[@]}}"
for ((i = OD; i <= DO && i <= ${#MUTS[@]}; i++)); do
  entry="${MUTS[$((i - 1))]}"
  expr="${entry%|*}"
  label="${entry##*|}"
  cp "$ORIG" "$F"
  sed -i "$expr" "$F"
  if cmp -s "$F" "$ORIG"; then
    echo "MUT $i [$label]: SED NO-OP"
    continue
  fi
  if timeout 250 cargo test -q --test p6_8d_wealth >/dev/null 2>&1; then
    echo "MUT $i [$label]: SURVIVED"
  else
    echo "MUT $i [$label]: KILLED"
  fi
done

cp "$ORIG" "$F"
if cmp -s "$F" "$ORIG"; then echo "RESTORED"; fi
