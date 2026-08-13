'use strict';
/**
 * diplomacy-basket-duplicate-test.cjs — P-DYPLOMACJA-DUPLIKAT-PROPOZYCJI-W-OFERCIE
 * (dyspozycje/PYTANIA-OTWARTE.md, punkt 2, zrzut właściciela: 4× "Obróbka drewna" jako
 * osobne pozycje w koszyku "Umowa wymiany surowców" po 4-krotnym kliknięciu "+ DODAJ
 * PROPOZYCJĘ" dla tej samej technologii).
 *
 * Testuje `addOrMergeBasketItem` (diplomacyTradeBasket.ts) — funkcję wywoływaną przez
 * handler `.cdb-add-btn` przy KAŻDYM kliknięciu "Dodaj" poza trybem edycji:
 *  - typy BEZ pola ilości (tech/jednostka/zloze/surowiec_boolean — jedna technologia/
 *    jednostka/dostęp to jedna, niepodzielna oferta) -> drugie dodanie tej samej pozycji
 *    jest BLOKOWANE, koszyk zostaje identyczny (bez drugiego wiersza-duplikatu);
 *  - typy z sumowalną ilością (zloto/praca/zywnosc/surowiec_ilosc) -> drugie dodanie tej
 *    samej pozycji SUMUJE ilość z istniejącą, zamiast dokładać osobny wiersz — przycięte
 *    do tego samego limitu co ręczna zmiana ilości w wierszu (`basketItemMaxQty`);
 *  - pozycje o RÓŻNEJ tożsamości (inny typ, inny id, inne miasto dla żywności) muszą zostać
 *    dodane jako osobne wiersze — naprawa nie może scalać/blokować niepowiązanych ofert.
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const STUB_DIR = path.resolve(__dirname, '.stubs');
const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'leaderPortraits-basket-dup-stub.ts');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'brandAssets-basket-dup-stub.ts');
fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(
  LEADER_PORTRAITS_STUB,
  [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return null; }",
    "export function leaderNameFromPool() { return null; }",
    "export function civDisplayNameFromKey() { return null; }",
    "export function civCardDisplayName(label) { return label; }",
    "export function civIconIdFromCivLabel() { return null; }",
  ].join('\n'),
  'utf8',
);
fs.writeFileSync(
  BRAND_ASSETS_STUB,
  [
    "export function brandIconSvg() { return ''; }",
    "export function improvementIconSvg() { return ''; }",
    "export function mapResourceIconSvg() { return ''; }",
    "export function terrainIconSvg() { return ''; }",
    "export function buildingIconSvg() { return ''; }",
    "export function unitIconSvg() { return ''; }",
    "export function civIconSvg() { return ''; }",
    "export function epochIconSvg() { return ''; }",
    "export function settingIconSvg() { return ''; }",
    "export function brandMenuComponentsCss() { return ''; }",
    "export function menuIconSvg() { return ''; }",
    "export function brandMenuEmblemSvg() { return ''; }",
    "export function newGameIntroEmblemSvg() { return ''; }",
    "export function brandMotionCss() { return ''; }",
    "export function brandMenuBackgroundCss() { return ''; }",
    "export function svgThumbHtml() { return ''; }",
  ].join('\n'),
  'utf8',
);

const BUNDLE = path.resolve(__dirname, '.dip-basket-dup-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-basket-dup-entry.ts');
fs.writeFileSync(entryFile, `
export {
  addOrMergeBasketItem,
} from '../src/ui/diplomacyTradeBasket.ts';
`);

const stubViteAssetsPlugin = {
  name: 'stub-vite-assets',
  setup(build) {
    build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB }));
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
  },
};

async function main() {
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
    plugins: [stubViteAssetsPlugin],
  });

  const { addOrMergeBasketItem } = require(BUNDLE);

  let pass = 0;
  let fail = 0;
  function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

  console.log('diplomacy-basket-duplicate-test');

  function baseCtx(over) {
    return Object.assign({ civName: 'Test', relacjaTotal: 150, playerSkarbiec: 1000 }, over || {});
  }

  // --- 1) Realny przypadek zrzutu: tech "Obróbka drewna" dodana 4×, ta sama strona ---
  {
    let give = [];
    const techItem = { typ: 'tech', id: 'Obróbka drewna' };
    for (let i = 0; i < 4; i++) {
      give = addOrMergeBasketItem(give, { ...techItem }, 'give', baseCtx());
    }
    ok(give.length === 1, '4x dodanie tej samej technologii → 1 pozycja w koszyku (nie 4)');
    ok(give[0].typ === 'tech' && give[0].id === 'Obróbka drewna', 'pozostała pozycja to nadal ta technologia');
  }

  // --- 2) tech: różne id NIE są traktowane jak duplikat ---
  {
    let give = [];
    give = addOrMergeBasketItem(give, { typ: 'tech', id: 'Obróbka drewna' }, 'give', baseCtx());
    give = addOrMergeBasketItem(give, { typ: 'tech', id: 'Kolo' }, 'give', baseCtx());
    ok(give.length === 2, 'dwie RÓŻNE technologie → dwie osobne pozycje');
  }

  // --- 3) jednostka: duplikat blokowany (brak pola ilości, ta sama logika co tech) ---
  {
    let give = [];
    give = addOrMergeBasketItem(give, { typ: 'jednostka', id: 'Hastati' }, 'give', baseCtx());
    give = addOrMergeBasketItem(give, { typ: 'jednostka', id: 'Hastati' }, 'give', baseCtx());
    ok(give.length === 1, 'jednostka: 2x dodanie tej samej → 1 pozycja (blokada duplikatu)');
  }

  // --- 4) zloze / surowiec_boolean: duplikat blokowany ---
  {
    let give = addOrMergeBasketItem([], { typ: 'zloze', id: 'zelazo' }, 'give', baseCtx());
    give = addOrMergeBasketItem(give, { typ: 'zloze', id: 'zelazo' }, 'give', baseCtx());
    ok(give.length === 1, 'zloze: duplikat blokowany');

    let recv = addOrMergeBasketItem([], { typ: 'surowiec_boolean', id: 'kamien' }, 'receive', baseCtx());
    recv = addOrMergeBasketItem(recv, { typ: 'surowiec_boolean', id: 'kamien' }, 'receive', baseCtx());
    ok(recv.length === 1, 'surowiec_boolean: duplikat blokowany');
  }

  // --- 5) zloto: duplikat SUMUJE ilość (nie tworzy drugiego wiersza) ---
  {
    let give = addOrMergeBasketItem([], { typ: 'zloto', id: 'zloto', ilosc: 20 }, 'give', baseCtx({ playerSkarbiec: 1000 }));
    give = addOrMergeBasketItem(give, { typ: 'zloto', id: 'zloto', ilosc: 30 }, 'give', baseCtx({ playerSkarbiec: 1000 }));
    ok(give.length === 1, 'zloto: 2x dodanie → 1 pozycja (zsumowana)');
    ok(give[0].ilosc === 50, 'zloto: ilość zsumowana 20+30=50 (got ' + give[0].ilosc + ')');
  }

  // --- 6) zloto: suma przycięta do skarbca gracza (side=give), tak jak ręczna zmiana ilości ---
  {
    let give = addOrMergeBasketItem([], { typ: 'zloto', id: 'zloto', ilosc: 80 }, 'give', baseCtx({ playerSkarbiec: 100 }));
    give = addOrMergeBasketItem(give, { typ: 'zloto', id: 'zloto', ilosc: 80 }, 'give', baseCtx({ playerSkarbiec: 100 }));
    ok(give.length === 1, 'zloto (limit skarbca): nadal 1 pozycja');
    ok(give[0].ilosc === 100, 'zloto (limit skarbca): suma 80+80=160 przycięta do skarbca 100 (got ' + give[0].ilosc + ')');
  }

  // --- 7) surowiec_ilosc: duplikat SUMUJE ilość, przycięty do maxQty z opcji kontekstu ---
  {
    const ctx = baseCtx({
      giveQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 500 }],
    });
    let give = addOrMergeBasketItem([], { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 300 }, 'give', ctx);
    give = addOrMergeBasketItem(give, { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 300 }, 'give', ctx);
    ok(give.length === 1, 'surowiec_ilosc: 2x dodanie tego samego surowca → 1 pozycja');
    ok(give[0].ilosc === 500, 'surowiec_ilosc: suma 300+300=600 przycięta do maxQty 500 (got ' + give[0].ilosc + ')');

    // Inny surowiec (inny id) pozostaje osobną pozycją.
    give = addOrMergeBasketItem(give, { typ: 'surowiec_ilosc', id: 'kamien', ilosc: 10 }, 'give', ctx);
    ok(give.length === 2, 'surowiec_ilosc: inny surowiec (inny id) → osobna pozycja');
  }

  // --- 7b. R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): suma przycięta do maxQty NIEBĘDĄCEGO
  // wielokrotnością kroku (5 szt.) floruje w dół dodatkowo, po przycięciu — 137 (nie 135/140).
  {
    const ctx = baseCtx({
      giveQuantityResourceOptions: [{ id: 'drewno', label: 'Drewno', maxQty: 137 }],
    });
    let give = addOrMergeBasketItem([], { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 100 }, 'give', ctx);
    give = addOrMergeBasketItem(give, { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 100 }, 'give', ctx);
    ok(give.length === 1, 'surowiec_ilosc krok5: 2x dodanie → 1 pozycja');
    ok(give[0].ilosc === 135,
      'surowiec_ilosc krok5: suma 100+100=200 przycięta do maxQty 137, floor do 135 (got ' + give[0].ilosc + ')');
  }

  // --- 8) zywnosc: sumuje TYLKO dla tego samego miasta; inne miasto = osobna pozycja ---
  {
    let give = addOrMergeBasketItem([], { typ: 'zywnosc', id: 'city1', cityId: 'city1', ilosc: 40 }, 'give', baseCtx());
    give = addOrMergeBasketItem(give, { typ: 'zywnosc', id: 'city1', cityId: 'city1', ilosc: 25 }, 'give', baseCtx());
    ok(give.length === 1, 'zywnosc: to samo miasto 2x → 1 pozycja');
    ok(give[0].ilosc === 65, 'zywnosc: ilość zsumowana 40+25=65 dla tego samego miasta (got ' + give[0].ilosc + ')');

    give = addOrMergeBasketItem(give, { typ: 'zywnosc', id: 'city2', cityId: 'city2', ilosc: 10 }, 'give', baseCtx());
    ok(give.length === 2, 'zywnosc: inne miasto → osobna pozycja (nie sumowana z city1)');
  }

  // --- 9) give i receive są niezależne — dodanie tej samej tech po obu stronach nie koliduje ---
  {
    const techItem = { typ: 'tech', id: 'Garncarstwo' };
    const give = addOrMergeBasketItem([], { ...techItem }, 'give', baseCtx());
    const recv = addOrMergeBasketItem([], { ...techItem }, 'receive', baseCtx());
    ok(give.length === 1 && recv.length === 1, 'give i receive niezależne — po 1 pozycji każda');
  }

  try { fs.unlinkSync(entryFile); } catch (_) { /* ok */ }
  try { fs.unlinkSync(LEADER_PORTRAITS_STUB); } catch (_) { /* ok */ }
  try { fs.unlinkSync(BRAND_ASSETS_STUB); } catch (_) { /* ok */ }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
