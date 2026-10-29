'use strict';

/**
 * Regression gate for the army action-bar merge/split glyph directions.
 * It bundles and invokes the real production renderer, then reads the rendered
 * SVG paths. Merge arrows must face the center; split arrows must face outward.
 * Run from gra/: node tools/army-merge-split-direction-icons-test.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const graRoot = path.resolve(__dirname, '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'army-icons-'));
const bundlePath = path.join(tempRoot, 'unitActionBarHtml.cjs');

try {
  esbuild.buildSync({
    entryPoints: [path.join(graRoot, 'src', 'ui', 'unitActionBarHtml.ts')],
    outfile: bundlePath,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    logLevel: 'silent',
  });
  const { buildUnitActionBarHtml } = require(bundlePath);
  const html = buildUnitActionBarHtml([
    { id: 'split', label: 'Rozdziel', disabled: false },
    { id: 'merge', label: 'Połącz', disabled: false },
  ]);

  function renderedAction(id) {
    const match = html.match(new RegExp(`<button\\b[^>]*data-act="${id}"[^>]*>[\\s\\S]*?<\\/button>`));
    assert.ok(match, `renderer emits the ${id} button`);
    const svg = match[0].match(/<svg[\s\S]*?<\/svg>/);
    assert.ok(svg, `${id} button contains its SVG icon`);
    const paths = [...svg[0].matchAll(/<path\s+d="([^"]+)"/g)].map(m => m[1]);
    assert.equal(paths.length, 3, `${id} icon has two direction arrows and one center marker`);
    const arrows = paths.filter(d => d !== 'M12 3v18');
    assert.equal(arrows.length, 2, `${id} icon has exactly two chevron arrows`);
    return arrows;
  }

  function arrowDirection(d) {
    // Every arrow first draws its horizontal shaft from Mx 12 to Hx/hΔx;
    // direction is therefore measurable from the production SVG geometry.
    const m = d.match(/^M\s*(-?\d+)\s+12\s*([Hh])\s*(-?\d+)/);
    assert.ok(m, `expected a horizontal arrow shaft: ${d}`);
    const start = Number(m[1]);
    const value = Number(m[3]);
    return { start, end: m[2] === 'h' ? start + value : value };
  }

  const split = renderedAction('split');
  const merge = renderedAction('merge');
  const splitLeft = arrowDirection(split[0]);
  const splitRight = arrowDirection(split[1]);
  const mergeLeft = arrowDirection(merge[0]);
  const mergeRight = arrowDirection(merge[1]);

  assert.ok(splitLeft.end < splitLeft.start, 'split left arrow points outward to the left');
  assert.ok(splitRight.end > splitRight.start, 'split right arrow points outward to the right');
  assert.ok(mergeLeft.end > mergeLeft.start, 'merge left arrow points inward toward the center');
  assert.ok(mergeRight.end < mergeRight.start, 'merge right arrow points inward toward the center');
  assert.notDeepEqual(merge.slice(0, 2), split.slice(0, 2), 'merge and split arrows are visually distinct');

  console.log('PASS: production action-bar renderer produces outward split arrows and inward merge arrows.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
