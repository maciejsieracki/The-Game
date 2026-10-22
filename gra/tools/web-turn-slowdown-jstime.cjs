'use strict';
/**
 * web-turn-slowdown-jstime.cjs — R-WEB-TURN-SLOWDOWN-Q2: czas JS z profilu CPU
 * (suma próbek minus „(program)” i „(idle)”). „(program)” w headless swiftshader to
 * głównie stały narzut natywny/renderowania (~8–10 s na turę niezależnie od numeru
 * tury), który zasłania wzrost kosztu po stronie kodu gry.
 *
 * Użycie: node tools/web-turn-slowdown-jstime.cjs <plik.cpuprofile> [...]
 */
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  const byId = new Map(p.nodes.map((n) => [n.id, n.callFrame.functionName]));
  let all = 0, prog = 0, idle = 0, gc = 0;
  for (let i = 0; i < p.samples.length; i++) {
    const d = p.timeDeltas[i] || 0; all += d;
    const fn = byId.get(p.samples[i]);
    if (fn === '(program)') prog += d; else if (fn === '(idle)') idle += d; else if (fn === '(garbage collector)') gc += d;
  }
  const ms = (x) => (x / 1000).toFixed(0);
  console.log(`${f.split('/').pop()}: razem=${ms(all)} ms (program)=${ms(prog)} (idle)=${ms(idle)} GC=${ms(gc)} JS+GC=${ms(all - prog - idle)} ms`);
}
