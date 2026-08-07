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

// tools/.auto-battle-entry.ts
var auto_battle_entry_exports = {};
__export(auto_battle_entry_exports, {
  autoBattleWinPct: () => autoBattleWinPct,
  lineWeightForDef: () => lineWeightForDef,
  loadAutoBattleParams: () => loadAutoBattleParams,
  resolveAutoBattleByPower: () => resolveAutoBattleByPower,
  sumRosterFieldM: () => sumRosterFieldM
});
module.exports = __toCommonJS(auto_battle_entry_exports);

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
    fortify_obrona_proc: 50,
    _fortify_obrona_proc_opis: "ufortyfikowanyWPolu (fortyfikacja W POLU, NIE garnizon): +50% Obrony jednostki (mno\u017Cnik na efektywnej Obronie przed terenem/brodem). Garnizon miasta nadal u\u017Cywa fortify_obrona_bonus (flat +2 pkt).",
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
  },
  battle_loot: {
    _opis: "\u0141up po wygranej bitwie \u2014 % bazowego kosztu rekrutacji (Pieni\u0105dz + Surowiec) ka\u017Cdej jednostki wroga usuni\u0119tej z mapy po walce.",
    recruit_cost_pct: 100
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

// data/auto-battle-params.json
var auto_battle_params_default = {
  _opis: "Auto-walka v2b. Panel-C \u2192 Auto-walka \u2192 eksportuj panel C.",
  _maciej_kroki: [
    "1. Panel-C.xlsx \u2192 Auto-walka",
    "2. coef_* = ile krwi (skala) \xB7 p_atk/p_def = jak szybko ro\u015Bnie/maleje z przewag\u0105 R (kszta\u0142t)",
    "3. Zapisz \u2192 eksportuj panel C"
  ],
  kalibracja: "v2b-2026-06-30",
  straty: {
    L_MAX: 0.42,
    p_atk: 0.58,
    p_def: 0.58,
    L_MIN: 0.05,
    remis_pct: 0.4,
    coef_zwyciezca: 1,
    coef_przegrany: 1
  }
};

// src/game/auto-battle-params.ts
var file = auto_battle_params_default;
function loadAutoBattleParams() {
  const s = file.straty ?? {};
  const legacyP = s.p ?? 0.58;
  return {
    L_MAX: s.L_MAX ?? 0.42,
    p_atk: s.p_atk ?? legacyP,
    p_def: s.p_def ?? legacyP,
    L_MIN: s.L_MIN ?? 0.05,
    remis_pct: s.remis_pct ?? 0.4,
    coef_zwyciezca: s.coef_zwyciezca ?? 1,
    coef_przegrany: s.coef_przegrany ?? 1
  };
}
var UPSET_R_THRESHOLD = 1.15;
var UPSET_CHANCE = 0.2;
var TIE_EPS = 0.01;

// src/game/auto-battle-power.ts
var LINE_WEIGHTS = {
  "Wr\u0119cz": 1,
  "Flanka": 0.5,
  "Dystans": 0.25,
  "Morska": 0.5,
  "Wsparcie": 0.5
};
var BATTLE_EXCLUDED_TYPES = /* @__PURE__ */ new Set(["Zwiadowca", "Osadnik"]);
function isFieldBattleUnit(typeId, def) {
  if (isSiegeUnit(def)) return false;
  if (BATTLE_EXCLUDED_TYPES.has(typeId)) return false;
  return armyFieldPower(def) > 0;
}
function lineWeightForDef(def) {
  const rola = (def["Rola (linia)"] ?? "").trim();
  return LINE_WEIGHTS[rola] ?? 1;
}
function sumRosterFieldM(roster) {
  let sum = 0;
  for (const u of roster) {
    if (!isFieldBattleUnit(u.typeId, u.def)) continue;
    sum += armyFieldPower(u.def);
  }
  return Math.round(sum * 10) / 10;
}
function coreLoss(ratio, pExp, L_MAX) {
  const r = Math.max(1, ratio);
  return L_MAX / Math.pow(r, pExp);
}
function winnerLossPct(ratio, pExp, p) {
  const raw = p.coef_zwyciezca * coreLoss(ratio, pExp, p.L_MAX);
  const cap = Math.min(1, p.coef_zwyciezca * p.L_MAX);
  return Math.round(Math.max(p.L_MIN, Math.min(cap, raw)) * 1e4) / 1e4;
}
function loserLossPct(ratio, pExp, p) {
  const core = coreLoss(ratio, pExp, p.L_MAX);
  return Math.round(Math.min(1, p.coef_przegrany * (1 - core)) * 1e4) / 1e4;
}
function isTie(mAtk, mDef) {
  if (mAtk <= 0 && mDef <= 0) return true;
  const denom = Math.max(mAtk, mDef, 1);
  return Math.abs(mAtk - mDef) / denom < TIE_EPS;
}
function autoBattleWinPct(mAtk, mDef) {
  const a = Math.max(0, mAtk);
  const d = Math.max(0, mDef);
  if (a <= 0 && d <= 0) return 50;
  if (a <= 0) return 0;
  if (d <= 0) return 100;
  return Math.round(a / (a + d) * 100);
}
function resolveAutoBattleByPower(input) {
  const p = input.params ?? loadAutoBattleParams();
  const mAtk = input.mAtk;
  const mDef = input.mDef;
  const rng = input.rng ?? Math.random;
  if (mAtk <= 0 && mDef <= 0) {
    return { winner: "none", ratio: 1, mAtk, mDef, mDefEffective: mDef, lossAtkPct: 0, lossDefPct: 0 };
  }
  if (isTie(mAtk, mDef)) {
    return {
      winner: "tie",
      ratio: 1,
      mAtk,
      mDef,
      mDefEffective: mDef,
      lossAtkPct: p.remis_pct,
      lossDefPct: p.remis_pct,
      note: "remis M"
    };
  }
  let winner = mAtk > mDef ? "attacker" : "defender";
  let upset = false;
  const mW = Math.max(mAtk, mDef);
  const mL = Math.max(Math.min(mAtk, mDef), 1);
  let ratio = mW / mL;
  if (ratio < UPSET_R_THRESHOLD) {
    if (rng() < UPSET_CHANCE) {
      winner = winner === "attacker" ? "defender" : "attacker";
      upset = true;
      ratio = mW / mL;
    }
  }
  let lossAtk;
  let lossDef;
  if (winner === "attacker") {
    lossAtk = winnerLossPct(ratio, p.p_atk, p);
    lossDef = loserLossPct(ratio, p.p_def, p);
  } else {
    lossDef = winnerLossPct(ratio, p.p_def, p);
    lossAtk = loserLossPct(ratio, p.p_atk, p);
  }
  return {
    winner,
    ratio: Math.round(ratio * 1e3) / 1e3,
    mAtk,
    mDef,
    mDefEffective: mDef,
    lossAtkPct: lossAtk,
    lossDefPct: lossDef,
    upset
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  autoBattleWinPct,
  lineWeightForDef,
  loadAutoBattleParams,
  resolveAutoBattleByPower,
  sumRosterFieldM
});
