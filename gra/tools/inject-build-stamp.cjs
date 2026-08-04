'use strict';
/** Linux port of inject-build-stamp.ps1 — ROBOCZA/KANON/FINALNA stamp with iterative md5. */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const htmlPath = process.argv[2];
const tier = (process.argv[3] || 'ROBOCZA').toUpperCase();
if (!htmlPath || !fs.existsSync(htmlPath)) {
  console.error('Usage: node inject-build-stamp.cjs <HtmlPath> [ROBOCZA|KANON|FINALNA]');
  process.exit(1);
}

const color = tier === 'KANON' ? '#8ec5ff' : tier === 'FINALNA' ? '#9ee6b8' : '#d4af37';
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const dot = '&#183;';

function md5File(p) {
  return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
}

function writeUtf8(p, content) {
  const tmp = p + '.tmp-stamp';
  fs.writeFileSync(tmp, content, { encoding: 'utf8' });
  fs.renameSync(tmp, p);
}

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<!-- CIV-BUILD-STAMP -->[\s\S]*?<!-- \/CIV-BUILD-STAMP -->\s*/g, '');
html = html.replace(/<div id="civ-build-stamp"[^>]*>[\s\S]*?<\/div>\s*/g, '');

const md5Ph = '0'.repeat(32);
const shortPh = '0'.repeat(8);
const labelPh = `${tier} ${dot} ${shortPh} ${dot} ${stamp}`;
const block =
  `<!-- CIV-BUILD-STAMP -->\n`
  + `<div id="civ-build-stamp" title="md5=${md5Ph}" hidden style="position:fixed;bottom:32px;left:6px;z-index:2147483647;display:none;font:11px/1.3 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.78);color:${color};padding:3px 8px;border-radius:4px;border:1px solid rgba(212,175,55,.35);pointer-events:none;letter-spacing:.02em">${labelPh}</div>\n`
  + `<!-- /CIV-BUILD-STAMP -->\n`;

if (html.includes('</body>')) html = html.replace('</body>', block + '</body>');
else html += '\n' + block;

writeUtf8(htmlPath, html);

for (let i = 0; i < 4; i++) {
  const md5 = md5File(htmlPath);
  const short = md5.slice(0, 8);
  const label = `${tier} ${dot} ${short} ${dot} ${stamp}`;
  let content = fs.readFileSync(htmlPath, 'utf8');
  const next = content
    .replace(/title="md5=[0-9a-f]{32}"/, `title="md5=${md5}"`)
    .replace(/(id="civ-build-stamp"[^>]*>)[^<]+(<\/div>)/, `$1${label}$2`);
  if (next === content) break;
  writeUtf8(htmlPath, next);
}

const finalMd5 = md5File(htmlPath);
console.log(`OK stamp ${tier} ${finalMd5.slice(0, 8)} -> ${htmlPath} (md5=${finalMd5})`);
