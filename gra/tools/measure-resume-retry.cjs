'use strict';
/**
 * measure-resume-retry.cjs -- R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1: ponawianie STARTU przegladarki przy
 * padnieciu Chromium w fazie wznowienia ze slotu (diplomacy-harder-measure-run.cjs, openGameRetry).
 *
 * Kontrakt:
 *  - launch() i open() sa w jednym try: blad uruchomienia Chromium tez jest ponawiany (gdy pasuje do wzorca padniecia).
 *  - Ponowienie tylko przy padnieciu (CRASH_RE) i tylko gdy fresh=false (wznowienie). Swiezy start: jedna proba.
 *  - Po nieudanej probie kontekst jest zamykany z limitem czasu. Gdy zamkniecie nie wraca (Chromium moze wisiec),
 *    NIE ponawiamy: nowy Chromium na tym samym profilu moglby sie zderzyc z zywym procesem, wiec blad leci dalej.
 *  - Przed kolejna proba usuwane sa pliki blokady profilu Singleton* (zostaja po padnietym procesie).
 *    Usuwanie nastepuje tylko po udanym zamknieciu kontekstu (jeden Chromium naraz).
 */
const fs = require('fs');
const path = require('path');

/** Wzorzec padniecia: komunikat Playwright o zamknietej stronie/przegladarce albo awaria renderera (Target crashed).
 *  Celowo bez samego slowa „crash”: zwykly blad z tym slowem nie powoduje restartu. */
const CRASH_RE = /has been closed|Browser closed|Target crashed/i;
const SINGLETON_FILES = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];

function isCrash(e) {
  return CRASH_RE.test(String((e && e.message) || e));
}

/** Zamyka kontekst z limitem czasu. Zwraca true, gdy zamkniecie sie zakonczylo (bez wyjatku i bez przekroczenia limitu). */
async function closeWithin(ctx, ms) {
  if (!ctx) return true;
  let timer = null;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('close timeout')), ms); });
  try {
    await Promise.race([ctx.close(), timeout]);
    return true;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function clearSingletonLocks(profileDir) {
  if (!profileDir) return;
  for (const n of SINGLETON_FILES) {
    try { fs.rmSync(path.join(profileDir, n), { force: true }); } catch (_) { /* brak pliku = OK */ }
  }
}

/**
 * @param {object} o
 * @param {() => Promise<any>} o.launch     uruchamia kontekst przegladarki (np. launchPersistentContext)
 * @param {(ctx: any) => Promise<any>} o.open  otwiera gre w kontekscie; zwraca { page } albo dowolny wynik
 * @param {boolean} o.fresh                 true = swiezy start (jedna proba), false = wznowienie (do attempts prob)
 * @param {string} [o.profileDir]           katalog profilu do czyszczenia Singleton* przed kolejna proba
 * @param {number} [o.attempts=3]
 * @param {number} [o.closeTimeoutMs=15000]
 * @param {(msg: string) => void} [o.log]
 * @returns {Promise<{ctx: any, page: any}>}
 */
async function openWithRetry(o) {
  const attempts = o.fresh ? 1 : (o.attempts || 3);
  const closeMs = o.closeTimeoutMs || 15000;
  const log = o.log || (() => {});
  for (let i = 1; ; i++) {
    let ctx = null;
    try {
      ctx = await o.launch();
      const page = await o.open(ctx);
      return { ctx, page };
    } catch (e) {
      const msg = String((e && e.message) || e);
      const closed = await closeWithin(ctx, closeMs);
      if (i >= attempts || !isCrash(e)) throw e;
      if (!closed) throw e;
      clearSingletonLocks(o.profileDir);
      log(`[diplo] wznowienie: proba ${i}/${attempts} przerwana (${msg.split('\n')[0].slice(0, 120)}) -- ponawiam start ze slotu`);
    }
  }
}

module.exports = { openWithRetry, isCrash, CRASH_RE, closeWithin };
