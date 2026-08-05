/**
 * Hard guardrails — Operator nie może niszczyć produkcji / main bez człowieka.
 */
import type { ActionRisk, OperatorAction } from './types';

export const FORBIDDEN_ACTION_IDS = new Set([
  'git-merge-main',
  'git-push-main-force',
  'deploy-robocza',
  'deploy-kanon',
  'deploy-finalna',
  'npm-run-build-gra',
  'npm-run-dev-gra',
  'delete-gra-data',
]);

export const CATALOG: OperatorAction[] = [
  { id: 'implement-fix', label: 'Implementacja / fix w gra/src', risk: 'elevated', requiresHumanApproval: false },
  { id: 'run-lane-tests', label: 'Testy lane (node tools/*-test.cjs)', risk: 'safe', requiresHumanApproval: false },
  { id: 'verify-triple-layer', label: 'Potrójna warstwa weryfikacji', risk: 'safe', requiresHumanApproval: false },
  { id: 'respect-deploy-gate', label: 'Szanuj bramkę deploy', risk: 'safe', requiresHumanApproval: false },
  { id: 'build-via-vite-bin', label: 'Build przez vite.bin (nie npm run build)', risk: 'elevated', requiresHumanApproval: false },
  { id: 'respect-file-ownership', label: 'Własność plików / main.ts', risk: 'safe', requiresHumanApproval: false },
  { id: 'git-merge-main', label: 'Merge do main', risk: 'forbidden', requiresHumanApproval: true },
  { id: 'deploy-robocza', label: 'Deploy ROBOCZA', risk: 'critical', requiresHumanApproval: true },
  { id: 'deploy-kanon', label: 'Promocja KANON', risk: 'critical', requiresHumanApproval: true },
  { id: 'deploy-finalna', label: 'Promocja FINALNA', risk: 'critical', requiresHumanApproval: true },
];

export interface GuardrailDecision {
  allowed: boolean;
  reason: string;
  risk: ActionRisk;
}

export function assertActionAllowed(
  actionId: string,
  opts: { humanApproved?: boolean; deployPasswordGiven?: boolean } = {},
): GuardrailDecision {
  const action = CATALOG.find(a => a.id === actionId);
  const risk: ActionRisk = action?.risk
    ?? (FORBIDDEN_ACTION_IDS.has(actionId) ? 'forbidden' : 'elevated');

  if (risk === 'forbidden' || FORBIDDEN_ACTION_IDS.has(actionId)) {
    if (actionId.startsWith('deploy-') && opts.deployPasswordGiven && opts.humanApproved) {
      return {
        allowed: true,
        reason: 'Deploy dozwolony — hasło Macieja + aprobatą człowieka',
        risk: 'critical',
      };
    }
    return {
      allowed: false,
      reason: `Guardrail: akcja "${actionId}" zabroniona dla Operatora (forbidden / bez bramki człowieka)`,
      risk: 'forbidden',
    };
  }

  if (action?.requiresHumanApproval && !opts.humanApproved) {
    return {
      allowed: false,
      reason: `Guardrail: "${actionId}" wymaga mandatory human approval`,
      risk,
    };
  }

  if ((actionId === 'deploy-robocza' || actionId === 'deploy-kanon' || actionId === 'deploy-finalna')
    && !opts.deployPasswordGiven) {
    return {
      allowed: false,
      reason: 'Guardrail: brak hasła deploy od Macieja',
      risk: 'critical',
    };
  }

  return { allowed: true, reason: 'OK', risk };
}

/** Statistical significance / time-delay before declaring winners */
export function canDeclareWinner(opts: {
  runs: number;
  minRuns: number;
  firstRunAtIso: string;
  minDelayHours: number;
  now?: Date;
}): { ok: boolean; reason: string } {
  if (opts.runs < opts.minRuns) {
    return { ok: false, reason: `Za mało runów (${opts.runs} < ${opts.minRuns})` };
  }
  const elapsedH = ( (opts.now ?? new Date()).getTime() - Date.parse(opts.firstRunAtIso) ) / 3600_000;
  if (elapsedH < opts.minDelayHours) {
    return { ok: false, reason: `Time-delay: ${elapsedH.toFixed(1)}h < ${opts.minDelayHours}h` };
  }
  return { ok: true, reason: 'Significance + delay OK' };
}
