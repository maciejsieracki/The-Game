// Mutacje danych (kopie JSONL) -- kazda mutacja MUSI zaczerwienic odpowiednie kryterium (exit 1 + wlasciwy komunikat).
// Sciezki wzgledne do tego pliku (repo/dyspozycje/autobot/runs/<ID>/evidence/): bez zaszytych sciezek worktree.
// Wyjscie kopii: zmienna MUT_OUT (domyslnie katalog tymczasowy systemu).
const fs = require('fs'), cp = require('child_process'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const EV = path.join(__dirname, '/');
const OUT = (process.env.MUT_OUT || path.join(os.tmpdir(), 'mut-r3')) + path.sep;
fs.mkdirSync(OUT, { recursive: true });
const load = f => fs.readFileSync(EV + f, 'utf8').trim().split('\n').map(JSON.parse);
const save = (name, rows) => { fs.writeFileSync(OUT + name, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); return OUT + name; };
const run = (tool, file, extra = []) => { const r = cp.spawnSync('node', [ROOT + '/gra/tools/' + tool, '--check', file, ...extra], { encoding: 'utf8', cwd: ROOT + '/gra' }); return { code: r.status, out: r.stdout + r.stderr }; };
const results = [];
function expectRed(label, tool, file, re, extra) {
  const r = run(tool, file, extra);
  const hit = re.test(r.out);
  results.push({ label, exit: r.code, matched: hit });
  console.log(`${r.code === 1 && hit ? 'OK (czerwieni)' : 'BLAD (nie czerwieni)'} | ${label} | exit=${r.code} | wzorzec ${re} ${hit ? 'znaleziony' : 'NIE znaleziony'}`);
}
const LIVE = 'live-verify-battle-after-full-move-live.cjs', MAN = 'live-verify-battle-after-full-move-manual-driver.cjs';

// baza: dane nietkniete -> exit 0
{
  const r = run(LIVE, EV + 'live-n2-n3.jsonl'); console.log(`BAZA live: exit=${r.code} (oczekiwane 0)`); results.push({ label: 'baza live', exit: r.code });
  const m = run(MAN, EV + 'manual-vs-auto.jsonl'); console.log(`BAZA manual: exit=${m.code} (oczekiwane 0)`); results.push({ label: 'baza manual', exit: m.code });
}
const base = () => load('live-n2-n3.jsonl');
// A1: rozrzut frontu
{ const rows = base(); const row = rows.find(r => r.part === 'n2' && r.mode === 'auto'); const info = row.r.unitInfo;
  for (const sn of row.r.snapshots.slice(1, 2)) { const u = sn.units.find(x => info[x[0]].side === 'atk' && info[x[0]].kind === 'infantry' && !x[3]); u[1] += 7; }
  expectRed('A1 rozrzut frontu (+7 kolumn jednej jednostki piechoty)', LIVE, save('mA1.jsonl', rows), /A1 rozrzut frontu/); }
// A1b: brak zderzenia
{ const rows = base(); const row = rows.find(r => r.part === 'n2' && r.mode === 'auto'); for (const sn of row.r.snapshots) for (const u of sn.units) u[5] = 0;
  expectRed('A1 brak zderzenia wrecz (adj=0 wszedzie) -> NIE_ZMIERZONO', LIVE, save('mA1b.jsonl', rows), /A1 brak zderzenia/); }
// A2: ciosy
{ const rows = base(); const row = rows.find(r => r.part === 'n2' && r.mode === 'auto'); const k = Object.keys(row.r.hitCount)[0]; row.r.hitCount[k] = 2;
  expectRed('A2 2 ciosy jednej jednostki w turze', LIVE, save('mA2.jsonl', rows), /A2 ciosy na jednostke/); }
// A3: niewykorzystany ruch
{ const rows = base(); const row = rows.find(r => r.part === 'n2' && r.mode === 'auto'); const info = row.r.unitInfo;
  for (const sn of row.r.snapshots.slice(2)) for (const u of sn.units) if (info[u[0]].kind === 'infantry' && !u[3]) u[4] = 1;
  expectRed('A3 piechota z niewykorzystanym ruchem w kazdej turze', LIVE, save('mA3.jsonl', rows), /A3 infantry: niewykorzystany ruch/); }
// B1: neverRout rozbity
{ const rows = base(); const row = rows.find(r => r.id === 'R1' && r.mode === 'auto'); const id = Object.entries(row.r.unitInfo).find(([, i]) => i.neverRout)[0];
  row.r.events.rout.push({ round: 2, side: 'atk', id, neverRout: true });
  expectRed('B1 neverRout w zdarzeniach rozbicia', LIVE, save('mB1.jsonl', rows), /B1 neverRout .* rozbity/); }
{ const rows = base(); const row = rows.find(r => r.id === 'R1' && r.mode === 'auto'); const id = Object.entries(row.r.unitInfo).find(([, i]) => i.neverRout)[0];
  row.r.finalFate[id] = 'fled';
  expectRed('B1 neverRout uciekl (los=fled)', LIVE, save('mB1b.jsonl', rows), /B1 neverRout .* los=fled/); }
// B1c: zbior pusty
{ const rows = base(); const row = rows.find(r => r.id === 'R1' && r.mode === 'auto'); for (const i of Object.values(row.r.unitInfo)) i.neverRout = false;
  expectRed('B1 zbior neverRout pusty = NIE_ZMIERZONO (nie PASS)', LIVE, save('mB1c.jsonl', rows), /zbior pusty = NIE_ZMIERZONO/); }
// B1d: neverRout nie walczy po rozbiciu (przezyl bez ciosow)
{ const rows = base(); const row = rows.find(r => r.id === 'R1' && r.mode === 'auto'); const ids = Object.entries(row.r.unitInfo).filter(([, i]) => i.neverRout).map(([id]) => id);
  for (const id of ids) { row.r.finalFate[id] = 'survived'; for (const k of Object.keys(row.r.hitCount)) if (k.split('|')[1] === id) delete row.r.hitCount[k]; }
  expectRed('B1 neverRout przezyl bez ciosow po 1. rozbiciu', LIVE, save('mB1d.jsonl', rows), /nie zadal ani jednego ciosu/); }
// B2: za duzo krokow ucieczki
{ const rows = base(); const row = rows.find(r => r.id === 'R3' && r.mode === 'auto'); const s = row.r.fleeSteps[0];
  for (let i = 0; i < 4; i++) row.r.fleeSteps.push({ ...s });
  expectRed('B2 uciekinier wykonuje 5 krokow w turze (limit 2)', LIVE, save('mB2.jsonl', rows), /krokow > limit ucieczki/); }
// B2b: krok w strone wroga
{ const rows = base(); const row = rows.find(r => r.id === 'R3' && r.mode === 'auto'); const s = row.r.fleeSteps[0]; s.to = [s.from[0] + (s.side === 'atk' ? 1 : -1), s.from[1]];
  expectRed('B2 krok ucieczki w strone wroga', LIVE, save('mB2b.jsonl', rows), /w strone WROGA/); }
// B2c: zla wartosc fleeMove
{ const rows = base(); const row = rows.find(r => r.id === 'R3' && r.mode === 'auto'); const id = row.r.fleeSteps[0].id; row.r.unitInfo[id].fleeMove = row.r.unitInfo[id].move;
  expectRed('B2 fleeMove == pelny ruch (brak 50%)', LIVE, save('mB2c.jsonl', rows), /fleeMove=/); }
// B3: brak poscigu
{ const rows = base(); const row = rows.find(r => r.id === 'R3' && r.mode === 'auto'); row.r.pursuit = [];
  expectRed('B3 byli rozbici, brak poscigu', LIVE, save('mB3.jsonl', rows), /B3 byli rozbici/); }
// B3b: konnica nie dobija
{ const rows = base(); const row = rows.find(r => r.id === 'R3' && r.mode === 'auto'); row.r.pursuit = row.r.pursuit.map(p => ({ ...p, mounted: false }));
  expectRed('B3 zwyciezca ma konnice, a konnica nie zadala ciosu uciekinierowi', LIVE, save('mB3b.jsonl', rows), /konnica nie zadala ciosu/); }
// K2, K3, K5, K1
{ const rows = base(); rows.find(r => r.id === 'R3' && r.mode === 'auto').r.fledNotAtEdge = 1; expectRed('K2 uciekinier usuniety poza krawedzia', LIVE, save('mK2.jsonl', rows), /K2 fledNotAtEdge=1/); }
{ const rows = base(); rows.find(r => r.id === 'R3' && r.mode === 'auto').r.atk.routedLeft = 1; expectRed('K3 rozbity zostal na polu', LIVE, save('mK3.jsonl', rows), /K3 routedLeft/); }
{ const rows = base(); rows.find(r => r.id === 'R3' && r.mode === 'auto').r.def.killed += 1; expectRed('K5 bilans jednostek', LIVE, save('mK5.jsonl', rows), /K5 def bilans/); }
{ const rows = base(); rows.find(r => r.id === 'R3' && r.mode === 'auto').timedOut = true; expectRed('K1 timeout', LIVE, save('mK1.jsonl', rows), /K1 timeout/); }
{ const rows = base(); rows.find(r => r.id === 'R3' && r.mode === 'auto').errors = ['x']; expectRed('K1 pageerror', LIVE, save('mK1b.jsonl', rows), /K1 pageerror/); }

// MANUAL DRIVER
const mbase = () => load('manual-vs-auto.jsonl');
{ const rows = mbase(); rows.find(r => r.mode === 'manual-focus').timedOut = true; rows.find(r => r.mode === 'manual-focus').stuckReason = 'limit'; expectRed('MAN timeout/niezakonczona', MAN, save('mM1.jsonl', rows), /TIMEOUT\/niezakonczona/); }
{ const rows = mbase(); const r = rows.find(x => x.mode === 'manual-march'); r.ui.groundClicks = 0; r.ui.enemyShiftClicks = 0; r.ui.orderedUnits = 0; expectRed('MAN driver nie wydal rozkazu z UI', MAN, save('mM2.jsonl', rows), /driver nie wydal zadnego rozkazu/); }
{ const rows = mbase(); rows.find(r => r.mode === 'manual-march').startState.manual = false; expectRed('MAN scena nie w trybie recznym', MAN, save('mM3.jsonl', rows), /nie byla w trybie recznym/); }
{ const rows = mbase(); rows.find(r => r.mode === 'manual-march').endManual = false; expectRed('MAN tryb reczny wylaczony w trakcie', MAN, save('mM4.jsonl', rows), /wylaczony w trakcie/); }
{ const rows = mbase(); rows.find(r => r.mode === 'auto').r.atk.killed += 2; expectRed('MAN bilans jednostek', MAN, save('mM5.jsonl', rows), /bilans atk/); }
{ const rows = mbase(); rows.find(r => r.mode === 'manual-focus').errors = ['x']; expectRed('MAN pageerror', MAN, save('mM6.jsonl', rows), /pageerror/); }
{ const rows = mbase(); const r = rows.find(x => x.mode === 'manual-focus'); r.r = null; expectRed('MAN brak wyniku', MAN, save('mM7.jsonl', rows), /brak wyniku/); }
// strict: rozbieznosc -> exit 1 z --strict-discrepancy
{ const r = run(MAN, EV + 'manual-vs-auto.jsonl', ['--strict-discrepancy']); const ok = r.code === 1; results.push({ label: 'MAN --strict-discrepancy', exit: r.code }); console.log(`${ok ? 'OK (czerwieni)' : 'BLAD'} | MAN --strict-discrepancy wlaczone na prawdziwych danych (12 kandydatow) | exit=${r.code}`); }
fs.writeFileSync(EV + 'mutations-r3.json', JSON.stringify(results, null, 1));
const bad = results.filter(r => r.label.startsWith('baza') ? r.exit !== 0 : (r.exit !== 1 || r.matched === false));
console.log(`MUTACJE: ${results.length} sprawdzen, ${bad.length} niezgodnych`);
process.exitCode = bad.length ? 1 : 0;
