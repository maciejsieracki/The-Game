/**
 * OperatorAgent — pobiera task, czyta playbook, wykonuje akcję (z guardrails).
 * W Civ: implementer Composer; tu stub pod przyszłe API / CLI.
 */
import { randomUUID } from 'crypto';
import { activeRules, loadPlaybook } from './playbook-manager';
import { assertActionAllowed } from './guardrails';
import { pruneContextPayload } from './feature-pruning';
import type { ExecutionRun, Playbook } from './types';

export interface OperatorTask {
  taskId: string;
  summary: string;
  actionId: string;
  context: Record<string, unknown>;
  /** Zewnętrzny executor — np. wywołanie narzędzi Cursor / skryptu */
  execute?: (ctx: Record<string, unknown>) => Promise<Record<string, unknown>>;
  humanApproved?: boolean;
  deployPasswordGiven?: boolean;
}

export class OperatorAgent {
  constructor(
    private playbookPath?: string,
    private recentRuns: ExecutionRun[] = [],
  ) {}

  loadPlaybook(): Playbook {
    return loadPlaybook(this.playbookPath);
  }

  async run(task: OperatorTask): Promise<ExecutionRun> {
    const pb = this.loadPlaybook();
    const run: ExecutionRun = {
      id: randomUUID(),
      startedAtIso: new Date().toISOString(),
      taskId: task.taskId,
      taskSummary: task.summary,
      operatorRuleIds: activeRules(pb).map(r => r.id),
      contextPayload: {},
      actionId: task.actionId,
    };

    const gate = assertActionAllowed(task.actionId, {
      humanApproved: task.humanApproved,
      deployPasswordGiven: task.deployPasswordGiven,
    });
    if (!gate.allowed) {
      run.blockedByGuardrail = gate.reason;
      run.success = false;
      run.finishedAtIso = new Date().toISOString();
      this.recentRuns.push(run);
      return run;
    }

    const pruned = pruneContextPayload(
      task.context,
      pb.operatorContextAttributes,
      this.recentRuns,
    );
    run.contextPayload = pruned.payload;

    try {
      const raw = task.execute
        ? await task.execute(pruned.payload)
        : { stub: true, message: 'Operator stub — podłącz executor' };
      run.rawOutcome = raw;
      run.success = raw['success'] !== false && !raw['error'];
    } catch (err) {
      run.rawOutcome = { error: String(err) };
      run.success = false;
    }

    run.finishedAtIso = new Date().toISOString();
    this.recentRuns.push(run);
    return run;
  }
}
