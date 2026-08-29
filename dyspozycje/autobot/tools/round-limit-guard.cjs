'use strict';
const LIMIT = 5;
const STATUS_LIMIT_EXCEEDED = 'LIMIT-5-EXCEEDED';
function authorizeDispatch({ id, roundsUsed, lastVerdict = null, automatic = true, explicitResume = false }) {
  if (!id) throw new Error('id is required');
  if (!Number.isInteger(roundsUsed) || roundsUsed < 0) throw new Error('roundsUsed must be a non-negative integer');
  const round = roundsUsed + 1;
  if (round <= LIMIT) return { allowed: true, id, round, lastVerdict, status: 'DISPATCH-ALLOWED' };
  if (automatic || !explicitResume) return { allowed: false, id, round, lastVerdict, status: STATUS_LIMIT_EXCEEDED, reason: 'Automatyczny dispatch zatrzymany po 5 rundach.', nextStep: 'Uzyskać jawną decyzję orkiestratora/właściciela; zachować ID i nie resetować licznika.' };
  return { allowed: true, id, round, lastVerdict, status: 'DISPATCH-ALLOWED-MANUAL-RESUME', reason: 'Jawna decyzja wznowienia po limicie.', nextStep: 'Kontynuować pod tym samym ID; zachować lastVerdict i zapisać decyzję w rejestrze/runie.' };
}
function limitReport({ id, round, lastVerdict, reason, nextStep }) {
  return [
    'STATUS: ' + STATUS_LIMIT_EXCEEDED,
    'TEMAT: ' + id,
    'RUNDY: ' + round + '/5',
    'OSTATNI WERDYKT: ' + lastVerdict,
    'POWÓD: ' + reason,
    'NASTĘPNY KROK: ' + nextStep
  ].join('\n');
}
module.exports = { LIMIT, STATUS_LIMIT_EXCEEDED, authorizeDispatch, limitReport };
