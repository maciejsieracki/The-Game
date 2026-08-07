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

// tools/.victory-entry.ts
var victory_entry_exports = {};
__export(victory_entry_exports, {
  OSTATNIA_EPOKA_GRY_V1: () => OSTATNIA_EPOKA_GRY_V1,
  PROG_DOMINACJI_POWER: () => PROG_DOMINACJI_POWER,
  allTechInScopeResearched: () => allTechInScopeResearched,
  checkVictory: () => checkVictory,
  isDominacjaVictory: () => isDominacjaVictory,
  isEliminated: () => isEliminated,
  isNaukaVictory: () => isNaukaVictory,
  powerShare: () => powerShare
});
module.exports = __toCommonJS(victory_entry_exports);

// data/e-start-params.json
var e_start_params_default = {
  _opis: "Panel-E (Grupa E): start, meta, generator E2, zwyci\u0119stwo, tempo. \u0179r\xF3d\u0142o: panele-sterowania/Panel-E.xlsx \u2192 export-e.py. ui-params.json = etykiety kreatora; ten plik = liczby i regu\u0142y silnika (docelowo odczyt w TS \u2014 dzi\u015B sync z kodem).",
  defaulty: {
    player_civ_id: "rzymianie",
    start_epoch_id: "kamien",
    map_quality_default: "\u015Arednia",
    render_quality_bundled: "medium"
  },
  skala_mapy: {
    Malenki: {
      rywale_ai: 2,
      miasta_panstwa: 3,
      typy_cywilizacji: 4,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 3, min: 2, max: 4 },
        braz: { default: 4, min: 3, max: 5 },
        zelazo: { default: 4, min: 3, max: 5 }
      },
      hex_w: 76,
      hex_h: 52
    },
    Ma\u0142y: {
      rywale_ai: 3,
      miasta_panstwa: 4,
      typy_cywilizacji: 5,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 4, min: 3, max: 5 },
        braz: { default: 5, min: 4, max: 6 },
        zelazo: { default: 5, min: 4, max: 6 }
      },
      hex_w: 108,
      hex_h: 74
    },
    Standardowy: {
      rywale_ai: 6,
      miasta_panstwa: 5,
      typy_cywilizacji: 6,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 5, min: 4, max: 6 },
        braz: { default: 6, min: 5, max: 7 },
        zelazo: { default: 6, min: 5, max: 7 }
      },
      hex_w: 168,
      hex_h: 120
    },
    Du\u017Cy: {
      rywale_ai: 7,
      miasta_panstwa: 6,
      typy_cywilizacji: 10,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 6, min: 5, max: 7 },
        braz: { default: 9, min: 8, max: 10 },
        zelazo: { default: 10, min: 9, max: 11 }
      },
      hex_w: 240,
      hex_h: 168
    },
    Ogromny: {
      rywale_ai: 8,
      miasta_panstwa: 7,
      typy_cywilizacji: 12,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 7, min: 6, max: 8 },
        braz: { default: 11, min: 10, max: 12 },
        zelazo: { default: 12, min: 11, max: 13 }
      },
      hex_w: 336,
      hex_h: 238
    },
    "Super Huge": {
      rywale_ai: 10,
      miasta_panstwa: 8,
      typy_cywilizacji: 14,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 8, min: 7, max: 8 },
        braz: { default: 13, min: 12, max: 14 },
        zelazo: { default: 14, min: 13, max: 15 }
      },
      hex_w: 672,
      hex_h: 476
    }
  },
  generator_e2: {
    resource_mult_low: 0.6,
    resource_mult_normal: 1,
    resource_mult_high: 1.4,
    resource_baseline_rarity: 1.35,
    river_base_low: 20,
    river_base_normal: 50,
    river_base_high: 80,
    river_scale_mala: 1,
    river_scale_srednia: 1.35,
    river_scale_duza: 1.7,
    river_scale_ogromna: 2.1,
    desert_threshold_low: 0.68,
    desert_threshold_normal: 0.63,
    desert_threshold_high: 0.58,
    forest_threshold_low: 0.65,
    forest_threshold_normal: 0.58,
    forest_threshold_high: 0.5
  },
  tempo_gry: {
    szybka: 1,
    standardowa: 2,
    dluga: 4
  },
  koszt_budynkow_pace: {
    niski: 1,
    normalny: 2,
    wysoki: 4
  },
  koszt_jednostek_pace: {
    niski: 1,
    normalny: 2,
    wysoki: 4
  },
  zwyciestwo: {
    ostatnia_epoka_v1: 3,
    prog_dominacji_power: 0.5,
    dominacja_wymaga_ostatniej_epoki: true,
    nauka_wymaga_rakiety: true
  },
  kreator_zaawansowane: {
    seed_mode_default: "random",
    manual_seed_default: 424242,
    barbarians_enabled_default: true,
    battle_always_manual_default: false,
    fog_debug_reveal_all_default: false,
    victory_power_and_dominance_default: true
  },
  decyzje_kanon: {
    e1_reset_nowa_gra: true,
    e1_tech_kaskada_epok: true,
    e1_ziemia_preset_staly: true,
    e1_zloza_tylko_gory: true,
    e1_zloza_ukryte_do_epoki: true,
    e2_barbarzyncy_do_przed_sredniowiecza: true,
    e2_buntownicy_od_sredniowiecza: true
  }
};

// src/data/e-start-params-loader.ts
var R = e_start_params_default;
function eStartOstatniaEpokaV1() {
  const v = R.zwyciestwo?.ostatnia_epoka_v1;
  return typeof v === "number" && v > 0 ? v : 3;
}
function eStartProgDominacjiPower() {
  const v = R.zwyciestwo?.prog_dominacji_power;
  return typeof v === "number" && v > 0 && v < 1 ? v : 0.5;
}
function eStartDominacjaWymagaOstatniejEpoki() {
  return R.zwyciestwo?.dominacja_wymaga_ostatniej_epoki !== false;
}
function eStartNaukaWymagaRakiety() {
  return R.zwyciestwo?.nauka_wymaga_rakiety !== false;
}

// src/game/victory.ts
var OSTATNIA_EPOKA_GRY_V1 = eStartOstatniaEpokaV1();
var PROG_DOMINACJI_POWER = eStartProgDominacjiPower();
var DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI = eStartDominacjaWymagaOstatniejEpoki();
var NAUKA_WYMAGA_RAKIETY = eStartNaukaWymagaRakiety();
function victoryModeAllowsDominacja(mode) {
  return mode === void 0 || mode === "dominacja" || mode === "moc_i_dominacja";
}
function victoryModeAllowsMoc(mode) {
  return mode === void 0 || mode === "moc" || mode === "moc_i_dominacja";
}
function citiesOf(playerId, cities) {
  const out = [];
  for (const c of cities) {
    if (c.ownerId === playerId) out.push(c);
  }
  return out;
}
function isEliminated(playerId, cities) {
  return citiesOf(playerId, cities).length === 0;
}
function powerShare(potegaGracza, potegi) {
  let sum = 0;
  for (const p of potegi) sum += Math.max(0, p);
  if (sum <= 0) return 0;
  return Math.max(0, potegaGracza) / sum;
}
function isDominacjaVictory(potegaGracza, potegi, graczEra, ostatniaEpoka = OSTATNIA_EPOKA_GRY_V1) {
  if (graczEra < ostatniaEpoka) return false;
  return powerShare(potegaGracza, potegi) > PROG_DOMINACJI_POWER;
}
function isNaukaVictory(wszystkieTechZbadane, rakietaWystrzelona) {
  if (!wszystkieTechZbadane) return false;
  if (!NAUKA_WYMAGA_RAKIETY) return true;
  return rakietaWystrzelona;
}
function allTechInScopeResearched(researched, techIdsInScope) {
  if (techIdsInScope.length === 0) return false;
  for (const id of techIdsInScope) {
    if (!researched.has(id)) return false;
  }
  return true;
}
function checkVictory(input) {
  const { cities, gracz } = input;
  const ostatniaEpoka = input.ostatniaEpoka ?? OSTATNIA_EPOKA_GRY_V1;
  const graczEra = input.graczEra ?? 1;
  const potegaGracza = input.potegaGracza ?? 0;
  const potegi = input.potegiWszystkich ?? [];
  const mode = input.victoryMode;
  if (victoryModeAllowsDominacja(mode) && potegi.length > 0 && isDominacjaVictory(potegaGracza, potegi, graczEra, ostatniaEpoka)) {
    return { winner: gracz, rodzaj: "dominacja" };
  }
  const osadnicy = input.liczbaOsadnikow ?? 0;
  const kiedysMial = input.graczKiedysMialMiasto ?? true;
  if (isEliminated(gracz, cities) && osadnicy === 0 && kiedysMial) {
    return { winner: gracz, rodzaj: "przegrana" };
  }
  const wszystkieTech = input.wszystkieTechZbadane ?? (input.epokaKoncowa === true && input.naukaUkonczona === true);
  const rakieta = input.rakietaWystrzelona ?? input.naukaUkonczona === true;
  if (victoryModeAllowsMoc(mode) && isNaukaVictory(!!wszystkieTech, !!rakieta)) {
    return { winner: gracz, rodzaj: "nauka" };
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OSTATNIA_EPOKA_GRY_V1,
  PROG_DOMINACJI_POWER,
  allTechInScopeResearched,
  checkVictory,
  isDominacjaVictory,
  isEliminated,
  isNaukaVictory,
  powerShare
});
