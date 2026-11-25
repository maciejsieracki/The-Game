'use strict';
/**
 * diplomacy-resume-retry-test.cjs -- R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1: test ponawiania startu ze slotu
 * (gra/tools/measure-resume-retry.cjs, uzywane przez diplomacy-harder-measure-run.cjs).
 *
 * Bez przegladarki: launch/open to atrapy (stuby). Asercje:
 *  R1) wzorzec padniecia: „has been closed”, „Browser closed”, „Target crashed” -> retry; zwykly blad z slowem „crash” -> brak retry
 *  R2) wznowienie: padniecie dwa razy, trzecia proba OK -> 3 launch, 2 zamkniecia kontekstow padlych prob
 *  R3) wznowienie: padniecie na samym launch (przed open) -> nadal ponawiane (launch w try)
 *  R4) wznowienie: wszystkie 3 proby padaja -> blad propagowany po dokladnie 3 launch
 *  R5) swiezy start (fresh=true): padniecie -> jedna proba, blad bez retry
 *  R6) blad nie-padniecia w wznowieniu -> jedna proba, blad bez retry
 *  R7) zamkniecie kontekstu wisi (close nigdy nie wraca) -> brak kolejnej proby, blad padniecia propagowany
 *  R8) po padnieciu usuwane sa Singleton* z profilu przed kolejna proba (plik z innym imieniem zostaje)
 *  R9) runner: uzywa openWithRetry, nie zawiera juz starego wzorca /crash/i
 *
 * Uzycie (z gra/): node tools/diplomacy-resume-retry-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA_DIR = path.resolve(__dirname, '..');
const { openWithRetry, isCrash } = require('./measure-resume-retry.cjs');
const RUNNER = path.join(GRA_DIR, 'tools', 'diplomacy-harder-measure-run.cjs');

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' -- ' + detail : ''));
}

const CRASH = () => new Error('page.waitForFunction: Target page, context or browser has been closed');

/** Atrapa kontekstu: liczy zamkniecia; closeHangs=true -> close nigdy nie wraca. */
function fakeCtx(state, { closeHangs = false } = {}) {
  return {
    close() {
      state.closes++;
      if (closeHangs) return new Promise(() => {});
      return Promise.resolve();
    },
  };
}

/** Zestaw atrap: kolejne wywolania launch/open zachowuja sie wg planu (tablica zdarzen 'ok' | 'crash' | 'err' | 'launchCrash'). */
function scenario(plan, opts = {}) {
  const st = { launches: 0, opens: 0, closes: 0 };
  let n = 0;
  const launch = async () => {
    st.launches++;
    const step = plan[n] || 'ok';
    if (step === 'launchCrash') { n++; throw CRASH(); }
    st.current = { ctx: fakeCtx(st, opts), step };
    return st.current.ctx;
  };
  const open = async () => {
    st.opens++;
    const step = plan[n++] || 'ok';
    if (step === 'crash') throw CRASH();
    if (step === 'err') throw new Error('nie udalo sie zalozyc miasta gracza');
    return { page: 'page' };
  };
  return { st, launch, open };
}

async function run() {
  // R1: wzorzec padniecia
  check('R1a „has been closed” = padniecie', isCrash(new Error('Target page, context or browser has been closed')));
  check('R1b „Browser closed” = padniecie', isCrash(new Error('Browser closed.')));
  check('R1c „Target crashed” = padniecie', isCrash(new Error('Target crashed')));
  check('R1d zwykly blad z „crash” nie jest padnieciem', !isCrash(new Error('config crash handler off')) );

  // R2: dwa padniecia, trzecia proba OK
  {
    const s = scenario(['crash', 'crash', 'ok'], {});
    const logs = [];
    const r = await openWithRetry({ launch: s.launch, open: s.open, fresh: false, attempts: 3, log: m => logs.push(m) });
    check('R2 wznowienie: 3. proba OK po dwoch padnieciach', !!r.page && r.page.page === 'page' && s.st.launches === 3, `launches=${s.st.launches}`);
    check('R2b zamkniete kontekst padlych prob (2)', s.st.closes === 2, `closes=${s.st.closes}`);
    check('R2c log o kazdej ponowionej probie (2)', logs.length === 2, `logs=${logs.length}`);
  }

  // R3: padniecie na launch (przed open) jest ponawiane
  {
    const s = scenario(['launchCrash', 'ok'], {});
    const r = await openWithRetry({ launch: s.launch, open: s.open, fresh: false, attempts: 3 });
    check('R3 padniecie przy launch ponawiane (launch w try)', !!r.page && s.st.launches === 2, `launches=${s.st.launches}`);
  }

  // R4: wszystkie proby padaja
  {
    const s = scenario(['crash', 'crash', 'crash'], {});
    let thrown = null;
    try { await openWithRetry({ launch: s.launch, open: s.open, fresh: false, attempts: 3 }); } catch (e) { thrown = e; }
    check('R4 po 3 nieudanych probach blad propagowany', thrown && isCrash(thrown), thrown ? thrown.message.slice(0, 60) : 'brak bledu');
    check('R4b dokladnie 3 launch', s.st.launches === 3, `launches=${s.st.launches}`);
  }

  // R5: swiezy start = jedna proba
  {
    const s = scenario(['crash', 'ok'], {});
    let thrown = null;
    try { await openWithRetry({ launch: s.launch, open: s.open, fresh: true, attempts: 3 }); } catch (e) { thrown = e; }
    check('R5 fresh=true: padniecie bez retry', !!thrown && s.st.launches === 1, `launches=${s.st.launches}`);
  }

  // R6: blad nie-padniecia w wznowieniu = jedna proba
  {
    const s = scenario(['err', 'ok'], {});
    let thrown = null;
    try { await openWithRetry({ launch: s.launch, open: s.open, fresh: false, attempts: 3 }); } catch (e) { thrown = e; }
    check('R6 blad inny niz padniecie: bez retry', !!thrown && /nie udalo sie/.test(thrown.message) && s.st.launches === 1, `launches=${s.st.launches}`);
  }

  // R7: zamkniecie wisi -> brak kolejnej proby
  {
    const s = scenario(['crash', 'ok'], { closeHangs: true });
    let thrown = null;
    try { await openWithRetry({ launch: s.launch, open: s.open, fresh: false, attempts: 3, closeTimeoutMs: 50 }); } catch (e) { thrown = e; }
    check('R7 zamkniecie wiszace: brak retry, blad propagowany', !!thrown && isCrash(thrown) && s.st.launches === 1, `launches=${s.st.launches}`);
  }

  // R8: Singleton* usuwane przed kolejna proba; inne pliki zostaja
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-retry-test-'));
    try {
      for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) fs.writeFileSync(path.join(dir, f), 'x');
      fs.writeFileSync(path.join(dir, 'Preferences'), '{}');
      const s = scenario(['crash', 'ok'], {});
      await openWithRetry({ launch: s.launch, open: s.open, fresh: false, attempts: 3, profileDir: dir });
      const left = fs.readdirSync(dir).sort();
      check('R8 Singleton* usuniete przed ponowieniem, Preferences zostaje', left.join(',') === 'Preferences', `left=${left.join(',')}`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // R9: runner uzywa wspolnej logiki i nie ma starego wzorca
  {
    const src = fs.readFileSync(RUNNER, 'utf8');
    check('R9a runner wola openWithRetry', /return openWithRetry\(\{/.test(src) && /require\('\.\/measure-resume-retry\.cjs'\)/.test(src));
    check('R9b runner bez starego wzorca /has been closed|crash/i', !/has been closed\|crash\/i/.test(src));
  }

  const failed = results.filter(r => !r.ok).length;
  console.log(`\nWYNIK: ${results.length - failed} PASS, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
}

run().catch(e => { console.error('BLAD: ' + (e && e.stack || e)); process.exit(1); });
