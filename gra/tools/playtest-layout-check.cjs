'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.join(__dirname, '.playtest-layout-entry.ts');
const out = path.join(__dirname, '.playtest-layout-bundle.cjs');
fs.writeFileSync(entry, `
import { generujSwiat, rozmiarFromMenuLabel } from '../src/map/generator.ts';
import { loadGameData } from '../src/data/loader.ts';
import { buildPlaytestWalkaMapy, PLAYTEST_WALKA_SEED } from '../src/game/playtestWalkaMapy.ts';
const data = loadGameData();
const map = generujSwiat(PLAYTEST_WALKA_SEED, rozmiarFromMenuLabel('Maly'), 'kontynenty');
const p = buildPlaytestWalkaMapy(map, data);
if (!p) { console.log('FAIL: brak layoutu'); process.exit(1); }
console.log('OK units=' + p.units.length + ' cities=' + p.cities.length);
for (const u of p.units) console.log('  unit owner=' + u.ownerId + ' ' + u.typeId + ' @' + u.q + ',' + u.r);
for (const c of p.cities) console.log('  city ' + c.name + ' @' + c.q + ',' + c.r + ' mur=' + c.maMur);
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent' });
require(out);
try { fs.unlinkSync(entry); fs.unlinkSync(out); } catch (_) {}
