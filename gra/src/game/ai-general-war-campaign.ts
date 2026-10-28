import type { RuntimeUnit } from '../units/setup';

export type AiGeneralWarCampaignStage = 'recruiting' | 'gathering' | 'attacking';

export interface AiGeneralWarCampaign {
  targetOwnerId: number;
  stage: AiGeneralWarCampaignStage;
  generalUnitId?: string;
  /** Existing General IDs blocked from reuse after the assigned leader dies. */
  blockedGeneralIds?: string[];
  gatherTurnsCompleted: number;
  lastGatherTurn?: number;
}

export const AI_GENERAL_WAR_GATHER_TURNS = 5;

export function chooseAiGeneralWarTarget(
  current: AiGeneralWarCampaign | undefined,
  candidates: readonly { ownerId: number; distance: number }[],
): number | null {
  if (candidates.length === 0) return null;
  if (current && candidates.some(candidate => candidate.ownerId === current.targetOwnerId)) {
    return current.targetOwnerId;
  }
  return [...candidates].sort((a, b) => a.distance - b.distance || a.ownerId - b.ownerId)[0]!.ownerId;
}

export function reconcileAiGeneralWarCampaign(
  current: AiGeneralWarCampaign | undefined,
  targetOwnerId: number | null,
  general: RuntimeUnit | undefined,
  queuedGeneralExists: boolean,
  aliveGeneralIds: readonly string[] = general ? [general.id] : [],
): AiGeneralWarCampaign | undefined {
  if (targetOwnerId === null) return undefined;
  const sameTarget = current?.targetOwnerId === targetOwnerId;
  if (!sameTarget) {
    return general?.isGeneral === true
      ? { targetOwnerId, stage: 'gathering', generalUnitId: general.id, gatherTurnsCompleted: 0 }
      : { targetOwnerId, stage: 'recruiting', gatherTurnsCompleted: 0 };
  }
  const campaign = { ...current! };
  if (campaign.stage === 'recruiting') {
    const mustBeFresh = campaign.blockedGeneralIds !== undefined;
    if (general?.isGeneral === true
        && (mustBeFresh
          ? !campaign.blockedGeneralIds!.includes(general.id)
          : (!campaign.generalUnitId || general.id !== campaign.generalUnitId))) {
      return { targetOwnerId, stage: 'gathering', generalUnitId: general.id, gatherTurnsCompleted: 0 };
    }
  } else if (campaign.generalUnitId && (!general || general.id !== campaign.generalUnitId || general.isGeneral !== true)) {
    // Death of the assigned physical leader restarts the cycle and requires a fresh recruit.
    return {
      targetOwnerId, stage: 'recruiting', generalUnitId: campaign.generalUnitId,
      blockedGeneralIds: [...aliveGeneralIds], gatherTurnsCompleted: 0,
    };
  } else if (!campaign.generalUnitId && general?.isGeneral === true) {
    return { targetOwnerId, stage: 'gathering', generalUnitId: general.id, gatherTurnsCompleted: 0 };
  }
  if (!queuedGeneralExists && !general && campaign.stage !== 'recruiting') {
    return { targetOwnerId, stage: 'recruiting', gatherTurnsCompleted: 0 };
  }
  return campaign;
}

export function recordAiGeneralGatherTurn(
  campaign: AiGeneralWarCampaign,
  turn: number,
): AiGeneralWarCampaign {
  if (campaign.stage !== 'gathering' || campaign.lastGatherTurn === turn) return campaign;
  const gatherTurnsCompleted = campaign.gatherTurnsCompleted + 1;
  return {
    ...campaign,
    gatherTurnsCompleted,
    lastGatherTurn: turn,
    ...(gatherTurnsCompleted >= AI_GENERAL_WAR_GATHER_TURNS
      ? { stage: 'attacking' as const }
      : {}),
  };
}

export function aiGeneralCampaignToSave(campaigns: ReadonlyMap<number, AiGeneralWarCampaign>): Array<[number, AiGeneralWarCampaign]> {
  return [...campaigns.entries()].map(([ownerId, campaign]) => [ownerId, {
    targetOwnerId: campaign.targetOwnerId,
    stage: campaign.stage,
    ...(campaign.generalUnitId ? { generalUnitId: campaign.generalUnitId } : {}),
    ...(campaign.blockedGeneralIds ? { blockedGeneralIds: [...campaign.blockedGeneralIds] } : {}),
    gatherTurnsCompleted: campaign.gatherTurnsCompleted,
    ...(campaign.lastGatherTurn !== undefined ? { lastGatherTurn: campaign.lastGatherTurn } : {}),
  }]);
}

export function restoreAiGeneralCampaigns(value: unknown): Map<number, AiGeneralWarCampaign> {
  const restored = new Map<number, AiGeneralWarCampaign>();
  if (!Array.isArray(value)) return restored;
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const [ownerId, raw] = entry;
    if (!Number.isSafeInteger(ownerId) || ownerId <= 0 || !raw || typeof raw !== 'object') continue;
    const campaign = raw as Partial<AiGeneralWarCampaign>;
    // Owner 0 is the human player and is a valid enemy target for every AI owner.
    if (!Number.isSafeInteger(campaign.targetOwnerId) || campaign.targetOwnerId! < 0) continue;
    if (campaign.stage !== 'recruiting' && campaign.stage !== 'gathering' && campaign.stage !== 'attacking') continue;
    if (!Number.isSafeInteger(campaign.gatherTurnsCompleted) || campaign.gatherTurnsCompleted! < 0) continue;
    if (campaign.generalUnitId !== undefined && typeof campaign.generalUnitId !== 'string') continue;
    if (campaign.blockedGeneralIds !== undefined
        && (!Array.isArray(campaign.blockedGeneralIds) || campaign.blockedGeneralIds.some(id => typeof id !== 'string'))) continue;
    restored.set(ownerId, {
      targetOwnerId: campaign.targetOwnerId!,
      stage: campaign.stage,
      ...(campaign.generalUnitId ? { generalUnitId: campaign.generalUnitId } : {}),
      ...(campaign.blockedGeneralIds ? { blockedGeneralIds: [...campaign.blockedGeneralIds] } : {}),
      gatherTurnsCompleted: campaign.gatherTurnsCompleted!,
      ...(Number.isSafeInteger(campaign.lastGatherTurn) ? { lastGatherTurn: campaign.lastGatherTurn } : {}),
    });
  }
  return restored;
}
