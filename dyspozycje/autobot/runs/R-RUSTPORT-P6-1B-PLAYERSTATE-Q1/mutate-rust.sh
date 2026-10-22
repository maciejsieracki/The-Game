#!/bin/bash
# Mutacje Rust: kazda zmiana MUSI zaczerwienic test p6_1b_playerstate. Przywraca plik po kazdej.
set -u
ENG=/home/user/The-Game/.claude/worktrees/wf_5fbe99b9-a41-1/rust-port/engine
F=$ENG/src/domain/player.rs
BAK=/tmp/claude-0/p61b/player.rs.orig
cp "$F" "$BAK"
export CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_5fbe99b9-a41-1 CARGO_PROFILE_DEV_DEBUG=0
run() {
  name="$1"; old="$2"; new="$3"
  cp "$BAK" "$F"
  python3 /tmp/claude-0/p61b/subst.py "$F" "$old" "$new"
  if [ $? -ne 0 ]; then echo "MUTACJA $name: BLAD PODMIANY"; return; fi
  (cd $ENG && cargo test --test p6_1b_playerstate 2>&1 | grep -E "^test result|FAILED|error\[" | head -3) > /tmp/claude-0/p61b/mut-out.txt
  if grep -q "FAILED\|error\[" /tmp/claude-0/p61b/mut-out.txt; then echo "MUTACJA $name: ZABITA ($(grep -c FAILED /tmp/claude-0/p61b/mut-out.txt) linii FAILED)"; else echo "MUTACJA $name: PRZEZYLA"; fi
}
run M1-utf16-as-utf8 "a.encode_utf16().cmp(b.encode_utf16())" "a.as_bytes().cmp(b.as_bytes())"
run M2-js-trim-as-std-trim "s.trim_matches(is_js_whitespace)" "s.trim()"
run M3-queue-max-off-by-one "research_plan_length(state) >= self.params.research_queue_max" "research_plan_length(state) > self.params.research_queue_max"
run M4-era-max-dropped "state.era = state.era.max(target);" "state.era = target;"
run M5-tier-gate-le "if other.poziom < p && !done.contains(tech_id(other))" "if other.poziom <= p && !done.contains(tech_id(other))"
run M6-progress-not-clamped "ratio.min(1.0)" "ratio"
run M7-money-skips-notes ".contains(self.params.uwagi_pieniadza_igla.as_str())" ".contains(\"zzzz\")"
run M8-queue-not-promoted "state.player_research_target_id = Some(queued);" "let _ = queued;"
run M9-prereq-part-sentinel-case-sensitive ".filter(|s| !s.is_empty() && !self.is_no_prereq(&s.to_lowercase()))" ".filter(|s| !s.is_empty() && !self.is_no_prereq(s))"
run M10-epoch-diacritics-ignored ".map(|c| self.params.diakrytyki_epoki.get(&c).copied().unwrap_or(c))" ".map(|c| c)"
cp "$BAK" "$F"
echo "PLIK PRZYWROCONY"
