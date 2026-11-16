//! R-RUSTPORT-P4-1I1B-BATTLE-INSTANT: ścieżka „Pomiń” (E4) — port `computeInstantResult` (`battleScene.ts:20389-20593`)
//! i reguły wyłomu `_skipInstantFallback` (`:3720-3722`) względem wektorów WYKONANYCH na tekście pinu `07d2fbd72`.
//!
//! Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT/dowody/gen-p4-1i1b-vectors.mjs` wykonuje
//! tekst pinu `computeInstantResult` (CAŁY), `_skipInstantFallback`, `isSiegeUnit`/`normName`, `relativeHit`
//! (`facingToward`, `oppositeDir`, `Dir`, `DIR_DELTA`), `isFordTile`/`isShoreAdjacentToFord`, `cityGatedTerrainMultiplier`
//! (+ `normTerrain`, `terrainDefenseMultiplier`), `fortificationDefenseBonusForUnit`, `fieldFortifyDefenseBonus`,
//! `battleUnitCivBonusy`/`battleUnitDifficultyCombatMult`, `BTerrain`/`COMBAT_NAME` i stałe z `combat-params.json`.
//! Podstawione: `resolveCombat` → resolver-rejestrator [`StubResolver`] (TA SAMA formuła niżej), `toCombatUnit` →
//! minimum pól (w Rust działa prawdziwy `to_combat_unit`). Wynik generatora (`p4-1i1b-vectors.json`) jest wklejony
//! niżej bez zmian treści (zminifikowany) jako [`PIN_VECTORS`]. Liczby wyniku są tekstem `String(x)` z JS (bez
//! utraty precyzji przy parsowaniu); Rust porównuje `String(x)` swojej wartości ([`js_str`]).

use std::collections::HashMap;

use civ_engine::domain::civ_bonuses::{BonusValue, CivBonusEntry};
use civ_engine::domain::siege_tactics_blow::{js_round, HitArc};
use civ_engine::domain::siege_tactics_blow_env::{TerrainRow, TileMap};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_inputs_unit::{
    js_num_to_string, BattleUnitIn, CombatUnitModel, StatRow, UVal,
};
use civ_engine::domain::siege_tactics_instant::{
    attacker_has_live_siege_unit, compute_instant_result, instant_verdict_line,
    instant_wall_ever_breached, skip_instant_fallback, InstantConsts, InstantPairOpts,
    InstantPairResolver, InstantScene, InstantUnit, PairCombatResult, INSTANT_MAX_ROUNDS,
};
use civ_engine::domain::siege_tactics_outcome::{
    build_battle_outcome_instant, InstantSkipData, OutcomeError, OutcomeUnit,
};
use civ_view_model::battle::BattleWinner;
use serde_json::Value;

/// Wynik generatora (zminifikowany `p4-1i1b-vectors.json`), bez zmian treści.
const PIN_VECTORS: &str = r#"[
{"name":"atk_przewaga_pole_brod_brzeg_fortyfikacja","input":{"name":"atk_przewaga_pole_brod_brzeg_fortyfikacja","scene":{"terrain":"Plaskie (rownina/laka)","map":{"cols":6,"rows":4,"isMountain":false,"tiles":[0,0,1,0,0,0,0,4,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0]},"atkCiv":["atkSide"],"defCiv":["defSide"],"wallProc":0,"cityDefense":false,"hungerMult":0.75,"atkDiff":1,"defDiff":1.05,"goldMult":0.75,"atkOwn":false,"defOwn":true,"shallowSea":false,"siegeWallCol":-1,"wallEverBreached":false},"atk":[{"id":101,"kategoria":"piechota","hp":60,"q":1,"r":1,"facing":1,"stats":{"Jednostka":"Hoplita","meleeAttack":30,"meleeDefence":10}},{"id":102,"kategoria":"piechota","hp":50,"q":0,"r":2,"facing":1,"stats":{"Jednostka":"Wlocznik","meleeAttack":25,"meleeDefence":8},"civ":["atkUnit"],"diff":1.1,"pancerz":0.1,"parametry":0.05,"hungry":true,"gold":true},{"id":103,"kategoria":"machina","hp":40,"q":0,"r":0,"facing":1,"dead":true,"stats":{"Jednostka":"Taran","Typ":"Siege","meleeAttack":50,"meleeDefence":2}},{"id":104,"kategoria":"jazda","hp":40,"q":5,"r":3,"facing":3,"stats":{"Jednostka":"Jezdziec","meleeAttack":20,"meleeDefence":6}}],"def":[{"id":201,"kategoria":"piechota","hp":50,"q":2,"r":1,"facing":1,"fortified":true,"stats":{"Jednostka":"Strażnik","meleeAttack":12,"meleeDefence":10}},{"id":202,"kategoria":"piechota","hp":45,"q":3,"r":1,"facing":3,"civ":[],"diff":0.9,"stats":{"Jednostka":"Procarz","meleeAttack":10,"meleeDefence":12}}]},"expect":{"winner":"atakujacy","shown":"atakujacy","survivors":[[101,"26"],[102,"24"],[104,"20"]],"log":["P Hoplita>Strażnik Plaskie (rownina/laka) rear 0 A48 D15","P Wlocznik>Procarz Wzgorza front 0 A37 D24","P Jezdziec>Strażnik Plaskie (rownina/laka) front 0 A20 D2","P Hoplita>Strażnik Plaskie (rownina/laka) rear 0 A36 D0","P Wlocznik>Procarz Wzgorza front 0 A24 D3","P Hoplita>Procarz Wzgorza front 0 A26 D0","=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="],"wallEverBreached":false,"defBonus":[[2,1,false,"0"],[3,1,false,"0"],[2,1,false,"0"],[2,1,false,"0"],[3,1,false,"0"],[3,1,false,"0"]],"calls":[{"a":"Hoplita","d":"Strażnik","aAtk":"30","aDef":"10","aHp":"60","dAtk":"12","dDef":"17.25","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"rear","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":["atkSide"],"defCiv":["defSide"],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1.05","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Wlocznik","d":"Procarz","aAtk":"25","aDef":"8","aHp":"50","dAtk":"10","dDef":"12","dHp":"45","maxRounds":30,"defenderTerrain":"Wzgorza","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":["atkUnit"],"defCiv":[],"atkBld":["0.1","0.05"],"defBld":["0","0"],"atkHungry":true,"defHungry":false,"hungerMult":"0.75","atkGold":true,"defGold":false,"goldMult":"0.75","atkDiff":"1.1","defDiff":"0.9","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Jezdziec","d":"Strażnik","aAtk":"20","aDef":"6","aHp":"40","dAtk":"12","dDef":"15","dHp":"15","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":["atkSide"],"defCiv":["defSide"],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1.05","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Hoplita","d":"Strażnik","aAtk":"30","aDef":"10","aHp":"48","dAtk":"12","dDef":"17.25","dHp":"2","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"rear","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":["atkSide"],"defCiv":["defSide"],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1.05","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Wlocznik","d":"Procarz","aAtk":"25","aDef":"8","aHp":"37","dAtk":"10","dDef":"12","dHp":"24","maxRounds":30,"defenderTerrain":"Wzgorza","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":["atkUnit"],"defCiv":[],"atkBld":["0.1","0.05"],"defBld":["0","0"],"atkHungry":true,"defHungry":false,"hungerMult":"0.75","atkGold":true,"defGold":false,"goldMult":"0.75","atkDiff":"1.1","defDiff":"0.9","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Hoplita","d":"Procarz","aAtk":"30","aDef":"10","aHp":"36","dAtk":"10","dDef":"12","dHp":"3","maxRounds":30,"defenderTerrain":"Wzgorza","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":["atkSide"],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"0.9","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true}]}},
{"name":"def_przewaga_miasto_mur_wzgorze","input":{"name":"def_przewaga_miasto_mur_wzgorze","scene":{"terrain":"Wzgorza","map":{"cols":8,"rows":3,"isMountain":false,"tiles":[0,0,0,6,0,2,0,0,0,0,0,6,0,2,0,0,0,0,1,6,0,0,0,0]},"atkCiv":[],"defCiv":["defCity"],"wallProc":200,"cityDefense":true,"hungerMult":0.75,"atkDiff":1,"defDiff":1,"goldMult":0.75,"atkOwn":false,"defOwn":true,"shallowSea":false,"siegeWallCol":3,"wallEverBreached":false},"atk":[{"id":301,"kategoria":"piechota","hp":40,"q":1,"r":1,"facing":1,"stats":{"Jednostka":"Piechur","meleeAttack":15,"meleeDefence":5}},{"id":302,"kategoria":"piechota","hp":30,"q":1,"r":2,"facing":1,"stats":{"Jednostka":"Lucznik","meleeAttack":12,"meleeDefence":4}}],"def":[{"id":401,"kategoria":"piechota","hp":50,"q":3,"r":1,"facing":3,"onWall":true,"stats":{"Jednostka":"Obronca muru","meleeAttack":14,"meleeDefence":8}},{"id":402,"kategoria":"piechota","hp":45,"q":5,"r":1,"facing":3,"stats":{"Jednostka":"Garnizon","meleeAttack":13,"meleeDefence":7}},{"id":403,"kategoria":"piechota","hp":35,"q":2,"r":2,"facing":0,"stats":{"Jednostka":"Wycieczka","meleeAttack":11,"meleeDefence":6}}]},"expect":{"winner":"obronca","shown":"obronca","survivors":[[401,"45"],[402,"40"]],"log":["P Piechur>Obronca muru Plaskie (rownina/laka) front 250 A12 D45","P Lucznik>Garnizon Wzgorza front 250 A0 D40","P Piechur>Wycieczka Las flank 0 A0 D0","=== Natychmiastowy wynik: OBRONCA wygrywa ==="],"wallEverBreached":false,"defBonus":[[3,1,true,"200"],[5,1,false,"200"],[2,2,false,"0"]],"calls":[{"a":"Piechur","d":"Obronca muru","aAtk":"15","aDef":"5","aHp":"40","dAtk":"14","dDef":"8","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"250","defenderOnWallWalkway":true,"override":"1","atkCiv":[],"defCiv":["defCity"],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Lucznik","d":"Garnizon","aAtk":"12","aDef":"4","aHp":"30","dAtk":"13","dDef":"7","dHp":"45","maxRounds":30,"defenderTerrain":"Wzgorza","attackerPosition":"front","structureDefBonusPct":"250","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":["defCity"],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Piechur","d":"Wycieczka","aAtk":"15","aDef":"5","aHp":"12","dAtk":"11","dDef":"6","dHp":"35","maxRounds":30,"defenderTerrain":"Las","attackerPosition":"flank","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":["defCity"],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true}]}},
{"name":"mur_machina_wylom","input":{"name":"mur_machina_wylom","scene":{"terrain":"Plaskie (rownina/laka)","map":{"cols":6,"rows":2,"isMountain":false,"tiles":[0,0,0,6,0,0,0,0,0,6,0,0]},"atkCiv":[],"defCiv":[],"wallProc":300,"cityDefense":true,"hungerMult":0.75,"atkDiff":1,"defDiff":1,"goldMult":0.75,"atkOwn":false,"defOwn":true,"shallowSea":false,"siegeWallCol":3,"wallEverBreached":false},"atk":[{"id":501,"kategoria":"machina","hp":80,"q":2,"r":0,"facing":1,"stats":{"Jednostka":"Taran","Typ":"Siege","meleeAttack":60,"meleeDefence":2}},{"id":502,"kategoria":"piechota","hp":70,"q":2,"r":1,"facing":1,"stats":{"Jednostka":"Legionista","meleeAttack":45,"meleeDefence":12}}],"def":[{"id":601,"kategoria":"piechota","hp":40,"q":3,"r":0,"facing":3,"onWall":true,"stats":{"Jednostka":"Obronca muru","meleeAttack":10,"meleeDefence":5}},{"id":602,"kategoria":"piechota","hp":30,"q":4,"r":1,"facing":3,"stats":{"Jednostka":"Garnizon","meleeAttack":9,"meleeDefence":4}}]},"expect":{"winner":"atakujacy","shown":"atakujacy","survivors":[[502,"54"]],"log":["P Taran>Obronca muru Plaskie (rownina/laka) front 300 A30 D10","P Legionista>Garnizon Plaskie (rownina/laka) front 300 A62 D2","P Taran>Obronca muru Plaskie (rownina/laka) front 300 A0 D0","P Legionista>Garnizon Plaskie (rownina/laka) front 300 A54 D0","=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="],"wallEverBreached":true,"defBonus":[[3,0,true,"300"],[4,1,false,"300"],[3,0,true,"300"],[4,1,false,"300"]],"calls":[{"a":"Taran","d":"Obronca muru","aAtk":"60","aDef":"2","aHp":"80","dAtk":"10","dDef":"5","dHp":"40","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"300","defenderOnWallWalkway":true,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Legionista","d":"Garnizon","aAtk":"45","aDef":"12","aHp":"70","dAtk":"9","dDef":"4","dHp":"30","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"300","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Taran","d":"Obronca muru","aAtk":"60","aDef":"2","aHp":"30","dAtk":"10","dDef":"5","dHp":"10","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"300","defenderOnWallWalkway":true,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Legionista","d":"Garnizon","aAtk":"45","aDef":"12","aHp":"62","dAtk":"9","dDef":"4","dHp":"2","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"300","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true}]}},
{"name":"mur_machina_martwa_bez_wylomu","input":{"name":"mur_machina_martwa_bez_wylomu","scene":{"terrain":"Plaskie (rownina/laka)","map":{"cols":6,"rows":2,"isMountain":false,"tiles":[0,0,0,6,0,0,0,0,0,6,0,0]},"atkCiv":[],"defCiv":[],"wallProc":300,"cityDefense":true,"hungerMult":0.75,"atkDiff":1,"defDiff":1,"goldMult":0.75,"atkOwn":false,"defOwn":true,"shallowSea":false,"siegeWallCol":3,"wallEverBreached":false},"atk":[{"id":501,"kategoria":"machina","hp":80,"q":2,"r":0,"facing":1,"dead":true,"stats":{"Jednostka":"Taran","Typ":"Siege","meleeAttack":60,"meleeDefence":2}},{"id":502,"kategoria":"piechota","hp":70,"q":2,"r":1,"facing":1,"stats":{"Jednostka":"Legionista","meleeAttack":45,"meleeDefence":12}}],"def":[{"id":601,"kategoria":"piechota","hp":40,"q":3,"r":0,"facing":3,"onWall":true,"stats":{"Jednostka":"Obronca muru","meleeAttack":10,"meleeDefence":5}}]},"expect":{"winner":"atakujacy","shown":"atakujacy","survivors":[[502,"54"]],"log":["P Legionista>Obronca muru Plaskie (rownina/laka) front 300 A62 D17","P Legionista>Obronca muru Plaskie (rownina/laka) front 300 A54 D0","=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="],"wallEverBreached":false,"defBonus":[[3,0,true,"300"],[3,0,true,"300"]],"calls":[{"a":"Legionista","d":"Obronca muru","aAtk":"45","aDef":"12","aHp":"70","dAtk":"10","dDef":"5","dHp":"40","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"300","defenderOnWallWalkway":true,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Legionista","d":"Obronca muru","aAtk":"45","aDef":"12","aHp":"62","dAtk":"10","dDef":"5","dHp":"17","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"300","defenderOnWallWalkway":true,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true}]}},
{"name":"bez_muru_machina_po_nazwie","input":{"name":"bez_muru_machina_po_nazwie","scene":{"terrain":"Plaskie (rownina/laka)","map":{"cols":4,"rows":2,"isMountain":true,"tiles":[0,2,0,0,0,0,2,0]},"atkCiv":[],"defCiv":[],"wallProc":0,"cityDefense":false,"hungerMult":0.75,"atkDiff":1,"defDiff":1,"goldMult":0.75,"atkOwn":true,"defOwn":false,"shallowSea":true,"siegeWallCol":-1,"wallEverBreached":false},"atk":[{"id":701,"kategoria":"machina","nazwa":"Katapulta","hp":50,"q":0,"r":0,"facing":1,"stats":{"meleeAttack":35,"meleeDefence":3}}],"def":[{"id":801,"kategoria":"piechota","hp":30,"q":1,"r":0,"facing":0,"stats":{"Jednostka":"Gorale","meleeAttack":8,"meleeDefence":6}},{"id":802,"kategoria":"piechota","hp":25,"q":2,"r":1,"facing":2,"stats":{"Jednostka":"Gorale","meleeAttack":8,"meleeDefence":6}}]},"expect":{"winner":"atakujacy","shown":"atakujacy","survivors":[],"log":["P machina>Gorale Gory flank 0 A23 D0","P machina>Gorale Gory flank 0 A0 D0","=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="],"wallEverBreached":false,"defBonus":[[1,0,false,"0"],[2,1,false,"0"]],"calls":[{"a":"machina","d":"Gorale","aAtk":"35","aDef":"3","aHp":"50","dAtk":"8","dDef":"6","dHp":"30","maxRounds":30,"defenderTerrain":"Gory","attackerPosition":"flank","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":true,"defOwn":false,"shallowSea":true,"terrainDataSame":true,"countersSame":true},{"a":"machina","d":"Gorale","aAtk":"35","aDef":"3","aHp":"23","dAtk":"8","dDef":"6","dHp":"25","maxRounds":30,"defenderTerrain":"Gory","attackerPosition":"flank","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":true,"defOwn":false,"shallowSea":true,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true}]}},
{"name":"remis_hp_atakujacy_wygrywa","input":{"name":"remis_hp_atakujacy_wygrywa","scene":{"terrain":"Plaskie (rownina/laka)","map":{"cols":4,"rows":2,"isMountain":false,"tiles":[0,0,0,0,0,0,0,0]},"atkCiv":[],"defCiv":[],"wallProc":0,"cityDefense":false,"hungerMult":0.75,"atkDiff":1,"defDiff":1,"goldMult":0.75,"atkOwn":false,"defOwn":false,"shallowSea":false,"siegeWallCol":-1,"wallEverBreached":false},"atk":[{"id":901,"kategoria":"piechota","hp":30,"q":0,"r":0,"facing":1,"stats":{"Jednostka":"Pacyfista","meleeAttack":0,"meleeDefence":5}},{"id":902,"kategoria":"piechota","hp":20,"q":0,"r":1,"facing":1,"stats":{"Jednostka":"Pacyfista","meleeAttack":0,"meleeDefence":5}}],"def":[{"id":911,"kategoria":"piechota","hp":50,"q":3,"r":0,"facing":3,"stats":{"Jednostka":"Pacyfista","meleeAttack":0,"meleeDefence":5}}]},"expect":{"winner":"atakujacy","shown":"atakujacy","survivors":[[901,"30"],[902,"20"]],"log":["P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A30 D50","P Pacyfista>Pacyfista Plaskie (rownina/laka) front 0 A20 D50","=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="],"wallEverBreached":false,"defBonus":[[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"],[3,0,false,"0"]],"calls":[{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"30","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Pacyfista","d":"Pacyfista","aAtk":"0","aDef":"5","aHp":"20","dAtk":"0","dDef":"5","dHp":"50","maxRounds":30,"defenderTerrain":"Plaskie (rownina/laka)","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true}]}},
{"name":"brak_mapy_obie_strony_puste","input":{"name":"brak_mapy_obie_strony_puste","scene":{"terrain":"Las","map":null,"atkCiv":[],"defCiv":[],"wallProc":0,"cityDefense":false,"hungerMult":0.75,"atkDiff":1,"defDiff":1,"goldMult":0.75,"atkOwn":false,"defOwn":false,"shallowSea":false,"siegeWallCol":-1,"wallEverBreached":true},"atk":[{"id":1001,"kategoria":"piechota","hp":0,"q":0,"r":0,"facing":1,"stats":{"Jednostka":"Ranny","meleeAttack":5,"meleeDefence":5}}],"def":[{"id":1011,"kategoria":"piechota","hp":20,"q":3,"r":0,"facing":3,"dead":true,"stats":{"Jednostka":"Polegly","meleeAttack":5,"meleeDefence":5}}]},"expect":{"winner":"atakujacy","shown":"atakujacy","survivors":[],"log":["=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="],"wallEverBreached":true,"defBonus":[],"calls":[],"tcu":[]}},
{"name":"brak_mapy_obronca_flanka_las","input":{"name":"brak_mapy_obronca_flanka_las","scene":{"terrain":"Las","map":null,"atkCiv":["atkSide"],"defCiv":["defSide"],"wallProc":0,"cityDefense":false,"hungerMult":0.75,"atkDiff":0.95,"defDiff":1.05,"goldMult":0.5,"atkOwn":false,"defOwn":true,"shallowSea":false,"siegeWallCol":-1,"wallEverBreached":false},"atk":[{"id":1101,"kategoria":"piechota","hp":30,"q":2,"r":0,"facing":2,"stats":{"Jednostka":"Zwiadowca","meleeAttack":9,"meleeDefence":3}}],"def":[{"id":1111,"kategoria":"piechota","hp":60,"q":2,"r":1,"facing":1,"fortified":true,"stats":{"Jednostka":"Weteran","meleeAttack":18,"meleeDefence":9}}]},"expect":{"winner":"obronca","shown":"obronca","survivors":[[1111,"50"]],"log":["P Zwiadowca>Weteran Las flank 0 A0 D50","=== Natychmiastowy wynik: OBRONCA wygrywa ==="],"wallEverBreached":false,"defBonus":[[2,1,false,"0"]],"calls":[{"a":"Zwiadowca","d":"Weteran","aAtk":"9","aDef":"3","aHp":"30","dAtk":"18","dDef":"13.5","dHp":"60","maxRounds":30,"defenderTerrain":"Las","attackerPosition":"flank","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":["atkSide"],"defCiv":["defSide"],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.5","atkDiff":"0.95","defDiff":"1.05","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.5,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.5,"skipGold":true}]}},
{"name":"obronca_w_brodzie_kara","input":{"name":"obronca_w_brodzie_kara","scene":{"terrain":"Plaskie (rownina/laka)","map":{"cols":5,"rows":2,"isMountain":false,"tiles":[0,0,4,0,0,0,0,4,0,0]},"atkCiv":[],"defCiv":[],"wallProc":0,"cityDefense":false,"hungerMult":0.75,"atkDiff":1,"defDiff":1,"goldMult":0.75,"atkOwn":false,"defOwn":false,"shallowSea":false,"siegeWallCol":-1,"wallEverBreached":false},"atk":[{"id":1201,"kategoria":"piechota","hp":50,"q":1,"r":0,"facing":1,"stats":{"Jednostka":"Szturmowiec","meleeAttack":20,"meleeDefence":8}},{"id":1202,"kategoria":"piechota","hp":40,"q":1,"r":1,"facing":1,"stats":{"Jednostka":"Tarczownik","meleeAttack":14,"meleeDefence":10}}],"def":[{"id":1211,"kategoria":"piechota","hp":50,"q":2,"r":0,"facing":3,"stats":{"Jednostka":"Brodowy","meleeAttack":10,"meleeDefence":12}},{"id":1212,"kategoria":"piechota","hp":45,"q":2,"r":1,"facing":3,"fortified":true,"stats":{"Jednostka":"Brodowy okopany","meleeAttack":9,"meleeDefence":11}}]},"expect":{"winner":"atakujacy","shown":"atakujacy","survivors":[[1202,"13"]],"log":["P Szturmowiec>Brodowy Rzeka front 0 A37 D28","P Tarczownik>Brodowy okopany Rzeka front 0 A31 D34","P Szturmowiec>Brodowy Rzeka front 0 A24 D6","P Tarczownik>Brodowy okopany Rzeka front 0 A22 D23","P Szturmowiec>Brodowy Rzeka front 0 A11 D0","P Tarczownik>Brodowy okopany Rzeka front 0 A13 D12","P Szturmowiec>Brodowy okopany Rzeka front 0 A0 D0","=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="],"wallEverBreached":false,"defBonus":[[2,0,false,"0"],[2,1,false,"0"],[2,0,false,"0"],[2,1,false,"0"],[2,0,false,"0"],[2,1,false,"0"],[2,1,false,"0"]],"calls":[{"a":"Szturmowiec","d":"Brodowy","aAtk":"20","aDef":"8","aHp":"50","dAtk":"10","dDef":"9","dHp":"50","maxRounds":30,"defenderTerrain":"Rzeka","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Tarczownik","d":"Brodowy okopany","aAtk":"14","aDef":"10","aHp":"40","dAtk":"9","dDef":"12.375","dHp":"45","maxRounds":30,"defenderTerrain":"Rzeka","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Szturmowiec","d":"Brodowy","aAtk":"20","aDef":"8","aHp":"37","dAtk":"10","dDef":"9","dHp":"28","maxRounds":30,"defenderTerrain":"Rzeka","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Tarczownik","d":"Brodowy okopany","aAtk":"14","aDef":"10","aHp":"31","dAtk":"9","dDef":"12.375","dHp":"34","maxRounds":30,"defenderTerrain":"Rzeka","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Szturmowiec","d":"Brodowy","aAtk":"20","aDef":"8","aHp":"24","dAtk":"10","dDef":"9","dHp":"6","maxRounds":30,"defenderTerrain":"Rzeka","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Tarczownik","d":"Brodowy okopany","aAtk":"14","aDef":"10","aHp":"22","dAtk":"9","dDef":"12.375","dHp":"23","maxRounds":30,"defenderTerrain":"Rzeka","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Szturmowiec","d":"Brodowy okopany","aAtk":"20","aDef":"8","aHp":"11","dAtk":"9","dDef":"12.375","dHp":"12","maxRounds":30,"defenderTerrain":"Rzeka","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":null,"atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":false,"shallowSea":false,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true}]}},
{"name":"miasto_bez_muru_wzgorze","input":{"name":"miasto_bez_muru_wzgorze","scene":{"terrain":"Wzgorza","map":{"cols":5,"rows":2,"isMountain":false,"tiles":[0,0,2,2,0,0,0,0,1,0]},"atkCiv":[],"defCiv":[],"wallProc":0,"cityDefense":true,"hungerMult":0.75,"atkDiff":1,"defDiff":1,"goldMult":0.75,"atkOwn":false,"defOwn":true,"shallowSea":false,"siegeWallCol":-1,"wallEverBreached":false},"atk":[{"id":1301,"kategoria":"piechota","hp":50,"q":1,"r":0,"facing":1,"stats":{"Jednostka":"Najezdzca","meleeAttack":18,"meleeDefence":7}},{"id":1302,"kategoria":"piechota","hp":45,"q":1,"r":1,"facing":1,"stats":{"Jednostka":"Najezdzca","meleeAttack":16,"meleeDefence":6}}],"def":[{"id":1311,"kategoria":"piechota","hp":50,"q":2,"r":0,"facing":3,"stats":{"Jednostka":"Milicja wzgorza","meleeAttack":11,"meleeDefence":9}},{"id":1312,"kategoria":"piechota","hp":40,"q":3,"r":1,"facing":3,"stats":{"Jednostka":"Milicja lasu","meleeAttack":10,"meleeDefence":8}}]},"expect":{"winner":"atakujacy","shown":"atakujacy","survivors":[[1301,"2"],[1302,"11"]],"log":["P Najezdzca>Milicja wzgorza Wzgorza front 0 A34 D30","P Najezdzca>Milicja lasu Las front 0 A28 D20","P Najezdzca>Milicja wzgorza Wzgorza front 0 A18 D10","P Najezdzca>Milicja lasu Las front 0 A11 D0","P Najezdzca>Milicja wzgorza Wzgorza front 0 A2 D0","=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="],"wallEverBreached":false,"defBonus":[[2,0,false,"0"],[3,1,false,"0"],[2,0,false,"0"],[3,1,false,"0"],[2,0,false,"0"]],"calls":[{"a":"Najezdzca","d":"Milicja wzgorza","aAtk":"18","aDef":"7","aHp":"50","dAtk":"11","dDef":"9","dHp":"50","maxRounds":30,"defenderTerrain":"Wzgorza","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Najezdzca","d":"Milicja lasu","aAtk":"16","aDef":"6","aHp":"45","dAtk":"10","dDef":"8","dHp":"40","maxRounds":30,"defenderTerrain":"Las","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Najezdzca","d":"Milicja wzgorza","aAtk":"18","aDef":"7","aHp":"34","dAtk":"11","dDef":"9","dHp":"30","maxRounds":30,"defenderTerrain":"Wzgorza","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Najezdzca","d":"Milicja lasu","aAtk":"16","aDef":"6","aHp":"28","dAtk":"10","dDef":"8","dHp":"20","maxRounds":30,"defenderTerrain":"Las","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true},{"a":"Najezdzca","d":"Milicja wzgorza","aAtk":"18","aDef":"7","aHp":"18","dAtk":"11","dDef":"9","dHp":"10","maxRounds":30,"defenderTerrain":"Wzgorza","attackerPosition":"front","structureDefBonusPct":"0","defenderOnWallWalkway":false,"override":"1","atkCiv":[],"defCiv":[],"atkBld":["0","0"],"defBld":["0","0"],"atkHungry":false,"defHungry":false,"hungerMult":"0.75","atkGold":false,"defGold":false,"goldMult":"0.75","atkDiff":"1","defDiff":"1","atkOwn":false,"defOwn":true,"shallowSea":false,"terrainDataSame":true,"countersSame":true}],"tcu":[{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true},{"hunger":0.75,"skipHunger":true,"gold":0.75,"skipGold":true}]}}
]"#;

/// `terrain-combat.json` pinu (`gra/data/terrain-combat.json` @ `07d2fbd72`): pola `Teren`, `Bonus Obrona`
/// (ta sama tablica, którą generator podaje jako `this.terrainData`).
const PIN_TERRAIN_ROWS: [(&str, &str); 7] = [
    ("Płaskie (równina/łąka)", "+0%"),
    ("Las", "+50%"),
    ("Wzgórza", "+50%"),
    ("Góry", "+75%"),
    ("Rzeka", "+0%"),
    ("Pustynia", "+0%"),
    ("Wybrzeże / Morze", "+0%"),
];

/// `String(x)` z JS ze znakiem zera jak w generatorze (`S`): `-0` → `"-0"`.
fn js_str(x: f64) -> String {
    if x == 0.0 && x.is_sign_negative() {
        "-0".to_string()
    } else {
        js_num_to_string(x)
    }
}

fn arc_str(a: HitArc) -> &'static str {
    match a {
        HitArc::Front => "front",
        HitArc::Flank => "flank",
        HitArc::Rear => "rear",
    }
}

fn typ_nazwa(cu: &CombatUnitModel) -> String {
    match &cu.typ_nazwa {
        UVal::Str(s) => s.clone(),
        other => panic!("typNazwa nie jest napisem: {other:?}"),
    }
}

/// Resolver-rejestrator: ta sama formuła co `resolveCombat` podstawione w generatorze (STUB_RESOLVER).
#[derive(Default)]
struct StubResolver {
    calls: Vec<Value>,
}

impl InstantPairResolver for StubResolver {
    fn resolve_pair(
        &mut self,
        cu_a: &CombatUnitModel,
        cu_d: &CombatUnitModel,
        opts: &InstantPairOpts<'_>,
    ) -> PairCombatResult {
        let kd = match opts.attacker_position {
            HitArc::Rear => 2.0,
            HitArc::Flank => 1.5,
            HitArc::Front => 1.0,
        };
        let ovr = opts.defender_terrain_def_mult_override.unwrap_or(1.0);
        let def_pow = cu_d.melee_defence * (1.0 + opts.structure_def_bonus_pct / 100.0) * ovr;
        let dmg_to_def = js_round(cu_a.melee_attack * kd * 10.0 / def_pow.max(1.0));
        let dmg_to_atk = js_round(cu_d.melee_attack * 10.0 / cu_a.melee_defence.max(1.0));
        let attacker_hp_left = (cu_a.health - dmg_to_atk).max(0.0);
        let defender_hp_left = (cu_d.health - dmg_to_def).max(0.0);
        let cels = |b: &[CivBonusEntry]| -> Value {
            Value::Array(b.iter().map(|e| Value::String(e.cel.clone())).collect())
        };
        self.calls.push(serde_json::json!({
            "a": typ_nazwa(cu_a), "d": typ_nazwa(cu_d),
            "aAtk": js_str(cu_a.melee_attack), "aDef": js_str(cu_a.melee_defence), "aHp": js_str(cu_a.health),
            "dAtk": js_str(cu_d.melee_attack), "dDef": js_str(cu_d.melee_defence), "dHp": js_str(cu_d.health),
            "maxRounds": opts.max_rounds, "defenderTerrain": opts.defender_terrain,
            "attackerPosition": arc_str(opts.attacker_position),
            "structureDefBonusPct": js_str(opts.structure_def_bonus_pct),
            "defenderOnWallWalkway": opts.defender_on_wall_walkway,
            "override": opts.defender_terrain_def_mult_override.map(js_str),
            "atkCiv": cels(opts.attacker_civ_bonusy), "defCiv": cels(opts.defender_civ_bonusy),
            "atkBld": [js_str(opts.attacker_building_bonus.0), js_str(opts.attacker_building_bonus.1)],
            "defBld": [js_str(opts.defender_building_bonus.0), js_str(opts.defender_building_bonus.1)],
            "atkHungry": opts.attacker_army_hungry, "defHungry": opts.defender_army_hungry,
            "hungerMult": js_str(opts.army_hunger_stat_mult),
            "atkGold": opts.attacker_gold_deficit, "defGold": opts.defender_gold_deficit,
            "goldMult": js_str(opts.gold_deficit_stat_mult),
            "atkDiff": js_str(opts.attacker_difficulty_combat_mult),
            "defDiff": js_str(opts.defender_difficulty_combat_mult),
            "atkOwn": opts.attacker_own_territory, "defOwn": opts.defender_own_territory,
            "shallowSea": opts.shallow_sea,
            // `terrainData`/`counters` należą do resolvera (stałe bitwy); pin podaje te same obiekty.
            "terrainDataSame": true, "countersSame": true,
        }));
        PairCombatResult {
            attacker_hp_left,
            defender_hp_left,
            log: vec![format!(
                "P {}>{} {} {} {} A{} D{}",
                typ_nazwa(cu_a),
                typ_nazwa(cu_d),
                opts.defender_terrain,
                arc_str(opts.attacker_position),
                js_str(opts.structure_def_bonus_pct),
                js_str(attacker_hp_left),
                js_str(defender_hp_left)
            )],
        }
    }
}

fn civ(cels: &Value) -> Vec<CivBonusEntry> {
    cels.as_array()
        .expect("lista cel")
        .iter()
        .map(|c| CivBonusEntry {
            typ: "t".into(),
            cel: c.as_str().expect("cel").into(),
            wartosc: BonusValue::Number(1.0),
            opis: None,
            realizuje: None,
            matrix_param_id: None,
        })
        .collect()
}

fn f(v: &Value, k: &str) -> f64 {
    v[k].as_f64().unwrap_or_else(|| panic!("liczba {k}"))
}

fn i(v: &Value, k: &str) -> i32 {
    i32::try_from(v[k].as_i64().unwrap_or_else(|| panic!("całkowita {k}"))).expect("i32")
}

fn b(v: &Value, k: &str) -> bool {
    v[k].as_bool().unwrap_or(false)
}

fn stats(v: &Value) -> StatRow {
    let mut row: StatRow = HashMap::new();
    for (k, x) in v.as_object().expect("stats") {
        let u = match x {
            Value::String(s) => UVal::Str(s.clone()),
            Value::Number(n) => UVal::Num(n.as_f64().expect("f64")),
            other => panic!("pole stats {k}: {other:?}"),
        };
        row.insert(k.clone(), u);
    }
    row
}

fn unit(v: &Value, side_def: bool) -> InstantUnit {
    InstantUnit {
        id: v["id"].as_u64().expect("id"),
        bu: BattleUnitIn {
            stats: Some(stats(&v["stats"])),
            kategoria: v["kategoria"].as_str().expect("kategoria").into(),
            hp: Some(f(v, "hp")),
            veteran_bonus_frac: None,
            army_hungry: b(v, "hungry"),
            gold_deficit: b(v, "gold"),
        },
        nazwa: v["nazwa"].as_str().map(str::to_string),
        dead: b(v, "dead"),
        q: i(v, "q"),
        r: i(v, "r"),
        facing: i(v, "facing"),
        side_def,
        on_wall_walkway: b(v, "onWall"),
        fortified_in_field: b(v, "fortified"),
        pancerz_bonus_frac: v["pancerz"].as_f64(),
        parametry_bonus_frac: v["parametry"].as_f64(),
        civ_bonusy: (!v["civ"].is_null()).then(|| civ(&v["civ"])),
        difficulty_combat_mult: v["diff"].as_f64(),
    }
}

fn pin_consts() -> InstantConsts {
    let c = InstantConsts::from_data().expect("combat-params.json");
    // Pin `gra/data/combat-params.json`: `brod.karaObrona` 0.25, `brod.bonusObronaBrzegu` 0.15,
    // `oblężenie.fortify_obrona_proc` 50 (battleScene.ts:984-993).
    assert_eq!(
        (
            c.brod_kara_obrona,
            c.brod_bonus_brzegu,
            c.fortify_obrona_proc
        ),
        (0.25, 0.15, 50.0)
    );
    c
}

fn scene(sc: &Value) -> InstantScene {
    let terrain_map = if sc["map"].is_null() {
        None
    } else {
        let m = &sc["map"];
        let tiles: Vec<u8> = m["tiles"]
            .as_array()
            .expect("tiles")
            .iter()
            .map(|t| u8::try_from(t.as_u64().expect("kod")).expect("u8"))
            .collect();
        Some(TileMap::new(i(m, "cols"), i(m, "rows"), tiles, b(m, "isMountain")).expect("mapa"))
    };
    InstantScene {
        terrain: sc["terrain"].as_str().expect("terrain").into(),
        terrain_data: PIN_TERRAIN_ROWS
            .iter()
            .map(|(t, bo)| TerrainRow {
                teren: (*t).into(),
                bonus_obrona: Some((*bo).into()),
            })
            .collect(),
        terrain_map,
        attacker_civ_bonusy: civ(&sc["atkCiv"]),
        defender_civ_bonusy: civ(&sc["defCiv"]),
        wall_defense_total_proc: f(sc, "wallProc"),
        is_city_defense: b(sc, "cityDefense"),
        army_hunger_stat_mult: f(sc, "hungerMult"),
        attacker_difficulty_combat_mult: f(sc, "atkDiff"),
        defender_difficulty_combat_mult: f(sc, "defDiff"),
        gold_deficit_stat_mult: f(sc, "goldMult"),
        attacker_own_territory: b(sc, "atkOwn"),
        defender_own_territory: b(sc, "defOwn"),
        shallow_sea: b(sc, "shallowSea"),
        siege_wall_col: f(sc, "siegeWallCol"),
        consts: pin_consts(),
    }
}

struct Built {
    atk: Vec<InstantUnit>,
    def: Vec<InstantUnit>,
    scene: InstantScene,
    wall_before: bool,
}

fn build(input: &Value) -> Built {
    Built {
        atk: input["atk"]
            .as_array()
            .expect("atk")
            .iter()
            .map(|u| unit(u, false))
            .collect(),
        def: input["def"]
            .as_array()
            .expect("def")
            .iter()
            .map(|u| unit(u, true))
            .collect(),
        scene: scene(&input["scene"]),
        wall_before: b(&input["scene"], "wallEverBreached"),
    }
}

fn vectors() -> Vec<Value> {
    let v: Value = serde_json::from_str(PIN_VECTORS).expect("wektory");
    v.as_array().expect("tablica").clone()
}

fn vector(name: &str) -> Value {
    vectors()
        .into_iter()
        .find(|v| v["name"] == name)
        .unwrap_or_else(|| panic!("brak wektora {name}"))
}

fn side_name(s: BattleSide) -> &'static str {
    match s {
        BattleSide::Attacker => "atakujacy",
        BattleSide::Defender => "obronca",
    }
}

/// Wszystkie wektory pinu: werdykt, ocalali, `result.log` (bajt w bajt), `wallEverBreached`, `defBonus` i KAŻDE
/// wejście resolvera (`cu_a`, `cu_d` po korektach Obrony, obiekt opcji `:20534-20567`) w kolejności wywołań.
#[test]
fn wektory_pinu_compute_instant_result() {
    let all = vectors();
    assert_eq!(all.len(), 10, "liczba wektorów");
    for v in &all {
        let name = v["name"].as_str().expect("name");
        let e = &v["expect"];
        let bt = build(&v["input"]);
        let mut res = StubResolver::default();
        let out = skip_instant_fallback(&bt.atk, &bt.def, bt.wall_before, &bt.scene, &mut res);

        assert_eq!(side_name(out.result.winner), e["winner"], "{name}: winner");
        assert_eq!(
            e["shown"], e["winner"],
            "{name}: _showEndScreen(result.winner)"
        );
        let surv: Vec<Value> = out
            .result
            .survivors
            .iter()
            .map(|(id, hp)| serde_json::json!([id, js_str(*hp)]))
            .collect();
        assert_eq!(Value::Array(surv), e["survivors"], "{name}: survivors");
        let log: Vec<Value> = out
            .result
            .log
            .iter()
            .map(|l| Value::String(l.clone()))
            .collect();
        assert_eq!(Value::Array(log), e["log"], "{name}: result.log");
        assert_eq!(
            Value::Bool(out.wall_ever_breached),
            e["wallEverBreached"],
            "{name}: wallEverBreached"
        );
        let db: Vec<Value> = out
            .result
            .def_bonus
            .iter()
            .map(|d| serde_json::json!([d.q, d.r, d.on_wall, js_str(d.pct)]))
            .collect();
        assert_eq!(Value::Array(db), e["defBonus"], "{name}: defBonus");
        let calls = e["calls"].as_array().expect("calls");
        assert_eq!(res.calls.len(), calls.len(), "{name}: liczba par");
        for (k, (got, want)) in res.calls.iter().zip(calls).enumerate() {
            assert_eq!(got, want, "{name}: para {k}");
        }
        // `toCombatUnit(bu, hunger, true, gold, true)` (`:20444-20445`): pin pomija głód i deficyt w cu.
        for t in e["tcu"].as_array().expect("tcu") {
            assert_eq!(t["skipHunger"], true, "{name}");
            assert_eq!(t["skipGold"], true, "{name}");
        }
    }
}

/// Wektor 1 (przewaga atakującego): bród (−25% Obrony nie występuje, obrońca na brzegu +15%), fortyfikacja w polu
/// (+50%), łuk tyłu, nadpisanie bonusów cyw. i trudności per jednostka, martwa machina poza wejściem.
#[test]
fn wektor_przewaga_atakujacego() {
    let v = vector("atk_przewaga_pole_brod_brzeg_fortyfikacja");
    let e = &v["expect"];
    assert_eq!(e["winner"], "atakujacy");
    // `:20505-20526`: 10 * 1.5 (fortifiedInField) * 1.15 (brzeg vs atakujący w brodzie) = 17.25.
    assert_eq!(e["calls"][0]["dDef"], "17.25");
    assert_eq!(e["calls"][0]["attackerPosition"], "rear");
    // Martwa machina (103) nie wchodzi do computeInstantResult (`:3724`), więc żadna para jej nie zawiera.
    assert!(e["calls"]
        .as_array()
        .expect("calls")
        .iter()
        .all(|c| c["a"] != "Taran"));
}

/// Wektor 2 (przewaga obrońcy): obrona miasta z murem 200% na wzgórzu — korona muru i obrońca za murem 250%
/// (200 + 50 z `cityGatedTerrainMultiplier`), obrońca przed murem 0%, `override = 1`.
#[test]
fn wektor_przewaga_obroncy_miasto() {
    let v = vector("def_przewaga_miasto_mur_wzgorze");
    let e = &v["expect"];
    assert_eq!(e["winner"], "obronca");
    assert_eq!(e["wallEverBreached"], false);
    let pcts: Vec<&str> = e["calls"]
        .as_array()
        .expect("calls")
        .iter()
        .map(|c| c["structureDefBonusPct"].as_str().expect("pct"))
        .collect();
    assert_eq!(pcts, ["250", "250", "0"]);
    assert_eq!(e["calls"][0]["defenderTerrain"], "Plaskie (rownina/laka)");
    assert_eq!(e["calls"][0]["defenderOnWallWalkway"], true);
}

/// Wektor 3 (mur + machina): żywy taran w oblężeniu = założony wyłom; martwy taran = brak; machina bez muru = bez zmian.
#[test]
fn wektor_mur_machina_wylom() {
    assert_eq!(
        vector("mur_machina_wylom")["expect"]["wallEverBreached"],
        true
    );
    assert_eq!(
        vector("mur_machina_martwa_bez_wylomu")["expect"]["wallEverBreached"],
        false
    );
    assert_eq!(
        vector("bez_muru_machina_po_nazwie")["expect"]["wallEverBreached"],
        false
    );
    // Reguła na samym Rust (bez resolvera).
    let bt = build(&vector("mur_machina_wylom")["input"]);
    assert!(attacker_has_live_siege_unit(&bt.atk));
    assert!(instant_wall_ever_breached(3.0, false, &bt.atk));
    assert!(!instant_wall_ever_breached(-1.0, false, &bt.atk));
    assert!(instant_wall_ever_breached(-1.0, true, &bt.atk));
    let dead = build(&vector("mur_machina_martwa_bez_wylomu")["input"]);
    assert!(!attacker_has_live_siege_unit(&dead.atk));
    let by_name = build(&vector("bez_muru_machina_po_nazwie")["input"]);
    assert!(attacker_has_live_siege_unit(&by_name.atk));
}

/// Obrona r1 (zarzut 1): obrońca STOI w brodzie (`isFordTile(d)`, `:20517-20519`) — Obrona × (1 − `BROD.karaObrona`
/// = 0.25) PO fortyfikacji w polu (`:20505-20509`); teren obrońcy = `COMBAT_NAME[Ford]` = `Rzeka`
/// (`battle-terrain.ts:155`).
#[test]
fn wektor_obronca_w_brodzie() {
    let v = vector("obronca_w_brodzie_kara");
    let e = &v["expect"];
    let calls = e["calls"].as_array().expect("calls");
    // 12 * 0.75 = 9; okopany: 11 * 1.5 * 0.75 = 12.375.
    assert_eq!(calls[0]["dDef"], "9");
    assert_eq!(calls[1]["dDef"], "12.375");
    assert!(calls.iter().all(|c| c["defenderTerrain"] == "Rzeka"));
    // Brak mnożnika brzegu: atakujący nie stoi w brodzie, a obrońca w brodzie nie jest brzegiem (`:20520-20525`).
    assert!(calls
        .iter()
        .all(|c| c["dDef"] == "9" || c["dDef"] == "12.375"));
}

/// Obrona r1 (zarzut 2): obrona MIASTA bez muru (`isCityDefense = true`, `wallDefenseTotalProc = 0`):
/// `hasMur = false` (`:20480`), więc `cityGatedTerrainMultiplier` = 1 (`city-defense.ts:185`) także na wzgórzu —
/// `structureDefBonusPct = 0`, ale `override = 1` (`:20556`) nadal neutralizuje teren w resolverze.
#[test]
fn wektor_miasto_bez_muru() {
    let v = vector("miasto_bez_muru_wzgorze");
    let e = &v["expect"];
    let calls = e["calls"].as_array().expect("calls");
    assert_eq!(calls[0]["defenderTerrain"], "Wzgorza");
    assert!(calls.iter().all(|c| c["structureDefBonusPct"] == "0"));
    assert!(calls.iter().all(|c| c["override"] == "1"));
    assert!(e["defBonus"]
        .as_array()
        .expect("defBonus")
        .iter()
        .all(|d| d[3] == "0"));
}

/// Werdykt `hpA >= hpD` (`:20587`): remis sumy HP daje atakującego; obie strony puste — też atakujący, bez ocalałych.
#[test]
fn wektor_remis_hp_i_puste_strony() {
    let v = vector("remis_hp_atakujacy_wygrywa");
    assert_eq!(v["expect"]["winner"], "atakujacy");
    assert_eq!(
        v["expect"]["survivors"],
        serde_json::json!([[901, "30"], [902, "20"]])
    );
    // maxWaves = (2 + 1) * 6 + 10 = 28 fal po 2 pary (`:20426`).
    assert_eq!(v["expect"]["calls"].as_array().expect("calls").len(), 56);
    let empty = vector("brak_mapy_obie_strony_puste");
    assert_eq!(empty["expect"]["winner"], "atakujacy");
    assert_eq!(empty["expect"]["survivors"], serde_json::json!([]));
    assert_eq!(
        empty["expect"]["log"],
        serde_json::json!(["=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="])
    );
}

/// Linia końca `result.log` (`:20591`) bajt w bajt.
#[test]
fn linia_konca_logu() {
    assert_eq!(
        instant_verdict_line(BattleSide::Attacker),
        "=== Natychmiastowy wynik: ATAKUJACY wygrywa ==="
    );
    assert_eq!(
        instant_verdict_line(BattleSide::Defender),
        "=== Natychmiastowy wynik: OBRONCA wygrywa ==="
    );
}

/// `compute_instant_result` bez filtra `!dead` (wejście pinu) i stała `maxRounds: 30` (`:20535`).
#[test]
fn compute_instant_result_bez_filtra_dead() {
    let bt = build(&vector("atk_przewaga_pole_brod_brzeg_fortyfikacja")["input"]);
    let atk: Vec<&InstantUnit> = bt.atk.iter().collect();
    let def: Vec<&InstantUnit> = bt.def.iter().collect();
    let mut res = StubResolver::default();
    let out = compute_instant_result(&atk, &def, &bt.scene, &mut res);
    // Martwy taran (id 103) wchodzi, gdy wołający NIE filtruje — tu jest w pierwszej fali.
    assert!(res.calls.iter().any(|c| c["a"] == "Taran"));
    assert!(res
        .calls
        .iter()
        .all(|c| c["maxRounds"] == INSTANT_MAX_ROUNDS));
    assert_eq!(
        out.log.last().map(String::as_str),
        Some(instant_verdict_line(out.winner).as_str())
    );
}

fn outcome_units(units: &[InstantUnit]) -> Vec<OutcomeUnit> {
    units
        .iter()
        .map(|u| OutcomeUnit {
            id: u.id,
            hp: u.start_hp(),
            max_hp: u.start_hp(),
            dead: u.dead,
            routed: false,
        })
        .collect()
}

/// Wejście E4 do `BattleOutcomeDto`: winner/survivors/log z portu, `wallBreached` z reguły machiny, walidacja i klucze JSON.
#[test]
fn e4_do_battle_outcome_dto() {
    for (name, wall_col, want_wall) in [
        ("mur_machina_wylom", 3_i64, Some(true)),
        ("mur_machina_martwa_bez_wylomu", 3, Some(false)),
        ("atk_przewaga_pole_brod_brzeg_fortyfikacja", -1, None),
        ("def_przewaga_miasto_mur_wzgorze", 3, Some(false)),
    ] {
        let v = vector(name);
        let bt = build(&v["input"]);
        let mut res = StubResolver::default();
        let skip = skip_instant_fallback(&bt.atk, &bt.def, bt.wall_before, &bt.scene, &mut res);
        let (atk, def) = (outcome_units(&bt.atk), outcome_units(&bt.def));
        let dto =
            build_battle_outcome_instant(&atk, &def, wall_col, bt.wall_before, &skip).expect("dto");
        dto.validate().expect("walidacja");
        let want_winner = match skip.result.winner {
            BattleSide::Attacker => BattleWinner::Atakujacy,
            BattleSide::Defender => BattleWinner::Obronca,
        };
        assert_eq!(dto.winner, want_winner, "{name}");
        assert_eq!(
            Value::String(format!("{:?}", dto.winner).to_lowercase()),
            v["expect"]["winner"]
        );
        let surv: Vec<(u64, f64)> = dto.survivors.iter().map(|s| (s.id.get(), s.hp)).collect();
        assert_eq!(surv, skip.result.survivors, "{name}");
        assert_eq!(dto.log, skip.result.log, "{name}: log = result.log (:3744)");
        assert_eq!(dto.wall_breached, want_wall, "{name}: wallBreached");
        assert_eq!(InstantSkipData::from_skip(&skip).winner, skip.result.winner);
        let json = serde_json::to_value(&dto).expect("json");
        let mut keys: Vec<&str> = json
            .as_object()
            .expect("obiekt")
            .keys()
            .map(String::as_str)
            .collect();
        keys.sort_unstable();
        assert_eq!(
            keys,
            [
                "attackerUnitIds",
                "defenderUnitIds",
                "endStats",
                "log",
                "survivors",
                "wallBreached",
                "winner"
            ]
        );
        assert_eq!(json["log"], v["expect"]["log"], "{name}: log w JSON");
        if name == "mur_machina_wylom" {
            // Ten sam literał co `view-model/tests/battle_outcome_e4.rs::e4_json`.
            assert_eq!(
                json["survivors"],
                serde_json::json!([{ "id": 502, "hp": 54.0 }])
            );
            assert_eq!(json["attackerUnitIds"], serde_json::json!([501, 502]));
            assert_eq!(json["defenderUnitIds"], serde_json::json!([601, 602]));
            assert_eq!(json["wallBreached"], serde_json::json!(true));
            assert_eq!(
                json["endStats"],
                serde_json::json!({
                    "atk": { "total": 2, "lost": 0, "remaining": 2, "hp": 150.0, "hpMax": 150.0 },
                    "def": { "total": 2, "lost": 0, "remaining": 2, "hp": 70.0, "hpMax": 70.0 }
                })
            );
        }
    }
}

/// Obrona r1 (zarzut 6): `siege_wall_col` producenta DTO (i64) i sceny „Pomiń” (f64) muszą się zgadzać co do oblężenia,
/// a `wallBreached` DTO musi równać się `InstantSkipOutcome::wall_ever_breached` — rozbieżne wejście wołającego daje błąd.
#[test]
fn e4_rozbiezne_zrodla_muru_to_blad() {
    let bt = build(&vector("mur_machina_wylom")["input"]);
    let mut res = StubResolver::default();
    let skip = skip_instant_fallback(&bt.atk, &bt.def, bt.wall_before, &bt.scene, &mut res);
    let (atk, def) = (outcome_units(&bt.atk), outcome_units(&bt.def));
    // Scena z murem (3), producent bez oblężenia (-1).
    assert_eq!(
        build_battle_outcome_instant(&atk, &def, -1, bt.wall_before, &skip),
        Err(OutcomeError::InstantWallMismatch)
    );
    // Scena bez oblężenia (-1, brak wyłomu), producent z murem (3): DTO liczy wyłom z żywej machiny, skip nie.
    let mut no_siege = bt.scene.clone();
    no_siege.siege_wall_col = -1.0;
    let mut res2 = StubResolver::default();
    let skip2 = skip_instant_fallback(&bt.atk, &bt.def, false, &no_siege, &mut res2);
    assert!(!skip2.wall_ever_breached);
    assert_eq!(
        build_battle_outcome_instant(&atk, &def, 3, false, &skip2),
        Err(OutcomeError::InstantWallMismatch)
    );
    // `wall_ever_breached` przed „Pomiń” niezgodny z tym, z którego policzono skip (scena bez machiny w DTO).
    let dead = build(&vector("mur_machina_martwa_bez_wylomu")["input"]);
    let mut res3 = StubResolver::default();
    let skip3 = skip_instant_fallback(&dead.atk, &dead.def, false, &dead.scene, &mut res3);
    let (atk3, def3) = (outcome_units(&dead.atk), outcome_units(&dead.def));
    assert_eq!(
        build_battle_outcome_instant(&atk3, &def3, 3, true, &skip3),
        Err(OutcomeError::InstantWallMismatch)
    );
    // Zgodne wejście: OK.
    assert!(build_battle_outcome_instant(&atk3, &def3, 3, false, &skip3).is_ok());
}
