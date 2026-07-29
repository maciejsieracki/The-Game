'use strict';
/**
 * Screenshot koszyka wymiany surowców (chip UX) — statyczny HTML z ikonami z gry.
 * Uruchom z gra/: node tools/capture-trade-basket-preview.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const ROOT = path.resolve(GRA, '..');
const OUT = path.join(ROOT, 'docs/ux/preview-dyplomacja');
const TMP = path.join(OUT, '_tmp');
const HTML = path.join(TMP, 'preview.html');
const ICONS = path.join(GRA, 'src/ui/icons/brand');

function readSvg(relPath, size = 24) {
  const full = path.join(ICONS, relPath);
  if (!fs.existsSync(full)) return '';
  let raw = fs.readFileSync(full, 'utf8');
  raw = raw.replace(/\swidth="[^"]*"/, ` width="${size}"`).replace(/\sheight="[^"]*"/, ` height="${size}"`);
  return raw;
}

function icWrap(svg) {
  return svg ? `<span class="cdb-chip-ic">${svg}</span>` : '';
}

function chip(cls, selected, icon, label, extra = '') {
  return `<button type="button" class="cdb-chip ${cls}${selected ? ' selected' : ''}"${extra}>${icWrap(icon)}<span class="cdb-chip-lbl">${label}</span></button>`;
}

function qtyStepper(value) {
  return `<div class="cdb-qty-stepper">
    <button type="button" class="cdb-qty-step dip-muted-btn">+1</button>
    <button type="button" class="cdb-qty-step dip-muted-btn">+10</button>
    <button type="button" class="cdb-qty-step dip-muted-btn">+100</button>
    <input type="number" value="${value}" min="1" />
  </div>`;
}

function buildHtml() {
  const gold = readSvg('resources-map/res-gold.svg');
  const work = readSvg('tier1/res-work-24.svg');
  const food = readSvg('tier1/res-food-24.svg');
  const wood = readSvg('resources-map/res-wood.svg');
  const stone = readSvg('resources-map/res-stone.svg');
  const clay = readSvg('resources-map/res-clay.svg');
  const brick = readSvg('resources-map/res-brick.svg');
  const science = readSvg('tier1/res-science-24.svg');
  const crate = readSvg('tier4/chip-crate-24.svg') || readSvg('tier4/chip-crate.svg');
  const endTurn = readSvg('tier5/ui-end-turn-24.svg');

  const typChipsGive =
    chip('cdb-chip-typ', true, gold, 'Pieniądze') +
    chip('cdb-chip-typ', false, work, 'Praca') +
    chip('cdb-chip-typ', false, food, 'Żywność') +
    chip('cdb-chip-typ', false, wood, 'Surowiec') +
    chip('cdb-chip-typ', false, science, 'Technologia');

  const typChipsRecv =
    chip('cdb-chip-typ', false, gold, 'Pieniądze') +
    chip('cdb-chip-typ', false, work, 'Praca') +
    chip('cdb-chip-typ', false, food, 'Żywność') +
    chip('cdb-chip-typ selected', true, wood, 'Surowiec') +
    chip('cdb-chip-typ', false, science, 'Technologia');

  const resChips =
    chip('cdb-chip-resqty', true, wood, 'Drewno') +
    chip('cdb-chip-resqty', false, stone, 'Kamień') +
    chip('cdb-chip-resqty', false, clay, 'Glina') +
    chip('cdb-chip-resqty', false, brick, 'Cegła');

  const modeChips =
    chip('cdb-chip-mode', false, crate, 'Jednorazowo') +
    chip('cdb-chip-mode selected', true, endTurn, 'Co turę');

  const turnChips = [5, 10, 15, 20].map(t =>
    `<button type="button" class="cdb-chip cdb-chip-turn${t === 10 ? ' selected' : ''}">${t}</button>`,
  ).join('');

  return `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">
<title>Koszyk wymiany — podgląd</title>
<style>
html,body{margin:0;background:#0a0c10;min-height:100vh;font-family:'Segoe UI',Tahoma,sans-serif;}
.civ-diplo-basket-overlay{position:fixed;inset:0;z-index:515;background:rgba(0,0,0,0.65);
  display:flex;align-items:center;justify-content:center;padding:12px;}
.civ-diplo-basket{background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98));
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:18px 20px;max-width:760px;width:100%;
  color:#e8e0c8;font:14px 'Segoe UI',Tahoma,sans-serif;}
.civ-diplo-basket h3{margin:0 0 6px;font-family:Georgia,serif;font-size:1.05em;color:#e8d88a;}
.civ-diplo-basket .cdb-sub{font-size:0.75em;color:#8a8070;margin-bottom:10px;line-height:1.45;}
.civ-diplo-basket .cdb-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.civ-diplo-basket .cdb-col{border:1px solid rgba(232,216,138,.2);border-radius:8px;padding:10px;}
.civ-diplo-basket .cdb-col-title{font-size:0.72em;color:#a8a090;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em;}
.civ-diplo-basket .cdb-deal-settings{margin:10px 0 4px;display:flex;flex-direction:column;gap:8px;
  padding:10px;border-radius:8px;border:1px solid rgba(232,216,138,.22);background:rgba(24,30,40,0.55);}
.civ-diplo-basket .cdb-deal-settings-title{font-size:0.72em;color:#e8d88a;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em;}
.civ-diplo-basket .cdb-duration{margin-top:6px;padding-top:8px;border-top:1px dashed rgba(232,216,138,.15);}
.civ-diplo-basket label{display:block;margin:4px 0 2px;font-size:0.72em;color:#a8a090;}
.civ-diplo-basket .cdb-chip-grid{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px;}
.civ-diplo-basket .cdb-chip{display:inline-flex;flex-direction:column;align-items:center;gap:3px;
  min-width:62px;padding:7px 8px;border-radius:8px;border:1px solid rgba(232,216,138,.22);
  background:rgba(18,22,30,.85);color:#c8b898;cursor:pointer;font:inherit;font-size:0.68em;}
.civ-diplo-basket .cdb-chip.selected{border-color:rgba(232,216,138,.65);
  background:rgba(40,48,64,.95);color:#f0e8d8;box-shadow:0 0 0 1px rgba(232,216,138,.25);}
.civ-diplo-basket .cdb-chip-ic{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;}
.civ-diplo-basket .cdb-chip-lbl{text-align:center;line-height:1.2;max-width:72px;}
.civ-diplo-basket .cdb-chip-row{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0;}
.civ-diplo-basket .cdb-chip.cdb-chip-mode{flex-direction:row;min-width:0;padding:8px 12px;gap:6px;font-size:0.78em;}
.civ-diplo-basket .cdb-chip.cdb-chip-turn{min-width:36px;padding:6px 10px;font-size:0.78em;font-weight:600;}
.civ-diplo-basket .cdb-qty-stepper{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin:4px 0;}
.civ-diplo-basket .cdb-qty-step{padding:5px 9px;font-size:0.72em;min-width:42px;
  border-radius:6px;border:1px solid rgba(232,216,138,.28);background:rgba(10,12,18,0.9);color:#e8e0c8;}
.civ-diplo-basket .cdb-qty-stepper input{flex:1;min-width:72px;max-width:110px;padding:5px 7px;border-radius:6px;
  border:1px solid rgba(232,216,138,.28);background:rgba(10,12,18,0.9);color:#e8e0c8;font:inherit;}
.civ-diplo-basket .cdb-add-section{margin:6px 0 4px;}
.civ-diplo-basket .cdb-add-section-title{font-size:0.7em;color:#a8a090;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em;}
.civ-diplo-basket .cdb-add-btn{margin-top:6px;padding:8px 14px;border-radius:6px;border:1px solid rgba(232,216,138,.45);
  background:linear-gradient(180deg,rgba(80,70,40,.8),rgba(50,42,24,.9));color:#f0e8d8;font:inherit;cursor:pointer;}
.civ-diplo-basket .da-deal-table{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
.civ-diplo-basket .da-deal-col{border:1px solid rgba(232,216,138,.16);border-radius:8px;padding:8px 9px;
  background:linear-gradient(180deg,rgba(18,22,32,.85),rgba(8,10,16,.75));}
.civ-diplo-basket .da-deal-col-we{border-color:rgba(110,150,220,.28);}
.civ-diplo-basket .da-deal-col-they{border-color:rgba(90,208,122,.32);}
.civ-diplo-basket .da-deal-col-head{font-size:0.72em;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  text-align:center;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,.06);}
.civ-diplo-basket .da-deal-col-we .da-deal-col-head{color:#8ab4e8;}
.civ-diplo-basket .da-deal-col-they .da-deal-col-head{color:#7ad0a0;}
.civ-diplo-basket .da-deal-item{display:flex;align-items:center;gap:6px;font-size:0.92em;}
.civ-diplo-basket .da-deal-amt{font-weight:600;color:#f0e8d8;}
.civ-diplo-basket .da-deal-per{font-size:0.92em;color:#9ad4b0;}
.civ-diplo-basket .da-deal-sched-foot{margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06);
  font-size:0.82em;color:#b8a888;text-align:center;}
.civ-diplo-basket .cdb-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}
.civ-diplo-basket .dip-muted-btn{padding:8px 14px;border-radius:6px;border:1px solid rgba(232,216,138,.25);
  background:rgba(30,36,48,.8);color:#c8b898;font:inherit;}
</style></head><body>
<div class="civ-diplo-basket-overlay">
<div class="civ-diplo-basket">
  <h3>Wymiana surowców</h3>
  <div class="cdb-sub">Wymiana dwostronna · Rel ≥ 100 · partner: <strong>Sparta</strong></div>
  <div class="da-deal-table">
    <div class="da-deal-col da-deal-col-we">
      <div class="da-deal-col-head">Oferujemy</div>
      <div class="da-deal-item">${icWrap(gold)}<span class="da-deal-amt">50 ¤</span><span class="da-deal-per">jednorazowo</span></div>
    </div>
    <div class="da-deal-col da-deal-col-they">
      <div class="da-deal-col-head">Oferują</div>
      <div class="da-deal-item">${icWrap(wood)}<span class="da-deal-amt">72 Drewno</span><span class="da-deal-per">na turę</span></div>
    </div>
  </div>
  <div class="da-deal-sched-foot">Wymiana co turę przez 10 tur</div>
  <div class="cdb-deal-settings">
    <div class="cdb-deal-settings-title">Czas umowy</div>
    <div class="cdb-duration">
      <label>Tryb wymiany</label>
      <div class="cdb-chip-row">${modeChips}</div>
    </div>
    <div class="cdb-duration">
      <label>Co ile tur trwa wymiana (tur, max 20)</label>
      <div class="cdb-chip-row cdb-turn-presets">${turnChips}</div>
      ${qtyStepper(10)}
    </div>
  </div>
  <div class="cdb-cols">
    <div class="cdb-col">
      <div class="cdb-col-title">Dodaj do oferty</div>
      <div class="cdb-add-section">
        <div class="cdb-add-section-title">Co dodajesz</div>
        <div class="cdb-chip-grid">${typChipsGive}</div>
      </div>
      <label>Ilość</label>
      ${qtyStepper(10)}
      <button type="button" class="cdb-add-btn">+ Dodaj pozycję</button>
    </div>
    <div class="cdb-col">
      <div class="cdb-col-title">Dodaj do kontrpropozycji</div>
      <div class="cdb-add-section">
        <div class="cdb-add-section-title">Co dodajesz</div>
        <div class="cdb-chip-grid">${typChipsRecv}</div>
      </div>
      <label>Surowiec (pakiety ×36)</label>
      <div class="cdb-chip-grid">${resChips}</div>
      <label>Liczba pakietów</label>
      ${qtyStepper(2)}
      <button type="button" class="cdb-add-btn">+ Dodaj pozycję</button>
    </div>
  </div>
  <div class="cdb-btns">
    <button type="button" class="dip-muted-btn">Anuluj</button>
    <button type="button" class="cdb-add-btn">Zaproponuj</button>
  </div>
</div>
</div>
</body></html>`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(HTML, buildHtml(), 'utf8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fileUrl = 'file:///' + HTML.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.civ-diplo-basket', { timeout: 10000 });

  const outFile = path.join(OUT, 'D-DYPLO-KOSZYK-UX-trade-basket.png');
  await page.locator('.civ-diplo-basket').screenshot({ path: outFile, type: 'png' });
  console.log('OK screenshot:', outFile);

  await browser.close();
}

main().catch((e) => {
  console.error('capture-trade-basket-preview FAILED:', e);
  process.exit(1);
});
