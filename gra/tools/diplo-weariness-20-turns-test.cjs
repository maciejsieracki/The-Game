'use strict';
/**
 * diplo-weariness-20-turns-test.cjs -- R-WEB-DIPLO-WEARINESS-20-TURNS-Q1 (decyzja wlasciciela 2026-11-13, wariant A).
 *
 * Zmeczenie wojna: jeden licznik (war-weariness-params.json, pelneTur = 40), test sprawdza:
 *   (a) bez strat miast: poziom = 0,5 w turze 20, 0,8 w turze 32, 1,0 w turze 40 (liniowo 2,5% na ture);
 *   (b) kazde miasto, ktore zmienilo wlasciciela (obie strony), dodaje +0,10 (min(1, ...));
 *   (c) brak zastoju: poziom nie zalezy od turnsSinceCityChange; brak drugiego zegara w diplomacy.ts
 *       (warWearinessShare / zmeczenieT nie sa juz zrodlem chec pokoju AI);
 *   (d) parametry JSON: pelneTur = 40, wagaStratMiasta = 0,10, ofertaOdTurWojny = 3, ofertaBezStratOdTur = 6,
 *       progi 0,5 / 0,8 / 1,0 (progChetnosci, progKoncaZmeczenia, pelny poziom);
 *   (e) mutacja: przywrocenie pelneTur 200 czerwieni test (a); przywrocenie stagnacji czerwieni test (c).
 *
 *   node tools/diplo-weariness-20-turns-test.cjs        # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const WW = path.join(SRC, 'game', 'war-weariness.ts');
const DIPLO = path.join(SRC, 'game', 'diplomacy.ts');
const PARAMS = path.join(GRA_ROOT, 'data', 'war-weariness-params.json');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.w20-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.w20-${TAG}-bundle.cjs`);

const ORIG = fs.readFileSync(WW, 'utf8');
const PJ = JSON.parse(fs.readFileSync(PARAMS, 'utf8'));
const DIPLO_SRC = fs.readFileSync(DIPLO, 'utf8');

let fails = 0;
let passes = 0;
function check(name, ok) {
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
}

/** Buduje modul war-weariness z podana trescia zrodla (mutanty). Zwraca eksporty. */
function loadW(src) {
  const MUT = path.join(path.dirname(WW), `.w20-mut-${TAG}.ts`);
  fs.writeFileSync(MUT, src);
  try {
    fs.writeFileSync(ENTRY, `export * as W from ${JSON.stringify(MUT)};\n`);
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE,
      logLevel: 'silent', loader: { '.json': 'json' },
    });
  } finally {
    try { fs.unlinkSync(MUT); } catch (_) { /* ignore */ }
  }
  delete require.cache[BUNDLE];
  return require(BUNDLE).W;
}

const near = (a, b) => Math.abs(a - b) < 1e-9;

/** Zestaw sprawdzen. Zwraca tablice [name, ok]. */
function behaviour(W) {
  const out = [];
  const lvl = (turnsAtWar, lostCitiesTotal = 0, turnsSinceCityChange) =>
    W.warWearinessLevel({ turnsAtWar, lostCitiesTotal, turnsSinceCityChange });
  // (a) krzywa bez strat
  out.push(['a: 20 tur bez strat = 0,5', near(lvl(20), 0.5)]);
  out.push(['a: 32 tur bez strat = 0,8', near(lvl(32), 0.8)]);
  out.push(['a: 40 tur bez strat = 1,0', near(lvl(40), 1)]);
  out.push(['a: 2,5% na ture (tura 1 = 0,025)', near(lvl(1), 0.025)]);
  out.push(['a: po 40 turach poziom nie przekracza 1 (min(1, ...))', near(lvl(70), 1)]);
  // (b) +0,10 za zmienione miasto
  out.push(['b: 1 zmienione miasto (20 tur) = 0,6', near(lvl(20, 1), 0.6)]);
  out.push(['b: 3 zmienione miasta (20 tur) = 0,8', near(lvl(20, 3), 0.8)]);
  out.push(['b: 0 tur + 2 miasta = 0,2', near(lvl(0, 2), 0.2)]);
  out.push(['b: miasta obu stron sumuja sie (lostCitiesTotal)', near(lvl(4, 2), 0.1 + 0.2)]);
  // (c) brak zastoju i brak drugiego zegara
  out.push(['c: poziom niezalezny od turnsSinceCityChange (brak zastoju)',
    near(lvl(8, 0, 120), lvl(8, 0, 0)) && near(lvl(8, 0, 120), 0.2)]);
  out.push(['c: zapas pola wagi zastoju nie wplywa (8 tur, 0 miast)', near(lvl(8, 0, 1), 0.2)]);
  // (d) progi z JSON
  out.push(['d: pelneTur = 40 w JSON (DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1)', PJ.zmeczenie.pelneTur === 40]);
  out.push(['d: wagaStratMiasta = 0,1 w JSON', near(PJ.zmeczenie.wagaStratMiasta, 0.1)]);
  out.push(['d: progChetnosci = 0,5 w JSON', near(PJ.zmeczenie.progChetnosci, 0.5)]);
  out.push(['d: progKoncaZmeczenia = 0,8 w JSON', near(PJ.zmeczenie.progKoncaZmeczenia, 0.8)]);
  out.push(['d: ofertaOdTurWojny = 3 w JSON', PJ.przegrywajacy.ofertaOdTurWojny === 3]);
  out.push(['d: ofertaBezStratOdTur = 6 w JSON', PJ.przegrywajacy.ofertaBezStratOdTur === 6]);
  out.push(['d: brak kluczy zastoju w JSON',
    PJ.zmeczenie.stagnacjaWaga === undefined && PJ.zmeczenie.stagnacjaOdTur === undefined
    && PJ.zmeczenie.stagnacjaSkalaTur === undefined]);
  out.push(['d: progi 0,5 / 0,8 / 1,0 osiagane w turach 20 / 32 / 40; wymuszenie od 1,0',
    lvl(20) >= W.WAR_WEARINESS_PARAMS.zmeczenie.progChetnosci
    && lvl(32) >= W.WAR_WEARINESS_PARAMS.zmeczenie.progKoncaZmeczenia
    && lvl(40) >= 1 && lvl(31) < W.WAR_WEARINESS_PARAMS.zmeczenie.progKoncaZmeczenia
    && W.WAR_WEARINESS_PARAMS.zmeczenie.progWymuszonyPokoj === 1
    && W.wearinessForcedPeaceDue(lvl(40)) && !W.wearinessForcedPeaceDue(lvl(32))]);
  return out;
}

try {
  // (c, zrodlo) brak drugiego zegara: diplomacy.ts nie czyta warWearinessShare / zmeczenieT do chec pokoju AI
  const peaceBlock = DIPLO_SRC.slice(DIPLO_SRC.indexOf('// -- Peace willingness --'), DIPLO_SRC.indexOf('// -- Trade willingness --'));
  check('c-zrodlo: diplomacy.ts (chec pokoju) nie uzywa warWearinessShare', !/warWearinessShare/.test(peaceBlock));
  check('c-zrodlo: diplomacy.ts (chec pokoju) nie uzywa zmeczenieT', !/zmeczenieT/.test(peaceBlock));
  check('c-zrodlo: diplomacy.ts (chec pokoju) czyta warWearinessLevel', /warWearinessLevel\(/.test(peaceBlock));

  // (f) wiazanie zrodel: ai.ts przekazuje lostCitiesTotal do AIDiplomacyContext i uzywa jednego licznika;
  //     profil (aiPeaceSignals, sygnal e) czyta warWearinessLevel, nie drugiego zegara.
  const AI_SRC = fs.readFileSync(path.join(SRC, 'game', 'ai.ts'), 'utf8');
  const PROFILE_SRC = fs.readFileSync(path.join(SRC, 'game', 'diplomacy-war-peace-profile.ts'), 'utf8');
  const aiCtx = (AI_SRC.match(/const ctx: AIDiplomacyContext = \{[\s\S]*?\n    \};/) || [''])[0];
  check('f1-ai.ts: ctx AIDiplomacyContext zawiera lostCitiesTotal (utracone miasta obu stron)', /lostCitiesTotal:/.test(aiCtx));
  check('f2-ai.ts: fatigueFraction (wybor rozejm/pokoj) czyta jeden licznik wearyLevel, nie warWearinessFraction',
    /fatigueFraction:\s*wearyLevel\b/.test(AI_SRC) && !/warWearinessFraction/.test(AI_SRC));
  const sygnaly = (PROFILE_SRC.match(/export function aiPeaceSignals[\s\S]*?\n}\n/) || [''])[0];
  check('f3-profil: sygnal (e) aiPeaceSignals liczy warWearinessLevel, nie warWearinessFraction/zmeczenieT',
    /warWearinessLevel\(/.test(sygnaly) && !/warWearinessFraction|zmeczenieT/.test(sygnaly));

  const W = loadW(ORIG);
  for (const [name, ok] of behaviour(W)) check(name, ok);

  // (g) AI<->AI bez strat miast: 80% (tura 32) NIE wymusza pokoju; 100% (tura 40) = pokoj WYMUSZONY (forced_peace).
  //     Przed 10. turą wojny tick nie wykonuje żadnej akcji (PEACE_PROPOSAL_MIN_WAR_TURNS).
  {
    const store = new Map();
    let firstPeace = -1;
    let anyEarly = false;
    let at32 = 'none';
    for (let t = 1; t <= 44; t++) {
      const deps = {
        store, turn: 400 + t, pairs: [{ a: 1, b: 2 }],
        pairKey: (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`,
        warInfo: () => ({ warStart: 400, turnsAtWar: t, lostA: 0, lostB: 0, turnsSinceCityChange: t }),
        shareOf: () => 0.5,
        weakerOf: () => 2,
        cityCountOf: () => 6,
        price: () => ({ requiredPn: 500, balanceFor: (c) => c, tolerancePn: 20 }),
        assets: () => [],
        cityCessionOk: () => true,
        battlePending: false,
        pay: () => {},
        finalize: () => {},
      };
      const out = W.runWarWearinessTick(deps)[0];
      if (t === 32) at32 = out.action;
      if (out.action === 'forced_peace' && firstPeace < 0) firstPeace = t;
      if (t < 10 && out.action !== 'none') anyEarly = true;
    }
    check('g1: AI<->AI bez strat: pokoj wymuszony (forced_peace) w turze 40 (100%)', firstPeace === 40);
    check('g3: AI<->AI bez strat: przy 80% (tura 32) nie ma pokoju wymuszonego', at32 !== 'forced_peace');
    check('g2: AI<->AI bez strat: przed 10. tura wojny zadna akcja tickera', !anyEarly);
  }

  // (e) mutanty: kazdy musi czerwienic test
  const mutants = [
    { id: 'M1-pelne-200', from: 'pelneTur: number; wagaStratMiasta', src: ORIG, to: null,
      json: { ...PJ, zmeczenie: { ...PJ.zmeczenie, pelneTur: 200 } } },
    { id: 'M2-stagnacja', from: 'return clamp(turns / Z.pelneTur + Z.wagaStratMiasta * Math.max(0, inp.lostCitiesTotal), 0, 1);',
      to: 'const since = inp.turnsSinceCityChange ?? turns; const stagn = 0.3 * clamp((since - 30) / 100, 0, 1); return clamp(turns / Z.pelneTur + Z.wagaStratMiasta * Math.max(0, inp.lostCitiesTotal) + stagn, 0, 1);' },
    { id: 'M3-waga-miasta-003', from: '', src: ORIG, to: null, json: { ...PJ, zmeczenie: { ...PJ.zmeczenie, wagaStratMiasta: 0.03 } } },
  ];
  for (const m of mutants) {
    let ok = false;
    try {
      let W2;
      if (m.to !== null) {
        const src = ORIG.replace(m.from.length ? 'return clamp(turns / Z.pelneTur + Z.wagaStratMiasta * Math.max(0, inp.lostCitiesTotal), 0, 1);' : m.from, m.to);
        W2 = loadW(src);
      } else {
        // mutacja parametrow: podmiana JSON w module przez zapis tymczasowy i ponowna budowe
        const pj = path.join(GRA_ROOT, 'data', 'war-weariness-params.json');
        const orig = fs.readFileSync(pj, 'utf8');
        try {
          fs.writeFileSync(pj, JSON.stringify(m.json, null, 2));
          W2 = loadW(ORIG);
        } finally {
          fs.writeFileSync(pj, orig);
        }
      }
      const res = behaviour(W2);
      ok = res.some(([, pass]) => !pass);
    } catch (e) {
      ok = true; // mutant zlamal build/wykonanie = wykryty
    }
    check(`mutant ${m.id} wykryty przez test`, ok);
  }
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
}

console.log(`diplo-weariness-20-turns-test: PASS=${passes} FAIL=${fails}`);
process.exit(fails === 0 ? 0 : 1);
