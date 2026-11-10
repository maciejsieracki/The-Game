// Porownuje stale weba (generator.ts: DEFAULT_WIDTH/HEIGHT, ROZMIAR_DIMS; deposit-era.ts: METAL_DEPOSIT_MIN_ERA;
// newGameMapDefaults.ts: MAX_MIAST_PANSTWA) z danymi Rust (rust-port/engine/data/map-gen-params.json).
// Uzycie: node --experimental-transform-types --import <register.mjs> web_data_check.mjs <WEB_ROOT> <RUST_ENGINE_DIR>
import { readFileSync } from 'node:fs';
const [root, eng] = process.argv.slice(2);
const base = root + '/gra/src/map/';
const gen = await import(base + 'generator.ts');
const dep = await import(base + 'deposit-era.ts');
const ngd = await import(base + 'newGameMapDefaults.ts');
const rust = JSON.parse(readFileSync(eng + '/data/map-gen-params.json', 'utf8'));
const g = rust.generator;
console.log('DEFAULT_WIDTH/HEIGHT web =', gen.DEFAULT_WIDTH, gen.DEFAULT_HEIGHT, '| rust json =', g.default_width, g.default_height);
console.log('ROZMIAR_DIMS web =', JSON.stringify(gen.ROZMIAR_DIMS));
console.log('rozmiar_dims rust json =', JSON.stringify(g.rozmiar_dims));
console.log('METAL_DEPOSIT_MIN_ERA web =', JSON.stringify(dep.METAL_DEPOSIT_MIN_ERA));
console.log('metal_deposit_min_era rust json =', JSON.stringify(rust.metal_deposit_min_era));
console.log('MAX_MIAST_PANSTWA web =', ngd.MAX_MIAST_PANSTWA, '| MAX_TYPY_CYWILIZACJI_MENU web =', ngd.MAX_TYPY_CYWILIZACJI_MENU);
