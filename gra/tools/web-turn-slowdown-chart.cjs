'use strict';
/**
 * web-turn-slowdown-chart.cjs — R-WEB-TURN-SLOWDOWN-Q2: wykres PNG z plików CSV
 * `web-turn-slowdown-measure.cjs` (przed/po). Rysuje w headless Chromium (canvas →
 * zrzut), bez dodatkowych zależności.
 *
 * Użycie: node tools/web-turn-slowdown-chart.cjs <out.png> <etykieta=plik.csv> [...]
 * Panele: czas tury (ms), czas JS tury bez stałego narzutu nie jest liczony tu —
 * rysowane są surowe kolumny endTurnMs, cityOpenSyncMs, cityOpenFrameMs, jsHeapMB.
 */
const path = require('path');
const fs = require('fs');

const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = process.argv[2];
const series = process.argv.slice(3).map((s) => {
  const i = s.indexOf('=');
  const label = s.slice(0, i);
  const lines = fs.readFileSync(s.slice(i + 1), 'utf8').trim().split('\n');
  const head = lines[0].split(',');
  const rows = lines.slice(1).map((l) => {
    const v = l.split(',');
    const o = {};
    head.forEach((h, j) => { o[h] = Number(v[j]); });
    return o;
  });
  return { label, rows };
});
if (!out || series.length === 0) { console.error('Użycie: <out.png> <etykieta=plik.csv> ...'); process.exit(2); }

const panels = [
  ['endTurnMs', 'Czas tury: klik „Zakończ turę” → gotowość (ms)'],
  ['cityOpenSyncMs', 'Otwarcie panelu miasta — wywołanie synchroniczne (ms)'],
  ['cityOpenFrameMs', 'Otwarcie panelu miasta — do 2. klatki (ms)'],
  ['jsHeapMB', 'JS heap (MB)'],
];

(async () => {
  const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
  await page.setContent('<canvas id="c" width="1000" height="760"></canvas>');
  await page.evaluate(({ series, panels }) => {
    const cv = document.getElementById('c');
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    const colors = ['#c0392b', '#2471a3', '#1e8449', '#7d3c98'];
    const W = 470, H = 330;
    panels.forEach(([key, title], pi) => {
      const ox = 20 + (pi % 2) * 490, oy = 50 + Math.floor(pi / 2) * 360;
      let xmax = 0, ymax = 0;
      for (const s of series) for (const r of s.rows) { xmax = Math.max(xmax, r.turn); ymax = Math.max(ymax, r[key] || 0); }
      ymax *= 1.08;
      const px = (t) => ox + 50 + (t / xmax) * (W - 60);
      const py = (v) => oy + H - 30 - (v / ymax) * (H - 60);
      ctx.fillStyle = '#000'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(title, ox + 50, oy + 15);
      ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px(0), py(0)); ctx.lineTo(px(xmax), py(0)); ctx.moveTo(px(0), py(0)); ctx.lineTo(px(0), py(ymax)); ctx.stroke();
      ctx.font = '11px sans-serif'; ctx.fillStyle = '#333';
      for (let k = 0; k <= 4; k++) { const v = ymax * k / 4; ctx.fillText(v.toFixed(0), ox, py(v) + 4); }
      for (let t = 0; t <= xmax; t += 10) ctx.fillText(String(t), px(t) - 6, py(0) + 14);
      series.forEach((s, si) => {
        ctx.strokeStyle = colors[si % colors.length]; ctx.lineWidth = 1.5; ctx.beginPath();
        s.rows.forEach((r, i) => { const x = px(r.turn), y = py(r[key] || 0); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
      });
    });
    ctx.font = 'bold 14px sans-serif';
    series.forEach((s, si) => { ctx.fillStyle = colors[si % colors.length]; ctx.fillText('■ ' + s.label, 20 + si * 300, 22); });
  }, { series, panels });
  await page.locator('#c').screenshot({ path: out });
  await browser.close();
  console.log('PNG', out, fs.statSync(out).size, 'B');
})().catch((e) => { console.error(e); process.exit(1); });
