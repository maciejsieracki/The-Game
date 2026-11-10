'use strict';
/**
 * Focused regression for player-facing unit Top 3 labels.
 * Usage from gra/: node tools/unit-top3-player-language-test.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require('jsdom');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.unit-top3-player-language-entry.ts');
const BUNDLE = path.join(__dirname, '.unit-top3-player-language-bundle.cjs');
const BRAND_ASSETS_STUB = path.join(__dirname, '.stubs/entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.join(__dirname, '.stubs/entity-card-contract-scienceOwlIcon-stub.ts');
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));

const stubIconsPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

async function main() {
  fs.writeFileSync(ENTRY, [
    "export { unitAdapter } from '../src/ui/entityCards/unitAdapter.ts';",
    "export { renderEntityCard } from '../src/ui/entityCards/renderer.ts';",
    '',
  ].join('\n'), 'utf8');

  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
      target: 'node18', outfile: BUNDLE, absWorkingDir: GRA,
      loader: { '.ts': 'ts' }, plugins: [stubIconsPlugin], logLevel: 'silent',
    });

    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;

    const { unitAdapter, renderEntityCard } = require(BUNDLE);
    const source = units.find((unit) => unit.Jednostka === 'Evocati');
    assert.ok(source, 'units.json contains Evocati');
    const unit = {
      ...source,
      Top3: [
        { tytul: 'Najwyższe Health', tekst: 'Health 40 — wspólne maksimum.' },
        { tytul: 'Najwyższa fieldPower', tekst: 'fieldPower 40 — bez remisu.' },
        { tytul: 'Bonus vs Spearman 15%', tekst: 'Bonus vs Spearman 15% oraz vs Mount 50%.' },
        { tytul: 'Bonus vs Swordsman 25%', tekst: 'Bonus vs Swordsman 25%.' },
        { tytul: 'Bonus vs Distance 50% i vs Slinger 50%', tekst: 'Bonus vs Distance/Slinger 50%.' },
        { tytul: 'Bonus vs Offensive 25%', tekst: 'Bonus vs Offensive 25%.' },
        { tytul: 'Podwójny bonus: Spearman 15% i Mount 50%', tekst: 'Podwójny bonus: Spearman 15% i Mount 50%.' },
        { tytul: 'UnknownLabel', tekst: 'UnknownLabel zostaje bez zmian.' },
      ],
    };
    const originalTop3 = structuredClone(unit.Top3);
    const cardData = unitAdapter(unit, {});
    const card = renderEntityCard(cardData);
    const visible = card.querySelector('[data-section-key="top3"]').textContent;

    assert.ok(card.textContent.includes('niektóre źródła wspominają'), 'rendered history uses corrected agreement');
    assert.ok(!card.textContent.includes('niektórzy źródła'), 'rendered history no longer has the agreement error');
    for (const expected of [
      'Najwyższa wartość zdrowia', 'Zdrowie: 40 — wspólne maksimum.',
      'Najwyższa Moc', 'Moc 40 — bez remisu.',
      'Premia przeciw włócznikom 15%', 'Premia przeciw włócznikom 15% oraz przeciw konnym 50%.',
      'Premia przeciw miecznikom 25%',
      'Premia przeciw jednostkom dystansowym 50% i przeciw procarzom 50%',
      'Premia przeciw jednostkom dystansowym i procarzom 50%',
      'Premia przeciw jednostkom ofensywnym 25%',
      'Podwójna premia: przeciw włócznikom 15% i jednostkom konnym 50%',
      'UnknownLabel', 'UnknownLabel zostaje bez zmian.',
    ]) {
      assert.ok(visible.includes(expected), `rendered card contains ${JSON.stringify(expected)}`);
    }
    for (const untranslated of ['Health', 'fieldPower', 'Bonus vs Spearman', 'vs Mount', 'Swordsman', 'Falangite', 'Distance', 'Slinger', 'Offensive']) {
      assert.ok(!visible.includes(untranslated), `rendered card hides mapped label ${JSON.stringify(untranslated)}`);
    }
    assert.deepEqual(unit.Top3, originalTop3, 'view translation preserves source Top3 strings and values');

    const untranslatedTop3 = /\bHealth\b|\bfieldPower\b|\bSpearman\b|\bMount\b|\bSwordsman\b|\bFalangite\b|\bDistance\b|\bSlinger\b|\bOffensive\b/i;
    let checkedTop3 = 0;
    for (const realUnit of units) {
      if (!Array.isArray(realUnit.Top3) || realUnit.Top3.length === 0) continue;
      const realCard = renderEntityCard(unitAdapter(realUnit, {}));
      const section = realCard.querySelector('[data-section-key="top3"]');
      assert.ok(section, `${realUnit.Jednostka}: nonempty Top3 section renders`);
      assert.ok(!untranslatedTop3.test(section.textContent), `${realUnit.Jednostka}: mapped labels are absent from rendered Top3`);
      checkedTop3++;
    }
    assert.equal(checkedTop3, units.filter((realUnit) => Array.isArray(realUnit.Top3) && realUnit.Top3.length > 0).length,
      'all populated unit Top3 sections were rendered and checked');
    const iklwa = units.find((realUnit) => realUnit.Jednostka === 'iButho z iklwa');
    assert.ok(iklwa, 'units.json contains iButho z iklwa');
    const iklwaCard = renderEntityCard(unitAdapter(iklwa, {}));
    assert.ok(iklwaCard.textContent.includes('Iklwa, krótka, ciężka włócznia kłująca'), 'rendered iButho history uses supported Polish weapon term');
    assert.ok(!iklwaCard.textContent.includes('dzirot') && !iklwaCard.textContent.includes('kolący'), 'rendered iButho history has no malformed weapon phrase');

    console.log(`[unit-top3-player-language-test] rendered labels translated; all ${checkedTop3} Top3 sections checked; unknown label and source data preserved`);
  } finally {
    try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
    try { fs.unlinkSync(BUNDLE); } catch (_e) { /* noop */ }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
