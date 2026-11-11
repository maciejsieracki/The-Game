// Generator wektorow DANE-2 z URUCHOMIONEGO kodu weba (gra/src/game/diplomacy.ts).
// Uzycie: node --experimental-transform-types --import ./p61e-loader-register.mjs ./gen-dane2-web.mjs <KORZEN_WEBA> <OUT_JSON>
// Liczby zapisane jako tekst (String(x)), zeby serde_json nie zgubil ostatniego bitu.
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [root, out] = process.argv.slice(2);
if (!root || !out) throw new Error('uzycie: gen-dane2-web.mjs <KORZEN> <OUT_JSON>');
const url = (p) => pathToFileURL(`${root}/${p}`).href;
const d = await import(url('gra/src/game/diplomacy.ts'));

const s = (x) => (x === undefined || x === null ? null : Object.is(x, -0) ? '-0' : String(x));
const eff = d.getEffectiveDiplomacyParams();
const levels = {};
for (const lvl of ['low', 'normal', 'strong']) {
  const p = d.sisterAllianceDiplomacyParams(lvl);
  levels[lvl] = {
    progSojuszWillingnessMin: s(p.progSojuszWillingnessMin),
    progSojuszRelacja: s(p.progSojuszRelacja),
  };
}
const result = {
  zrodlo: 'uruchomiony kod TS weba: gra/src/game/diplomacy.ts (getEffectiveDiplomacyParams, sisterAllianceDiplomacyParams)',
  progSojuszWillingnessMin: s(eff.progSojuszWillingnessMin),
  progNapBezterminowyRelacja: s(eff.progNapBezterminowyRelacja),
  progNapRelacja: s(eff.progNapRelacja),
  progNapZaufanie: s(eff.progNapZaufanie),
  sister: levels,
};
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log('ZAPISANO', out);
