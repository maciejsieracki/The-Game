#!/usr/bin/env node
/**
 * run-k09a-deps.mjs — TEST WYKONANIA delegatów K09A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 1).
 *
 * Sprawdza `ui/cityPanel/k09a-deps.ts` (czysty moduł, bez DOM):
 *   (1) PRZED `setK09aDeps` `requireK09aDeps()` rzuca `K09A: brak setK09aDeps` (brak cichej wartości domyślnej);
 *   (2) PO `setK09aDeps` zwraca dokładnie ten sam obiekt (identyczność referencji);
 *   (3) `setK09aDeps(null)` cofa instalację (ponownie wyjątek);
 *   (4) haki `setK09aHooks`/`getK09aHooks` zwracają ten sam obiekt; domyślnie `{}` (brak haków = gałęzie `?.` pominięte).
 * Testy wiringu (`controller/k09aWiring.ts`) i jednostek DOM NIE są tu objęte (NIE_ZMIERZONO: wymagają jsdom
 * i grafu modułów UI; patrz dossier P5-8-K09A.md §5).
 *
 * EXIT 0 <=> wszystkie checki OK; 1 <=> >=1 FAIL; 2 <=> błąd harnessu.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const DEPS = join(V2_ROOT, 'src/ui/cityPanel/k09a-deps.ts');
const TMP = mkdtempSync(join(tmpdir(), 'k09a-deps-'));
const results = [];
const check = (id, what, ok) => results.push({ id, what, ok: ok === true });

const entry = join(TMP, 'entry.ts');
writeFileSync(
  entry,
  [
    `import * as m from ${JSON.stringify(DEPS)};`,
    'export const mod = m;',
    '',
  ].join('\n'),
);
const out = join(TMP, 'bundle.mjs');
try {
  await esbuild.build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'neutral', outfile: out, logLevel: 'silent' });
  const mod = (await import(pathToFileURL(out).href)).mod;

  // (1) Przed instalacją: wyjątek z kodem K09A.
  let msg = null;
  try { mod.requireK09aDeps(); } catch (e) { msg = String(e && e.message); }
  check('pre.throws', 'przed setK09aDeps: requireK09aDeps rzuca „K09A: brak setK09aDeps”', msg !== null && msg.includes('K09A: brak setK09aDeps'));

  // (2) Po instalacji: ta sama referencja.
  const deps = {
    hideCityPanel: () => {},
    setHoverDetailDocks: () => {},
    setMapHudChromeSuppressed: () => {},
    showCityUxFrame: () => {},
    hideCityUxFrame: () => {},
    refreshCityUxFrame: () => {},
  };
  mod.setK09aDeps(deps);
  check('post.identity', 'po setK09aDeps: requireK09aDeps zwraca ten sam obiekt', mod.requireK09aDeps() === deps);

  // (3) Cofnięcie instalacji.
  mod.setK09aDeps(null);
  let msg2 = null;
  try { mod.requireK09aDeps(); } catch (e) { msg2 = String(e && e.message); }
  check('reset.throws', 'setK09aDeps(null) cofa instalację (ponowny wyjątek)', msg2 !== null && msg2.includes('K09A: brak setK09aDeps'));

  // (4) Haki.
  check('hooks.default', 'domyślnie getK09aHooks() zwraca pusty obiekt', JSON.stringify(mod.getK09aHooks()) === '{}');
  const hooks = { onSwitchCity: () => 1 };
  mod.setK09aHooks(hooks);
  check('hooks.identity', 'setK09aHooks/getK09aHooks: ta sama referencja', mod.getK09aHooks() === hooks);
} catch (e) {
  console.error('BLAD-HARNESU:', e && e.stack ? e.stack : e);
  rmSync(TMP, { recursive: true, force: true });
  process.exit(2);
}
rmSync(TMP, { recursive: true, force: true });

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id} | ${r.what}`);
console.log(`\nk09a-deps: ${results.length - fails.length}/${results.length} zgodnych`);
process.exit(fails.length === 0 ? 0 : 1);
