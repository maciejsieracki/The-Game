#!/usr/bin/env node
// R-RUSTPORT-P4-411-TS-TYPES-Q1 — bramka czułości typów (mutanty) + test budowniczych komend.
// Uruchom z katalogu src-tauri/frontend-v2 po `npm ci`:
//   node ../../dyspozycje/autobot/runs/R-RUSTPORT-P4-411-TS-TYPES-Q1/mutanty-411.mjs
// Każdy mutant zmienia jeden fragment typu, uruchamia `tsc --noEmit` i MUSI dać błąd; plik jest
// przywracany po każdym mutancie (także po wyjątku). EXIT 0 = wszystkie mutanty zabite + budowniczowie OK.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const BT = resolve(root, 'src/controller/bridgeTypes.ts');
const VT = resolve(root, 'src/viewmodel/types.ts');
const tsc = resolve(root, 'node_modules/.bin/tsc');

const MUTANTS = [
  ['M1 usunięcie wymaganego cityId (SiegeBattlePayload)', BT, 'export interface SiegeBattlePayload {\n  cityId: number;\n', 'export interface SiegeBattlePayload {\n'],
  ['M2 speedIdx opcjonalne → wymagane', BT, '  speedIdx?: number;\n', '  speedIdx: number;\n'],
  ['M3 reveal opcjonalne → wymagane (RenderLayersDto)', VT, '  reveal?: FogRevealDto;\n}', '  reveal: FogRevealDto;\n}'],
  ['M4 usunięcie reveal z RenderLayersDto', VT, '  reveal?: FogRevealDto;\n}', '}'],
  ['M5 usunięcie wariantu get_render_map', BT, "  | { kind: 'get_render_map' }\n", ''],
  ['M6 attack_unit_id opcjonalne → wymagane', BT, 'attack_unit_id?: number }', 'attack_unit_id: number }'],
  ['M7 clamp opcjonalne → wymagane', BT, 'idx: number; clamp?: boolean }', 'idx: number; clamp: boolean }'],
  ['M8 riverRevealKeys null → opcjonalne bez null', VT, '  riverRevealKeys: RenderHexCoordDto[] | null;\n', '  riverRevealKeys?: RenderHexCoordDto[];\n'],
  ['M9 actions wymagane → opcjonalne', BT, '  actions: BattleNestedDto[];\n', '  actions?: BattleNestedDto[];\n'],
  ['M10 battle zawsze obecne → opcjonalne', VT, '  battle: RenderNestedDto | null;\n', '  battle?: RenderNestedDto | null;\n'],
  ['M11 usunięcie kodu abort_not_allowed', BT, "  | { code: 'abort_not_allowed'; cityId: number };", ';'],
  ['M12 saveGame tekst → dowolny', BT, '  saveGame?: string;\n', '  saveGame?: unknown;\n'],
  ['M13 usunięcie selectedUnitId z RenderUiParams', BT, '  selectedUnitId?: number | null;\n', ''],
  ['M14 force wymagane → opcjonalne', BT, 'unit_id: number; force: boolean }', 'unit_id: number; force?: boolean }'],
  ['M15 wall_ms → wallMs (camelCase pola wariantu)', BT, "kind: 'step_siege_battle'; wall_ms: number }", "kind: 'step_siege_battle'; wallMs: number }"],
  ['M16 kod mgły poszerzony do number', VT, 'export type FogStateCode = 0 | 1 | 2;', 'export type FogStateCode = number;'],
  ['M17 usunięcie speedMul', BT, '  speedMul?: number;\n', ''],
];

function tscFails() {
  try {
    execFileSync(tsc, ['--noEmit'], { cwd: root, stdio: 'pipe' });
    return { failed: false, out: '' };
  } catch (e) {
    return { failed: true, out: String(e.stdout ?? '').split('\n')[0] };
  }
}

let survivors = 0;
for (const [name, file, from, to] of MUTANTS) {
  const orig = readFileSync(file, 'utf8');
  const hits = orig.split(from).length - 1;
  if (hits !== 1) {
    console.log(`BŁĄD SKRYPTU ${name}: wzorzec występuje ${hits}x`);
    survivors += 1;
    continue;
  }
  try {
    writeFileSync(file, orig.replace(from, to));
    const r = tscFails();
    console.log(`${r.failed ? 'ZABITY ' : 'PRZEŻYŁ'} ${name}${r.failed ? ' — ' + r.out : ''}`);
    if (!r.failed) survivors += 1;
  } finally {
    writeFileSync(file, orig);
  }
}
const clean = tscFails();
console.log(`po przywróceniu tsc: ${clean.failed ? 'BŁĄD' : 'OK'}`);

// Budowniczowie komend (D-411-2): transpilacja esbuild + asercje runtime.
const { transform } = await import(resolve(root, 'node_modules/esbuild/lib/main.js'));
const js = (await transform(readFileSync(BT, 'utf8'), { loader: 'ts', format: 'esm' })).code;
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const checks = [];
const eq = (label, got, want) => checks.push([label, JSON.stringify(got) === want, JSON.stringify(got)]);
const throwsRange = (label, fn) => {
  try { fn(); checks.push([label, false, 'brak wyjątku']); } catch (e) { checks.push([label, e instanceof RangeError, String(e)]); }
};
eq('speed(-1,true)', mod.setSiegeBattleSpeed(-1, true), '{"kind":"set_siege_battle_speed","idx":-1,"clamp":true}');
eq('speed(10,false)', mod.setSiegeBattleSpeed(10, false), '{"kind":"set_siege_battle_speed","idx":10,"clamp":false}');
eq('speed(4)', mod.setSiegeBattleSpeed(4), '{"kind":"set_siege_battle_speed","idx":4}');
eq('speed(-0)', mod.setSiegeBattleSpeed(-0), '{"kind":"set_siege_battle_speed","idx":0}');
throwsRange('speed(3.5)', () => mod.setSiegeBattleSpeed(3.5));
throwsRange('speed(NaN)', () => mod.setSiegeBattleSpeed(NaN));
throwsRange('speed(Infinity)', () => mod.setSiegeBattleSpeed(Infinity));
throwsRange('speed(2**53)', () => mod.setSiegeBattleSpeed(2 ** 53));
eq('step(16.5)', mod.stepSiegeBattle(16.5), '{"kind":"step_siege_battle","wall_ms":16.5}');
throwsRange('step(NaN)', () => mod.stepSiegeBattle(NaN));
throwsRange('step(-Infinity)', () => mod.stepSiegeBattle(-Infinity));
eq('frame()', mod.getRenderFrame(), '{"kind":"get_render_frame"}');
eq('frame(seat,ui)', mod.getRenderFrame({ seat: 2, ui: { selectedUnitId: 1, buildModeOpen: true, activeImprovementKey: 'farma' } }),
  '{"kind":"get_render_frame","seat":2,"ui":{"selectedUnitId":1,"buildModeOpen":true,"activeImprovementKey":"farma"}}');
eq('storm(1,7)', mod.startSiegeStorm(1, 7), '{"kind":"start_siege_storm","city_id":1,"unit_id":7}');
eq('load("{}")', mod.loadGame('{}'), '{"kind":"load_game","save":"{}"}');
let badChecks = 0;
for (const [label, ok, got] of checks) {
  console.log(`${ok ? 'OK   ' : 'BŁĄD '} budowniczy ${label}: ${got}`);
  if (!ok) badChecks += 1;
}
console.log(`MUTANTY: ${MUTANTS.length - survivors}/${MUTANTS.length} zabite; BUDOWNICZOWIE: ${checks.length - badChecks}/${checks.length} OK`);
process.exit(survivors === 0 && badChecks === 0 && !clean.failed ? 0 : 1);
