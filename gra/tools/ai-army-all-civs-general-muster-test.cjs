'use strict';
/**
 * ai-army-all-civs-general-muster-test.cjs -- R-WEB-AI-ARMY-ALL-CIVS-GATHER-UNDER-GENERAL-Q1.
 *
 * Kontrakt (prawdziwy decideAITurn z domyslnymi flagami, executor ruchu emulowany wg main.ts):
 *  P1 pokoj, jeden wodz w stolicy: rozproszone wojsko schodzi sie u wodza (nie u "punktu stolicy" bez wodza).
 *  P2 pokoj, dwaj wodzowie: kazda jednostka idzie do NAJBLIZSZEGO wodza.
 *  P3 pokoj, brak wodza: zachowanie awaryjne -- zbiorka w stolicy (nie rozproszenie).
 *  P4 wodz poza stolica w pokoju: wojsko dochodzi do wodza, wodz wraca do stolicy, wszyscy w stolicy.
 *  P5 wojna, kampania 'attacking': drugi wodz zostaje w miescie i zbiera nowe jednostki; wodz kampanii maszeruje
 *     z armia, nowe jednostki nie wyruszaja same.
 * Mutacje: (a) wylaczenie zbiorki u wodza w pokoju, (b) wylaczenie rezerwy w kampanii -- MUSZA lamac P1,P2 / P5.
 * Run (z gra/):  node tools/ai-army-all-civs-general-muster-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const MUT_PEACE = 'if (u.isGeneral === true || peaceLeaders.length === 0) { rallyCandidates.push(u); continue; }';
const MUT_RESERVE = 'if (reserveGenerals.length > 0) {';
const MUT_ROSTER = 'return canRecruitGeneral(state.era, { alive: state.alive, queued: state.queued });';
const WORK = fs.mkdtempSync(path.join(process.env.ARS_TMP || os.tmpdir(), 'gmu-'));

async function buildBundle(name, mutation) {
  const entry = path.join(WORK, `${name}-entry.ts`);
  const out = path.join(WORK, `${name}-bundle.cjs`);
  const srcDir = path.resolve(__dirname, '..', 'src', 'game');
  fs.writeFileSync(entry, `export { decideAITurn } from ${JSON.stringify(path.join(srcDir, 'ai.ts'))};
export { shouldAiBuyGeneral } from ${JSON.stringify(path.join(srcDir, 'generals.ts'))};
export { hexDistance } from ${JSON.stringify(path.resolve(__dirname, '..', 'src', 'units', 'setup.ts'))};
`);
  const plugin = {
    name: 'mutate-ai',
    setup(b) {
      b.onLoad({ filter: /game[\\/](ai|generals|ai-general-war-campaign)\.ts$/ }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        if (mutation && args.path.replace(/\\/g, '/').endsWith('/' + (mutation.file || 'ai.ts'))) {
          if (text.split(mutation.from).length !== 2) throw new Error('mutacja: nie znaleziono dokladnie jednego wystapienia: ' + mutation.from);
          text = text.replace(mutation.from, mutation.to);
        }
        return { contents: text, loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out,
    loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent', plugins: [plugin],
  });
  return require(out);
}

let passed = 0, failed = 0;
function ok(value, message) { if (value) passed++; else { failed++; console.error('FAIL:', message); } }

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const data = { units: [{ Jednostka: 'Wojownik', Typ: 'Melee', Health: 30, Ruch: 2 }], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
const MAP = makeMap(70, 50);
const CAP = { id: 'cap', ownerId: 1, q: 10, r: 10, name: 'Cap', population: 5 };
const ENEMY = { id: 'enemy', ownerId: 2, q: 50, r: 24, name: 'E', population: 5 };
let uid = 0;
const troop = (q, r) => ({ id: 't' + String(uid++).padStart(3, '0'), ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, hp: 30 });
const general = (id, q, r) => ({ id, ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, hp: 30, isGeneral: true });

function step(B, own, turn, extra) {
  for (const u of own) u.ruchLeft = u.ruch;
  const opts = { civType: 'grecy', currentTurn: turn, canEngageOwner: () => false, capitalCityId: CAP.id, atWarWithCiv: false, ...extra };
  const cmds = B.decideAITurn(1, own, [CAP, ENEMY], MAP, data, opts);
  for (const cmd of cmds) {
    if (cmd.type !== 'move') continue;
    const u = own.find(x => x.id === cmd.unitId);
    if (!u) continue;
    if (cmd.toQ === ENEMY.q && cmd.toR === ENEMY.r) continue;
    const occ = own.some(o => o.id !== u.id && o.q === cmd.toQ && o.r === cmd.toR);
    if (occ && cmd.allowFriendlyStack !== true) continue;
    u.q = cmd.toQ; u.r = cmd.toR;
  }
  step.lastOpts = opts;
  return cmds;
}
const near = (B, a, b) => B.hexDistance(a.q, a.r, b.q, b.r);

(async () => {
  const B = await buildBundle('good', null);
  const MA = await buildBundle('mutA', { from: MUT_PEACE, to: 'if (true) { rallyCandidates.push(u); continue; }' });
  const MB = await buildBundle('mutB', { from: MUT_RESERVE, to: 'if (false) {' });
  const MC = await buildBundle('mutC', { from: 'const released = prior >= AI_GENERAL_WAR_GATHER_TURNS;', to: 'const released = false;' , file: 'ai-general-war-campaign.ts' }).catch(() => null);
  const ME = await buildBundle('mutE', { from: 'const pathLen = leaderPathLengthFor(unit, map, units);', to: 'const pathLen = (x, y) => hexDistance(x.q, x.r, y.q, y.r);' });
  const MD = await buildBundle('mutD', { file: 'generals.ts', from: MUT_ROSTER, to: 'return false;' });

  // P1: pokoj, wodz stoi POZA stolica (np. po wojnie); wojsko rozsiane -- zbiera sie u wodza.
  const p1 = (b) => {
    const g = general('G1', 30, 30);
    const ts = [troop(24, 30), troop(30, 36), troop(36, 30), troop(30, 24), troop(26, 26)];
    const own = [g, ...ts];
    // wodz zostaje na miejscu (blokada ruchu wodza w tescie), zeby izolowac zachowanie zolnierzy
    for (let t = 1; t <= 12; t++) { g.q = 30; g.r = 30; step(b, own, t); g.q = 30; g.r = 30; }
    return ts.filter(u => near(b, u, g) === 0).length;
  };
  ok(p1(B) === 5, `P1: 5/5 zolnierzy zebranych u wodza (jest ${p1(B)})`);
  ok(p1(MA) < 5, `P1 mutacja A: bez zbiorki u wodza LAMIE kontrakt (jest ${p1(MA)})`);

  // P2: dwaj wodzowie -- najblizszy wygrywa.
  const p2 = (b) => {
    const gA = general('GA', 20, 10); const gB = general('GB', 50, 10);
    const tA = troop(24, 10); const tB = troop(46, 10);
    const own = [gA, gB, tA, tB];
    for (let t = 1; t <= 8; t++) { gA.q = 20; gA.r = 10; gB.q = 50; gB.r = 10; step(b, own, t); gA.q = 20; gA.r = 10; gB.q = 50; gB.r = 10; }
    return [near(b, tA, gA), near(b, tB, gB)];
  };
  const r2 = p2(B);
  ok(r2[0] === 0 && r2[1] === 0, `P2: kazda jednostka u NAJBLIZSZEGO wodza (odleglosci ${r2.join(',')})`);
  const r2m = p2(MA);
  ok(!(r2m[0] === 0 && r2m[1] === 0), `P2 mutacja A lamie kontrakt (odleglosci ${r2m.join(',')})`);

  // P3: brak wodza -- zachowanie awaryjne: zbiorka w stolicy.
  {
    const ts = [troop(30, 30), troop(26, 20), troop(20, 14), troop(14, 24)];
    for (let t = 1; t <= 24; t++) step(B, ts, t);
    ok(ts.every(u => near(B, u, CAP) <= 1), `P3: brak wodza -> wojsko zbiera sie w stolicy (odleglosci ${ts.map(u => near(B, u, CAP)).join(',')})`);
  }

  // P4: wodz poza stolica, pokoj: wodz wraca do stolicy, zolnierze dochodza do wodza (nie zostaja rozproszeni).
  {
    const g = general('G1', 28, 10);
    const ts = [troop(34, 14), troop(22, 18), troop(30, 4)];
    const own = [g, ...ts];
    for (let t = 1; t <= 20; t++) step(B, own, t);
    ok(near(B, g, CAP) <= 1, `P4: wodz wraca do stolicy w pokoju (odleglosc ${near(B, g, CAP)})`);
    ok(ts.every(u => near(B, u, g) <= 1), `P4: zolnierze przy wodzu (odleglosci ${ts.map(u => near(B, u, g)).join(',')})`);
  }

  // P5: kampania 'attacking', G1 poza miastem z armia, G2 w stolicy; nowe jednostki rodza sie w stolicy.
  const p5 = (b) => {
    const g1 = general('G1', 25, 10); const g2 = general('G2', 10, 10);
    const army = [troop(25, 10), troop(25, 10)];
    const newborn = [troop(10, 10), troop(12, 10)];
    const own = [g1, g2, ...army, ...newborn];
    const target = { ownerId: 2, cityId: ENEMY.id, q: ENEMY.q, r: ENEMY.r };
    const camp = { targetOwnerId: 2, stage: 'attacking', generalUnitId: 'G1', gatherTurnsCompleted: 5, rallyQ: 25, rallyR: 10, target, turn: 1 };
    const warAllIn = { targets: [target], enemyArmies: [], engageRadius: 6, enemyStrength: [{ ownerId: 2, strength: 0 }] };
    for (let t = 1; t <= 6; t++) {
      step(b, own, t, { canEngageOwner: () => true, atWarWithCiv: true, warAllIn, aiGeneralWarCampaign: { ...camp, turn: t } });
      g2.q = 10; g2.r = 10; // wodz rezerwowy trzyma miasto (izolacja zachowania zolnierzy)
    }
    return { newbornAtG2: newborn.filter(u => near(b, u, g2) === 0).length, armyMoved: army.filter(u => near(b, u, ENEMY) < 31).length, armyPos: army.map(u => u.q + ',' + u.r).join(' ') };
  };
  const r5 = p5(B);
  ok(r5.newbornAtG2 === 2, `P5: nowe jednostki zbieraja sie u wodza rezerwowego w miescie (${r5.newbornAtG2}/2)`);
  ok(r5.armyMoved >= 1, `P5: armia wodza kampanii maszeruje na cel (ruszylo ${r5.armyMoved}/2)`);
  const r5m = p5(MB);
  ok(r5m.newbornAtG2 < 2, `P5 mutacja B: bez rezerwy nowe jednostki ida z kampania, nie zostaja u wodza (${r5m.newbornAtG2}/2)`);

  // P6 (Braz #2, wymaganie wlasciciela): wodz rezerwowy zbiera nowa armie w miescie PRZEZ 5 TUR, potem rusza
  // jako druga fala. Stan kampanii przenoszony miedzy turami jak w main.ts (opts.aiGeneralWarCampaign).
  const p6 = (b) => {
    const g1 = general('G1', 25, 10); const g2 = general('G2', 10, 10);
    const army = [troop(25, 10), troop(25, 10)];
    const newborn = [troop(10, 10), troop(12, 10)];
    const own = [g1, g2, ...army, ...newborn];
    const target = { ownerId: 2, cityId: ENEMY.id, q: ENEMY.q, r: ENEMY.r };
    let camp = { targetOwnerId: 2, stage: 'attacking', generalUnitId: 'G1', gatherTurnsCompleted: 5, rallyQ: 25, rallyR: 10, target, turn: 1 };
    const warAllIn = { targets: [target], enemyArmies: [], engageRadius: 6, enemyStrength: [{ ownerId: 2, strength: 0 }] };
    const heldAt = [];
    for (let t = 1; t <= 9; t++) {
      step(b, own, t, { canEngageOwner: () => true, atWarWithCiv: true, warAllIn, aiGeneralWarCampaign: { ...camp, turn: t } });
      if (step.lastOpts.aiGeneralWarCampaign) camp = { ...step.lastOpts.aiGeneralWarCampaign };
      heldAt.push(newborn.filter(u => near(b, u, g2) === 0).length);
      if (t < 9) { g2.q = 10; g2.r = 10; } // wodz rezerwowy trzyma miasto
    }
    return heldAt;
  };
  const r6 = p6(B);
  ok(r6.slice(0, 5).every(n => n === 2), `P6: rezerwa zbiera w miescie przez 5 tur (u wodza #2 po turach: ${r6.join(',')})`);
  ok(r6[8] < 2, `P6: po 5 turach zbiorki rezerwa rusza jako druga fala (tura 9: ${r6[8]}/2 jeszcze u wodza #2)`);
  if (MC) { const r6m = p6(MC); ok(r6m.every(n => n === 2), `P6 mutacja C: bez odblokowania rezerwa czeka bez konca (${r6m.join(',')})`); }

  // P7: metryka "najblizszy wodz" = dlugosc realnej trasy (jak w pokoju), nie linia prosta. Mur z morza z przejsciem
  // daleko: wodz rezerwowy w linii prostej blizej, ale trasa do niego jest dluzsza niz do wodza kampanii.
  {
    const map = makeMap(70, 50);
    for (let r = 0; r < 50; r++) if (r < 40) map.hexes[`14,${r}`].terenBazowy = 'morze';
    const MAPSAVE = MAP;
    const g1 = general('G1', 4, 10); const g2 = general('G2', 17, 10);
    const t = troop(12, 10);
    const target = { ownerId: 2, cityId: ENEMY.id, q: ENEMY.q, r: ENEMY.r };
    const camp = { targetOwnerId: 2, stage: 'attacking', generalUnitId: 'G1', gatherTurnsCompleted: 5, rallyQ: 8, rallyR: 10, target, turn: 1 };
    const own = [g1, g2, t];
    t.ruchLeft = t.ruch;
    const cmds = B.decideAITurn(1, own, [CAP, ENEMY], map, data, { civType: 'grecy', currentTurn: 1, canEngageOwner: () => true, capitalCityId: CAP.id, atWarWithCiv: true,
      warAllIn: { targets: [target], enemyArmies: [], engageRadius: 6, enemyStrength: [{ ownerId: 2, strength: 0 }] }, aiGeneralWarCampaign: camp });
    const mv = cmds.find(c => c.type === 'move' && c.unitId === t.id);
    const tE = troop(12, 10); tE.ruchLeft = tE.ruch;
    const cmdsE = ME.decideAITurn(1, [general('G1', 4, 10), general('G2', 17, 10), tE], [CAP, ENEMY], map, data,
      { civType: 'grecy', currentTurn: 1, canEngageOwner: () => true, capitalCityId: CAP.id, atWarWithCiv: true,
        warAllIn: { targets: [target], enemyArmies: [], engageRadius: 6, enemyStrength: [{ ownerId: 2, strength: 0 }] }, aiGeneralWarCampaign: { ...camp } });
    const mvE = cmdsE.find(c => c.type === 'move' && c.unitId === tE.id);
    ok(mv !== undefined && mv.targetCityId === 'enemy', 'P7: jednostka za murem maszeruje z wodzem kampanii (trasa do wodza rezerwowego jest dluzsza)');
    ok(mvE === undefined || mvE.targetCityId !== 'enemy', 'P7 mutacja E: metryka linii prostej LAMIE kontrakt (jednostka zatrzymana jako rezerwa za murem)');
    void MAPSAVE;
  }

  // P8: kupno wodza AI w pokoju (ensureAiGeneralRoster -> shouldAiBuyGeneral): limit epoki i odnowa po smierci.
  {
    const base = { majorCiv: true, hasCapital: true, hasOffer: true };
    ok(B.shouldAiBuyGeneral({ ...base, era: 1, alive: 0, queued: 0 }) === true, 'P8: Kamien, brak wodza -> kup');
    ok(B.shouldAiBuyGeneral({ ...base, era: 1, alive: 1, queued: 0 }) === false, 'P8: Kamien, jest wodz -> nie kupuj (limit 1)');
    ok(B.shouldAiBuyGeneral({ ...base, era: 1, alive: 0, queued: 1 }) === false, 'P8: Kamien, wodz w kolejce -> nie kupuj');
    ok(B.shouldAiBuyGeneral({ ...base, era: 2, alive: 1, queued: 0 }) === true, 'P8: Braz, 1 wodz -> kup drugiego');
    ok(B.shouldAiBuyGeneral({ ...base, era: 2, alive: 1, queued: 1 }) === false, 'P8: Braz, 1 zywy + 1 w kolejce -> nie kupuj');
    ok(B.shouldAiBuyGeneral({ ...base, era: 2, alive: 2, queued: 0 }) === false, 'P8: Braz, 2 wodzow -> nie kupuj');
    ok(B.shouldAiBuyGeneral({ ...base, era: 2, alive: 0, queued: 0 }) === true, 'P8: po smierci wszystkich wodzow -> kup nowego (stolica)');
    ok(B.shouldAiBuyGeneral({ ...base, hasCapital: false, era: 1, alive: 0, queued: 0 }) === false, 'P8: bez stolicy -> nie kupuj');
    ok(B.shouldAiBuyGeneral({ ...base, hasOffer: false, era: 1, alive: 0, queued: 0 }) === false, 'P8: bez oferty (np. brak Koszar w Brazie) -> nie kupuj');
    ok(B.shouldAiBuyGeneral({ ...base, majorCiv: false, era: 1, alive: 0, queued: 0 }) === false, 'P8: barbarzyncy / panstwo-miasto -> nie kupuj');
    ok(MD.shouldAiBuyGeneral({ ...base, era: 1, alive: 0, queued: 0 }) === false, 'P8 mutacja D: wylaczone kupno LAMIE kontrakt');
  }

  console.log(`ai-army-all-civs-general-muster-test: ${passed} PASS, ${failed} FAIL`);
  fs.rmSync(WORK, { recursive: true, force: true });
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
