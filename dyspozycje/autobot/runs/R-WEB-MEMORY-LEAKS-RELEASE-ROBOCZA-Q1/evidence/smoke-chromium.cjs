const path = require('path'), fs = require('fs'), http = require('http');
const GRA = '/home/user/The-Game/.claude/worktrees/wf_0972a296-218-1/gra';
const ROOT = '/home/user/The-Game/.claude/worktrees/wf_0972a296-218-1/gra-robocza';
const OUT = process.argv[2];
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(res);
});
const vis = () => [...document.querySelectorAll('button,[role=button],select,input')].filter(e => e.offsetParent !== null).map(e => (e.tagName + ':' + (e.innerText || e.value || e.id || '')).replace(/\s+/g, ' ').slice(0, 50));
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [], logs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console.error: ' + m.text()); if (m.text().includes('[memdebug]')) logs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/Gra-ROBOCZA.html?memdebug=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(5000);
  await page.getByText('ROZPOCZNIJ GRĘ').click();
  await page.waitForTimeout(2000);
  await page.getByText('ROZPOCZNIJ KONFIGURACJĘ').click(); await page.waitForTimeout(2000);
  const W=page.locator('.civ-newgame'); await W.getByText(/Epoka kamienia/i).first().click(); await page.waitForTimeout(800); await page.getByRole('button',{name:/dalej/i}).click(); await page.waitForTimeout(1500);
  await page.getByRole('button',{name:/dalej/i}).click(); await page.waitForTimeout(1500);
  await page.fill('input[type=text],input[type=number]', '7').catch(e=>console.log('seed fill fail'));
  await page.getByText(/ROZPOCZNIJ GRE/i).click();
  const t0=Date.now();
  await page.waitForTimeout(3000);
  await page.waitForFunction(() => !document.body.innerText.includes('Tworzenie świata'), null, {timeout: 900000, polling: 2000}).catch(e=>console.log('worldgen wait timeout'));
  console.log('worldgen done after ms', Date.now()-t0);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(OUT, 'smoke-ingame-t1.png') });
  const body = async () => (await page.evaluate(() => document.body.innerText));
  console.log('T1 body tail', (await body()).replace(/\s+/g,' ').slice(-400));
  const dismiss = async () => { for (let k=0;k<6;k++) { const clicked = await page.evaluate(() => { const re=/^(OK|Zamknij|Wróć|Dalej|Rozumiem|Kontynuuj|Zamknij okno|✕.*)$/i; const b=[...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null && re.test(x.innerText.trim()) && !/MENU|WYJDŹ/i.test(x.innerText)); if(b[0]){b[0].click();return b[0].innerText;} return null; }); if(!clicked) break; console.log('  dismissed', clicked); await page.waitForTimeout(500); } };
  // zalozenie pierwszego miasta: skan kliknieciami w srodku widoku az tryb budowy zniknie
  let founded=false;
  const pts=[]; for (let r=0;r<=12;r++) for (let dx=-r;dx<=r;dx++) for (let dy=-r;dy<=r;dy++) if (Math.max(Math.abs(dx),Math.abs(dy))===r) pts.push([700+dx*30, 450+dy*30]);
  for (const [x,y] of pts) {
    await page.mouse.click(x,y); await page.waitForTimeout(250);
    const txt = await body();
    if (!txt.includes('kliknij podświetlony hex')) { founded=true; console.log('build mode ended after click at', x, y); break; }
  }
  await page.waitForTimeout(3000);
  console.log('founded', founded, (await body()).replace(/\s+/g,' ').slice(-500));
  await page.screenshot({ path: path.join(OUT, 'smoke-after-found.png') });
  await dismiss();
  const turns = [];
  for (let t=0;t<6;t++) {
    const before = logs.length;
    await page.getByRole('button',{name:/ZAKOŃCZ TURĘ/i}).click({timeout:20000}).catch(e=>console.log('end-turn click fail', e.message.slice(0,80)));
    await page.waitForTimeout(8000);
    await dismiss();
    const m = (await body()).match(/TURA \d+/);
    console.log('after end-turn #' + (t+1), m && m[0], 'memdebug lines new:', logs.length-before);
  }
  await page.screenshot({ path: path.join(OUT, 'smoke-ingame-after-turns.png') });
  console.log('MEMDEBUG_LOGS_BEGIN'); logs.forEach(l=>console.log(l)); console.log('MEMDEBUG_LOGS_END');
  console.log('ERRORS', JSON.stringify(errs));
  await page.mouse.click(1,1);
  console.log('errs', JSON.stringify(errs));
  await b.close(); srv.close();
});
