'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..', '..', '..');
const activeFiles = [
  'CLAUDE.md',
  'docs/procesy/INDEX-PROCESU.md',
  'docs/decyzje/R-PROC-AUTOBOT.md',
  'dyspozycje/AUTOBOT-SCHEMAT-DZIALANIA.md',
  'dyspozycje/autobot/README.md',
  '.claude/skills/civ-autobot/SKILL.md',
  '.cursor/rules/autobot-evaluator-operator.mdc',
  '.cursor/rules/model-routing.mdc',
  '.cursor/rules/numer-abc-commit-deploy.mdc',
  'dyspozycje/_handoff/HANDOFF-AKTUALNY.md',
  'dyspozycje/REJESTR-PROSB-I-ZADAN.md',
  'dyspozycje/PYTANIA-OTWARTE.md',
  'dyspozycje/WERSJE.md',
  'dyspozycje/_handoff/KANAL-PRACA.md',
];
const requiredRunFiles = [
  '00-dispatch.md',
  '01-operator.md',
  '02-evaluator.md',
  '03-final-control.md',
  '04-integration.md',
];
const canonicalStatuses = [
  'NOWE', 'ABC-OCZEKUJE', 'OPERATOR', 'EVALUATOR', 'FINALNA-KONTROLA',
  'DO-INTEGRACJI', 'ZINTEGROWANE', 'DEPLOY-ROBOCZA', 'ZAMKNIĘTE',
  'BLOCK', 'ODŁOŻONE', 'ODRZUCONE', 'DUPLIKAT',
];
const failures = [];

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    failures.push(`brak aktywnego pliku: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
}

for (const rel of activeFiles) {
  const raw = read(rel);
  const text = rel === 'dyspozycje/PYTANIA-OTWARTE.md'
    ? raw.split(/\r?\n/).slice(0, 100).join('\n')
    : raw;
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRe.exec(text))) {
    const target = match[1].trim().split('#', 1)[0];
    if (!target || /^(?:https?:|mailto:|app:)/i.test(target)) continue;
    const abs = path.resolve(path.dirname(path.join(root, rel)), target);
    if (!fs.existsSync(abs)) failures.push(`${rel}: zerwany link ${target}`);
  }
}

const index = read('docs/procesy/INDEX-PROCESU.md');
for (const required of ['HANDOFF-AKTUALNY.md', 'REJESTR-PROSB-I-ZADAN.md', 'PYTANIA-OTWARTE.md', 'READY_FOR_DEPLOY']) {
  if (!index.includes(required)) failures.push(`INDEX-PROCESU: brak odwołania ${required}`);
}
const register = read('dyspozycje/REJESTR-PROSB-I-ZADAN.md');
for (const status of canonicalStatuses) {
  if (!register.includes(status)) failures.push(`REJESTR: brak statusu ${status}`);
}
const runDir = path.join(root, 'dyspozycje', 'autobot', 'runs', 'PAKIET-3-STATUSY-REJESTRY-HANDOFFY-RAPORTY');
for (const name of requiredRunFiles) {
  if (!fs.existsSync(path.join(runDir, name))) failures.push(`brak szablonu runu: ${name}`);
}

const forbiddenInActive = ['HANDOFF-FALA-299', 'codex/pakiet-1-', 'codex/pakiet-2-', 'codex/pakiet-3-'];
for (const rel of activeFiles) {
  const raw = read(rel);
  const text = rel === 'dyspozycje/PYTANIA-OTWARTE.md'
    ? raw.split(/\r?\n/).slice(0, 100).join('\n')
    : raw;
  for (const marker of forbiddenInActive) {
    if (text.includes(marker)) failures.push(`${rel}: stare odwołanie ${marker}`);
  }
}

let changed = '';
try { changed = cp.execFileSync('git', ['diff', '--name-only', 'HEAD', '--', 'gra'], { cwd: root, encoding: 'utf8' }); } catch (_) {}
if (changed.trim()) failures.push(`pakiet dokumentacyjny zmienia gra/: ${changed.trim().replace(/\r?\n/g, ', ')}`);

if (failures.length) {
  console.error('PROCESS DOCS AUDIT: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`PROCESS DOCS AUDIT: PASS (${activeFiles.length} plików, ${requiredRunFiles.length} szablonów, ${canonicalStatuses.length} statusów)`);
}
