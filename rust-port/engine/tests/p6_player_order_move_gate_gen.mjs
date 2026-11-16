// R-RUSTPORT-P6-EXEC-T2-MOVE-GATE-Q1: generator wektorow WYKONUJE kod z pinu (nie transkrypcja reki).
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, tylko odczyt, poza repo):
//   * gra/src/battle/battleScene.ts:
//       _destAllowedByBlockade (17809), _compactAttackAllowsStep (8139), _shouldAvoidAutoBacktrack (8191);
//   * gra/src/battle/formationRules.ts: compactLineAllowsAdvance (156), wykonywana z pinu bez zmian.
//
// Trzy metody sa wycinane z pliku po deklaracji do domykajacego nawiasu o wcieciu 2 spacje (dla funkcji
// modulu: `}` w kolumnie 0), typy sa zdejmowane przez node:module.stripTypeScriptTypes i wykonywane na
// obiekcie-atrapie `this`. Atrapy (NIE kod pinu) sa jawnie nazwane w polu `stubs` wektora:
//   * isSiegeUnit(bu)            -> bu.siege (w pinie: czytanie bu.stats['Typ'] / nazwy jednostki);
//   * _effectiveMetaForUnit(ru)  -> { doctrine: ru.effDoctrine } (w pinie: meta grupy/jednostki);
//   * this.atk / this.def / _groupMeta / _generalSettings -> podawane jako fakty wektora.
// Oczekiwania (`expected`) pochodza wylacznie z wykonania tych fragmentow kodu weba.
//
// Uzycie (Node >= 22.13; pliki wyciete z pinu, np. `git show <pin>:gra/src/battle/battleScene.ts > plik`):
//   node rust-port/engine/tests/p6_player_order_move_gate_gen.mjs <battleScene.ts> <formationRules.ts> <PIN_SHA> \
//     > rust-port/engine/tests/p6_player_order_move_gate_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const [BS_PATH, FR_PATH, PIN] = process.argv.slice(2);
if (!BS_PATH || !FR_PATH || !PIN) throw new Error('uzycie: gen.mjs <battleScene.ts> <formationRules.ts> <PIN_SHA>');
const bsLines = readFileSync(BS_PATH, 'utf8').split('\n');
const frLines = readFileSync(FR_PATH, 'utf8').split('\n');

// ---------------------------------------------------------------------------
// 1. Wycinanie fragmentow z pinu + sumy SHA-256 (sledzenie, ktory tekst zostal wykonany).
// ---------------------------------------------------------------------------
function extract(name, lines, startRe, closeLine) {
  const start = lines.findIndex(l => startRe.test(l));
  if (start < 0) throw new Error(`brak deklaracji ${name}`);
  const end = lines.findIndex((l, i) => i > start && l === closeLine);
  if (end < 0) throw new Error(`brak domkniecia ${name}`);
  const text = lines.slice(start, end + 1).join('\n');
  return { name, text, lines: [start + 1, end + 1], sha256: createHash('sha256').update(text).digest('hex') };
}
const FRAGS = {
  destAllowedByBlockade: extract('_destAllowedByBlockade', bsLines, /^  private _destAllowedByBlockade\(/, '  }'),
  compactAttackAllowsStep: extract('_compactAttackAllowsStep', bsLines, /^  private _compactAttackAllowsStep\(/, '  }'),
  shouldAvoidAutoBacktrack: extract('_shouldAvoidAutoBacktrack', bsLines, /^  private _shouldAvoidAutoBacktrack\(/, '  }'),
  compactLineAllowsAdvance: extract('compactLineAllowsAdvance', frLines, /^export function compactLineAllowsAdvance\(/, '}'),
};

// ---------------------------------------------------------------------------
// 2. Wykonanie kodu z pinu.
// ---------------------------------------------------------------------------
const frJs = stripTypeScriptTypes(FRAGS.compactLineAllowsAdvance.text.replace(/^export /, ''));
const compactLineAllowsAdvance = new Function(`${frJs}\nreturn compactLineAllowsAdvance;`)();

const classJs = stripTypeScriptTypes(
  `class __Gate {\n${FRAGS.destAllowedByBlockade.text}\n${FRAGS.compactAttackAllowsStep.text}\n${FRAGS.shouldAvoidAutoBacktrack.text}\n}`,
);
const GateClass = new Function('isSiegeUnit', 'compactLineAllowsAdvance', `${classJs}\nreturn __Gate;`)(
  bu => bu.siege === true,
  compactLineAllowsAdvance,
);

function makeGate({ atk = [], def = [], generalSettings = { blockadeActive: false, blockadeCol: null }, groupMeta = new Map() }) {
  const g = new GateClass();
  g.atk = atk;
  g.def = def;
  g._generalSettings = generalSettings;
  g._groupMeta = groupMeta;
  g._effectiveMetaForUnit = ru => ({ doctrine: ru.effDoctrine });
  return g;
}

// ---------------------------------------------------------------------------
// 3. Generator przypadkow (deterministyczny PRNG mulberry32).
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261116);
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const DOCTRINES = ['defensive', 'steady', 'aggressive', 'skirmish', 'manual'];

// 3a. Blokada linii — wyliczenie pelne.
const blockade = [];
for (const side of ['atk', 'def']) {
  for (const active of [true, false]) {
    for (const blockadeCol of [null, -2, -1, 0, 1, 2, 3, 4]) {
      for (let col = -3; col <= 6; col++) {
        const g = makeGate({ generalSettings: { blockadeActive: active, blockadeCol } });
        const ru = { side, q: 0, r: 0, bu: { siege: false } };
        blockade.push({ side, active, blockadeCol, col, expected: g._destAllowedByBlockade(ru, col) });
      }
    }
  }
}

// 3b. Krok zwarcia i anty-cofanie — losowe konfiguracje linii (seed stały).
function randUnit(side, overrides = {}) {
  return {
    side,
    q: randInt(-4, 4),
    r: randInt(0, 3),
    rank: pick([null, 0, 1, 2, 3]),
    mounted: rnd() < 0.12,
    siege: rnd() < 0.1,
    dead: rnd() < 0.08,
    fadingOut: rnd() < 0.05,
    removed: rnd() < 0.05,
    routed: rnd() < 0.06,
    ...overrides,
  };
}
const compact = [];
const COMPACT_TARGET = 2000;
while (compact.length < COMPACT_TARGET) {
  const side = pick(['atk', 'def']);
  const effDoctrine = rnd() < 0.5 ? 'steady' : pick(DOCTRINES);
  const ru = randUnit(side, { effDoctrine, mounted: rnd() < 0.1, siege: rnd() < 0.08 });
  const others = Array.from({ length: randInt(0, 6) }, () => randUnit(side));
  const line = [ru, ...others];
  const candidateCol = ru.q + pick([-2, -1, 0, 1, 2]);
  // Obiekty w ksztalcie RuntimeBattleUnit z pinu (formationRank, bu, ...); ru jest elementem swojej listy strony.
  const toPin = m => ({ side: m.side, q: m.q, r: m.r, formationRank: m.rank ?? undefined, mounted: m.mounted,
    bu: { siege: m.siege }, effDoctrine: m.effDoctrine, dead: m.dead, fadingOut: m.fadingOut, removed: m.removed,
    routed: m.routed });
  const pinLine = line.map(toPin);
  const g = makeGate({ atk: side === 'atk' ? pinLine : [], def: side === 'def' ? pinLine : [] });
  const expected = g._compactAttackAllowsStep(pinLine[0], candidateCol);
  compact.push({
    side,
    doctrine: effDoctrine,
    mounted: ru.mounted,
    siege: ru.siege,
    rank: ru.rank,
    q: ru.q,
    r: ru.r,
    candidateCol,
    members: line.map(m => ({ side: m.side, q: m.q, r: m.r, rank: m.rank, mounted: m.mounted, siege: m.siege,
      dead: m.dead, fadingOut: m.fadingOut, removed: m.removed, routed: m.routed })),
    expected,
  });
}

// 3c. Anty-cofanie automatu (_shouldAvoidAutoBacktrack) — wyliczenie pelne.
const backtrack = [];
const UNIT_DOCTRINES = [null, ...DOCTRINES];
for (const unitDoctrine of UNIT_DOCTRINES) {
  for (const hasGroupId of [false, true]) {
    const metaOptions = hasGroupId
      ? [null, ...DOCTRINES.flatMap(d => [{ doctrine: d, autoPlay: true }, { doctrine: d, autoPlay: false }])]
      : [null];
    for (const groupMeta of metaOptions) {
      const groupId = hasGroupId ? 'G1' : null;
      const map = new Map();
      if (hasGroupId && groupMeta) map.set(groupId, groupMeta);
      const g = makeGate({ groupMeta: map });
      const ru = { side: 'atk', q: 0, r: 0, bu: { siege: false }, unitDoctrine, groupId };
      backtrack.push({ unitDoctrine, hasGroupId, groupMeta, expected: g._shouldAvoidAutoBacktrack(ru) });
    }
  }
}

const out = {
  pin: PIN,
  source: 'wykonanie fragmentow kodu z pinu; atrapy wymienione w stubs',
  fragments: Object.fromEntries(Object.values(FRAGS).map(f => [f.name, { lines: f.lines, sha256: f.sha256 }])),
  stubs: ['isSiegeUnit(bu) = bu.siege', '_effectiveMetaForUnit(ru) = { doctrine: ru.effDoctrine }'],
  blockade,
  compact,
  backtrack,
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
