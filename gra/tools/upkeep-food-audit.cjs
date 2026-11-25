'use strict';
/**
 * upkeep-food-audit.cjs -- R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1: pomiar zywnosci zuzywanej przez jednostki gracza
 * w zywej grze (Chromium, realne moduly gry przez bundle poza repo) i porownanie z wzorem z kodu.
 *
 * Tryby (kazdy krok osobne wywolanie, zeby zmiescic sie w limicie Bash):
 *   node tools/upkeep-food-audit.cjs build   <katalog-poza-repo>            -> bundle Gra-LIVE.html (esbuild)
 *   node tools/upkeep-food-audit.cjs run     <katalog-poza-repo> <base|army> <niski|normalny|wysoki> <katalog-wyjscia>
 *   node tools/upkeep-food-audit.cjs analyze <katalog-wyjscia>              -> tabela PRZED(wzor)/PO(pomiar)
 *
 * Schemat pomiaru (ta sama gra: seed 4242, Normalny, reszta domyslna; jedyny zmienny parametr = tempo
 * „Koszty jednostek”, ktore wg kodu wplywa na zywnosc jednostek i na nic z pozostalych skladnikow zywnosci gracza):
 *   - warunek `base`: start gry bez dodatkowych jednostek (jednostki startowe gry);
 *   - warunek `army`: jak `base` + 9 jednostek gracza dosadzonych w miescie stolicy (4x Wojownik/Kamien,
 *     3x Procarz/Braz, 2x Konnica/Zelazo) przez hak civTest.addUnit;
 *   - w kazdym biegu: setPlayerGranary(500), potem 3 zakonczenia tury; odczyt zapasu zywnosci panstwa
 *     gracza PRZED i PO kazdej turze (hak grantPlayerFood(1e-9) zwraca zapas z dopisem 1e-9, odejmowany).
 * Z roznic zapasu miedzy tempami wyznaczany jest zuzycie zywnosci przez jednostki na turze:
 *   U1 = (delta_niski - delta_normalny)  oraz  U1 = (delta_niski - delta_wysoki)/3   (C(p) = C0 + U1*p).
 * Roznica warunkow army - base daje zuzycie tylko przez dodane jednostki.
 * Gra NIE jest modyfikowana: wylacznie odczyt haków civTest/__nnsMeasureDebug/__settingsLive.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const GRA = path.resolve(__dirname, '..');
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const SEED = 4242;
const TURNS = 3;
const GRANARY_START = 950; // zapas ustawiany przed KAZDA tura (cap centralny zywnosci ~1000 w normal)
const PACES = { niski: 'niski', normalny: 'normalny', wysoki: 'wysoki' };
const ARMY = [
  ['Wojownik', 4], ['Procarz', 3], ['Konnica', 2],
];
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

/** Bundle (esbuild) i zrzuty biegow maja lezec POZA katalogiem gra/ (wyjatek C-001 dla vite/build). */
function assertOutside(dir) {
  const abs = path.resolve(dir);
  if (abs === GRA || abs.startsWith(GRA + path.sep)) throw new Error('katalog musi byc poza gra/: ' + abs);
  return abs;
}

const LIVE_PARAMS = (pace) => ({
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Normalny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: pace, wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
    landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
  },
  villageRewardsEnabled: true,
});

function cmdBuild(outDir) {
  const out = assertOutside(outDir);
  fs.mkdirSync(out, { recursive: true });
  execFileSync('node', [LIVE_TOOL, out], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const html = path.join(out, 'Gra-LIVE.html');
  console.log(JSON.stringify({ bundle: html, bytes: fs.statSync(html).size }));
}

async function cmdRun(bundleDir, cond, paceKey, resultDir) {
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const { closeCivWelcome } = require(path.join(GRA, 'tools', '_live-ready.cjs'));
  const html = path.join(assertOutside(bundleDir), 'Gra-LIVE.html');
  if (!fs.existsSync(html)) throw new Error('brak bundla: ' + html + ' (najpierw build)');
  const pace = PACES[paceKey];
  if (!pace) throw new Error('zle tempo: ' + paceKey);
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errors = [];
  const result = { cond, pace, seed: SEED, turns: [], units: null, unitCosts: {}, errors };
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(String(e && e.message || e)));
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive && !!window.__civTest && !!window.__nnsMeasureDebug && !!window.__aiTradeWiringTestDebug, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), LIVE_PARAMS(pace));
    // Start gry: mapa gotowa -> gracz zaklada pierwsze miasto (hak NNS foundFirstCity = ta sama sciezka co klik).
    await page.waitForFunction(() => {
      try {
        const s = window.__civTest.state();
        return s.cities.some(c => c.ownerId === s.me) || window.__nnsMeasureDebug.awaitingFirstCity();
      } catch (e) { return false; }
    }, null, { timeout: 240000 });
    await closeCivWelcome(page);
    const awaiting = await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity());
    if (awaiting) {
      const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
      if (!founded) throw new Error('foundFirstCity nie zalozyl miasta');
    }
    await page.waitForFunction(() => {
      try { const s = window.__civTest.state(); return s.cities.some(c => c.ownerId === s.me); } catch (e) { return false; }
    }, null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    const st0 = await page.evaluate(() => window.__civTest.state());
    const me = st0.me;
    const mine = st0.cities.find(c => c.ownerId === me);
    if (!mine) throw new Error('brak miasta gracza po starcie');
    result.me = me;
    result.myCity = { q: mine.q, r: mine.r };
    result.startTurn = st0.turn;
    if (cond === 'army') {
      const placed = [];
      for (const [typeId, n] of ARMY) {
        for (let i = 0; i < n; i += 1) {
          const id = await page.evaluate(({ me, q, r, typeId }) => {
            for (const [dq, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2], [0, -2], [2, -1], [-2, 1], [1, 1], [-1, -1]]) {
              const got = window.__civTest.addUnit(me, q + dq, r + dr, false, typeId);
              if (got) return got;
            }
            return null;
          }, { me, q: mine.q, r: mine.r, typeId });
          placed.push({ typeId, id });
        }
      }
      result.placed = placed;
      if (placed.some(p => !p.id)) throw new Error('addUnit odmowil: ' + JSON.stringify(placed.filter(p => !p.id)));
    }
    await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerGold(2000));
    result.unitCosts = await page.evaluate((me) => {
      const out = {};
      for (const name of ['Wojownik', 'Procarz', 'Konnica', 'Zwiadowca']) out[name] = window.__settingsLive.unitCosts(name, me);
      return out;
    }, me);
    for (let t = 1; t <= TURNS; t += 1) {
      const turnBefore = await page.evaluate(() => window.__civTest.state().turn);
      // Zapas resetowany do GRANARY_START przed kazda tura (ustawienie wprost, bez dopisywania): delta tury = netto
      // (produkcja - zuzycie) wzgledem tego samego punktu startu we wszystkich biegach.
      await page.evaluate((v) => window.__nnsMeasureDebug.setPlayerGranary(v), GRANARY_START);
      const gBefore = await readFoodFor(page);
      // Bramka NNS blokowala koniec tury 1 przez ZLOTO (skarbiec 0, po turze -6), nie przez zywnosc: dosypujemy
      // zlota (grantPlayerGold, bez wplywu na zapas zywnosci) jak test rozejmu; gdy blokuje dalej -> blad z diagnoza.
      const blocked0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
      if (blocked0) await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerGold(2000));
      const blocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
      if (blocked) {
        const diag = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsDiag());
        throw new Error('bramka NNS blokuje koniec tury ' + t + ': ' + JSON.stringify(diag).slice(0, 900));
      }
      await page.evaluate(() => window.__eraTestDebug.endTurn());
      try {
        await page.waitForFunction((tb) => {
          const s = window.__civTest.state();
          return s.turn > tb && !window.__eraTestDebug.isEndTurnInProgress();
        }, turnBefore, { timeout: 300000 });
      } catch (e) {
        const dump = await page.evaluate(() => ({
          turn: window.__civTest.state().turn,
          inProgress: window.__eraTestDebug.isEndTurnInProgress(),
          gate: window.__aiTradeWiringTestDebug.nnsGateBlocked(),
          diag: window.__aiTradeWiringTestDebug.nnsDiag(),
          battle: window.__aiTradeWiringTestDebug.battleState ? window.__aiTradeWiringTestDebug.battleState() : null,
        }));
        throw new Error('tura ' + t + ' nie zakonczona: ' + JSON.stringify(dump));
      }
      await page.waitForTimeout(300);
      const turnAfter = await page.evaluate(() => window.__civTest.state().turn);
      const gAfter = await readFoodFor(page);
      result.turns.push({ n: t, turnBefore, turnAfter, gBefore, gAfter, delta: gAfter - gBefore, gateBlockedBefore: blocked });
    }
    result.units = await page.evaluate((me) => {
      const snap = window.__nnsMeasureDebug.snapshot();
      return { turn: snap.turn, unitsAiOnly: snap.owners.map(o => ({ oid: o.oid, units: o.units })) };
    }, me);
    await context.close();
  } finally {
    await browser.close();
  }
  fs.mkdirSync(resultDir, { recursive: true });
  const file = path.join(resultDir, `${cond}-${paceKey}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ file, turns: result.turns.map(t => [t.n, t.gBefore, t.gAfter, t.delta, t.gateBlockedBefore]), errors: errors.length }));
}

/** Odczyt zapasu zywnosci panstwa gracza bez zmiany stanu gry: grantPlayerFood(1e-9) zwraca wartosc z dopisem 1e-9. */
async function readFoodFor(page) {
  const v = await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerFood(1e-9));
  if (v === -1) throw new Error('brak stanu zapasu gracza (grantPlayerFood zwrocil ' + v + ')');
  return v - 1e-9;
}

function cmdAnalyze(resultDir) {
  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
  const ord = { 'Kamień': 1, 'Brąz': 2, 'Żelazo': 3 };
  const byName = new Map(units.map(u => [u.Jednostka, u]));
  // Wzor z kodu (economy-upkeep.ts unitFoodPerTurn): baza = f * 4^(epoka-1) (flaga rebalansu ON, jednostkiZywnoscMnoznikNaEpoke=4)
  // * R_STAWKI 4 (FALA1xFALA2) * tempo (niski 1 / normalny 2 / wysoki 4); teren wlasny x1; poza obozem; Spichlerz Sol x1.
  const predU1ForArmy = ARMY.reduce((acc, [name, n]) => {
    const u = byName.get(name);
    const f = Number(u['żywność/turę']);
    const e = ord[u.Epoka];
    return acc + n * f * Math.pow(4, e - 1) * 4;
  }, 0);
  const load = (cond, p) => {
    const f = path.join(resultDir, `${cond}-${p}.json`);
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  };
  const avg = (r) => r.turns.map(t => t.delta);
  const out = { predU1ForArmyPerTurn: predU1ForArmy, cond: {} };
  for (const cond of ['base', 'army']) {
    const n = load(cond, 'niski'), m = load(cond, 'normalny'), w = load(cond, 'wysoki');
    const dN = avg(n), dM = avg(m), dW = avg(w);
    const rows = dN.map((d, i) => ({
      turn: i + 1,
      U1_fromNormalny: d - dM[i],
      U1_fromWysoki: (d - dW[i]) / 3,
      deltaNiski: d, deltaNormalny: dM[i], deltaWysoki: dW[i],
    }));
    const mean = (k) => rows.reduce((s, r) => s + r[k], 0) / rows.length;
    out.cond[cond] = {
      rows,
      meanU1FromNormalny: mean('U1_fromNormalny'),
      meanU1FromWysoki: mean('U1_fromWysoki'),
      unitCosts: { niski: n.unitCosts, normalny: m.unitCosts, wysoki: w.unitCosts },
      gateBlocked: [n, m, w].map(r => r.turns.map(t => t.gateBlockedBefore)),
      errors: [n, m, w].map(r => r.errors.length),
    };
  }
  const armyMinusBase = {
    U1_fromNormalny: out.cond.army.meanU1FromNormalny - out.cond.base.meanU1FromNormalny,
    U1_fromWysoki: out.cond.army.meanU1FromWysoki - out.cond.base.meanU1FromWysoki,
  };
  out.armyMinusBasePerTurnAtPaceX1 = armyMinusBase;
  out.ratioMeasuredToPredicted = {
    fromNormalny: armyMinusBase.U1_fromNormalny / predU1ForArmy,
    fromWysoki: armyMinusBase.U1_fromWysoki / predU1ForArmy,
  };
  console.log(JSON.stringify(out, null, 2));
}

(async () => {
  const [cmd, a, b, c, d] = process.argv.slice(2);
  if (cmd === 'build') return cmdBuild(a);
  if (cmd === 'run') return cmdRun(a, b, c, d);
  if (cmd === 'analyze') return cmdAnalyze(a);
  console.error('uzycie: build <dir> | run <bundleDir> <base|army> <niski|normalny|wysoki> <outDir> | analyze <outDir>');
  process.exit(2);
})().catch(e => { console.error('BLAD:', e && e.stack || e); process.exit(1); });
