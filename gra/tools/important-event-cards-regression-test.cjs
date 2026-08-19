const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const typescript = require(path.join(root, 'node_modules', 'typescript'));
const priority = path.join(root, 'src', 'game', 'side-panel-event-priority.ts');
const mainSource = fs.readFileSync(path.join(root, 'src', 'main.ts'), 'utf8');

const transpiled = typescript.transpileModule(fs.readFileSync(priority, 'utf8'), {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
});
const moduleExports = {};
new Function('module', 'exports', transpiled.outputText)(
  { exports: moduleExports },
  moduleExports,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log('[OK] ' + message);
}

function producerHasBlocking(idMarker) {
  const index = mainSource.indexOf(idMarker);
  return index >= 0 && /blocking:\s*true/.test(mainSource.slice(index, index + 450));
}

function main() {
  const isBlocking = moduleExports.isBlockingSidePanelEvent;
  assert(typeof isBlocking === 'function', 'załadowano rzeczywistą funkcję priorytetu');
  assert(isBlocking({ blocking: true }) === true, 'jawne blocking:true blokuje koniec tury');
  assert(isBlocking({ blocking: false }) === false, 'jawne blocking:false nie blokuje');
  assert(isBlocking({}) === false, 'brak pola blocking pozostaje informacyjny');

  for (const idMarker of [
    "id: 'revolt-warn-'",
    "id: 'revolt-'",
    "id: 'prod-empty-'",
  ]) {
    assert(producerHasBlocking(idMarker), `${idMarker} ma jawny opt-in blocking`);
  }
  assert(producerHasBlocking("id: p.id,"), 'diplo-pend-* ma jawny opt-in blocking');
  assert(producerHasBlocking("id: n.id,"), 'negot-* ma jawny opt-in blocking');

  console.log('\nimportant-event-cards-regression-test: PASS');
}

try {
  main();
} catch (error) {
  console.error('[FAIL] ' + (error && error.stack ? error.stack : error));
  process.exitCode = 1;
}
