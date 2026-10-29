#!/usr/bin/env node
/**
 * mutate-k09a-units.mjs — MUTACJE WYKONANIOWE K09A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 2; zarzut Evaluatora Z2).
 *
 * Każda mutacja zmienia JEDEN fragment kopii roboczej `src/` (katalog tymczasowy, repo nietknięte) w jednostce K09A
 * (`ui/cityPanel/k09a-{rerender,tabs,paint}.ts`), wiringu (`controller/k09aWiring.ts`) lub delegatach (`k09a-deps.ts`)
 * i uruchamia harness WYKONUJĄCY: `run-k09a-pin.mjs` (pin-exec), `run-k09a-wiring.mjs` albo `run-k09a-deps.mjs`.
 * Mutacja ZABITA = harness kończy się kodem != 0. Przed mutacjami każdy harness musi przejść na kopii bez zmian
 * (linia bazowa). Tekst `from` musi występować w pliku DOKŁADNIE raz (inaczej mutacja nieważna = błąd).
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k09a-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> linia bazowa zielona i wszystkie mutacje zabite; 1 <=> >=1 mutacja przeżyła lub nieważna; 2 <=> błąd.
 */
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k09a-units.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const ONLY = argOf('--only');

const PAINT = 'ui/cityPanel/k09a-paint.ts';
const RERENDER = 'ui/cityPanel/k09a-rerender.ts';
const TABS = 'ui/cityPanel/k09a-tabs.ts';
const WIRING = 'controller/k09aWiring.ts';
const DEPS = 'ui/cityPanel/k09a-deps.ts';

/** Mutacje: [id, harness, plik (względem src), from, to]. */
const MUTANTS = [
  // paintCityPanelSections
  ['paint.noRefresh', 'pin', PAINT, 'setK07aUxSectionRefresh(refresh);', ''],
  ['paint.mapNull', 'pin', PAINT, 'setK06aActive(city as unknown as CityK06, map, onClose ?? st.activeOnClose);', 'setK06aActive(city as unknown as CityK06, null, onClose ?? st.activeOnClose);'],
  ['paint.onCloseNoNew', 'pin', PAINT, 'setK06aActive(city as unknown as CityK06, map, onClose ?? st.activeOnClose);', 'setK06aActive(city as unknown as CityK06, map, st.activeOnClose);'],
  ['paint.scaleConst', 'pin', PAINT, "const sp = getK07aScalePx() + 'px';", "const sp = '16px';"],
  ['paint.noTopClear', 'pin', PAINT, "mounts.top.innerHTML = '';", ''],
  ['paint.noHoverDocks', 'pin', PAINT, 'requireK09aDeps().setHoverDetailDocks(', '((..._a: unknown[]) => undefined)('],
  ['paint.noGarrisonClear', 'pin', PAINT, 'if (st.pinnedGarrisonCityId !== null && st.pinnedGarrisonCityId !== (city.id as unknown as string)) {', 'if (false) {'],
  ['paint.noRightRail', 'pin', PAINT, 'renderCityIconRightRail(mounts.rightIconRail, city);', ''],
  ['paint.noK07Mirror', 'pin', PAINT, 'setK07aUxSectionRefresh(refresh);\n  setK07aActiveCity(city as unknown as CityK07);', 'setK07aUxSectionRefresh(refresh);'],
  // showCityPanel / hideCityPanel
  ['show.noHud', 'pin', PAINT, 'requireK09aDeps().setMapHudChromeSuppressed(true);', ''],
  ['show.noActiveCity', 'pin', PAINT, 'const c = resolveK08aActiveCity();', 'const c = null;'],
  ['show.refreshNoMapCheck', 'pin', PAINT, 'if (!c || getK06aState().activeMap === null) return;', 'if (!c) return;'],
  ['hide.noFrameHide', 'pin', PAINT, 'requireK09aDeps().hideCityUxFrame();', ''],
  ['hide.noHudRestore', 'pin', PAINT, 'requireK09aDeps().setMapHudChromeSuppressed(false);', ''],
  // rerender (orkiestracja)
  ['rerender.noHoverNull', 'pin', RERENDER, 'requireK09aDeps().setHoverDetailDocks(null);', ''],
  ['rerender.scaleConst', 'pin', RERENDER, "root.style.fontSize = getK07aScalePx() + 'px';", "root.style.fontSize = '16px';"],
  ['rerender.refreshNoReturn', 'pin', RERENDER, '    refresh();\n    return;\n', '    refresh();\n'],
  ['rerender.mapNull', 'pin', RERENDER, 'const mapNow = getK06aState().activeMap;', 'const mapNow = null;'],
  ['rerender.noMapGuard', 'pin', RERENDER, 'if (root === null || mapNow === null) return;', 'if (root === null) return;'],
  ['rerender.magazynNoView', 'pin', RERENDER, 'renderMagazyn(mag, city, view);', 'renderMagazyn(mag, city, null);'],
  ['rerender.closeNoHide', 'pin', RERENDER, "const close = q('cs-close'); if (close) close.addEventListener('click', () => { getK06aState().activeOnClose(); requireK09aDeps().hideCityPanel(); });", "const close = q('cs-close'); if (close) close.addEventListener('click', () => { getK06aState().activeOnClose(); });"],
  ['rerender.mapbtnNoHook', 'pin', RERENDER, 'hooks.onOpenMapForOkolica(city.id);', ''],
  ['rerender.managerNoState', 'pin', RERENDER, 'if (getK09aHooks().isAutoManageEnabled?.(city.id)) {', 'if (false) {'],
  ['rerender.scaleNoRerender', 'pin', RERENDER, 'setK07aScalePx(px); rerender();', 'setK07aScalePx(px);'],
  // switchCity / writeActiveCityK09a
  ['switch.noHook', 'pin', RERENDER, 'getK09aHooks().onSwitchCity?.(next.id);', ''],
  ['switch.noGarrisonClear', 'pin', RERENDER, 'clearGarrisonPanel();\n  writeActiveCityK09a(next);', '  writeActiveCityK09a(next);'],
  ['switch.noWrite', 'pin', RERENDER, 'writeActiveCityK09a(next);', ''],
  ['switch.wrapDir', 'pin', RERENDER, 'const next = list[(idx + dir + list.length) % list.length];', 'const next = list[(idx + list.length) % list.length];'],
  ['write.noK07', 'pin', RERENDER, 'setK07aActiveCity(city as unknown as CityK07);\n  setK06aActive(', '  setK06aActive('],
  ['write.noK06', 'pin', RERENDER, 'setK06aActive(city as unknown as CityK06, st.activeMap, st.activeOnClose);', ''],
  // renderCityIconRightRail
  ['rail.titleNoDanina', 'pin', RERENDER, "item.id === 'handel'", "item.id === 'nic'"],
  // tabs
  ['tabs.praca.noGuard', 'pin', TABS, 'if (cfg.onPodzialPracyChange) {', 'if (true) {'],
  ['tabs.left.split', 'pin', TABS, "mount.classList.toggle('civ-v-left-main-split', tab === 'budowa' || tab === 'rekrutacja');", "mount.classList.toggle('civ-v-left-main-split', tab === 'budowa');"],
  ['tabs.right.magazynNoView', 'pin', TABS, 'renderMagazyn(body, city, view));', 'renderMagazyn(body, city, null));'],
  // NIE_ZMIERZONO: renderOkolica (K07B) czyta mapę tylko przy kafelkach silnika; wejścia testowe harnessu (mapa bez kafelków) nie dają efektu.
  ['tabs.okolica.noMap', 'pin', TABS, 'renderOkolica(mount, city as unknown as CityK07, map);', 'renderOkolica(mount, city as unknown as CityK07, undefined as unknown as GameMap);', 'NIE_ZMIERZONO: mapa bez kafelków silnika (K07B renderOkolica)'],
  // wiring (controller/k09aWiring.ts)
  ['wiring.rerender', 'wiring', WIRING, 'rerender: () => rerender(),', 'rerender: () => undefined,'],
  ['wiring.hooks', 'wiring', WIRING, 'setK09aHooks(host);', 'setK09aHooks({});'],
  ['wiring.clearGarrison', 'wiring', WIRING, 'clearGarrisonPanel: () => clearGarrisonPanel(),', 'clearGarrisonPanel: () => undefined,'],
  ['wiring.hideCityPanel', 'wiring', WIRING, 'hideCityPanel: () => hideCityPanel(),', 'hideCityPanel: () => undefined,'],
  ['wiring.hideFrame', 'wiring', WIRING, 'hideCityUxFrame: () => hideCityUxFrame(),', 'hideCityUxFrame: () => undefined,'],
  ['wiring.frameOpen', 'wiring', WIRING, 'isCityUxFrameOpen: () => isCityUxFrameOpen(),', 'isCityUxFrameOpen: () => false,'],
  // delegaty (k09a-deps.ts)
  ['deps.noThrow', 'deps', DEPS, 'if (deps === null) throw', 'if (false) throw'],
  ['deps.hooksEmpty', 'deps', DEPS, 'return hooks;', 'return {};'],
];

const HARNESS = {
  pin: 'run-k09a-pin.mjs',
  wiring: 'run-k09a-wiring.mjs',
  deps: 'run-k09a-deps.mjs',
};

const TMP = mkdtempSync(join(tmpdir(), 'k09a-mut-'));
const SRC_COPY = join(TMP, 'src');
cpSync(join(V2_ROOT, 'src'), SRC_COPY, { recursive: true });
symlinkSync(join(V2_ROOT, 'node_modules'), join(TMP, 'node_modules'), 'dir');
mkdirSync(join(TMP, 'h'));
const pristine = {};
const original = (file) => {
  if (!(file in pristine)) pristine[file] = readFileSync(join(SRC_COPY, file), 'utf8');
  return pristine[file];
};

const run = (harness) => {
  const script = join(V2_ROOT, 'tools/dom-harness', HARNESS[harness]);
  const argv = [script, '--src', SRC_COPY, '--tmp-dir', join(TMP, 'h')];
  if (harness === 'pin') argv.push('--pin-dir', resolve(PIN_DIR));
  const r = spawnSync('node', argv, { cwd: V2_ROOT, encoding: 'utf8', timeout: 300000 });
  const text = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  return { status: r.status, summary: text.trim().split('\n').filter((l) => /zgodnych|BLAD|FAIL/.test(l)).slice(-2).join(' | ') };
};

let exitCode = 0;
try {
  // Linia bazowa: każdy harness zielony na kopii bez mutacji.
  for (const h of ['pin', 'wiring', 'deps']) {
    const b = run(h);
    const ok = b.status === 0;
    console.log(`${ok ? 'BASE OK  ' : 'BASE FAIL'} ${h} | ${b.summary}`);
    if (!ok) exitCode = 1;
  }
  if (exitCode !== 0) {
    console.log('Linia bazowa nie jest zielona — mutacje nie są wiarygodne.');
  } else {
    let killed = 0;
    let total = 0;
    let excluded = 0;
    for (const [id, harness, file, from, to, excl] of MUTANTS) {
      if (ONLY && !id.startsWith(ONLY)) continue;
      total += 1;
      const text = original(file);
      const count = text.split(from).length - 1;
      if (count !== 1) {
        console.log(`INVALID  ${id} | tekst mutacji występuje ${count}x w ${file}`);
        exitCode = 1;
        continue;
      }
      writeFileSync(join(SRC_COPY, file), text.replace(from, to));
      const r = run(harness);
      writeFileSync(join(SRC_COPY, file), text);
      if (r.status === 0 && excl) {
        excluded += 1;
        console.log(`EXCLUDED ${id} (${harness}) — ${excl}`);
      } else if (r.status !== 0) {
        killed += 1;
        console.log(`KILLED   ${id} (${harness}) | ${r.summary}`);
      } else {
        exitCode = 1;
        console.log(`SURVIVED ${id} (${harness}) — harness zielony mimo mutacji`);
      }
    }
    console.log(`\nk09a-mutate: zabitych ${killed}/${total - excluded} (wykluczone NIE_ZMIERZONO: ${excluded})`);
  }
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
process.exit(exitCode);
