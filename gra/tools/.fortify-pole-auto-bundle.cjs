"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tools/.fortify-pole-auto-entry.ts
var fortify_pole_auto_entry_exports = {};
__export(fortify_pole_auto_entry_exports, {
  armyFieldPowerSplit: () => armyFieldPowerSplit,
  sumRosterFieldMSplit: () => sumRosterFieldMSplit
});
module.exports = __toCommonJS(fortify_pole_auto_entry_exports);

// data/combat-params.json
var combat_params_default = {
  _opis: "Panel-C \u017Ar\xF3d\u0142o prawdy \xB7 panele-sterowania/export-c.py \xB7 Macierz v2 + SS5l + obl\u0119zenie + AI obl\u0119\u017Cenia",
  macierz_v2: {
    hit_base: 35,
    hit_min: 8,
    hit_max: 90,
    dmg_scale: 10,
    pancerz_divisor: 200,
    max_rounds: 200
  },
  tw_v3: {
    hit_base: 40,
    hit_min: 15,
    hit_max: 75,
    max_rounds: 200
  },
  ss5l_legacy: {
    hit_base: 50,
    hit_per_point: 5,
    hit_min: 10,
    hit_max: 90,
    max_rounds: 30
  },
  counter_multiplier: 1.5,
  river_attack_mult: 0.75,
  brod: {
    _opis: "C-BTL-BROD-Q1 wariant C -- mechanika brodu (Ford) na planszy bitwy taktycznej (battleScene.ts). karaAtak/karaObrona sa numerycznie te same co river_attack_mult (0.75=1-0.25) ale to OSOBNY, dedykowany dla brodu wpis (tamten zasila swiatowy resolveCombat/instant-resolve dla starcia z obronca-na-rzece; ten zasila per-tile Ford w bitwie taktycznej -- oba moga byc strojone niezaleznie w przyszlosci).",
    ruchMult: 0.5,
    karaAtak: 0.25,
    karaObrona: 0.25,
    bonusObronaBrzegu: 0.15
  },
  obl\u0119\u017Cenie: {
    _opis: "wall_base_obrona / wall_per_level_obrona ZEROWANE (Maciej 2026-07-25): obrona miasta dziala WYLACZNIE procentowo (miasto-params.json bonus_obrona_mur_proc=200 / bonus_obrona_cytadela_proc=100, konsumowane przez main.ts structureDefenseBonusFor + combat.ts structureDefBonusPct + battleScene onWallWalkway). Plaski bonus Obrony/Pancerza z muru w game/siege.ts (cityDefenseBonus) dublowal ten procent -- zneutralizowany tutaj zamiast w kodzie, zeby wallLevel/hasWalls (obecnosc muru) nadal dzialaly bez zmian. Pola zostawione (nie usuniete) dla zgodnosci z SiegeParams/wallParamsFromBuildings.",
    wall_base_obrona: 0,
    wall_per_level_obrona: 0,
    wall_max_level: 10,
    wall_pancerz_fraction: 0.5,
    hill_defense_mult: 1.5,
    mountain_defense_mult: 1.75,
    fortify_obrona_bonus: 2,
    militia_pop_fraction: 0.2,
    militia_strength_fraction: 0.5,
    siege_max_rounds: 30
  },
  siege_ai: {
    t1_assault_ratio: 1.8,
    t2_build_min_ratio: 1.4,
    t3_starve_min_ratio: 1.1,
    t2_max_wait_turns: 5,
    units_per_extra_machine: 10
  },
  unit_power: {
    _opis: "Moc jednostki M \u2014 Panel-C Stale-moc \xB7 mirror unit-power.ts",
    charge_divisor: 2,
    missile_divisor: 2,
    hp_field_divisor: 2,
    hp_siege_divisor: 10
  }
};

// src/game/unit-power.ts
var DEFAULT_COEFF = {
  chargeDivisor: 2,
  missileDivisor: 2,
  hpFieldDivisor: 2,
  hpSiegeDivisor: 10
};
function num(v, fallback = 0) {
  if (v === null || v === void 0 || v === "" || v === "\u2014") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function loadUnitPowerCoeffs(raw = combat_params_default) {
  const u = raw.unit_power ?? {};
  const pick = (k, d) => {
    const v = u[k];
    return typeof v === "number" && v > 0 ? v : d;
  };
  return {
    chargeDivisor: pick("charge_divisor", DEFAULT_COEFF.chargeDivisor),
    missileDivisor: pick("missile_divisor", DEFAULT_COEFF.missileDivisor),
    hpFieldDivisor: pick("hp_field_divisor", DEFAULT_COEFF.hpFieldDivisor),
    hpSiegeDivisor: pick("hp_siege_divisor", DEFAULT_COEFF.hpSiegeDivisor)
  };
}
function isSiegeUnit(u) {
  return (u["Rola (linia)"] ?? "") === "Obl\u0119\u017Cnicza";
}
function fieldPower(u, coeff = loadUnitPowerCoeffs()) {
  const attack = num(u.meleeAttack) + num(u.weaponDamage) + num(u.piercing) + num(u.chargeBonus) / coeff.chargeDivisor + num(u.missileAttack) / coeff.missileDivisor;
  const defense = num(u.meleeDefence) + num(u.armor) + num(u.health) / coeff.hpFieldDivisor;
  return {
    attack: round1(attack),
    defense: round1(defense),
    total: round1(attack + defense)
  };
}
function armyFieldPower(u, coeff) {
  if (isSiegeUnit(u)) return 0;
  if (typeof u.fieldPower === "number" && Number.isFinite(u.fieldPower)) {
    return u.fieldPower;
  }
  return fieldPower(u, coeff).total;
}
function armyFieldPowerSplit(u, coeff) {
  if (isSiegeUnit(u)) return { attack: 0, defense: 0 };
  const bd = fieldPower(u, coeff);
  return { attack: bd.attack, defense: bd.defense };
}

// src/game/auto-battle-power.ts
var BATTLE_EXCLUDED_TYPES = /* @__PURE__ */ new Set(["Zwiadowca", "Osadnik"]);
function isFieldBattleUnit(typeId, def) {
  if (isSiegeUnit(def)) return false;
  if (BATTLE_EXCLUDED_TYPES.has(typeId)) return false;
  return armyFieldPower(def) > 0;
}
function sumRosterFieldMSplit(roster) {
  let atk = 0;
  let def = 0;
  for (const u of roster) {
    if (!isFieldBattleUnit(u.typeId, u.def)) continue;
    const split = armyFieldPowerSplit(u.def);
    atk += split.attack;
    def += split.defense;
  }
  return { attack: Math.round(atk * 10) / 10, defense: Math.round(def * 10) / 10 };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  armyFieldPowerSplit,
  sumRosterFieldMSplit
});
