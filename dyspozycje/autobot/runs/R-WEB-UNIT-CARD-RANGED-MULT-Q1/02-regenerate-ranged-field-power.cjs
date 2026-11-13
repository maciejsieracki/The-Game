'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '../../../../gra/node_modules/esbuild'));

const root = path.resolve(__dirname, '../../../..');
const unitsPath = path.join(root, 'gra/data/units.json');
const bundlePath = path.join(os.tmpdir(), `ranged-field-power-${process.pid}.cjs`);

function topLevelObjectRanges(text) {
  const ranges = [];
  let arrayDepth = 0;
  let objectDepth = 0;
  let inString = false;
  let escaped = false;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '[') arrayDepth++;
    else if (ch === ']') arrayDepth--;
    else if (ch === '{') {
      if (arrayDepth === 1 && objectDepth === 0) start = i;
      objectDepth++;
    } else if (ch === '}') {
      objectDepth--;
      if (arrayDepth === 1 && objectDepth === 0 && start >= 0) {
        ranges.push([start, i + 1]);
        start = -1;
      }
    }
  }
  return ranges;
}

async function main() {
  await esbuild.build({
    entryPoints: [path.join(root, 'gra/src/game/unit-power.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: bundlePath,
    logLevel: 'silent',
  });
  try {
    const { fieldPower, rangedDamageMultFor } = require(bundlePath);
    const original = fs.readFileSync(unitsPath, 'utf8');
    const units = JSON.parse(original);
    const ranged = units.filter(unit => rangedDamageMultFor(unit) > 1);
    if (ranged.length !== 8) throw new Error(`Expected 8 ranged multiplier units, found ${ranged.length}`);
    for (const unit of ranged) unit.fieldPower = fieldPower(unit).total;
    const ranges = topLevelObjectRanges(original);
    const changes = [];
    ranges.forEach(([start, end], index) => {
      const unit = units[index];
      if (rangedDamageMultFor(unit) <= 1) return;
      const chunk = original.slice(start, end);
      const updated = chunk.replace(/("fieldPower"\s*:\s*)-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/, `$1${unit.fieldPower}`);
      if (updated === chunk) throw new Error(`No fieldPower cache found for ${unit.Jednostka}`);
      changes.push([start, end, updated]);
      console.log(`${unit.Jednostka}: fieldPower=${unit.fieldPower}`);
    });
    if (changes.length !== 8) throw new Error(`Expected to update 8 fieldPower caches, found ${changes.length}`);
    let output = original;
    for (const [start, end, updated] of changes.reverse()) output = output.slice(0, start) + updated + output.slice(end);
    fs.writeFileSync(unitsPath, output, 'utf8');
  } finally {
    fs.rmSync(bundlePath, { force: true });
  }
}

main().catch(error => { console.error(error); process.exit(1); });
