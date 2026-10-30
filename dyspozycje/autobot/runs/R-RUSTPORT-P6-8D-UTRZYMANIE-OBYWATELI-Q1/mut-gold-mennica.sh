#!/bin/bash
# Mutacje dla P6.8D-P1/P2: gold-deficit (advance, countdown, stat mult, applyGoldDeficitHpLoss)
# oraz mennica-zloto-grace. Plik zrodlowy: rust-port/engine/src/domain/turn_economy.rs.
# Uruchomienie z dowolnego katalogu wewnatrz worktree:
#   bash dyspozycje/autobot/runs/R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1/mut-gold-mennica.sh [OD] [DO]
# (indeksy mutacji 1-based; bez argumentow = wszystkie). Kopia oryginalu w mktemp, trap przywraca plik.
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

# Kazda mutacja: "sed-expr|etykieta"
MUTS=(
  's/let deficyt_zlota = skarbiec < 0.0;/let deficyt_zlota = skarbiec <= 0.0;/|prog skarbiec<0 na <=0'
  's/let tury_po = if deficyt_zlota { tury_przed + 1 } else { 0 };/let tury_po = if deficyt_zlota { tury_przed + 1 } else { tury_przed };/|reset licznika tur usuniety'
  's/>= params.zloto_deficyt_karencja_tur,/> params.zloto_deficyt_karencja_tur,/|karencja >= na >'
  's/Some(js_max(1.0, karencja_tur - t.tury_deficytu_zlota_po as f64))/Some(karencja_tur - t.tury_deficytu_zlota_po as f64)/|countdown bez max(1)'
  's/if u.owner_id != owner_id || u.civilian {/if u.owner_id != owner_id {/|cywil nie pomijany w HP loss'
  's/let loss = js_max(1.0, (max_hp \* frac).floor());/let loss = (max_hp * frac).floor();/|minimum straty 1 usuniete'
  's/if new_hp <= 0.0 {/if new_hp < 0.0 {/|zniszczenie przy hp<0 zamiast <=0'
  's/let frac = js_max(0.0, js_min(1.0, hp_frac));/let frac = js_max(0.0, hp_frac);/|clamp hpFrac gora usuniety'
  's/if mult >= 1.0 || mult <= 0.0 {/if mult > 1.0 || mult <= 0.0 {/|stat mult: mult==1 przechodzi (round4 prog)'
  's/prog_dezercji: cu.prog_dezercji.map(|p| round4(p \* (2.0 - mult))),/prog_dezercji: cu.prog_dezercji.map(|p| p * (2.0 - mult)),/|prog bez round4'
  's/} else if state.had_access_last_turn.get(&owner_id) == Some(&true) {/} else if state.had_access_last_turn.contains_key(\&owner_id) {/|laska po migawce false'
  's/MENNICA_ZLOTO_GRACE_TURNS);/MENNICA_ZLOTO_GRACE_TURNS + 1);/|laska 2 tury'
  's/                if grace > 0 {/                if grace > 1 {/|dekrement laski przy 1 pominiety'
  's/state.grace_turns_left.get(&owner_id).copied().unwrap_or(0) > 0/state.grace_turns_left.get(\&owner_id).copied().unwrap_or(0) > 1/|dostep z laska wymaga >1'
  # r4 (Evaluator r3 zarzut 2-4): pick z is_finite; js_round granica k+0.5 i galaz -0
  's/            Some(x) if x.is_finite() => x,/            Some(x) => x,/|pick: brak is_finite (NaN/Inf w raw)'
  's/        let rounded = if x - floor >= 0.5 {/        let rounded = if x - floor > 0.5 {/|js_round: polowka k+0.5 w dol (> zamiast >=)'
  's/        if rounded == 0.0 && x < 0.0 {/        if false {/|js_round: galaz -0 usunieta'
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
  if timeout 250 cargo test -q --test p6_8d_gold_deficit --test p6_8d_mennica_grace >/dev/null 2>&1; then
    echo "MUT $i [$label]: SURVIVED"
  else
    echo "MUT $i [$label]: KILLED"
  fi
done

cp "$ORIG" "$F"
if cmp -s "$F" "$ORIG"; then echo "RESTORED"; fi
