// K5-LOOP-AUTO-WEKTORY V2/V7: generator wektorow pinu dla planowania AUTO (migawka) i doktryny steady bez oblezenia.
// Zrodlo: gra/src/battle/battleScene.ts przy pinie 07d2fbd72 (tylko odczyt, git show).
//   V2: _snapshotAutoBatchIntents (pin ~:5752-5815) + _doMove (galaz planowania) + _doAttack (galaz planowania).
//   V7: _executeGroupDoctrineStep (pin ~:17966, galaz steady) + _effectiveMetaForUnit (pin ~:17645) +
//       _getEffectiveDoctrine / _isUnitDoctrineAuto / _ensureGroupMeta / _advanceDir / _forwardCol (pin ~:6743, ~:17586-17630).
// Metody sa WYCIAGANE z pinu i WYKONYWANE (nie przepisywane); typy TS zdejmuje node:module stripTypeScriptTypes.
// Stubowane sa wylacznie (kazdy stub to poza zakresem tematu lub zbyt duzy kawalek pinu):
//   V2: _activateUnit (pelne drzewo decyzji AI, osobny temat) -> skrypt ruchow z wektora (ruch = wywolanie pinowego _doMove,
//       zablokowany kafelek w klonie = przerwanie skryptu, `set` = zmiana q/r poza _doMove, `attack` = pinowy _doAttack);
//       _cloneForAutoBatchPlanning -> plytki klon pol uzywanych przez planowanie (bez THREE.js); _disposeAutoBatchPlanningRoster -> no-op;
//       _updateFacing / _moveCostForUnit -> no-op / koszt 1; isFordTile -> false (brak terenu w wektorze).
//   V7: _advanceStep, _cavalryAction, _rangedAction, _executeSkirmishDoctrineStep, _doAttack (poza galezia planowania),
//       _pickRangedTargetByPriority, _pickAdjacentTargetByPriority, _doctrineMoveDest -> rejestratory; _refreshQueuedOrderVisuals -> no-op.
//       Wejscie do kroku doktryny odtwarza warunek z _activateUnit (pin ~:6089-6097: !_manualMode && _isUnitDoctrineAuto && meta.doctrine !== 'manual').
// Uruchom:  node rust-port/engine/tests/p6_k5loop_auto_v2v7_gen.mjs           (zapis vectors.json + SHA256SUMS)
//           node rust-port/engine/tests/p6_k5loop_auto_v2v7_gen.mjs --check   (porownanie z plikami + sha256)
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as nodeModule from 'node:module';

const PIN = '07d2fbd72';
const SRC_PATH = 'gra/src/battle/battleScene.ts';
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'p6_k5loop_auto_v2v7_vectors');
const checkMode = process.argv.includes('--check');

const pinSource = execFileSync('git', ['show', `${PIN}:${SRC_PATH}`], {
  cwd: here,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');

function pinConst(name) {
  const re = new RegExp(`^const ${name}\\s*=\\s*(\\d+);`);
  for (const line of pinSource) {
    const m = re.exec(line);
    if (m) return Number(m[1]);
  }
  throw new Error(`brak stalej ${name} w pinie ${PIN}`);
}
const BF_COLS = pinConst('BF_COLS');
if (BF_COLS !== 68) throw new Error(`nieoczekiwane BF_COLS z pina: ${BF_COLS}`);

// Cialo metody od naglowka do domykajacego "  }" (metody klasy maja 2-spacje wciecia; wnetrze >= 4).
function pinMethod(header) {
  const start = pinSource.indexOf(header);
  if (start < 0) throw new Error(`brak naglowka w pinie ${PIN}: ${header}`);
  const body = [];
  for (let i = start; i < pinSource.length; i++) {
    body.push(pinSource[i].replace(/^  private /, '  '));
    if (i > start && pinSource[i] === '  }') return body.join('\n');
  }
  throw new Error(`brak konca metody w pinie ${PIN}: ${header}`);
}

// Funkcja najwyzszego poziomu (np. canShoot) -- do domkniecia jako zmienna w closure.
function pinTopLevelFn(name) {
  const start = pinSource.findIndex(l => l.startsWith(`function ${name}(`));
  if (start < 0) throw new Error(`brak funkcji w pinie ${PIN}: ${name}`);
  const body = [];
  for (let i = start; i < pinSource.length; i++) {
    body.push(pinSource[i]);
    if (i > start && pinSource[i] === '}') return body.join('\n');
  }
  throw new Error(`brak konca funkcji w pinie ${PIN}: ${name}`);
}

const METHOD_HEADERS = {
  // V2
  snapshot: '  private _snapshotAutoBatchIntents(side: AutoBatchPhase, units: RuntimeBattleUnit[]): AutoBatchIntent[] {',
  doMove: '  private _doMove(ru: RuntimeBattleUnit, col: number, row: number, done: () => void): void {',
  doAttack: '  private _doAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {',
  // V7
  executeStep: '  private _executeGroupDoctrineStep(ru: RuntimeBattleUnit, meta: GroupMeta, done: () => void): boolean {',
  effectiveMeta: '  private _effectiveMetaForUnit(ru: RuntimeBattleUnit): GroupMeta {',
  effectiveDoctrine: '  private _getEffectiveDoctrine(ru: RuntimeBattleUnit): GroupDoctrine {',
  isAuto: '  private _isUnitDoctrineAuto(ru: RuntimeBattleUnit): boolean {',
  ensureMeta: '  private _ensureGroupMeta(gid: string): GroupMeta {',
  advanceDir: "  private _advanceDir(side: 'atk' | 'def'): number {",
  forwardCol: "  private _forwardCol(side: 'atk' | 'def', col: number, steps = 1): number {",
};
const pinSrc = Object.fromEntries(Object.entries(METHOD_HEADERS).map(([k, h]) => [k, pinMethod(h)]));

// Obiekt literalowy z metodami pinu (przecinki miedzy metodami); typy zdejmowane przez node.
const methodsSource = Object.values(pinSrc).join(',\n');
const objectSource = `({\n${methodsSource}\n});`;
const methodsJs = nodeModule.stripTypeScriptTypes(objectSource).trim().replace(/;$/, '');
const canShootJs = nodeModule.stripTypeScriptTypes(pinTopLevelFn('canShoot'));

// Wolne identyfikatory z pina: stale, cellKey (ta sama definicja co pin :1797), canShoot (pin :1457).
const cellKey = (q, r) => `${q},${r}`;
const isFordTile = () => false;
const BROD_RUCH_MULT = 0.5; // pin: BROD.ruchMult (uzywane tylko przy brodzie, a brod jest wylaczony)

const makeMethods = new Function(
  'BF_COLS',
  'cellKey',
  'isFordTile',
  'BROD_RUCH_MULT',
  `${canShootJs}\nreturn ${methodsJs};`,
)(BF_COLS, cellKey, isFordTile, BROD_RUCH_MULT);

function toRu(u) {
  return {
    bu: { id: u.id, hp: 30 },
    side: u.side,
    q: u.q,
    r: u.r,
    dead: false,
    fadingOut: false,
    removed: false,
    routed: false,
    acted: false,
    moveLeft: 3,
    playerOrder: { type: 'none' },
    mounted: !!u.mounted,
    rangedBase: !!u.rangedBase,
    ammoLeft: u.ammoLeft ?? 0,
    shootingEnabled: u.shootingEnabled ?? true,
    groupId: u.group ?? null,
    unitDoctrine: null,
  };
}

// ---- V2: migawka planowania ----
// Wykonuje pinowy _snapshotAutoBatchIntents na zywej tablicy z wektora; zwraca intencje i stan zywej tablicy po wywolaniu.
function runSnapshot(v) {
  const self = {
    finished: false,
    _manualMode: false,
    _autoBattleSuspended: false,
    siegeWallCol: -1,
    atk: v.atk.map(toRu),
    def: v.def.map(toRu),
    occByKey: new Map(),
    _autoBatchPlanning: null,
    log: [],
    routedUnits: [],
    vTimers: [],
  };
  for (const ru of [...self.atk, ...self.def]) self.occByKey.set(cellKey(ru.q, ru.r), ru);
  Object.assign(self, makeMethods);

  self._findUnitById = id => [...self.atk, ...self.def].find(u => u.bu.id === id);
  self._cloneForAutoBatchPlanning = source => ({
    ...source,
    bu: { ...source.bu },
    playerOrder: { ...source.playerOrder },
  });
  self._disposeAutoBatchPlanningRoster = () => {};
  self._moveCostForUnit = () => 1;
  self._updateFacing = () => {};
  self._activateUnit = (ru, done) => {
    // Skrypt ruchow dla jednostki z wektora (ruch zablokowany przez zajety kafelek w KLONIE konczy skrypt = hold).
    for (const op of v.scripts[ru.bu.id] ?? []) {
      if (op.op === 'move') {
        if (self.occByKey.has(cellKey(op.col, op.row))) break;
        self._doMove(ru, op.col, op.row, () => {});
      } else if (op.op === 'set') {
        ru.q = op.col;
        ru.r = op.row;
      } else if (op.op === 'attack') {
        self._doAttack(ru, self._findUnitById(op.target), () => {});
      } else {
        throw new Error(`nieznana operacja skryptu: ${op.op}`);
      }
    }
    done();
  };

  // Zrodlo spoza atk/def (np. 'zz') zostaje przekazane jak w pinie: brak klonu -> continue (bez intencji).
  const units = v.units.map(id => self._findUnitById(id) ?? { bu: { id }, side: v.side, q: 0, r: 0 });
  const intents = self._snapshotAutoBatchIntents(v.side, units);
  return {
    intents: intents.map(i => ({
      unit_id: i.unitId,
      side: i.side,
      kind: i.kind,
      steps: i.steps.map(s => ({ col: s.col, row: s.row })),
      target_id: i.targetId ?? null,
    })),
    live_after: [...self.atk, ...self.def].map(u => ({ id: u.bu.id, q: u.q, r: u.r })),
    live_occ_after: [...self.occByKey.keys()].sort(),
  };
}

// ---- V7: krok doktryny steady ----
// Mirror warunku wejscia z _activateUnit (pin :6089-6097): bez trybu recznego, doktryna AUTO, meta != manual.
function runDoctrine(v) {
  const trace = { branch: 'none', done_calls: 0 };
  const self = {
    finished: false,
    _manualMode: false,
    siegeWallCol: -1,
    _groupMeta: new Map(),
    atk: [],
    def: [],
  };
  Object.assign(self, makeMethods);
  if (v.group_meta) self._groupMeta.set(v.unit.group, { ...v.group_meta });

  self._pickTargetByPriority = () => null;
  self._pickRangedTargetByPriority = () => null;
  self._pickAdjacentTargetByPriority = () => null;
  self._doctrineMoveDest = () => null;
  self._refreshQueuedOrderVisuals = () => {};
  self._advanceStep = () => { trace.branch = 'advanceStep'; };
  self._cavalryAction = () => { trace.branch = 'cavalryAction'; };
  self._rangedAction = () => { trace.branch = 'rangedAction'; };
  self._executeSkirmishDoctrineStep = () => { trace.branch = 'skirmishStep'; return true; };
  self._doAttack = () => { trace.branch = 'doAttack'; };

  const ru = toRu({ ...v.unit, group: v.unit.group ?? null });
  ru.unitDoctrine = null;
  const done = () => { trace.done_calls++; };

  let meta = null;
  let returned = false;
  if (!self._manualMode && self._isUnitDoctrineAuto(ru)) {
    meta = self._effectiveMetaForUnit(ru);
    if (meta.doctrine !== 'manual') returned = self._executeGroupDoctrineStep(ru, meta, done);
  }
  return {
    meta: meta
      ? {
          doctrine: meta.doctrine,
          rally_col: meta.rallyCol ?? null,
          rally_row: meta.rallyRow ?? null,
          auto_play: meta.autoPlay,
        }
      : null,
    returned,
    branch: trace.branch,
    done_calls: trace.done_calls,
  };
}

// ---- wektory ----
const U = (id, side, q, r, extra = {}) => ({ id, side, q, r, ...extra });
const V2_ATK = [U('a0', 'atk', 0, 0), U('a1', 'atk', 1, 0)];
const V2_DEF = [U('d0', 'def', 5, 0), U('d1', 'def', 6, 0)];
const mv = (col, row) => ({ op: 'move', col, row });
const at = target => ({ op: 'attack', target });

const VECTORS = [
  // ---- V2: _snapshotAutoBatchIntents (pin :5752-5815) ----
  {
    kind: 'v2',
    id: 'v2a_clones_isolate_planned_cells',
    pin: 'battleScene.ts:5752-5815 (klon per zrodlo, kolejnosc planowania) + 5785-5795 (_doMove galaz planowania)',
    title: 'Dwoch atakujacych planuje ten sam kafelek: obaj dostaja ruch, bo kazdy widzi migawke, nie plan drugiego',
    setup: {
      side: 'atk',
      units: ['a0', 'a1'],
      atk: V2_ATK,
      def: V2_DEF,
      scripts: { a0: [mv(2, 0)], a1: [mv(2, 0)] },
    },
  },
  {
    kind: 'v2',
    id: 'v2b_multi_step_order_and_attack_after_move',
    pin: 'battleScene.ts:5752-5815 + _doMove planowania :8694-8712 (kroki w kolejnosci) + _doAttack :8788-8795',
    title: 'Trzy kroki zapisane w kolejnosci, atak po ruchu ustawia rodzaj attack i zachowuje kroki',
    setup: {
      side: 'atk',
      units: ['a0', 'a1'],
      atk: V2_ATK,
      def: V2_DEF,
      scripts: { a0: [mv(2, 0), mv(3, 0), mv(4, 0)], a1: [mv(2, 0), at('d0')] },
    },
  },
  {
    kind: 'v2',
    id: 'v2c_live_occupancy_blocks_plan_as_hold',
    pin: 'battleScene.ts:5752-5815 (cloneOcc z zywej occByKey) + brak ruchu na zajety kafelek',
    title: 'Kafelek zajety przez zywego obroncy: plan zatrzymuje sie, intencja zostaje hold bez krokow',
    setup: {
      side: 'atk',
      units: ['a0'],
      atk: V2_ATK,
      def: V2_DEF,
      scripts: { a0: [mv(5, 0)] },
    },
  },
  {
    kind: 'v2',
    id: 'v2d_special_branch_fixup_adds_move_step',
    pin: 'battleScene.ts:5806-5812 (fixup: brak krokow, a q/r zmienione poza _doMove -> kind move + krok koncowy)',
    title: 'Zmiana pozycji bez _doMove (galaz specjalna): intencja move z jednym krokiem koncowym',
    setup: {
      side: 'atk',
      units: ['a0', 'a1'],
      atk: V2_ATK,
      def: V2_DEF,
      scripts: { a0: [{ op: 'set', col: 1, row: 1 }], a1: [] },
    },
  },
  {
    kind: 'v2',
    id: 'v2e_unknown_source_is_skipped',
    pin: 'battleScene.ts:5778 (cloneById.get brak -> continue, bez intencji)',
    title: 'Zrodlo spoza klonow nie daje intencji; pozostale jednostki planuja normalnie',
    setup: {
      side: 'atk',
      units: ['a0', 'zz'],
      atk: V2_ATK,
      def: V2_DEF,
      scripts: { a0: [mv(2, 0)] },
    },
  },
  {
    kind: 'v2',
    id: 'v2f_attack_then_move_keeps_attack_kind',
    pin: 'battleScene.ts:5752-5815 + _doMove :8694-8712 (kind nie zmienia sie na move, gdy juz attack)',
    title: 'Atak zapisany przed ruchem: rodzaj zostaje attack, a ruch dopisuje tylko krok',
    setup: {
      side: 'atk',
      units: ['a0'],
      atk: V2_ATK,
      def: V2_DEF,
      scripts: { a0: [at('d0'), mv(2, 0)] },
    },
  },

  // ---- V7: krok doktryny steady bez oblezenia (pin :17966 galaz steady, :17645 rally, :17586-17630 meta) ----
  {
    kind: 'v7',
    id: 'v7a_ungrouped_steady_rally_two_cols_forward_atk',
    pin: 'battleScene.ts:17642-17646 (rally = _forwardCol(side, q, 2), r) + :18022-18025 (steady bez strzelca -> _advanceStep)',
    title: 'Pojedyncza jednostka steady bez strzelca (atak): cel marszu dwie kolumny w przod, krok doktryny = advanceStep',
    setup: {
      unit: U('s0', 'atk', 10, 4),
      group_meta: null,
    },
  },
  {
    kind: 'v7',
    id: 'v7b_ungrouped_steady_rally_clamped_at_zero_def',
    pin: 'battleScene.ts:6748-6750 (_forwardCol z clampem 0) + :17645',
    title: 'Obrona przy lewym brzegu: cel dwie kolumny w przod zacisniety do kolumny 0',
    setup: {
      unit: U('s1', 'def', 1, 3),
      group_meta: null,
    },
  },
  {
    kind: 'v7',
    id: 'v7c_ungrouped_steady_rally_clamped_at_east_edge',
    pin: 'battleScene.ts:6748-6750 (clamp do BF_COLS-1 = 67) + :17645',
    title: 'Atak przy prawym brzegu planszy: cel zacisniety do ostatniej kolumny 67',
    setup: {
      unit: U('s2', 'atk', 66, 5),
      group_meta: null,
    },
  },
  {
    kind: 'v7',
    id: 'v7d_group_steady_rally_from_group_meta_atk',
    pin: 'battleScene.ts:17890-17895 (steady grupy: rally = _forwardCol(side, centroid.col, 2)) + :17630-17634 (meta z grupy)',
    title: 'Jednostka grupy steady (atak): cel grupy z zapisanej mety, krok doktryny advanceStep',
    setup: {
      unit: U('g0', 'atk', 12, 3, { group: 'g1' }),
      group_centroid_col: 12,
      group_meta: { doctrine: 'steady', autoPlay: true, rallyCol: 14, rallyRow: 3 },
    },
  },
  {
    kind: 'v7',
    id: 'v7e_group_steady_rally_from_group_meta_def',
    pin: 'battleScene.ts:17890-17895 (steady grupy, strona def: _forwardCol(def, centroid.col, 2)) + :17630-17634',
    title: 'Jednostka grupy steady (obrona): cel grupy dwie kolumny w strone atakujacego',
    setup: {
      unit: U('g1d', 'def', 20, 9, { group: 'g2' }),
      group_centroid_col: 20,
      group_meta: { doctrine: 'steady', autoPlay: true, rallyCol: 18, rallyRow: 9 },
    },
  },
  {
    kind: 'v7',
    id: 'v7f_steady_mounted_takes_cavalry_branch',
    pin: 'battleScene.ts:18013-18016 (steady && mounted -> _cavalryAction, przed galezia doktryny piechoty)',
    title: 'Konnica w doktrynie steady nie idzie galezia piesza: cavalryAction, bez celu marszu z formacji',
    setup: {
      unit: U('k0', 'atk', 10, 4, { mounted: true }),
      group_meta: null,
    },
  },
];

const out = {
  source: `gra/src/battle/battleScene.ts @ ${PIN}`,
  pin_refs: {
    BF_COLS: 'battleScene.ts:661',
    snapshot: 'battleScene.ts:5752-5815',
    doMove_planning: 'battleScene.ts:8694-8712',
    doAttack_planning: 'battleScene.ts:8788-8795',
    executeStep: 'battleScene.ts:17966-18100',
    effectiveMeta: 'battleScene.ts:17645-17655',
    forwardCol: 'battleScene.ts:6748-6750',
  },
  vectors: VECTORS.map(v => {
    if (v.kind === 'v2') {
      const expect = runSnapshot(v.setup);
      return { id: v.id, pin: v.pin, title: v.title, family: 'v2', setup: v.setup, expect };
    }
    return {
      id: v.id,
      pin: v.pin,
      title: v.title,
      family: 'v7',
      setup: v.setup,
      expect: runDoctrine(v.setup),
    };
  }),
};

// Straznik: kazda intencja/branch musi pochodzic z wykonania pinu (zadnych pustych wektorow bez operacji).
for (const v of out.vectors) {
  if (v.family === 'v2' && Object.keys(v.setup.scripts).length === 0) throw new Error(`wektor bez skryptu: ${v.id}`);
  if (v.family === 'v7' && v.expect.branch === 'none' && v.expect.returned) throw new Error(`nieoczekiwany wynik: ${v.id}`);
}

const text = JSON.stringify(out, null, 2) + '\n';
const digest = createHash('sha256').update(text).digest('hex');
const sums = `${digest}  vectors.json\n`;

if (checkMode) {
  const onDisk = readFileSync(join(outDir, 'vectors.json'), 'utf8');
  if (onDisk !== text) {
    console.error('DRIFT: vectors.json nie zgadza sie z generatorem');
    process.exit(1);
  }
  const sumsOnDisk = readFileSync(join(outDir, 'SHA256SUMS'), 'utf8');
  if (sumsOnDisk !== sums) {
    console.error('DRIFT: SHA256SUMS nie zgadza sie z vectors.json');
    process.exit(1);
  }
  console.log(`OK: ${out.vectors.length} wektorow, sha256 ${digest}`);
} else {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'vectors.json'), text);
  writeFileSync(join(outDir, 'SHA256SUMS'), sums);
  console.log(`wrote ${out.vectors.length} vectors to ${outDir}, sha256 ${digest}`);
}
