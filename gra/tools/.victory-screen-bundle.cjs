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

// tools/.victory-screen-entry.ts
var victory_screen_entry_exports = {};
__export(victory_screen_entry_exports, {
  buildVictoryScreenData: () => buildVictoryScreenData,
  formatVictoryConditionLabel: () => formatVictoryConditionLabel,
  formatVictorySubtitle: () => formatVictorySubtitle,
  formatVictoryTitle: () => formatVictoryTitle
});
module.exports = __toCommonJS(victory_screen_entry_exports);

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
    Malenki: { rywale_ai: 2, miasta_panstwa: 4, typy_cywilizacji: 4, hex_w: 76, hex_h: 52 },
    Ma\u0142y: { rywale_ai: 3, miasta_panstwa: 5, typy_cywilizacji: 5, hex_w: 108, hex_h: 74 },
    Standardowy: { rywale_ai: 6, miasta_panstwa: 6, typy_cywilizacji: 6, hex_w: 168, hex_h: 120 },
    Du\u017Cy: { rywale_ai: 7, miasta_panstwa: 7, typy_cywilizacji: 7, hex_w: 240, hex_h: 168 },
    Ogromny: { rywale_ai: 8, miasta_panstwa: 8, typy_cywilizacji: 10, hex_w: 336, hex_h: 238 },
    "Super Huge": { rywale_ai: 10, miasta_panstwa: 8, typy_cywilizacji: 12, hex_w: 672, hex_h: 476 }
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
    szybka: 0.2,
    standardowa: 1,
    dluga: 5
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

// src/ui/icons/brand/tokens.css?raw
var tokens_default = {};

// src/ui/brandTokenVars.ts
var CIV_ALIASES_CSS = `
:root {
  --civ-bg-deep: var(--tg-bg-deep);
  --civ-panel-bg: var(--tg-panel-bg);
  --civ-gold-primary: var(--tg-gold-primary);
  --civ-gold-dim: var(--tg-gold-dim);
  --civ-gold-border: rgba(232, 216, 138, 0.22);
  --civ-gold-border-strong: rgba(232, 216, 138, 0.45);
  --civ-text-primary: var(--tg-text-primary);
  --civ-text-muted: var(--tg-text-muted);
  --civ-text-pergament: #c8b898;
  --civ-science: var(--tg-science-blue);
  --civ-danger: var(--tg-red);
  --civ-success: var(--tg-green);
  --civ-wiki-accent: #a8c878;
  --civ-font-title: var(--tg-font-title);
  --civ-font-ui: var(--tg-font-ui);
  --civ-radius-btn: var(--tg-radius-btn);
  --civ-radius-panel: var(--tg-radius-panel);
}
`;
var CIV_BRAND_ROOT_CSS = tokens_default + CIV_ALIASES_CSS;

// src/ui/victoryScreen.ts
function formatVictoryTitle(rodzaj, turn) {
  switch (rodzaj) {
    case "dominacja":
      return `ZWYCI\u0118STWO \u2014 dominacja (tura ${turn})`;
    case "nauka":
      return `ZWYCI\u0118STWO NAUKOWE (tura ${turn})`;
    case "przegrana":
      return `PRZEGRANA (tura ${turn})`;
  }
}
function formatVictorySubtitle(rodzaj, stats) {
  const progPct = Math.round(PROG_DOMINACJI_POWER * 100);
  switch (rodzaj) {
    case "dominacja": {
      const share = stats.powerShare != null ? Math.round(stats.powerShare * 100) : null;
      const shareLine = share != null ? `Tw\xF3j Power: ${share}% \u015Bwiata (pr\xF3g ${progPct}%). ` : "";
      return `${shareLine}Dominacja w ostatniej epoce \u2014 nie musisz eliminowa\u0107 wszystkich nacji.`;
    }
    case "nauka":
      return "Wszystkie technologie w zakresie gry zbadane. Rakieta z robotami wyruszy\u0142a na najbli\u017Csz\u0105 planet\u0119.";
    case "przegrana":
      return "Twoje panowanie dobieg\u0142o ko\u0144ca. Utraci\u0142e\u015B wszystkie miasta i osadnik\xF3w.";
  }
}
function formatVictoryConditionLabel(rodzaj) {
  switch (rodzaj) {
    case "dominacja":
      return "Warunek: dominacja (Power)";
    case "nauka":
      return "Warunek: zwyci\u0119stwo naukowe";
    case "przegrana":
      return "Warunek: utrata imperium";
  }
}
function buildVictoryScreenData(result, stats) {
  return { rodzaj: result.rodzaj, stats };
}
var LAUREL_SVG = [
  '<svg class="vsc-emblem-svg" width="72" height="72" viewBox="0 0 24 24" fill="none"',
  ' stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
  '<path d="M12 21C7 19 5 14 5 9M5 9c2 .3 3.4 1.4 4 3M6 12c1.6 .3 2.8 1.2 3.4 2.6M7.6 15c1.4 .3 2.4 1.1 3 2.3M6 6.4c1.6 .3 2.8 1.2 3.4 2.6"/>',
  '<path d="M12 21c5-2 7-7 7-12M19 9c-2 .3-3.4 1.4-4 3M18 12c-1.6 .3-2.8 1.2-3.4 2.6M16.4 15c-1.4 .3-2.4 1.1-3 2.3M18 6.4c-1.6 .3-2.8 1.2-3.4 2.6"/>',
  "</svg>"
].join("");
var SHIELD_FAIL_SVG = [
  '<svg class="vsc-emblem-svg" width="76" height="76" viewBox="0 0 24 24" fill="none"',
  ' stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
  '<path d="M12 3 5 5.5v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9v-5Z"/>',
  '<path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5"/>',
  "</svg>"
].join("");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildVictoryScreenData,
  formatVictoryConditionLabel,
  formatVictorySubtitle,
  formatVictoryTitle
});
