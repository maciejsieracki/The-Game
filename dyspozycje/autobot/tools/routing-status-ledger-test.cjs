'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'logs', 'routing-status-ledger-test-dist');
const tsc = path.resolve(root, '..', '..', 'gra', 'node_modules', 'typescript', 'bin', 'tsc');
fs.rmSync(out, { recursive: true, force: true });
execFileSync(process.execPath, [tsc, '-p', path.join(root, 'tsconfig.json'), '--outDir', out, '--noEmit', 'false'], { stdio: 'pipe' });
const ledger = require(path.join(out, 'routing-status-ledger.js'));
const base = { agent_id: 'agent-C037', temat: 'R-AUTOBOT-ROUTING-STATUS-LEDGER-Q1', rola: 'Operator', runda: 1, start: '2026-08-20T10:00:00Z', oczekiwany_artefakt: '01-operator.md' };

const pending = ledger.createLedgerEntry(base);
assert.equal(pending.ostatni_status, 'pending');
assert.equal(pending.timestamp_zakonczenia, null);
assert.equal(Object.keys(pending).length, 9);
const running = ledger.waitForReport(pending);
assert.equal(running.ostatni_status, 'running');
assert.equal(ledger.watchdog(running, 'completed', '2026-08-20T10:05:00Z').ostatni_status, 'completed');
assert.equal(ledger.watchdog(running, 'interrupted', '2026-08-20T10:06:00Z').ostatni_status, 'interrupted');
assert.equal(ledger.watchdog(running, 'not_found', '2026-08-20T10:07:00Z').ostatni_status, 'BLOCK');
assert.equal(ledger.watchdog(running, 'timeout', '2026-08-20T10:08:00Z').ostatni_status, 'TIMEOUT');
assert.equal(ledger.watchdog(running, 'silent', '2026-08-20T10:09:00Z').ostatni_status, 'ZWIS');
assert.equal(ledger.watchdog(running, 'close', '2026-08-20T10:10:00Z').ostatni_status, 'CLOSED');
assert.equal(ledger.canDispatchReplacement(running, 'unknown-status'), false);
assert.equal(ledger.canDispatchReplacement(running, 'running'), false);
assert.match(ledger.watchdog(running, 'silent', '2026-08-20T10:09:00Z').routing_nastepnego_kroku, /ten sam Operator/);
const roundFive = ledger.createLedgerEntry({ ...base, agent_id: 'agent-C038', runda: 5 });
assert.match(ledger.watchdog(ledger.waitForReport(roundFive), 'timeout', '2026-08-20T11:00:00Z').routing_nastepnego_kroku, /LIMIT-5-EXCEEDED/);
assert.throws(() => ledger.createLedgerEntry({ ...base, extra: 'poza allowlistą' }), /allowlist|object/i);
fs.rmSync(out, { recursive: true, force: true });
console.log('routing-status-ledger: 12/12 PASS');
