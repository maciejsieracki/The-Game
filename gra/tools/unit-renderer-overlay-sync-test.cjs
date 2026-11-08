'use strict';
/** Regression test for overlay sprite churn in UnitRenderer._applyStackDisplay. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const THREE = require(path.resolve(__dirname, '..', 'node_modules', 'three'));
const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.join(__dirname, '.unit-renderer-overlay-sync-test.bundle.cjs');
let canvasCreations = 0;
const context = new Proxy({}, { get: (target, prop) => target[prop] || (() => {}), set: (target, prop, value) => (target[prop] = value, true) });
global.document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`unexpected element: ${tag}`);
    canvasCreations++;
    return { width: 0, height: 0, getContext: () => context };
  },
};
let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log(`PASS: ${name}`); }
  else { fail++; console.error(`FAIL: ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`); }
}
(async () => {
  try {
    await esbuild.build({
      entryPoints: [path.join(GRA, 'src/render/units.ts')], bundle: true,
      platform: 'node', format: 'cjs', target: 'node18', external: ['three'],
      outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
    });
    const { UnitRenderer } = require(BUNDLE);
    const renderer = new UnitRenderer(new THREE.Scene(), { hexes: {} });
    const token = new THREE.Group(); token.visible = true;
    renderer.tokens.set('rep', token);
    const unit = { id: 'rep' };
    const apply = ({ count = 4, starving = true, gold = false, visible = true } = {}) => {
      renderer._applyStackDisplay([unit], {
        visibleIds: visible ? new Set(['rep']) : new Set(),
        badgeByRepId: new Map([['rep', count]]),
        starvingRepIds: starving ? new Set(['rep']) : new Set(),
        goldDeficitRepIds: gold ? new Set(['rep']) : new Set(),
      });
    };
    apply();
    const badge0 = renderer.stackBadgeSprites.get('rep');
    const hunger0 = renderer.stackStarvingSprites.get('rep');
    check('initial stack badge and hunger marker are rendered', !!badge0 && !!hunger0);
    check('initial state allocates exactly two canvases', canvasCreations === 2, canvasCreations);
    apply();
    check('unchanged state preserves badge sprite identity', renderer.stackBadgeSprites.get('rep') === badge0);
    check('unchanged state preserves hunger sprite identity', renderer.stackStarvingSprites.get('rep') === hunger0);
    check('unchanged state allocates no extra canvas textures', canvasCreations === 2, canvasCreations);
    apply({ count: 5 });
    const badge1 = renderer.stackBadgeSprites.get('rep');
    check('changed stack count replaces the badge', badge1 !== badge0 && badge1.userData.stackBadgeCount === 5);
    check('changed stack count recreates only one canvas texture', canvasCreations === 3, canvasCreations);
    apply({ count: 5, gold: true });
    const hungerPaired = renderer.stackStarvingSprites.get('rep');
    const goldPaired = renderer.stackGoldDeficitSprites.get('rep');
    check('adding gold deficit shows both cause icons in paired positions',
      !!hungerPaired && !!goldPaired && hungerPaired.position.x < 0 && goldPaired.position.x > 0);
    check('pairing updates only the two cause icons', canvasCreations === 5, canvasCreations);
    apply({ count: 5, starving: false, gold: true });
    const goldSingle = renderer.stackGoldDeficitSprites.get('rep');
    check('removing hunger removes skull and centers the remaining coin',
      !renderer.stackStarvingSprites.has('rep') && !!goldSingle && goldSingle.position.x === 0);
    check('cause change refreshes only the affected marker/position', canvasCreations === 6, canvasCreations);

    apply({ count: 5, starving: false, gold: true, visible: false });
    check('hidden representative releases badge and cause sprites',
      !renderer.stackBadgeSprites.has('rep') && !renderer.stackGoldDeficitSprites.has('rep'));
    check('hiding overlays allocates no canvases', canvasCreations === 6, canvasCreations);
    apply({ count: 5, starving: false, gold: true });
    check('showing representative restores its badge and cause icon',
      renderer.stackBadgeSprites.has('rep') && renderer.stackGoldDeficitSprites.has('rep'));
    check('restoration creates only the visuals that were removed', canvasCreations === 8, canvasCreations);

    const replacementToken = new THREE.Group(); replacementToken.visible = true;
    renderer.tokens.set('rep', replacementToken);
    apply({ count: 5, starving: false, gold: true });
    check('token model replacement reattaches cached overlays to the new token',
      renderer.stackBadgeSprites.get('rep').parent === replacementToken &&
      renderer.stackGoldDeficitSprites.get('rep').parent === replacementToken);
    check('token replacement refreshes only overlays attached to the old model', canvasCreations === 10, canvasCreations);
    console.log(`\nunit-renderer-overlay-sync-test: ${pass} passed, ${fail} failed`);
    process.exitCode = fail ? 1 : 0;
  } catch (err) {
    console.error(err); process.exitCode = 1;
  } finally { try { fs.unlinkSync(BUNDLE); } catch {} }
})();
