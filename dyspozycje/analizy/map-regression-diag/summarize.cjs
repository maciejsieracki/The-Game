'use strict';
const fs = require('fs');
const file = process.argv[2];
for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  if (!line.includes('\t')) continue;
  const idx = line.indexOf('\t');
  const key = line.slice(0, idx);
  const r = JSON.parse(line.slice(idx + 1));
  if (key.startsWith('A|')) {
    if (r.badOutlet || r.badReal) {
      console.log(`${key} totalPaths=${r.totalPaths} badOutlet=${r.badOutlet} badReal=${r.badReal}/${r.totalMain}`);
      for (const b of r.bad) console.log(`   ${JSON.stringify(b)}`);
    }
  } else if (key.startsWith('B|')) {
    if (r.orphanCount || !r.tribOk) console.log(`${key} orphans=${r.orphanCount} trib=${r.tribViolations} first=${r.firstFail}`);
  } else console.log(key, JSON.stringify(r).slice(0, 300));
}
console.log('SUMMARY', file, 'lines', fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length);
