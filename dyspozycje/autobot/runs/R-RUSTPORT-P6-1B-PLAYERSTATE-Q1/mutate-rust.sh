#!/bin/bash
# Mutacje Rust (P6.1B): kazda zmiana MUSI zaczerwienic test p6_1b_playerstate. Przywraca pliki po kazdej.
# Odtwarzalne: sciezki wyliczane wzgledem tego skryptu (repo), podmiana przez mutate-subst.py z repo.
# Uzycie: bash mutate-rust.sh   (z dowolnego katalogu w worktree; CARGO_TARGET_DIR mozna nadpisac)
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../../.." && pwd)"
ENG="$ROOT/rust-port/engine"
SUBST="$HERE/mutate-subst.py"
TMP="$(mktemp -d)"
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-/home/user/cargo-target-shared/$(basename "$ROOT")}"
P="$ENG/src/domain/player.rs"
D="$ENG/data/derived/research-costs.json"
cp "$P" "$TMP/player.rs.orig"
cp "$D" "$TMP/research-costs.json.orig"
restore() { cp "$TMP/player.rs.orig" "$P"; cp "$TMP/research-costs.json.orig" "$D"; }
trap restore EXIT

run() {
  name="$1"; file="$2"; old="$3"; new="$4"
  restore
  python3 -I "$SUBST" "$file" "$old" "$new"
  if [ $? -ne 0 ]; then echo "MUTACJA $name: BLAD PODMIANY"; return; fi
  (cd "$ENG" && cargo test --test p6_1b_playerstate 2>&1 | grep -E "^test result|FAILED|error\[" | head -3) > "$TMP/mut-out.txt"
  if grep -q "FAILED\|error\[" "$TMP/mut-out.txt"; then
    echo "MUTACJA $name: ZABITA ($(grep -c FAILED "$TMP/mut-out.txt") linii FAILED)"
  else
    echo "MUTACJA $name: PRZEZYLA"
  fi
}

run M1-utf16-as-utf8 "$P" "a.encode_utf16().cmp(b.encode_utf16())" "a.as_bytes().cmp(b.as_bytes())"
run M2-js-trim-as-std-trim "$P" "s.trim_matches(is_js_whitespace)" "s.trim()"
run M3-queue-max-off-by-one "$P" "research_plan_length(state) >= self.params.research_queue_max" "research_plan_length(state) > self.params.research_queue_max"
run M4-era-max-dropped "$P" "state.era = state.era.max(target);" "state.era = target;"
run M5-tier-gate-le "$P" "if other.poziom < p && !done.contains(tech_id(other))" "if other.poziom <= p && !done.contains(tech_id(other))"
run M6-progress-not-clamped "$P" "ratio.min(1.0)" "ratio"
run M7-money-skips-notes "$P" ".contains(self.params.uwagi_pieniadza_igla.as_str())" ".contains(\"zzzz\")"
run M8-queue-not-promoted "$P" "state.player_research_target_id = Some(queued);" "let _ = queued;"
# M9a: PIERWSZY wariant (usuniecie filtra wejsciowego raw.is_empty()) - mutant ROWNOWAZNY (oczekiwane: PRZEZYLA).
# Pusty napis i tak jest odrzucany pozniej przez filtr czesci (!s.is_empty()), wiec zachowanie jest identyczne.
run M9a-prereq-empty-raw-filter-removed "$P" "if raw.is_empty() || self.is_no_prereq(&raw.to_lowercase())" "if self.is_no_prereq(&raw.to_lowercase())"
# M9b: DRUGI wariant (filtr czesci staje sie wrazliwy na wielkosc liter) - oczekiwane: ZABITA.
run M9b-prereq-part-sentinel-case-sensitive "$P" ".filter(|s| !s.is_empty() && !self.is_no_prereq(&s.to_lowercase()))" ".filter(|s| !s.is_empty() && !self.is_no_prereq(s))"
run M10-epoch-diacritics-ignored "$P" ".map(|c| self.params.diakrytyki_epoki.get(&c).copied().unwrap_or(c))" ".map(|c| c)"
# Runda 2:
run M11-research-step-not-atomic "$P" "let result = self.research_step_inner(&mut work, techs, gate, difficulty)?;" "let result = self.research_step_inner(state, techs, gate, difficulty)?; work = state.clone();"
run M12-research-queue-no-default "$P" "#[serde(rename = \"researchQueue\", default)]" "#[serde(rename = \"researchQueue\")]"
run M13-tech-json-vs-cost-table-drift "$D" "\"koszt_bazowy\": 5," "\"koszt_bazowy\": 6,"
restore
echo "PLIKI PRZYWROCONE"
