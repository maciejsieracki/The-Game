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

// tools/.post-battle-entry.ts
var post_battle_entry_exports = {};
__export(post_battle_entry_exports, {
  applyCityCaptureAfterBattle: () => applyCityCaptureAfterBattle,
  applyPostBattleMap: () => applyPostBattleMap,
  pickRetreatTargetAwayFromAttacker: () => pickRetreatTargetAwayFromAttacker,
  pickRetreatTargetTowardAttackerSide: () => pickRetreatTargetTowardAttackerSide
});
module.exports = __toCommonJS(post_battle_entry_exports);

// src/game/culture-religion.ts
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

// src/game/conquest-stability.ts
function onCityCapturedCulture(city, newOwnerId, previousOwnerId) {
  if (newOwnerId === void 0 || previousOwnerId === void 0 || newOwnerId === previousOwnerId) {
    return;
  }
  const prev = Math.max(0, Math.min(1, city.ownCultureShare ?? city.kulturaOwnShare ?? 1));
  city.ownCultureShare = Math.max(0, Math.min(1, 1 - prev));
  city.kulturaOwnShare = city.ownCultureShare;
}

// data/terrain-improvements.json
var terrain_improvements_default = {
  _meta: {
    opis: "Ulepszenia terenu (lane MIASTO: liczby bonusow + koszt + epoka). Gdzie wolno (placement) + render = MAPA. Przeplyw w turze = SILNIK. Koszt w PRACY (z puli Pracy w skarbcu, Q4). Lista uzgodniona z MAPA + uzupelniona na przyszlosc wczesnych epok (2026-06-24). EKONOMIA: dodano surowiecOdblokowany (ASCII) + zasieg_terytorium (2026-06-25).",
    bonus_pola: "zywnosc | praca | handel | pieniadz | kamien | drewno (na obrabiane pole)",
    epoka: "1=Kamien, 2=Braz, 3=Zelazo",
    decyzje_MIASTO: "lodzie_rybackie = TAK teraz; kamieniolom OSOBNO od kopalni (rozne surowce); teren NIE daje +Nauka/+Kultura (te z budynkow/specjalistow/suwaka). Tarasy = +zywnosc (nie kultura).",
    kanon_zywnosc_hodowla: "docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md (2026-06-29 Maciej) \u2014 obowiazuje nad tym plikiem do wdrozenia",
    decyzje_EKONOMIA: "surowiecOdblokowany = klucz ASCII surowca (lub null) wg modelu dostepu boolean v0.1; zasieg_terytorium: posterunek=5 (epoka 2), fort=10 (epoka 3), miasto=10 (stale); zakladanie kolejnego miasta wymaga Straznica LUB zasiegu obecnego miasta. Rozbieznosci kluczy z resources.json (brak pola id) zapisane w EKONOMIA-ulepszenia-terenu-v01.md.",
    klucze_surowcow_ASCII: "drewno | kamien | glina | ruda | zelazo | stal | bydlo | owce | lama | kon | sol",
    pole_surowiec_ilosc_tura: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja PER ZBUDOWANE ULEPSZENIE w terytorium wlasciciela, niezaleznie od obsadzenia pola populacja (workedTiles). Wartosc = surowiec/ture. Stawki REALNE (Maciej 2026-07-23, korekta po ECHO placeholdera): Tartak->drewno 4, Kamieniolom->kamien 4, Glinianka->glina 4, Kopalnia miedzi->ruda 2, Kopalnia (zloze zelaza)->ruda_zelaza 2. Brak pola w JSON -> domyslnie 2/ture (terrain-improvements.ts TERRITORY_YIELD_DEFAULT_AMOUNT, fallback bezpieczenstwa)."
  },
  farma: {
    nazwa: "Farma",
    epoka: 1,
    bonus: {
      zywnosc: 3
    },
    surowiecOdblokowany: null,
    teren: "\u0141\u0105ka, R\xF3wnina; Wzg\xF3rza z lasem",
    warunek: "ziemia uprawna; DZIA\u0141A BEZ rzeki (podstawowy); MO\u017BE na lesie (Las) \u2014 bez wyr\u0119bu (Maciej 2026-07-21)",
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
    nazwa: "Trzoda",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 3
    },
    surowiecOdblokowany: "bydlo",
    surowiecOdblokowany_uwaga: "ABC-18: dost\u0119p dopiero po postawieniu na z\u0142o\u017Cu trzody",
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "plaski l\u0105d; pierwsze: z\u0142o\u017Ce byd\u0142a; potem po odblokowaniu \u2014 bez z\u0142o\u017Ca; + farma lub solo; NIE na Pustyni",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Trzoda (Rydwan po odblokowaniu)"
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
    teren: "Wzg\xF3rza, G\xF3ry",
    warunek: "solo; tylko cyw. Inkowie; wzg\xF3rza/g\xF3ry; pierwsze: z\u0142o\u017Ce lamy; NIE na \u0141\u0105ce/R\xF3wninie/Pustyni",
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
    surowiecOdblokowany_uwaga: "ruda miedzi lub ruda_zelaza (zale\u017Cnie od z\u0142o\u017Ca); plon 2/t z kopalni. SUROW-TERYT-01 (Maciej 2026-07-23): stawka REALNA (nie placeholder) = 2/ture dla ruda_zelaza (kopalnia na z\u0142o\u017Cu \u017Celaza).",
    surowiec_ilosc_tura: 2,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce rudy miedzi lub \u017Celaza",
    warunek: "wydobycie rudy do magazynu miasta (ruda / ruda_zelaza)",
    koszt_praca: 25,
    tech: "Murarstwo",
    odblokowuje: "Metal/Br\u0105z (jednostki br\u0105zowe, mury)"
  },
  glinianka: {
    nazwa: "Glinianka",
    epoka: 2,
    bonus: {
      praca: 1,
      glina: 2
    },
    surowiecOdblokowany: "glina",
    surowiecOdblokowany_uwaga: "GLINA-Q1=A (Maciej 2026-07-20): stala ilosc glina/ture z ulepszenia. Stawka SUROW-TERYT-01: 4/ture, podniesiona do 5 przy C-SUROW-CEGLA=A (Maciej 2026-07-24, odciazenie cegly wg symulacji -- glina musi nadazyc za Cegielnia 3/ture). NIE bonus.glina (2) -- osobne pola.",
    surowiec_ilosc_tura: 5,
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
    surowiecOdblokowany_uwaga: "klucz 'kamien' wg Surowiec='Kamie\u0144' w resources.json; brak pola id \u2014 propozycja EKONOMIA; UWAGA: 'kamien' pojawia sie rowniez w bonus{} jako efekt plonu \u2014 DANE musi zdecydowac czy bonus.kamien = dostep czy liczba. Stawka SUROW-TERYT-01 (Maciej 2026-07-23, REALNA) = 4/ture.",
    surowiec_ilosc_tura: 4,
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
    warunek: "koszt 5 Pracy na start; plon +5 Drewna \xD7 1 tura (surowiec do puli pa\u0144stwa, Maciej 2026-07-24); potem teren bazowy bez lasu",
    koszt_praca: 5,
    tech: null,
    wycinka: {
      praca_per_tura: 5,
      tury: 1,
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
    surowiecOdblokowany_uwaga: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja per ulepszenie w terytorium, niezaleznie od obsadzenia populacja -- patrz surowiec_ilosc_tura (REALNA stawka 4/ture, nie placeholder).",
    surowiec_ilosc_tura: 4,
    teren: "L\u0105d w terytorium (\u0142\u0105ka, lasy, wzg\xF3rza\u2026)",
    warunek: "sta\u0142e ulepszenie; MO\u017BE na lesie \u2014 las NIE znika; odblokowuje dost\u0119p do drewna (v0.1 bez ilo\u015Bci)",
    koszt_praca: 25,
    tech: "Obr\xF3bka drewna",
    odblokowuje: "Drewno (TYP 1 \u2014 bez desek, B-SUROW-BUD-03)"
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
    teren: "Wybrze\u017Ce, z\u0142o\u017Ce soli (hex.zloze=sol)",
    warunek: "s\xF3l \u2014 wy\u0142\u0105cznie wybrze\u017Ce morskie (kanon: z\u0142o\u017Ca soli przy brzegu) lub hex.zloze=sol",
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
    tech: "Wojskowo\u015B\u0107",
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
  kopalnia_miedzi: {
    nazwa: "Kopalnia miedzi",
    epoka: 2,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: "ruda",
    surowiecOdblokowany_uwaga: "ruda miedzi (Odlewnia br\u0105zu); plon 2/t z kopalni_miedzi. SUROW-TERYT-01 (Maciej 2026-07-23): stawka REALNA (nie placeholder) = 2/ture.",
    surowiec_ilosc_tura: 2,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce miedzi (hex.zloze=miedz)",
    warunek: "ruda miedzi \u2192 magazyn (Odlewnia br\u0105zu)",
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
var IMPROVEMENT_KEYS = Object.keys(IMPROVEMENTS).filter((k) => !k.startsWith("_"));

// src/map/road-movement.ts
var ROAD_MIN_MOVE_COST = 1 / 3;

// src/units/setup.ts
var CIVILIAN_CATEGORIES = /* @__PURE__ */ new Set(["osadnik", "robotnik", "zwiadowca"]);
var CIVILIAN_TYPE_IDS = /* @__PURE__ */ new Set(["Zwiadowca", "Osadnik", "Robotnik"]);
function isCivilianUnit(u) {
  if (CIVILIAN_CATEGORIES.has(u.category)) return true;
  return CIVILIAN_TYPE_IDS.has(u.typeId);
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
var HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1]
];
function hexNeighborCoords(q, r) {
  return HEX_NEIGHBORS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

// src/game/armyMerge.ts
function stackRuchLeft(stack) {
  if (stack.length === 0) return 0;
  return Math.min(...stack.map((u) => u.ruchLeft));
}
function syncStackRuchLeft(stack, ruchLeft) {
  if (stack.length === 0) return;
  const v = ruchLeft ?? stackRuchLeft(stack);
  for (const u of stack) u.ruchLeft = v;
}

// src/game/auto-battle-power.ts
var LINE_WEIGHTS = {
  "Wr\u0119cz": 1,
  "Flanka": 0.5,
  "Dystans": 0.25,
  "Morska": 0.5,
  "Wsparcie": 0.5
};
function lineWeightForDef(def) {
  const rola = (def["Rola (linia)"] ?? "").trim();
  return LINE_WEIGHTS[rola] ?? 1;
}
function applyLossPctToRoster(roster, lossPct, maxHpOf) {
  const rows = [];
  for (const u of roster) {
    const maxHp = maxHpOf(u.def);
    const before = u.hp ?? maxHp;
    const w = lineWeightForDef(u.def);
    const eff = Math.min(1, lossPct * w);
    const after = Math.max(0, Math.floor(before * (1 - eff)));
    rows.push({
      id: u.id,
      hpBefore: before,
      hpAfter: after,
      dead: after <= 0,
      effLossPct: Math.round(eff * 1e3) / 10
    });
  }
  return rows;
}

// src/game/post-battle-map.ts
function removeUnitById(units, id) {
  const idx = units.findIndex((u) => u.id === id);
  if (idx >= 0) units.splice(idx, 1);
}
function liveUnit(units, id) {
  return units.find((u) => u.id === id);
}
function applyAutoLosses(input) {
  const dead = /* @__PURE__ */ new Set();
  const toRows = (roster) => roster.map((u) => ({
    id: String(u.id),
    typeId: u.typeId,
    def: input.getDef(u),
    hp: u.hp
  }));
  if (input.lossAtkPct != null && input.lossAtkPct > 0) {
    for (const row of applyLossPctToRoster(toRows(input.atkRoster), input.lossAtkPct, input.maxHpOf)) {
      const u = liveUnit(input.units, row.id);
      if (!u) continue;
      if (row.dead) dead.add(row.id);
      else u.hp = row.hpAfter;
    }
  }
  if (input.lossDefPct != null && input.lossDefPct > 0) {
    for (const row of applyLossPctToRoster(toRows(input.defRoster), input.lossDefPct, input.maxHpOf)) {
      const u = liveUnit(input.units, row.id);
      if (!u) continue;
      if (row.dead) dead.add(row.id);
      else u.hp = row.hpAfter;
    }
  }
  for (const id of dead) removeUnitById(input.units, id);
  return dead;
}
function applyManualSurvivors(input) {
  const live = new Set((input.manualSurvivors ?? []).map((s) => String(s.id)));
  const hpMap = new Map(
    (input.manualSurvivors ?? []).map((s) => [String(s.id), s.hp])
  );
  for (const u of [...input.atkRoster, ...input.defRoster]) {
    if (!live.has(String(u.id))) {
      removeUnitById(input.units, u.id);
      continue;
    }
    const hp = hpMap.get(String(u.id));
    const run = liveUnit(input.units, u.id);
    if (run && hp != null) {
      if (hp <= 0) removeUnitById(input.units, u.id);
      else run.hp = hp;
    }
  }
}
function wipeDefenderOnCityCenter(input) {
  const city = input.cityOnBattleHex;
  if (!city) return;
  for (const u of input.defRoster) {
    if (u.q === city.q && u.r === city.r) {
      removeUnitById(input.units, u.id);
    }
  }
}
function centroidOfRoster(roster) {
  if (roster.length === 0) return { q: 0, r: 0 };
  let sq = 0;
  let sr = 0;
  for (const u of roster) {
    sq += u.q;
    sr += u.r;
  }
  return { q: sq / roster.length, r: sr / roster.length };
}
function pickRetreatTargetAwayFromAttacker(input) {
  const atk = centroidOfRoster(input.atkRoster);
  const neighbors = hexNeighborCoords(input.battleQ, input.battleR);
  const passable = neighbors.filter((n) => input.isPassableHex(n.q, n.r));
  if (passable.length === 0) return { q: input.battleQ, r: input.battleR };
  passable.sort((a, b) => {
    const da = (a.q - atk.q) ** 2 + (a.r - atk.r) ** 2;
    const db = (b.q - atk.q) ** 2 + (b.r - atk.r) ** 2;
    return db - da;
  });
  return passable[0];
}
function pickRetreatTargetTowardAttackerSide(input) {
  const atk = centroidOfRoster(input.atkRoster);
  const neighbors = hexNeighborCoords(input.battleQ, input.battleR);
  const passable = neighbors.filter((n) => input.isPassableHex(n.q, n.r));
  if (passable.length === 0) return { q: input.battleQ, r: input.battleR };
  passable.sort((a, b) => {
    const da = (a.q - atk.q) ** 2 + (a.r - atk.r) ** 2;
    const db = (b.q - atk.q) ** 2 + (b.r - atk.r) ** 2;
    return da - db;
  });
  return passable[0];
}
function placeFanOutGroup(input, roster, lead, direction, stayOnCityCenter = false) {
  const dq = direction.q - input.battleQ;
  const dr = direction.r - input.battleR;
  const order = [lead, ...roster.filter((u) => u.id !== lead.id)];
  for (const ref of order) {
    const u = liveUnit(input.units, ref.id);
    if (!u) continue;
    if (stayOnCityCenter && input.cityOnBattleHex && u.q === input.cityOnBattleHex.q && u.r === input.cityOnBattleHex.r) {
      continue;
    }
    let placed = false;
    for (let step = 1; step <= 3; step++) {
      const tq = u.q + dq * step;
      const tr = u.r + dr * step;
      if (!input.isPassableHex(tq, tr)) break;
      if (!input.isUnitAt(tq, tr, u.id)) {
        u.q = tq;
        u.r = tr;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const prev = u.defLossesThisTurn ?? 0;
      if (prev >= 1) removeUnitById(input.units, u.id);
      else u.defLossesThisTurn = prev + 1;
    }
  }
}
function pickLiveDefLead(input, defAlive) {
  if (defAlive.length === 0) return null;
  const onBattle = defAlive.find((u) => u.q === input.battleQ && u.r === input.battleR);
  return onBattle ?? defAlive[0];
}
function retreatDefendersAfterAtkWin(input) {
  const defAlive = input.defRoster.map((r) => liveUnit(input.units, r.id)).filter((u) => !!u);
  const lead = pickLiveDefLead(input, defAlive);
  if (!lead) return;
  const dir = pickRetreatTargetAwayFromAttacker(input);
  placeFanOutGroup(input, defAlive, lead, dir, !!input.cityOnBattleHex);
}
function retreatDefendersOnTie(input) {
  const defAlive = input.defRoster.map((r) => liveUnit(input.units, r.id)).filter((u) => !!u);
  const lead = pickLiveDefLead(input, defAlive);
  if (!lead) return;
  const dir = pickRetreatTargetAwayFromAttacker(input);
  placeFanOutGroup(input, defAlive, lead, dir, !!input.cityOnBattleHex);
}
function moveAtkRosterOntoBattleHex(input) {
  const anchor = input.atkAnchor;
  const anchorStart = input.atkStart.get(anchor.id);
  const liveAtk = input.atkRoster.map((r) => liveUnit(input.units, r.id)).filter((u) => !!u);
  if (liveAtk.length === 0) return;
  const moved = [];
  for (const u of liveAtk) {
    if (isCivilianUnit(u) && u.id !== anchor.id) continue;
    const start = input.atkStart.get(u.id);
    const onAnchorStartHex = u.id === anchor.id || anchorStart != null && start != null && start.q === anchorStart.q && start.r === anchorStart.r;
    if (!onAnchorStartHex) continue;
    u.q = input.battleQ;
    u.r = input.battleR;
    moved.push(u);
  }
  if (moved.length > 1) syncStackRuchLeft(moved);
}
function retreatAtkRosterToStart(input) {
  for (const ref of input.atkRoster) {
    const u = liveUnit(input.units, ref.id);
    if (!u) continue;
    const start = input.atkStart.get(ref.id);
    if (start) {
      u.q = start.q;
      u.r = start.r;
    }
  }
}
function spendAttackMpOnLive(units, atkRoster, anchorId) {
  for (const ref of atkRoster) {
    if (isCivilianUnit(ref) && ref.id !== anchorId) continue;
    const u = units.find((x) => x.id === ref.id);
    if (u) u.ruchLeft = Math.max(0, u.ruchLeft - 1);
  }
}
function applyPostBattleMap(input) {
  const removedIds = [];
  if (input.manualSurvivors !== void 0) {
    applyManualSurvivors(input);
  } else {
    const dead = applyAutoLosses(input);
    dead.forEach((id) => removedIds.push(id));
  }
  if (input.winner === "atakujacy") {
    if (input.cityOnBattleHex) wipeDefenderOnCityCenter(input);
    retreatDefendersAfterAtkWin(input);
    moveAtkRosterOntoBattleHex(input);
  } else if (input.winner === "obronca") {
    retreatAtkRosterToStart(input);
    for (const ref of input.defRoster) {
      const u = liveUnit(input.units, ref.id);
      if (u) u.defLossesThisTurn = (u.defLossesThisTurn ?? 0) + 1;
    }
  } else {
    const atkDir = pickRetreatTargetTowardAttackerSide(input);
    const stayCity = !!input.cityOnBattleHex;
    const atkAlive = input.atkRoster.map((r) => liveUnit(input.units, r.id)).filter(Boolean);
    if (atkAlive.length > 0) {
      placeFanOutGroup(input, atkAlive, input.atkAnchor, atkDir, stayCity);
    }
    retreatDefendersOnTie(input);
  }
  spendAttackMpOnLive(input.units, input.atkRoster, input.atkAnchor.id);
  return { removedIds };
}
function applyCityCaptureAfterBattle(city, atkRoster, atkOwner, units, anchorId = atkRoster[0]?.id ?? "") {
  const prevOwner = city.ownerId;
  for (let i = units.length - 1; i >= 0; i--) {
    const u = units[i];
    if (u.ownerId === city.ownerId && u.q === city.q && u.r === city.r) {
      units.splice(i, 1);
    }
  }
  let lead = null;
  for (const ref of atkRoster) {
    const live = units.find((x) => x.id === ref.id);
    if (!live) continue;
    const isAnchor = ref.id === anchorId;
    if (isAnchor && !isCivilianUnit(live)) {
      live.q = city.q;
      live.r = city.r;
      lead = live;
    }
    if (isCivilianUnit(live) && !isAnchor) continue;
    live.ruchLeft = Math.max(0, live.ruchLeft - 1);
    if (live.inGarnizon) delete live.inGarnizon;
    if (live.oblegaCityId === city.id) delete live.oblegaCityId;
  }
  city.ownerId = atkOwner;
  city.oblegane = false;
  if (city.rebelState) city.rebelState = false;
  onCityCapturedCulture(city, atkOwner, prevOwner);
  return lead;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyCityCaptureAfterBattle,
  applyPostBattleMap,
  pickRetreatTargetAwayFromAttacker,
  pickRetreatTargetTowardAttackerSide
});
