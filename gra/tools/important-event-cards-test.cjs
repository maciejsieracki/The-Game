const fs = require('fs');
const path = require('path');
const MAIN = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const PRIORITY = fs.readFileSync(path.join(__dirname, '..', 'src', 'game', 'side-panel-event-priority.ts'), 'utf8');
const EOT = fs.readFileSync(path.join(__dirname, '..', 'src', 'game', 'eot-event-defer.ts'), 'utf8');

function main() {
  let pass = 0;
  let fail = 0;
  const ok = (condition, message) => {
    if (condition) { pass++; console.log('[OK] ' + message); }
    else { fail++; console.error('[FAIL] ' + message); }
  };

  ok(/return event\.blocking === true;/.test(PRIORITY), 'kontrakt blokowania wymaga jawnego blocking:true');
  ok(/return isBlockingSidePanelEvent\(ev\);/.test(MAIN), 'brama końca tury korzysta z kontraktu, nie z prefiksu ID');
  ok(MAIN.includes("id: 'revolt-warn-'"), 'revolt-warn-* jest produkowane przez aktualny kod');
  ok(MAIN.includes("id: 'revolt-'"), 'revolt-* jest produkowane przez aktualny kod');
  ok(MAIN.includes("id: 'prod-empty-'"), 'prod-empty-* jest produkowane przez aktualny kod');
  ok(MAIN.includes('id: p.id,') && MAIN.includes('id: n.id,'), 'diplo-pend-* i negot-* są produkowane przez aktualny kod');
  for (const marker of [
    "id: evId,",
    "id: VETERAN_ENEMY_EDU_EVENT_ID,",
    "id: `eot-hint-${turn}-${i}`,",
  ]) {
    ok((MAIN + EOT).includes(marker), marker + ' pozostaje kartą informacyjną bez opt-in blocking');
  }
  ok(!/return !ev\.id\.startsWith\('village-'\)/.test(MAIN), 'usunięto błędną regułę „wszystko poza chatką blokuje”');

  console.log(`\nimportant-event-cards-test: ${pass} pass, ${fail} fail`);
  process.exitCode = fail ? 1 : 0;
}

try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
