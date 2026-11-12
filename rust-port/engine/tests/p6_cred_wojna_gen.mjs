// P6-CRED-WOJNA-Q1 (r2): generator wektorow haka wojny P4 z WEBA (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75).
// Wykonuje TEKST pinu `chargeWarDeclarationCredibility` (main.ts ~12176-12225) wraz z guardem `isBarbarian`
// i jego domknieciem (getDiploPairMeta/setDiploPairMeta, isCredibilityRetaliation, isAllianceDealKind, dealInvolvesOwners,
// pairOwnerIds, clearTruceEndOffer) oraz P4 (`tickWiarygodnoscBezWojnyMilestone`, `appendWiarygodnoscEvent`).
// Modulu pinu (esbuild) sa bundlowane i WYKONYWANE: diplomacy-credibility, diplomacy-treaties (hasTreaty, normalizeTreatyKind),
// diplomacy-peace-lock (isTruceWindowBreach, clearTruceEndOfferCore), diplomacy-pn-engine (diploPairKey, freshDiploPairMeta),
// barbarians (isBarbarian), types/diplomacy (RodzajTraktatu), diplomacy (parametry, difficulty=normal).
//
// Uzycie: node p6_cred_wojna_gen.mjs <esbuild> <pinDir (zawiera gra/src, gra/data)> <workDir POZA REPO> <outDir>
//   pinDir: git archive 07d2fbd72... gra/src gra/data -o pin.tar && tar -x -f pin.tar -C <pinDir>
//
// Stan domkniecia (wstrzykiwany, nie z gry): activeDeals = [] (brak traktatow => brak galezi N2/sojuszu/odwetu, wiec
// wektory obejmuja WYLACZNIE skutek haka na licznik P4 i odczyt P4 w kolejnych turach); brak ofert rozejmu (truceEndOffer).
// Poza zakresem wektorow (NIE_ZMIERZONO w raporcie): zdarzenia N2 (zlamanie NAP/sojuszu), N1 (rozejm), ich zwracany truceBreach.
//
// STRAZNIK: SHA-256 plikow pinu (ponizej) i SHA-256 wyciętego tekstu funkcji (`codeSha256`) musza sie zgadzac.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , esbuild, pinDir, workDir, outDir] = process.argv;
if (!esbuild || !pinDir || !workDir || !outDir) {
  console.error('uzycie: node p6_cred_wojna_gen.mjs <esbuild> <pinDir> <workDir> <outDir>');
  process.exit(2);
}
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const SHA = {
  'gra/src/main.ts': 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19',
  'gra/src/game/diplomacy-credibility.ts': 'd9c15d7c69f368c9619755f31e7b9df01d0d9c36b493000c794234dcef36061c',
  'gra/src/game/diplomacy-treaties.ts': '9b8e3bd81b65de1bb009a86058d1afa59a48c096b6ed6e91be71606af6cde6cb',
  'gra/src/game/diplomacy-peace-lock.ts': 'ab8e6b08b0baab9ed1ee073cd66929c53494ec61214f797238b76d13ffef4771',
  'gra/src/game/diplomacy-pn-engine.ts': 'ee1b1aabffd4fdf906ce260084f80ad5da055c64912b6eda86306ba261d89257',
  'gra/src/game/barbarians.ts': 'b5a38a1c13e9ce0541974de0444e4bbff33b16d6c0a0bad2277fe6ed337efe8a',
  'gra/src/types/diplomacy.ts': '1a963e56488b547261da9ffca0712c71875a54dd2024388ce6580e6c63290b6b',
  'gra/src/game/diplomacy.ts': 'cdf34ef8e5b67b0454874eebb08edec7a6c2c2510fa97c92d1388b7ea0f88216',
  'gra/data/diplomacy.json': '836098deb6aedd5c0230c47cd6c5da5691f5b7e6891bb6ceda02b94f2b21eb6e',
};
// SHA-256 wyciętego tekstu funkcji pinu (kolejność: CHARGE_FNS, potem P4_FNS, łączone znakiem \n).
const CODE_SHA = '87ff18365edcfef806e92b30d6ce9b781f4894a3c0a3fbc03bdc64db9569c464';

for (const [rel, want] of Object.entries(SHA)) {
  const got = createHash('sha256').update(readFileSync(join(pinDir, rel))).digest('hex');
  if (got !== want) {
    console.error(`STRAZNIK SHA-256: ${rel}: ${got} != ${want}`);
    process.exit(3);
  }
}
mkdirSync(workDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

// ---- bundle modulow pinu ----
const g = (f) => join(pinDir, 'gra/src/game', f).replaceAll('\\', '/');
const src = (f) => join(pinDir, 'gra/src', f).replaceAll('\\', '/');
const entry = join(workDir, 'entry-cred-wojna.ts');
writeFileSync(
  entry,
  `export * from '${g('diplomacy-credibility.ts')}';\n` +
    `export { expireTreaties, normalizeTreatyKind, hasTreaty } from '${g('diplomacy-treaties.ts')}';\n` +
    `export { isTruceWindowBreach, clearTruceEndOfferCore } from '${g('diplomacy-peace-lock.ts')}';\n` +
    `export { diploPairKey, freshDiploPairMeta } from '${g('diplomacy-pn-engine.ts')}';\n` +
    `export { isBarbarian, BARBARIAN_OWNER_ID } from '${g('barbarians.ts')}';\n` +
    `export { RodzajTraktatu } from '${src('types/diplomacy.ts')}';\n` +
    `export { getBaseDiplomacyParams, getEffectiveDiplomacyParams } from '${g('diplomacy.ts')}';\n`,
);
const bundled = join(workDir, 'entry-cred-wojna.mjs');
execFileSync(esbuild, [entry, '--bundle', '--format=esm', `--outfile=${bundled}`], { stdio: 'inherit' });
const W = await import(pathToFileURL(bundled).href);

// ---- wyciecie tekstu funkcji z main.ts ----
const mainLines = readFileSync(src('main.ts'), 'utf8').split('\n');
function extractFn(name) {
  const start = mainLines.findIndex((l) => l.startsWith(`    function ${name}(`));
  if (start < 0) throw new Error(`brak funkcji ${name} w main.ts`);
  let end = start;
  while (mainLines[end] !== '    }') end += 1;
  return mainLines.slice(start, end + 1).join('\n');
}
const CHARGE_FNS = [
  'getDiploPairMeta',
  'setDiploPairMeta',
  'isCredibilityRetaliation',
  'credibilityEventOpensOdwet',
  'isAllianceDealKind',
  'dealInvolvesOwners',
  'pairOwnerIds',
  'chargeWarDeclarationCredibility',
];
const P4_FNS = ['getWiarygodnoscEvents', 'appendWiarygodnoscEvent', 'tickWiarygodnoscBezWojnyMilestone'];
const chargeTexts = CHARGE_FNS.map(extractFn);
const p4Texts = P4_FNS.map(extractFn);
const codeSha = createHash('sha256').update([...chargeTexts, ...p4Texts].join('\n')).digest('hex');
if (CODE_SHA !== 'CODE_SHA_PLACEHOLDER' && codeSha !== CODE_SHA) {
  console.error(`STRAZNIK SHA-256 kodu: ${codeSha} != ${CODE_SHA}`);
  process.exit(4);
}

const factorySrc = `
export function make(S) {
  const { wiarygodnoscZdarzeniaByOwner, wiarygodnoscOstatniaWojnaTuraByOwner, wiarygodnoscP4MilestonesByOwner,
    appendCredibilityEvent, isBarbarian, isTruceWindowBreach, hasTreaty, normalizeTreatyKind, RodzajTraktatu,
    diploPairKey, freshDiploPairMeta, clearTruceEndOfferCore, _diplomacyParams } = S;
  let turn = S.turn;
  let activeDeals = S.activeDeals;
  const diplomacyPairMeta = new Map();
  // Porty rozejmu: w wektorach nigdy nie ma oferty (truceEndOffer), wiec removeOffer jest nieosiagalne (rzuca, gdyby bylo).
  const TRUCE_PORTS = {
    getMeta: (a, b) => getDiploPairMeta(a, b),
    setMeta: (a, b, m) => setDiploPairMeta(a, b, m),
    removeOffer: () => { throw new Error('removeOffer: wektory nie tworza ofert rozejmu'); },
  };
  const clearTruceEndOffer = (a, b) => clearTruceEndOfferCore(TRUCE_PORTS, a, b);
${[...chargeTexts, ...p4Texts].join('\n')}
  return {
    chargeWarDeclarationCredibility,
    tickWiarygodnoscBezWojnyMilestone,
    setTurn: (t) => { turn = t; },
    setDeals: (d) => { activeDeals = d; },
  };
}
`;
const tsFile = join(workDir, 'factory-cred-wojna.ts');
writeFileSync(tsFile, factorySrc);
const factoryJs = execFileSync(esbuild, [tsFile, '--format=esm', '--loader:.ts=ts'], { encoding: 'utf8' });
const factoryPath = join(workDir, 'factory-cred-wojna.mjs');
writeFileSync(factoryPath, factoryJs);
const F = await import(pathToFileURL(factoryPath).href);

// ---- PRNG (mulberry32) ----
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

const DIFFICULTY = 'normal';
const PARAMS = W.getEffectiveDiplomacyParams(DIFFICULTY);
const OWNERS = [0, 1, 2, 3, 4];
const CASES = 200;

const cases = [];
let totalSteps = 0;
let totalPairs = 0;
let barbarianPairs = 0;
let warWrites = 0;
let p4Milestones = 0;
let maxPairsInTurn = 0;
for (let c = 0; c < CASES; c += 1) {
  const r = rng(7000 + c);
  const lastWar = new Map();
  const p4 = new Map();
  const ev = new Map();
  const S = {
    wiarygodnoscZdarzeniaByOwner: ev,
    wiarygodnoscOstatniaWojnaTuraByOwner: lastWar,
    wiarygodnoscP4MilestonesByOwner: p4,
    appendCredibilityEvent: W.appendCredibilityEvent,
    isBarbarian: W.isBarbarian,
    isTruceWindowBreach: W.isTruceWindowBreach,
    hasTreaty: W.hasTreaty,
    normalizeTreatyKind: W.normalizeTreatyKind,
    RodzajTraktatu: W.RodzajTraktatu,
    diploPairKey: W.diploPairKey,
    freshDiploPairMeta: W.freshDiploPairMeta,
    clearTruceEndOfferCore: W.clearTruceEndOfferCore,
    _diplomacyParams: () => PARAMS,
    turn: 0,
    activeDeals: [],
  };
  const M = F.make(S);
  let turn = 1 + Math.floor(r() * 20);
  const nSteps = 3 + Math.floor(r() * 6);
  const steps = [];
  for (let s = 0; s < nSteps; s += 1) {
    if (s > 0) turn += 1 + Math.floor(r() * 45);
    M.setTurn(turn);
    // D4 (runDiplomacyTurnTick): P4 tick wszystkich ownerow PRZED hamulcem wojny tej tury (pin ~24273 vs 41931).
    for (const o of OWNERS) M.tickWiarygodnoscBezWojnyMilestone(o);
    // Hamulec / deklaracje: 0-3 wywolania chargeWarDeclarationCredibility w turze (gracz, AI, barbarzynca).
    const k = Math.floor(r() * 4);
    const pairs = [];
    for (let i = 0; i < k; i += 1) {
      const a = r() < 0.08 ? -1 : pick(r, OWNERS);
      const b = r() < 0.08 ? -1 : pick(r, OWNERS);
      if (a === b) continue;
      pairs.push([a, b]);
      if (a === -1 || b === -1) barbarianPairs += 1;
      M.chargeWarDeclarationCredibility(a, b);
    }
    totalPairs += pairs.length;
    maxPairsInTurn = Math.max(maxPairsInTurn, pairs.length);
    steps.push({
      turn,
      pairs,
      after: {
        lastWar: OWNERS.map((o) => [o, lastWar.has(o) ? lastWar.get(o) : null]),
        p4: OWNERS.map((o) => [o, p4.get(o) ?? 0]),
        p4Events: OWNERS.map((o) => [
          o,
          (ev.get(o) ?? [])
            .filter((e) => e.typ === 'wieloletni_pokoj')
            .map((e) => [e.turaWystapienia, e.wartoscPierwotna]),
        ]),
      },
    });
    totalSteps += 1;
  }
  for (const st of steps) warWrites += st.pairs.length;
  // p4Events jest kumulatywne w obrębie sprawy: liczymy stan po ostatnim kroku.
  p4Milestones += steps[steps.length - 1].after.p4Events.reduce((n, [, list]) => n + list.length, 0);
  cases.push({ name: `wojna-${c}`, steps });
}

const out = {
  pin: PIN,
  sha256: SHA,
  codeSha256: codeSha,
  difficulty: DIFFICULTY,
  owners: OWNERS,
  params: {
    wiarygodnoscP4OknoBezWojnyTur: PARAMS.wiarygodnoscP4OknoBezWojnyTur,
    wiarygodnoscP4BezWojny30Tur: PARAMS.wiarygodnoscP4BezWojny30Tur,
  },
  cases,
};
for (const v of [PARAMS.wiarygodnoscP4OknoBezWojnyTur, PARAMS.wiarygodnoscP4BezWojny30Tur]) {
  if (!Number.isInteger(v)) throw new Error('parametr P4 niecałkowity: ' + v);
}
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(out) + '\n');
console.log(
  `OK cases=${cases.length} steps=${totalSteps} pairs=${totalPairs} barbarianPairs=${barbarianPairs} ` +
    `maxPairsInTurn=${maxPairsInTurn} warWrites=${warWrites} p4EventsRecorded=${p4Milestones} codeSha256=${codeSha}`,
);
