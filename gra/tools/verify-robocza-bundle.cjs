'use strict';
/** Weryfikuje gra-robocza/Gra-ROBOCZA.html vs ROBOCZA-MANIFEST.json */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const htmlPath = path.join(root, 'gra-robocza', 'Gra-ROBOCZA.html');
const manifestPath = path.join(root, 'gra-robocza', 'ROBOCZA-MANIFEST.json');
const marker = process.argv[2] || '';

if (!fs.existsSync(htmlPath)) {
  console.error('FAIL: brak', htmlPath);
  process.exit(1);
}

const buf = fs.readFileSync(htmlPath);
const md5 = crypto.createHash('md5').update(buf).digest('hex');
const text = buf.toString('utf8');
const lines = text.split(/\r?\n/).length;
const stampMatch = text.match(/title="md5=([a-f0-9]+)"/);
const stampMd5 = stampMatch ? stampMatch[1] : null;

let manifestMd5 = null;
if (fs.existsSync(manifestPath)) {
  try {
    manifestMd5 = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).md5;
  } catch (_) { /* ignore */ }
}

const okManifest = !manifestMd5 || manifestMd5 === md5;
const okStamp = !stampMd5 || stampMd5 === md5;
const okMarker = !marker || text.includes(marker);

// R-WEB-UI-ARMY-RELEASE-ROBOCZA-Q1 (zarzut Evaluatora 2): wpisy bundles[] w manifescie
// musza wskazywac ten sam md5 i rozmiar co plik (top-level md5 to za malo).
let bundlesMismatch = [];
try {
  const mf = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const b of Array.isArray(mf.bundles) ? mf.bundles : []) {
    if (b.file !== 'Gra-ROBOCZA.html') continue;
    if (b.md5 !== md5 || b.sizeBytes !== buf.length) bundlesMismatch.push(b.href || b.file);
  }
} catch (_) { /* brak manifestu -- obsluzone przez okManifest */ }
const okBundles = bundlesMismatch.length === 0;

console.log('file:', htmlPath);
console.log('lines:', lines);
console.log('md5:', md5);
console.log('stamp md5:', stampMd5 ?? '(brak)');
console.log('manifest md5:', manifestMd5 ?? '(brak)');
console.log('manifest match:', okManifest ? 'OK' : 'MISMATCH');
console.log('stamp match:', okStamp ? 'OK' : 'WARN (użyj manifest/certutil)');
console.log('bundles[] match:', okBundles ? 'OK' : 'MISMATCH: ' + bundlesMismatch.join(', '));

if (!okManifest || !okMarker || !okBundles) process.exit(1);
console.log('VERIFY OK');
