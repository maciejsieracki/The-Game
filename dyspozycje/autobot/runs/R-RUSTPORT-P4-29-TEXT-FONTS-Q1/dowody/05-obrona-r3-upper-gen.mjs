import { writeFileSync } from 'node:fs';
let upper = '# code point (hex)<TAB>JS toUpperCase result (hex code points) — only code points that change; node ' + process.version + ' unicode ' + process.versions.unicode + '\n';
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  const s = String.fromCodePoint(cp);
  const u = s.toUpperCase();
  if (u !== s) upper += cp.toString(16) + '\t' + [...u].map((c) => c.codePointAt(0).toString(16)).join(' ') + '\n';
}
writeFileSync(process.argv[2], upper);
