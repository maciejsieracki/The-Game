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

// tools/.map-field-battle-entry.ts
var map_field_battle_entry_exports = {};
__export(map_field_battle_entry_exports, {
  collectAtkRosterNearCity: () => collectAtkRosterNearCity,
  collectBattleRoster: () => collectBattleRoster,
  collectCityDefRoster: () => collectCityDefRoster,
  defenderSideTitle: () => defenderSideTitle,
  hasCityDefenders: () => hasCityDefenders,
  planOpenCityFieldBattle: () => planOpenCityFieldBattle,
  resolveEnemyCityClick: () => resolveEnemyCityClick,
  shouldIncludeInBattleRoster: () => shouldIncludeInBattleRoster,
  validateOpenCityFieldBattle: () => validateOpenCityFieldBattle
});
module.exports = __toCommonJS(map_field_battle_entry_exports);

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
  kopalnia_zlota: {
    nazwa: "Kopalnia z\u0142ota",
    epoka: 2,
    bonus: {
      praca: 2
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "Maciej 2026-07-25: z\u0142oto jest surowcem DOST\u0118POWYM \u2014 bez magazynowania, bez ilo\u015Bci/tur\u0119. W przeciwie\u0144stwie do Kopalni miedzi/kopalni na z\u0142o\u017Cu \u017Celaza, ta Kopalnia NIE zasila \u017Cadnej puli (celowo brak surowiecOdblokowany i surowiec_ilosc_tura) \u2014 liczy si\u0119 wy\u0142\u0105cznie fakt jej istnienia gdziekolwiek w imperium (empireHasKopalniaZlota, game/zloto-access.ts).",
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce z\u0142ota (hex.zloze=zloto)",
    warunek: "dost\u0119p imperium do Z\u0142ota (bramka Mennicy) \u2014 bez wydobycia ilo\u015Bciowego",
    koszt_praca: 22,
    tech: "Waluta",
    odblokowuje: "Mennica (dost\u0119p do Z\u0142ota, obok Targowiska w tym mie\u015Bcie)",
    uwagi: "Maciej 2026-07-25: \u201Ez\u0142oto potraktujemy jako surowiec, do kt\xF3rego wystarczy tylko dost\u0119p \u2014 nie trzeba budowa\u0107 wielu kopalni\u201D. Wzorowana na Kopalni miedzi (kopalnia_miedzi) \u2014 dedykowane ulepszenie, tylko na hex.zloze=zloto."
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
function hexDistance(aq, ar, bq, br) {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs(-aq - ar - (-bq - br));
  return Math.max(dq, dr, ds);
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

// src/units/battleRoster.ts
function shouldIncludeInBattleRoster(u, ctx) {
  if (!isCivilianUnit(u)) return true;
  if (ctx.side === "attacker") return u.id === ctx.anchor.id;
  return u.q === ctx.battleHex.q && u.r === ctx.battleHex.r;
}
function collectUnitsInRadius(anchor, allUnits, radiusFrom, ctx) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const u of allUnits) {
    if (u.ownerId !== anchor.ownerId) continue;
    if (radiusFrom(u) > 1) continue;
    if (!shouldIncludeInBattleRoster(u, ctx)) continue;
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  if (!out.some((x) => x.id === anchor.id) && shouldIncludeInBattleRoster(anchor, ctx)) {
    out.unshift(anchor);
  }
  const anchorIdx = out.findIndex((x) => x.id === anchor.id);
  if (anchorIdx > 0) {
    out.splice(anchorIdx, 1);
    out.unshift(anchor);
  }
  return out;
}
function collectBattleRoster(anchor, allUnits, side = "attacker") {
  const battleHex = { q: anchor.q, r: anchor.r };
  const ctx = { side, anchor, battleHex };
  return collectUnitsInRadius(
    anchor,
    allUnits,
    (u) => hexDistance(anchor.q, anchor.r, u.q, u.r),
    ctx
  );
}
function collectAtkRosterNearCity(city, anchor, allUnits) {
  const ctx = {
    side: "attacker",
    anchor,
    battleHex: { q: city.q, r: city.r }
  };
  return collectUnitsInRadius(
    anchor,
    allUnits,
    (u) => hexDistance(u.q, u.r, city.q, city.r),
    ctx
  );
}
function collectDefRosterNearCity(city, allUnits) {
  const anchorOnCity = allUnits.find(
    (u) => u.q === city.q && u.r === city.r
  );
  const anchor = anchorOnCity ?? {
    id: "__city_hex__",
    ownerId: allUnits.find((u) => hexDistance(u.q, u.r, city.q, city.r) <= 1)?.ownerId ?? -1,
    typeId: "__anchor__",
    category: "domyslny",
    q: city.q,
    r: city.r,
    ruch: 0,
    ruchLeft: 0
  };
  const ctx = {
    side: "defender",
    anchor,
    battleHex: { q: city.q, r: city.r }
  };
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const u of allUnits) {
    if (hexDistance(u.q, u.r, city.q, city.r) > 1) continue;
    if (!shouldIncludeInBattleRoster(u, ctx)) continue;
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  return out;
}

// data/epoka-ludnosc-manpower.json
var epoka_ludnosc_manpower_default = {
  _opis: "Skala ludno\u015Bci i Manpower per epoka imperium (wiersze 1\u201310). 1 ludek = ludno\u015B\u0107 absolutna na slot population (1\u201310). manpowerNaLudka = 10% ludekNaLudka. manpowerNaJednostke = manpowerNaLudka (koszt rekrutacji 1 jednostki = pe\u0142ny slot manpower; 1 ludek = 1 jednostka przy pe\u0142nej puli).",
  _formuly: {
    ludnoscAbsolutna: "population \xD7 ludekNaLudka[epoka]",
    manpowerMax: "population \xD7 manpowerNaLudka[epoka]",
    kosztRekrutacji: "manpowerNaJednostke[epoka] = manpowerNaLudka[epoka] per jednostka"
  },
  epoki: [
    { epoka: 1, ludekNaLudka: 1e4, manpowerNaLudka: 1e3, manpowerNaJednostke: 1e3 },
    { epoka: 2, ludekNaLudka: 2e4, manpowerNaLudka: 2e3, manpowerNaJednostke: 2e3 },
    { epoka: 3, ludekNaLudka: 4e4, manpowerNaLudka: 4e3, manpowerNaJednostke: 4e3 },
    { epoka: 4, ludekNaLudka: 8e4, manpowerNaLudka: 8e3, manpowerNaJednostke: 8e3 },
    { epoka: 5, ludekNaLudka: 16e4, manpowerNaLudka: 16e3, manpowerNaJednostke: 16e3 },
    { epoka: 6, ludekNaLudka: 32e4, manpowerNaLudka: 32e3, manpowerNaJednostke: 32e3 },
    { epoka: 7, ludekNaLudka: 64e4, manpowerNaLudka: 64e3, manpowerNaJednostke: 64e3 },
    { epoka: 8, ludekNaLudka: 12e5, manpowerNaLudka: 12e4, manpowerNaJednostke: 12e4 },
    { epoka: 9, ludekNaLudka: 24e5, manpowerNaLudka: 24e4, manpowerNaJednostke: 24e4 },
    { epoka: 10, ludekNaLudka: 48e5, manpowerNaLudka: 48e4, manpowerNaJednostke: 48e4 }
  ]
};

// data/miasto-params.json
var miasto_params_default = {
  min_dystans_miast: {
    wartosc: 5,
    jednostka: "heksy",
    opis: "Minimalny dystans (w heksach) miedzy dwoma miastami przy zakladaniu. Uzywane w cities.canFoundCity (reason 'za blisko innego miasta')."
  },
  jednostka_koszt_ludnosci: {
    wartosc: 0,
    jednostka: "ludnosc",
    opis: "Koszt ludnosci miasta za ukonczenie jednostki z kolejki (rekrutacja). USTAWIONE 0 (Maciej 2026-07-21): rekrutacja NIE zabiera juz populacji miasta \u2014 jedynym kosztem werbu jest pula Manpower (epoka-ludnosc-manpower.json / manpower.ts). production.populationCostOf; przy 0 populacja pozostaje bez zmian."
  },
  manpower_regen_proc_max_tura: {
    wartosc: 2,
    jednostka: "% max/ture",
    opis: "Co koniec tury miasto odzyskuje floor(manpowerMax \xD7 wartosc/100) Manpower (do cap). Ep1, 10 ludkow, max=10k \u2192 +200/ture. Pusta pula \u224850 tur do pelna. manpower.tickManpowerRegen."
  },
  manpower_regen_blok_oblezenie: {
    wartosc: 1,
    jednostka: "0/1",
    opis: "1 = brak odnowy Manpower gdy city.oblegane=true. 0 = regen normalnie podczas obl\u0119\u017Cenia."
  },
  jednostka_koszt_domyslny: {
    wartosc: 10,
    jednostka: "Praca",
    opis: "Domyslny koszt Pracy jednostki, gdy brak pola 'Pieniadz (koszt)' w units.json i brak dopasowania roli. production.DEFAULT_UNIT_COST."
  },
  zaloz_miasto_koszt_praca: {
    wartosc: 20,
    jednostka: "Praca",
    opis: "Koszt za\u0142o\u017Cenia miasta z mapy (tryb Budowa) \u2014 jak historyczny Osadnik (B1 Maciej 2026-06-29). Pierwsze miasto onboarding = 0 (Silnik)."
  },
  zaloz_miasto_koszt_ludnosci: {
    wartosc: 1,
    jednostka: "ludnosc",
    opis: "Ludno\u015B\u0107 pobierana przy za\u0142o\u017Ceniu kolejnego miasta (jak Osadnik Ludno\u015B\u0107=1)."
  },
  jednostka_koszt_rola_wsparcie: {
    wartosc: 12,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Wsparcie', gdy brak 'Pieniadz (koszt)'."
  },
  jednostka_koszt_rola_dystans: {
    wartosc: 8,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Dystans' (jednostki dystansowe)."
  },
  jednostka_koszt_rola_wrecz: {
    wartosc: 10,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Wrecz' (piechota wrecz)."
  },
  jednostka_koszt_rola_konnica: {
    wartosc: 16,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Konnica'."
  },
  zasieg_okolicy_miasta: {
    wartosc: 10,
    jednostka: "pola/strona",
    opis: "Promien okolicy roboczej miasta (pola na plony) z kazdej strony = 10 (bylo 5; ROZSZERZONE o +5 z kazdej strony, decyzja Naster). ~21x21 ~331 heksow. Tu przydzielasz mieszkancow; to tez zasieg budowy miasta."
  },
  zasieg_okolicy_max: {
    wartosc: 15,
    jednostka: "pola/strona",
    opis: "Maksymalny promien okolicy miasta (cap) w modelu: cityRangeForPopulation(pop)=max(zasieg_okolicy_baza, min(pop,cap)). Maciej 2026-06-27: start min 5, rosnie 1:1 z pop."
  },
  praca_udzial_budynki: {
    wartosc: 0.7,
    jednostka: "udzial [0..1]",
    opis: "Q4: czesc Pracy miasta do kolejki budynkow; reszta -> globalna pula Pracy w skarbcu."
  },
  bonus_obrona_mur_proc: {
    wartosc: 200,
    jednostka: "% Obrony",
    opis: "Miasto Z MUREM (budynek 'mury', City.maMur) daje +200% Obrony broniacym sie jednostkom (bitwa/oblezenie). Decyzja Naster 2026-06-25. Konsumuje main.ts structureDefenseBonusFor -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway). Miasto bez muru = brak tego bonusu. Miasto z Cytadela (upgrade Murow, patrz bonus_obrona_cytadela_proc) dostaje ten bonus RAZEM z dodatkowym -- lacznie +300%, nie osobnymi warstwami w kodzie (jeden zwracany procent: 200 albo 300)."
  },
  bonus_obrona_cytadela_proc: {
    wartosc: 100,
    jednostka: "% Obrony (dodatkowo do muru)",
    opis: `Miasto z Cytadela (budynek 'fort' -- UWAGA: to jest budynek Cytadela, upgrade Murow; NIE mylic z ulepszeniem terenowym 'fort' na mapie, ktore daje osobny bonus +100% dla obozujacych jednostek poza miastem) daje DODATKOWE +100% Obrony PONAD bonus muru -- lacznie +300% (200 mur + 100 cytadela). Decyzja Maciej 2026-07-25: "3, 100%. Bo to juz by bylo za duzo, i tak z murami jest 300%." Cytadela to upgrade budynku 'mury' (ID podmieniane w cityBuilt), wiec miasto z Cytadela NIE ma juz 'mury' w liscie budynkow -- flaga City.maMur pozostaje true (main.ts ustawia ja dla obu ID), a rozroznienie mur/cytadela robi structureDefenseBonusFor po cityBuilt.includes('fort'). Konsumuje main.ts structureDefenseBonusFor -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway).`
  },
  bonus_obrona_baszta_proc: {
    wartosc: 100,
    jednostka: "% Obrony (dodatkowo do muru+cytadeli)",
    opis: "Decyzja 41B (Maciej 2026-07-25): Baszta -- TRZECI, niezalezny budynek obronny (buildings.json id='baszta'), dokladany obok Murow i Cytadeli (brak upgradeFrom, zaden nie zastepuje pozostalych). Daje DODATKOWE +100% Obrony PONAD Mury (+200%) i Cytadele (+100%) -- miasto z kompletem trzech budowli obronnych = +400% lacznie (200 mur + 100 cytadela + 100 baszta). Konsumuje main.ts structureDefenseBonusFor -> game/city-defense.ts cityWallDefenseBonusPercent -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway). Baszta sama (bez Murow/Cytadeli) daje WYLACZNIE swoj wlasny +100% -- baza 'mur' (200%) aktywuje sie tylko gdy w miescie stoi realnie budynek 'mury' lub 'fort'."
  },
  zasieg_okolicy_baza: {
    wartosc: 5,
    jednostka: "pola/strona",
    opis: "Minimalny promien okolicy przy populacji 1..4 (start miasta = 5 heksow). Czytane przez okolica.cityRangeForPopulation (Maciej 2026-06-27)."
  },
  zasieg_okolicy_pop5: {
    wartosc: 10,
    jednostka: "pola/strona",
    opis: "[LEGACY - nieuzywane od 2026-06-25] Zasieg okolicy przy populacji >= 5 (stary model schodkowy). Zachowane dla wstecznej zgodnosci parsowania."
  },
  zasieg_okolicy_pop10: {
    wartosc: 15,
    jednostka: "pola/strona",
    opis: "[LEGACY - nieuzywane od 2026-06-25] Zasieg okolicy przy populacji >= 10 (stary model schodkowy). Zachowane dla wstecznej zgodnosci parsowania."
  },
  udzial_output_produkcja: {
    wartosc: 0.4,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia PRODUKCJA. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_pieniadz: {
    wartosc: 0.3,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia PIENIADZ. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_nauka: {
    wartosc: 0.2,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia NAUKA. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_rozwoj: {
    wartosc: 0.1,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia ROZWOJ. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  }
};

// src/game/manpower.ts
var ROWS = epoka_ludnosc_manpower_default.epoki;

// src/game/building-resource-gate.ts
var LABEL_BY_ASCII = {
  drewno: "Drewno",
  kamien: "Kamie\u0144",
  glina: "Glina",
  ruda: "Ruda",
  zelazo: "\u017Belazo",
  stal: "Stal",
  braz: "Br\u0105z",
  sol: "S\xF3l",
  cegla: "Ceg\u0142a",
  ceramika: "Ceramika"
};
var ASCII_BY_LABEL = Object.fromEntries(
  Object.entries(LABEL_BY_ASCII).map(([ascii, label]) => [label, ascii])
);

// src/game/production.ts
var DEFAULT_UNIT_COST = miasto_params_default.jednostka_koszt_domyslny?.wartosc ?? 10;
var DEFAULT_COST_BY_ROLE = {
  Wsparcie: miasto_params_default.jednostka_koszt_rola_wsparcie?.wartosc ?? 12,
  Dystans: miasto_params_default.jednostka_koszt_rola_dystans?.wartosc ?? 8,
  "Wr\u0119cz": miasto_params_default.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
  // melee role key
  Wrecz: miasto_params_default.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
  Konnica: miasto_params_default.jednostka_koszt_rola_konnica?.wartosc ?? 16
};
var UNIT_POPULATION_COST = miasto_params_default.jednostka_koszt_ludnosci?.wartosc ?? 1;
var DEFAULT_OUTPUT_SHARES = Object.freeze({
  produkcja: miasto_params_default.udzial_output_produkcja?.wartosc ?? 0.4,
  pieniadz: miasto_params_default.udzial_output_pieniadz?.wartosc ?? 0.3,
  nauka: miasto_params_default.udzial_output_nauka?.wartosc ?? 0.2,
  rozwoj: miasto_params_default.udzial_output_rozwoj?.wartosc ?? 0.1
});

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

// src/game/veteran.ts
var VETERAN_BONUS_FRAC = {
  1: 0,
  2: 0.1,
  3: 0.2
};
function veteranBattlesSurvived(unit) {
  const v = unit?.battlesSurvived;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}
function veteranLevelFromBattles(battlesSurvived) {
  if (battlesSurvived >= 2) return 3;
  if (battlesSurvived >= 1) return 2;
  return 1;
}
function veteranLevel(unit) {
  return veteranLevelFromBattles(veteranBattlesSurvived(unit));
}
function veteranBonusFracForLevel(level) {
  return VETERAN_BONUS_FRAC[level];
}
function veteranCombatBonusFrac(unit) {
  return veteranBonusFracForLevel(veteranLevel(unit));
}
function round4(x) {
  return Math.round(x * 1e4) / 1e4;
}
function applyVeteranFracToCombatUnit(cu, frac) {
  if (!frac) return cu;
  const up = 1 + frac;
  const progRaw = cu["Prog dezercji (% health)"];
  const progScaled = progRaw === null || progRaw === void 0 ? progRaw : round4(progRaw * (1 - frac));
  return {
    ...cu,
    meleeAttack: cu.meleeAttack * up,
    meleeDefence: cu.meleeDefence * up,
    weaponDamage: cu.weaponDamage * up,
    piercing: cu.piercing * up,
    chargeBonus: cu.chargeBonus * up,
    health: cu.health * up,
    missileAttack: cu.missileAttack * up,
    "Prog dezercji (% health)": progScaled
  };
}

// src/game/combat.ts
var TW = combat_params_default.tw_v3;
var COUNTER_MULT = combat_params_default.counter_multiplier;
function normTerrain(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036F]/g, "").toLowerCase();
}
function terrainDefenseMultiplier(defenderTerrain, attackerRola, terrainData) {
  if (!defenderTerrain || terrainData.length === 0) return 1;
  const terrNorm = normTerrain(defenderTerrain);
  const entry = terrainData.find((t) => {
    const tNorm = normTerrain(t["Teren"]);
    return tNorm.includes(terrNorm) || terrNorm.includes(tNorm.split(" ")[0] ?? "");
  });
  if (!entry) return 1;
  const bonus = entry["Bonus Obrona"];
  if (!bonus || bonus === "+0%" || bonus === "---" || bonus === "") return 1;
  const eName = normTerrain(entry["Teren"]);
  if (eName.includes("las")) {
    const aLow = normTerrain(attackerRola);
    const isRangedOrCav = aLow.includes("dystans") || aLow.includes("flanka");
    return isRangedOrCav ? 1.5 : 1;
  }
  if (eName.includes("gory")) {
    return 1.75;
  }
  if (eName.includes("wzg")) {
    return 1.5;
  }
  const match = bonus.match(/([+-]?\d+)/);
  if (match?.[1]) {
    const pct = parseFloat(match[1]);
    return 1 + pct / 100;
  }
  return 1;
}

// src/game/siege.ts
var OBL = combat_params_default["obl\u0119\u017Cenie"];
var WALL_BASE_OBRONA = OBL.wall_base_obrona;
var WALL_PER_LEVEL_OBRONA = OBL.wall_per_level_obrona;
var WALL_MAX_LEVEL = OBL.wall_max_level;
var WALL_PANCERZ_FRACTION = OBL.wall_pancerz_fraction;
var HILL_DEFENSE_MULT = OBL.hill_defense_mult;
var MOUNTAIN_DEFENSE_MULT = OBL.mountain_defense_mult;
var FORTIFY_OBRONA_BONUS = OBL.fortify_obrona_bonus;
var MILITIA_POP_FRACTION = OBL.militia_pop_fraction;
var MILITIA_STRENGTH_FRACTION = OBL.militia_strength_fraction;
var SIEGE_MAX_ROUNDS = OBL.siege_max_rounds;
var STONE_WARRIOR = {
  typNazwa: "Wojownik",
  rola: "Wrecz",
  Atak: 4,
  Obrona: 4,
  Uderzenie: 2,
  Pancerz: 2,
  Przebicie: 1,
  weaponDamage: 4,
  Health: 17,
  progDezercji: 0.4
};
function makeMilitia(population, popFraction = MILITIA_POP_FRACTION, strengthFraction = MILITIA_STRENGTH_FRACTION) {
  const count = Math.floor(Math.max(0, population) * popFraction);
  if (count <= 0) return null;
  return {
    typNazwa: "Milicja",
    rola: "Wrecz",
    Atak: Math.max(1, Math.round(STONE_WARRIOR.Atak * strengthFraction)),
    Obrona: Math.max(1, Math.round(STONE_WARRIOR.Obrona * strengthFraction)),
    Uderzenie: Math.max(0, Math.round(STONE_WARRIOR.Uderzenie * strengthFraction)),
    Pancerz: Math.max(0, Math.round(STONE_WARRIOR.Pancerz * strengthFraction)),
    Przebicie: 0,
    weaponDamage: Math.max(1, Math.round(STONE_WARRIOR.weaponDamage * strengthFraction)),
    // Pool HP: each militiaman contributes a share of the Warrior's HP, halved.
    Health: Math.max(1, Math.round(count * STONE_WARRIOR.Health * strengthFraction)),
    progDezercji: null,
    // militia defends to the last
    unbreakable: true
  };
}

// src/game/siegeDefenders.ts
function defenderUnitsNearCity(city, units) {
  return collectDefRosterNearCity(city, units).filter((u) => u.ownerId === city.ownerId);
}
function hasCityDefenders(city, units) {
  if ((city.garnizon ?? 0) > 0) return true;
  return defenderUnitsNearCity(city, units).length > 0;
}
function militiaDefRecord(m) {
  return {
    "Jednostka": "Milicja",
    meleeAttack: m.Atak,
    meleeDefence: m.Obrona,
    chargeBonus: m.Uderzenie,
    armor: m.Pancerz,
    piercing: m.Przebicie,
    health: m.Health,
    weaponDamage: Math.max(1, m.weaponDamage ?? m.Atak),
    missileAttack: 0,
    "Rola (linia)": m.rola,
    "Prog dezercji (% health)": null,
    "Zasieg ataku (hex)": null,
    "Ilosc pociskow": null,
    "Ruch w bitwie (heksy)": 0,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z tylu (%)": 80
  };
}
function collectCityDefRoster(city, units) {
  const roster = defenderUnitsNearCity(city, units);
  const militiaDefs = /* @__PURE__ */ new Map();
  if (roster.length > 0) return { roster, militiaDefs };
  if ((city.garnizon ?? 0) <= 0) return { roster: [], militiaDefs };
  const pop = city.population ?? 0;
  const militia = makeMilitia(Math.max(pop, 5));
  if (!militia) return { roster: [], militiaDefs };
  const id = "militia-" + city.id;
  militiaDefs.set(id, militiaDefRecord(militia));
  return {
    roster: [{
      id,
      ownerId: city.ownerId,
      typeId: "Milicja",
      category: "domyslny",
      q: city.q,
      r: city.r,
      ruch: 0,
      ruchLeft: 0
    }],
    militiaDefs
  };
}
function defenderSideTitle(city, defRoster) {
  if (defRoster.length === 0) return "Brak";
  const lead = defRoster[0];
  if (lead.typeId === "Milicja") {
    return "Milicja (~" + Math.floor((city.population ?? 0) * 0.2) + ")";
  }
  return defRoster.length > 1 ? "Garnizon (" + defRoster.length + ")" : lead.typeId;
}

// src/game/barbarians.ts
var BARBARIAN_OWNER_ID = -1;
function isBarbarian(ownerId) {
  return ownerId === BARBARIAN_OWNER_ID;
}

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
function sumRosterFieldM(roster) {
  let sum = 0;
  for (const u of roster) {
    if (!isFieldBattleUnit(u.typeId, u.def)) continue;
    sum += armyFieldPower(u.def);
  }
  return Math.round(sum * 10) / 10;
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
function autoBattleWinPct(mAtk, mDef) {
  const a = Math.max(0, mAtk);
  const d = Math.max(0, mDef);
  if (a <= 0 && d <= 0) return 50;
  if (a <= 0) return 0;
  if (d <= 0) return 100;
  return Math.round(a / (a + d) * 100);
}

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

// src/audio/filePlayer.ts
var import_meta = {};
var CROSSFADE_SEC = 1.5;
var STOP_FADE_SEC = 0.4;
var MONITOR_STEP_MS = 100;
var RAMP_STEP_MS = 40;
function volCurve(v) {
  return Math.pow(Math.max(0, Math.min(1, v)), 1.6);
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
function buildShuffledQueue(trackCount, avoidFirst) {
  const idx = Array.from({ length: trackCount }, (_, i) => i);
  const q = shuffle(idx);
  if (avoidFirst !== null && q.length > 1 && q[0] === avoidFirst) {
    const j = 1 + Math.floor(Math.random() * (q.length - 1));
    const tmp = q[0];
    q[0] = q[j];
    q[j] = tmp;
  }
  return q;
}
function createPlaylist(trackUrls, repeatsPerTrack, kolejnosc = "losowa") {
  const els = [null, null];
  let activeIdx = 0;
  let queue = [];
  let queuePos = 0;
  let repeatsLeft = repeatsPerTrack;
  let playing = false;
  let volume01 = 0.8;
  let monitorTimer = null;
  let stopFadeTimer = null;
  let crossfading = false;
  let crossfadeTimer = null;
  let crossfadeT0 = 0;
  let crossfadeDur = CROSSFADE_SEC;
  let crossfadeFromIdx = 0;
  let crossfadeToIdx = 1;
  function hasTracks() {
    return trackUrls.length > 0;
  }
  function currentUrl() {
    const i = queue[queuePos];
    return i === void 0 ? null : trackUrls[i] ?? null;
  }
  function selectNext() {
    repeatsLeft--;
    if (repeatsLeft > 0) return;
    queuePos++;
    repeatsLeft = repeatsPerTrack;
    if (queuePos >= queue.length) {
      const lastOfOldQueue = queue[queue.length - 1] ?? null;
      queue = kolejnosc === "stala" ? Array.from({ length: trackUrls.length }, (_, i) => i) : buildShuffledQueue(trackUrls.length, lastOfOldQueue);
      queuePos = 0;
    }
  }
  function clearMonitor() {
    if (monitorTimer !== null) {
      window.clearInterval(monitorTimer);
      monitorTimer = null;
    }
  }
  function clearCrossfadeTimer() {
    if (crossfadeTimer !== null) {
      window.clearInterval(crossfadeTimer);
      crossfadeTimer = null;
    }
  }
  function clearStopFade() {
    if (stopFadeTimer !== null) {
      window.clearInterval(stopFadeTimer);
      stopFadeTimer = null;
    }
  }
  const endedHandlers = [null, null];
  const errorHandlers = [null, null];
  const metaHandlers = [null, null];
  function ensureEl(idx) {
    let el = els[idx];
    if (el) return el;
    el = new Audio();
    el.preload = "auto";
    el.volume = 0;
    const onEndedH = () => onEnded(idx);
    const onErrorH = () => onError(idx);
    const onMetaH = () => {
      if (idx === activeIdx && playing && !crossfading) monitorTick();
    };
    el.addEventListener("ended", onEndedH);
    el.addEventListener("error", onErrorH);
    el.addEventListener("loadedmetadata", onMetaH);
    endedHandlers[idx] = onEndedH;
    errorHandlers[idx] = onErrorH;
    metaHandlers[idx] = onMetaH;
    els[idx] = el;
    return el;
  }
  function playOn(idx, url) {
    const el = ensureEl(idx);
    el.src = url;
    el.currentTime = 0;
    el.volume = volCurve(volume01);
    void el.play().catch(() => {
      playing = false;
    });
  }
  function onEnded(idx) {
    if (!playing || crossfading || idx !== activeIdx) return;
    selectNext();
    const url = currentUrl();
    if (!url) return;
    playOn(idx, url);
  }
  function onError(idx) {
    if (!playing) return;
    const isIncomingCrossfade = crossfading && idx === crossfadeToIdx;
    if (idx !== activeIdx && !isIncomingCrossfade) return;
    if (isIncomingCrossfade) {
      clearCrossfadeTimer();
      crossfading = false;
      const fromEl = els[crossfadeFromIdx];
      if (fromEl) fromEl.pause();
    }
    selectNext();
    const url = currentUrl();
    if (!url) return;
    playOn(idx, url);
  }
  function crossfadeStep() {
    const u = Math.min(1, (performance.now() - crossfadeT0) / 1e3 / crossfadeDur);
    const base = volCurve(volume01);
    const ang = u * (Math.PI / 2);
    const fromEl = els[crossfadeFromIdx];
    const toEl = els[crossfadeToIdx];
    if (fromEl) fromEl.volume = base * Math.cos(ang);
    if (toEl) toEl.volume = base * Math.sin(ang);
    if (u >= 1) {
      clearCrossfadeTimer();
      if (fromEl) fromEl.pause();
      activeIdx = crossfadeToIdx;
      crossfading = false;
    }
  }
  function beginCrossfade(fadeDur) {
    if (!playing || crossfading) return;
    selectNext();
    const url = currentUrl();
    if (!url) return;
    const fromIdx = activeIdx;
    const toIdx = fromIdx === 0 ? 1 : 0;
    playOn(toIdx, url);
    const toEl = els[toIdx];
    if (toEl) toEl.volume = 0;
    crossfading = true;
    crossfadeFromIdx = fromIdx;
    crossfadeToIdx = toIdx;
    crossfadeDur = Math.max(0.05, fadeDur);
    crossfadeT0 = performance.now();
    clearCrossfadeTimer();
    crossfadeTimer = window.setInterval(crossfadeStep, RAMP_STEP_MS);
  }
  function monitorTick() {
    if (!playing || crossfading) return;
    const el = els[activeIdx];
    if (!el) return;
    const dur = el.duration;
    if (!Number.isFinite(dur) || dur <= 0) return;
    const fadeDur = Math.min(CROSSFADE_SEC, dur * 0.4);
    const remain = dur - el.currentTime;
    if (remain <= fadeDur) beginCrossfade(fadeDur);
  }
  function start() {
    if (!hasTracks() || playing) return;
    clearStopFade();
    playing = true;
    if (queue.length === 0) {
      queue = kolejnosc === "stala" ? Array.from({ length: trackUrls.length }, (_, i) => i) : buildShuffledQueue(trackUrls.length, null);
      queuePos = 0;
      repeatsLeft = repeatsPerTrack;
    }
    activeIdx = 0;
    const url = currentUrl();
    if (url) playOn(0, url);
    clearMonitor();
    monitorTimer = window.setInterval(monitorTick, MONITOR_STEP_MS);
  }
  function stop() {
    playing = false;
    clearMonitor();
    clearCrossfadeTimer();
    crossfading = false;
    clearStopFade();
    const a = els[0];
    const b = els[1];
    if (!a && !b) return;
    const startVolA = a ? a.volume : 0;
    const startVolB = b ? b.volume : 0;
    const t0 = performance.now();
    stopFadeTimer = window.setInterval(() => {
      const u = Math.min(1, (performance.now() - t0) / 1e3 / STOP_FADE_SEC);
      const k = 1 - u;
      if (a) a.volume = startVolA * k;
      if (b) b.volume = startVolB * k;
      if (u >= 1) {
        clearStopFade();
        releaseEl(0);
        releaseEl(1);
      }
    }, RAMP_STEP_MS);
  }
  function releaseEl(idx) {
    const el = els[idx];
    if (!el) return;
    el.pause();
    const eh = endedHandlers[idx], erh = errorHandlers[idx], mh = metaHandlers[idx];
    if (eh) el.removeEventListener("ended", eh);
    if (erh) el.removeEventListener("error", erh);
    if (mh) el.removeEventListener("loadedmetadata", mh);
    el.removeAttribute("src");
    el.load();
    els[idx] = null;
    endedHandlers[idx] = null;
    errorHandlers[idx] = null;
    metaHandlers[idx] = null;
  }
  function setVolume(v) {
    volume01 = Math.max(0, Math.min(1, v));
    if (!crossfading) {
      const el = els[activeIdx];
      if (el) el.volume = volCurve(volume01);
    }
  }
  function isPlaying() {
    return playing;
  }
  return { hasTracks, start, stop, setVolume, isPlaying };
}
var kamienModules = import_meta.glob("./utwory/kamien/*.mp3", {
  eager: true,
  import: "default"
});
var KAMIEN_URLS = Object.keys(kamienModules).sort().map((k) => kamienModules[k]);
var introModules = import_meta.glob("./utwory/intro/*.mp3", {
  eager: true,
  import: "default"
});
var INTRO_KOLEJNOSC = [
  "Prayer_of_the_Sun_Stone",
  "Dawn_of_the_Architect",
  "Seven_Hills_Rising",
  "Ascent_to_Zenith"
];
var INTRO_URLS = INTRO_KOLEJNOSC.map((nazwa) => Object.keys(introModules).find((k) => k.includes(nazwa))).filter((k) => Boolean(k)).map((k) => introModules[k]);
var dyplomacjaModules = import_meta.glob("./utwory/dyplomacja/*.mp3", {
  eager: true,
  import: "default"
});
var DYPLOMACJA_URLS = Object.keys(dyplomacjaModules).sort().map((k) => dyplomacjaModules[k]);
var preBattleModules = import_meta.glob("./utwory/prebattle/*.mp3", {
  eager: true,
  import: "default"
});
var PREBATTLE_URLS = Object.keys(preBattleModules).sort().map((k) => preBattleModules[k]);
var bitwaModules = import_meta.glob("./utwory/bitwa/*.mp3", {
  eager: true,
  import: "default"
});
var BITWA_URLS = Object.keys(bitwaModules).sort().map((k) => bitwaModules[k]);
var zwyciestwoModules = import_meta.glob("./utwory/zwyciestwo/*.mp3", {
  eager: true,
  import: "default"
});
var ZWYCIESTWO_URLS = Object.keys(zwyciestwoModules).sort().map((k) => zwyciestwoModules[k]);
var porazkaModules = import_meta.glob("./utwory/porazka/*.mp3", {
  eager: true,
  import: "default"
});
var PORAZKA_URLS = Object.keys(porazkaModules).sort().map((k) => porazkaModules[k]);
var kamienPlaylist = createPlaylist(KAMIEN_URLS, 3);
var introPlaylist = createPlaylist(INTRO_URLS, 1, "stala");
var dyplomacjaPlaylist = createPlaylist(DYPLOMACJA_URLS, 1, "stala");
var preBattlePlaylist = createPlaylist(PREBATTLE_URLS, 1, "stala");
var bitwaPlaylist = createPlaylist(BITWA_URLS, 1, "stala");
var zwyciestwoPlaylist = createPlaylist(ZWYCIESTWO_URLS, 1, "stala");
var porazkaPlaylist = createPlaylist(PORAZKA_URLS, 1, "stala");

// src/battle/mapFieldBattle.ts
function preBattleUnitFromRuntime(u, unitDefFor, unitHealth, unitAtak) {
  const def = unitDefFor(u);
  const hp = unitHealth(def);
  return {
    nazwa: u.typeId,
    kategoria: u.category,
    hp,
    maxHp: hp,
    atak: unitAtak(def),
    moc: armyFieldPower(def)
  };
}
function preBattleSideFromRoster(roster, title, civLabel, unitDefFor, unitHealth, unitAtak, civIdForOwner, eraForOwnerId, isCityStateForOwner) {
  const ownerId = roster[0]?.ownerId;
  return {
    nazwa: title,
    cywilizacja: civLabel,
    ownerId,
    civId: ownerId !== void 0 ? civIdForOwner?.(ownerId) : void 0,
    era: ownerId !== void 0 ? eraForOwnerId?.(ownerId) : void 0,
    isCityState: ownerId !== void 0 ? isCityStateForOwner?.(ownerId) : void 0,
    // TEMAT 11 (2026-07-24): isBarbarian(ownerId) jest czysta funkcja (game/barbarians.ts) --
    // nie wymaga osobnego callbacku deps jak isCityStateForOwner (kontekst klastra/miast).
    isBarbarian: ownerId !== void 0 ? isBarbarian(ownerId) : void 0,
    units: roster.map((u) => preBattleUnitFromRuntime(u, unitDefFor, unitHealth, unitAtak))
  };
}
function veteranScaledDef(u, unitDefFor) {
  const def = unitDefFor(u);
  const frac = veteranCombatBonusFrac(u);
  if (!frac) return def;
  return applyVeteranFracToCombatUnit(def, frac);
}
function rosterFieldPowerM(roster, unitDefFor) {
  return sumRosterFieldM(roster.map((u) => ({ typeId: u.typeId, def: veteranScaledDef(u, unitDefFor) })));
}
function effectiveDefenderM(defRoster, terrain, structBonusPct, atkLeadDef, unitDefFor, terrainCombatData) {
  const split = sumRosterFieldMSplit(
    defRoster.map((u) => ({ typeId: u.typeId, def: veteranScaledDef(u, unitDefFor) }))
  );
  const terrMult = terrainDefenseMultiplier(
    terrain,
    String(atkLeadDef["Rola (linia)"] ?? ""),
    terrainCombatData
  );
  const structMult = 1 + structBonusPct / 100;
  const terrAdjAttack = split.attack * terrMult;
  const terrAdjDefense = split.defense * terrMult * structMult;
  return Math.round((terrAdjAttack + terrAdjDefense) * 10) / 10;
}
function preBattleSzanseAtkPct(atkRoster, defRoster, terrain, structBonusPct, unitDefFor, terrainCombatData) {
  const aLeadDef = unitDefFor(atkRoster[0]);
  const mAtk = rosterFieldPowerM(atkRoster, unitDefFor);
  const mDef = effectiveDefenderM(defRoster, terrain, structBonusPct, aLeadDef, unitDefFor, terrainCombatData);
  return autoBattleWinPct(mAtk, mDef);
}
function validateOpenCityFieldBattle(city, anchor) {
  if (!city || !anchor) return "Bitwa: brak miasta lub jednostki atakujacej na mapie.";
  if (city.maMur) return "Miasto z murem \u2014 uzyj Oblezaj/Szturm, nie potyczki polowej.";
  return null;
}
function planOpenCityFieldBattle(action, city, anchor, units, deps) {
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
  const atkLead = atkRoster[0];
  const defLead = defRoster[0];
  const szanse = preBattleSzanseAtkPct(
    atkRoster,
    defRoster,
    terrain,
    structBonusPct,
    deps.unitDefFor,
    deps.terrainCombatData
  );
  const atkTitle = atkRoster.length > 1 ? "Sklad (" + atkRoster.length + ")" : anchor.typeId;
  const defTitle = defenderSideTitle(city, defRoster);
  const preBattle = {
    atakujacy: preBattleSideFromRoster(
      atkRoster,
      atkTitle,
      deps.civLabelForOwner(anchor.ownerId),
      deps.unitDefFor,
      deps.unitHealth,
      deps.unitAtak,
      deps.civIdForOwner,
      deps.eraForOwnerId,
      deps.isCityStateForOwner
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
      deps.isCityStateForOwner
    ),
    teren: terrain,
    szanseAtkPct: szanse,
    miejsce: city.name,
    lokacja: "(" + city.q + "," + city.r + ")",
    tura: deps.turn,
    canRetreat: true
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
    battleHex: { q: city.q, r: city.r }
  };
}

// src/game/mapSiegeDetect.ts
function isAdjacentToHex(q, r, tq, tr) {
  return hexDistance(q, r, tq, tr) === 1;
}
function classifyCityAttack(atakujacy, city, units) {
  const garnizonUnit = units.find(
    (u) => u.ownerId === city.ownerId && u.q === city.q && u.r === city.r
  ) ?? null;
  let tryb;
  if (city.maMur) {
    tryb = "oblezenie";
  } else if (garnizonUnit) {
    tryb = "zdobycie_z_marszu";
  } else {
    tryb = "bitwa_polowa";
  }
  return {
    tryb,
    city,
    atakujacy,
    garnizonUnit,
    oblegajacyOwnerId: atakujacy.ownerId
  };
}
function canInitiateSiege(atakujacy, city) {
  if (atakujacy.ownerId === city.ownerId) return false;
  if (!city.maMur) return false;
  return isAdjacentToHex(atakujacy.q, atakujacy.r, city.q, city.r);
}

// src/map/map-attack-city.ts
function adjacentPlayerAttackers(city, units, playerOwnerId) {
  return units.filter(
    (u) => u.ownerId === playerOwnerId && u.ruchLeft > 0 && !isCivilianUnit(u) && // TEMAT #15: BRAK ataku z wody — jednostka zaokrętowana nie atakuje miast.
    u.embarked !== true && hexDistance(u.q, u.r, city.q, city.r) === 1
  );
}
function resolveAttacker(adjacent, selectedUnit, playerOwnerId) {
  if (adjacent.length === 0) return "none";
  if (selectedUnit && selectedUnit.ownerId === playerOwnerId) {
    if (adjacent.some((u) => u.id === selectedUnit.id)) return selectedUnit;
    return "none";
  }
  if (adjacent.length === 1) return adjacent[0];
  return "pick";
}
function resolveEnemyCityClick(input) {
  const { city, selectedUnit, units, playerOwnerId = 0 } = input;
  if (city.ownerId === playerOwnerId) {
    return { kind: "not_enemy" };
  }
  if (city.oblegane) {
    const besieger = units.find(
      (u) => u.ownerId !== city.ownerId && hexDistance(u.q, u.r, city.q, city.r) === 1
    );
    if (besieger) {
      return {
        kind: "siege_panel",
        attacker: besieger,
        ctx: classifyCityAttack(besieger, city, units)
      };
    }
  }
  if (selectedUnit && selectedUnit.ownerId === playerOwnerId && isCivilianUnit(selectedUnit) && hexDistance(selectedUnit.q, selectedUnit.r, city.q, city.r) === 1) {
    return { kind: "hint_civilian", cityName: city.name };
  }
  const adjacent = adjacentPlayerAttackers(city, units, playerOwnerId);
  const attackerPick = resolveAttacker(adjacent, selectedUnit, playerOwnerId);
  if (attackerPick === "none") {
    return { kind: "hint_no_adjacent", cityName: city.name };
  }
  if (attackerPick === "pick") {
    return {
      kind: "hint_pick_attacker",
      cityName: city.name,
      adjacentCount: adjacent.length
    };
  }
  const attacker = attackerPick;
  const ctx = classifyCityAttack(attacker, city, units);
  if (ctx.tryb === "oblezenie" && canInitiateSiege(attacker, city)) {
    return { kind: "attack_choice", attacker, ctx };
  }
  if (!hasCityDefenders(city, units)) {
    return { kind: "capture_empty", attacker, ctx };
  }
  return { kind: "field_battle", attacker, ctx };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  collectAtkRosterNearCity,
  collectBattleRoster,
  collectCityDefRoster,
  defenderSideTitle,
  hasCityDefenders,
  planOpenCityFieldBattle,
  resolveEnemyCityClick,
  shouldIncludeInBattleRoster,
  validateOpenCityFieldBattle
});
