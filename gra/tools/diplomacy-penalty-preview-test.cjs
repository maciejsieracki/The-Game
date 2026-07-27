'use strict';
/**
 * diplomacy-penalty-preview-test.cjs — podgląd kar W/Z przed akcją gracza.
 * Run: node tools/diplomacy-penalty-preview-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-penalty-preview-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-penalty-preview-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  previewWarDeclarationPenalties,
  previewVoluntaryTreatyBreakPenalties,
  formatDiploPenaltyShort,
} from '../src/game/diplomacy-penalty-preview.ts';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  previewWarDeclarationPenalties,
  previewVoluntaryTreatyBreakPenalties,
  formatDiploPenaltyShort,
} = require(BUNDLE);

const PARAMS = {
  zlamanaPaktGracz_zaufanie: -40,
  wiarygodnoscN1BezOstrzezenia: -10,
  wiarygodnoscN2ZlamaniePaktuNap: -18,
  wiarygodnoscN2ZlamaniePaktuSojusz: -25,
  wiarygodnoscN3AtakWOknieKarencji: -12,
  wiarygodnoscN3KarencjaBezterminoweTur: 10,
  wiarygodnoscN5ZerwanieTraktatCzasowy: -6,
  wiarygodnoscN5ZerwanieHandelCzasowy: -4,
};

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

const tradeDeal = {
  id: 't1',
  rodzaj: 'umowa_handlowa',
  strony: [0, 1],
  wygasaTura: 50,
};

const warPreview = previewWarDeclarationPenalties({
  declarerId: 0,
  targetId: 1,
  activeDeals: [tradeDeal],
  params: PARAMS,
  isRetaliation: false,
  attackSameTurn: true,
});

ok(warPreview.zaufanieTotal === -60, 'wojna + zerwanie handlu = Z −60');
ok(warPreview.wiarygodnoscTotal === -10, 'atak w tej samej turze = W −10');
ok(warPreview.lines.some(l => l.reason.includes('umowy handlowej')), 'wymienia umowę handlową');

const napDeal = { ...tradeDeal, id: 'nap', rodzaj: 'pakt_nieagresji' };
const napWar = previewWarDeclarationPenalties({
  declarerId: 0, targetId: 1, activeDeals: [napDeal], params: PARAMS,
  isRetaliation: false, attackSameTurn: false,
});
ok(napWar.wiarygodnoscTotal === -18, 'wojna mimo NAP = W −18 (bez N1)');

const timedTradeBreak = previewVoluntaryTreatyBreakPenalties(
  { rodzaj: 'umowa_handlowa', wygasaTura: 20 },
  PARAMS,
);
ok(timedTradeBreak.wiarygodnoscTotal === -4 && timedTradeBreak.zaufanieTotal === -10,
  'dobrowolne zerwanie handlu czasowego W −4 Z −10');

const indefiniteBreak = previewVoluntaryTreatyBreakPenalties(
  { rodzaj: 'pakt_nieagresji', wygasaTura: null },
  PARAMS,
);
ok(indefiniteBreak.wiarygodnoscTotal === 0, 'bezterminowe zerwanie bez kary W');
ok(indefiniteBreak.lines.some(l => l.kind === 'info'), 'informacja o oknie karencji N3');

ok(formatDiploPenaltyShort(warPreview).includes('Wiarygodność'), 'skrót zawiera Wiarygodność');

console.log(`\ndiplomacy-penalty-preview: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
