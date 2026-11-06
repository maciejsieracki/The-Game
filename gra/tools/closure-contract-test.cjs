'use strict';
/**
 * closure-contract-test.cjs — R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R4, punkt f)
 *
 * Domkniecia productionAvailabilityCtxForCity / cityResourceAccessForCityId zyja w main.ts (nie da sie ich
 * zaimportowac), wiec pilnujemy KONTRAKTU zrodlowego, od ktorego zalezy rownowaznosc optymalizacji
 * (rownowaznosc czesci czystych: perf-hud-q2-test.cjs #3 i #5):
 *   1. kazdy wolajacy cityResourceAccessForCityId(..., true) czyta WYLACZNIE `.active`;
 *   2. galaz activeOnly -> getResourceAccessForCity, pelna -> getCityResourceAccessForCity; UI wola z false;
 *   3. ten sam klucz ownerScoped ma w calym main.ts identyczne cialo obliczenia;
 *   4. withOwnerCtxScope jest uzywany.
 * Run from gra/: node tools/closure-contract-test.cjs
 */
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log('  PASS: ' + l); } else { fail++; console.log('  FAIL: ' + l + (d ? ' -- ' + d : '')); } };
const src = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');

const trueCalls = [...src.matchAll(/cityResourceAccessForCityId\([^)]*,\s*true\)/g)];
check('exactly one active-only caller (productionAvailabilityCtxForCity)', trueCalls.length === 1, 'found ' + trueCalls.length);
const fnStart = src.indexOf('function productionAvailabilityCtxForCity');
const body = src.slice(fnStart, fnStart + 2500);
const useIdx = body.indexOf('cityResourceAccessForCityId(city.id, true)');
check('active-only call is inside productionAvailabilityCtxForCity', useIdx > 0);
check('active-only result consumed only via .active / array form', /accessRaw\?\.active/.test(body) && !/accessRaw\??\.potential/.test(body));

const fa = src.indexOf('function cityResourceAccessForCityId');
const fb = src.slice(fa, fa + 4000);
check('activeOnly branch uses getResourceAccessForCity (potential=[])', /activeOnly\s*\?\s*\{ potential: \[\] as string\[\], active: getResourceAccessForCity\(/.test(fb));
check('full branch uses getCityResourceAccessForCity', /:\s*getCityResourceAccessForCity\(resCity/.test(fb));
check('UI callers pass false (keep potential)', /cityResourceAccessForCityId\(cityId, false\)/.test(src));

const byKey = new Map();
for (const m of src.matchAll(/ownerScoped\('(\w+)',\s*(\w+),\s*\(\) =>/g)) {
  const openAt = src.indexOf('(', m.index + 'ownerScoped'.length);
  let d = 0, j = openAt;
  for (; j < src.length; j++) { const ch = src[j]; if (ch === '(') d++; else if (ch === ')') { d--; if (d === 0) break; } }
  const bodyTxt = src.slice(m.index + m[0].length, j).replace(/\s+/g, ' ').trim().replace(/\boid\b|\bownerId\b/g, 'OWNER');
  if (!byKey.has(m[1])) byKey.set(m[1], new Set());
  byKey.get(m[1]).add(bodyTxt);
}
check('ownerScoped keys found', byKey.size >= 8, 'keys=' + byKey.size);
for (const [k, set] of byKey) check(`key '${k}' has a single computation body`, set.size === 1, [...set].join(' || '));
check('withOwnerCtxScope is used around read-only loops', (src.match(/withOwnerCtxScope\(/g) || []).length >= 1);
console.log(`\nclosure-contract-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
