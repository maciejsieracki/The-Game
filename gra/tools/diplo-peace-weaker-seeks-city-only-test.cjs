'use strict';
/**
 * diplo-peace-weaker-seeks-city-only-test.cjs — R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 (runda 2).
 * Zachowanie reguły siły militarnej przy rozejmie/pokoju:
 *  (a) pozycja militarna (peaceMilitaryPosition): silniejsza / słabsza / remis deterministyczny / pasmo;
 *  (b) bramka AI (evaluatePeaceAiGate): pozycja 'silniejsza' odrzuca (stronger), 'slabsza' i 'pasmo' nie;
 *  (c) propozycja gracza do silniejszej AI: bez miasta odrzucana; miasto o PN < ceny odrzucane; miasto ≥ ceny nie;
 *  (d) złoto i surowce nie są słodzikiem (odrzucane, także przy słabszej AI);
 *  (e) minimalny czas wojny nadal blokuje (too_early);
 *  (f) rozejm (actionId 'rozejm') podlega tej samej regule co pokój.
 * Mutacje (h) NIE są uruchamiane przez ten plik — patrz raport Operatora.
 * Run: node tools/diplo-peace-weaker-seeks-city-only-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-weaker-city-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-weaker-city-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { evaluateProposal, createNegotiation, negotiationAsProposal } from './game/diplomacy-proposals';",
  "export { evaluatePeaceAiGate, resolveWarPeaceProfile } from './game/diplomacy-war-peace-profile';",
  "export { peaceMilitaryPosition } from './game/diplomacy-military-strength';",
  "export { aiCommandToPendingProposal } from './game/diplomacy-proposals';",
  "export { decideAIDiplomacy } from './game/ai';",
  "",
].join('\n');

function cleanup() {
  for (const p of [ENTRY, BUNDLE]) {
    try { fs.unlinkSync(p); } catch (_) { /* ok */ }
  }
}

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
    });
    const mod = require(BUNDLE);
    const { peaceMilitaryPosition: pos, evaluatePeaceAiGate, resolveWarPeaceProfile } = mod;
    const PROFILE = resolveWarPeaceProfile('rzymianie');

    // (a) pozycja militarna
    const S = (id, sila) => ({ id, sila, armiaPkt: 0 });
    check('a1 silniejsza: 200 vs 100', pos(S('ai', 200), S('p', 100), 0) === 'silniejsza');
    check('a2 słabsza: 100 vs 200', pos(S('ai', 100), S('p', 200), 0) === 'slabsza');
    check('a3 słabsza przy małej różnicy (100 vs 105, próg 0)', pos(S('ai', 100), S('p', 105), 0) === 'slabsza');
    const r1 = pos(S('0', 100), S('1', 100), 0);
    const r2 = pos(S('1', 100), S('0', 100), 0);
    check('a4 remis deterministyczny: dokładnie jedna strona silniejsza', (r1 === 'silniejsza') !== (r2 === 'silniejsza'), { r1, r2 });
    check('a5 pasmo: próg 20%, różnica 10%', pos(S('ai', 110), S('p', 100), 20) === 'pasmo');

    // (b) bramka AI
    const gStr = evaluatePeaceAiGate({ rw: 0.5, turnsAtWar: 9, lostCitiesInWar: 0, pozycjaMilitarna: 'silniejsza' }, PROFILE);
    const gWeak = evaluatePeaceAiGate({ rw: 0.5, turnsAtWar: 9, lostCitiesInWar: 0, pozycjaMilitarna: 'slabsza' }, PROFILE);
    const gBand = evaluatePeaceAiGate({ rw: 0.5, turnsAtWar: 9, lostCitiesInWar: 0, pozycjaMilitarna: 'pasmo' }, PROFILE);
    check('b1 bramka: silniejsza AI -> stronger', gStr.verdict === 'stronger', gStr);
    check('b2 bramka: słabsza AI -> ok', gWeak.verdict === 'ok', gWeak);
    check('b3 bramka: pasmo -> ok', gBand.verdict === 'ok', gBand);
    const gEarly = evaluatePeaceAiGate({ rw: 0.5, turnsAtWar: 0, lostCitiesInWar: 0, pozycjaMilitarna: 'slabsza' }, PROFILE);
    check('e1 minimalny czas wojny blokuje (too_early) nawet przy słabszej AI', gEarly.verdict === 'too_early', gEarly);

    // (c)-(f) propozycje gracza do AI (evaluateProposal, gracz autorem)
    const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
    const ctx = (pozycja, turns) => ({
      relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60,
      militaryRatio: 1, respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
      responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' },
      proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
      authorOwnerId: 0,
      warState: { turnsAtWar: turns, lostCitiesResponder: 0, responderRw: 0.5, responderPozycjaMilitarna: pozycja },
    });
    const evalP = (actionId, payload, pozycja, turns = 12) => {
      const entry = mod.createNegotiation(
        { actionId, proposerOwnerId: 0, responderOwnerId: 1, payload }, 80, 'player', turns);
      return mod.evaluateProposal(mod.negotiationAsProposal(entry), ctx(pozycja, turns));
    };

    const noCity = evalP('pokoj', {}, 'silniejsza');
    check('c1 silniejsza AI odrzuca pokój bez miasta', noCity.accepted === false, noCity);
    const smallCity = evalP('pokoj', { giveItems: [{ typ: 'miasto', id: 'x', ilosc: 1, cityPn: 1, cityWeight: 1 }] }, 'silniejsza');
    check('c2 miasto o PN < ceny odrzucane', smallCity.accepted === false && /miasta w ofercie warte/.test(smallCity.reason || ''), smallCity);
    const bigCity = evalP('pokoj', { giveItems: [{ typ: 'miasto', id: 'x', ilosc: 1, cityPn: 1e6, cityWeight: 1 }] }, 'silniejsza');
    check('c3 miasto o PN ≥ ceny nie jest odrzucane z powodu miasta', !/miasta w ofercie warte/.test(bigCity.reason || ''), bigCity);
    const gold = evalP('pokoj', { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100000 }] }, 'slabsza');
    check('d1 złoto nie jest słodzikiem (słabsza AI) — odrzucone', gold.accepted === false && /Złoto i surowce/.test(gold.reason || ''), gold);
    const goods = evalP('rozejm', { giveItems: [{ typ: 'surowiec_ilosc', id: 'zelazo', ilosc: 50 }] }, 'silniejsza');
    check('d2 surowce nie są słodzikiem rozejmu — odrzucone', goods.accepted === false && /Złoto i surowce/.test(goods.reason || ''), goods);
    const truceNoCity = evalP('rozejm', {}, 'silniejsza');
    check('f1 rozejm: silniejsza AI odrzuca bez miasta', truceNoCity.accepted === false, truceNoCity);

    // (f2) wymóg 3: słabsza AI proponuje ROZEJM z miastem (komenda rodzaj 'rozejm' → actionId 'rozejm').
    const truceCmd = mod.aiCommandToPendingProposal(
      { type: 'oferuj_miasto_za_pokoj', targetId: '1', powod: 't', cityId: 'c9', cityPn: 900, cityWeight: 1, rodzaj: 'rozejm' }, 0, 1, 80);
    check('f2 słabsza AI: oferuj_miasto_za_pokoj rodzaj rozejm → actionId rozejm, miasto w giveItems',
      truceCmd && truceCmd.actionId === 'rozejm' && truceCmd.payload.turns > 0
      && truceCmd.payload.giveItems.some(i => i.typ === 'miasto' && i.id === 'c9'), truceCmd);
    const peaceCmd = mod.aiCommandToPendingProposal(
      { type: 'oferuj_miasto_za_pokoj', targetId: '1', powod: 't', cityId: 'c9', cityPn: 900, cityWeight: 1 }, 0, 1, 80);
    check('f3 bez rodzaju: oferuj_miasto_za_pokoj = pokój (zachowanie dotychczasowe)', peaceCmd && peaceCmd.actionId === 'pokoj', peaceCmd);

    // (d3) jedno miasto słabszej strony poniżej ceny nie kupuje pokoju (ZAŁOŻENIE Z5/D3: brak nadwyżki PN).
    const oneSmall = evalP('pokoj', { giveItems: [{ typ: 'miasto', id: 'only', ilosc: 1, cityPn: 10, cityWeight: 1 }] }, 'silniejsza');
    check('d3 jedno miasto (PN < ceny) nie kupuje pokoju od silniejszej AI', oneSmall.accepted === false, oneSmall);

    // (g) pasmo (progRozniceSilyPokoj > 0): różnica w paśmie → 'pasmo'; poza pasmem → decyduje siła.
    check('g1 pasmo 20%: 105 vs 100 => pasmo', pos(S('ai', 105), S('p', 100), 20) === 'pasmo');
    check('g2 pasmo 20%: 130 vs 100 => silniejsza (poza pasmem)', pos(S('ai', 130), S('p', 100), 20) === 'silniejsza');
    check('g3 pasmo 20%: 100 vs 130 => slabsza (poza pasmem)', pos(S('ai', 100), S('p', 130), 20) === 'slabsza');

    // (h2) decideAIDiplomacy (ai.ts): zachowanie po stronie AI, nie tylko propozycje gracza.
    // Złoto nie kupuje pokoju (D2): słabsza AI bez miasta nie składa żadnej oferty pokojowej do gracza.
    const aiDecide = (turns, gold, nCities, aiSila, playerSila) => {
      const miasta = Array.from({ length: nCities }, (_, i) => ({ cityId: 'c' + i, cityPn: 800, zakazane: false }));
      return mod.decideAIDiplomacy({
        myPlayerId: '1', agresja: 0.5, currentTurn: 80,
        skarbiecGold: gold, miastaAI: miasta,
        relacje: [{
          partnerId: '0', relation: { zaufanie: 0, respekt: 29, status: 'wojna' }, respektWzgledny: 0.06,
          stanWojny: true, turnsAtWar: turns, lostCitiesInWar: 0, turnsSinceCityChange: turns,
          armyHealthShare: 0.9, peaceLocked: false,
          silaMilitarnaAI: { sila: aiSila, armiaPkt: 0 }, silaMilitarnaPartner: { sila: playerSila, armiaPkt: 0 },
        }],
      }).filter(c => c.targetId === '0');
    };
    const PEACE_CMDS = new Set(['oferuj_miasto_za_pokoj', 'oferuj_trybut_za_pokoj', 'zaproponuj_pokoj']);
    const weakNoCityGold = aiDecide(30, 5000, 1, 100, 200);
    check('h1 D2: słabsza AI, 1 miasto, duże złoto -> brak oferty złota za pokój',
      !weakNoCityGold.some(c => c.type === 'oferuj_trybut_za_pokoj'), weakNoCityGold);
    check('h2 słabsza AI bez miasta do oddania (1 miasto) nie składa propozycji pokoju wobec gracza',
      !weakNoCityGold.some(c => PEACE_CMDS.has(c.type)), weakNoCityGold);
    const weakCityTruce = aiDecide(5, 5000, 6, 100, 200);
    check('h3 słabsza AI z 6 miastami, wojna < 20 tur -> oferuj_miasto_za_pokoj z rodzajem rozejm',
      weakCityTruce.length === 1 && weakCityTruce[0].type === 'oferuj_miasto_za_pokoj' && weakCityTruce[0].rodzaj === 'rozejm', weakCityTruce);
    const weakCityPeace = aiDecide(30, 0, 6, 100, 200);
    check('h4 słabsza AI z 6 miastami, wojna >= 20 tur -> oferuj_miasto_za_pokoj z rodzajem pokój',
      weakCityPeace.length === 1 && weakCityPeace[0].type === 'oferuj_miasto_za_pokoj' && weakCityPeace[0].rodzaj !== 'rozejm', weakCityPeace);
    const strongAi = aiDecide(30, 5000, 6, 200, 100);
    check('h5 silniejsza AI nie składa oferty pokoju/rozejmu ani miasta wobec gracza',
      !strongAi.some(c => PEACE_CMDS.has(c.type)), strongAi);

    console.log('');
    console.log('diplo-peace-weaker-seeks-city-only-test: ' + pass + ' pass / ' + fail + ' fail');
  } finally {
    cleanup();
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
