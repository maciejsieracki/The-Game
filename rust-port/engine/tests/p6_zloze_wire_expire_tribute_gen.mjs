// R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1: generator wektorow z TEKSTU pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
// Wykonuje (transpilacja TypeScript przez `typescript` z Node + eval) dokladny fragment pliku pina:
//   - deactivateZlozeGrantsForDeal (gra/src/game/diplomacy-pn-engine.ts, linie 346-352)
// Kolejnosc wywolan jak w pinie `runDiplomacyTurnTick` (gra/src/main.ts ok. 24222-24294):
//   D1: `zlozeGrants = deactivateZlozeGrantsForDeal(zlozeGrants, d.id)` dla kazdej umowy znikajacej w expireTreaties (ok. 24234);
//   D6: `for (const id of broken) zlozeGrants = deactivateZlozeGrantsForDeal(zlozeGrants, id)` (ok. 24292-24294).
// Wyjscie: oczekiwane `active` kazdego grantu fixture po D1 (+ D6) wg pina. Test Rust uruchamia produkcyjna
// ture (run_war_turn) na tym samym fixture i porownuje z wektorami.
// Uzycie: node p6_zloze_wire_expire_tribute_gen.mjs <pinDir-z-gra/src> <outDir> [typescript.js]
//   (albo zmienna TYPESCRIPT_JS jako trzeci argument)
// STRAZNIK: SHA-256 pliku pina musi zgadzac sie z oczekiwanym, inaczej generator konczy sie bledem.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , pinDir, outDir, tsArg] = process.argv;
const tsPath = tsArg ?? process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
if (!pinDir || !outDir) {
  console.error('uzycie: node p6_zloze_wire_expire_tribute_gen.mjs <pinDir> <outDir> [typescript.js]');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const ts = require(tsPath);

const REL = 'gra/src/game/diplomacy-pn-engine.ts';
// Oczekiwane SHA-256 (ten sam plik co w p6_zloze_grants_state_gen.mjs).
const WANT_SHA = 'ee1b1aabffd4fdf906ce260084f80ad5da055c64912b6eda86306ba261d89257';

const buf = readFileSync(join(pinDir, REL));
const gotSha = createHash('sha256').update(buf).digest('hex');
if (gotSha !== WANT_SHA) {
  console.error(`STRAZNIK SHA-256: ${REL}: ${gotSha} != ${WANT_SHA}`);
  process.exit(3);
}
const lines = buf.toString('utf8').split('\n');

function extract(start, endLine) {
  const i = lines.findIndex(l => l.startsWith(start));
  if (i < 0) throw new Error(`brak fragmentu: ${start}`);
  const j = lines.findIndex((l, k) => k > i && l === endLine);
  if (j < 0) throw new Error(`brak konca fragmentu: ${start}`);
  return lines.slice(i, j + 1).join('\n');
}

const deactivateSrc = extract('export function deactivateZlozeGrantsForDeal(', '}');
const harness = `
${deactivateSrc}
export function runDeactivate(grants: any[], dealId: string): any[] {
  return deactivateZlozeGrantsForDeal(grants, dealId);
}
`;
const js = ts.transpileModule(harness, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', js)(mod, mod.exports, require);
const { runDeactivate } = mod.exports;

// Fixture (ta sama lista co w p6_zloze_wire_expire_tribute.rs). Pola jak ZlozeGrant (camelCase z pina).
const grant = (zlozeId, dealId, active) => {
  const g = {
    granterOwnerId: 1, granteeOwnerId: 2, partnerId: 3,
    zlozeId, hexKey: `hex-${zlozeId}`, active,
  };
  if (dealId !== undefined) g.dealId = dealId;
  return g;
};
const fixtureGrants = [
  grant('z-wygasla', 'nap-wygasa', true),         // powiazany z umowa wygasajaca w D1 -> false
  grant('z-danina', 'danina', true),              // powiazany z danina zerwana w D6 -> false (tylko przy D6)
  grant('z-zywa', 'pakt-zywy', true),             // powiazany z zywa umowa -> bez zmian
  grant('z-bez-umowy', undefined, true),          // bez powiazania -> bez zmian
  grant('z-juz-nieaktywna', 'nap-wygasa', false), // juz nieaktywny -> bez zmian
];

// Scenariusze: D1 (wygasniecie) bez zerwania za daninę; D1 + D6 (zerwanie za daninę).
const scenarios = [
  { name: 'd1-wygasniecie', expiredIds: ['nap-wygasa'], brokenIds: [] },
  { name: 'd1-i-d6-zerwanie-za-danine', expiredIds: ['nap-wygasa'], brokenIds: ['danina'] },
];
const out = scenarios.map(s => {
  let grants = structuredClone(fixtureGrants);
  for (const id of s.expiredIds) grants = runDeactivate(grants, id);
  for (const id of s.brokenIds) grants = runDeactivate(grants, id);
  return { ...s, expectedActive: grants.map(g => g.active) };
});

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'vectors.json'),
  JSON.stringify(
    { pin: '07d2fbd72f758705f8e1d59cc4968027ffbafe75', sha256: WANT_SHA, fixtureGrants, scenarios: out },
    null,
    2,
  ) + '\n',
);
console.log('OK', out.map(o => `${o.name}:${o.expectedActive.join(',')}`).join(' | '));
