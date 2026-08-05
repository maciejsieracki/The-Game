/**
 * Guardrails — Moduł 4: Prod Isolation, HITL Gatekeeper, Data Exposure Delay.
 */
import type { ActionRisk, OperatorAction, Playbook } from './types';

export const FORBIDDEN_ACTION_IDS = new Set([
  'git-merge-main',
  'git-push-main-force',
  'deploy-robocza',
  'deploy-kanon',
  'deploy-finalna',
  'npm-run-build-gra',
  'npm-run-dev-gra',
  'delete-gra-data',
  'mass-mail',
  'real-money-transfer',
]);

export const CATALOG: OperatorAction[] = [
  { id: 'implement-fix', label: 'Implementacja / fix w gra/src', risk: 'elevated', requiresHumanApproval: false },
  { id: 'create-pr-draft', label: 'Utwórz PR / draft', risk: 'safe', requiresHumanApproval: false },
  { id: 'run-lane-tests', label: 'Testy lane (node tools/*-test.cjs)', risk: 'safe', requiresHumanApproval: false },
  { id: 'verify-triple-layer', label: 'Potrójna warstwa weryfikacji', risk: 'safe', requiresHumanApproval: false },
  { id: 'verify-eval-scope-no-regression', label: 'Evaluator SCOPE + brak regresji ubocznych', risk: 'safe', requiresHumanApproval: false },
  { id: 'respect-deploy-gate', label: 'Szanuj bramkę deploy', risk: 'safe', requiresHumanApproval: false },
  { id: 'build-via-vite-bin', label: 'Build przez vite.bin (nie npm run build)', risk: 'elevated', requiresHumanApproval: false },
  { id: 'respect-file-ownership', label: 'Własność plików / main.ts', risk: 'safe', requiresHumanApproval: false },
  { id: 'git-merge-main', label: 'Merge do main', risk: 'forbidden', requiresHumanApproval: true },
  { id: 'mass-mail', label: 'Mass mail', risk: 'forbidden', requiresHumanApproval: true },
  { id: 'real-money-transfer', label: 'Real money transfer', risk: 'forbidden', requiresHumanApproval: true },
  { id: 'deploy-robocza', label: 'Deploy ROBOCZA', risk: 'critical', requiresHumanApproval: true },
  { id: 'deploy-kanon', label: 'Promocja KANON', risk: 'critical', requiresHumanApproval: true },
  { id: 'deploy-finalna', label: 'Promocja FINALNA', risk: 'critical', requiresHumanApproval: true },
];

export interface GuardrailDecision {
  allowed: boolean;
  reason: string;
  risk: ActionRisk;
}

export interface GuardrailContext {
  humanApproved?: boolean;
  deployPasswordGiven?: boolean;
  env?: string;
}

/** Moduł 4.1: Prod Isolation — blokada destrukcyjnych akcji Operatora w production */
export function assertProdIsolation(env: string | undefined, actionId: string): void {
  if (env !== 'production') return;
  const destructive = FORBIDDEN_ACTION_IDS.has(actionId) || actionId.startsWith('deploy-');
  if (destructive) {
    throw new Error(
      `Guardrail PROD ISOLATION: akcja "${actionId}" zablokowana w env=production`,
    );
  }
}

/**
 * Moduł 4.2: HITL Gatekeeper
 * - Wolno: PR/draft, safe actions
 * - ZAKAZ: merge main, mass mail, real money
 * - Deploy: tylko humanApproved + deployPassword
 */
/** Semantika poza CATALOG — deny-by-default (merge/deploy-force bez HITL) */
function isSemanticallyForbidden(actionId: string): boolean {
  if (
    actionId === 'merge' ||
    actionId === 'git-merge' ||
    actionId === 'merge-to-main' ||
    actionId.startsWith('merge-')
  ) {
    return true;
  }
  if (/push.*force/i.test(actionId) || actionId.includes('force-push')) {
    return true;
  }
  if (actionId.startsWith('deploy') && !CATALOG.some(a => a.id === actionId)) {
    return true;
  }
  return false;
}

export function assertActionAllowed(
  actionId: string,
  opts: GuardrailContext = {},
): GuardrailDecision {
  const env = opts.env ?? process.env.AUTOBOT_ENV ?? process.env.NODE_ENV ?? 'development';

  try {
    assertProdIsolation(env, actionId);
  } catch (err) {
    return {
      allowed: false,
      reason: String(err),
      risk: 'forbidden',
    };
  }

  const action = CATALOG.find(a => a.id === actionId);

  if (!action) {
    if (FORBIDDEN_ACTION_IDS.has(actionId) || isSemanticallyForbidden(actionId)) {
      return {
        allowed: false,
        reason: `Guardrail: akcja "${actionId}" zabroniona (deny-by-default / semantika merge/deploy-force)`,
        risk: 'forbidden',
      };
    }
    return {
      allowed: false,
      reason: `Guardrail: nieznana akcja "${actionId}" (deny-by-default — brak w CATALOG)`,
      risk: 'forbidden',
    };
  }

  const risk: ActionRisk = action.risk;

  const alwaysForbidden = new Set([
    'git-merge-main',
    'git-push-main-force',
    'mass-mail',
    'real-money-transfer',
    'npm-run-build-gra',
    'npm-run-dev-gra',
    'delete-gra-data',
  ]);

  if (alwaysForbidden.has(actionId)) {
    return {
      allowed: false,
      reason: `Guardrail HITL: akcja "${actionId}" zabroniona dla Operatora (merge/mass-mail/real-money)`,
      risk: 'forbidden',
    };
  }

  if (risk === 'forbidden' || FORBIDDEN_ACTION_IDS.has(actionId)) {
    if (
      actionId.startsWith('deploy-') &&
      opts.deployPasswordGiven &&
      opts.humanApproved
    ) {
      return {
        allowed: true,
        reason: 'Deploy dozwolony — hasło Macieja + aprobata człowieka',
        risk: 'critical',
      };
    }
    return {
      allowed: false,
      reason: `Guardrail: akcja "${actionId}" zabroniona (forbidden / bez bramki człowieka)`,
      risk: 'forbidden',
    };
  }

  if (action?.requiresHumanApproval && !opts.humanApproved) {
    return {
      allowed: false,
      reason: `Guardrail HITL: "${actionId}" wymaga mandatory human approval`,
      risk,
    };
  }

  if (
    (actionId === 'deploy-robocza' ||
      actionId === 'deploy-kanon' ||
      actionId === 'deploy-finalna') &&
    (!opts.deployPasswordGiven || !opts.humanApproved)
  ) {
    return {
      allowed: false,
      reason: 'Guardrail HITL: deploy wymaga humanApproved + deployPassword',
      risk: 'critical',
    };
  }

  return { allowed: true, reason: 'OK', risk };
}

export interface WinnerDeclarationOpts {
  eventCount: number;
  minEvents: number;
  firstEventAtIso: string;
  minDelayHours: number;
  now?: Date;
}

/**
 * Moduł 4.3: Data Exposure Delay
 * Evaluator nie ogłasza A/B winner dopóki N >= minEvents LUB elapsed >= minDelayHours.
 */
export function canDeclareWinner(opts: WinnerDeclarationOpts): { ok: boolean; reason: string } {
  const now = opts.now ?? new Date();
  const elapsedH = (now.getTime() - Date.parse(opts.firstEventAtIso)) / 3600_000;
  const enoughEvents = opts.eventCount >= opts.minEvents;
  const enoughTime = elapsedH >= opts.minDelayHours;

  if (enoughEvents || enoughTime) {
    const via = enoughEvents ? `events ${opts.eventCount}≥${opts.minEvents}` : `delay ${elapsedH.toFixed(1)}h≥${opts.minDelayHours}h`;
    return { ok: true, reason: `Winner declaration OK (${via})` };
  }

  return {
    ok: false,
    reason: `Data exposure delay: events ${opts.eventCount}<${opts.minEvents} AND delay ${elapsedH.toFixed(1)}h<${opts.minDelayHours}h`,
  };
}

/** Rzuca gdy winner nie może być ogłoszony */
export function assertEvaluationDelay(opts: WinnerDeclarationOpts): void {
  const result = canDeclareWinner(opts);
  if (!result.ok) {
    throw new Error(`Guardrail EVALUATION DELAY: ${result.reason}`);
  }
}

/** Helper: progi z playbooka */
export function winnerThresholdsFromPlaybook(pb: Playbook): {
  minEvents: number;
  minDelayHours: number;
} {
  return {
    minEvents: pb.thresholds.minEventsForWinner ?? 1000,
    minDelayHours: pb.thresholds.evaluationDelayHours ?? 48,
  };
}

export function assertEvaluationDelayFromPlaybook(
  pb: Playbook,
  eventCount: number,
  firstEventAtIso: string,
  now?: Date,
): void {
  const t = winnerThresholdsFromPlaybook(pb);
  assertEvaluationDelay({
    eventCount,
    minEvents: t.minEvents,
    firstEventAtIso,
    minDelayHours: t.minDelayHours,
    now,
  });
}
