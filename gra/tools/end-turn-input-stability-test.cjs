'use strict';

const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const esbuild = require(path.join(__dirname, '../node_modules/esbuild'));
const { chromium } = require(path.join(__dirname, '../node_modules/playwright'));

const ROOT = path.resolve(__dirname, '../..');
const GRA = path.resolve(__dirname, '..');
const SOURCE = path.join(GRA, 'src/ui/bottomBarHud.ts');
const DISMISS_SOURCE = path.join(GRA, 'src/ui/hudPanelDismiss.ts');
const BASE_SHA = process.env.END_TURN_BASE_SHA || '69ccb145a8682f9c2754834afbb16a8d1eaaf825';

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function sourcePlugins(sourceOverride) {
  return [{
    name: 'end-turn-test-source-and-brand-stubs',
    setup(build) {
      if (sourceOverride !== null) {
        build.onLoad({ filter: /bottomBarHud\.ts$/ }, ({ path: file }) => ({
          contents: sourceOverride,
          loader: 'ts',
          resolveDir: path.dirname(file),
        }));
      }
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brand-assets', namespace: 'end-turn-stub' }));
      build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: 'brand-tokens', namespace: 'end-turn-stub' }));
      build.onLoad({ filter: /.*/, namespace: 'end-turn-stub' }, ({ path: id }) => ({
        loader: 'ts',
        contents: id === 'brand-assets'
          ? 'export function brandIconSvg(id: string) { return id === "chip-warning" ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="warning"></path></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="arrow"></path></svg>`; }'
          : 'export function ensureBrandRootTokens() {} export const CIV_BRAND_SCOPE_VARS = "";',
      }));
    },
  }];
}

async function buildBottomBar(sourceOverride = null) {
  const result = await esbuild.build({
    entryPoints: [SOURCE],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'BottomBarBundle',
    target: 'chrome120',
    write: false,
    plugins: sourcePlugins(sourceOverride),
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

async function buildOutsideDismiss() {
  const result = await esbuild.build({
    entryPoints: [DISMISS_SOURCE],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'HudPanelDismissBundle',
    target: 'chrome120',
    write: false,
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

async function runCase(browser, bottomBarBundle, dismissBundle, mode) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setContent('<!doctype html><html><head></head><body></body></html>');
  await page.addScriptTag({ content: bottomBarBundle });
  await page.addScriptTag({ content: dismissBundle });
  await page.evaluate((caseMode) => {
    let turn = 1;
    let canEnd = true;
    let hidden = false;
    let blocking = 0;
    window.__counts = { endRequests: 0, accepted: 0, guarded: 0, execute: 0 };
    window.__outsideCloseCount = 0;
    const ids = new WeakMap();
    let nextId = 1;
    const idOf = (node) => {
      if (!ids.has(node)) ids.set(node, nextId++);
      return ids.get(node);
    };
    window.__bar = window.BottomBarBundle.createBottomBarHud({
      getTurn: () => turn,
      getYearLabel: () => '4000 P.N.E.',
      getBlockingCount: () => blocking,
      getBlockingTitles: () => blocking ? ['Test decision'] : [],
      canEndTurn: () => canEnd,
      hideEndTurn: () => hidden,
      onExecutePending: () => { window.__counts.execute++; },
      onEndTurn: () => {
        window.__counts.endRequests++;
        if (canEnd && !hidden) window.__counts.accepted++;
        else window.__counts.guarded++;
      },
    });
    window.__endProbe = { events: [], renders: [], mutations: [], idOf };
    const endId = (event) => {
      const button = event.composedPath().find((node) => node instanceof Element && node.matches('[data-end]'));
      return button ? idOf(button) : null;
    };
    for (const type of ['pointerdown', 'pointerup', 'click']) {
      document.addEventListener(type, (event) => {
        window.__endProbe.events.push({
          type,
          trusted: event.isTrusted,
          id: endId(event),
          target: event.target?.nodeName,
          at: performance.now(),
        });
      }, true);
    }
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.removedNodes) {
          if (!(node instanceof Element)) continue;
          const buttons = [...(node.matches('[data-end]') ? [node] : []), ...node.querySelectorAll('[data-end]')];
          for (const button of buttons) window.__endProbe.mutations.push({ kind: 'removed', id: idOf(button), at: performance.now() });
        }
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          const buttons = [...(node.matches('[data-end]') ? [node] : []), ...node.querySelectorAll('[data-end]')];
          for (const button of buttons) window.__endProbe.mutations.push({ kind: 'added', id: idOf(button), at: performance.now() });
        }
      }
    }).observe(document, { childList: true, subtree: true });

    if (caseMode === 'outside-dismiss-refresh') {
      const panel = document.createElement('div');
      panel.className = 'test-open-hud-panel';
      document.body.appendChild(panel);
      window.__unbindOutside = window.HudPanelDismissBundle.bindHudPanelOutsideDismiss(
        panel,
        () => true,
        () => {
          window.__outsideCloseCount++;
          window.__bar.update();
        },
      );
    }

    document.addEventListener('pointerdown', (event) => {
      if (!event.target?.closest?.('[data-end]')) return;
      if (caseMode === 'refresh-same-state') {
        const before = document.querySelector('[data-end]');
        const beforeId = before ? idOf(before) : null;
        setTimeout(() => {
          window.__bar.update();
          const after = document.querySelector('[data-end]');
          window.__endProbe.renders.push({ at: performance.now(), beforeId, afterId: after ? idOf(after) : null });
        }, 20);
      } else if (caseMode === 'readiness-changes') {
        setTimeout(() => {
          canEnd = false;
          turn = 2;
          window.__bar.update();
          const currentButton = document.querySelector('[data-end]');
          window.__endProbe.renders.push({
            at: performance.now(),
            canEnd,
            turn,
            focused: document.activeElement === currentButton,
            button: currentButton?.outerHTML ?? null,
          });
        }, 20);
      } else if (caseMode === 'blocking-signal-changes') {
        setTimeout(() => {
          blocking = 1;
          window.__bar.update();
          window.__endProbe.renders.push({ at: performance.now(), blocking, button: document.querySelector('[data-end]')?.outerHTML ?? null });
        }, 20);
      } else if (caseMode === 'hidden-during-press') {
        setTimeout(() => {
          hidden = true;
          window.__bar.update();
          window.__endProbe.renders.push({ at: performance.now(), hidden, buttonPresent: !!document.querySelector('[data-end]') });
        }, 20);
      }
    }, true);
    window.__helpers = {
      setBlocking(value) { blocking = value; window.__bar.update(); },
      setTurn(value) { turn = value; window.__bar.update(); },
      setCanEnd(value) { canEnd = value; window.__bar.update(); },
      setHidden(value) { hidden = value; window.__bar.update(); },
      idOf,
    };
  }, mode);

  const box = await page.locator('[data-end]').boundingBox();
  const beforeId = await page.locator('[data-end]').evaluate((node) => window.__endProbe.idOf(node));
  if (!box) throw new Error(`${mode}: end-turn button has no visible box`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.waitForTimeout(50);
  const result = await page.evaluate(({ startId, caseMode }) => ({
    mode: caseMode,
    beforeId: startId,
    afterId: document.querySelector('[data-end]') ? window.__endProbe.idOf(document.querySelector('[data-end]')) : null,
    counts: window.__counts,
    outsideCloseCount: window.__outsideCloseCount,
    events: window.__endProbe.events,
    renders: window.__endProbe.renders,
    mutations: window.__endProbe.mutations,
    ariaDisabled: document.querySelector('[data-end]')?.getAttribute('aria-disabled') ?? null,
    signal: document.querySelector('[data-end]')?.classList.contains('et-signal') ?? false,
    focused: document.activeElement === document.querySelector('[data-end]'),
  }), { startId: beforeId, caseMode: mode });
  await page.close();
  return result;
}

async function runComponentContracts(browser, bottomBarBundle, dismissBundle) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setContent('<!doctype html><html><head></head><body></body></html>');
  await page.addScriptTag({ content: bottomBarBundle });
  await page.addScriptTag({ content: dismissBundle });
  const result = await page.evaluate(() => {
    let blocking = 0;
    let canEnd = true;
    let hidden = false;
    let execute = 0;
    let end = 0;
    const snapshots = [];
    let destroyRemoved = true;
    for (let cycle = 0; cycle < 3; cycle++) {
      const api = window.BottomBarBundle.createBottomBarHud({
        getTurn: () => cycle + 1,
        getBlockingCount: () => blocking,
        getBlockingTitles: () => blocking ? ['Test decision'] : [],
        canEndTurn: () => canEnd,
        hideEndTurn: () => hidden,
        onExecutePending: () => { execute++; },
        onEndTurn: () => { end++; },
      });
      for (let i = 0; i < 4; i++) api.update();
      const button = api.el.querySelector('[data-end]');
      snapshots.push({ exists: !!button, ariaDisabled: button?.getAttribute('aria-disabled'), executeDisabled: api.el.querySelector('[data-wykonaj]')?.disabled });
      if (cycle === 0) {
        canEnd = false;
        api.update();
        snapshots.push({ exists: !!api.el.querySelector('[data-end]'), ariaDisabled: api.el.querySelector('[data-end]')?.getAttribute('aria-disabled') });
        hidden = true;
        api.update();
        snapshots.push({ hidden: !api.el.querySelector('[data-end]') });
        hidden = false;
        canEnd = true;
        blocking = 2;
        api.update();
        const executeButton = api.el.querySelector('[data-wykonaj]');
        executeButton.click();
        api.el.querySelector('[data-et-show]')?.click();
        snapshots.push({
          executeDisabled: executeButton.disabled,
          badge: executeButton.querySelector('.wyk-badge')?.textContent ?? null,
          hint: !!api.el.querySelector('[data-et-hint]'),
          tooltip: !!api.el.querySelector('[data-et-tooltip]'),
        });
      }
      api.el.querySelector('[data-end]')?.click();
      const root = api.el;
      api.destroy();
      destroyRemoved = destroyRemoved && !root.isConnected;
    }
    return { snapshots, execute, end, destroyRemoved };
  });
  await page.close();
  return result;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

(async () => {
  const candidateSource = require('node:fs').readFileSync(SOURCE, 'utf8');
  const baseSource = execFileSync('git', ['show', `${BASE_SHA}:gra/src/ui/bottomBarHud.ts`], { cwd: ROOT, encoding: 'utf8' });
  const candidateBundle = await buildBottomBar(candidateSource);
  const baseBundle = await buildBottomBar(baseSource);
  const dismissBundle = await buildOutsideDismiss();
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const noRefresh = await runCase(browser, candidateBundle, dismissBundle, 'no-refresh');
    const sameStateRefresh = await runCase(browser, candidateBundle, dismissBundle, 'refresh-same-state');
    const outsideDismissRefresh = await runCase(browser, candidateBundle, dismissBundle, 'outside-dismiss-refresh');
    const readinessChange = await runCase(browser, candidateBundle, dismissBundle, 'readiness-changes');
    const blockingSignalChange = await runCase(browser, candidateBundle, dismissBundle, 'blocking-signal-changes');
    const hideDuringPress = await runCase(browser, candidateBundle, dismissBundle, 'hidden-during-press');
    const componentContracts = await runComponentContracts(browser, candidateBundle, dismissBundle);
    const unchangedBaseNegativeControl = await runCase(browser, baseBundle, dismissBundle, 'outside-dismiss-refresh');
    const result = {
      baseSha: BASE_SHA,
      baseSourceSha256: sha256(baseSource),
      candidateSourceSha256: sha256(candidateSource),
      noRefresh,
      sameStateRefresh,
      outsideDismissRefresh,
      readinessChange,
      blockingSignalChange,
      hideDuringPress,
      componentContracts,
      unchangedBaseNegativeControl,
    };
    console.log(JSON.stringify(result, null, 2));
    const failures = [];
    assert(noRefresh.counts.accepted === 1 && noRefresh.counts.endRequests === 1 && noRefresh.beforeId === noRefresh.afterId, 'ordinary trusted click must activate exactly once', failures);
    assert(sameStateRefresh.counts.accepted === 1 && sameStateRefresh.counts.endRequests === 1 && sameStateRefresh.beforeId === sameStateRefresh.afterId, 'same-state update between trusted down/up must preserve the pressed action', failures);
    assert(outsideDismissRefresh.outsideCloseCount === 1 && outsideDismissRefresh.counts.accepted === 1 && outsideDismissRefresh.counts.endRequests === 1 && outsideDismissRefresh.beforeId === outsideDismissRefresh.afterId, 'production outside-panel dismissal refresh must preserve and activate the pressed end-turn action once', failures);
    assert(readinessChange.counts.accepted === 0 && readinessChange.counts.guarded === 1 && readinessChange.counts.endRequests === 1 && readinessChange.beforeId === readinessChange.afterId && readinessChange.ariaDisabled === 'true' && readinessChange.focused, 'latest readiness must reach the current-state guard while preserving pressed control identity and focus after render', failures);
    assert(blockingSignalChange.counts.accepted === 1 && blockingSignalChange.counts.endRequests === 1 && blockingSignalChange.beforeId === blockingSignalChange.afterId && blockingSignalChange.signal, 'blocking-signal update must preserve the pressed control and current signal markup', failures);
    assert(hideDuringPress.counts.accepted === 0 && hideDuringPress.counts.endRequests === 0 && hideDuringPress.afterId === null && hideDuringPress.renders.at(-1)?.buttonPresent === true, 'a newly hidden action stays stable through pointerup, then is removed without activating', failures);
    assert(componentContracts.snapshots[0].ariaDisabled === 'false' && componentContracts.snapshots[1].ariaDisabled === 'true' && componentContracts.snapshots[2].hidden, 'availability, accessibility, and hidden-state contracts must remain unchanged', failures);
    assert(componentContracts.snapshots[3].executeDisabled === false && componentContracts.snapshots[3].badge === '2' && componentContracts.snapshots[3].hint && componentContracts.snapshots[3].tooltip && componentContracts.execute === 2, 'Wykonaj/Pokaż behavior must remain available and single-dispatch', failures);
    assert(componentContracts.destroyRemoved, 'repeated create/destroy cycles must remove each HUD root', failures);
    assert(componentContracts.end === 3, 'repeated updates must not duplicate end-turn listeners across create/destroy cycles', failures);
    assert(unchangedBaseNegativeControl.beforeId !== unchangedBaseNegativeControl.afterId && unchangedBaseNegativeControl.counts.accepted === 0 && !unchangedBaseNegativeControl.events.some((event) => event.type === 'click'), 'unchanged-base negative control must reproduce the lost click', failures);
    if (failures.length) {
      console.error('FAIL end-turn input stability:', failures.join(' | '));
      process.exitCode = 1;
    } else {
      console.log('PASS end-turn input stability: 10 behavior groups; unchanged-base negative control reproduced the lost click');
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
