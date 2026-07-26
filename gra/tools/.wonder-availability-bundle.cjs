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

// tools/.wonder-availability-entry.ts
var wonder_availability_entry_exports = {};
__export(wonder_availability_entry_exports, {
  buildTechEpochMap: () => buildTechEpochMap,
  evaluateWonderBuildGate: () => evaluateWonderBuildGate,
  getWondersForCiv: () => getWondersForCiv,
  listBuildableWondersForCiv: () => listBuildableWondersForCiv
});
module.exports = __toCommonJS(wonder_availability_entry_exports);

// src/game/civ-entry-epoch.ts
var GAME_EPOCH_ORDER = ["kamien", "braz", "zelazo"];
function gameEpochIndex(epochId) {
  const i = GAME_EPOCH_ORDER.indexOf(epochId);
  return i >= 0 ? i : GAME_EPOCH_ORDER.length;
}
function getCivEpokaWejscia(civ) {
  const direct = civ.epokaWejscia;
  if (direct && GAME_EPOCH_ORDER.includes(direct)) {
    return direct;
  }
  const legacy = civ.epokiStartowe;
  if (legacy && legacy.length > 0) {
    const indices = legacy.map((e) => gameEpochIndex(e)).filter((i) => i < GAME_EPOCH_ORDER.length);
    if (indices.length > 0) {
      const min = Math.min(...indices);
      return GAME_EPOCH_ORDER[min];
    }
  }
  return "kamien";
}

// src/game/wonder-civ-tech.ts
var EPOCH_LABEL_TO_ID = {
  Kamie\u0144: "kamien",
  "Kamien": "kamien",
  Br\u0105z: "braz",
  Braz: "braz",
  \u017Belazo: "zelazo",
  Zelazo: "zelazo"
};
function techEpochIdFromLabel(epokaLabel) {
  return EPOCH_LABEL_TO_ID[epokaLabel] ?? "kamien";
}
function buildTechEpochMap(technologie) {
  const out = /* @__PURE__ */ new Map();
  for (const t of technologie) {
    const name = t.Technologia;
    const ep = t.Epoka;
    if (typeof name === "string" && name.length > 0 && typeof ep === "string") {
      out.set(name, techEpochIdFromLabel(ep));
    }
  }
  return out;
}
function techEpochIndex(techName, techMap) {
  const epochId = techMap.get(techName);
  return epochId != null ? gameEpochIndex(epochId) : -1;
}
function wonderTechValidForCivEntry(civ, techUnlock, techMap) {
  if (techUnlock.length === 0) return true;
  const minIdx = gameEpochIndex(getCivEpokaWejscia(civ));
  return techUnlock.every((tech) => {
    const tIdx = techEpochIndex(tech, techMap);
    return tIdx >= 0 && tIdx >= minIdx;
  });
}

// src/game/wonder-availability.ts
function asTechSet(unlocked) {
  return unlocked instanceof Set ? unlocked : new Set(unlocked);
}
function evaluateWonderBuildGate(input) {
  const {
    wonder,
    civType,
    civRow,
    playerEra,
    unlockedTechs,
    completedWonderIds,
    techMap
  } = input;
  const reasons = [];
  const missingTech = [];
  const techs = wonder.techUnlock ?? [];
  const unlocked = asTechSet(unlockedTechs);
  const map = techMap ?? /* @__PURE__ */ new Map();
  if (wonder.dostep === "E" && !wonder.cywilizacje.includes(civType)) {
    reasons.push("civ_not_exclusive");
  }
  if (playerEra < wonder.epokaWejscia) {
    reasons.push("era_too_early");
  }
  for (const t of techs) {
    if (!unlocked.has(t)) missingTech.push(t);
  }
  if (missingTech.length > 0) reasons.push("tech_missing");
  if (wonder.dostep === "E" && map.size > 0 && !wonderTechValidForCivEntry(civRow, techs, map)) {
    reasons.push("tech_before_civ_entry");
  }
  const max = wonder.maxNaSwiecie ?? 1;
  const builtCount = completedWonderIds.filter((id) => id === wonder.id).length;
  if (builtCount >= max) reasons.push("already_built_world");
  return {
    ok: reasons.length === 0,
    reasons,
    missingTech
  };
}
function listBuildableWondersForCiv(wonders, civType, civRow, playerEra, unlockedTechs, completedWonderIds, techMap) {
  return wonders.filter(
    (w) => evaluateWonderBuildGate({
      wonder: w,
      civType,
      civRow,
      playerEra,
      unlockedTechs,
      completedWonderIds,
      techMap
    }).ok
  );
}

// data/wonders.json
var wonders_default = {
  _meta: {
    opis: "Cuda \u015Bwiata \u2014 epoka Antyk (v0.1). Kanon Maciej 2026-06-26.",
    dostep_E: "Wy\u0142\u0105czny \u2014 tylko wskazane pa\u0144stwa; max 1 na \u015Bwiat; inni nie widz\u0105 cudu w panelu.",
    dostep_R: "Wy\u015Bcig \u2014 ka\u017Cde pa\u0144stwo z listy cywilizacje (wszystkie 15) uczestniczy; max 1 na \u015Bwiat.",
    cuda_wyscigowe: ["wyrocznia", "hamonga", "brama_narodow"],
    cuda_wyscigowe_epoka: {
      "1": { id: "wyrocznia", nazwa: "Wyrocznia", epoka: "Kamie\u0144", profil: "kultura, mistycyzm" },
      "2": { id: "hamonga", nazwa: "Kamie\u0144 Ha'amonga", epoka: "Br\u0105z", profil: "kultura, morze, rybo\u0142\xF3wstwo" },
      "3": { id: "brama_narodow", nazwa: "Brama wszystkich narod\xF3w", epoka: "\u017Belazo", profil: "wojna, handel imperium" }
    },
    cuda_wyscigowe_uwaga: "Dok\u0142adnie 1 cud R na epok\u0119 Antyku; wszyscy 15 graczy widz\u0105 i mog\u0105 walczy\u0107; max 1 egzemplarz na \u015Bwiat.",
    wszystkie_cywilizacje: [
      "egipt",
      "sumer",
      "babilonia",
      "grecy",
      "hetyci",
      "celtowie",
      "harappa",
      "fenicjanie",
      "germanie",
      "inkowie",
      "chinczycy",
      "rzymianie",
      "asyria",
      "zulusi",
      "slowianie"
    ],
    epoka: "1=Kamie\u0144, 2=Br\u0105z, 3=\u017Belazo (Antyk); 4\u20136=\u015Aredniowiecze; 7+=Renesans i dalej",
    wieki: {
      antyk: { epoki: [1, 2, 3], opis: "Kamie\u0144\u2013Br\u0105z\u2013\u017Belazo; budowa cud\xF3w E/R z tego pliku" },
      sredniowiecze: { epoki: [4, 5, 6], opis: "Cuda Antyku nadal daj\u0105 bonusy; nowe cuda \u015Bredniowieczne \u2014 osobny plik / era" },
      renesans_plus: { epoki: [7, 8, 9, 10], opis: "Po absolut \u2014 efekty cud\xF3w Antyku wygas\u0142y" }
    },
    absolut: {
      opis: "Ostatnia epoka imperium (w\u0142\u0105cznie), w kt\xF3rej aktywne s\u0105 bonusy cudu. Od epoki absolut+1 efekt wygasa (jednorazowe przy budowie \u2014 bez absolut).",
      domyslnie_antyk: 6,
      koniec_sredniowiecza: 6,
      decyzja: "Maciej 2026-06-26: cuda Antyku + ich efekty znikaj\u0105 na koniec \u015Aredniowiecza (ep.6).",
      po_absolut: {
        decyzja: "Maciej D-CUD1: cud ZOSTAJE na mapie (nie zniszczony); wszystkie bonusy z JSON wygasaj\u0105.",
        hex: "ruina/dekor \u2014 model widoczny",
        utrzymanie_wygasly: "50pct",
        utrzymanie_wygasly_opis: "Maciej D-CUD2=C: po absolut utrzymanie = floor(utrzymanie/2), min 0 (np. Piramidy 2\u21921)",
        jedyny_efekt: {
          typ: "handel_turystyka",
          wartosc: 10,
          opis: "+10 do handlu \u2014 cud jako atrakcja turystyczna (jedyny yield po absolut)"
        }
      },
      silnik: "player.era > absolut \u2192 wy\u0142\u0105cz bonusy miasto/teren/hex/specjalne; zastosuj po_absolut.jedyny_efekt je\u015Bli aktywny"
    },
    budowa: "hex w terytorium (nie slot miasta)",
    harappa_v1: "Antyk: tylko Stupa w Sanchi (E). Nalanda + Angkor Wat \u2192 parkowane (epoka 4+).",
    chinczycy_v1: "Antyk: Terakotowa armia + Pa\u0142ac Weiyang (E). Wielki dzw\xF3n \u2192 parkowany (epoka 5+).",
    celtowie_v1: "Antyk: Roquepertuse (E, epoka 3). Kopiec grobowy/Monks Mound \u2192 parkowany.",
    koszt_jednostka: "Praca (jak budynki i ulepszenia terenu); budowa z puli Pracy najbli\u017Cszego miasta / skarbca.",
    bonus_miasto: "Yield +/tur\u0119 \xD7 KA\u017BDE miasto (pieniadz, zywnosc, nauka, kultura, zadowolenie, praca, obrona_miejsca). Bez dzielnic Civ7.",
    bonus_cywilizacja: "Tylko imperium \u2014 NIE sumowane w karcie miasta. Patrz lista bonus_cywilizacja_typy.",
    bonus_cywilizacja_typy: {
      dyplomacja_wp\u0142yw: "Wp\u0142yw / Influence (traktaty, ambasady)",
      wojna_wsparcie: "Wsparcie we wszystkich wojnach",
      relacje_zaufanie: "Zaufanie bazowe wobec innych nacji",
      relacje_respekt: "Wynika z Mocy (odkrycia) \u2014 cuda NIE daj\u0105 Mocy (decyzja Maciej 2026-06-26)",
      armia_xp: "Do\u015Bwiadczenie armii (%)",
      armia_morale: "Morale imperium po bitwie / sta\u0142e",
      walka_procent: "Atak/obrona/obl\u0119\u017Cenie (%) \u2014 jednostki poza miastem",
      pobor_regen: "Regeneracja Manpower imperium (%)",
      handel_procent: "Bonus % do tras handlowych / morskich",
      nauka_procent: "Bonus % nauki imperium (nie flat per miasto)",
      produkcja_procent: "Redukcja kosztu Pracy budynk\xF3w/ulepsze\u0144 (%)",
      magazyn_pojemnosc: "Pojemno\u015B\u0107 zapas\xF3w / trade capacity globalna",
      wzrost_ludnosci_procent: "Wzrost populacji we wszystkich miastach (%)",
      jednorazowe: "Z\u0142oto przy zdarzeniu, darmowa jednostka, kultura z wydarze\u0144 narracyjnych",
      fortyfikacja_mapa: "Bonus obrony na heksach fort\xF3w (mapa, nie yield miasta)",
      handel_turystyka: "Po absolut: jedyny efekt wygas\u0142ego cudu \u2014 +N do handlu (atrakcja turystyczna)"
    },
    bonus_zasieg: "hex = tylko pole cudu; teren = heksy danego typu w terytorium (plony \u2192 miasto w\u0142a\u015Bciciela pola). BEZ dzielnic / sasiad-dzielnica.",
    bonus_teren: "Modyfikator p\xF3l w terytorium (nie \xD7 ka\u017Cde miasto \u2014 tylko heksy spe\u0142niaj\u0105ce warunek).",
    bonus_specjalne: "Implementacja bonus_cywilizacja \u2014 silnik cud\xF3w (v1.1+). Typ = klucz z bonus_cywilizacja_typy.",
    kanon_bonusow_2026: "Maciej: yield miejski \xD73 vs v0.1 (\xD7 ka\u017Cde miasto). Wp\u0142yw, zaufanie, wojna, %, armia \u2192 cywilizacja. BEZ bonusu Mocy \u2014 Moc tylko z odkry\u0107.",
    bonus_miasto_mnoznik: 3,
    bonus_moc: "USUNI\u0118TE \u2014 Moc (P-A) pochodzi wy\u0142\u0105cznie z odkry\u0107 technologii; cuda nie dodaj\u0105 punkt\xF3w Mocy (Maciej 2026-06-26).",
    kanon_tech_wejscie: "Maciej 2026-07-03: techUnlock cudu E \u2014 ka\u017Cdy wynalazek z epoki >= epokaWejscia pa\u0144stwa; p\xF3\u017Aniejsze epoki OK; zakaz tech wcze\u015Bniejszych ni\u017C debiut nacji."
  },
  cuda: [
    {
      id: "piramidy",
      nazwa: "Piramidy",
      dostep: "E",
      cywilizacje: ["egipt"],
      techUnlock: ["Murarstwo"],
      wymagaTerenu: ["pustynia", "rzeka_sasiad"],
      epokaWejscia: 1,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 160,
      utrzymanie: 2,
      bonusy: {
        miasto: { pieniadz: 3, praca: 3 },
        teren: [
          { typTerenu: "pustynia", pieniadz: 2, praca: 2, warunek: "hex_sasiad_rzeka" },
          { typTerenu: "rzeka_mala", pieniadz: 2, praca: 2 }
        ],
        specjalne: [
          { typ: "kapital_pustynia", wartosc: 3, opis: "Stolica na pustyni: +3 Pieni\u0105dz/tur\u0119 (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 3, opis: "+3 Wp\u0142ywu \u2014 presti\u017C faraon\xF3w (cywilizacja)" }
        ]
      }
    },
    {
      id: "wielka_stela",
      nazwa: "Wielka stela",
      dostep: "E",
      cywilizacje: ["zulusi"],
      techUnlock: ["Pismo"],
      wymagaTerenu: ["rownina"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 220,
      utrzymanie: 2,
      bonusy: {
        miasto: { kultura: 3, pieniadz: 3 },
        specjalne: [
          { typ: "jednorazowe", cel: "zloto_przy_budowie_cudu", wartosc: 200, opis: "+200 Pieni\u0105dza przy uko\u0144czeniu kolejnego cudu (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 4, opis: "+4 Wp\u0142ywu \u2014 handel aksumski (cywilizacja)" }
        ]
      }
    },
    {
      id: "wiszace_ogrody",
      nazwa: "Wisz\u0105ce ogrody",
      dostep: "E",
      cywilizacje: ["babilonia"],
      techUnlock: ["Pismo"],
      wymagaTerenu: ["rzeka_sasiad"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 150,
      utrzymanie: 2,
      bonusy: {
        miasto: { zywnosc: 3 },
        teren: [
          { typTerenu: "farma", zywnosc: 2, warunek: "hex_sasiad_rzeka" }
        ],
        specjalne: [
          { typ: "wzrost_ludnosci_procent", wartosc: 0.15, opis: "+15% wzrost populacji we wszystkich miastach (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 2, opis: "+2 bazowe Zaufanie wobec s\u0105siad\xF3w (cywilizacja)" }
        ]
      }
    },
    {
      id: "wyrocznia",
      nazwa: "Wyrocznia",
      dostep: "R",
      cywilizacje: [
        "egipt",
        "sumer",
        "babilonia",
        "grecy",
        "hetyci",
        "celtowie",
        "harappa",
        "fenicjanie",
        "germanie",
        "inkowie",
        "chinczycy",
        "rzymianie",
        "asyria",
        "zulusi",
        "slowianie"
      ],
      techUnlock: ["Mistycyzm"],
      wymagaTerenu: ["trudny_teren"],
      epokaWejscia: 1,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 180,
      utrzymanie: 1,
      bonusy: {
        miasto: { kultura: 3 },
        specjalne: [
          { typ: "jednorazowe", cel: "kultura_wydarzenia", wartosc: 15, opis: "+15 Kultury za nagrody z wydarze\u0144 narracyjnych (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 3, opis: "+3 Zaufanie \u2014 wyrocznia jako arbiter (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 2, opis: "+2 Wp\u0142ywu (cywilizacja)" }
        ]
      },
      uwagi: "Jedyny cud wy\u015Bcigowy epoki Kamienia; sanktuarium / wyrocznia (Delphi, Dodona\u2026)"
    },
    {
      id: "roquepertuse",
      nazwa: "Roquepertuse",
      nazwaAlt: "Sanktuarium celtyckie \u2014 portyk z niszami na czaszki (Velaux, Galia)",
      dostep: "E",
      cywilizacje: ["celtowie"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["wzgorze", "trudny_teren"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 290,
      utrzymanie: 2,
      bonusy: {
        miasto: { kultura: 3, zadowolenie: 3 },
        hex: { kultura: 6 },
        specjalne: [
          { typ: "walka_procent", cel: "piechota_szarza", wartosc: 0.15, opis: "+15% ataku piechoty przy pierwszym uderzeniu (cywilizacja)" },
          { typ: "armia_morale", wartosc: 2, opis: "Kult g\u0142\xF3w: +2 Morale imperium przez 3 tury po wygranej bitwie obronnej (cywilizacja)" },
          { typ: "jednorazowe", cel: "kultura_wydarzenia", wartosc: 10, opis: "+10 Kultury za \u015Bwi\u0119ta religijne (cywilizacja)" },
          { typ: "wojna_wsparcie", wartosc: 1, opis: "+1 Wsparcia we wszystkich wojnach (cywilizacja)" }
        ]
      },
      uwagi: "IV\u2013III w. p.n.e.; Prowansja; centrum ceremonialne (bez sta\u0142ej zabudowy mieszkalnej); zniszczone ~III w. p.n.e."
    },
    {
      id: "stupa_sanchi",
      nazwa: "Stupa w Sanchi",
      dostep: "E",
      cywilizacje: ["harappa"],
      techUnlock: ["Religia"],
      wymagaTerenu: ["rownina"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 210,
      utrzymanie: 1,
      bonusy: {
        miasto: { zadowolenie: 3, kultura: 3 },
        specjalne: [
          { typ: "kultura_z_nadwyzka_zadowolenia", wartosc: 2, opis: "+2 Kultury/tur\u0119 na ka\u017Cde 5 nadwy\u017Cki Zadowolenia w imperium (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 4, opis: "+4 bazowe Zaufanie \u2014 dharmiczny spok\xF3j (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 2, opis: "+2 Wp\u0142ywu (cywilizacja)" }
        ]
      }
    },
    {
      id: "petra",
      nazwa: "Petra",
      dostep: "E",
      cywilizacje: ["fenicjanie"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["pustynia"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 165,
      utrzymanie: 2,
      bonusy: {
        miasto: { pieniadz: 3 },
        teren: [
          { typTerenu: "pustynia", pieniadz: 2, praca: 2 }
        ],
        specjalne: [
          { typ: "magazyn_pojemnosc", wartosc: 6, opis: "+6 pojemno\u015B\u0107 handlu/surowc\xF3w (cywilizacja)" },
          { typ: "handel_procent", cel: "handel", wartosc: 0.15, opis: "+15% Handlu \u2014 dochodu z tras handlowych (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 5, opis: "+5 Wp\u0142ywu \u2014 karawany Nabatejczyk\xF3w (cywilizacja)" }
        ]
      }
    },
    {
      id: "hamonga",
      nazwa: "Kamie\u0144 Ha'amonga",
      dostep: "R",
      cywilizacje: [
        "egipt",
        "sumer",
        "babilonia",
        "grecy",
        "hetyci",
        "celtowie",
        "harappa",
        "fenicjanie",
        "germanie",
        "inkowie",
        "chinczycy",
        "rzymianie",
        "asyria",
        "zulusi",
        "slowianie"
      ],
      techUnlock: ["\u017Begluga"],
      wymagaTerenu: ["wybrzeze"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 220,
      utrzymanie: 1,
      bonusy: {
        miasto: { kultura: 3, zywnosc: 3 },
        teren: [
          { typTerenu: "lowie_rybackie", kultura: 2, zywnosc: 2 },
          { typTerenu: "laka", kultura: 2, warunek: "hex_sasiad_wybrzeze" }
        ],
        specjalne: [
          { typ: "handel_procent", cel: "handel_morski", wartosc: 0.15, opis: "+15% Handlu \u2014 dochodu z tras handlowych morskich (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 3, opis: "+3 Wp\u0142ywu (cywilizacja)" }
        ]
      },
      uwagi: "Jedyny cud wy\u015Bcigowy epoki Br\u0105zu; megality nadmorskie, \u017Begluga"
    },
    {
      id: "kolos",
      nazwa: "Kolos Rodyjski",
      dostep: "E",
      cywilizacje: ["grecy"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["wybrzeze"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 230,
      utrzymanie: 2,
      bonusy: {
        miasto: { pieniadz: 3, kultura: 3 },
        specjalne: [
          { typ: "magazyn_pojemnosc", wartosc: 8, opis: "+8 pojemno\u015B\u0107 surowc\xF3w / trade capacity (cywilizacja)" },
          { typ: "handel_procent", cel: "handel_morski", wartosc: 0.2, opis: "+20% Handlu \u2014 dochodu z tras handlowych morskich, korzystaj\u0105cych z port\xF3w (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 6, opis: "+6 Wp\u0142ywu \u2014 Rhodos, w\u0119ze\u0142 morski (cywilizacja)" }
        ]
      }
    },
    {
      id: "osada_aschaffenburg",
      nazwa: "Osada Aschaffenburg (hala d\u0119bowa)",
      nazwaAlt: "Monumentalna budowla nad Menem, kultura late\u0144ska",
      dostep: "E",
      cywilizacje: ["germanie"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["rzeka_sasiad"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 300,
      utrzymanie: 2,
      bonusy: {
        miasto: { praca: 3 },
        teren: [
          { typTerenu: "rzeka_sasiad", praca: 2, drewno: 2 }
        ],
        specjalne: [
          { typ: "produkcja_procent", cel: "ulepszenia_drewno", wartosc: 0.15, opis: "\u221215% kosztu Pracy ulepsze\u0144 drewnianych (cywilizacja)" },
          { typ: "walka_procent", cel: "obrona_terytorium", wartosc: 0.15, opis: "+15% obrony jednostek na w\u0142asnym terytorium (cywilizacja)" },
          { typ: "pobor_regen", wartosc: 0.1, opis: "+10% regeneracji Manpower (cywilizacja)" }
        ]
      },
      uwagi: "IV w. p.n.e.; pot\u0119\u017Cne d\u0119bowe belki nad Menem (Bawaria); kultura late\u0144ska"
    },
    {
      id: "ziggurat",
      nazwa: "Ziggurat / Piramida S\u0142o\u0144ca",
      dostep: "E",
      cywilizacje: ["sumer"],
      techUnlock: ["Matematyka"],
      wymagaTerenu: ["plaski_teren"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 240,
      utrzymanie: 2,
      bonusy: {
        miasto: { kultura: 6, nauka: 3 },
        specjalne: [
          { typ: "nauka_procent", cel: "nauka", wartosc: 0.15, opis: "+15% Nauki w imperium (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 4, opis: "+4 Wp\u0142ywu \u2014 kap\u0142ani-astronomowie (cywilizacja)" }
        ]
      }
    },
    {
      id: "mundo_perdido",
      nazwa: "\u015Awi\u0105tynia Mundo Perdido",
      dostep: "E",
      cywilizacje: ["inkowie"],
      techUnlock: ["Matematyka", "Murarstwo"],
      wymagaTerenu: ["tropiki"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 220,
      utrzymanie: 2,
      bonusy: {
        miasto: { nauka: 3, zadowolenie: 3 },
        teren: [
          { typTerenu: "tropiki", nauka: 2, zadowolenie: 2 }
        ],
        specjalne: [
          { typ: "nauka_procent", cel: "nauka", wartosc: 0.2, opis: "+20% Nauki w imperium \u2014 kalendarz Maj\xF3w (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 3, opis: "+3 Wp\u0142ywu (cywilizacja)" }
        ]
      }
    },
    {
      id: "terakotowa_armia",
      nazwa: "Terakotowa armia",
      dostep: "E",
      cywilizacje: ["chinczycy"],
      techUnlock: ["Wojskowo\u015B\u0107"],
      wymagaTerenu: ["laka"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 320,
      utrzymanie: 3,
      bonusy: {
        miasto: { praca: 3 },
        specjalne: [
          { typ: "jednorazowe", cel: "dowodca_armii", wartosc: 1, opis: "Darmowy Dow\xF3dca armii przy uko\u0144czeniu (cywilizacja)" },
          { typ: "armia_xp", wartosc: 0.25, opis: "+25% do\u015Bwiadczenia armii (cywilizacja)" },
          { typ: "walka_procent", cel: "piechota", wartosc: 0.15, opis: "+15% ataku piechoty (cywilizacja)" },
          { typ: "wojna_wsparcie", wartosc: 2, opis: "+2 Wsparcia we wszystkich wojnach (cywilizacja)" }
        ]
      },
      uwagi: "Qin, ok. 246\u2013208 p.n.e.; grobowiec Qin Shi Huanga"
    },
    {
      id: "koloseum",
      nazwa: "Koloseum",
      dostep: "E",
      cywilizacje: ["rzymianie"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["przy_miescie"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 310,
      utrzymanie: 3,
      bonusy: {
        miasto: { kultura: 3, zadowolenie: 6 },
        specjalne: [
          { typ: "produkcja_procent", cel: "budynki", wartosc: 0.15, opis: "\u221215% kosztu Produkcji budynk\xF3w (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 3, opis: "+3 Zaufanie wewn\u0119trzne \u2014 panem et circenses (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 4, opis: "+4 Wp\u0142ywu \u2014 chwa\u0142a Rzymu (cywilizacja)" }
        ]
      }
    },
    {
      id: "dur_sharrukin",
      nazwa: "Dur-Sharrukin",
      dostep: "E",
      cywilizacje: ["asyria"],
      techUnlock: ["Budownictwo", "Wojskowo\u015B\u0107"],
      wymagaTerenu: ["przy_miescie"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 260,
      utrzymanie: 3,
      bonusy: {
        miasto: { obrona: 3 },
        specjalne: [
          { typ: "fortyfikacja_mapa", cel: "fort", wartosc: 5, opis: "+5 Obrony na heksach fortyfikacji (cywilizacja)" },
          { typ: "walka_procent", cel: "obl\u0119\u017Cenie", wartosc: 0.15, opis: "+15% skuteczno\u015Bci obl\u0119\u017Cenia (cywilizacja)" },
          { typ: "wojna_wsparcie", wartosc: 2, opis: "+2 Wsparcia we wszystkich wojnach (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: -2, opis: "\u22122 Zaufanie u s\u0105siad\xF3w \u2014 strach przed Asyri\u0105 (cywilizacja)" }
        ]
      }
    },
    {
      id: "brama_narodow",
      nazwa: "Brama wszystkich narod\xF3w",
      dostep: "R",
      cywilizacje: [
        "egipt",
        "sumer",
        "babilonia",
        "grecy",
        "hetyci",
        "celtowie",
        "harappa",
        "fenicjanie",
        "germanie",
        "inkowie",
        "chinczycy",
        "rzymianie",
        "asyria",
        "zulusi",
        "slowianie"
      ],
      techUnlock: ["In\u017Cynieria", "Wojskowo\u015B\u0107"],
      wymagaTerenu: ["przy_miescie"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 280,
      utrzymanie: 3,
      bonusy: {
        miasto: { kultura: 3, pieniadz: 3 },
        specjalne: [
          { typ: "wojna_wsparcie", wartosc: 3, opis: "+3 Wsparcia we wszystkich aktywnych wojnach (cywilizacja)" },
          { typ: "handel_procent", cel: "handel", wartosc: 0.15, opis: "+15% Handlu \u2014 dochodu z tras handlowych (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 10, opis: "+10 Wp\u0142ywu \u2014 satrapie i go\u015Bcie narod\xF3w (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 3, opis: "+3 Zaufanie u pa\u0144stw z aktywnym handlem (cywilizacja)" }
        ]
      },
      uwagi: "Persepolis / brama satrapii; jedyny cud wy\u015Bcigowy epoki \u017Belaza \u2014 odblokowanie po In\u017Cynierii"
    },
    {
      id: "palac_weiyang",
      nazwa: "Pa\u0142ac Weiyang",
      dostep: "E",
      cywilizacje: ["chinczycy"],
      techUnlock: ["Wymiana", "Murarstwo"],
      wymagaTerenu: ["laka"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 290,
      utrzymanie: 3,
      bonusy: {
        miasto: { kultura: 3, zadowolenie: 3, pieniadz: 3 },
        specjalne: [
          { typ: "dyplomacja_wp\u0142yw", wartosc: 12, opis: "+12 Wp\u0142ywu \u2014 cesarski dw\xF3r Chang'an (cywilizacja)" },
          { typ: "handel_procent", cel: "handel", wartosc: 0.15, opis: "+15% Handlu \u2014 dochodu z tras handlowych (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "relacje_zaufanie", wartosc: 4, opis: "+4 bazowe Zaufanie (cywilizacja)" }
        ]
      },
      uwagi: "Zachodnia Han, 200 p.n.e.; cesarz Gaozu"
    },
    {
      id: "yerkapi",
      nazwa: "Yerkap\u0131 (Brama w ziemi)",
      nazwaAlt: "Brama Sfinks\xF3w, Hattusa",
      dostep: "E",
      cywilizacje: ["hetyci"],
      techUnlock: ["Wojskowo\u015B\u0107"],
      wymagaTerenu: ["wzgorze", "trudny_teren"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 240,
      utrzymanie: 2,
      bonusy: {
        miasto: { obrona: 3 },
        hex: { obrona: 12 },
        specjalne: [
          { typ: "fortyfikacja_mapa", cel: "fort", wartosc: 5, opis: "+5 Obrony na heksach fortyfikacji (cywilizacja)" },
          { typ: "walka_procent", cel: "rydwany", wartosc: 0.15, opis: "+15% ataku rydwan\xF3w (cywilizacja)" },
          { typ: "wojna_wsparcie", wartosc: 2, opis: "+2 Wsparcia we wszystkich wojnach (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 2, opis: "+2 Zaufanie u sojusznik\xF3w (cywilizacja)" }
        ]
      },
      uwagi: "Nasyp ziemny + tunel sklepiony + Brama Sfinks\xF3w; kompleks obronno-sakralny Hattusy"
    },
    {
      id: "posag_peruna",
      nazwa: "Pos\u0105g Peruna",
      dostep: "E",
      cywilizacje: ["slowianie"],
      techUnlock: ["Obr\xF3bka \u017Celaza"],
      wymagaTerenu: ["wzgorze"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 140,
      utrzymanie: 1,
      bonusy: {
        miasto: { kultura: 3, zadowolenie: 3 },
        hex: { kultura: 3 },
        specjalne: [
          { typ: "pobor_regen", wartosc: 0.15, opis: "+15% regeneracji Manpower (cywilizacja)" },
          { typ: "walka_procent", cel: "piechota_las", wartosc: 0.15, opis: "+15% ataku piechoty w lesie (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 3, opis: "+3 Zaufanie w\u015Br\xF3d plemion s\u0142owia\u0144skich (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 2, opis: "+2 Wp\u0142ywu \u2014 kult Peruna (cywilizacja)" }
        ]
      }
    }
  ],
  panstwa: {
    egipt: {
      nazwa: "Egipt",
      cuda: [
        { id: "piramidy", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    sumer: {
      nazwa: "Sumerowie",
      cuda: [
        { id: "ziggurat", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    babilonia: {
      nazwa: "Babilonia",
      cuda: [
        { id: "wiszace_ogrody", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    grecy: {
      nazwa: "Grecy",
      cuda: [
        { id: "kolos", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    hetyci: {
      nazwa: "Hetyci",
      cuda: [
        { id: "yerkapi", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    celtowie: {
      nazwa: "Celtowie",
      cuda: [
        { id: "roquepertuse", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    harappa: {
      nazwa: "Harappa",
      cuda: [
        { id: "stupa_sanchi", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    fenicjanie: {
      nazwa: "Fenicjanie",
      cuda: [
        { id: "petra", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    germanie: {
      nazwa: "Germanie",
      cuda: [
        { id: "osada_aschaffenburg", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    inkowie: {
      nazwa: "Inkowie",
      cuda: [
        { id: "mundo_perdido", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    chinczycy: {
      nazwa: "Chi\u0144czycy",
      cuda: [
        { id: "terakotowa_armia", dostep: "E", kolejnosc: 1 },
        { id: "palac_weiyang", dostep: "E", kolejnosc: 2 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 3 },
        { id: "hamonga", dostep: "R", kolejnosc: 4 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 5 }
      ]
    },
    rzymianie: {
      nazwa: "Rzymianie",
      cuda: [
        { id: "koloseum", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    asyria: {
      nazwa: "Asyria",
      cuda: [
        { id: "dur_sharrukin", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    zulusi: {
      nazwa: "Zulusi",
      cuda: [
        { id: "wielka_stela", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    slowianie: {
      nazwa: "S\u0142owianie",
      cuda: [
        { id: "posag_peruna", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    }
  },
  parkowane_epoka4plus: [
    {
      id: "nalanda",
      nazwa: "Nalanda",
      dostep: "E",
      cywilizacje: ["harappa"],
      techUnlock: ["Pismo", "Matematyka"],
      wymagaTerenu: ["rownina"],
      epokaDocelowa: 4,
      epokaDocelowaOpis: "V\u2013XIII w. n.e. \u2014 \u015Bredniowiecze; uniwersytet Gupt\xF3w/Harszy",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Przeniesione z Antyku 2026-06-26 \u2014 zbyt p\xF3\u017Ane na Harapp\u0119/Indus"
    },
    {
      id: "angkor_wat",
      nazwa: "Angkor Wat",
      dostep: "E",
      cywilizacje: ["harappa"],
      techUnlock: ["Budownictwo"],
      wymagaTerenu: ["rzeka_sasiad"],
      epokaDocelowa: 5,
      epokaDocelowaOpis: "ok. 1113\u20131150 n.e. \u2014 Khmer; przypisanie pa\u0144stwa do ustalenia",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Przeniesione z Antyku 2026-06-26 \u2014 \u015Bredniowiecze"
    },
    {
      id: "wielki_dzwon",
      nazwa: "Wielki dzw\xF3n (Yongle / Emile Bell)",
      dostep: "E",
      cywilizacje: ["chinczycy"],
      techUnlock: ["Religia"],
      wymagaTerenu: ["trudny_teren"],
      epokaDocelowa: 6,
      epokaDocelowaOpis: "Dzwon Ming (1403\u20131424, Yongle); \u015Bwi\u0105tynia Qing (1733) \u2014 poza Antykiem",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Przeniesione z Antyku 2026-06-26 \u2014 dynastie Ming/Qing"
    },
    {
      id: "mauzoleum_teodoryka",
      nazwa: "Mauzoleum Teodoryka",
      dostep: "E",
      cywilizacje: ["germanie"],
      techUnlock: ["Murarstwo"],
      wymagaTerenu: ["wybrzeze"],
      epokaDocelowa: 4,
      epokaDocelowaOpis: "VI w. n.e. \u2014 Ostrogoci, Ravenna; poza Antykiem",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Zast\u0105pione w Antyku przez Osad\u0119 Aschaffenburg (2026-06-26)"
    },
    {
      id: "kopiec_grobowy",
      nazwa: "Kopiec grobowy",
      nazwaAlt: "Monks Mound (Mississippian)",
      dostep: "E",
      cywilizacje: ["celtowie"],
      techUnlock: ["Rolnictwo", "Murarstwo"],
      wymagaTerenu: ["rzeka_sasiad"],
      epokaDocelowa: 1,
      epokaDocelowaOpis: "Kultura missisipia\u0144ska \u2014 historycznie nie Galowie",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Zast\u0105pione przez Roquepertuse (2026-06-26); placeholder Monks Mound"
    }
  ]
};

// src/game/wonders-data.ts
var data = wonders_default;
var wonderById = new Map(data.cuda.map((w) => [w.id, w]));
function getWondersForCiv(typCywilizacji) {
  const row = data.panstwa[typCywilizacji];
  if (!row) return [];
  return row.cuda.slice().sort((a, b) => a.kolejnosc - b.kolejnosc).map((e) => wonderById.get(e.id)).filter((w) => w != null);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildTechEpochMap,
  evaluateWonderBuildGate,
  getWondersForCiv,
  listBuildableWondersForCiv
});
