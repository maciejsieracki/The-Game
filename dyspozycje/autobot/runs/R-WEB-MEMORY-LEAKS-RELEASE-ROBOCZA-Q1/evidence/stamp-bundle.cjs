// Port inject-build-stamp.ps1 (Tier ROBOCZA) do Node; brak pwsh w srodowisku Linux.
const fs = require('fs'), crypto = require('crypto');
const [src, dst] = process.argv.slice(2);
let html = fs.readFileSync(src, 'utf8');
const d = new Date(); const p = n => String(n).padStart(2, '0');
const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
html = html.replace(/<!-- CIV-BUILD-STAMP -->[\s\S]*?<!-- \/CIV-BUILD-STAMP -->\s*/, '').replace(/<div id="civ-build-stamp"[^>]*>[\s\S]*?<\/div>\s*/, '');
const block = `<!-- CIV-BUILD-STAMP -->\n<div id="civ-build-stamp" title="md5=${'0'.repeat(32)}" hidden style="position:fixed;bottom:32px;left:6px;z-index:2147483647;display:none;font:11px/1.3 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.78);color:#d4af37;padding:3px 8px;border-radius:4px;border:1px solid rgba(212,175,55,.35);pointer-events:none;letter-spacing:.02em">ROBOCZA &#183; ${'0'.repeat(8)} &#183; ${stamp}</div>\n<!-- /CIV-BUILD-STAMP -->\n\n`;
html = /<\/body>/.test(html) ? html.replace('</body>', () => block + '</body>') : html + '\n' + block;
fs.writeFileSync(dst, html);
for (let i = 0; i < 4; i++) {
  const md5 = crypto.createHash('md5').update(fs.readFileSync(dst)).digest('hex');
  const c = fs.readFileSync(dst, 'utf8');
  const n = c.replace(/title="md5=[0-9a-f]{32}"/, `title="md5=${md5}"`).replace(/(?<=id="civ-build-stamp"[^>]*>)[^<]+(?=<\/div>)/, `ROBOCZA &#183; ${md5.slice(0, 8)} &#183; ${stamp}`);
  if (n === c) break;
  fs.writeFileSync(dst, n);
}
const b = fs.readFileSync(dst);
console.log('md5', crypto.createHash('md5').update(b).digest('hex'), 'sha256', crypto.createHash('sha256').update(b).digest('hex'), 'bytes', b.length);
