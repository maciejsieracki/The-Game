'use strict';
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../../gra-robocza/Gra-ROBOCZA.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const main = scripts.map(s => s[2]).sort((a, b) => b.length - a.length)[0] || '';

const decl = main.match(/\b(let|const)\s+Mt\b/);
if (!decl) { console.log('No Mt declaration'); process.exit(1); }
const declIdx = decl.index;
console.log('Mt declared at char', declIdx);
console.log('decl context:', main.slice(declIdx - 80, declIdx + 120));

// Find all Mt references before declaration
const re = /\bMt\b/g;
let m;
const before = [];
const after = [];
while ((m = re.exec(main)) !== null) {
  if (m.index < declIdx) before.push(m.index);
  else after.push(m.index);
}
console.log('Mt refs BEFORE decl:', before.length);
console.log('Mt refs AFTER decl:', after.length);
for (const i of before.slice(0, 10)) {
  console.log('  @', i, ':', main.slice(Math.max(0, i - 60), i + 60).replace(/\n/g, ' '));
}

// Also search for "Cannot access" patterns - Mt in TDZ init functions
const initMatch = main.match(/async function IV\(\)\{[\s\S]{0,500}/);
if (initMatch) console.log('\nIV start:', initMatch[0].slice(0, 300));
