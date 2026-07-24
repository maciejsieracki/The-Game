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

// tools/.cs-entry.ts
var cs_entry_exports = {};
__export(cs_entry_exports, {
  FALLBACK_CULTURE_PARAMS: () => FALLBACK_CULTURE_PARAMS,
  FALLBACK_RELIGION_PARAMS: () => FALLBACK_RELIGION_PARAMS,
  conquestNoGarrisonLawPenalty: () => conquestNoGarrisonLawPenalty,
  conquestRevoltRiskMultiplier: () => conquestRevoltRiskMultiplier,
  conquestUnstableHappinessPenalty: () => conquestUnstableHappinessPenalty,
  cultureBuildingsFromIds: () => cultureBuildingsFromIds,
  isConquestUnstable: () => isConquestUnstable,
  onCityCapturedCulture: () => onCityCapturedCulture,
  religionBuildingsFromIds: () => religionBuildingsFromIds,
  tickCityCultureReligion: () => tickCityCultureReligion
});
module.exports = __toCommonJS(cs_entry_exports);

// src/game/culture-religion.ts
function finiteOr(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}
function clamp(x, lo, hi) {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}
var FALLBACK_CULTURE_PARAMS = Object.freeze({
  progZasieg1: 100,
  progZasieg2: 250,
  progZasieg3: 500,
  zadowolenie100: 2,
  zadowolenie75: 1,
  zadowolenie50: 0,
  karaLt50: -1,
  karaLt25: -2,
  konwersjaBaza: 1,
  konwersjaSwiatynia: 1.5,
  konwersjaAmfiteatr: 1,
  konwersjaBiblioteka: 2,
  konwersjaPalac: 2,
  konwersjaStela: 0.5,
  konwersjaSad: 2,
  konwersjaLaznia: 1,
  konwersjaCapTura: 5
});
function convertCulture(city, buildings, params = FALLBACK_CULTURE_PARAMS) {
  const share = clamp(finiteOr(city.ownCultureShare ?? 0, 0), 0, 1);
  let ratePct = params.konwersjaBaza;
  if (buildings.hasAmfiteatr) ratePct += params.konwersjaAmfiteatr;
  if (buildings.hasBiblioteka) ratePct += params.konwersjaBiblioteka;
  if (buildings.hasPalac) ratePct += params.konwersjaPalac;
  if (buildings.hasStela) ratePct += params.konwersjaStela;
  if (buildings.hasSad) ratePct += params.konwersjaSad;
  if (buildings.hasLaznia) ratePct += params.konwersjaLaznia;
  ratePct = clamp(ratePct, 0, params.konwersjaCapTura);
  const appliedRate = ratePct / 100;
  const next = clamp(share + appliedRate, 0, 1);
  return {
    ownCultureShare: next,
    appliedRate,
    fullyConverted: next >= 1
  };
}
var FALLBACK_RELIGION_PARAMS = Object.freeze({
  progDominacjiPct: 50,
  szybkoscSzerzeniaBazowa: 1,
  swiatyniaBonusSzerzenia: 1,
  szerzenieMaxDystans: 3,
  zadowolenieDominujaca: 2,
  karaObca: -2,
  karaBrakReligii: -1,
  konwersjaBazaPct: 2,
  konwersjaSwiatyniaPct: 4,
  konwersjaKregiPct: 2
});
function totalAdherents(state) {
  let sum = 0;
  for (const k in state.counts) {
    const v = state.counts[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) sum += v;
  }
  return sum;
}
function religionConversionRatePct(buildings, params) {
  let ratePct = params.konwersjaBazaPct;
  if (buildings.hasSwiatynia) ratePct += params.konwersjaSwiatyniaPct;
  if (buildings.hasKamienneKregi) ratePct += params.konwersjaKregiPct;
  return Math.max(0, ratePct);
}
function convertViaTemple(state, targetReligion, religiousBuildings, params = FALLBACK_RELIGION_PARAMS) {
  const buildings = typeof religiousBuildings === "boolean" ? { hasSwiatynia: religiousBuildings } : religiousBuildings;
  const total = totalAdherents(state);
  const cloneCounts = {};
  for (const k in state.counts) {
    const v = state.counts[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) cloneCounts[k] = v;
  }
  const ratePct = religionConversionRatePct(buildings, params);
  const appliedRate = ratePct / 100;
  const targetCount = targetReligion && cloneCounts[targetReligion] || 0;
  const convertible = total - targetCount;
  if (!targetReligion || total <= 0 || convertible <= 0) {
    const share = total > 0 ? targetCount / total : 0;
    return {
      state: { counts: cloneCounts },
      converted: 0,
      appliedRate,
      targetShare: share,
      fullyConverted: total > 0 && convertible <= 0
    };
  }
  let toConvert = Math.round(appliedRate * convertible);
  if (toConvert <= 0 && appliedRate > 0) toConvert = 1;
  toConvert = Math.min(toConvert, convertible);
  let remaining = toConvert;
  const donors = Object.keys(cloneCounts).filter((k) => k !== targetReligion && cloneCounts[k] > 0).sort((a, b) => {
    const dv = cloneCounts[b] - cloneCounts[a];
    if (dv !== 0) return dv;
    return a < b ? -1 : 1;
  });
  for (const k of donors) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, cloneCounts[k]);
    cloneCounts[k] -= take;
    if (cloneCounts[k] <= 0) delete cloneCounts[k];
    remaining -= take;
  }
  const actuallyConverted = toConvert - remaining;
  cloneCounts[targetReligion] = targetCount + actuallyConverted;
  const newTotal = totalAdherents({ counts: cloneCounts });
  const newTargetCount = cloneCounts[targetReligion] || 0;
  const targetShare = newTotal > 0 ? newTargetCount / newTotal : 0;
  return {
    state: { counts: cloneCounts },
    converted: actuallyConverted,
    appliedRate,
    targetShare,
    fullyConverted: targetShare >= 1
  };
}

// src/game/conquest-stability.ts
function pick(row, difficulty, fallback) {
  if (!row) return fallback;
  const v = row[difficulty];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function isForeignCultureDominant(ownCultureShare) {
  return ownCultureShare < 0.5;
}
function isConquestUnstable(ownCultureShare, foreignReligionDominant) {
  return isForeignCultureDominant(ownCultureShare) && foreignReligionDominant;
}
function onCityCapturedCulture(city, newOwnerId, previousOwnerId) {
  if (newOwnerId === void 0 || previousOwnerId === void 0 || newOwnerId === previousOwnerId) {
    return;
  }
  const prev = Math.max(0, Math.min(1, city.ownCultureShare ?? city.kulturaOwnShare ?? 1));
  city.ownCultureShare = Math.max(0, Math.min(1, 1 - prev));
  city.kulturaOwnShare = city.ownCultureShare;
}
function cultureBuildingsFromIds(builtIds) {
  return {
    hasAmfiteatr: builtIds.includes("teatr") || builtIds.includes("akademia"),
    hasBiblioteka: builtIds.includes("biblioteka"),
    hasPalac: builtIds.includes("palac") || builtIds.includes("palac_ii") || builtIds.includes("palac_iii"),
    hasStela: builtIds.includes("stela"),
    hasSad: builtIds.includes("sad"),
    hasLaznia: builtIds.includes("laznia_publiczna")
  };
}
function religionBuildingsFromIds(builtIds) {
  return {
    hasSwiatynia: builtIds.includes("swiatynia"),
    hasKamienneKregi: builtIds.includes("kamienne_kregi")
  };
}
function tickCityCultureReligion(ownCultureShare, religionState, builtIds, ownerReligion, foreignReligionDominant, cultureParams, religionParams) {
  let share = ownCultureShare;
  let rel = religionState;
  if (share < 1) {
    const cc = { kulturaSkumulowana: 0, ownCultureShare: share };
    const conv = convertCulture(cc, cultureBuildingsFromIds(builtIds), cultureParams);
    share = conv.ownCultureShare;
  }
  if (foreignReligionDominant && ownerReligion) {
    const relConv = convertViaTemple(
      rel,
      ownerReligion,
      religionBuildingsFromIds(builtIds),
      religionParams
    );
    rel = relConv.state;
    return {
      ownCultureShare: share,
      religionState: rel,
      cultureRateApplied: share - ownCultureShare,
      religionConverted: relConv.converted
    };
  }
  return {
    ownCultureShare: share,
    religionState: rel,
    cultureRateApplied: share - ownCultureShare,
    religionConverted: 0
  };
}
function conquestUnstableHappinessPenalty(ownCultureShare, foreignReligionDominant, society, difficulty = "normal") {
  if (!isConquestUnstable(ownCultureShare, foreignReligionDominant)) return 0;
  const sz = society?.szczescie ?? {};
  return pick(sz.szczescie_kara_podboj_podwojna_obca, difficulty, -2);
}
function conquestNoGarrisonLawPenalty(ownCultureShare, foreignReligionDominant, garnizonCount, society, difficulty = "normal") {
  if (garnizonCount > 0) return 0;
  if (!isConquestUnstable(ownCultureShare, foreignReligionDominant)) return 0;
  const pr = society?.prawo ?? {};
  return pick(pr.prawo_kara_podboj_bez_garnizonu, difficulty, -3);
}
function conquestRevoltRiskMultiplier(ownCultureShare, foreignReligionDominant, garnizonCount) {
  if (garnizonCount > 0) return 1;
  if (!isConquestUnstable(ownCultureShare, foreignReligionDominant)) return 1;
  return 1.5;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FALLBACK_CULTURE_PARAMS,
  FALLBACK_RELIGION_PARAMS,
  conquestNoGarrisonLawPenalty,
  conquestRevoltRiskMultiplier,
  conquestUnstableHappinessPenalty,
  cultureBuildingsFromIds,
  isConquestUnstable,
  onCityCapturedCulture,
  religionBuildingsFromIds,
  tickCityCultureReligion
});
