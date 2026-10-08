'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require(path.join(__dirname, '../node_modules/playwright'));

const GRA = path.resolve(__dirname, '..');
const FIXED_SEED = 589020;
const DIST = process.env.WORLD_GEN_DIST;
const REQUEST_FILE = process.env.WORLD_GEN_REQUEST_FILE;
const EVIDENCE_DIR = process.env.WORLD_GEN_EVIDENCE_DIR
  || path.join(process.env.TMPDIR || os.tmpdir(), 'end-turn-gameplay-runtime');
const LABEL = process.env.GAMEPLAY_EVIDENCE_PREFIX || 'candidate';
const TIMEOUT_MS = Number(process.env.WORLD_GEN_TIMEOUT_MS || 180000);

if (!DIST) throw new Error('WORLD_GEN_DIST must point to the fresh direct-Vite output directory');
if (!REQUEST_FILE) throw new Error('WORLD_GEN_REQUEST_FILE must point to the saved exact browser request');
if (!Number.isFinite(TIMEOUT_MS) || TIMEOUT_MS < 1000) throw new Error(`invalid WORLD_GEN_TIMEOUT_MS: ${TIMEOUT_MS}`);
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
const replayRequest = JSON.parse(fs.readFileSync(REQUEST_FILE, 'utf8'));

async function run() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const warnings = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
    if (message.type() === 'warning') warnings.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  try {
    await page.addInitScript(() => {
      let nextId = 1;
      const ids = new WeakMap();
      const idOf = (node) => {
        if (!ids.has(node)) ids.set(node, nextId++);
        return ids.get(node);
      };
      const buttonsIn = (node) => {
        if (!(node instanceof Element)) return [];
        return [...(node.matches('button[data-end]') ? [node] : []), ...node.querySelectorAll('button[data-end]')];
      };
      const probe = { events: [], mutations: [], innerHtmlWrites: [], idOf };
      window.__endTurnProbe = probe;
      const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get() { return descriptor.get.call(this); },
        set(value) {
          if (this instanceof Element && this.matches('.civ-bottom-bar')) {
            probe.innerHtmlWrites.push({
              at: performance.now(),
              sameMarkup: descriptor.get.call(this) === String(value),
              stack: new Error('bottomBar innerHTML write').stack,
            });
          }
          return descriptor.set.call(this, value);
        },
      });
      const describe = (event) => {
        const path = event.composedPath();
        const button = path.find((node) => node instanceof Element && node.matches('button[data-end]')) || null;
        const target = event.target instanceof Element ? event.target : null;
        const rect = button?.getBoundingClientRect();
        const hit = Number.isFinite(event.clientX) && Number.isFinite(event.clientY)
          ? document.elementFromPoint(event.clientX, event.clientY) : null;
        return {
          type: event.type,
          trusted: event.isTrusted,
          at: performance.now(),
          buttonId: button ? idOf(button) : null,
          target: target ? { tag: target.tagName, className: typeof target.className === 'string' ? target.className : '', text: target.textContent?.trim().slice(0, 80) } : null,
          rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
          hit: hit ? { tag: hit.tagName, className: typeof hit.className === 'string' ? hit.className : '', isEndButton: !!hit.closest?.('button[data-end]') } : null,
        };
      };
      for (const type of ['pointerdown', 'pointerup', 'click']) {
        document.addEventListener(type, (event) => {
          const row = describe(event);
          if (row.buttonId !== null) probe.events.push(row);
        }, true);
      }
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.removedNodes) {
            for (const button of buttonsIn(node)) probe.mutations.push({ kind: 'removed', at: performance.now(), id: idOf(button), html: button.outerHTML });
          }
          for (const node of record.addedNodes) {
            for (const button of buttonsIn(node)) probe.mutations.push({ kind: 'added', at: performance.now(), id: idOf(button), html: button.outerHTML });
          }
        }
      }).observe(document, { childList: true, subtree: true });
    });
    await page.addInitScript(({ seed, request }) => {
      const NativeWorker = window.Worker;
      const trace = [];
      Object.defineProperty(window, '__worldGenTrace', { value: trace });
      window.Worker = class TracedWorker extends NativeWorker {
        constructor(...args) {
          super(...args);
          const post = this.postMessage.bind(this);
          this.postMessage = (message, ...rest) => {
            const outgoing = message?.type === 'generate' ? request : message;
            if (outgoing?.type === 'generate') window.__worldGenExactRequest = structuredClone(outgoing);
            trace.push({ kind: 'request', at: performance.now(), type: outgoing?.type });
            return post(outgoing, ...rest);
          };
          this.addEventListener('message', (event) => {
            const message = event.data;
            if (message?.type === 'done' && message.map) {
              const map = message.map;
              const { mapGenTimings, ...gameMap } = map;
              window.__worldGenExactMapJson = JSON.stringify(gameMap);
              const riverKinds = {};
              for (const kind of map.riverPathKinds || []) riverKinds[kind] = (riverKinds[kind] || 0) + 1;
              trace.push({ kind: 'response', type: 'done', at: performance.now(), map: {
                width: map.szerokoscQ,
                height: map.wysokoscR,
                hex_count: Object.keys(map.hexes || {}).length,
                river_kinds: riverKinds,
                start_positions_count: (map.startPositions || []).length,
                map_gen_timings: map.mapGenTimings || null,
              } });
            } else {
              trace.push({ kind: 'response', type: message?.type || 'unknown', at: performance.now(), progress: message?.pct ?? null, phase: message?.faza ?? null });
            }
          });
          this.addEventListener('error', (event) => trace.push({ kind: 'worker-error', message: event.message || null }));
          this.addEventListener('messageerror', () => trace.push({ kind: 'worker-messageerror' }));
        }
      };
    }, { seed: FIXED_SEED, request: replayRequest });

    const startedAt = Date.now();
    await page.goto(pathToFileURL(path.join(DIST, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('button', { name: /ROZPOCZNIJ GRĘ/i }).click({ timeout: 30000 });
    await page.getByRole('button', { name: /ROZPOCZNIJ KONFIGURACJĘ/i }).click({ timeout: 30000 });
    for (let i = 0; i < 3; i++) {
      const next = page.getByRole('button', { name: /Dalej/i });
      if (!(await next.count()) || await next.isDisabled()) break;
      await next.click();
    }
    const begin = page.getByRole('button', { name: /ROZPOCZNIJ GRE/i });
    if (!(await begin.count()) || await begin.isDisabled()) throw new Error('configured new-game action is missing or disabled');
    await begin.click();
    await page.waitForFunction(
      () => (window.__worldGenTrace || []).some((event) => event.type === 'done' && event.map?.hex_count > 0),
      undefined,
      { timeout: TIMEOUT_MS, polling: 500 },
    );
    const generation = await page.evaluate(() => ({
      done: (window.__worldGenTrace || []).find((event) => event.type === 'done') || null,
      progressEvents: (window.__worldGenTrace || []).filter((event) => event.type === 'progress').length,
      hudVisible: document.body.innerText.includes('ZAKOŃCZ TURĘ'),
      canvasCount: document.querySelectorAll('canvas').length,
    }));
    const exactRequest = await page.evaluate(() => window.__worldGenExactRequest || null);
    const exactMapJson = await page.evaluate(() => window.__worldGenExactMapJson || null);
    await page.waitForFunction(() => !/tworzenie świata/i.test(document.body.innerText)
      && /załóż miasto/i.test(document.body.innerText), undefined, { timeout: 150000, polling: 500 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${LABEL}-gameplay-found-city-ui.png`) });

    // Grounded in the exact seed-589020 map at the saved 1440x900 viewport.
    await page.mouse.click(650, 300);
    await page.waitForFunction(() => {
      const state = window.__cityStateStartUnitsTestDebug?.dumpState?.();
      const button = document.querySelector('.civ-bottom-bar [data-end]');
      return state?.awaitingFirstPlayerCity === false
        && state.cities?.some((city) => city.ownerId === 0)
        && button?.getAttribute('aria-disabled') === 'false'
        && !/tworzenie świata/i.test(document.body.innerText);
    }, undefined, { timeout: 150000, polling: 500 });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${LABEL}-gameplay-before.png`) });

    const audienceDismissals = [];
    const audience = page.locator('.civ-diplo-aud');
    for (let step = 0; step < 2; step++) {
      for (let card = 0; card < 16 && await audience.isVisible(); card++) {
        const oldAudience = await audience.innerText();
        await audience.locator('.civ-diplo-aud-back').click({ timeout: 15000 });
        await page.waitForFunction((prior) => {
          const el = document.querySelector('.civ-diplo-aud');
          return !el || el.getBoundingClientRect().width === 0 || el.innerText !== prior;
        }, oldAudience, { timeout: 10000 });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        audienceDismissals.push({ before: oldAudience.slice(0, 400), visible: await audience.isVisible(), after: await audience.isVisible() ? (await audience.innerText()).slice(0, 400) : null });
        fs.writeFileSync(path.join(EVIDENCE_DIR, `${LABEL}-gameplay-progress.json`), JSON.stringify({ status: 'IN_PROGRESS', audienceDismissals, product_acceptance: false }, null, 2));
      }
      if (await audience.isVisible()) throw new Error('first-contact queue exceeded bounded 16 normal Back clicks');
    }

    const turns = [];
    const turnLabel = page.locator('.civ-bottom-bar .et-turn-lbl');
    for (let step = 0; step < 2; step++) {
      const before = await page.evaluate(() => {
        const state = window.__cityStateStartUnitsTestDebug?.dumpState?.();
        const button = document.querySelector('.civ-bottom-bar [data-end]');
        const rect = button?.getBoundingClientRect();
        const x = rect ? rect.left + rect.width / 2 : NaN;
        const y = rect ? rect.top + rect.height / 2 : NaN;
        const hit = Number.isFinite(x) && Number.isFinite(y) ? document.elementFromPoint(x, y) : null;
        return {
          engine: state ? { turn: state.turn, awaitingFirstPlayerCity: state.awaitingFirstPlayerCity, cities: state.cities?.length, owner0Cities: state.cities?.filter((city) => city.ownerId === 0).length } : null,
          hud: document.querySelector('.civ-bottom-bar .et-turn-lbl')?.innerText ?? null,
          button: button ? { disabled: button.disabled, ariaDisabled: button.getAttribute('aria-disabled'), html: button.outerHTML, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, id: window.__endTurnProbe.idOf(button) } : null,
          hitIsEndButton: !!hit?.closest?.('.civ-bottom-bar [data-end]'),
          hitTag: hit?.tagName ?? null,
          audienceVisible: !!document.querySelector('.civ-diplo-aud') && document.querySelector('.civ-diplo-aud').getBoundingClientRect().width > 0,
          diploListOpen: !!document.querySelector('.civ-diplo-list-hud.open'),
          transitionOverlayPresent: !!document.querySelector('.civ-turn-transition'),
          worldCreationVisible: /tworzenie świata/i.test(document.body.innerText),
          eventStart: window.__endTurnProbe.events.length,
          mutationStart: window.__endTurnProbe.mutations.length,
        };
      });
      const priorTurn = before.engine?.turn;
      if (!before.engine || !Number.isFinite(priorTurn) || before.engine.awaitingFirstPlayerCity !== false
        || !before.engine.owner0Cities || before.audienceVisible || before.worldCreationVisible
        || before.transitionOverlayPresent || before.button?.disabled || before.button?.ariaDisabled !== 'false' || !before.hitIsEndButton) {
        throw new Error(`turn ${step + 1}: ordinary end-turn prerequisites/hit-test failed: ${JSON.stringify(before)}`);
      }
      const clickStartedAt = Date.now();
      await page.mouse.click(before.button.rect.x + before.button.rect.width / 2, before.button.rect.y + before.button.rect.height / 2);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
      const events = await page.evaluate((start) => window.__endTurnProbe.events.slice(start), before.eventStart);
      const mutations = await page.evaluate((start) => window.__endTurnProbe.mutations.slice(start), before.mutationStart);
      const trustedEndTurnClicks = events.filter((event) => event.type === 'click' && event.trusted && event.buttonId === before.button.id).length;
      let engineWaitError = null;
      try {
        await page.waitForFunction((previous) => {
          const state = window.__cityStateStartUnitsTestDebug?.dumpState?.();
          const button = document.querySelector('.civ-bottom-bar [data-end]');
          return state?.turn > previous
            && button?.getAttribute('aria-disabled') === 'false'
            && !document.querySelector('.civ-turn-transition');
        },
          priorTurn, { timeout: 180000, polling: 500 });
      } catch (error) {
        engineWaitError = error.message;
      }
      const afterEngine = await page.evaluate(() => {
        const state = window.__cityStateStartUnitsTestDebug?.dumpState?.();
        const button = document.querySelector('.civ-bottom-bar [data-end]');
        return state ? {
          turn: state.turn,
          awaitingFirstPlayerCity: state.awaitingFirstPlayerCity,
          cities: state.cities?.length,
          owner0Cities: state.cities?.filter((city) => city.ownerId === 0).length,
          endTurnReady: button?.getAttribute('aria-disabled') === 'false',
          transitionOverlayPresent: !!document.querySelector('.civ-turn-transition'),
        } : null;
      });
      let hudWaitError = null;
      if (afterEngine?.turn > priorTurn && afterEngine.endTurnReady && !afterEngine.transitionOverlayPresent) {
        try {
          await page.waitForFunction((previous) => {
            const label = document.querySelector('.civ-bottom-bar .et-turn-lbl')?.innerText;
            const button = document.querySelector('.civ-bottom-bar [data-end]');
            return Number(label?.match(/Tura\s+(\d+)/i)?.[1]) === previous + 1
              && button?.getAttribute('aria-disabled') === 'false'
              && !document.querySelector('.civ-turn-transition');
          }, priorTurn, { timeout: 30000, polling: 250 });
        } catch (error) {
          hudWaitError = error.message;
        }
      }
      const after = await page.evaluate(() => ({
        hud: document.querySelector('.civ-bottom-bar .et-turn-lbl')?.innerText ?? null,
        buttonHtml: document.querySelector('.civ-bottom-bar [data-end]')?.outerHTML ?? null,
      }));
      const transition = { step: step + 1, before, events, trustedEndTurnClicks, mutations, engineWaitError, afterEngine, hudWaitError, after, wallMs: Date.now() - clickStartedAt };
      turns.push(transition);
      fs.writeFileSync(path.join(EVIDENCE_DIR, `${LABEL}-gameplay-progress.json`), JSON.stringify({ status: 'IN_PROGRESS', turns, audienceDismissals, product_acceptance: false }, null, 2));
      if (engineWaitError || trustedEndTurnClicks !== 1 || !afterEngine || afterEngine.turn !== priorTurn + 1 || !afterEngine.endTurnReady || afterEngine.transitionOverlayPresent || hudWaitError) break;
    }

    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${LABEL}-gameplay-after.png`) });
    const result = {
      test: 'end-turn-gameplay-runtime',
      status: errors.length || turns.length !== 2 || turns.some((turn) => turn.engineWaitError || turn.hudWaitError || turn.trustedEndTurnClicks !== 1 || turn.afterEngine?.turn !== turn.before.engine.turn + 1 || !turn.afterEngine.endTurnReady || turn.afterEngine.transitionOverlayPresent) ? 'FAIL' : 'PASS',
      bounded_gameplay_ui: {
        status: turns.length === 2 && turns.every((turn) => !turn.engineWaitError && !turn.hudWaitError && turn.trustedEndTurnClicks === 1 && turn.afterEngine?.turn === turn.before.engine.turn + 1 && turn.afterEngine.endTurnReady && !turn.afterEngine.transitionOverlayPresent) ? 'PASS' : 'FAIL',
        scope: 'real menu/configuration/generation, normal first-city map click, ordinary audience Back actions, and two trusted end-turn mouse clicks',
        turns,
        audienceDismissals,
      },
      product_acceptance: false,
      full_gameplay_acceptance: 'NOT_PROVEN',
      seed: FIXED_SEED,
      exact_request: exactRequest,
      exact_request_matches_replay: JSON.stringify(exactRequest) === JSON.stringify(replayRequest),
      exact_map_sha256: exactMapJson ? createHash('sha256').update(exactMapJson).digest('hex') : null,
      generation,
      elapsed_ms: Date.now() - startedAt,
      console_or_page_errors: errors,
      console_warnings: warnings,
      end_turn_probe: await page.evaluate(() => ({ events: window.__endTurnProbe.events, mutations: window.__endTurnProbe.mutations, innerHtmlWrites: window.__endTurnProbe.innerHtmlWrites })),
    };
    fs.writeFileSync(path.join(EVIDENCE_DIR, `${LABEL}-gameplay-result.json`), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== 'PASS') process.exitCode = 1;
  } catch (error) {
    const failure = await page.evaluate((message) => ({
      status: 'FAIL',
      error: message,
      text: document.body.innerText.slice(-16000),
      turn: document.querySelector('.et-turn-lbl')?.innerText ?? null,
      gameState: window.__cityStateStartUnitsTestDebug?.dumpState?.() ?? null,
      buttons: [...document.querySelectorAll('button')].filter((button) => button.getBoundingClientRect().width > 0)
        .map((button) => ({ text: button.innerText, class: button.className, disabled: button.disabled, ariaDisabled: button.getAttribute('aria-disabled') })),
      endTurnProbe: window.__endTurnProbe ? { events: window.__endTurnProbe.events, mutations: window.__endTurnProbe.mutations, innerHtmlWrites: window.__endTurnProbe.innerHtmlWrites } : null,
    }), error.stack || String(error));
    failure.console_or_page_errors = errors;
    failure.console_warnings = warnings;
    failure.product_acceptance = false;
    fs.writeFileSync(path.join(EVIDENCE_DIR, `${LABEL}-gameplay-ui-failure.json`), JSON.stringify(failure, null, 2));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `${LABEL}-gameplay-ui-failure.png`) });
    throw error;
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
