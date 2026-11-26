'use strict';
/**
 * truce-end-window-test.cjs — R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1 (runda 2, pkt 1).
 * Okno „po rozejmie” dla propozycji pokoju GRACZA do AI:
 *   - truceEndWindowOpen (diplomacy-peace-lock.ts): tura końca rozejmu + 1 kolejna tura;
 *   - truceEndTickPair zapisuje truceEndTurn przy wygaśnięciu rozejmu (ta sama tura co oferta / powrót do wojny);
 *   - evaluateProposal (diplomacy-proposals.ts), case 'pokoj' z ctx.truceEndWindow:
 *       okno + gracz płaci + cena > 0 → AI przyjmuje, gdy pakiet gracza pokrywa cenę (>=), inaczej odrzuca;
 *       poza oknem / AI płaci / brak ceny → ocena bez zmian (regresja: wynik identyczny z kontekstem bez okna).
 * Mutanty czerwone: M-OPEN (okno bez warunku open), M-THR (próg > zamiast >=), M-ACCEPT (odrzucenie
 * zamiast przyjęcia w oknie), M-SETTURN (tick nie zapisuje truceEndTurn).
 * Run: node tools/truce-end-window-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const PROPOSALS = path.resolve(GRA, 'src', 'game', 'diplomacy-proposals.ts');
const LOCK = path.resolve(GRA, 'src', 'game', 'diplomacy-peace-lock.ts');
const ENTRY = path.resolve(GRA, 'src', '.truce-end-window-entry.ts');
const OUT_DIR = path.resolve(__dirname);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { evaluateProposal } from './game/diplomacy-proposals';",
  "export { truceEndWindowOpen, truceEndTickPair } from './game/diplomacy-peace-lock';",
  '',
].join('\n');

function replacePlugin(name, target, from, to) {
  const info = { applied: 0 };
  const filter = new RegExp(path.basename(target).replace(/[.]/g, '\\.') + '$');
  return {
    info,
    plugin: {
      name,
      setup(build) {
        build.onLoad({ filter }, async () => {
          const src = fs.readFileSync(target, 'utf8');
          info.applied = src.split(from).length - 1;
          return { contents: src.split(from).join(to), loader: 'ts' };
        });
      },
    },
  };
}

async function buildBundle(outfile, plugins) {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      format: 'cjs',
      platform: 'node',
      outfile,
      logLevel: 'silent',
      plugins: plugins || [],
    });
  } finally {
    fs.unlinkSync(ENTRY);
  }
  delete require.cache[outfile];
  return require(outfile);
}

const BASE_CTX = {
  relation: { zaufanie: 60, respekt: 50, status: 'wojna' },
  stanWojny: true,
  turn: 30,
  proposerRespekt: 50,
  responderRespekt: 50,
  militaryRatio: 1,
};
const PLAYER_PEACE = { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 2, payload: { givePn: 500, receivePn: 0 } };

function withWindow(open, requiredPn) {
  return { ...BASE_CTX, truceEndWindow: { open, requiredPn } };
}

// Atrapy portów cyklu rozejmu (ta sama semantyka co main.ts truceEndPorts, bez stanu gry).
function makePorts(initialMeta, status, quote) {
  const metas = { '0-2': { ...initialMeta } };
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const log = { warDeclared: 0, offers: [], finalized: 0, removed: 0 };
  const ports = {
    getMeta: (a, b) => metas[key(a, b)] ?? {},
    setMeta: (a, b, m) => { metas[key(a, b)] = m; },
    getStatus: () => status,
    getArmyM: () => 100,
    isHuman: id => id === 0,
    declareWarAfterTruce: () => { log.warDeclared++; },
    enqueueOffer: (ownerId, reason) => { log.offers.push({ ownerId, reason }); return 'inbox-1'; },
    removeOffer: () => { log.removed++; },
    finalizePeace: () => { log.finalized++; },
    settlePeacePrice: () => true,
    quotePn: () => quote,
  };
  return { ports, metas, key, log };
}

async function main() {
  console.log('== Okno: pure truceEndWindowOpen ==');
  const base = await buildBundle(path.join(OUT_DIR, '.truce-end-window.cjs'), []);
  check('okno: brak tury → zamknięte', base.truceEndWindowOpen(undefined, 10) === false);
  check('okno: ta sama tura → otwarte', base.truceEndWindowOpen(10, 10) === true);
  check('okno: +1 tura → otwarte', base.truceEndWindowOpen(10, 11) === true);
  check('okno: +2 tury → zamknięte', base.truceEndWindowOpen(10, 12) === false);
  check('okno: tura przed końcem → zamknięte', base.truceEndWindowOpen(10, 9) === false);
  check('okno: NaN tury → zamknięte', base.truceEndWindowOpen(10, NaN) === false);

  console.log('== Tick: zapis truceEndTurn przy wygaśnięciu ==');
  {
    const { ports, metas, key, log } = makePorts({ truceUntilTurn: 10, truceInitiatorId: 0 }, 'pokoj', 300);
    base.truceEndTickPair(ports, 0, 2, 10);
    const m = metas[key(0, 2)];
    check('tick: oferta AI w skrzynce gracza powstaje', log.offers.length === 1 && m.truceEndOffer?.turn === 10);
    check('tick: truceEndTurn = tura wygaśnięcia', m.truceEndTurn === 10, m.truceEndTurn);
    check('tick: okno otwarte w tej turze i następnej', base.truceEndWindowOpen(m.truceEndTurn, 10) && base.truceEndWindowOpen(m.truceEndTurn, 11));
    check('tick: meta po zapisie przechodzi JSON (pole liczbowe)', JSON.parse(JSON.stringify(m)).truceEndTurn === 10);
  }
  {
    const { ports, metas, key, log } = makePorts({ truceUntilTurn: 10, truceInitiatorId: 0 }, 'pokoj', 0);
    base.truceEndTickPair(ports, 0, 2, 10);
    const m = metas[key(0, 2)];
    check('tick cena 0: brak oferty w skrzynce', log.offers.length === 0 && m.truceEndOffer === undefined);
    check('tick cena 0: wojna wraca raz', log.warDeclared === 1, log.warDeclared);
    check('tick cena 0: okno zapisane, ale zamknięte przez cenę 0 w ctx', m.truceEndTurn === 10);
  }

  console.log('== Propozycja gracza w oknie (evaluateProposal) ==');
  const ev = (ctx, proposal = PLAYER_PEACE) => base.evaluateProposal(proposal, ctx);
  {
    const r = ev(withWindow(true, 300));
    check('okno + pokryta cena (500 ≥ 300) → zaakceptowana', r.accepted === true, r);
    check('okno + pokryta cena → powód „pokryta”', typeof r.reason === 'string' && r.reason.includes('pokryta'), r.reason);
  }
  {
    const r = ev(withWindow(true, 500));
    check('okno + równa cena (500 = 500) → zaakceptowana (≥)', r.accepted === true, r);
  }
  {
    const r = ev(withWindow(true, 501));
    check('okno + niedopłata (500 < 501) → odrzucona', r.accepted === false, r);
    check('okno + niedopłata → powód „nie jest pokryta”', typeof r.reason === 'string' && r.reason.includes('nie jest pokryta'), r.reason);
  }
  {
    const baseline = ev(BASE_CTX);
    const outside = ev(withWindow(false, 300));
    check('poza oknem (open=false) → wynik jak bez okna (regresja)', outside.accepted === baseline.accepted && outside.reason === baseline.reason, { outside, baseline });
    const none = ev({ ...BASE_CTX, truceEndWindow: undefined });
    check('brak pola okna → wynik jak bez okna (regresja)', none.accepted === baseline.accepted && none.reason === baseline.reason);
    const zero = ev(withWindow(true, 0));
    check('okno z ceną 0 → wynik jak bez okna (regresja)', zero.accepted === baseline.accepted && zero.reason === baseline.reason);
    const aiProposer = ev(withWindow(true, 300), { ...PLAYER_PEACE, proposerOwnerId: 2, responderOwnerId: 0 });
    const aiBase = ev(BASE_CTX, { ...PLAYER_PEACE, proposerOwnerId: 2, responderOwnerId: 0 });
    check('AI proponuje (proposer ≠ gracz) → okno nie działa (bez zmian)', aiProposer.accepted === aiBase.accepted && aiProposer.reason === aiBase.reason);
  }

  console.log('== Mutanty czerwone ==');
  const mutants = [
    {
      name: 'M-OPEN',
      target: PROPOSALS,
      from: 'truceWindow?.open === true',
      to: 'truceWindow != null',
      expect: 'poza oknem (open=false) nie może zmieniać oceny',
      check: async m => {
        const r = m.evaluateProposal(PLAYER_PEACE, withWindow(false, 300));
        const b = m.evaluateProposal(PLAYER_PEACE, BASE_CTX);
        return r.accepted !== b.accepted || r.reason !== b.reason;
      },
    },
    {
      name: 'M-THR',
      target: PROPOSALS,
      from: 'if (offeredPn >= truceWindow.requiredPn) {',
      to: 'if (offeredPn > truceWindow.requiredPn) {',
      expect: 'równa cena (500 = 500) musi być przyjęta',
      check: async m => m.evaluateProposal(PLAYER_PEACE, withWindow(true, 500)).accepted === false,
    },
    {
      name: 'M-ACCEPT',
      target: PROPOSALS,
      from: "return { accepted: true, reason: 'Pokój zawarty — cena po rozejmie pokryta', oneShotTrade: true };",
      to: "return { accepted: false, reason: 'Pokój zawarty — cena po rozejmie pokryta', oneShotTrade: true };",
      expect: 'pokryta cena w oknie musi dać przyjęcie',
      check: async m => m.evaluateProposal(PLAYER_PEACE, withWindow(true, 300)).accepted === false,
    },
    {
      name: 'M-SETTURN',
      target: LOCK,
      from: 'truceUntilTurn: undefined, truceEndTurn: turn });',
      to: 'truceUntilTurn: undefined });',
      expect: 'tick musi zapisać truceEndTurn',
      check: async m => {
        const { ports, metas, key } = makePorts({ truceUntilTurn: 10, truceInitiatorId: 0 }, 'pokoj', 300);
        m.truceEndTickPair(ports, 0, 2, 10);
        return metas[key(0, 2)].truceEndTurn === undefined;
      },
    },
  ];

  for (const mt of mutants) {
    const outfile = path.join(OUT_DIR, `.truce-end-window-${mt.name.toLowerCase()}.cjs`);
    const { plugin, info } = replacePlugin(`mutant-${mt.name}`, mt.target, mt.from, mt.to);
    const m = await buildBundle(outfile, [plugin]);
    check(`${mt.name}: mutacja zastosowana (1 trafienie)`, info.applied === 1, info.applied);
    const caught = await mt.check(m);
    check(`${mt.name}: test wykrywa mutanta (${mt.expect})`, caught === true);
  }

  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.startsWith('.truce-end-window')) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  console.log(`\nWynik: PASS=${pass} FAIL=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
