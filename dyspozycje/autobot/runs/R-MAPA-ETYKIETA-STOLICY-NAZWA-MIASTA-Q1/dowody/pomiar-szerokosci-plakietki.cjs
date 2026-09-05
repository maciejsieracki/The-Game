'use strict';
/**
 * pomiar-szerokosci-plakietki.cjs — R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 1, OBRONA.
 *
 * PO CO: zarzuty 2 i 3 Evaluatora twierdza, ze dwuczlonowa etykieta obcej stolicy nie miesci
 * sie w budzecie nazwy na plakietce i jest przycinana wielokropkiem — w skrajnym przypadku
 * do samej (uciętej) nazwy miasta, bez czlonu cywilizacji. Zrzut mapy pokazuje JEDEN seed
 * i JEDNA cywilizacje; ten pomiar pokazuje WSZYSTKIE 15, przed zmiana i po zmianie.
 *
 * CZEGO NIE ROBI: nie zmienia niczego w grze. Czyta wylacznie `gra/data/city-names-pools.json`
 * i odtwarza DOKLADNIE ten sam budzet i ten sam algorytm przycinania, ktory ma produkcja:
 *   - budzet:  `maxNameW = 200 - prodW - growthW - crownW`  (cityMapStatChip.ts:769)
 *   - stale:   CIV_SLOT_W=38 (poza budzetem nazwy), PROD_SLOT_W=20 (:88),
 *              CAPITAL_CROWN_SLOT_W=19 (:149)
 *   - font:    '700 22px Georgia, "Times New Roman", serif'  (cityMapStatChip.ts:751)
 *   - `truncateName` (cityMapStatChip.ts:716-729) — przepisany znak w znak
 *   - `name = (input.cityName || 'Miasto').trim().toUpperCase()` (:738)
 * Pomiar leci w ZYWYM Chromium (ten sam silnik tekstu co gra), nie w przyblizeniu.
 *
 * KOTWICA WIARYGODNOSCI: skrypt sam sprawdza, czy jego model przewiduje dokladnie ten
 * napis, ktory widac na zywym zrzucie z `zrzut-mapy.cjs` („QIN · CHINCZ…" dla Chinczykow
 * przy budzecie stolicy bez glifu produkcji). Rozjazd = model do wyrzucenia, nie dowod.
 *
 * Usage (z dowolnego katalogu):
 *   node dyspozycje/autobot/runs/<ID>/dowody/pomiar-szerokosci-plakietki.cjs
 */

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..', '..', '..', '..');
const GRA = path.join(REPO, 'gra');

let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch (e) { console.error('Brak playwright: ' + e.message); process.exit(1); }

function findChromiumExecutable() {
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort();
  for (const d of dirs.reverse()) {
    const p = path.join(base, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Separator jest jeden dla calej gry — czytamy go ze zrodla, zeby pomiar nie rozjechal sie
// z produkcja, gdyby ktos go kiedys zmienil.
const dnSrc = fs.readFileSync(path.join(GRA, 'src', 'game', 'display-names.ts'), 'utf8');
const sepMatch = dnSrc.match(/CITY_STATE_SEPARATOR\s*=\s*'([^']*)'/);
if (!sepMatch) throw new Error('Nie znalazlem CITY_STATE_SEPARATOR w display-names.ts');
const SEP = sepMatch[1];

const pools = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'city-names-pools.json'), 'utf8'));
const civKeys = Object.keys(pools).filter((k) => pools[k] && Array.isArray(pools[k].miasta_panstwa));

const CROWN_W = 19;   // CAPITAL_CROWN_SLOT_W
const PROD_W = 20;    // PROD_SLOT_W
const BUDGET_NO_PROD = 200 - CROWN_W;             // 181 — stolica, glif produkcji nieaktywny
const BUDGET_PROD = 200 - CROWN_W - PROD_W;       // 161 — stolica z aktywnym glifem produkcji

const rows = civKeys.map((k) => {
  const e = pools[k];
  const capital = e.miasta_panstwa[0];            // civ-names.ts:81-90 -> city-names-pool.ts:125-127
  const civ = e.nazwa_pl;
  return {
    key: k,
    before: String(civ).trim().toUpperCase(),                 // stan sprzed tematu
    after: `${capital}${SEP}${civ}`.trim().toUpperCase(),     // stan na galezi
    civUpper: String(civ).trim().toUpperCase(),
  };
});

(async () => {
  const execPath = findChromiumExecutable();
  const browser = await chromium.launch(
    execPath ? { executablePath: execPath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] },
  );
  const page = await browser.newPage();

  const out = await page.evaluate(({ rows, budgets, sep }) => {
    const FONT = '700 22px Georgia, "Times New Roman", serif';
    const ctx = document.createElement('canvas').getContext('2d');

    // truncateName — przepisane znak w znak z cityMapStatChip.ts:716-729
    function truncateName(name, maxW) {
      ctx.font = FONT;
      if (ctx.measureText(name).width <= maxW) return name;
      let s = name;
      while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
      return s + '…';
    }
    const w = (s) => { ctx.font = FONT; return ctx.measureText(s).width; };

    const fontsSeen = {
      georgiaDeklarowana: (document.fonts && document.fonts.check)
        ? document.fonts.check('700 22px Georgia') : null,
      // jesli Georgia nie jest zainstalowana, obie miary zejda sie na tym samym fallbacku
      probaGeorgia: (() => { ctx.font = '700 22px Georgia'; return ctx.measureText('BABILONCZYCY').width; })(),
      probaSerif: (() => { ctx.font = '700 22px serif'; return ctx.measureText('BABILONCZYCY').width; })(),
    };

    const res = rows.map((r) => {
      const o = { key: r.key, before: r.before, after: r.after, wBefore: w(r.before), wAfter: w(r.after) };
      o.budgets = budgets.map((b) => {
        const cutBefore = truncateName(r.before, b);
        const cutAfter = truncateName(r.after, b);
        const sepIdx = cutAfter.indexOf(sep.trim());
        // ile z czlonu cywilizacji faktycznie doleciało na ekran
        const tail = sepIdx >= 0 ? cutAfter.slice(sepIdx + sep.trim().length).replace(/^\s+/, '') : '';
        const civVisible = tail.replace(/…$/, '');
        return {
          budget: b,
          cutBefore, przycieteBefore: cutBefore !== r.before,
          cutAfter, przycieteAfter: cutAfter !== r.after,
          civCzlonWidoczny: civVisible.length,
          civCzlonPelny: cutAfter.endsWith(r.civUpper),
          separatorNaKoncu: /·\s*…?$/.test(cutAfter) || cutAfter.trim().endsWith('·'),
        };
      });
      return o;
    });
    return { fontsSeen, res };
  }, { rows, budgets: [BUDGET_NO_PROD, BUDGET_PROD], sep: SEP });

  await browser.close();

  console.log('FONT: 700 22px Georgia, "Times New Roman", serif');
  console.log('Georgia zainstalowana wg document.fonts.check: ' + out.fontsSeen.georgiaDeklarowana
    + '   (miara Georgia=' + out.fontsSeen.probaGeorgia.toFixed(1)
    + ' vs serif=' + out.fontsSeen.probaSerif.toFixed(1) + ')');
  console.log('BUDZET nazwy: bez glifu produkcji ' + BUDGET_NO_PROD + ' px, z glifem ' + BUDGET_PROD + ' px');
  console.log('');

  for (const b of [BUDGET_NO_PROD, BUDGET_PROD]) {
    console.log('=== BUDZET ' + b + ' px ===');
    let cutBefore = 0, cutAfter = 0, civZero = 0;
    for (const r of out.res) {
      const s = r.budgets.find((x) => x.budget === b);
      if (s.przycieteBefore) cutBefore++;
      if (s.przycieteAfter) cutAfter++;
      if (s.civCzlonWidoczny === 0) civZero++;
      console.log(
        r.key.padEnd(12)
        + ' PRZED: ' + (r.wBefore.toFixed(0) + 'px').padStart(6) + ' ' + (s.przycieteBefore ? 'CIETE  ' : 'calosc ')
        + JSON.stringify(s.cutBefore).padEnd(20)
        + ' | PO: ' + (r.wAfter.toFixed(0) + 'px').padStart(6) + ' ' + (s.przycieteAfter ? 'CIETE  ' : 'calosc ')
        + JSON.stringify(s.cutAfter).padEnd(30)
        + ' civ-czlon widoczny znakow: ' + s.civCzlonWidoczny,
      );
    }
    console.log('-> PRZED przycietych: ' + cutBefore + '/' + out.res.length
      + '   PO przycietych: ' + cutAfter + '/' + out.res.length
      + '   PO bez ANI JEDNEJ litery cywilizacji: ' + civZero + '/' + out.res.length);
    console.log('');
  }

  // KOTWICA: model kontra zywy zrzut z zrzut-mapy.cjs
  const chin = out.res.find((r) => r.key === 'chinczycy');
  const predykcja = chin.budgets.find((x) => x.budget === BUDGET_NO_PROD).cutAfter;
  console.log('KOTWICA (zywy zrzut mapy pokazal "QIN · CHINCZ…" dla Chinczykow, stolica bez glifu produkcji)');
  console.log('  model przewiduje: ' + JSON.stringify(predykcja));
  const ok = /^QIN\s*·\s*CHI./.test(predykcja.normalize('NFD').replace(/[̀-ͯ]/g, '')) && predykcja.endsWith('…');
  console.log('  zgodnosc modelu z zywym renderem: ' + (ok ? 'TAK' : 'NIE — model niewiarygodny'));
  process.exit(ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
