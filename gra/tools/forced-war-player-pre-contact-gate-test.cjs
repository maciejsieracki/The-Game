'use strict';
/**
 * forced-war-player-pre-contact-gate-test.cjs — P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1
 * (Operator Sonnet 5, effort=medium, 2026-09-08, worktree izolowany).
 *
 * SEDNO tego tematu (potwierdzone żywym dowodem właściciela z JEGO rozgrywki, dispatch):
 * wymuszona wojna epoki, w której cel to GRACZ, nie wybucha dopóki gracz "nie poznał" tej
 * AI (brak wpisu w `contactedOwners`/`diplomaticallyDiscoveredOwners`) — bo `wypowiedz_wojne`
 * NA GRACZA jest "z udziałem gracza" (`partitionDiplomacyCommandsForPlayerFog`, diplomacy-
 * layers.ts, NIETKNIĘTA) i BEZ naprawy tego tematu przechodzi przez `dipLayer` — pełną
 * bramkę D3-Q2 (`filterDiplomacyCommandsForLayer`, `diplomacyLayerForOwner`), która zwraca
 * `'pre_contact'` (kasuje WSZYSTKIE komendy) dopóki `contactedOwners` nie zawiera ownerId.
 *
 * Dowód PRZED/PO na poziomie REALNYCH, NIEZMIENIONYCH funkcji silnika (ZERO reimplementacji
 * formuły wyboru celu ani warstwy dyplomacji — dokładnie ten sam wzorzec co siostrzany
 * `tools/p-wojna-wymuszona-trzy-naprawy-test.cjs`, część (b)):
 *  1. `decideAIDiplomacy` (ai.ts, NIETKNIĘTA) z `bronzeForceWarTargetId: 0` (gracz) generuje
 *     REALNĄ komendę `wypowiedz_wojne` z `powod` zaczynającym się od
 *     `R-EPOKA-BRAZU-WYMUSZONA-WOJNA:` — to jest publiczny, stały kontrakt tej komendy,
 *     czytany (nie zgadywany) z ai.ts.
 *  2. `partitionDiplomacyCommandsForPlayerFog` (diplomacy-layers.ts, NIETKNIĘTA) kieruje tę
 *     komendę do `playerFacing` (target=gracz), NIE do `aiToAiWar` — dokładnie tak samo PRZED
 *     i PO tej naprawie (`partitionDiplomacyCommandsForPlayerFog` sama NIE jest zmieniana).
 *  3. PRZED naprawą (main.ts filtrował CAŁE `playerFacing` samą `dipLayer`): symulacja
 *     `filterDiplomacyCommandsForLayer(playerFacing, 'pre_contact')` — REALNA, NIETKNIĘTA
 *     funkcja — daje PUSTY wynik. To jest DOKŁADNIE zaobserwowany defekt: komenda wymuszonej
 *     wojny na gracza znika całkowicie, dopóki gracz nie odkrył AI.
 *  4. PO naprawie (main.ts, `ownerLoop`, blok `dipCmdsPlayerFacingForcedWar`/`...Normal` —
 *     replikowany tu 1:1 jako ta sama, trywialna klasyfikacja po `powod`, żadna inna logika):
 *     ta sama komenda, sklasyfikowana jako "forced", filtrowana `dipLayerIgnoringPlayerFog`
 *     (`diplomacyLayerForOwner` 2-arg. overload, REALNA, NIETKNIĘTA) zamiast `dipLayer` —
 *     PRZECHODZI mimo `pre_contact`.
 *  5. Regresja (D3-Q2 bez zmian): NORMALNE (niewymuszone) `wypowiedz_wojne` na gracza (dowolny
 *     inny `powod`) nadal, PO naprawie, klasyfikowane jako "normal" i nadal kasowane pod
 *     `pre_contact` — dokładnie jak w `p-wojna-wymuszona-trzy-naprawy-test.cjs`.
 *  6. To samo dla `stoneForceWarTargetId`/`ironForceWarTargetId` (pozostałe dwie epoki objęte
 *     dispatchem) — identyczny mechanizm, identyczny dowód.
 *
 * Uzupełnienie żywego dowodu E2E: `tools/forced-war-player-no-contact-live-test.cjs`
 * (realny `vite build` + headless Chromium + realny `endTurn()`) potwierdza że PO naprawie
 * scenariusz kończy się faktycznym wypowiedzeniem wojny w żywej rozgrywce. Ta bramka istnieje
 * OBOK niego, bo żywy test w sandboxie `?playtest=mapa` (mała mapa, jeden AI) nie może
 * niezawodnie utrzymać gracza w stanie "nigdy nie widział" AI przez cały `endTurn()`
 * (`refreshFog`/`updateDiplomaticDiscovery` odświeża widoczność wielokrotnie w trakcie tury
 * z przyczyn niezwiązanych z tym tematem) — więc PRZED/PO na poziomie żywego E2E jest
 * niedeterministyczne, a ten test (czysta logika routingu, bez silnika renderowania mgły)
 * jest jedynym DETERMINISTYCZNYM dowodem PRZED/PO tego dokładnego mechanizmu blokady.
 *
 * Uruchamianie z gra/: node tools/forced-war-player-pre-contact-gate-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.forced-war-player-pre-contact-gate-entry.ts');
const bundle = path.resolve(__dirname, '.forced-war-player-pre-contact-gate-bundle.cjs');

fs.writeFileSync(entry, `
export { decideAIDiplomacy } from ${JSON.stringify(GRA_ROOT + '/src/game/ai')};
export {
  partitionDiplomacyCommandsForPlayerFog,
  filterDiplomacyCommandsForLayer,
  diplomacyLayerForOwner,
} from ${JSON.stringify(GRA_ROOT + '/src/game/diplomacy-layers')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

// Ta sama trywialna klasyfikacja co main.ts (ownerLoop, blok dodany tą naprawą) --
// żadna inna logika, tylko `powod` (publiczny, stały kontrakt komendy z ai.ts).
const FORCED_EPOCH_WAR_POWOD_RE = /^R-EPOKA-(BRAZU|KAMIEN|ZELAZO)-WYMUSZONA-WOJNA:/;
function isForcedEpochWarDeclareCmd(c) {
  return c.type === 'wypowiedz_wojne' && typeof c.powod === 'string' && FORCED_EPOCH_WAR_POWOD_RE.test(c.powod);
}

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });

  const api = require(bundle);
  const {
    decideAIDiplomacy,
    partitionDiplomacyCommandsForPlayerFog,
    filterDiplomacyCommandsForLayer,
    diplomacyLayerForOwner,
  } = api;

  const relStubToPlayer = {
    partnerId: '0',
    relation: { status: 'neutralny', zaufanie: 0, respekt: 50 },
    respektWzgledny: 0.5,
    stanWojny: false,
  };

  const FORCED_FIELDS = ['bronzeForceWarTargetId', 'stoneForceWarTargetId', 'ironForceWarTargetId'];
  const POWOD_MARKERS = {
    bronzeForceWarTargetId: 'R-EPOKA-BRAZU-WYMUSZONA-WOJNA:',
    stoneForceWarTargetId: 'R-EPOKA-KAMIEN-WYMUSZONA-WOJNA:',
    ironForceWarTargetId: 'R-EPOKA-ZELAZO-WYMUSZONA-WOJNA:',
  };

  for (const field of FORCED_FIELDS) {
    console.log(`\n--- ${field}: wymuszona wojna epoki NA GRACZA, gracz nie "poznał" AI ---`);

    const dipCmdsRaw = decideAIDiplomacy({
      myPlayerId: '5',
      relacje: [relStubToPlayer],
      agresja: 0.1,
      currentTurn: 40,
      [field]: 0,
    });
    assert(
      Array.isArray(dipCmdsRaw) && dipCmdsRaw.length === 1 && dipCmdsRaw[0].type === 'wypowiedz_wojne',
      `(1) ${field}: decideAIDiplomacy (REALNA, NIETKNIĘTA) generuje 1 komendę wypowiedz_wojne`,
    );
    eq(dipCmdsRaw[0].targetId, '0', `(1) ${field}: cel = gracz (targetId="0")`);
    assert(
      typeof dipCmdsRaw[0].powod === 'string' && dipCmdsRaw[0].powod.startsWith(POWOD_MARKERS[field]),
      `(1) ${field}: powod niesie stały marker wymuszonej wojny epoki (${JSON.stringify(dipCmdsRaw[0].powod)})`,
    );

    const { playerFacing, aiToAiWar } = partitionDiplomacyCommandsForPlayerFog(dipCmdsRaw);
    eq(aiToAiWar.length, 0, `(2) ${field}: NIE trafia do aiToAiWar (target=gracz, nie AI)`);
    eq(playerFacing.length, 1, `(2) ${field}: trafia do playerFacing (partitionDiplomacyCommandsForPlayerFog, REALNA, NIETKNIĘTA)`);

    // Warstwa PRZED naprawą: main.ts filtrował CAŁE playerFacing samą `dipLayer` (mgła
    // gracza). Gracz NIE odkrył tej AI -> contactedOwners PUSTY -> pre_contact.
    const dipLayerNoContact = diplomacyLayerForOwner(5, new Set(), new Set(), new Set());
    eq(dipLayerNoContact, 'pre_contact', `sanity ${field}: bez odkrycia gracza warstwa PEŁNA (4-arg.) to pre_contact`);

    const beforeFixResult = filterDiplomacyCommandsForLayer(playerFacing, dipLayerNoContact);
    eq(
      beforeFixResult.length, 0,
      `(3) DEFEKT POTWIERDZONY, ${field}: PRZED naprawą filterDiplomacyCommandsForLayer(playerFacing, 'pre_contact') `
      + `kasuje CAŁKOWICIE wymuszoną wojnę epoki na gracza -- DOKŁADNIE "wytrych" zgłoszony przez właściciela`,
    );

    // Warstwa PO naprawie: ta sama klasyfikacja co main.ts (ownerLoop) -- forced-war
    // filtrowane dipLayerIgnoringPlayerFog (2-arg. overload, bez mgły gracza).
    const forcedBucket = playerFacing.filter(isForcedEpochWarDeclareCmd);
    const normalBucket = playerFacing.filter(c => !isForcedEpochWarDeclareCmd(c));
    eq(forcedBucket.length, 1, `(4) ${field}: klasyfikacja PO naprawie -- komenda trafia do koszyka "forced"`);
    eq(normalBucket.length, 0, `(4) ${field}: klasyfikacja PO naprawie -- koszyk "normal" pusty (ta sama komenda, nie duplikat)`);

    const dipLayerIgnoringPlayerFog = diplomacyLayerForOwner(5, new Set());
    eq(dipLayerIgnoringPlayerFog, 'full', `sanity ${field}: warstwa BEZ mgły (2-arg. overload) to full, nigdy pre_contact`);

    const afterFixResult = filterDiplomacyCommandsForLayer(forcedBucket, dipLayerIgnoringPlayerFog);
    eq(
      afterFixResult.length, 1,
      `(4) NAPRAWA POTWIERDZONA, ${field}: PO naprawie wymuszona wojna epoki na gracza PRZECHODZI mimo braku kontaktu`,
    );
    eq(afterFixResult[0].targetId, '0', `(4) ${field}: cel komendy po naprawie nadal = gracz`);

    console.log(`--- ${field}: regresja D3-Q2 -- NIEwymuszone wypowiedz_wojne na gracza nadal kasowane ---`);
    const normalWarOnPlayer = [{ type: 'wypowiedz_wojne', targetId: '0', powod: 'agresja-organiczna-test' }];
    const { playerFacing: pf2 } = partitionDiplomacyCommandsForPlayerFog(normalWarOnPlayer);
    const forced2 = pf2.filter(isForcedEpochWarDeclareCmd);
    const normal2 = pf2.filter(c => !isForcedEpochWarDeclareCmd(c));
    eq(forced2.length, 0, `(5) ${field}: normalne DOW na gracza NIE trafia do koszyka "forced"`);
    eq(normal2.length, 1, `(5) ${field}: normalne DOW na gracza zostaje w koszyku "normal"`);
    const normalAfter = filterDiplomacyCommandsForLayer(normal2, dipLayerNoContact);
    eq(
      normalAfter.length, 0,
      `(5) BEZ REGRESJI, ${field}: normalne (niewymuszone) DOW na gracza nadal kasowane pod pre_contact -- D3-Q2 nietknięte`,
    );
  }

  console.log(`\n${passed} pass · ${failed} fail`);
} finally {
  try { fs.unlinkSync(entry); } catch (e) { /* nieistotne */ }
  try { fs.unlinkSync(bundle); } catch (e) { /* nieistotne */ }
}

process.exit(failed > 0 ? 1 : 0);
