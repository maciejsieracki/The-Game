'use strict';
/**
 * siege-badge-zorder-test.cjs -- R-WEB-SIEGE-BADGE-ZORDER-Q1 (statyczny, bez przegladarki).
 * Plakietka oblezenia (HTML nakladka swiata) musi lezec POD wszystkimi panelami/oknami UI.
 * Usage (z gra/): node tools/siege-badge-zorder-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const rd = (p) => fs.readFileSync(path.join(GRA, p), 'utf8');
let pass = 0; let fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

const layer = rd('src/ui/worldOverlayLayer.ts');
const m = /WORLD_OVERLAY_Z_INDEX\s*=\s*(\d+)/.exec(layer);
const Z = m ? Number(m[1]) : NaN;
check('stala WORLD_OVERLAY_Z_INDEX istnieje', Number.isFinite(Z), layer.slice(0, 80));

const main = rd('src/main.ts');
const i = main.indexOf("el.className = 'civ-siege-html-label'");
check('plakietka oblezenia istnieje w main.ts', i > 0);
const block = main.slice(i, i + 1600);
check('plakietka uzywa WORLD_OVERLAY_Z_INDEX (bez literalu z-index)',
  /'z-index:'\s*\+\s*WORLD_OVERLAY_Z_INDEX/.test(block) && !/z-index:\s*\d+/.test(block), block.slice(0, 100));
check('main.ts importuje WORLD_OVERLAY_Z_INDEX', /import \{ WORLD_OVERLAY_Z_INDEX \} from '\.\/ui\/worldOverlayLayer'/.test(main));

// Najnizsze z-index warstw UI (pelnoekranowe/panelowe) odczytane ze zrodel -- nakladka swiata musi byc nizej.
const uiLayers = [
  ['winieta .civ-ux-dim-full', 'src/ui/cityUxFrame.ts', /\.civ-ux-dim-full\{[^}]*?z-index:(\d+)/],
  ['panel boczny .civ-side-panel', 'src/ui/sidePanelHud.ts', /\.civ-side-panel\{[\s\S]{0,400}?z-index:(\d+)/],
  ['HUD .civ-hud', 'src/ui/hud.ts', /\.civ-hud\{[^}]*?z-index:(\d+)/],
  ['panel kontekstu .civ-context-panel', 'src/ui/contextPanelHud.ts', /\.civ-context-panel\{[\s\S]{0,300}?z-index:(\d+)/],
  ['panel jednostki .civ-unit-panel', 'src/ui/unitPanelHud.ts', /\.civ-unit-panel\{[^}]*?z-index:(\d+)/],
  ['panel budowy .civ-build-panel', 'src/ui/buildModeHud.ts', /\.civ-build-panel\{[^}]*?z-index:(\d+)/],
  ['ramka UX .civ-ux-frame (modale)', 'src/ui/cityUxFrame.ts', /\.civ-ux-frame\{position:fixed;inset:0;z-index:(\d+)/],
];
for (const [name, file, re] of uiLayers) {
  const mm = re.exec(rd(file));
  const z = mm ? Number(mm[1]) : NaN;
  check(name + ': z-index odczytany i > nakladki swiata (' + z + ' > ' + Z + ')', Number.isFinite(z) && z > Z, { file, z });
}
const toast = /hintToast\.style\.cssText = \[[\s\S]{0,200}?'z-index:(\d+)'/.exec(main);
check('toast #civ-hint-toast > nakladki swiata', !!toast && Number(toast[1]) > Z, toast && toast[1]);
check('nakladka swiata > 0 (nad kanwa 3D)', Z > 0);

console.log('\nPASS=' + pass + ' FAIL=' + fail);
process.exit(fail === 0 ? 0 : 1);
