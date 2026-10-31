// Ostateczne liczby rundy 2 z hunks3.json (wynik classify3.mjs).
import fs from 'node:fs';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const r = JSON.parse(fs.readFileSync(`${S}/hunks3.json`, 'utf8'));
const WAR = /PEACE|TRUCE|WAR-AGGRESSOR|ERA-WAR|AGGRESSOR-MARKER|WYMUSZONA-WOJNA|DIPLO-TICK-WAR-BRAKE|PEACE\/WAR/;
const EXCL = /E2E|SAVELOAD|NEWGAME|BATTLE|RELEASE-ROBOCZA/;
const war = r.filter(x => WAR.test(x.owner) && !EXCL.test(x.owner));
const cnt = k => r.filter(x => x.cls === k).length;
console.log(JSON.stringify({
  hunki: r.length,
  klasy: { kod_czysty: cnt('kod'), kod_z_komentarzem: cnt('kod+komentarz'), nazwa_tekst: cnt('nazwa/tekst'), komentarz: cnt('komentarz'), import: cnt('import'), typ: cnt('typ'), bez_kodu_komentarz_typ: cnt('bez-kodu(komentarz/typ/import)'), pusty: cnt('pusty') },
  z_linia_kodu: r.filter(x => x.codeLines > 0).length,
  wojna_pokoj_owner: war.length,
  wojna_pokoj_z_kodem: war.filter(x => x.codeLines > 0).length,
  bez_tagu_commit: r.filter(x => x.owner === 'BEZ-TAGU').length,
  nieprzypisany: r.filter(x => x.owner === 'NIEPRZYPISANY').length,
}, null, 1));
