'use strict';
// R-WEB-CULT-REL-AI-PLUS10-Q1 (obrona rundy 3, zarzut 1): ŻYWY test zapisu i wczytania obu pól poziomu
// „Kultura i religia” — gracz (kulturaReligiaLevel) i komputer (kulturaReligiaLevelAI).
// Ścieżka gry: __settingsLive.startNewGame = REALNY doStartGame (ta sama funkcja co „Start” kreatora);
// __settingsLive.saveRoundTrip = REALNE persistSaveToSlot + loadGameFromSlot w tej samej stronie.
// Bundle budowany poza repo przez tools/test-hook-setcitylimit-live-bundle.cjs (?civTest=1); gra/src bez zmian.
// Co NIE jest tu mierzone: odczyt D/G per miasto w silniku (brak haka rozbicia per właściciel) -> NIE ZMIERZONO.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');

const GRA = path.resolve(__dirname, '..');
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const OUT = process.env.AIPLUS10_LIVE_OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'aiplus10-live-'));

const LIVE_PARAMS = (advanced) => ({
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Normalny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: 778899,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
    cityStateDifficultyOverride: 'normal', cityLimitBase: 10, ...advanced,
  },
  villageRewardsEnabled: true,
});

// Scenariusze: start z podanymi polami zaawansowanymi -> oczekiwany odczyt silnika po starcie i po round-trip.
const SCENARIOS = [
  { name: 'gracz trudny / AI łatwy', adv: { kulturaReligiaLevel: 'trudny', kulturaReligiaLevelAI: 'latwy' },
    expect: { kulturaReligiaLevel: 'trudny', kulturaReligiaLevelAI: 'latwy' } },
  { name: 'gracz łatwy / AI trudny', adv: { kulturaReligiaLevel: 'latwy', kulturaReligiaLevelAI: 'trudny' },
    expect: { kulturaReligiaLevel: 'latwy', kulturaReligiaLevelAI: 'trudny' } },
  { name: 'brak pola AI = poziom gracza', adv: { kulturaReligiaLevel: 'normalny' },
    expect: { kulturaReligiaLevel: 'normalny', kulturaReligiaLevelAI: 'normalny' } },
  { name: 'zgodność (brak obu pól)', adv: {},
    expect: { kulturaReligiaLevel: null, kulturaReligiaLevelAI: null } },
];

function buildLiveGame() {
  fs.mkdirSync(OUT, { recursive: true });
  execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  return path.join(OUT, 'Gra-LIVE.html');
}

async function liveStart(browser, html, advanced) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
  await page.evaluate((p) => window.__settingsLive.startNewGame(p), LIVE_PARAMS(advanced));
  await page.waitForTimeout(8000);
  // R-WEB-SAVE-BLOCK-PRE-CAPITAL-Q43B: zapis jest zablokowany przed stolicą -- zakładamy ją przed saveRoundTrip.
  await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
  const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
  assert.ok(founded, 'foundFirstCity=true (stolica przed zapisem)');
  return { context, page, errors };
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const results = [];
  try {
    const html = buildLiveGame();
    for (const sc of SCENARIOS) {
      const s = await liveStart(browser, html, sc.adv);
      try {
        const start = await s.page.evaluate(() => window.__settingsLive.getSettings());
        assert.deepEqual(s.errors, [], `${sc.name}: brak pageerror po starcie`);
        assert.equal(start.kulturaReligiaLevel, sc.expect.kulturaReligiaLevel, `${sc.name}: start, poziom gracza`);
        assert.equal(start.kulturaReligiaLevelAI, sc.expect.kulturaReligiaLevelAI, `${sc.name}: start, poziom AI`);
        const rt = await s.page.evaluate(() => window.__settingsLive.saveRoundTrip());
        assert.deepEqual(s.errors, [], `${sc.name}: brak pageerror po round-trip`);
        assert.equal(rt.saved, true, `${sc.name}: zapis do slotu zakończony`);
        assert.equal(rt.before.kulturaReligiaLevel, sc.expect.kulturaReligiaLevel, `${sc.name}: przed zapisem, poziom gracza`);
        assert.equal(rt.before.kulturaReligiaLevelAI, sc.expect.kulturaReligiaLevelAI, `${sc.name}: przed zapisem, poziom AI`);
        assert.deepEqual(rt.after, rt.before, `${sc.name}: round-trip, ustawienia po wczytaniu = przed zapisem`);
        results.push({ scenariusz: sc.name, start, roundTrip: { saved: rt.saved, after: rt.after } });
        console.log(`OK ${sc.name}: start=${JSON.stringify(start)} roundTrip=zgodny`);
      } finally {
        await s.context.close();
      }
    }
    console.log('ai-plus10-live-roundtrip-test: ' + results.length + ' / ' + SCENARIOS.length + ' scenariuszy zielonych (zapis+wczytanie obu pól, żywa gra)');
    console.log(JSON.stringify(results));
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error('FAIL', e.message); process.exit(1); });
