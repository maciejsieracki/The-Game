"""R-RUSTPORT-P4-364-RENDER-FRAME-R1, Operator r2 (DODATEK r2): mutacje luk domknietych w r2.
Kazda mutacja musi dac FAIL testu p4_364_render_frame. Luki 4/5 (starving/goldDeficit, workerFields)
nie sa produkowane (jawne luki, zaleznosc #310), wiec nie maja mutantow.

Uruchomienie (z katalogu rust-port/engine, CARGO_TARGET_DIR poza repo):
    python3 -I ../../dyspozycje/autobot/runs/R-RUSTPORT-P4-364-RENDER-FRAME-R1/mutate-r2.py
Plik zrodlowy jest przywracany po kazdej mutacji (finally).
"""
import re
import subprocess

RF = "src/domain/render_frame.rs"
MUTS = [
    # Luka 1: buildHighlight.hexes
    ("L1a-zalozenie-miasta-zawsze-false", RF,
     ".is_some_and(|ctx| ctx.check(&start_ctx, q, r).ok)",
     ".is_some_and(|_ctx| false)"),
    ("L1b-cud-pusty", RF,
     "let wonder_hexes = || qualifying_wonder_hexes(state, seat);",
     "let wonder_hexes = Vec::new;"),
    ("L1c-ulepszenie-puste", RF,
     "improvement_qualifying_hexes(bs, civ, key)",
     "{ let _ = (bs, civ, key); Vec::new() }"),
    ("L1d-bez-owiniecia-civ", RF,
     "if !is_improvement_allowed_for_civ(key, Some(civ_arch)) {",
     "if false {"),
    ("L1e-zalozenie-bez-terytorium", RF,
     "within_territory: if self.founding_nodes.is_empty() {",
     "within_territory: if true {"),
    # Luka 2: stacks.vitalsByRepId
    ("L2a-vitals-puste", RF,
     "compute_stack_display(&stos, &attack_of, Some(&deps));",
     "compute_stack_display::<ArmyUnitDef>(&stos, &attack_of, { let _ = &deps; None });"),
    ("L2b-bez-bonusu-trudnosci", RF,
     "difficulty_combat_mult(state, owner)?,",
     "{ let _ = difficulty_combat_mult(state, owner)?; 1.0 },"),
    ("L2c-bez-weterana-w-def", RF,
     "veteran_combat_bonus_frac(battles),",
     "{ let _ = battles; 0.0 },"),
    # Luka 3: units[].hp / hpMax = hpMaxEffective
    ("L3a-hpMax-bez-bonusow", RF,
     "        hp_max: Some(hp_max),",
     "        hp_max: Some(unit_health(Some(def))),"),
    ("L3b-hpMax-bez-parametrow", RF,
     "unit_parametry_bonus_frac(Some(&unit_progress(state, unit_id))),",
     "{ let _ = unit_progress(state, unit_id); 0.0 },"),
    ("L3c-hp-bez-przyciecia", RF,
     "hp.clamp(0.0, max_hp)",
     "{ let _ = max_hp; hp }"),
    # Mutanty r1 E6 i Z3 przeniesione na kod r2 (wzorce z mutate-obrona-r1.py nie wystepuja juz w
    # pliku; a1-a2, b-e, E2-E5b dalej pasuja do kodu r2 i sa w tamtym skrypcie).
    ("E6r2-hp-ignoruje-ekonomie", RF,
     "        hp: hp.unwrap_or(hp_max),",
     "        hp: { let _ = hp; hp_max },"),
    ("Z3r2-ciche-zero-bez-definicji", RF,
     "    defs.get(type_id)\n        .ok_or_else(|| RenderFrameError::UnknownUnitType(type_id.to_owned()))",
     "    Ok(defs.get(type_id).unwrap_or_else(|| defs.values().next().expect(\"defs\")))"),
]

failed_ok = 0
for name, path, old, new in MUTS:
    src = open(path, encoding="utf-8").read()
    assert src.count(old) == 1, f"{name}: wzorzec {old!r} wystepuje {src.count(old)} razy"
    try:
        open(path, "w", encoding="utf-8").write(src.replace(old, new))
        r = subprocess.run(
            ["cargo", "test", "--test", "p4_364_render_frame"],
            capture_output=True, text=True,
        )
        out = r.stdout + r.stderr
        failed = sorted(set(re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)))
        if r.returncode != 0:
            failed_ok += 1
            verdict = "FAIL (oczekiwane)"
        else:
            verdict = "PASS (MUTANT PRZEZYL!)"
        extra = "" if failed else " (blad kompilacji)" if r.returncode != 0 else ""
        print(f"{name}: exit={r.returncode} {verdict}; FAILED: {', '.join(failed)}{extra}", flush=True)
    finally:
        open(path, "w", encoding="utf-8").write(src)
print(f"PODSUMOWANIE: {failed_ok}/{len(MUTS)} mutantow zabitych")
