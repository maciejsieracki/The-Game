// R-RUSTPORT-P6-W6S-COOLDOWN-Q1: generator wektorow dla testu `p6_w6s_cooldown`.
//
// Uruchamia web `diplomacy-rejection-cooldown.ts` z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75
// (Node 22 `module.stripTypeScriptTypes`, bez esbuild i bez instalacji w repo) na stalej sekwencji
// operacji i zapisuje wynik do `p6_w6s_cooldown_vectors/cooldown-vectors.json`.
//
// Uzycie (katalog roboczy POZA repo):
//   node rust-port/engine/tests/p6_w6s_cooldown_gen.mjs <sciezka-do-pin.ts> <katalog-roboczy-poza-repo>
// Plik .ts pobierany przez: git show 07d2fbd72f758705f8e1d59cc4968027ffbafe75:gra/src/game/diplomacy-rejection-cooldown.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { stripTypeScriptTypes } = require('node:module');

const [, , tsPath, workDir] = process.argv;
if (!tsPath || !workDir) {
  console.error('uzycie: node p6_w6s_cooldown_gen.mjs <pin.ts> <workdir-poza-repo>');
  process.exit(2);
}

mkdirSync(workDir, { recursive: true });
const js = stripTypeScriptTypes(readFileSync(tsPath, 'utf8'), { mode: 'strip' });
const jsPath = join(workDir, 'diplomacy-rejection-cooldown.mjs');
writeFileSync(jsPath, js);
const web = await import(pathToFileURL(jsPath).href);

const ops = [];
const cooldownStates = [];

// Stala sekwencja: zapis, sprawdzenie, nadpisanie, klucze miasta/wymiany, pruning.
const script = [
  { op: 'record', partner: 2, action: 'pokoj', turn: 10, cd: 3 },
  { op: 'record', partner: 2, action: 'miasto_za_pokoj', turn: 10, cd: 3 },
  { op: 'record', partner: 2, action: 'pokoj', turn: 11, cd: 2 },
  { op: 'record', partner: 3, action: 'wymiana_cykliczna', turn: 12, cd: 3 },
  { op: 'record', partner: 3, action: 'handel', turn: 12, cd: 3 },
  { op: 'check', partner: 2, action: 'pokoj', turn: 12 },
  { op: 'check', partner: 2, action: 'pokoj', turn: 13 },
  { op: 'check', partner: 2, action: 'miasto_za_pokoj', turn: 12 },
  { op: 'check', partner: 2, action: 'miasto_za_pokoj', turn: 13 },
  { op: 'check', partner: 3, action: 'wymiana_cykliczna', turn: 14 },
  { op: 'check', partner: 3, action: 'handel', turn: 14 },
  { op: 'check', partner: 4, action: 'handel', turn: 12 },
  { op: 'prune', turn: 13 },
  { op: 'check', partner: 2, action: 'pokoj', turn: 13 },
  { op: 'prune', turn: 15 },
  { op: 'record', partner: 5, action: 'nap', turn: 20, cd: 0 },
  { op: 'check', partner: 5, action: 'nap', turn: 20 },
  { op: 'prune', turn: 20 },
];

let cd = [];
for (const s of script) {
  let result = null;
  if (s.op === 'record') {
    cd = web.recordRejectedOffer(cd, s.partner, s.action, s.turn, s.cd);
  } else if (s.op === 'check') {
    result = web.isOfferRejectedOnCooldown(cd, s.partner, s.action, s.turn);
  } else if (s.op === 'prune') {
    cd = web.pruneExpiredRejectedOffers(cd, s.turn);
  }
  ops.push({ ...s, result });
  cooldownStates.push(cd.map(c => ({ ...c })));
}

// Klucz odrzucenia dla komend (rejectCooldownKeyFor). Web zwraca actionId dla pozostalych komend.
const keyCases = [
  ['oferuj_miasto_za_pokoj', 'pokoj'],
  ['zada_miasto_za_pokoj', 'pokoj'],
  ['zaproponuj_wymiane_cykliczna', 'handel'],
  ['oferuj_pokoj', 'pokoj'],
  ['zaproponuj_handel_surowiec', 'handel'],
];
const keyFor = keyCases.map(([cmdType, actionId]) => ({
  cmdType,
  actionId,
  key: web.rejectCooldownKeyFor(cmdType, actionId),
}));

const partnerCases = [
  [0, 4],
  [4, 0],
  [2, 3],
];
const partnerOwner = partnerCases.map(([p, r]) => ({
  proposer: p,
  responder: r,
  partner: web.negotiationPartnerOwnerId(p, r),
}));

const out = {
  source: 'gra/src/game/diplomacy-rejection-cooldown.ts@07d2fbd72f758705f8e1d59cc4968027ffbafe75',
  runner: `node ${process.version} module.stripTypeScriptTypes`,
  constants: {
    AI_REJECTED_OFFER_COOLDOWN_TURNS: web.AI_REJECTED_OFFER_COOLDOWN_TURNS,
    CITY_FOR_PEACE_COOLDOWN_KEY: web.CITY_FOR_PEACE_COOLDOWN_KEY,
    CYCLIC_BARTER_COOLDOWN_KEY: web.CYCLIC_BARTER_COOLDOWN_KEY,
  },
  keyFor,
  partnerOwner,
  ops,
  cooldownStates,
  finalState: cd,
};

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'p6_w6s_cooldown_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'cooldown-vectors.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`ok: ${ops.length} operacji, ${keyFor.length} kluczy, ${partnerOwner.length} partnerow`);
