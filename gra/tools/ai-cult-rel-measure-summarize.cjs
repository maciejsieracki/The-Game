'use strict';
/**
 * ai-cult-rel-measure-summarize.cjs -- R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1: zestawienie JSONL z ai-cult-rel-measure-run.cjs.
 * Uzycie: node tools/ai-cult-rel-measure-summarize.cjs <etykieta=katalog> ... (ziarna 4242 i 7, tury 20/40/60).
 * Per etykieta i ziarno: AI (owner != 0): miasta, jednostki wojskowe, puste miasta (0 wojska), wojsko w miastach (srednia),
 * budynki Prawa/Szczescia. Bunty/utrata miast: NIE ZMIERZONO (brak haka); zmiana liczby miast AI t20->t60 jest przyblizeniem.
 */
const fs = require('fs');
const path = require('path');
const LAW = ['garnizon', 'pretorium', 'dom_starszyzny', 'dwor_zarzadcy', 'sad', 'trybunal'];
const HAP = ['swiatynia', 'kamienne_kregi', 'teatr', 'akademia', 'biblioteka', 'stela', 'laznia_publiczna', 'studnia', 'akwedukt'];
for (const spec of process.argv.slice(2)) {
  const [label, dir] = spec.split('=');
  for (const seed of [4242, 7]) {
    const f = path.join(dir, `seed${seed}.jsonl`);
    if (!fs.existsSync(f)) { console.log(label, seed, 'brak pliku'); continue; }
    const recs = fs.readFileSync(f, 'utf8').trim().split('\n').map(l => JSON.parse(l));
    for (const t of [20, 40, 60]) {
      const r = recs.find(x => x.turn === t) || null;
      if (!r) { console.log(`${label} seed${seed} t${t}: brak`); continue; }
      let cities = 0, units = 0, empty = 0, inCity = 0, law = 0, hap = 0;
      const per = {};
      for (const o of r.owners) {
        if (o.owner === 0) continue;
        cities += o.miasta; units += o.jednostkiWojskowe;
        for (const c of o.miastaWojsko) { if (c.wojsko === 0) empty++; inCity += c.wojsko; }
        const b = (o.hud && o.hud.budynkiPerTyp) || {};
        for (const id of LAW) { law += b[id] || 0; per[id] = (per[id] || 0) + (b[id] || 0); }
        for (const id of HAP) { hap += b[id] || 0; per[id] = (per[id] || 0) + (b[id] || 0); }
      }
      console.log(`${label} seed${seed} t${t}: miasta ${cities}, jednostki ${units}, puste ${empty}/${cities} (${(100 * empty / Math.max(1, cities)).toFixed(1)}%), wojsko w miastach ${inCity} (${(inCity / Math.max(1, cities)).toFixed(2)}/miasto), bud.Prawa ${law}, bud.Szczescia ${hap} ${t === 60 ? JSON.stringify(per) : ''}`);
    }
  }
}
