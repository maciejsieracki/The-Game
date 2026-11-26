#!/usr/bin/env node
// R-RUSTPORT-P4-411-TS-TYPES-Q1 obrona r1 — zestaw mutantów Evaluatora r1 (evmut.mjs, 37 pozycji E1–E40)
// skopiowany 1:1 + mutanty dodatkowe obrony (O1–O8). Uruchom z src-tauri/frontend-v2 po `npm ci`:
//   node ../../dyspozycje/autobot/runs/R-RUSTPORT-P4-411-TS-TYPES-Q1/mutanty-411-ewaluator.mjs
// EXIT 0 = każdy mutant zabity (tsc EXIT != 0) i plik przywrócony; EXIT 1 = przeżył co najmniej jeden.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd();
const BT = resolve(root, 'src/controller/bridgeTypes.ts');
const VT = resolve(root, 'src/viewmodel/types.ts');
const CT = resolve(root, 'src/controller/commands.ts');
const tsc = resolve(root, 'node_modules/.bin/tsc');
const M = [
 ['E1 BridgeResponse bez siegeBattle', CT, "  result: { kind: 'state'; state: S };\n  siegeBattle?: SiegeBattlePayload;\n", "  result: { kind: 'state'; state: S };\n"],
 ['E2 BridgeResponse bez saveGame', CT, '  siegeBattle?: SiegeBattlePayload;\n  saveGame?: string;\n}', '  siegeBattle?: SiegeBattlePayload;\n}'],
 ['E3 BridgeError bez siegeBattle', CT, '  siegeBattle?: SiegeBattleErrorDto;\n', ''],
 ['E4 foundCityMode dopuszcza null', BT, '  foundCityMode?: boolean;\n', '  foundCityMode?: boolean | null;\n'],
 ['E5 unitId ref -> number', BT, '  unitId: string;\n', '  unitId: number;\n'],
 ['E7 faza bez aborted', BT, "'applied' | 'aborted';", "'applied';"],
 ['E8 BridgeResult bez render_frame', BT, "\n  | { kind: 'render_frame'; frame: RenderLayersDto };", ';'],
 ['E9 RenderLayersPayloadDto bez fogActive', VT, '  fog: FogViewDto;\n  fogActive: boolean;\n', '  fog: FogViewDto;\n'],
 ['E10 ownerId string', VT, '  ownerId: number;\n  fogActive: boolean;', '  ownerId: string;\n  fogActive: boolean;'],
 // E11/E23: w evmut.mjs kotwica występowała 2× (SKRYPT, mutant nieuruchomiony) — zawężona do jednego miejsca.
 ['E11 MapViewDto bez seed', VT, '  seed: number;\n  hexes: RenderNestedDto[];\n', '  hexes: RenderNestedDto[];\n'],
 ['E12 towerShooter typ wymagane', BT, '  typ?: string;\n', '  typ: string;\n'],
 ['E13 captureRequested wymagane', BT, '  captureRequested?: CityCaptureRequestedDto;\n', '  captureRequested: CityCaptureRequestedDto;\n'],
 ['E14 removedUnitIds opcjonalne', BT, '  removedUnitIds: number[];\n', '  removedUnitIds?: number[];\n'],
 ['E15 units wymagane', BT, '  units?: SiegeBattleUnitRefDto[];\n', '  units: SiegeBattleUnitRefDto[];\n'],
 ['E16 frame wymagane', BT, '  frame?: BattleNestedDto;\n', '  frame: BattleNestedDto;\n'],
 ['E18 result wymagane', BT, '  result?: SiegeBattleResultDto;\n', '  result: SiegeBattleResultDto;\n'],
 ['E19 consumedMachines string[]', BT, '  consumedMachines: SiegeBattleMachineKindDto[];\n', '  consumedMachines: string[];\n'],
 ['E20 hp opcjonalne', BT, '  unitId: number;\n  hp: number;\n', '  unitId: number;\n  hp?: number;\n'],
 ['E21 PositionDto y opcjonalne', BT, '  x: number;\n  y: number;\n', '  x: number;\n  y?: number;\n'],
 ['E22 seat layers wymagane', BT, "kind: 'get_render_layers'; seat?: number", "kind: 'get_render_layers'; seat: number"],
 ['E23 ui luzny', BT, "kind: 'get_render_frame'; seat?: number; ui?: RenderUiParams }", "kind: 'get_render_frame'; seat?: number; ui?: Record<string, unknown> }"],
 ['E24 add_player name opcjonalne', BT, 'id: number; name: string }', 'id: number; name?: string }'],
 ['E25 declare_war target opcjonalne', BT, 'declarer: number; target: number }', 'declarer: number; target?: number }'],
 ['E26 borders opcjonalne', VT, '  borders: RenderNestedDto[];\n', '  borders?: RenderNestedDto[];\n'],
 ['E27 aborted bez reason', BT, "code: 'aborted'; cityId: number; reason: string }", "code: 'aborted'; cityId: number }"],
 ['E29 select_unit unit_id string', BT, "kind: 'select_unit'; unit_id: number }", "kind: 'select_unit'; unit_id: string }"],
 ['E30 revealAllLand opcjonalne', VT, '  revealAllLand: boolean;\n', '  revealAllLand?: boolean;\n'],
 ['E31 start_siege_storm unit_id opcjonalne', BT, 'city_id: number; unit_id: number }', 'city_id: number; unit_id?: number }'],
 ['E32 phase opcjonalne', BT, '  phase: SiegeBattlePhaseDto;\n', '  phase?: SiegeBattlePhaseDto;\n'],
 ['E33 wallBreached opcjonalne', BT, '  wallBreached: boolean;\n', '  wallBreached?: boolean;\n'],
 ['E34 territory payload luzne', VT, '  territory: TerritoryRangesDto;\n}', '  territory: RenderNestedDto;\n}'],
 ['E35 move_unit destination opcjonalne', BT, 'unit_id: number; destination: PositionDto;', 'unit_id: number; destination?: PositionDto;'],
 ['E36 contractVersion odp opcjonalne', BT, '  contractVersion: number;\n  requestId: string;\n  result: EngineBridgeResult<S>;', '  contractVersion?: number;\n  requestId: string;\n  result: EngineBridgeResult<S>;'],
 ['E37 RenderLayersDto turn opcjonalne', VT, '  turn: number;\n  hexState', '  turn?: number;\n  hexState'],
 ['E38 riverRenderPaths opcjonalne', VT, '  riverRenderPaths: RenderHexCoordDto[][];\n', '  riverRenderPaths?: RenderHexCoordDto[][];\n'],
 ['E39 load_game save opcjonalne', BT, "kind: 'load_game'; save: string }", "kind: 'load_game'; save?: string }"],
 ['E40 step wall_ms opcjonalne', BT, "kind: 'step_siege_battle'; wall_ms: number }", "kind: 'step_siege_battle'; wall_ms?: number }"],
 // Dodatkowe mutanty obrony r1:
 ['O1 wonderActive dopuszcza null', BT, '  wonderActive?: boolean;\n', '  wonderActive?: boolean | null;\n'],
 ['O2 selectedUnitId bez null', BT, '  selectedUnitId?: number | null;\n', '  selectedUnitId?: number;\n'],
 ['O3 BridgeResponse.siegeBattle luzne', CT, "  result: { kind: 'state'; state: S };\n  siegeBattle?: SiegeBattlePayload;\n", "  result: { kind: 'state'; state: S };\n  siegeBattle?: unknown;\n"],
 ['O4 saveGame null', BT, '  siegeBattle?: SiegeBattlePayload;\n  saveGame?: string;\n}', '  siegeBattle?: SiegeBattlePayload;\n  saveGame?: string | null;\n}'],
 ['O5 not_siege_anchor besiegerId opcjonalne', BT, 'unitId: number; besiegerId: number }', 'unitId: number; besiegerId?: number }'],
 ['O6 cancel force opcjonalne', BT, 'unit_id: number; force: boolean }', 'unit_id: number; force?: boolean }'],
 ['O7 riverRevealKeys opcjonalne', VT, '  riverRevealKeys: RenderHexCoordDto[] | null;\n', '  riverRevealKeys?: RenderHexCoordDto[] | null;\n'],
 ['O8 battle bez null', VT, '  battle: RenderNestedDto | null;\n', '  battle: RenderNestedDto;\n'],
];
const surv = [];
for (const [n, f, a, b] of M) {
  const o = readFileSync(f, 'utf8');
  const h = o.split(a).length - 1;
  if (h !== 1) { console.log('SKRYPT', n, h); surv.push(`SKRYPT:${n}`); continue; }
  try {
    writeFileSync(f, o.replace(a, b));
    let k = false, out = '';
    try { execFileSync(tsc, ['--noEmit'], { cwd: root, stdio: 'pipe' }); } catch (e) { k = true; out = String(e.stdout).split('\n')[0]; }
    console.log(k ? 'ZABITY ' : 'PRZEZYL', n, out.slice(0, 160));
    if (!k) surv.push(n);
  } finally { writeFileSync(f, o); }
}
console.log('PRZEZYLO', surv.length, '/', M.length, JSON.stringify(surv));
process.exit(surv.length === 0 ? 0 : 1);
