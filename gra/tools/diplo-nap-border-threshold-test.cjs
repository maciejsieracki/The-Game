'use strict';
/**
 * diplo-nap-border-threshold-test.cjs — R-WEB-DIPLO-NAP-UI-BORDER-THRESHOLD-Q1.
 *
 * Usterka: blokada akcji „Pakt o nieagresji" w UI (diplomacy-locks.ts, case '2') nie
 * uwzględniała narzutu „Kara za wspólną granicę" (NAP_GRANICA_RELACJA_NARZUT), który
 * silnik (evaluateProposal::case 'nap') dolicza do progu Relacji. UI pokazywał próg
 * progNapRelacja (110/120), silnik odrzucał przy 130/140.
 *
 * Test pisany z kryteriów końca dispatchu, nie z implementacji:
 *  M. Pomiar: efektywny próg UI vs silnik w 4 scenariuszach (Normalny/Trudny × bez/ze
 *     wspólną granicą). Próg silnika czytany z treści jego odmowy („wymagana ≥ N"),
 *     próg UI — z granicy odblokowania resolveDiplomacyActionLock.
 *  R1. UI zgodny z silnikiem we wszystkich 4 scenariuszach (jeden próg).
 *  R2. Notka blokady podaje efektywny próg i przyczynę („+20 za wspólną granicę").
 *  R3. Zaufanie ≥ 30 nadal bramkuje pakt (fail-closed, bez zmian).
 *  R4. Bez wspólnej granicy zachowanie identyczne jak przed zmianą (regresja).
 *  R5. Helper progu jest jedną funkcją: ten sam wynik dla UI i silnika przy aktywnym
 *      flagowaniu agresora (deltaRelacjiSojusz) — parytet.
 *
 * Uruchom z gra/:  node tools/diplo-nap-border-threshold-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing — npm ci --ignore-scripts w gra/'); process.exit(1); }
})();

const TAG = '.nap-border-' + process.pid;
const ENTRY = path.resolve(__dirname, TAG + '-entry.ts');
const BUNDLE = path.resolve(__dirname, TAG + '-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { resolveDiplomacyActionLock } from '../src/game/diplomacy-locks.ts';
export { evaluateProposal, NAP_GRANICA_RELACJA_NARZUT } from '../src/game/diplomacy-proposals.ts';
export { getEffectiveDiplomacyParams, ustawStanAgresorow } from '../src/game/diplomacy.ts';
`, 'utf8');

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

function cleanup() {
  for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch { /* brak */ } }
}

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  });
  const M = require(BUNDLE);
  const { resolveDiplomacyActionLock, evaluateProposal, getEffectiveDiplomacyParams, ustawStanAgresorow } = M;
  const NARZUT = M.NAP_GRANICA_RELACJA_NARZUT;

  // Kontekst wspólny: Zaufanie 100 (bramka Zaufania zawsze przechodzi), Relacja sterowana.
  const baseLockCtx = (diff, relTotal, extra = {}) => ({
    actionId: '2',
    contact: true,
    atWar: false,
    relTotal,
    zaufanie: 100,
    respekt: 0,
    hasNap: false,
    hasHandel: false,
    hasTradeConnection: true,
    hasSojusz: false,
    sellableTechCount: 0,
    buyableTechCount: 0,
    knownRivalsCount: 0,
    progNapRelacja: getEffectiveDiplomacyParams(diff).progNapRelacja,
    progNapZaufanie: getEffectiveDiplomacyParams(diff).progNapZaufanie,
    progHandelRelacja: 0,
    progSojuszRelacja: 999,
    progSojuszZaufanie: 999,
    progGraniceRelacja: 0,
    progGraniceZaufanie: 0,
    progWymianaTechZaufanie: 0,
    progNamowWojneZaufanie: 0,
    progWasalizacjaRespekt: 999,
    progTrybutZadanieMinRespekt: 999,
    progDarRelacja: 0,
    ...extra,
  });

  // Próg UI: najmniejsza Relacja, przy której akcja '2' jest odblokowana (Zaufanie 100).
  function uiThreshold(diff, border) {
    for (let r = 0; r <= 200; r++) {
      const res = resolveDiplomacyActionLock(baseLockCtx(diff, r, { karaWspolnaGranica: border }));
      if (!res.locked) return r;
    }
    return null;
  }

  // Próg silnika: evaluateProposal odrzuca z „wymagana ≥ N" przy Relacji 100 (Zaufanie 100,
  // Respekt 0 → score 100, poniżej każdego progu tu używanego).
  function engineThreshold(diff, border, agresor = false) {
    const relation = { zaufanie: 100, respekt: 0, status: 'pokoj', ile: 0 };
    const proposal = {
      actionId: 'nap',
      proposerOwnerId: 0,
      responderOwnerId: 1,
      payload: {},
    };
    const ctx = {
      relation,
      stanWojny: false,
      turn: 50,
      responderRespekt: 0,
      proposerRespekt: 0,
      proposerWiarygodnosc: 100,
      karaWspolnaGranica: border,
      difficulty: diff,
      activeDeals: [],
      fairTradeValue: 20,
      epoka: 1,
    };
    ustawStanAgresorow(agresor ? { '0': 100 } : {});
    const r = evaluateProposal(proposal, ctx);
    ustawStanAgresorow({});
    if (r.accepted) return { accepted: true, reason: r.reason };
    const m = /wymagana ≥ (\d+)/.exec(r.reason || '');
    return m ? Number(m[1]) : { unparsed: r.reason };
  }

  console.log('[M] POMIAR — efektywny próg Relacji dla Paktu (UI vs silnik)');
  const scen = [
    ['normal', false], ['normal', true], ['hard', false], ['hard', true],
  ];
  const measured = {};
  for (const [diff, border] of scen) {
    const ui = uiThreshold(diff, border);
    const eng = engineThreshold(diff, border);
    measured[`${diff}/${border ? 'granica' : 'bez'}`] = { ui, eng };
    console.log(`  ${diff.padEnd(6)} granica=${String(border).padEnd(5)} UI=${ui} silnik=${JSON.stringify(eng)}`);
  }

  console.log('[R1] UI zgodny z silnikiem (jeden próg)');
  for (const [diff, border] of scen) {
    const ui = uiThreshold(diff, border);
    const eng = engineThreshold(diff, border);
    assert(`${diff}/${border ? 'granica' : 'bez'}: UI=${ui} == silnik=${JSON.stringify(eng)}`,
      typeof eng === 'number' && ui === eng);
  }
  assert('narzut granicy = 20 (wyprowadzony z SWEETENER_EASE_MAX_POINTS)', NARZUT === 20, NARZUT);

  console.log('[R2] notka blokady podaje efektywny próg i przyczynę');
  {
    const eff = getEffectiveDiplomacyParams('normal').progNapRelacja + NARZUT;
    const note = resolveDiplomacyActionLock(
      baseLockCtx('normal', eff - 5, { karaWspolnaGranica: true }),
    ).note || '';
    assert(`notka zawiera efektywny próg ${eff}`, note.includes(String(eff)), note);
    assert('notka zawiera przyczynę „+20 za wspólną granicę"',
      note.includes('+20') && note.includes('wspólną granicę'), note);
  }

  console.log('[R3] Zaufanie nadal bramkuje pakt (fail-closed)');
  {
    const res = resolveDiplomacyActionLock(
      baseLockCtx('normal', 200, { karaWspolnaGranica: true, zaufanie: 29 }),
    );
    assert('Zaufanie 29 < 30 → zablokowany', res.locked === true, res);
    assert('notka Zaufania nadal wymienia „Zaufania 30"', String(res.note).includes('Zaufania 30'), res.note);
  }

  console.log('[R4] bez wspólnej granicy — brak zmiany zachowania');
  {
    const p = getEffectiveDiplomacyParams('normal').progNapRelacja;
    const below = resolveDiplomacyActionLock(baseLockCtx('normal', p - 1, { karaWspolnaGranica: false }));
    const at = resolveDiplomacyActionLock(baseLockCtx('normal', p, { karaWspolnaGranica: false }));
    const undef = resolveDiplomacyActionLock(baseLockCtx('normal', p, {}));
    assert(`bez granicy: ${p - 1} zablokowany`, below.locked === true, below);
    assert(`bez granicy: ${p} odblokowany`, at.locked === false, at);
    assert('pole nieobecne == false', undef.locked === false, undef);
    assert('notka bez granicy nie wspomina narzutu', !String(below.note).includes('granicę'), below.note);
  }

  console.log('[R5] parytet przy aktywnym agresorze (deltaRelacjiSojusz)');
  {
    const uiAg = (() => {
      for (let r = 0; r <= 200; r++) {
        const res = resolveDiplomacyActionLock(baseLockCtx('normal', r, { karaWspolnaGranica: true, napAgresorAktywny: true }));
        if (!res.locked) return r;
      }
      return null;
    })();
    const engAg = engineThreshold('normal', true, true);
    assert(`agresor+granica: UI=${uiAg} == silnik=${JSON.stringify(engAg)}`,
      typeof engAg === 'number' && uiAg === engAg, { uiAg, engAg });
  }

  cleanup();
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(2); });
