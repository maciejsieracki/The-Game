import subprocess, sys
LIB = "src/lib.rs"
M = [
 ("E01","wall_clock nie akumulowany", "        view.wall_clock += wall_ms;\n", ""),
 ("E02","Pomin: skipped nie ustawiane", "        view.skipped = true;\n", ""),
 ("E03","last_frame nie zapisywany", "        view.last_frame = Some(f.clone());\n", "        let _ = f;\n"),
 ("E04","po bitwie unit_selected_after_build_open zostaje", "        frame_ui.unit_selected_after_build_open = false;\n        frame_ui.hover = None;", "        frame_ui.hover = None;"),
 ("E05","po bitwie force_visible_unit_id zostaje", "        self.ui.map_ui.force_visible_unit_id = None;\n", ""),
 ("E06","Aborted bez wyjscia UI", "                self.exit_battle_ui(false)\n                    .map_err(SiegeClientError::Refresh)?;\n                return", "                return"),
 ("E07","start nie zeruje battle_end", "        self.battle_end = None;\n        self.battle_closed = None;\n        self.ui.siege_map_panel_open", "        self.battle_closed = None;\n        self.ui.siege_map_panel_open"),
 ("E08","start nie zeruje battle_closed", "        self.battle_end = None;\n        self.battle_closed = None;\n        self.ui.siege_map_panel_open", "        self.battle_end = None;\n        self.ui.siege_map_panel_open"),
 ("E09","Finish bez wyniku = Applied-like panic -> Silent", "            None => SiegeBattleEnd::Aborted {\n                city_id,\n                reason: \"finish answer without a result\".to_owned(),\n            },", "            None => return Err(SiegeClientError::NoBattle),"),
 ("E10","afterSiegeUi: remis -> odparty", "        } else if result.winner == BattleWinner::Remis {\n            Self::Draw", "        } else if result.winner == BattleWinner::Remis {\n            Self::Repelled"),
 ("E11","afterSiegeUi: zdobycie bez sprawdzenia captured", "        if result.winner == BattleWinner::Atakujacy && captured {", "        if result.winner == BattleWinner::Atakujacy {"),
 ("E12","spawn: ostatnia akcja zamiast pierwszej (wzorzec r2)", "        if !spawn_cell.iter().any(|(u, _)| *u == id.get()) {", "        spawn_cell.retain(|(u, _)| *u != id.get());\n        {"),
 ("E13","Move: flaga muru zawsze false", "            } => (*id, (*from_col, *from_row), None),\n            BattleActionKindDto::ClimbWall", "            } => (*id, (*from_col, *from_row), Some(false)),\n            BattleActionKindDto::ClimbWall"),
 ("E14","LeaveField: flaga muru z ramki", "            } => (*id, (*from_col, *from_row), Some(true)),", "            } => (*id, (*from_col, *from_row), None),"),
 ("E15","start z Rout/Shaken dopuszczony", "            | BattleActionKindDto::Shaken { .. }\n            | BattleActionKindDto::Rout { .. } => {", "            => {"),
 ("E16","player_side Def", "        player_side: BattleSide::Atk,", "        player_side: BattleSide::Def,"),
 ("E17","siege false", "        siege: true,", "        siege: false,"),
 ("E18","Aborted bez stanu w state_changed: Finish zawsze on_state_changed", "        if frame_ui != self.ui.frame_ui {\n            return self.set_frame_ui(frame_ui);\n        }\n        self.recompose()", "        self.ui.frame_ui = frame_ui;\n        self.on_state_changed()"),
 ("E19","feed: licznik odpowiedzi nie liczony", "    view.answers += 1;\n", ""),
 ("E20","nieznana strona -> Atk", "            Some(other) => return Err(format!(\"unit {id}: side {other:?}\")),", "            Some(_) => BattleSide::Atk,"),
 ("E21","Finish: fed? zignorowany (blad playbacku)", "        fed?;\n        self.battle_end", "        let _ = fed;\n        self.battle_end"),
 ("E22","Step: blad kolejnosci po zmianie fazy (feed: faza przed straznikiem)", "    view.order\n        .accept(&p.actions, p.frame.as_ref())\n        .map_err(SiegeClientError::Order)?;\n    view.answers += 1;", "    view.phase = p.phase;\n    view.order\n        .accept(&p.actions, p.frame.as_ref())\n        .map_err(SiegeClientError::Order)?;\n    view.answers += 1;"),
 ("E23","tower_projectile zignorowany", "                    tower_projectile: st.tower_projectile,", "                    tower_projectile: None,"),
 # r2 (obrona): mutanty nowych gałęzi Z1/Z2
 ("O24","Z1 cofnięte: flaga muru z pierwszej akcji zmieniającej komórkę albo z ramki (logika r1)",
  "        if !spawn_cell.iter().any(|(u, _)| *u == id.get()) {\n            spawn_cell.push((id.get(), from));\n        }\n        if let Some(w) = wall {",
  "        if !spawn_cell.iter().any(|(u, _)| *u == id.get()) {\n            spawn_cell.push((id.get(), from));\n            let fw = frame.units.iter().find(|u| u.id == id).is_some_and(|u| u.on_wall_walkway);\n            spawn_wall.push((id.get(), wall.unwrap_or(fw)));\n        }\n        if let Some(w) = wall.filter(|_| false) {"),
 ("O25","Z2 cofnięte: nowa sesja nie zeruje battle_closed",
  "        self.battle_end = None;\n        self.battle_closed = None;\n        let map", "        self.battle_end = None;\n        let map"),
 ("O26","flaga muru z OSTATNIEJ akcji zmieniającej flagę",
  "            if !spawn_wall.iter().any(|(u, _)| *u == id.get()) {\n                spawn_wall.push",
  "            spawn_wall.retain(|(u, _)| *u != id.get());\n            {\n                spawn_wall.push"),
 ("O27","flaga muru spawnu zawsze z ramki",
  "            .map_or(fu.on_wall_walkway, |(_, w)| *w);", "            .map_or(fu.on_wall_walkway, |_| fu.on_wall_walkway);"),
 ("O28","Damage na starcie dopuszczony",
  "            BattleActionKindDto::Damage { .. }\n            | BattleActionKindDto::Kill { .. }", "            BattleActionKindDto::Kill { .. }"),
]
orig = open(LIB, encoding="utf-8").read()
res=[]
try:
    for mid, d, old, new in M:
        if len(sys.argv)>1 and mid not in sys.argv[1:]: continue
        n = orig.count(old)
        if n != 1:
            res.append((mid,d,f"BLAD WZORCA ({n})")); print(mid,"BLAD",n,flush=True); continue
        open(LIB,"w",encoding="utf-8").write(orig.replace(old,new,1))
        p = subprocess.run(["cargo","test","--test","siege_battle_client"],capture_output=True,text=True,timeout=1500)
        failed=[l.split()[1] for l in p.stdout.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        if p.returncode!=0 and "could not compile" in p.stderr: failed=["kompilacja"]
        v=("PRZEZYL" if p.returncode==0 else "ZABITY")
        res.append((mid,d,v+" "+",".join(failed))); print(mid,v,failed,flush=True)
finally:
    open(LIB,"w",encoding="utf-8").write(orig)
print("\n| ID | Mutacja | Werdykt |\n|---|---|---|")
for r in res: print("| %s | %s | %s |"%r)
