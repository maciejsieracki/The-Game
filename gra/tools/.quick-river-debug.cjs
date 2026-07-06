'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const entry = path.join(__dirname, '.quick-river-entry.ts');
fs.writeFileSync(entry, `
import { generateMap } from '../src/map/generator';
const m = generateMap(168, 120, 42, 'kontynenty', { mapSizeMenuLabel: 'Standardowy', worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' } });
const mains = m.riverPaths.filter((_, i) => m.riverPathKinds[i] === 'main');
console.log('mains', mains.length);
console.log('lens min/max', Math.min(...mains.map(p=>p.length)), Math.max(...mains.map(p=>p.length)));
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(__dirname, '.quick-river-debug-bundle.cjs'), logLevel: 'silent' });
require('./.quick-river-debug-bundle.cjs');
