#!/usr/bin/env python3
"""R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1: mutanty klienta bitwy oblezniczej (rust-port/client/src/lib.rs).

Kazdy mutant: dokladna podmiana tekstu (musi wystapic dokladnie raz), `cargo test --test siege_battle_client`,
przywrocenie pliku. Werdykt: ZABITY (test FAIL albo blad kompilacji testu), PRZEZYL (testy zielone).
Uruchomienie z katalogu rust-port/client: python3 <ten plik> [ID ...]; CARGO_TARGET_DIR z srodowiska.
"""
import subprocess
import sys

LIB = "src/lib.rs"

MUTANTS = [
    ("M01", "straznik: rowny czas odrzucony",
     "            if t.is_nan() || t < prev {",
     "            if t.is_nan() || t <= prev {"),
    ("M02", "straznik: NaN przechodzi",
     "            if t.is_nan() || t < prev {",
     "            if t < prev {"),
    ("M03", "straznik: nie wszystko-albo-nic (czas przesuwany w petli)",
     "            prev = t;\n        }\n        self.last_queued = prev;",
     "            prev = t;\n            self.last_queued = t;\n        }"),
    ("M04", "straznik: ramka pominieta",
     "        for t in actions.iter().map(|a| a.t0).chain(frame.map(|f| f.v_now)) {",
     "        for t in actions.iter().map(|a| a.t0).chain(frame.map(|f| f.v_now).filter(|_| false)) {"),
    ("M05", "Pomin bez apply_snapshot (D-1I6-4)",
     "        if skip {\n            pb.apply_snapshot(scene, f)",
     "        if skip && false {\n            pb.apply_snapshot(scene, f)"),
    ("M06", "akcje nie liczone",
     "    view.actions_received += p.actions.len();",
     "    view.actions_received += 0;"),
    ("M07", "akcje Finish (bez ramki) nie odtworzone",
     "    } else if let Some(last) = p.actions.last() {",
     "    } else if let Some(last) = p.actions.last().filter(|_| false) {"),
    ("M08", "kolory wlascicieli zamienione",
     "                BattleSide::Atk => SIEGE_ATTACKER_COLOR,\n                BattleSide::Def => SIEGE_DEFENDER_COLOR,",
     "                BattleSide::Atk => SIEGE_DEFENDER_COLOR,\n                BattleSide::Def => SIEGE_ATTACKER_COLOR,"),
    ("M09", "brak cofniecia startu (pole spawnu = ramka startu, D-1I6-3b)",
     "        if !spawn_cell.iter().any(|(u, _, _)| *u == id.get()) {",
     "        if false && !spawn_cell.iter().any(|(u, _, _)| *u == id.get()) {"),
    ("M10", "start z obrazeniami nie odrzucony",
     "                return Err(format!(\n                    \"start answer changes HP / morale / presence at t0 {}\",\n                    a.t0\n                ));",
     "                continue;"),
    ("M11", "po bitwie zaznaczenie zostaje",
     "        frame_ui.selected_unit_id = None;\n        frame_ui.unit_selected_after_build_open = false;\n        frame_ui.hover = None;",
     "        frame_ui.unit_selected_after_build_open = false;\n        frame_ui.hover = None;"),
    ("M12", "wynik bez GetRenderFrame (StateChanged zignorowane)",
     "        if state_changed {\n            self.ui.frame_ui = frame_ui;\n            return self.on_state_changed();\n        }",
     "        if state_changed {\n            self.ui.frame_ui = frame_ui;\n            return self.recompose();\n        }"),
    ("M13", "Aborted nie zamyka bitwy",
     "            Err(SiegeSourceError::Battle(SiegeBattleError::Aborted { city_id, reason })) => {\n                self.battle = None;",
     "            Err(SiegeSourceError::Battle(SiegeBattleError::Aborted { city_id, reason })) => {"),
    ("M14", "krok po koncu bitwy wolany w silniku",
     "        if b.phase == SiegeBattlePhaseDto::Running {",
     "        if b.phase == SiegeBattlePhaseDto::Running || true {"),
    ("M15", "drugi start w trakcie bitwy",
     "        if let Some(b) = &self.battle {\n            return Err(SiegeClientError::BattleActive { city_id: b.city_id });\n        }",
     ""),
    ("M16", "panel oblezenia nie zamykany na starcie",
     "        self.ui.siege_map_panel_open = false;\n        let fed",
     "        let fed"),
    ("M17", "afterSiegeUi: kolejnosc galezi (mur przed zdobyciem)",
     "        if result.winner == BattleWinner::Atakujacy && captured {\n            Self::Captured\n        } else if result.capture_blocked {\n            Self::CaptureBlocked",
     "        if result.capture_blocked {\n            Self::CaptureBlocked\n        } else if result.winner == BattleWinner::Atakujacy && captured {\n            Self::Captured"),
    ("M18", "afterSiegeUi: brak galezi cichej",
     "        } else {\n            Self::Silent\n        }",
     "        } else {\n            Self::Repelled\n        }"),
    ("M19", "zamknieta scena nie zachowana",
     "        self.battle_closed = Some(view);",
     "        drop(view);"),
    ("M20", "nowa sesja nie porzuca bitwy",
     "        // A new session has no battle (`CreateSession` = new game, D-WIRB-2).\n        self.battle = None;",
     "        // A new session has no battle (`CreateSession` = new game, D-WIRB-2)."),
    ("M21", "pole na murze z ramki zamiast sprzed wspinaczki",
     "            } => (*id, (*from_col, *from_row), Some(false)),",
     "            } => (*id, (*from_col, *from_row), None),"),
    ("M22", "Pomin bez odtworzenia do ramki",
     "        pb.play_until(scene, f.v_now, wall)\n            .map_err(SiegeClientError::Playback)?;\n        if skip {",
     "        if !skip {\n            pb.play_until(scene, f.v_now, wall)\n                .map_err(SiegeClientError::Playback)?;\n        }\n        if skip {"),
]


def run(ids):
    orig = open(LIB, encoding="utf-8").read()
    results = []
    try:
        for mid, desc, old, new in MUTANTS:
            if ids and mid not in ids:
                continue
            n = orig.count(old)
            if n != 1:
                results.append((mid, desc, f"BLAD WZORCA ({n})"))
                continue
            open(LIB, "w", encoding="utf-8").write(orig.replace(old, new, 1))
            p = subprocess.run(
                ["cargo", "test", "--test", "siege_battle_client"],
                capture_output=True, text=True, timeout=1500,
            )
            verdict = "PRZEZYL" if p.returncode == 0 else "ZABITY"
            failed = [l.split()[1] for l in p.stdout.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
            if p.returncode != 0 and "could not compile" in p.stderr:
                failed = ["kompilacja"]
            results.append((mid, desc, verdict + (" " + ",".join(failed) if failed else "")))
            print(mid, verdict, failed, flush=True)
    finally:
        open(LIB, "w", encoding="utf-8").write(orig)
    print("\n| ID | Mutacja | Werdykt |\n|---|---|---|")
    for mid, desc, v in results:
        print(f"| {mid} | {desc} | {v} |")


if __name__ == "__main__":
    run(set(sys.argv[1:]))
