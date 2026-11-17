"""R-RUSTPORT-P4-364-RENDER-FRAME-R1: mutacje (a)-(e) dispatchu; kazda musi dac FAIL testu p4_364_render_frame.

Uruchomienie (z katalogu rust-port/engine, CARGO_TARGET_DIR poza repo):
    python3 ../../dyspozycje/autobot/runs/R-RUSTPORT-P4-364-RENDER-FRAME-R1/mutate-r1.py
Plik zrodlowy jest przywracany po kazdej mutacji (finally).
"""
import os
import subprocess

RF = "src/domain/render_frame.rs"
BR = "src/bridge.rs"
MUTS = [
    ("a1-pomija-cities", RF, "        cities,\n        units,\n", "        cities: Vec::new(),\n        units,\n"),
    ("a2-pomija-units", RF, "        cities,\n        units,\n", "        cities,\n        units: Vec::new(),\n"),
    (
        "b-ignoruje-seat",
        RF,
        "let seat = seat.map_or(fog.active_seat, PlayerId::new);",
        "let seat = { let _ = seat; fog.active_seat };",
    ),
    (
        "c-ignoruje-buildMode",
        RF,
        "    if build_highlight_mode_active(&build_ui) {\n",
        "    if false && build_highlight_mode_active(&build_ui) {\n",
    ),
    (
        "d-emituje-StateChanged",
        BR,
        "            let frame = self.adapter.render_frame(seat, ui)?;\n"
        "            return Ok(BridgeDispatch {\n"
        "                response: BridgeResponse {\n"
        "                    contract_version: CONTRACT_VERSION,\n"
        "                    request_id,\n"
        "                    result: BridgeResult::RenderFrame { frame },\n"
        "                },\n"
        "                events: Vec::new(),",
        "            let frame = self.adapter.render_frame(seat, ui)?;\n"
        "            let st = self.adapter.execute(EngineCommand::GetState)?;\n"
        "            return Ok(BridgeDispatch {\n"
        "                response: BridgeResponse {\n"
        "                    contract_version: CONTRACT_VERSION,\n"
        "                    request_id: request_id.clone(),\n"
        "                    result: BridgeResult::RenderFrame { frame },\n"
        "                },\n"
        "                events: vec![BridgeEvent::StateChanged { contract_version: CONTRACT_VERSION, "
        "request_id, state: st }],",
    ),
    ("e-CONTRACT_VERSION", BR, "pub const CONTRACT_VERSION: u16 = 1;", "pub const CONTRACT_VERSION: u16 = 2;"),
]

for name, rel, old, new in MUTS:
    orig = open(rel, encoding="utf-8").read()
    assert orig.count(old) == 1, name
    open(rel, "w", encoding="utf-8").write(orig.replace(old, new))
    try:
        r = subprocess.run(
            ["cargo", "test", "--test", "p4_364_render_frame"],
            capture_output=True,
            text=True,
            timeout=580,
        )
        out = r.stdout + r.stderr
        failed = [l.split()[1] for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        verdict = "FAIL (oczekiwane)" if r.returncode != 0 else "PASS (MUTANT PRZEZYL)"
        print(f"{name}: exit={r.returncode} {verdict}; FAILED: {', '.join(failed) or '(kompilacja)'}", flush=True)
    finally:
        open(rel, "w", encoding="utf-8").write(orig)
