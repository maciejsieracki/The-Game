'use strict';
/**
 * diplomacy-city-name-test.cjs — R-WEB-UI-DIPLO-OFFER-CITY-NAMES-RAW-ID-Q1.
 *
 * Pozycja oferty 'miasto' niesie cityId (np. „City27”). Tekst dla gracza (koszyk, karta oferty
 * „Oni oferują”/„My oferujemy”, opis brief) ma pokazać NAZWĘ miasta, a przy jej braku
 * „miasto <cywilizacja>” — nigdy surowe id.
 *
 * Run: node tools/diplomacy-city-name-test.cjs   (z gra/)
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-city-name-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-city-name-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  nazwaMiastaDyplomacji,
  setDiplomacyCityNameResolver,
} from './game/diplomacy-city-name';
export { formatBasketItemBrief } from './game/diplomacy-display';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
});

const mod = require(BUNDLE);
let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('[FAIL]', msg);
}

// 1. Bez rejestru: surowe id NIGDY nie wraca do tekstu.
mod.setDiplomacyCityNameResolver(null);
ok(mod.nazwaMiastaDyplomacji('City27') === 'miasto', 'bez rejestru: City27 → „miasto”');
ok(mod.nazwaMiastaDyplomacji('City27') !== 'City27', 'bez rejestru: surowe id nie jest pokazywane');

// 2. Rejestr zwraca nazwę miasta.
const miasta = { City27: { name: 'Ateny', owner: 'grecy' }, City53: { name: '', owner: 'chinczycy' } };
mod.setDiplomacyCityNameResolver((id) => {
  const c = miasta[id];
  if (!c) return null;
  if (c.name) return c.name;
  return 'miasto ' + c.owner;
});
ok(mod.nazwaMiastaDyplomacji('City27') === 'Ateny', 'rejestr: City27 → Ateny');

// 3. Brak nazwy → „miasto <właściciel>”, nigdy id.
ok(mod.nazwaMiastaDyplomacji('City53') === 'miasto chinczycy', 'brak nazwy → „miasto <właściciel>”');

// 4. Nieznane miasto (zniszczone / brak w rejestrze) → zastępnik „miasto”.
ok(mod.nazwaMiastaDyplomacji('City999') === 'miasto', 'nieznane miasto → „miasto”');

// 5. Jawny cityLabel z pozycji ma pierwszeństwo nad rejestrem.
ok(mod.nazwaMiastaDyplomacji('City27', 'Memfis') === 'Memfis', 'cityLabel „Memfis” wygrywa z rejestrem');

// 6. cityLabel będący surowym id jest odrzucany (nie trafia do tekstu).
ok(mod.nazwaMiastaDyplomacji('City27', 'City27') === 'Ateny', 'cityLabel = surowe id → rejestr (Ateny)');

// 7. Resolver rzucający wyjątek nie psuje renderu.
mod.setDiplomacyCityNameResolver(() => { throw new Error('boom'); });
ok(mod.nazwaMiastaDyplomacji('City27') === 'miasto', 'wyjątek resolvera → „miasto”');
mod.setDiplomacyCityNameResolver(null);

// 8. Opis brief oferty (panel PW, powiadomienia) — nie zawiera surowego id.
mod.setDiplomacyCityNameResolver((id) => (id === 'City27' ? 'Ateny' : null));
const brief = mod.formatBasketItemBrief({ typ: 'miasto', id: 'City27', ilosc: 1, cityPn: 500 });
ok(brief.includes('Ateny'), 'brief miasta zawiera nazwę: ' + brief);
ok(!/City\d+/.test(brief), 'brief miasta bez surowego id: ' + brief);
const briefBrak = mod.formatBasketItemBrief({ typ: 'miasto', id: 'City77', ilosc: 1 });
ok(!/City\d+/.test(briefBrak), 'brief nieznanego miasta bez surowego id: ' + briefBrak);
mod.setDiplomacyCityNameResolver(null);

(async () => {
// 9. Karta oferty (UI, „Oni oferują”/„My oferujemy”) — renderer HTML z nazwą miasta.
const UI_ENTRY = path.resolve(SRC, '.dip-city-name-ui-entry.ts');
const UI_BUNDLE = path.resolve(__dirname, '.dip-city-name-ui-bundle.cjs');
fs.writeFileSync(UI_ENTRY, `export { renderBasketItemValueHtml } from './ui/diplomacyDealDisplay';\nexport { setDiplomacyCityNameResolver } from './game/diplomacy-city-name';\n`);
const brandStubPlugin = {
  name: 'brand-assets-stub',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brand-assets-stub', namespace: 'stub' }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export function brandIconSvg(){return "";} export function mapResourceIconSvg(){return "";}',
      loader: 'js',
    }));
  },
};
await esbuild.build({
  entryPoints: [UI_ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: UI_BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
  plugins: [brandStubPlugin],
});
const uiMod = require(UI_BUNDLE);
uiMod.setDiplomacyCityNameResolver((id) => (id === 'City27' ? 'Ateny' : null));
const htmlMiasto = uiMod.renderBasketItemValueHtml(
  { typ: 'miasto', id: 'City27', ilosc: 1, cityPn: 500 },
  { perTurn: false },
);
ok(htmlMiasto.includes('Ateny'), 'karta oferty pokazuje nazwę miasta: ' + htmlMiasto);
ok(!/City\d+/.test(htmlMiasto), 'karta oferty bez surowego id: ' + htmlMiasto);
const htmlBrak = uiMod.renderBasketItemValueHtml(
  { typ: 'miasto', id: 'City53', ilosc: 1 },
  { perTurn: false },
);
ok(!/City\d+/.test(htmlBrak) && htmlBrak.includes('miasto'), 'karta oferty nieznanego miasta bez id: ' + htmlBrak);
uiMod.setDiplomacyCityNameResolver(null);
try { fs.unlinkSync(UI_ENTRY); } catch (_) { /* sprzątanie entry */ }



console.log(`[diplomacy-city-name-test] ${pass} pass / ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (_) { /* sprzątanie entry */ }
process.exit(fail === 0 ? 0 : 1);
})();
