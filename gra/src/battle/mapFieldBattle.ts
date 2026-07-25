/**
 * mapFieldBattle.ts — atak miasta bez muru z mapy (F-P1-01 / C1).
 * Logika lane C: preBattle → Auto / Ręczna / Wycofaj → capture po wygranej.
 * Wpięcie UI/stanu → Grupa F (main.ts).
 * Spec: dyspozycje/_handoff/A-do-C_map-attack-city-F-P1-01.md
 */

import type { City } from '../game/cities';
import { isBarbarian } from '../game/barbarians';
import type { MapSiegeContext } from '../game/mapSiegeDetect';
import {
  collectCityDefRoster,
  defenderSideTitle,
  hasCityDefenders,
} from '../game/siegeDefenders';
import type { TerrainEntry } from '../game/combat';
import { terrainDefenseMultiplier } from '../game/combat';
import {
  autoBattleWinPct,
  resolveAutoBattleByPower,
  sumRosterFieldM,
} from '../game/auto-battle-power';
import type { UnitPowerInput } from '../game/unit-power';
import { armyFieldPower } from '../game/unit-power';
import { snapshotRosterPositions } from '../game/post-battle-map';
import type { RuntimeUnit } from '../units/setup';
import { collectAtkRosterNearCity } from '../units/battleRoster';
import type { PreBattleInfo, PreBattleCallbacks, PreBattleOptions } from '../ui/preBattle';
import type { BattleOpts, BattleResult, BattleUnit } from './battleScene';
import type { CivBonusEntry } from '../game/civ-bonuses';
import { setMood } from '../audio/muzyka-antyczna';

export interface MapFieldBattleAction {
  attacker: RuntimeUnit;
  ctx: MapSiegeContext;
}

export interface OpenCityFieldBattlePlan {
  city: City;
  anchor: RuntimeUnit;
  atkRoster: RuntimeUnit[];
  defRoster: RuntimeUnit[];
  militiaDefs: Map<string, Record<string, unknown>>;
  terrain: string;
  structBonusPct: number;
  preBattle: PreBattleInfo;
  battleHex: { q: number; r: number };
}

export interface MapFieldBattleLaunchDeps {
  cities: City[];
  units: RuntimeUnit[];
  turn: number;
  getTerrainAt: (q: number, r: number) => string;
  getStructBonus: (q: number, r: number) => number;
  unitDefFor: (u: RuntimeUnit) => UnitPowerInput & Record<string, unknown>;
  unitHealth: (def: UnitPowerInput) => number;
  unitAtak: (def: UnitPowerInput) => number;
  civLabelForOwner: (ownerId: number) => string;
  civBonusyForOwnerId: (ownerId: number) => readonly CivBonusEntry[];
  /** Portrety wladcow (leaderPortraits.ts) w medalionach BattleScene/preBattle -- opcjonalne,
   *  brak = BattleScene domyslnie era=1 (kamien), zero regresji dla starych wywolan. */
  eraForOwnerId?: (ownerId: number) => number;
  /** ikonaId cywilizacji (civs.json) dla ownerId -- portret wladcy w medalionie preBattle. */
  civIdForOwner?: (ownerId: number) => string;
  /**
   * R-MP-PORTRET (2026-07-24): ownerId to miasto-panstwo klastra (isOwnerClusterCityState)?
   * Opcjonalne -- brak = false dla wszystkich (zero regresji dla starych wywolan), medalion
   * dowodcy MP wraca wtedy do ikony-symbolu kultury zamiast portretu-zdjecia glownej cyw.
   */
  isCityStateForOwner?: (ownerId: number) => boolean;
  lookupUnitDef: (typeId: string) => unknown;
  runtimeToBattleUnit: (u: RuntimeUnit, def: unknown, color: number) => BattleUnit;
  terrainCombatData: readonly TerrainEntry[];
  battleData: { terrainData?: unknown[]; counters?: unknown[]; units?: unknown[] };
  showHint: (msg: string, ms?: number) => void;
  showPreBattle: (
    info: PreBattleInfo,
    cb: PreBattleCallbacks,
    opts?: PreBattleOptions,
  ) => void;
  hidePreBattle: () => void;
  applyMapBattleOutcomeWithSummary: (
    atkRoster: RuntimeUnit[],
    defRoster: RuntimeUnit[],
    winner: BattleResult['winner'] | 'remis',
    survivors: BattleUnit[] | undefined,
    opts: {
      battleQ: number;
      battleR: number;
      atkStart: Map<string | number, { q: number; r: number }>;
      lossAtkPct?: number;
      lossDefPct?: number;
      allowCityCapture?: boolean;
    },
    summary: {
      mode: 'auto' | 'manual';
      atkLabel: string;
      defLabel: string;
      atkCivLabel?: string;
      defCivLabel?: string;
      teren?: string;
      placeLabel?: string;
    },
    onContinue: () => void,
  ) => void;
  clearBattleUiState: () => void;
  createBattleScene: (opts: BattleOpts) => { play: (cb: (res: BattleResult) => void) => void; dispose: () => void };
  registerMilitiaDef?: (id: string, def: Record<string, unknown>) => void;
  onQuickSave?: () => boolean;
}

function normFieldVal(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === '' || v === '—') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function preBattleUnitFromRuntime(
  u: RuntimeUnit,
  unitDefFor: MapFieldBattleLaunchDeps['unitDefFor'],
  unitHealth: MapFieldBattleLaunchDeps['unitHealth'],
  unitAtak: MapFieldBattleLaunchDeps['unitAtak'],
): PreBattleInfo['atakujacy']['units'][0] {
  const def = unitDefFor(u);
  const hp = unitHealth(def);
  return {
    nazwa: u.typeId,
    kategoria: u.category,
    hp,
    maxHp: hp,
    atak: unitAtak(def),
    moc: armyFieldPower(def),
  };
}

function preBattleSideFromRoster(
  roster: RuntimeUnit[],
  title: string,
  civLabel: string,
  unitDefFor: MapFieldBattleLaunchDeps['unitDefFor'],
  unitHealth: MapFieldBattleLaunchDeps['unitHealth'],
  unitAtak: MapFieldBattleLaunchDeps['unitAtak'],
  civIdForOwner?: MapFieldBattleLaunchDeps['civIdForOwner'],
  eraForOwnerId?: MapFieldBattleLaunchDeps['eraForOwnerId'],
  isCityStateForOwner?: MapFieldBattleLaunchDeps['isCityStateForOwner'],
): PreBattleInfo['atakujacy'] {
  const ownerId = roster[0]?.ownerId;
  return {
    nazwa: title,
    cywilizacja: civLabel,
    ownerId,
    civId: ownerId !== undefined ? civIdForOwner?.(ownerId) : undefined,
    era: ownerId !== undefined ? eraForOwnerId?.(ownerId) : undefined,
    isCityState: ownerId !== undefined ? isCityStateForOwner?.(ownerId) : undefined,
    // TEMAT 11 (2026-07-24): isBarbarian(ownerId) jest czysta funkcja (game/barbarians.ts) --
    // nie wymaga osobnego callbacku deps jak isCityStateForOwner (kontekst klastra/miast).
    isBarbarian: ownerId !== undefined ? isBarbarian(ownerId) : undefined,
    units: roster.map(u => preBattleUnitFromRuntime(u, unitDefFor, unitHealth, unitAtak)),
  };
}

function rosterFieldPowerM(
  roster: RuntimeUnit[],
  unitDefFor: MapFieldBattleLaunchDeps['unitDefFor'],
): number {
  return sumRosterFieldM(roster.map(u => ({ typeId: u.typeId, def: unitDefFor(u) })));
}

function effectiveDefenderM(
  defRoster: RuntimeUnit[],
  terrain: string,
  structBonusPct: number,
  atkLeadDef: UnitPowerInput & Record<string, unknown>,
  unitDefFor: MapFieldBattleLaunchDeps['unitDefFor'],
  terrainCombatData: readonly TerrainEntry[],
): number {
  const raw = rosterFieldPowerM(defRoster, unitDefFor);
  const terrMult = terrainDefenseMultiplier(
    terrain,
    String(atkLeadDef['Rola (linia)'] ?? ''),
    terrainCombatData as TerrainEntry[],
  );
  const structMult = 1 + structBonusPct / 100;
  return Math.round(raw * terrMult * structMult * 10) / 10;
}

function preBattleSzanseAtkPct(
  atkRoster: RuntimeUnit[],
  defRoster: RuntimeUnit[],
  terrain: string,
  structBonusPct: number,
  unitDefFor: MapFieldBattleLaunchDeps['unitDefFor'],
  terrainCombatData: readonly TerrainEntry[],
): number {
  const aLeadDef = unitDefFor(atkRoster[0]!);
  const mAtk = rosterFieldPowerM(atkRoster, unitDefFor);
  const mDef = effectiveDefenderM(defRoster, terrain, structBonusPct, aLeadDef, unitDefFor, terrainCombatData);
  return autoBattleWinPct(mAtk, mDef);
}

/** Walidacja przed startem potyczki o miasto otwarte. Zwraca komunikat błędu lub null. */
export function validateOpenCityFieldBattle(
  city: City | undefined,
  anchor: RuntimeUnit | undefined,
): string | null {
  if (!city || !anchor) return 'Bitwa: brak miasta lub jednostki atakujacej na mapie.';
  if (city.maMur) return 'Miasto z murem — uzyj Oblezaj/Szturm, nie potyczki polowej.';
  return null;
}

/**
 * PURE poza opcjonalnym registerMilitiaDef: plan potyczki (rostery + preBattle) dla miasta bez muru.
 * #53: militiaDefs rejestrujemy w silniku ZARAZ po ich obliczeniu, PRZED preBattleSzanseAtkPct —
 * inaczej unitDefFor(Milicja) spada na fallback 'wojownika' w prognozie, a walka/Auto liczy na realnej Milicji.
 */
export function planOpenCityFieldBattle(
  action: MapFieldBattleAction,
  city: City,
  anchor: RuntimeUnit,
  units: readonly RuntimeUnit[],
  deps: Pick<
    MapFieldBattleLaunchDeps,
    | 'turn'
    | 'getTerrainAt'
    | 'getStructBonus'
    | 'unitDefFor'
    | 'unitHealth'
    | 'unitAtak'
    | 'civLabelForOwner'
    | 'terrainCombatData'
    | 'registerMilitiaDef'
    | 'eraForOwnerId'
    | 'civIdForOwner'
    | 'isCityStateForOwner'
  >,
): OpenCityFieldBattlePlan | null {
  if (city.maMur) return null;
  if (!hasCityDefenders(city, units)) return null;

  const { roster: defRoster, militiaDefs } = collectCityDefRoster(city, units);
  if (defRoster.length === 0) return null;

  if (deps.registerMilitiaDef) {
    for (const [id, def] of militiaDefs) {
      deps.registerMilitiaDef(id, def);
    }
  }

  const atkRoster = collectAtkRosterNearCity(city, anchor, units);
  const terrain = deps.getTerrainAt(city.q, city.r);
  const structBonusPct = deps.getStructBonus(city.q, city.r);
  const atkLead = atkRoster[0]!;
  const defLead = defRoster[0]!;
  const szanse = preBattleSzanseAtkPct(
    atkRoster,
    defRoster,
    terrain,
    structBonusPct,
    deps.unitDefFor,
    deps.terrainCombatData,
  );

  const atkTitle = atkRoster.length > 1
    ? 'Sklad (' + atkRoster.length + ')'
    : anchor.typeId;
  const defTitle = defenderSideTitle(city, defRoster);

  const preBattle: PreBattleInfo = {
    atakujacy: preBattleSideFromRoster(
      atkRoster,
      atkTitle,
      deps.civLabelForOwner(anchor.ownerId),
      deps.unitDefFor,
      deps.unitHealth,
      deps.unitAtak,
      deps.civIdForOwner,
      deps.eraForOwnerId,
      deps.isCityStateForOwner,
    ),
    obronca: preBattleSideFromRoster(
      defRoster,
      defTitle,
      deps.civLabelForOwner(defLead.ownerId),
      deps.unitDefFor,
      deps.unitHealth,
      deps.unitAtak,
      deps.civIdForOwner,
      deps.eraForOwnerId,
      deps.isCityStateForOwner,
    ),
    teren: terrain,
    szanseAtkPct: szanse,
    miejsce: city.name,
    lokacja: '(' + city.q + ',' + city.r + ')',
    tura: deps.turn,
    canRetreat: true,
  };

  return {
    city,
    anchor,
    atkRoster,
    defRoster,
    militiaDefs,
    terrain,
    structBonusPct,
    preBattle,
    battleHex: { q: city.q, r: city.r },
  };
}

/**
 * C1: klik wrogie miasto bez muru + obrońcy → preBattle → bitwa → capture.
 * F woła z gałęzi `field_battle` routera map-attack-city.
 */
export function launchFieldBattleFromMap(
  action: MapFieldBattleAction,
  deps: MapFieldBattleLaunchDeps,
): void {
  const city = deps.cities.find(c => c.id === action.ctx.city.id);
  const anchor = deps.units.find(u => u.id === action.attacker.id);

  const err = validateOpenCityFieldBattle(city, anchor);
  if (err) {
    deps.showHint(err, 4000);
    return;
  }

  const planOrNull = planOpenCityFieldBattle(action, city!, anchor!, deps.units, deps);
  if (!planOrNull) {
    deps.showHint('Bitwa: brak obrońców — użyj zdobycia bez walki.', 4000);
    return;
  }
  const plan = planOrNull;
  // #53: militiaDefs sa juz zarejestrowane wewnatrz planOpenCityFieldBattle (przed prognoza szans).

  const atkRosterRef = plan.atkRoster.slice();
  const defRosterRef = plan.defRoster.slice();
  const atkStartSnap = snapshotRosterPositions(atkRosterRef);
  const pbInfo = plan.preBattle;

  function rosterToBattleUnits(roster: RuntimeUnit[], color: number): BattleUnit[] {
    return roster.map(u =>
      deps.runtimeToBattleUnit(u, deps.lookupUnitDef(u.typeId), color),
    );
  }

  function summaryMeta(mode: 'auto' | 'manual') {
    return {
      mode,
      atkLabel: pbInfo.atakujacy.nazwa,
      defLabel: pbInfo.obronca.nazwa,
      atkCivLabel: pbInfo.atakujacy.cywilizacja,
      defCivLabel: pbInfo.obronca.cywilizacja,
      teren: plan.terrain,
      placeLabel: plan.city.name,
    };
  }

  function doAutoResolve(): void {
    try {
      const aLeadDef = deps.unitDefFor(atkRosterRef[0]!);
      const mAtk = rosterFieldPowerM(atkRosterRef, deps.unitDefFor);
      const mDef = effectiveDefenderM(
        defRosterRef,
        plan.terrain,
        plan.structBonusPct,
        aLeadDef,
        deps.unitDefFor,
        deps.terrainCombatData,
      );
      const powerRes = resolveAutoBattleByPower({ mAtk, mDef });
      if (powerRes.winner === 'none') {
        deps.showHint('Atak: brak sil bojowych w skladzie', 3000);
        deps.clearBattleUiState();
        return;
      }
      const winner: BattleResult['winner'] | 'remis' =
        powerRes.winner === 'tie' ? 'remis'
          : powerRes.winner === 'attacker' ? 'atakujacy'
            : 'obronca';

      deps.applyMapBattleOutcomeWithSummary(
        atkRosterRef,
        defRosterRef,
        winner,
        undefined,
        {
          battleQ: plan.battleHex.q,
          battleR: plan.battleHex.r,
          atkStart: atkStartSnap,
          lossAtkPct: powerRes.lossAtkPct,
          lossDefPct: powerRes.lossDefPct,
          allowCityCapture: true,
        },
        summaryMeta('auto'),
        deps.clearBattleUiState,
      );
    } catch (e) {
      console.error('[MapFieldBattle] auto resolve:', e);
      deps.clearBattleUiState();
    }
  }

  deps.showPreBattle(pbInfo, {
    onAuto: () => {
      deps.hidePreBattle();
      doAutoResolve();
    },
    onBattlefield: () => {
      deps.hidePreBattle();
      const atkLead = atkRosterRef[0]!;
      const defLead = defRosterRef[0]!;
      setMood('bitwa');
      const bs = deps.createBattleScene({
        attacker: rosterToBattleUnits(atkRosterRef, 0xffd54a),
        defender: rosterToBattleUnits(defRosterRef, 0xc84040),
        teren: plan.terrain,
        data: deps.battleData,
        deploy: true,
        attackerCivBonusy: deps.civBonusyForOwnerId(atkLead.ownerId),
        defenderCivBonusy: deps.civBonusyForOwnerId(defLead.ownerId),
        attackerCivLabel: pbInfo.atakujacy.cywilizacja,
        defenderCivLabel: pbInfo.obronca.cywilizacja,
        attackerSideLabel: pbInfo.atakujacy.nazwa,
        defenderSideLabel: pbInfo.obronca.nazwa,
        attackerEra: deps.eraForOwnerId?.(atkLead.ownerId),
        defenderEra: deps.eraForOwnerId?.(defLead.ownerId),
        attackerIsCityState: pbInfo.atakujacy.isCityState,
        defenderIsCityState: pbInfo.obronca.isCityState,
        attackerIsBarbarian: pbInfo.atakujacy.isBarbarian,
        defenderIsBarbarian: pbInfo.obronca.isBarbarian,
        onCancel: () => setMood('mapa'),
      });
      bs.play((res) => {
        deps.applyMapBattleOutcomeWithSummary(
          atkRosterRef,
          defRosterRef,
          res.winner,
          res.survivors,
          {
            battleQ: plan.battleHex.q,
            battleR: plan.battleHex.r,
            atkStart: atkStartSnap,
            allowCityCapture: true,
          },
          summaryMeta('manual'),
          () => {
            setMood('mapa');
            deps.clearBattleUiState();
            bs.dispose();
          },
        );
      });
    },
    onCancel: () => {
      deps.hidePreBattle();
    },
    onSave: deps.onQuickSave
      ? () => deps.onQuickSave!()
      : undefined,
  }, { defaultAction: 'manual' });

  console.log(
    '[MapFieldBattle] preBattle',
    plan.city.name,
    'atk=',
    plan.atkRoster.length,
    'def=',
    plan.defRoster.length,
  );
}

/** Eksport pomocniczy dla testów — normFieldVal używany w preBattleUnit. */
export { normFieldVal as _normFieldValForTest };
