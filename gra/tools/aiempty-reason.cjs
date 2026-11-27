// R-WEB-AI-EMPTY-CITIES-Q1 (obrona r2): rozklad pustych miast AI wg powodu z rekordu tury (JSONL).
// Uzycie: node gra/tools/aiempty-reason.cjs <plik.jsonl.gz> <tura>
// Tylko odczyt; nic nie zmienia w gra/src.
'use strict';
const fs = require('fs');
const zlib = require('zlib');

// Progi kosztu REKRUTACJI przy tempie "Wysoki" (x4), wyliczone z kodu:
// Procarz (Brąz): Pn 4 x2 (epoka Brąz) x2 (dodatkowy mnoznik epoki Brąz) x4 (tempo) = 64 Pn; Drewno 25 x2 = 50.
// Włócznik (Brąz): Pn 8 -> 128 Pn; Brąz 25 x2 = 50.
// Ulgi cywilizacji i trudnosci NIE sa uwzglednione (przyblizenie; patrz dokument diagnozy).
const PROCARZ_PN_WYSOKI = 64;
const STOCK_NEED = 50;

const file = process.argv[2];
const turn = Number(process.argv[3] || 60);
const lines = zlib.gunzipSync(fs.readFileSync(file)).toString('utf8').split('\n').filter(Boolean);
const rec = lines.map(l => JSON.parse(l)).find(r => r.turn === turn);
if (!rec) { console.error('brak tury ' + turn); process.exit(2); }

const counts = { razemPuste: 0, brakPieniedzy: 0, brakSurowca: 0, dostepnaJednostka: 0 };
const perOwner = [];
for (const o of rec.owners) {
  const empty = (o.miastaWojsko || []).filter(c => c.wojsko === 0).length;
  if (empty === 0 || o.owner <= 0) continue; // owner 0 = gracz (FALA 857 i AIBAL2 liczą tylko AI)
  const st = {};
  for (const x of (o.hud && o.hud.surowceTyp) || []) st[x.typ] = x.stan;
  const drewno = st['Drewno'] || 0;
  const braz = st['Brąz'] || 0;
  const skarb = o.skarbiec || 0;
  let powod;
  if (skarb < PROCARZ_PN_WYSOKI) powod = 'brakPieniedzy';
  else if (drewno < STOCK_NEED && braz < STOCK_NEED) powod = 'brakSurowca';
  else powod = 'dostepnaJednostka';
  counts.razemPuste += empty;
  counts[powod] += empty;
  perOwner.push({ owner: o.owner, puste: empty, miasta: o.miasta, skarbiec: skarb, drewno, braz, rekruci: o.rekruci, powod });
}
perOwner.sort((a, b) => b.puste - a.puste);
console.log(JSON.stringify({ plik: file, tura: turn, counts, perOwner }, null, 1));
