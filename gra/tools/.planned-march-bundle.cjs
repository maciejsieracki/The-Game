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

// tools/.planned-march-entry.ts
var planned_march_entry_exports = {};
__export(planned_march_entry_exports, {
  applyFogToPathPlan: () => applyFogToPathPlan,
  computePath: () => computePath,
  deserializeGame: () => deserializeGame,
  executeMarchStep: () => executeMarchStep,
  pathCost: () => pathCost,
  planPathTurns: () => planPathTurns,
  plannedMarchesFromSave: () => plannedMarchesFromSave,
  plannedMarchesToSave: () => plannedMarchesToSave,
  serializeGame: () => serializeGame,
  shouldStopAtObstacle: () => shouldStopAtObstacle,
  truncatePathAtFogFrontier: () => truncatePathAtFogFrontier,
  truncatePathToBudget: () => truncatePathToBudget,
  validateAutoMarchFromSave: () => validateAutoMarchFromSave
});
module.exports = __toCommonJS(planned_march_entry_exports);

// data/terrain-improvements.json
var terrain_improvements_default = {
  _meta: {
    opis: "Ulepszenia terenu (lane MIASTO: liczby bonusow + koszt + epoka). Gdzie wolno (placement) + render = MAPA. Przeplyw w turze = SILNIK. Koszt w PRACY (z puli Pracy w skarbcu, Q4). Lista uzgodniona z MAPA + uzupelniona na przyszlosc wczesnych epok (2026-06-24). EKONOMIA: dodano surowiecOdblokowany (ASCII) + zasieg_terytorium (2026-06-25).",
    bonus_pola: "zywnosc | praca | handel | pieniadz | kamien | drewno (na obrabiane pole)",
    epoka: "1=Kamien, 2=Braz, 3=Zelazo",
    decyzje_MIASTO: "lodzie_rybackie = TAK teraz; kamieniolom OSOBNO od kopalni (rozne surowce); teren NIE daje +Nauka/+Kultura (te z budynkow/specjalistow/suwaka). Tarasy = +zywnosc (nie kultura).",
    kanon_zywnosc_hodowla: "docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md (2026-06-29 Maciej) \u2014 obowiazuje nad tym plikiem do wdrozenia",
    decyzje_EKONOMIA: "surowiecOdblokowany = klucz ASCII surowca (lub null) wg modelu dostepu boolean v0.1; zasieg_terytorium: posterunek=5 (epoka 2), fort=10 (epoka 3), miasto=10 (stale); zakladanie kolejnego miasta wymaga Straznica LUB zasiegu obecnego miasta. Rozbieznosci kluczy z resources.json (brak pola id) zapisane w EKONOMIA-ulepszenia-terenu-v01.md.",
    klucze_surowcow_ASCII: "drewno | kamien | glina | ruda | zelazo | stal | bydlo | owce | lama | kon | sol"
  },
  farma: {
    nazwa: "Farma",
    epoka: 1,
    bonus: {
      zywnosc: 3
    },
    surowiecOdblokowany: null,
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "ziemia uprawna; DZIA\u0141A BEZ rzeki (podstawowy)",
    koszt_praca: 20,
    tech: "Rolnictwo",
    odblokowuje: ""
  },
  irygacja: {
    nazwa: "Irygacja",
    epoka: 2,
    bonus: {
      zywnosc: 5
    },
    surowiecOdblokowany: null,
    teren: "\u0141\u0105ka, R\xF3wnina, Pustynia",
    warunek: "TYLKO pole s\u0105siaduj\u0105ce z rzek\u0105 (1 pole) lub na rzece \u2014 BRAK \u0142a\u0144cuch\xF3w; kluczowa nad Nilem",
    koszt_praca: 30,
    tech: "Irygacja",
    odblokowuje: ""
  },
  bydlo: {
    nazwa: "Byd\u0142o",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 3
    },
    surowiecOdblokowany: "bydlo",
    surowiecOdblokowany_uwaga: "ABC-18: dost\u0119p dopiero po postawieniu na z\u0142o\u017Cu byd\u0142a",
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "plaski l\u0105d; pierwsze: z\u0142o\u017Ce byd\u0142a; potem po odblokowaniu \u2014 bez z\u0142o\u017Ca; + farma lub solo; NIE na Pustyni",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Byd\u0142o (Rydwan po odblokowaniu)"
  },
  owce: {
    nazwa: "Owce",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      praca: 2
    },
    surowiecOdblokowany: "owce",
    surowiecOdblokowany_uwaga: "pierwsze na zlozu owiec; solo na wzgorzu; bez farmy/bydla",
    teren: "Wzg\xF3rza",
    warunek: "solo wzg\xF3rze; pierwsze: z\u0142o\u017Ce owiec; potem wzg\xF3rze bez z\u0142o\u017Ca po odblokowaniu",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Owce (we\u0142na / jedzenie)"
  },
  lama: {
    nazwa: "Lama",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      praca: 3
    },
    surowiecOdblokowany: "lama",
    surowiecOdblokowany_uwaga: "TYLKO Inkowie; solo \u2014 bez innych ulepszen na heksie; pierwsze na zlozu lamy",
    teren: "\u0141\u0105ka, R\xF3wnina, Wzg\xF3rza",
    warunek: "solo; tylko cyw. Inkowie; pierwsze: z\u0142o\u017Ce lamy; NIE na Pustyni",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Lama (transport / \u017Cywno\u015B\u0107)"
  },
  stadnina: {
    nazwa: "Stadnina",
    epoka: 2,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: "kon",
    surowiecOdblokowany_uwaga: "ABC-18: tylko na z\u0142o\u017Cu konia + tech Je\u017Adziectwo",
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "solo; tylko heks ze z\u0142o\u017Cem konia w terytorium",
    koszt_praca: 28,
    tech: "Je\u017Adziectwo",
    odblokowuje: "Ko\u0144 (jednostki konne)"
  },
  kopalnia: {
    nazwa: "Kopalnia",
    epoka: 1,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: "ruda",
    surowiecOdblokowany_uwaga: "klucz 'ruda' wg Surowiec='Ruda' w resources.json; brak pola id \u2014 propozycja EKONOMIA, wymaga uzgodnienia z DANE",
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce Rudy",
    warunek: "wydobycie rudy do magazynu",
    koszt_praca: 25,
    tech: "Murarstwo",
    odblokowuje: "Metal/Br\u0105z (jednostki br\u0105zowe, mury)"
  },
  glinianka: {
    nazwa: "Glinianka",
    epoka: 2,
    bonus: {
      praca: 1
    },
    surowiecOdblokowany: "glina",
    surowiecOdblokowany_uwaga: "klucz 'glina' wg Surowiec='Glina' w resources.json; brak pola id \u2014 propozycja EKONOMIA",
    teren: "z\u0142o\u017Ce Gliny",
    warunek: "glina \u2192 ceg\u0142a (wa\u017Cne w br\u0105zie)",
    koszt_praca: 20,
    tech: "Garncarstwo",
    odblokowuje: "Ceg\u0142a (budynki br\u0105zu)"
  },
  kamieniolom: {
    nazwa: "Kamienio\u0142om",
    epoka: 1,
    bonus: {
      praca: 1,
      kamien: 1
    },
    surowiecOdblokowany: "kamien",
    surowiecOdblokowany_uwaga: "klucz 'kamien' wg Surowiec='Kamie\u0144' w resources.json; brak pola id \u2014 propozycja EKONOMIA; UWAGA: 'kamien' pojawia sie rowniez w bonus{} jako efekt plonu \u2014 DANE musi zdecydowac czy bonus.kamien = dostep czy liczba",
    teren: "Wzg\xF3rza, G\xF3ry (kamie\u0144)",
    warunek: "budulec \u2014 mury, budynki",
    koszt_praca: 22,
    tech: "Murarstwo",
    odblokowuje: "Kamie\u0144 (mury / budynki)"
  },
  oboz_lowiecki: {
    nazwa: "Ob\xF3z \u0142owiecki",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      pieniadz: 1
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "dzika zwierzyna nie jest osobnym surowcem w resources.json v0.1 \u2014 brak klucza; plony ekonomiczne (zywnosc+pieniadz) jako substytut",
    teren: "Las / dzika zwierzyna",
    warunek: "dzika zwierzyna",
    koszt_praca: 18,
    tech: "\u0141owiectwo",
    odblokowuje: ""
  },
  wyrab: {
    nazwa: "Wyr\u0105b",
    typ: "wycinka",
    epoka: 1,
    bonus: {},
    surowiecOdblokowany: null,
    teren: "Las",
    warunek: "koszt 5 Pracy na start; +20 Pracy/tur\u0119 \xD7 3 tury (=60); potem teren bazowy bez lasu",
    koszt_praca: 5,
    tech: null,
    wycinka: {
      praca_per_tura: 20,
      tury: 3,
      usuwa_nakladke: "las"
    },
    odblokowuje: ""
  },
  tartak: {
    nazwa: "Tartak",
    typ: "ulepszenie",
    epoka: 1,
    bonus: {
      praca: 3
    },
    surowiecOdblokowany: "drewno",
    surowiecOdblokowany_uwaga: "v0.1: tylko dost\u0119p boolean (panel Surowce) \u2014 bez liczenia ilo\u015Bci w magazynie",
    teren: "L\u0105d w terytorium (\u0142\u0105ka, lasy, wzg\xF3rza\u2026)",
    warunek: "sta\u0142e ulepszenie; MO\u017BE na lesie \u2014 las NIE znika; odblokowuje dost\u0119p do drewna (v0.1 bez ilo\u015Bci)",
    koszt_praca: 25,
    tech: "Obr\xF3bka drewna",
    odblokowuje: "Deski (z budynkiem miejskim Tartak)"
  },
  tarasy: {
    nazwa: "Tarasy uprawne",
    epoka: 2,
    bonus: {
      zywnosc: 3
    },
    surowiecOdblokowany: null,
    teren: "Wzg\xF3rza",
    warunek: "Wzg\xF3rze w terytorium; solo; +\u017Cywno\u015B\u0107; nie na z\u0142o\u017Cu",
    koszt_praca: 25,
    tech: "Rolnictwo",
    odblokowuje: "",
    uwagi: "T-TECH-4 Maciej 2026-07-04: po Rolnictwie \u2014 wszystkie cywilizacje"
  },
  lodzie_rybackie: {
    nazwa: "\u0141odzie rybackie",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 3
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "ryby nie sa osobnym surowcem w resources.json v0.1; plony (zywnosc) jako substytut; DANE moze dodac klucz 'ryby' w przyszlosci",
    teren: "Wybrze\u017Ce, Morze (ryby)",
    warunek: "\u0142awica ryb",
    koszt_praca: 20,
    tech: "\u017Begluga",
    odblokowuje: ""
  },
  warzelnia_soli: {
    nazwa: "Warzelnia soli",
    epoka: 2,
    bonus: {
      pieniadz: 1,
      zywnosc: 1
    },
    surowiecOdblokowany: "sol",
    surowiecOdblokowany_uwaga: "klucz 'sol' \u2014 Sol nie ma wpisu w resources.json v0.1 (brak Surowiec='Sol'); propozycja EKONOMIA: dodac 'sol' do resources.json; wymaga uzgodnienia z DANE",
    teren: "z\u0142o\u017Ce soli (Pustynia/R\xF3wnina \u2014 hex.zloze=sol)",
    warunek: "s\xF3l (konserwacja \u017Cywno\u015Bci + handel); bez wybrze\u017Ca bez z\u0142o\u017Ca",
    koszt_praca: 20,
    tech: "Garncarstwo",
    odblokowuje: "S\xF3l"
  },
  fort: {
    nazwa: "Fort",
    epoka: 3,
    bonus: {},
    surowiecOdblokowany: null,
    bonus_obrona_proc: 100,
    bonus_wymaga_obozowania: true,
    zasieg_pol: 10,
    zasieg_terytorium: 10,
    zasieg_kontroli: 10,
    teren: "dowolny l\u0105d w terytorium",
    warunek: "+100% Obrony jednostkom obozuj\u0105cym na polu fortu (bez plon\xF3w); rozszerza zasi\u0119g terytorium o promie\u0144 10 p\xF3l",
    koszt_praca: 25,
    tech: "Wojskowosc",
    odblokowuje: "",
    uwagi: "ABC-10 Maciej 2026-07-04: Fort (mapa) \u2260 Cytadela (miasto). \u017Belazo ep.3; zasi\u0119g 10; +100% Obrona obozowanie"
  },
  droga: {
    nazwa: "Droga",
    epoka: 1,
    bonus: {
      handel: 1
    },
    surowiecOdblokowany: null,
    teren: "ka\u017Cdy przejezdny heks",
    warunek: "\u0142\u0105czy TYLKO miasta i posterunki (MAPA pilnuje); +szybko\u015B\u0107 ruchu jednostek",
    koszt_praca: 15,
    tech: "Ko\u0142o",
    odblokowuje: ""
  },
  droga_brukowana: {
    nazwa: "Droga brukowana",
    typ: "ulepszenie",
    epoka: 3,
    bonus: {},
    bonus_ruch: 2,
    surowiecOdblokowany: null,
    upgradeFrom: "droga",
    teren: "hex z Drogi",
    warunek: "upgrade Drogi; +2 ruch jednostek; ta sama sie\u0107 dr\xF3g co Droga",
    koszt_praca: 25,
    tech: "Drogi brukowane",
    odblokowuje: "",
    uwagi: "T-TECH-9 Maciej 2026-07-04"
  },
  popalnia_brazu: {
    nazwa: "Popalnia br\u0105zu",
    epoka: 2,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: "ruda",
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce Rudy",
    warunek: "wst\u0119pne przetwarzanie rudy (przed Odlewni\u0105 w mie\u015Bcie)",
    koszt_praca: 22,
    tech: "Br\u0105zownictwo",
    odblokowuje: "Odlewnia br\u0105zu (budynek miejski)",
    uwagi: "ABC-7 + ABC-14 Maciej 2026-07-04: tylko heks ze z\u0142o\u017Cem rudy"
  },
  posterunek: {
    nazwa: "Posterunek (Stra\u017Cnica)",
    epoka: 2,
    bonus: {},
    surowiecOdblokowany: null,
    bonus_obrona_proc: 50,
    bonus_wymaga_obozowania: true,
    zasieg_pol: 5,
    zasieg_terytorium: 5,
    teren: "l\u0105d w/na kraw\u0119dzi w\u0142asnego zasi\u0119gu",
    warunek: "NIE miasto, BEZ plon\xF3w; ROZSZERZA zasi\u0119g terytorium o promie\u0144 5 p\xF3l; odkrywa mg\u0142\u0119; w\u0119ze\u0142 sieci dr\xF3g; +50% Obrony jednostkom obozuj\u0105cym na polu",
    koszt_praca: 30,
    tech: "-",
    tech_uwaga: "T-TECH-3 Maciej 2026-06-26: bramka AND w kodzie \u2014 Obr\xF3bka drewna + Murarstwo (improvement-tech.ts IMPROVEMENT_MULTI_TECH_REQ)",
    odblokowuje: "",
    uwagi: "Br\u0105z (epoka 2); zasieg_terytorium=5; +50% Obrona w trybie obozowania (decyzja Naster 2026-06-25)"
  },
  _miasto_zasieg_ref: {
    _komentarz: "NOTA (nie ulepsz. terenu): miasto ma zasieg_terytorium=10 (stale, wg dyspozycji EKONOMIA 2026-06-25); helper: okolica.cityRangeForPopulation \u2014 pop<5 r5, pop>=5 r10, pop>=10 r15 (wg memory civ-zasieg-miasta-dynamiczny); zasieg_terytorium=10 to wartosc poczatkowa/bazowa dla zasladania kolejnych miast"
  }
};

// src/game/terrain-improvements.ts
var IMPROVEMENTS = terrain_improvements_default;
var LEGACY_KEY_ALIASES = {
  pastwisko: "bydlo"
};
var IMPROVEMENT_KEYS = Object.keys(IMPROVEMENTS).filter((k) => !k.startsWith("_"));
function normalizeImprovementKey(raw) {
  if (!raw || raw === "brak") return void 0;
  const key = LEGACY_KEY_ALIASES[raw] ?? raw;
  return IMPROVEMENTS[key]?.bonus !== void 0 || IMPROVEMENTS[key] ? key : IMPROVEMENTS[raw] ? raw : void 0;
}
function improvementKeysForHex(hex) {
  if (hex.ulepszenia?.length) {
    const keys = hex.ulepszenia.map((k) => normalizeImprovementKey(String(k))).filter((k) => !!k);
    return [...new Set(keys)];
  }
  const single = normalizeImprovementKey(String(hex.ulepszenie ?? "brak"));
  return single ? [single] : [];
}

// src/map/road-movement.ts
var ROAD_MOVE_SPEED_MULT = 3;
var ROAD_MIN_MOVE_COST = 1 / 3;
var RAW = terrain_improvements_default;
function cobblestoneMoveBonus() {
  return RAW.droga_brukowana?.bonus_ruch ?? 2;
}
function applyRoadMovementModifier(cost, hex) {
  if (cost === Infinity) return Infinity;
  const keys = improvementKeysForHex(hex);
  if (keys.includes("droga_brukowana") || hex.ulepszenie === "droga_brukowana" /* DrogaBrukowana */) {
    const bonus = cobblestoneMoveBonus();
    return Math.max(ROAD_MIN_MOVE_COST, cost - bonus);
  }
  if (keys.includes("droga") || hex.ulepszenie === "droga" /* Droga */) {
    return cost / ROAD_MOVE_SPEED_MULT;
  }
  return cost;
}

// src/units/setup.ts
function keyOf(q, r) {
  return `${q},${r}`;
}
var DEFAULT_TERRAIN_COSTS = {
  ["laka" /* Laka */]: 1,
  ["rownina" /* Rownina */]: 1,
  ["pustynia" /* Pustynia */]: 1,
  ["wybrzeze" /* Wybrzeze */]: Infinity,
  ["wzgorza" /* Wzgorza */]: 2,
  ["gory" /* Gory */]: Infinity,
  ["morze" /* Morze */]: Infinity
};
var _terrainCosts = { ...DEFAULT_TERRAIN_COSTS };
var _forestExtra = 1;
var HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1]
];
function terrainMoveCost(hex) {
  const base = _terrainCosts[hex.terenBazowy] ?? 1;
  if (base === Infinity) return Infinity;
  let cost = base;
  if (hex.nakladka === "las" /* Las */) {
    const extra = _forestExtra;
    if (extra === Infinity) return Infinity;
    cost = base + extra;
  }
  return applyRoadMovementModifier(cost, hex);
}
function computePath(unit, map, destQ, destR, occupied) {
  const startKey = keyOf(unit.q, unit.r);
  const destKey = keyOf(destQ, destR);
  if (!(destKey in map.hexes)) return [];
  if (startKey === destKey) return [];
  const dist = /* @__PURE__ */ new Map();
  const parent = /* @__PURE__ */ new Map();
  dist.set(startKey, 0);
  parent.set(startKey, "");
  const heap = [[0, unit.q, unit.r]];
  function heapPush(e) {
    heap.push(e);
    let i = heap.length - 1;
    while (i > 0) {
      const p = i - 1 >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      const tmp = heap[p];
      heap[p] = heap[i];
      heap[i] = tmp;
      i = p;
    }
  }
  function heapPop() {
    if (heap.length === 0) return void 0;
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (; ; ) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < heap.length && heap[l][0] < heap[smallest][0]) smallest = l;
        if (r < heap.length && heap[r][0] < heap[smallest][0]) smallest = r;
        if (smallest === i) break;
        const tmp = heap[i];
        heap[i] = heap[smallest];
        heap[smallest] = tmp;
        i = smallest;
      }
    }
    return top;
  }
  let found = false;
  while (heap.length > 0) {
    const entry = heapPop();
    if (!entry) break;
    const [cost, cq, cr] = entry;
    const curKey = keyOf(cq, cr);
    const bestSoFar = dist.get(curKey);
    if (bestSoFar !== void 0 && cost > bestSoFar) continue;
    if (curKey === destKey) {
      found = true;
      break;
    }
    for (const [dq, dr] of HEX_NEIGHBORS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const nKey = keyOf(nq, nr);
      if (dist.has(nKey) && dist.get(nKey) <= cost) continue;
      if (!(nKey in map.hexes)) continue;
      const hex = map.hexes[nKey];
      const movCost = terrainMoveCost(hex);
      if (nKey === destKey) {
        const enterCost = movCost === Infinity ? 1 : movCost;
        const newCost2 = cost + enterCost;
        const prevDist2 = dist.get(nKey);
        if (prevDist2 === void 0 || newCost2 < prevDist2) {
          dist.set(nKey, newCost2);
          parent.set(nKey, curKey);
          heapPush([newCost2, nq, nr]);
        }
        continue;
      }
      if (movCost === Infinity) continue;
      if (occupied.has(nKey)) continue;
      const newCost = cost + movCost;
      const prevDist = dist.get(nKey);
      if (prevDist === void 0 || newCost < prevDist) {
        dist.set(nKey, newCost);
        parent.set(nKey, curKey);
        heapPush([newCost, nq, nr]);
      }
    }
  }
  if (!found && !parent.has(destKey)) return [];
  const path = [];
  let cur = destKey;
  while (cur !== startKey) {
    const parts = cur.split(",");
    path.push({ q: Number(parts[0]), r: Number(parts[1]) });
    const prev = parent.get(cur);
    if (prev === void 0) return [];
    cur = prev;
  }
  path.reverse();
  return path;
}
function pathCost(path, map) {
  let total = 0;
  for (const { q, r } of path) {
    const key = keyOf(q, r);
    const hex = map.hexes[key];
    if (hex) {
      const c = terrainMoveCost(hex);
      total += c === Infinity ? 0 : c;
    }
  }
  return total;
}

// src/game/planned-march.ts
function truncatePathAtFogFrontier(path, visible, keyOf2) {
  if (path.length === 0) return { path, fogLimited: false };
  const out = [];
  for (const hex of path) {
    if (!visible.has(keyOf2(hex.q, hex.r))) break;
    out.push(hex);
  }
  return { path: out, fogLimited: out.length < path.length };
}
function applyFogToPathPlan(plan, map, perTurnMove, movementBudget, fog) {
  if (!fog?.fogActive || fog.attackOnVisibleEnemy || plan.fullPath.length === 0) {
    return plan;
  }
  const { path: clamped, fogLimited } = truncatePathAtFogFrontier(
    plan.fullPath,
    fog.visible,
    fog.keyOf
  );
  if (!fogLimited) return plan;
  if (clamped.length === 0) {
    return {
      ...plan,
      fullPath: [],
      turnStops: [],
      segmentPath: [],
      segmentCost: 0,
      reachable: false,
      stopReason: "fog"
    };
  }
  const budget = movementBudget ?? perTurnMove;
  const segmentPath = truncatePathToBudget(clamped, budget, map);
  const segmentCost = segmentPath.length > 0 ? pathCost(segmentPath, map) : 0;
  const turnStops = [];
  let turnAcc = 0;
  let turnNum = 1;
  const perTurn = Math.max(1, perTurnMove);
  for (let i = 0; i < clamped.length; i++) {
    const stepCost = pathCost(clamped.slice(0, i + 1), map) - (i > 0 ? pathCost(clamped.slice(0, i), map) : 0);
    if (turnAcc + stepCost > perTurn) {
      if (i > 0) {
        const prev = clamped[i - 1];
        const last2 = turnStops[turnStops.length - 1];
        if (!last2 || last2.q !== prev.q || last2.r !== prev.r) {
          turnStops.push({ q: prev.q, r: prev.r, turn: turnNum });
        }
      }
      turnNum++;
      turnAcc = stepCost;
    } else {
      turnAcc += stepCost;
    }
  }
  const last = clamped[clamped.length - 1];
  const lastStop = turnStops[turnStops.length - 1];
  if (!lastStop || lastStop.q !== last.q || lastStop.r !== last.r) {
    turnStops.push({ q: last.q, r: last.r, turn: turnNum });
  }
  return {
    fullPath: clamped,
    turnStops,
    segmentPath,
    segmentCost,
    reachable: true,
    fogLimited: true
  };
}
function isMarchAttackDest(q, r, dest) {
  return q === dest.destQ && r === dest.destR;
}
function truncatePathToBudget(path, budget, map) {
  if (budget <= 0 || path.length === 0) return [];
  const out = [];
  for (let i = 0; i < path.length; i++) {
    const sub = path.slice(0, i + 1);
    const c = pathCost(sub, map);
    if (c > budget) break;
    out.push(path[i]);
  }
  return out;
}
function planPathTurns(unit, destQ, destR, map, occupied, perTurnMove, movementBudget) {
  const empty = {
    fullPath: [],
    turnStops: [],
    segmentPath: [],
    segmentCost: 0,
    reachable: false,
    stopReason: "no_path"
  };
  if (unit.q === destQ && unit.r === destR) {
    return { ...empty, reachable: true, stopReason: void 0 };
  }
  const path = computePath(unit, map, destQ, destR, occupied);
  if (path.length === 0) return empty;
  const perTurn = Math.max(1, perTurnMove);
  const turnStops = [];
  let turnAcc = 0;
  let turnNum = 1;
  for (let i = 0; i < path.length; i++) {
    const stepCost = pathCost(path.slice(0, i + 1), map) - (i > 0 ? pathCost(path.slice(0, i), map) : 0);
    if (turnAcc + stepCost > perTurn) {
      if (i > 0) {
        const prev = path[i - 1];
        if (turnStops.length === 0 || turnStops[turnStops.length - 1].q !== prev.q || turnStops[turnStops.length - 1].r !== prev.r) {
          turnStops.push({ q: prev.q, r: prev.r, turn: turnNum });
        }
      }
      turnNum++;
      turnAcc = stepCost;
    } else {
      turnAcc += stepCost;
    }
  }
  const last = path[path.length - 1];
  const lastStop = turnStops[turnStops.length - 1];
  if (!lastStop || lastStop.q !== last.q || lastStop.r !== last.r) {
    turnStops.push({ q: last.q, r: last.r, turn: turnNum });
  }
  const budget = movementBudget ?? perTurn;
  const segmentPath = truncatePathToBudget(path, budget, map);
  const segmentCost = segmentPath.length > 0 ? pathCost(segmentPath, map) : 0;
  return {
    fullPath: path,
    turnStops,
    segmentPath,
    segmentCost,
    reachable: true
  };
}
function shouldStopAtObstacle(unit, dest, map, occupied, segmentPath, movementBudget) {
  if (movementBudget <= 0) {
    return { stop: true, reason: "no_movement", detail: "brak punkt\xF3w ruchu" };
  }
  const path = computePath(unit, map, dest.destQ, dest.destR, occupied);
  if (path.length === 0) {
    return { stop: true, reason: "no_path", detail: "brak trasy do celu" };
  }
  const arrived = segmentPath.length > 0 && segmentPath[segmentPath.length - 1].q === dest.destQ && segmentPath[segmentPath.length - 1].r === dest.destR;
  if (arrived) return { stop: false };
  const truncated = truncatePathToBudget(path, movementBudget, map);
  if (truncated.length === 0) {
    return { stop: true, reason: "no_movement", detail: "brak punkt\xF3w ruchu" };
  }
  const segEnd = truncated[truncated.length - 1];
  const segEndIdx = path.findIndex((h) => h.q === segEnd.q && h.r === segEnd.r);
  if (segEndIdx >= 0 && segEndIdx < path.length - 1) {
    const next = path[segEndIdx + 1];
    const nextKey = `${next.q},${next.r}`;
    if (occupied.has(nextKey) && !isMarchAttackDest(next.q, next.r, dest)) {
      return { stop: true, reason: "obstacle", detail: "zablokowany heks na trasie" };
    }
  }
  const fullCost = pathCost(path, map);
  const segCost = pathCost(truncated, map);
  if (segCost < movementBudget && segEnd.q !== dest.destQ && segEnd.r !== dest.destR && truncated.length === path.length && fullCost <= movementBudget) {
    return { stop: false };
  }
  if (truncated.length < path.length && segCost >= movementBudget) {
    return { stop: false };
  }
  if (truncated.length < path.length) {
    const nextIdx = truncated.length;
    if (nextIdx < path.length) {
      const next = path[nextIdx];
      if (occupied.has(`${next.q},${next.r}`) && !isMarchAttackDest(next.q, next.r, dest)) {
        return { stop: true, reason: "obstacle", detail: "zablokowany heks na trasie" };
      }
    }
  }
  return { stop: false };
}
function executeMarchStep(unit, dest, map, occupied, movementBudget, canOccupyHex, perTurnMove, fog) {
  let plan = planPathTurns(unit, dest.destQ, dest.destR, map, occupied, perTurnMove, movementBudget);
  plan = applyFogToPathPlan(plan, map, perTurnMove, movementBudget, fog);
  if (!plan.reachable || plan.fullPath.length === 0) {
    return {
      ok: false,
      movePath: [],
      cost: 0,
      arrived: false,
      stopReason: "no_path",
      stopDetail: "brak trasy do celu"
    };
  }
  if (movementBudget <= 0) {
    return {
      ok: false,
      movePath: [],
      cost: 0,
      arrived: false,
      stopReason: "no_movement",
      stopDetail: "brak punkt\xF3w ruchu"
    };
  }
  const movePath = plan.segmentPath;
  if (movePath.length === 0) {
    return {
      ok: false,
      movePath: [],
      cost: 0,
      arrived: false,
      stopReason: "no_movement",
      stopDetail: "brak punkt\xF3w ruchu"
    };
  }
  const last = movePath[movePath.length - 1];
  if (!canOccupyHex(last.q, last.r)) {
    return {
      ok: false,
      movePath: [],
      cost: 0,
      arrived: false,
      stopReason: "blocked_city",
      stopDetail: "obce miasto na trasie"
    };
  }
  const arrived = last.q === dest.destQ && last.r === dest.destR;
  const obstacle = shouldStopAtObstacle(unit, dest, map, occupied, movePath, movementBudget);
  const fogLimited = "fogLimited" in plan && plan.fogLimited === true;
  let stopReason = obstacle.stop && !arrived ? obstacle.reason : void 0;
  let stopDetail = obstacle.detail;
  if (fogLimited && !arrived) {
    stopReason = "fog";
    stopDetail = "granica mg\u0142y \u2014 czeka na odkrycie";
  }
  return {
    ok: true,
    movePath,
    cost: plan.segmentCost,
    arrived,
    stopReason,
    stopDetail
  };
}
function validateAutoMarchFromSave(saved, units, playerOwnerId = 0) {
  if (!saved || typeof saved.leaderId !== "string") return null;
  const u = units.find((x) => x.id === saved.leaderId);
  if (!u || u.ownerId !== playerOwnerId) return null;
  if (u.q === saved.destQ && u.r === saved.destR) return null;
  if (!Number.isFinite(saved.destQ) || !Number.isFinite(saved.destR)) return null;
  return saved;
}
function plannedMarchesFromSave(saved, plannedMarches, units, playerOwnerId = 0) {
  const out = /* @__PURE__ */ new Map();
  if (plannedMarches && typeof plannedMarches === "object") {
    for (const [uid, dest] of Object.entries(plannedMarches)) {
      if (!dest || !Number.isFinite(dest.destQ) || !Number.isFinite(dest.destR)) continue;
      const u = units.find((x) => x.id === uid);
      if (!u || u.ownerId !== playerOwnerId) continue;
      if (u.q === dest.destQ && u.r === dest.destR) continue;
      const entry = { destQ: dest.destQ, destR: dest.destR };
      if (typeof dest.attackUnitId === "string" && dest.attackUnitId.length > 0) {
        entry.attackUnitId = dest.attackUnitId;
      }
      out.set(uid, entry);
    }
  }
  const legacy = validateAutoMarchFromSave(saved, units, playerOwnerId);
  if (legacy && !out.has(legacy.leaderId)) {
    out.set(legacy.leaderId, { destQ: legacy.destQ, destR: legacy.destR });
  }
  return out;
}
function plannedMarchesToSave(marches) {
  if (marches.size === 0) return {};
  const plannedMarches = {};
  let first;
  for (const [unitId, dest] of marches) {
    plannedMarches[unitId] = dest.attackUnitId ? { destQ: dest.destQ, destR: dest.destR, attackUnitId: dest.attackUnitId } : { destQ: dest.destQ, destR: dest.destR };
    if (!first) first = { leaderId: unitId, destQ: dest.destQ, destR: dest.destR };
  }
  return { autoMarch: first, plannedMarches };
}

// src/game/save.ts
var SAVE_VERSION = 2;
function setAwareReplacer(_key, value) {
  if (value instanceof Set) {
    return Array.from(value);
  }
  return value;
}
function readVersion(obj) {
  if (obj !== null && typeof obj === "object" && "wersja" in obj) {
    const v = obj.wersja;
    if (typeof v === "number" && Number.isFinite(v)) {
      return v;
    }
  }
  return NaN;
}
function serializeGame(s) {
  const stamped = { ...s, wersja: SAVE_VERSION };
  return JSON.stringify(stamped, setAwareReplacer);
}
function deserializeGame(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error("deserializeGame: niepoprawny JSON (" + String(e) + ")");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("deserializeGame: oczekiwano obiektu zapisu");
  }
  const ver = readVersion(parsed);
  if (Number.isNaN(ver)) {
    throw new Error("deserializeGame: brak lub niepoprawne pole wersja");
  }
  if (ver > SAVE_VERSION) {
    throw new Error(
      "deserializeGame: wersja zapisu " + ver + " jest nowsza niz obslugiwana " + SAVE_VERSION
    );
  }
  const obj = parsed;
  const obj2 = parsed;
  const save = {
    wersja: ver,
    tura: typeof obj.tura === "number" ? obj.tura : 1,
    seed: typeof obj.seed === "number" ? obj.seed : void 0,
    units: Array.isArray(obj.units) ? obj.units : [],
    cities: Array.isArray(obj.cities) ? obj.cities : [],
    explored: Array.isArray(obj.explored) ? obj.explored : [],
    gracz: obj.gracz,
    cityProd: obj2.cityProd,
    cityBuilt: obj2.cityBuilt,
    aiResearchDone: Array.isArray(obj2.aiResearchDone) ? obj2.aiResearchDone : void 0,
    diploRelations: obj2.diploRelations,
    autoMarch: obj2.autoMarch,
    plannedMarches: obj2.plannedMarches,
    meta: obj.meta,
    mapQuality: obj2.mapQuality,
    renderQuality: obj2.renderQuality,
    mapDetailQuality: obj2.mapDetailQuality
  };
  return save;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyFogToPathPlan,
  computePath,
  deserializeGame,
  executeMarchStep,
  pathCost,
  planPathTurns,
  plannedMarchesFromSave,
  plannedMarchesToSave,
  serializeGame,
  shouldStopAtObstacle,
  truncatePathAtFogFrontier,
  truncatePathToBudget,
  validateAutoMarchFromSave
});
