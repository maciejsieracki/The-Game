'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require(path.resolve(__dirname, '..', 'node_modules', 'jsdom'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.ui-language-count-entry.ts');
const BUNDLE = path.join(__dirname, '.ui-language-count-bundle.cjs');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.SVGElement = dom.window.SVGElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.requestAnimationFrame = cb => setTimeout(cb, 0);
global.cancelAnimationFrame = clearTimeout;
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

const checks = [];
function check(name, condition, detail) {
  checks.push({ name, pass: !!condition, detail });
  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}${condition ? '' : ` — ${detail ?? ''}`}`);
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "export { mountSiegeHud1E, updateSiegeHud1E, setSiegeHudVisible } from '../src/battle/siegeHud1E.ts';",
    "export { buildUnitRecruitCard } from '../src/ui/unitRecruitCard.ts';",
    "export { renderTradeBasketDealPreviewHtml } from '../src/ui/diplomacyDealDisplay.ts';",
    "export { __renderNaukaSection, __renderSkarbiecSection } from '../src/ui/empireDetailPanel.ts';",
  ].join('\n'));

  const stubs = {
    name: 'ui-language-renderer-stubs',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brand-assets-stub', namespace: 'ui-test-stub' }));
      build.onResolve({ filter: /units\/setup$/ }, args => {
        if (/\/ui\/(unitRecruitCard|unitInfographic)\.ts$/.test(args.importer)) {
          return { path: 'unit-setup-stub', namespace: 'ui-test-stub' };
        }
        return undefined;
      });
      build.onResolve({ filter: /game\/diplomacy-display$/ }, () => ({ path: 'diplo-display-stub', namespace: 'ui-test-stub' }));
      build.onLoad({ filter: /.*/, namespace: 'ui-test-stub' }, args => {
        if (args.path === 'brand-assets-stub') return { loader: 'js', contents: `
          export const brandIconSvg = () => '';
          export const mapResourceIconSvg = () => '';
          export const unitIconSvg = () => '';
        ` };
        if (args.path === 'unit-setup-stub') return { loader: 'js', contents: 'export const categoryOf = () => "piechota";' };
        if (args.path === 'diplo-display-stub') return { loader: 'js', contents: `
          export const resourceDisplayLabel = id => id;
          export const splitNegotiationDealPlayerSides = () => null;
        ` };
        return null;
      });
      build.onLoad({ filter: /empireDetailPanel\.ts$/ }, args => ({
        loader: 'ts',
        contents: fs.readFileSync(args.path, 'utf8')
          + '\nexport { renderNaukaSection as __renderNaukaSection, renderSkarbiecSection as __renderSkarbiecSection };\n',
      }));
    },
  };

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE,
    absWorkingDir: GRA, loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
    plugins: [stubs], logLevel: 'silent',
  });

  const api = require(BUNDLE);
  const counts = [1, 2, 5, 11, 12, 13, 14, 21, 22];
  const expectedTurns = new Map([[1, '1 tura'], [2, '2 tury'], [5, '5 tur'], [11, '11 tur'], [12, '12 tur'], [13, '13 tur'], [14, '14 tur'], [21, '21 tur'], [22, '22 tury']]);
  const expectedUnits = new Map([[1, '1 jednostka'], [2, '2 jednostki'], [5, '5 jednostek'], [11, '11 jednostek'], [12, '12 jednostek'], [13, '13 jednostek'], [14, '14 jednostek'], [21, '21 jednostek'], [22, '22 jednostki']]);
  const expectedGarrisons = new Map([[1, '1 oddział'], [2, '2 oddziały'], [5, '5 oddziałów'], [11, '11 oddziałów'], [12, '12 oddziałów'], [13, '13 oddziałów'], [14, '14 oddziałów'], [21, '21 oddziałów'], [22, '22 oddziały']]);

  const host = document.createElement('div');
  document.body.appendChild(host);
  api.mountSiegeHud1E(host, {});
  api.setSiegeHudVisible(true);
  for (const n of counts) {
    api.updateSiegeHud1E({ cityName: 'Rzym', turn: 1, wallIntegrityPct: 45, wallDeltaPerTurn: 0,
      breachLabel: 'Wyłom', catapults: 1, rams: 0, infantry: 1, garrison: n, gateOpen: false });
    const row = host.querySelector('[data-siege-panel="right"]');
    const text = row?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    check(`HUD oblężenia odmienia liczebnik ${n}`, text.includes(expectedGarrisons.get(n)), text);
  }

  const unit = { Jednostka: 'Wojownik', Kategoria: 'Piechota', Epoka: 'Kamień', Atak: 1, Obrona: 1, Ruch: 1 };
  for (const n of counts) {
    const card = api.buildUnitRecruitCard({
      udef: unit,
      item: { kind: 'jednostka', id: unit.Jednostka, nazwa: unit.Jednostka, koszt: 10 },
      data: { units: [unit], buildings: [], civs: [], tech: [] }, skarb: 100, canPurchase: true,
      maxQuantity: 30, initialQuantity: n, treasuryIconHtml: '', onRecruit: () => true,
    });
    const title = card.querySelector('.unit-recruit-submit')?.title ?? '';
    if (n === 1) check('tooltip rekrutacji pojedynczej jednostki nie dopisuje liczby', title === 'Rekrutuj za 10 ze skarbca', title);
    else check(`tooltip rekrutacji odmienia ${n} jednostek`, title.startsWith(`Rekrutuj ${expectedUnits.get(n)} za ${10 * n} ze skarbca`), title);
  }

  for (const n of counts) {
    const researchHtml = api.__renderNaukaSection([{ name: 'Rzym', nauka: 5 }],
      { nauka: 10, naukaRate: 5 }, { targetLabel: 'Żegluga', kosztCelu: 80, pula: 10, postepFraction: 0.1, turnsLeft: n });
    const researchText = new JSDOM(researchHtml).window.document.body.textContent.replace(/\s+/g, ' ').trim();
    check(`panel imperium odmienia ETA badania na ${n}`, researchText.includes(`ETA ${expectedTurns.get(n)}`), researchText);

    const basketHtml = api.renderTradeBasketDealPreviewHtml([{ typ: 'zloto', id: 'zloto', ilosc: 2 }], [],
      { resourceTradeMode: 'per_turn', turns: n });
    const basketText = new JSDOM(basketHtml).window.document.body.textContent.replace(/\s+/g, ' ').trim();
    check(`podgląd wymiany odmienia ${n} tur`, basketText.includes(`Wymiana co turę przez ${expectedTurns.get(n)}`)
      && basketText.includes(`łącznie ${2 * n} ¤ przez ${expectedTurns.get(n)}`), basketText);
  }

  const skarbiecHtml = api.__renderSkarbiecSection([{ name: 'Rzym', pieniadz: 10, utrzymanieBudynkow: 12 }], {
    bogactwoWplywyBrutto: 10, bogactwoHandel: 0, bogactwoUtrzymanieBudynkow: 12,
    bogactwoUtrzymanieJednostek: 3, bogactwoUtrzymanieSurowcowBudynkow: {}, bogactwoRate: -5, bogactwo: 50,
  });
  const skarbiecText = new JSDOM(skarbiecHtml).window.document.body.textContent.replace(/\s+/g, ' ').trim();
  check('koszt budynków zachowuje kwotę i nazywa ją utrzymaniem', skarbiecText.includes('utrzymanie budynków: 12 ¤'), skarbiecText);
  check('łączny koszt nadal zachowuje wartości budynków i jednostek', skarbiecText.includes('15')
    && skarbiecText.includes('Utrzymanie budynków') && skarbiecText.includes('Utrzymanie jednostek'), skarbiecText);
  const indefiniteHtml = api.renderTradeBasketDealPreviewHtml([{ typ: 'zloto', id: 'zloto', ilosc: 2 }], [],
    { resourceTradeMode: 'per_turn' });
  const indefiniteText = new JSDOM(indefiniteHtml).window.document.body.textContent.replace(/\s+/g, ' ').trim();
  check('bezterminowa wymiana zachowuje neutralny podpis bez wartości null', indefiniteText.includes('Wymiana co turę')
    && !indefiniteText.includes('null') && !indefiniteText.includes('przez'), indefiniteText);

  api.setSiegeHudVisible(false);
  api.mountSiegeHud1E(host, {});
  const failed = checks.filter(item => !item.pass);
  console.log(`\nWynik: ${checks.length - failed.length} PASS / ${failed.length} FAIL`);
  if (failed.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  try { fs.unlinkSync(ENTRY); } catch {}
  try { fs.unlinkSync(BUNDLE); } catch {}
  dom.window.close();
});
