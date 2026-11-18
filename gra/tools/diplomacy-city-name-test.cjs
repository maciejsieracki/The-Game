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
    // Vite-owy import.meta.glob (np. portrety w diplomacyTradeBasket → civ-portraits) → pusta mapa.
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const source = fs.readFileSync(args.path, 'utf8');
      if (!source.includes('import.meta.glob')) return undefined;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + source.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: [
        'brandIconSvg', 'improvementIconSvg', 'mapResourceIconSvg', 'terrainIconSvg',
        'buildingIconSvg', 'unitIconSvg', 'civIconSvg', 'epochIconSvg', 'settingIconSvg',
        'brandMenuComponentsCss', 'menuIconSvg', 'brandMenuEmblemSvg', 'newGameIntroEmblemSvg',
        'brandMotionCss', 'brandMenuBackgroundCss', 'svgThumbHtml',
      ].map((n) => `export function ${n}(){return "";}`).join('\n'),
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

// 10. Koszyk (diplomacyTradeBasket.ts, renderBasketItemValueHtml) — ta sama nazwa miasta, nie surowe id.
const BASKET_ENTRY = path.resolve(SRC, '.dip-city-name-basket-entry.ts');
const BASKET_BUNDLE = path.resolve(__dirname, '.dip-city-name-basket-bundle.cjs');
fs.writeFileSync(BASKET_ENTRY, `export { renderBasketItemValueHtml } from './ui/diplomacyTradeBasket';\nexport { setDiplomacyCityNameResolver } from './game/diplomacy-city-name';\n`);
await esbuild.build({
  entryPoints: [BASKET_ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BASKET_BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
  plugins: [brandStubPlugin],
});
const basketMod = require(BASKET_BUNDLE);
basketMod.setDiplomacyCityNameResolver((id) => (id === 'City27' ? 'Ateny' : null));
const htmlKoszyk = basketMod.renderBasketItemValueHtml(
  { typ: 'miasto', id: 'City27', ilosc: 1, cityPn: 500 },
  { perTurn: false },
);
ok(htmlKoszyk.includes('Ateny'), 'koszyk pokazuje nazwę miasta: ' + htmlKoszyk);
ok(!/City\d+/.test(htmlKoszyk), 'koszyk bez surowego id: ' + htmlKoszyk);
const htmlKoszykBrak = basketMod.renderBasketItemValueHtml(
  { typ: 'miasto', id: 'City53', ilosc: 1, cityLabel: 'City53' },
  { perTurn: false },
);
ok(!/City\d+/.test(htmlKoszykBrak) && htmlKoszykBrak.includes('miasto'), 'koszyk nieznanego miasta bez id: ' + htmlKoszykBrak);
basketMod.setDiplomacyCityNameResolver(null);
try { fs.unlinkSync(BASKET_ENTRY); } catch (_) { /* sprzątanie entry */ }
try { fs.unlinkSync(BASKET_BUNDLE); } catch (_) { /* sprzątanie bundla */ }
try { fs.unlinkSync(UI_BUNDLE); } catch (_) { /* sprzątanie bundla */ }

// 11. Rejestracja resolvera w main.ts (closure nad `cities`, nie da się zaimportować) — test statyczny
// wiązania: ta sama reguła co w teście 2–3 (nazwa miasta → „miasto <cywilizacja właściciela>").
const MAIN_SRC = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
ok(/setDiplomacyCityNameResolver\(\(cityId: string\) => \{/.test(MAIN_SRC), 'main.ts: rejestracja resolvera nazw miast');
ok(/const c = cities\.find\(x => x\.id === cityId\);\s*\n\s*if \(!c\) return null;/.test(MAIN_SRC), 'main.ts: resolver szuka miasta po id');
ok(/return 'miasto ' \+ nazwaCywilizacji\(civTypeForOwner\(c\.ownerId\)\);/.test(MAIN_SRC), 'main.ts: brak nazwy → „miasto <cywilizacja>”');

console.log(`[diplomacy-city-name-test] ${pass} pass / ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (_) { /* sprzątanie entry */ }
process.exit(fail === 0 ? 0 : 1);
})();
