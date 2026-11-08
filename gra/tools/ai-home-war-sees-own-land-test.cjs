'use strict';

/**
 * R-WEB-AI-HOME-WAR-SEES-OWN-LAND-Q1 -- predykat + okablowanie wyjatku "AI widzi wlasna ziemie".
 *
 * Decyzja wlasciciela (2026-11-08, ABC=A): AI broniaca WLASNEGO terytorium moze zaatakowac wroga
 * na tym terytorium nawet gdy hex jest poza polem widzenia (mgla). Poza wlasnym terytorium mgla
 * obowiazuje bez zmian.
 *
 * Co sprawdza ten plik:
 *  1. Okablowanie: main.ts (bramka "Atak na niewidoczny cel") zawiera wyjatek targetOnOwnTerritory
 *     oparty o territoryOwnerAtLive(defender) === ownerId, a fog-gate pozostaje za nim.
 *  2. Predykat na prawdziwym module map/territory.ts (territoryOwnerAt), granica N-1/N/N+1:
 *     hex wlasny (N-1, N), hex dalszy (N+1), hex sasiedni obcy (wygrywa obcy wezel).
 *  3. Dla gracza (czlowieka) bramka pozostaje bez zmian: wyjatek jest tylko w bloku komend AI.
 *
 * Uruchomienie: node tools/ai-home-war-sees-own-land-test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.ai-home-war-sees-own-land-entry.ts');
const bundle = path.join(__dirname, '.ai-home-war-sees-own-land-bundle.cjs');
fs.writeFileSync(entry, `
export { territoryOwnerAt, cityTerritoryRadius } from ${JSON.stringify(path.join(root, 'src/map/territory'))};
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: bundle, absWorkingDir: root, logLevel: 'silent',
  });
} catch (error) {
  console.error('[ai-home-war-sees-own-land-test] bundling failed:', error.message || error);
  process.exit(1);
}
const api = require(bundle);

console.log('K1 okablowanie: wyjatek w bramce ataku AI (main.ts)');
{
  const mainSrc = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');
  assert.ok(
    mainSrc.includes('function territoryOwnerAtLive(q: number, r: number): number | null {\n      return territoryOwnerAt(q, r, buildAllTerritoryNodes());\n    }'),
    'territoryOwnerAtLive must resolve owner from buildAllTerritoryNodes()',
  );
  assert.ok(
    mainSrc.includes('const targetOnOwnTerritory = territoryOwnerAtLive(defender.q, defender.r) === ownerId;'),
    'attack gate must compute targetOnOwnTerritory from the defender hex and attacker ownerId',
  );
  const gateIdx = mainSrc.indexOf('const targetOnOwnTerritory = territoryOwnerAtLive(');
  const fogIdx = mainSrc.indexOf("if (!targetOnOwnTerritory && !aiTargetVisibleForAction(", gateIdx);
  assert.ok(fogIdx > gateIdx, 'fog gate must be guarded by !targetOnOwnTerritory');
  const blockEnd = mainSrc.indexOf("console.warn(`[AI ${ownerId}] Atak na niewidoczny cel", fogIdx);
  assert.ok(blockEnd > fogIdx && blockEnd - fogIdx < 300, 'guarded fog gate must keep its console.warn and skip');
}

const city = (q, r, pop, ownerId) => ({ q, r, pop, level: 1, ownerId });
const ownerAt = (q, r, nodes) => api.territoryOwnerAt(q, r, nodes);
const exempt = (q, r, attackerOwnerId, nodes) => ownerAt(q, r, nodes) === attackerOwnerId;

console.log('K2 granica terytorium N-1 / N / N+1 (miasto pop 5, zasieg 5)');
{
  const radius = api.cityTerritoryRadius({ q: 4, r: 4, pop: 5, level: 1 });
  assert.strictEqual(radius, 5, 'precondition: radius for pop 5 must be 5');
  const nodes = [city(4, 4, 5, 1)];
  // N-1: hex (4,4)->(8,4) = dystans 4 -> wlasny
  assert.strictEqual(exempt(8, 4, 1, nodes), true, 'N-1 own hex must be exempt');
  // N: (4,4)->(9,4) = dystans 5 -> wlasny
  assert.strictEqual(exempt(9, 4, 1, nodes), true, 'N own hex must be exempt');
  // N+1: (4,4)->(10,4) = dystans 6 -> poza terytorium -> mgla obowiazuje
  assert.strictEqual(ownerAt(10, 4, nodes), null, 'N+1 hex must be outside territory');
  assert.strictEqual(exempt(10, 4, 1, nodes), false, 'N+1 hex must NOT be exempt');
}

console.log('K3 sasiedni obcy wezel: hex wygrany przez obcego nie jest wyjatkiem');
{
  // Miasto obce (2) na (9,4). Hex (8,4) lezy w zasiegu obu, blizej obcego (dystans 1 vs 4).
  const nodes = [city(4, 4, 5, 1), city(9, 4, 5, 2)];
  assert.strictEqual(ownerAt(8, 4, nodes), 2, 'contested hex must belong to nearer foreign node');
  assert.strictEqual(exempt(8, 4, 1, nodes), false, 'foreign-owned neighbour hex must NOT be exempt');
  // Wlasny hex blizej naszego miasta pozostaje wyjatkiem.
  assert.strictEqual(exempt(2, 4, 1, nodes), true, 'own hex next to own city must be exempt');
}

console.log('K4 hex bez zadnego wezla (dystans > zasieg wszystkich) -> brak wlasciciela');
{
  assert.strictEqual(ownerAt(0, 0, []), null);
  assert.strictEqual(exempt(0, 0, 1, []), false);
}

fs.rmSync(entry, { force: true });
fs.rmSync(bundle, { force: true });

console.log('AI home-war sees own land tests PASS (4/4)');
