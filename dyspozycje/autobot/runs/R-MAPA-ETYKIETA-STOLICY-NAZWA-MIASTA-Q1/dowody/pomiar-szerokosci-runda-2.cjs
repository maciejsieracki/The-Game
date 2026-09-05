'use strict';
/**
 * pomiar-szerokosci-runda-2.cjs — R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 2.
 *
 * PO CO: kryterium konca rundy 2 brzmi „ile z 15 stolic jest przycietych po tej zmianie,
 * oczekiwane 0". Zrzut pokazuje JEDEN seed i JEDNA cywilizacje; ten pomiar pokazuje
 * WSZYSTKIE 15 w TRZECH stanach, ktore realnie istnialy:
 *   PRZED  — nazwa CYWILIZACJI na plakietce (stan sprzed tematu, MAP-UX-CLUSTER-LABEL-Q1);
 *   R1     — dwa czlony `miasta_panstwa[0] · cywilizacja` (odrzucone po pomiarze rundy 1);
 *   R2     — sama nazwa miasta = `miasta_cywilizacji[0]` (stan tej rundy, R2-1 + R2-2).
 *
 * CZEGO NIE ROBI: nie zmienia niczego w grze. Czyta wylacznie `gra/data/city-names-pools.json`
 * i odtwarza DOKLADNIE ten sam budzet i ten sam algorytm przycinania co produkcja:
 *   - budzet:  `maxNameW = 200 - prodW - growthW - crownW`  (cityMapStatChip.ts:769)
 *   - stale:   PROD_SLOT_W=20, CAPITAL_CROWN_SLOT_W=19 (CIV_SLOT_W jest poza budzetem nazwy)
 *   - font:    '700 22px Georgia, "Times New Roman", serif'  (cityMapStatChip.ts:751)
 *   - `truncateName` (cityMapStatChip.ts:716-729) — przepisany znak w znak
 *   - `name = (input.cityName || 'Miasto').trim().toUpperCase()` (:738)
 * Pomiar leci w ZYWYM Chromium (ten sam silnik tekstu co gra), nie w przyblizeniu.
 *
 * KOTWICA WIARYGODNOSCI (ta sama co w rundzie 1): model musi przewidziec dokladnie napis,
 * ktory widac na zywym zrzucie gałęzi rundy 1 — „QIN · CHINCZ…" dla Chinczykow przy budzecie
 * stolicy bez glifu produkcji. Rozjazd = model do wyrzucenia, nie dowod.
 *
 * Usage:  node dyspozycje/autobot/runs/<ID>/dowody/pomiar-szerokosci-runda-2.cjs
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
  const civ = String(e.nazwa_pl).trim();
  return {
    key: k,
    przed: civ.toUpperCase(),                                        // stan sprzed tematu
    r1: `${e.miasta_panstwa[0]}${SEP}${civ}`.trim().toUpperCase(),   // galaz rundy 1
    r2: String(e.miasta_cywilizacji[0]).trim().toUpperCase(),        // stan rundy 2
  };
});

(async () => {
  const execPath = findChromiumExecutable();
  const browser = await chromium.launch(
    execPath ? { executablePath: execPath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] },
  );
  const page = await browser.newPage();

  const out = await page.evaluate(({ rows, budgets }) => {
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

    const res = rows.map((r) => ({
      key: r.key,
      warianty: ['przed', 'r1', 'r2'].map((v) => ({
        wariant: v,
        text: r[v],
        width: w(r[v]),
        cuts: budgets.map((b) => ({ budget: b, cut: truncateName(r[v], b) })),
      })),
    }));
    const georgia = (document.fonts && document.fonts.check)
      ? document.fonts.check('700 22px Georgia') : null;
    return { georgia, res, w: null };
  }, { rows, budgets: [BUDGET_NO_PROD, BUDGET_PROD] });

  // KONTEKST: przycinanie dlugiej nazwy MIASTA nie jest wlasnoscia tego tematu — dotyczy
  // kazdego miasta na mapie, takze wlasnego. Mierzymy cala pule (15 x 100 nazw), zeby
  // odroznic „zmiana psuje plakietke" od „ta nazwa jest po prostu dluga".
  const wszystkie = [];
  for (const k of civKeys) for (const n of pools[k].miasta_cywilizacji) wszystkie.push(String(n).trim().toUpperCase());
  const kontekst = await page.evaluate(({ names, budget }) => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = '700 22px Georgia, "Times New Roman", serif';
    let over = 0;
    for (const n of names) if (ctx.measureText(n).width > budget) over++;
    return { over, total: names.length };
  }, { names: wszystkie, budget: BUDGET_NO_PROD });

  await browser.close();

  console.log('FONT: 700 22px Georgia, "Times New Roman", serif   (Georgia zainstalowana: '
    + out.georgia + ')');
  console.log('BUDZET nazwy: bez glifu produkcji ' + BUDGET_NO_PROD
    + ' px, z glifem ' + BUDGET_PROD + ' px\n');

  const licznik = {};
  for (const b of [BUDGET_NO_PROD, BUDGET_PROD]) {
    console.log('=== BUDZET ' + b + ' px ===');
    const cnt = { przed: 0, r1: 0, r2: 0 };
    for (const r of out.res) {
      const line = [r.key.padEnd(12)];
      for (const v of r.warianty) {
        const s = v.cuts.find((x) => x.budget === b);
        const przyciete = s.cut !== v.text;
        if (przyciete) cnt[v.wariant]++;
        line.push(v.wariant.toUpperCase() + ': ' + (v.width.toFixed(0) + 'px').padStart(6) + ' '
          + (przyciete ? 'CIETE  ' : 'calosc ') + JSON.stringify(s.cut).padEnd(28));
      }
      console.log(line.join(' | '));
    }
    console.log('-> PRZYCIETE  przed: ' + cnt.przed + '/' + out.res.length
      + '   runda 1: ' + cnt.r1 + '/' + out.res.length
      + '   runda 2: ' + cnt.r2 + '/' + out.res.length + '\n');
    licznik[b] = cnt;
  }

  // KOTWICA: model kontra zywy zrzut galezi rundy 1
  const chin = out.res.find((r) => r.key === 'chinczycy');
  const r1cut = chin.warianty.find((v) => v.wariant === 'r1')
    .cuts.find((x) => x.budget === BUDGET_NO_PROD).cut;
  const ok = /^QIN\s*·\s*CHI./.test(r1cut.normalize('NFD').replace(/[̀-ͯ]/g, ''))
    && r1cut.endsWith('…');
  console.log('KOTWICA (zywy zrzut rundy 1 pokazal "QIN · CHINCZ…"): model przewiduje '
    + JSON.stringify(r1cut) + ' -> ' + (ok ? 'ZGODNY' : 'ROZJAZD, model niewiarygodny'));

  console.log('KONTEKST: nazw miast w calej puli (' + kontekst.total + ') dluzszych niz budzet '
    + BUDGET_NO_PROD + ' px: ' + kontekst.over
    + '  — przycinanie dlugiej nazwy miasta dotyczy KAZDEGO miasta, takze wlasnego gracza.');

  const zero = licznik[BUDGET_NO_PROD].r2 === 0 && licznik[BUDGET_PROD].r2 === 0;
  console.log('KRYTERIUM RUNDY 2 (0/15 przycietych w obu budzetach): ' + (zero ? 'SPELNIONE' : 'NIESPELNIONE'));
  process.exit(ok && zero ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
