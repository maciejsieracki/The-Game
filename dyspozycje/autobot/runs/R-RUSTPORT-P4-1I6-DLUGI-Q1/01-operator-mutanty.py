#!/usr/bin/env python3
"""R-RUSTPORT-P4-1I6-DLUGI-Q1 Operator r1: mutanty (plik przywracany z pamięci po każdym przebiegu).

Uruchomienie (z katalogu rust-port, CARGO_TARGET_DIR ustawiony przez wołającego):
    python3 ../dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-DLUGI-Q1/01-operator-mutanty.py [ID ...]
Wynik: linia `ID ZABITY|PRZEZYL|BLAD-MUTACJI opis` na mutanta.
"""
import subprocess
import sys

APPLY = "engine/src/domain/siege_battle_apply.rs"
BRIDGE = "engine/src/bridge.rs"
CLIENT = "client/src/lib.rs"
ENGINE_T = ("engine", ["cargo", "test", "--test", "p4_1i6_dlugi", "--test", "bridge_contract"])
CLIENT_T = ("client", ["cargo", "test", "--test", "siege_battle_client"])

MUTANTS = [
    ("M01", "deploy = some(!isGeneral)", APPLY, ".any(|u| u.is_general)", ".any(|u| !u.is_general)", ENGINE_T),
    ("M02", "player_side Def", APPLY, "        player_side: VmBattleSide::Atk,\n        units,",
     "        player_side: VmBattleSide::Def,\n        units,", ENGINE_T),
    ("M03", "siege_civ stały", APPLY, """        siege_civ: battle
            .input
            .def_civ
            .clone()
            .unwrap_or_else(|| "rzym".to_owned()),""", """        siege_civ: "x".to_owned(),""", ENGINE_T),
    ("M04", "palisada = kamien", APPLY,
     "CityFortificationKind::Palisada => (FortKind::Palisada, Some(VmTowerMaterial::Drewno)),",
     "CityFortificationKind::Palisada => (FortKind::Palisada, Some(VmTowerMaterial::Kamien)),", ENGINE_T),
    ("M05", "tower_rows puste", APPLY, "            tower_material,\n            tower_rows,",
     "            tower_material,\n            tower_rows: { let _ = tower_rows; Vec::new() },", ENGINE_T),
    ("M06", "kolor atakującego = obrońcy", APPLY, "(0usize, &lp.st.atk, VmBattleSide::Atk, SIEGE_ATTACKER_COLOR),",
     "(0usize, &lp.st.atk, VmBattleSide::Atk, SIEGE_DEFENDER_COLOR),", ENGINE_T),
    ("M07", "ammo_max zawsze None", APPLY, "ammo_max: ammo_max.is_finite().then_some(ammo_max),",
     "ammo_max: { let _ = ammo_max; None },", ENGINE_T),
    ("M08", "setup nie dołączony do startu", APPLY, "        p.setup = Some(setup);", "        let _ = setup;", ENGINE_T),
    ("M09", "strzelec wieży zawsze None", APPLY, "    let siege = s.field().siege.as_ref()?;\n    fort_dto",
     "    let siege = s.field().siege.as_ref()?;\n    let _ = siege;\n    None::<()>?;\n    fort_dto", ENGINE_T),
    ("M10", "typ <-> jednostka strzelca", APPLY, """        typ: js_string(row.get("Typ")),
        jednostka: js_string(row.get("Jednostka")),""", """        typ: js_string(row.get("Jednostka")),
        jednostka: js_string(row.get("Typ")),""", ENGINE_T),
    ("M11", "finish ignoruje flagę porzucenia", APPLY,
     "    if battle.abort_requested.swap(false, Ordering::Relaxed) {", "    if false {", ENGINE_T),
    ("M12", "porzucenie dozwolone po kroku", APPLY, "        if !self.ops.is_empty() {\n            return Err(SiegeBattleError::AbortNotAllowed",
     "        if false {\n            return Err(SiegeBattleError::AbortNotAllowed", ENGINE_T),
    ("M13", "klon gubi flagę", APPLY, "abort_requested: AtomicBool::new(self.abort_requested.load(Ordering::Relaxed)),",
     "abort_requested: AtomicBool::new(false),", ENGINE_T),
    ("M14", "DTO: NotFinished jako Session", APPLY,
     "SiegeBattleError::Session(SessionError::NotFinished) => Self::NotFinished,",
     "SiegeBattleError::Session(SessionError::NotFinished) => Self::Session { detail: String::new() },", ENGINE_T),
    ("M15", "DTO: tekst NotFinished inny", APPLY, """            Self::NotFinished => write!(
                f,
                "{}",
                SiegeBattleError::Session(SessionError::NotFinished)
            ),""", """            Self::NotFinished => write!(f, "not finished"),""", ENGINE_T),
    ("M16", "most: błąd bitwy bez typu", BRIDGE, "            siege_battle: Some(SiegeBattleErrorDto::from(error)),",
     "            siege_battle: { let _ = SiegeBattleErrorDto::from(error); None },", ENGINE_T),
    ("M17", "most: Abort emituje StateChanged", BRIDGE,
     "            let events = if matches!(command, EngineCommand::FinishSiegeBattle) {",
     "            let events = if matches!(command, EngineCommand::FinishSiegeBattle | EngineCommand::AbortSiegeBattle) {", ENGINE_T),
    ("M18", "most: abort zwraca city 0", BRIDGE, "            Ok(SiegeBattlePayload::aborted(city_id))",
     "            Ok(SiegeBattlePayload::aborted({ let _ = city_id; 0 }))", ENGINE_T),
    ("M19", "most: abort bez żądania (finish)", BRIDGE, "    battle.request_abort()?;", "", ENGINE_T),
    ("M20", "klient: brak abort po błędzie sceny", CLIENT,
     "                Err(cause) => return Err(self.abort_started_battle(p.city_id, cause)),",
     "                Err(cause) => return Err(cause),", CLIENT_T),
    ("M21", "klient: abort bez końca Aborted", CLIENT,
     "                self.battle_end = Some(SiegeBattleEnd::Aborted { city_id, reason });\n                self.battle_closed = None;\n                cause",
     "                let _ = (city_id, reason);\n                self.battle_closed = None;\n                cause", CLIENT_T),
    ("M22", "klient: pocisk wieży zawsze None", CLIENT, """    start
        .tower_shooter
        .as_ref()
        .map(|t| tower_projectile_kind(t.typ.as_deref(), t.jednostka.as_deref()))""",
     """    let _ = start;
    None""", CLIENT_T),
    ("M23", "klient: AbortFailed zgubiony", CLIENT, """            Err(e) => SiegeClientError::AbortFailed {
                cause: Box::new(cause),
                abort: Box::new(e.into()),
            },""", """            Err(_) => cause,""", CLIENT_T),
    ("M24", "klient: setup ignorowany (scena pusta)", CLIENT, """    let setup: &BattleSetupDto = start
        .setup
        .as_ref()""", """    let setup: &BattleSetupDto = None::<&BattleSetupDto>""", CLIENT_T),
    ("M25", "klient: Aborted z Finish nie rozpoznany", CLIENT,
     "            Err(SiegeSourceError::Battle(SiegeBattleErrorDto::Aborted { city_id, reason })) => {",
     "            Err(SiegeSourceError::Battle(SiegeBattleErrorDto::Aborted { city_id, reason })) if city_id == u64::MAX => {", CLIENT_T),
]


def run(m):
    mid, desc, path, old, new, (crate, cmd) = m
    src = open(path).read()
    if src.count(old) != 1:
        return f"{mid} BLAD-MUTACJI ({src.count(old)} wystąpień) {desc}"
    open(path, "w").write(src.replace(old, new))
    try:
        r = subprocess.run(cmd, cwd=crate, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=1500)
        verdict = "ZABITY" if r.returncode != 0 else "PRZEZYL"
    except subprocess.TimeoutExpired:
        verdict = "ZABITY(timeout)"
    finally:
        open(path, "w").write(src)
    return f"{mid} {verdict} {desc}"


if __name__ == "__main__":
    want = set(sys.argv[1:])
    for m in MUTANTS:
        if want and m[0] not in want:
            continue
        print(run(m), flush=True)
