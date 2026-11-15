//! R-RUSTPORT-P4-1E-CITY-VIEW-Q1: producent widoku miast (`domain::city_view`) wobec webu na pinie `07d2fbd72`.
//!
//! Wartosci oczekiwane NIE sa pisane recznie: blok `PIN_VECTORS` generuje
//! `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/gen_city_view_vectors.py`, ktory kompiluje
//! kod pinu (`render/cities.ts` `_isCapitalCity` / `_cityMapLabel` / `_buildBadgeInput`, `game/display-names.ts`,
//! `game/production.ts`, `game/building-stock-cost.ts`, `game/city-fortification.ts`, `game/civ-visual.ts`,
//! `render/bronzeCity.ts`, `game/capital-capture.ts`, `game/diplomacy-treaties.ts`, `game/barbarians.ts`,
//! `data/civs.json`) i uruchamia go w node na wejsciach `scenarios.json`. Klej `main.ts` (`_cityRenderOpts`)
//! jest w harnessie przepisany z numerami linii (`gen/harness.cjs`). Sprawdzenie zgodnosci bloku z pinem:
//! `python3 -I …/gen_city_view_vectors.py --check`.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::building_costs::p6_7b::StockRecord;
use civ_engine::domain::city_view::{
    city_views, owner_views, CityGrowthLive, CityStateFacts, CityViewCityFacts, CityViewError,
    CityViewInputs,
};
use civ_engine::domain::diplomacy::{
    ActiveDeal, CivilizationPair, Relation, RelationStatus, TreatyKind,
};
use civ_engine::domain::playable::PlayableReplaceEconomy;
use civ_engine::domain::production_units::{CityProduction, ProductionItem, ProductionKind};
use civ_engine::{
    CityId, PlayableCity, PlayableGame, PlayablePlayer, PlayableState, PlayableUnit,
    PlayableUnitKind, PlayerId, PositionDto, StartGameParams, UnitId,
};
use civ_view_model::{CityViewDto, OwnerViewDto};
use serde_json::Value;

// BEGIN GENERATED (gen_city_view_vectors.py) -- nie edytowac recznie
const PIN_VECTORS: &str = r##"{
 "pin": "07d2fbd72",
 "stubbedModules": [
  "three"
 ],
 "scenarios": [
  {
   "input": {
    "name": "start_jedno_miasto_bez_kolejki",
    "epochId": "kamien",
    "viewer": 0,
    "fogActive": true,
    "visibleHexes": [],
    "players": [
     {
      "id": 0,
      "civilization": "rzymianie",
      "isHuman": true
     }
    ],
    "cities": [
     {
      "id": 1,
      "ownerId": 0,
      "name": "Roma",
      "q": 1,
      "r": 1,
      "isCapital": true,
      "population": 1,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     }
    ],
    "units": [],
    "relations": [],
    "deals": [],
    "simplifiedOwners": [],
    "typCopyOwners": [],
    "clusterCapitalOwnerIds": [],
    "itemStockCost": {}
   },
   "expected": {
    "owners": [
     {
      "ownerId": 0,
      "color": 9116186,
      "civIconId": "rzymianie",
      "bronzeCiv": "rzym",
      "era": 1,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#8b1a1a",
      "displayName": "Rzymianie",
      "mapOutlineKind": "player",
      "capitalCityId": 1,
      "relationToViewer": "self"
     }
    ],
    "cities": [
     {
      "id": 1,
      "ownerId": 0,
      "hex": {
       "q": 1,
       "r": 1
      },
      "population": 1,
      "level": 1,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Roma",
       "population": 1,
       "defenseTier": 0,
       "civIconId": "rzymianie",
       "ownerColor": 9116186,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": false,
       "era": 1,
       "isCapital": true
      }
     }
    ]
   }
  },
  {
   "input": {
    "name": "wielu_wlascicieli_mgla",
    "epochId": "kamien",
    "viewer": 0,
    "fogActive": true,
    "visibleHexes": [
     [
      6,
      2
     ],
     [
      9,
      4
     ],
     [
      3,
      7
     ],
     [
      12,
      9
     ]
    ],
    "players": [
     {
      "id": 0,
      "civilization": "rzymianie",
      "isHuman": true
     },
     {
      "id": 1,
      "civilization": "grecy",
      "isHuman": false
     },
     {
      "id": 2,
      "civilization": "egipt",
      "isHuman": false
     },
     {
      "id": 3,
      "civilization": "celtowie",
      "isHuman": false
     },
     {
      "id": 4,
      "civilization": "player-4",
      "isHuman": false
     },
     {
      "id": 5,
      "civilization": "germanie",
      "isHuman": false
     },
     {
      "id": 9,
      "civilization": "slowianie",
      "isHuman": false
     },
     {
      "id": 7,
      "civilization": "hetyci",
      "isHuman": false
     }
    ],
    "cities": [
     {
      "id": 1,
      "ownerId": 0,
      "name": "Roma",
      "q": 1,
      "r": 1,
      "isCapital": true,
      "population": 5,
      "built": [
       "palisada",
       "koszary"
      ],
      "surowce": {
       "drewno": 2,
       "kamien": 1
      },
      "production": {
       "kolejka": [
        {
         "kind": "budynek",
         "id": "spichlerz",
         "nazwa": "Spichlerz",
         "koszt": 40
        }
       ],
       "postep": 3
      },
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": true,
      "growth": {
       "procentNaTure": 12.5,
       "nakarmione": true
      }
     },
     {
      "id": 3,
      "ownerId": 0,
      "name": "Antium",
      "q": 2,
      "r": 3,
      "isCapital": false,
      "population": 12,
      "built": [
       "mury"
      ],
      "surowce": {
       "drewno": 2
      },
      "production": {
       "kolejka": [
        {
         "kind": "jednostka",
         "id": "Wojownik",
         "nazwa": "Wojownik",
         "koszt": 20
        }
       ],
       "postep": 0,
       "wstrzymana": true
      },
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": {
       "procentNaTure": -3,
       "nakarmione": false
      }
     },
     {
      "id": 2,
      "ownerId": 1,
      "name": "Ateny",
      "q": 6,
      "r": 2,
      "isCapital": true,
      "population": 3,
      "built": [
       "fort"
      ],
      "surowce": {
       "miedz": 4
      },
      "production": {
       "kolejka": [],
       "postep": 0,
       "wstrzymana": true
      },
      "orderBunt": true,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": {
       "procentNaTure": 7,
       "nakarmione": true
      }
     },
     {
      "id": 7,
      "ownerId": 2,
      "name": "Teby",
      "q": 9,
      "r": 4,
      "isCapital": false,
      "population": 4,
      "built": [
       "mury_kamienne",
       "palisada"
      ],
      "surowce": {
       "miedz": 3
      },
      "production": {
       "kolejka": [
        {
         "kind": "jednostka",
         "id": "Lucznik",
         "nazwa": "Łucznik",
         "koszt": 30
        },
        {
         "kind": "budynek",
         "id": "koszary",
         "nazwa": "Koszary",
         "koszt": 50
        }
       ],
       "postep": 5
      },
      "orderBunt": false,
      "orderRevoltWarning": true,
      "oblegane": false,
      "growth": null
     },
     {
      "id": 5,
      "ownerId": 2,
      "name": "Memfis",
      "q": 10,
      "r": 6,
      "isCapital": false,
      "population": 2,
      "built": [],
      "surowce": null,
      "production": {
       "kolejka": [
        {
         "kind": "budynek",
         "id": "spichlerz",
         "nazwa": "Spichlerz",
         "koszt": 40
        }
       ],
       "postep": 0
      },
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     },
     {
      "id": 8,
      "ownerId": 3,
      "name": "Alezja",
      "q": 3,
      "r": 7,
      "isCapital": true,
      "population": 2,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     },
     {
      "id": 11,
      "ownerId": 4,
      "name": "Nowe Miasto",
      "q": 12,
      "r": 9,
      "isCapital": true,
      "population": 0,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     },
     {
      "id": 12,
      "ownerId": 5,
      "name": "Sparta",
      "q": 14,
      "r": 1,
      "isCapital": true,
      "population": 2,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null,
      "startCityState": true
     },
     {
      "id": 13,
      "ownerId": 9,
      "name": "Kijow",
      "q": 15,
      "r": 5,
      "isCapital": true,
      "population": 3,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null,
      "startCityState": false
     },
     {
      "id": 16,
      "ownerId": 7,
      "name": "Hattusa",
      "q": 16,
      "r": 8,
      "isCapital": true,
      "population": 2,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     }
    ],
    "units": [
     {
      "ownerId": 0,
      "q": 2,
      "r": 3
     },
     {
      "ownerId": 0,
      "q": 2,
      "r": 3
     },
     {
      "ownerId": 1,
      "q": 6,
      "r": 2
     },
     {
      "ownerId": 0,
      "q": 4,
      "r": 4
     }
    ],
    "relations": [
     {
      "a": 0,
      "b": 1,
      "status": "wojna"
     },
     {
      "a": 2,
      "b": 0,
      "status": "pokoj"
     },
     {
      "a": 0,
      "b": 4,
      "status": "sojusz"
     },
     {
      "a": 0,
      "b": 9,
      "status": "pokoj"
     }
    ],
    "deals": [
     {
      "rodzaj": "sojusz_defensywny",
      "strony": [
       3,
       0
      ]
     },
     {
      "rodzaj": "pakt_nieagresji",
      "strony": [
       0,
       5
      ]
     },
     {
      "rodzaj": "sojusz_wojskowy",
      "strony": [
       9,
       0
      ]
     }
    ],
    "simplifiedOwners": [
     7
    ],
    "typCopyOwners": [],
    "clusterCapitalOwnerIds": [],
    "itemStockCost": {
     "budynek:spichlerz": {
      "drewno": 5
     },
     "jednostka:Lucznik": {
      "miedz": 2
     },
     "jednostka:Wojownik": {}
    }
   },
   "expected": {
    "owners": [
     {
      "ownerId": 0,
      "color": 9116186,
      "civIconId": "rzymianie",
      "bronzeCiv": "rzym",
      "era": 1,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#8b1a1a",
      "displayName": "Rzymianie",
      "mapOutlineKind": "player",
      "capitalCityId": 1,
      "relationToViewer": "self"
     },
     {
      "ownerId": 1,
      "color": 1989288,
      "civIconId": "grecy",
      "bronzeCiv": "grecja",
      "era": 1,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#1e5aa8",
      "displayName": "Grecy",
      "mapOutlineKind": "war",
      "capitalCityId": 2,
      "relationToViewer": "wojna"
     },
     {
      "ownerId": 2,
      "color": 15254855,
      "civIconId": "egipt",
      "bronzeCiv": "egipt",
      "era": 1,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#e8c547",
      "displayName": "Egipt",
      "mapOutlineKind": "neutral",
      "capitalCityId": 5,
      "relationToViewer": "pokoj"
     },
     {
      "ownerId": 3,
      "color": 4025141,
      "civIconId": "celtowie",
      "bronzeCiv": "celtowie",
      "era": 1,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#3d6b35",
      "displayName": "Celtowie",
      "mapOutlineKind": "ally",
      "capitalCityId": 8,
      "relationToViewer": "neutralni"
     },
     {
      "ownerId": 4,
      "color": 16485376,
      "civIconId": "player-4",
      "bronzeCiv": "grecja",
      "era": 1,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#fb8c00",
      "displayName": null,
      "mapOutlineKind": "ally",
      "capitalCityId": 11,
      "relationToViewer": "sojusz"
     },
     {
      "ownerId": 5,
      "color": 4871528,
      "civIconId": "germanie",
      "bronzeCiv": "germanie",
      "era": 1,
      "isCityState": true,
      "isBarbarian": false,
      "ringHex": null,
      "displayName": "Germanie",
      "mapOutlineKind": "neutral",
      "capitalCityId": 12,
      "relationToViewer": "neutralni"
     },
     {
      "ownerId": 7,
      "color": 8080266,
      "civIconId": "hetyci",
      "bronzeCiv": "hetyci",
      "era": 1,
      "isCityState": true,
      "isBarbarian": false,
      "ringHex": null,
      "displayName": "Hetyci",
      "mapOutlineKind": "neutral",
      "capitalCityId": 16,
      "relationToViewer": "neutralni"
     },
     {
      "ownerId": 9,
      "color": 12071474,
      "civIconId": "slowianie",
      "bronzeCiv": "germanie",
      "era": 1,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#b83232",
      "displayName": "Słowianie",
      "mapOutlineKind": "ally",
      "capitalCityId": 13,
      "relationToViewer": "pokoj"
     }
    ],
    "cities": [
     {
      "id": 1,
      "ownerId": 0,
      "hex": {
       "q": 1,
       "r": 1
      },
      "population": 5,
      "level": 5,
      "wallKind": "palisada",
      "revolt": false,
      "besieged": true,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Roma",
       "population": 5,
       "defenseTier": 1,
       "civIconId": "rzymianie",
       "ownerColor": 9116186,
       "prodActive": true,
       "prodKind": "budynek",
       "prodId": "spichlerz",
       "growthPercent": 12.5,
       "growthStarving": false,
       "resourceWarning": true,
       "prodCategoryLabel": "Budynek",
       "prodItemName": "Spichlerz",
       "prodPaused": false,
       "isCityState": false,
       "era": 1,
       "isCapital": true
      }
     },
     {
      "id": 3,
      "ownerId": 0,
      "hex": {
       "q": 2,
       "r": 3
      },
      "population": 12,
      "level": 10,
      "wallKind": "stone",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 2,
      "badge": {
       "cityName": "Antium",
       "population": 12,
       "defenseTier": 2,
       "civIconId": "rzymianie",
       "ownerColor": 9116186,
       "prodActive": false,
       "prodKind": "jednostka",
       "prodId": "Wojownik",
       "growthPercent": -3,
       "growthStarving": true,
       "resourceWarning": false,
       "prodCategoryLabel": "Jednostka",
       "prodItemName": "Wojownik",
       "prodPaused": true,
       "isCityState": false,
       "era": 1,
       "isCapital": false
      }
     },
     {
      "id": 2,
      "ownerId": 1,
      "hex": {
       "q": 6,
       "r": 2
      },
      "population": 3,
      "level": 3,
      "wallKind": "stone",
      "revolt": true,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 1,
      "badge": {
       "cityName": "Ateny",
       "population": 3,
       "defenseTier": 2,
       "civIconId": "grecy",
       "ownerColor": 1989288,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": true,
       "isCityState": false,
       "era": 1,
       "isCapital": true
      }
     },
     {
      "id": 7,
      "ownerId": 2,
      "hex": {
       "q": 9,
       "r": 4
      },
      "population": 4,
      "level": 4,
      "wallKind": "stone",
      "revolt": true,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Teby",
       "population": 4,
       "defenseTier": 2,
       "civIconId": "egipt",
       "ownerColor": 15254855,
       "prodActive": true,
       "prodKind": "jednostka",
       "prodId": "Lucznik",
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": "Jednostka",
       "prodItemName": "Łucznik",
       "prodPaused": false,
       "isCityState": false,
       "era": 1,
       "isCapital": false
      }
     },
     {
      "id": 5,
      "ownerId": 2,
      "hex": {
       "q": 10,
       "r": 6
      },
      "population": 2,
      "level": 2,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": false,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Memfis",
       "population": 2,
       "defenseTier": 0,
       "civIconId": "egipt",
       "ownerColor": 15254855,
       "prodActive": true,
       "prodKind": "budynek",
       "prodId": "spichlerz",
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": true,
       "prodCategoryLabel": "Budynek",
       "prodItemName": "Spichlerz",
       "prodPaused": false,
       "isCityState": false,
       "era": 1,
       "isCapital": true
      }
     },
     {
      "id": 8,
      "ownerId": 3,
      "hex": {
       "q": 3,
       "r": 7
      },
      "population": 2,
      "level": 2,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Alezja",
       "population": 2,
       "defenseTier": 0,
       "civIconId": "celtowie",
       "ownerColor": 4025141,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": false,
       "era": 1,
       "isCapital": true
      }
     },
     {
      "id": 11,
      "ownerId": 4,
      "hex": {
       "q": 12,
       "r": 9
      },
      "population": 0,
      "level": 1,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Nowe Miasto",
       "population": 0,
       "defenseTier": 0,
       "civIconId": "player-4",
       "ownerColor": 16485376,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": false,
       "era": 1,
       "isCapital": true
      }
     },
     {
      "id": 12,
      "ownerId": 5,
      "hex": {
       "q": 14,
       "r": 1
      },
      "population": 2,
      "level": 2,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": false,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Sparta · miasto-państwo",
       "population": 2,
       "defenseTier": 0,
       "civIconId": "germanie",
       "ownerColor": 4871528,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": true,
       "era": 1,
       "isCapital": false
      }
     },
     {
      "id": 13,
      "ownerId": 9,
      "hex": {
       "q": 15,
       "r": 5
      },
      "population": 3,
      "level": 3,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": false,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Kijow",
       "population": 3,
       "defenseTier": 0,
       "civIconId": "slowianie",
       "ownerColor": 12071474,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": false,
       "era": 1,
       "isCapital": true
      }
     },
     {
      "id": 16,
      "ownerId": 7,
      "hex": {
       "q": 16,
       "r": 8
      },
      "population": 2,
      "level": 2,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": false,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Hattusa",
       "population": 2,
       "defenseTier": 0,
       "civIconId": "hetyci",
       "ownerColor": 8080266,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": true,
       "era": 1,
       "isCapital": false
      }
     }
    ]
   }
  },
  {
   "input": {
    "name": "hotseat_drugi_fotel_bez_mgly_braz",
    "epochId": "braz",
    "viewer": 1,
    "fogActive": false,
    "visibleHexes": [],
    "players": [
     {
      "id": 0,
      "civilization": "rzymianie",
      "isHuman": true
     },
     {
      "id": 1,
      "civilization": "grecy",
      "isHuman": true
     },
     {
      "id": 2,
      "civilization": "grecy",
      "isHuman": false
     },
     {
      "id": 3,
      "civilization": "grecy",
      "isHuman": false
     },
     {
      "id": 6,
      "civilization": "zulusi",
      "isHuman": false
     }
    ],
    "cities": [
     {
      "id": 1,
      "ownerId": 0,
      "name": "Roma",
      "q": 1,
      "r": 1,
      "isCapital": true,
      "population": 6,
      "built": [
       "palisada"
      ],
      "surowce": {
       "zelazo": 1
      },
      "production": {
       "kolejka": [
        {
         "kind": "budynek",
         "id": "koszary",
         "nazwa": "Koszary",
         "koszt": 50
        }
       ],
       "postep": 1
      },
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": {
       "procentNaTure": 4,
       "nakarmione": true
      }
     },
     {
      "id": 15,
      "ownerId": 0,
      "name": "Neapol",
      "q": 2,
      "r": 2,
      "isCapital": false,
      "population": 2,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null,
      "startCityState": true
     },
     {
      "id": 4,
      "ownerId": 1,
      "name": "Ateny",
      "q": 5,
      "r": 5,
      "isCapital": true,
      "population": 7,
      "built": [
       "palisada",
       "fort"
      ],
      "surowce": {
       "zelazo": 1
      },
      "production": {
       "kolejka": [
        {
         "kind": "budynek",
         "id": "koszary",
         "nazwa": "Koszary",
         "koszt": 50
        }
       ],
       "postep": 0
      },
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": true,
      "growth": {
       "procentNaTure": 0,
       "nakarmione": true
      }
     },
     {
      "id": 6,
      "ownerId": 1,
      "name": "Korynt",
      "q": 7,
      "r": 5,
      "isCapital": false,
      "population": 1,
      "built": [],
      "surowce": {
       "zelazo": 2
      },
      "production": {
       "kolejka": [
        {
         "kind": "budynek",
         "id": "koszary",
         "nazwa": "Koszary",
         "koszt": 50
        }
       ],
       "postep": 0
      },
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     },
     {
      "id": 9,
      "ownerId": 2,
      "name": "Teby",
      "q": 9,
      "r": 9,
      "isCapital": true,
      "population": 2,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     },
     {
      "id": 10,
      "ownerId": 3,
      "name": "Argos",
      "q": 11,
      "r": 9,
      "isCapital": true,
      "population": 2,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     },
     {
      "id": 14,
      "ownerId": 6,
      "name": "Ulundi",
      "q": 13,
      "r": 2,
      "isCapital": true,
      "population": 3,
      "built": [],
      "surowce": null,
      "production": null,
      "orderBunt": false,
      "orderRevoltWarning": false,
      "oblegane": false,
      "growth": null
     }
    ],
    "units": [
     {
      "ownerId": 1,
      "q": 5,
      "r": 5
     }
    ],
    "relations": [
     {
      "a": 1,
      "b": 0,
      "status": "sojusz"
     },
     {
      "a": 1,
      "b": 6,
      "status": "wojna"
     }
    ],
    "deals": [
     {
      "rodzaj": "sojusz_pelny",
      "strony": [
       1,
       2
      ]
     }
    ],
    "simplifiedOwners": [],
    "typCopyOwners": [
     6
    ],
    "clusterCapitalOwnerIds": [
     3
    ],
    "itemStockCost": {
     "budynek:koszary": {
      "zelazo": 3
     }
    }
   },
   "expected": {
    "owners": [
     {
      "ownerId": 0,
      "color": 9116186,
      "civIconId": "rzymianie",
      "bronzeCiv": "rzym",
      "era": 2,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#8b1a1a",
      "displayName": "Rzymianie",
      "mapOutlineKind": "ally",
      "capitalCityId": 1,
      "relationToViewer": "sojusz"
     },
     {
      "ownerId": 1,
      "color": 1989288,
      "civIconId": "grecy",
      "bronzeCiv": "grecja",
      "era": 2,
      "isCityState": true,
      "isBarbarian": false,
      "ringHex": null,
      "displayName": "Grecy",
      "mapOutlineKind": "player",
      "capitalCityId": 4,
      "relationToViewer": "self"
     },
     {
      "ownerId": 2,
      "color": 1989288,
      "civIconId": "grecy",
      "bronzeCiv": "grecja",
      "era": 2,
      "isCityState": true,
      "isBarbarian": false,
      "ringHex": null,
      "displayName": "Grecy",
      "mapOutlineKind": "ally",
      "capitalCityId": 9,
      "relationToViewer": "neutralni"
     },
     {
      "ownerId": 3,
      "color": 1989288,
      "civIconId": "grecy",
      "bronzeCiv": "grecja",
      "era": 2,
      "isCityState": false,
      "isBarbarian": false,
      "ringHex": "#1e5aa8",
      "displayName": "Grecy",
      "mapOutlineKind": "neutral",
      "capitalCityId": 10,
      "relationToViewer": "neutralni"
     },
     {
      "ownerId": 6,
      "color": 13166648,
      "civIconId": "zulusi",
      "bronzeCiv": "zulu",
      "era": 2,
      "isCityState": true,
      "isBarbarian": false,
      "ringHex": null,
      "displayName": "Zulusi",
      "mapOutlineKind": "war",
      "capitalCityId": 14,
      "relationToViewer": "wojna"
     }
    ],
    "cities": [
     {
      "id": 1,
      "ownerId": 0,
      "hex": {
       "q": 1,
       "r": 1
      },
      "population": 6,
      "level": 6,
      "wallKind": "palisada",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Roma",
       "population": 6,
       "defenseTier": 1,
       "civIconId": "rzymianie",
       "ownerColor": 9116186,
       "prodActive": true,
       "prodKind": "budynek",
       "prodId": "koszary",
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": true,
       "prodCategoryLabel": "Budynek",
       "prodItemName": "Koszary",
       "prodPaused": false,
       "isCityState": false,
       "era": 2,
       "isCapital": true
      }
     },
     {
      "id": 15,
      "ownerId": 0,
      "hex": {
       "q": 2,
       "r": 2
      },
      "population": 2,
      "level": 2,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Neapol · miasto-państwo",
       "population": 2,
       "defenseTier": 0,
       "civIconId": "rzymianie",
       "ownerColor": 9116186,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": false,
       "era": 2,
       "isCapital": false
      }
     },
     {
      "id": 4,
      "ownerId": 1,
      "hex": {
       "q": 5,
       "r": 5
      },
      "population": 7,
      "level": 7,
      "wallKind": "stone",
      "revolt": false,
      "besieged": true,
      "fogVisible": true,
      "unitCountOnHex": 1,
      "badge": {
       "cityName": "Ateny",
       "population": 7,
       "defenseTier": 2,
       "civIconId": "grecy",
       "ownerColor": 1989288,
       "prodActive": true,
       "prodKind": "budynek",
       "prodId": "koszary",
       "growthPercent": 0,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": "Budynek",
       "prodItemName": "Koszary",
       "prodPaused": false,
       "isCityState": true,
       "era": 2,
       "isCapital": false
      }
     },
     {
      "id": 6,
      "ownerId": 1,
      "hex": {
       "q": 7,
       "r": 5
      },
      "population": 1,
      "level": 1,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Korynt",
       "population": 1,
       "defenseTier": 0,
       "civIconId": "grecy",
       "ownerColor": 1989288,
       "prodActive": true,
       "prodKind": "budynek",
       "prodId": "koszary",
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": "Budynek",
       "prodItemName": "Koszary",
       "prodPaused": false,
       "isCityState": true,
       "era": 2,
       "isCapital": false
      }
     },
     {
      "id": 9,
      "ownerId": 2,
      "hex": {
       "q": 9,
       "r": 9
      },
      "population": 2,
      "level": 2,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Teby",
       "population": 2,
       "defenseTier": 0,
       "civIconId": "grecy",
       "ownerColor": 1989288,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": true,
       "era": 2,
       "isCapital": false
      }
     },
     {
      "id": 10,
      "ownerId": 3,
      "hex": {
       "q": 11,
       "r": 9
      },
      "population": 2,
      "level": 2,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Argos",
       "population": 2,
       "defenseTier": 0,
       "civIconId": "grecy",
       "ownerColor": 1989288,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": false,
       "era": 2,
       "isCapital": true
      }
     },
     {
      "id": 14,
      "ownerId": 6,
      "hex": {
       "q": 13,
       "r": 2
      },
      "population": 3,
      "level": 3,
      "wallKind": "none",
      "revolt": false,
      "besieged": false,
      "fogVisible": true,
      "unitCountOnHex": 0,
      "badge": {
       "cityName": "Ulundi",
       "population": 3,
       "defenseTier": 0,
       "civIconId": "zulusi",
       "ownerColor": 13166648,
       "prodActive": false,
       "prodKind": null,
       "prodId": null,
       "growthPercent": null,
       "growthStarving": false,
       "resourceWarning": false,
       "prodCategoryLabel": null,
       "prodItemName": null,
       "prodPaused": false,
       "isCityState": true,
       "era": 2,
       "isCapital": false
      }
     }
    ]
   }
  }
 ]
}"##;
// END GENERATED

/// Zbudowany scenariusz: stan i wejscia spoza stanu.
struct Built {
    state: PlayableState,
    viewer: PlayerId,
    fog_active: bool,
    visible: BTreeSet<(i32, i32)>,
    facts: BTreeMap<u64, CityViewCityFacts>,
    city_states: CityStateFacts,
    stock_cost: BTreeMap<String, StockRecord>,
}

impl Built {
    fn with_inputs<R>(&self, f: impl FnOnce(&CityViewInputs<'_>) -> R) -> R {
        let cost = |item: &ProductionItem| -> StockRecord {
            let kind = match item.kind {
                ProductionKind::Budynek => "budynek",
                ProductionKind::Jednostka => "jednostka",
            };
            self.stock_cost
                .get(&format!("{kind}:{}", item.id))
                .cloned()
                .unwrap_or_default()
        };
        let inputs = CityViewInputs {
            viewer: self.viewer,
            fog_active: self.fog_active,
            visible_hexes: &self.visible,
            cities: &self.facts,
            city_states: &self.city_states,
            item_stock_cost: &cost,
        };
        f(&inputs)
    }

    fn owners(&self) -> Result<Vec<OwnerViewDto>, CityViewError> {
        self.with_inputs(|i| owner_views(&self.state, i))
    }

    fn cities(&self) -> Result<Vec<CityViewDto>, CityViewError> {
        self.with_inputs(|i| city_views(&self.state, i))
    }
}

fn u(v: &Value) -> u64 {
    v.as_u64().expect("u64")
}

fn i64_set(v: &Value) -> std::collections::HashSet<i64> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_i64().expect("i64"))
        .collect()
}

fn production_of(v: &Value) -> Option<CityProduction> {
    if v.is_null() {
        return None;
    }
    let kolejka = v["kolejka"]
        .as_array()
        .expect("kolejka")
        .iter()
        .map(|it| ProductionItem {
            kind: match it["kind"].as_str().expect("kind") {
                "budynek" => ProductionKind::Budynek,
                "jednostka" => ProductionKind::Jednostka,
                other => panic!("kind {other}"),
            },
            id: it["id"].as_str().expect("id").to_owned(),
            nazwa: it["nazwa"].as_str().expect("nazwa").to_owned(),
            koszt: it["koszt"].as_f64().expect("koszt"),
            postep: it.get("postep").and_then(Value::as_f64),
            is_general: None,
        })
        .collect();
    Some(CityProduction {
        kolejka,
        postep: v["postep"].as_f64().expect("postep"),
        wstrzymana: v.get("wstrzymana").and_then(Value::as_bool),
        rekrutacja: None,
    })
}

fn stock_of(v: &Value) -> StockRecord {
    v.as_object()
        .expect("obiekt surowcow")
        .iter()
        .map(|(k, x)| (k.clone(), x.as_f64().expect("liczba")))
        .collect()
}

fn base_state() -> PlayableState {
    PlayableGame::new(StartGameParams::default())
        .expect("gra startowa")
        .state()
        .clone()
}

fn build(sc: &Value) -> Built {
    let mut state = base_state();
    state.params.epoch_id = sc["epochId"].as_str().expect("epochId").to_owned();
    state.players = sc["players"]
        .as_array()
        .expect("players")
        .iter()
        .map(|p| PlayablePlayer {
            id: PlayerId::new(u(&p["id"])),
            name: format!("gracz {}", u(&p["id"])),
            civilization: p["civilization"].as_str().expect("civ").to_owned(),
            is_human: p["isHuman"].as_bool().expect("isHuman"),
        })
        .collect();
    state.cities.clear();
    state.stores.buildings_by_city.clear();
    state.economy = PlayableReplaceEconomy::default();
    let mut facts = BTreeMap::new();
    for c in sc["cities"].as_array().expect("cities") {
        let id = u(&c["id"]);
        let pos = PositionDto::new(
            u16::try_from(u(&c["q"])).expect("q"),
            u16::try_from(u(&c["r"])).expect("r"),
        );
        state.cities.push(PlayableCity {
            id: CityId::new(id),
            owner_id: PlayerId::new(u(&c["ownerId"])),
            name: c["name"].as_str().expect("name").to_owned(),
            position: pos,
            is_capital: c["isCapital"].as_bool().expect("isCapital"),
            population: u32::try_from(u(&c["population"])).expect("population"),
            culture: 0,
        });
        let built: Vec<String> = c["built"]
            .as_array()
            .expect("built")
            .iter()
            .map(|b| b.as_str().expect("id").to_owned())
            .collect();
        if !built.is_empty() {
            state.stores.buildings_by_city.insert(id, built);
        }
        if !c["surowce"].is_null() {
            state.economy.city_stock.insert(id, stock_of(&c["surowce"]));
        }
        let growth = if c["growth"].is_null() {
            None
        } else {
            Some(CityGrowthLive {
                procent_na_ture: c["growth"]["procentNaTure"].as_f64().expect("procent"),
                nakarmione: c["growth"]["nakarmione"].as_bool().expect("nakarmione"),
            })
        };
        facts.insert(
            id,
            CityViewCityFacts {
                production: production_of(&c["production"]),
                order_bunt: c["orderBunt"].as_bool().expect("bunt"),
                order_revolt_warning: c["orderRevoltWarning"].as_bool().expect("revoltWarning"),
                besieged: c["oblegane"].as_bool().expect("oblegane"),
                growth,
                start_city_state: c.get("startCityState").and_then(Value::as_bool),
            },
        );
    }
    state.units = sc["units"]
        .as_array()
        .expect("units")
        .iter()
        .enumerate()
        .map(|(i, x)| PlayableUnit {
            id: UnitId::new(100 + i as u64),
            owner_id: PlayerId::new(u(&x["ownerId"])),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(
                u16::try_from(u(&x["q"])).expect("q"),
                u16::try_from(u(&x["r"])).expect("r"),
            ),
            movement: 1,
            movement_max: 1,
            selected: false,
        })
        .collect();
    for r in sc["relations"].as_array().expect("relations") {
        let status: RelationStatus =
            serde_json::from_value(r["status"].clone()).expect("status relacji");
        state.war.diplomacy.set_relation(
            CivilizationPair::new(PlayerId::new(u(&r["a"])), PlayerId::new(u(&r["b"]))),
            Relation::new(50.0, 50.0, status),
        );
    }
    for d in sc["deals"].as_array().expect("deals") {
        // `sojusz_wojskowy` (legacy) przechodzi przez alias serde -> `sojusz_pelny`, jak `normalizeTreatyKind`.
        let kind: TreatyKind = serde_json::from_value(d["rodzaj"].clone()).expect("rodzaj");
        state.war.diplomacy.deals.push(ActiveDeal::new(
            kind,
            PlayerId::new(u(&d["strony"][0])),
            PlayerId::new(u(&d["strony"][1])),
            1,
            None,
        ));
    }
    let stock_cost = sc["itemStockCost"]
        .as_object()
        .expect("itemStockCost")
        .iter()
        .map(|(k, v)| (k.clone(), stock_of(v)))
        .collect();
    Built {
        state,
        viewer: PlayerId::new(u(&sc["viewer"])),
        fog_active: sc["fogActive"].as_bool().expect("fogActive"),
        visible: sc["visibleHexes"]
            .as_array()
            .expect("visibleHexes")
            .iter()
            .map(|h| {
                (
                    i32::try_from(h[0].as_i64().expect("q")).expect("q"),
                    i32::try_from(h[1].as_i64().expect("r")).expect("r"),
                )
            })
            .collect(),
        facts,
        city_states: CityStateFacts {
            simplified_owners: i64_set(&sc["simplifiedOwners"]),
            typ_copy_owners: i64_set(&sc["typCopyOwners"]),
            cluster_capital_owner_ids: i64_set(&sc["clusterCapitalOwnerIds"]),
        },
        stock_cost,
    }
}

fn vectors() -> Value {
    serde_json::from_str(PIN_VECTORS).expect("blok PIN_VECTORS")
}

fn scenario(name: &str) -> Value {
    vectors()["scenarios"]
        .as_array()
        .expect("scenarios")
        .iter()
        .find(|s| s["input"]["name"] == name)
        .unwrap_or_else(|| panic!("brak scenariusza {name}"))
        .clone()
}

/// Zbior sciezek kluczy obiektu JSON (do porownania ksztaltu: te same klucze, bez nadmiarowych).
fn key_paths(v: &Value, prefix: &str, out: &mut BTreeSet<String>) {
    match v {
        Value::Object(map) => {
            for (k, x) in map {
                let p = format!("{prefix}.{k}");
                out.insert(p.clone());
                key_paths(x, &p, out);
            }
        }
        Value::Array(items) => {
            for (i, x) in items.iter().enumerate() {
                key_paths(x, &format!("{prefix}[{i}]"), out);
            }
        }
        _ => {}
    }
}

fn assert_scenario(name: &str) {
    let sc = scenario(name);
    let built = build(&sc["input"]);
    let owners = built.owners().expect("owner_views");
    let cities = built.cities().expect("city_views");

    let exp_owners: Vec<OwnerViewDto> =
        serde_json::from_value(sc["expected"]["owners"].clone()).expect("owners z pinu");
    let exp_cities: Vec<CityViewDto> =
        serde_json::from_value(sc["expected"]["cities"].clone()).expect("cities z pinu");
    assert_eq!(owners.len(), exp_owners.len(), "{name}: liczba wlascicieli");
    for (got, exp) in owners.iter().zip(&exp_owners) {
        assert_eq!(got, exp, "{name}: wlasciciel {:?}", exp.owner_id);
    }
    assert_eq!(cities.len(), exp_cities.len(), "{name}: liczba miast");
    for (got, exp) in cities.iter().zip(&exp_cities) {
        assert_eq!(got, exp, "{name}: miasto {}", exp.id);
    }

    // Ksztalt JSON: kazdy klucz z pinu jest w wyjsciu i odwrotnie (`null` pinu = jawny `null` Rust).
    let mut got_keys = BTreeSet::new();
    let mut exp_keys = BTreeSet::new();
    key_paths(
        &serde_json::to_value(&owners).expect("json"),
        "owners",
        &mut got_keys,
    );
    key_paths(
        &serde_json::to_value(&cities).expect("json"),
        "cities",
        &mut got_keys,
    );
    key_paths(&sc["expected"]["owners"], "owners", &mut exp_keys);
    key_paths(&sc["expected"]["cities"], "cities", &mut exp_keys);
    assert_eq!(got_keys, exp_keys, "{name}: klucze JSON");
}

#[test]
fn blok_wektorow_pochodzi_z_pinu() {
    let v = vectors();
    assert_eq!(v["pin"], "07d2fbd72");
    // Jedyna zaslepka harnessu to `three` (geometria renderu, nieuzywana przez wolany kod).
    assert_eq!(v["stubbedModules"], serde_json::json!(["three"]));
    assert_eq!(v["scenarios"].as_array().expect("scenarios").len(), 3);
}

#[test]
fn start_jedno_miasto_bez_kolejki_bez_wzrostu_bez_budynkow() {
    assert_scenario("start_jedno_miasto_bez_kolejki");
    // Przypadki graniczne nazwane w dispatchu, sprawdzone na wektorze pinu (nie recznie):
    let sc = scenario("start_jedno_miasto_bez_kolejki");
    let badge = &sc["expected"]["cities"][0]["badge"];
    assert_eq!(badge["prodActive"], false);
    assert!(badge["prodKind"].is_null());
    assert!(badge["growthPercent"].is_null());
    assert_eq!(badge["defenseTier"], 0);
}

#[test]
fn wielu_wlascicieli_mgla_zgodne_z_pinem() {
    assert_scenario("wielu_wlascicieli_mgla");
}

#[test]
fn hotseat_drugi_fotel_bez_mgly_zgodne_z_pinem() {
    assert_scenario("hotseat_drugi_fotel_bez_mgly_braz");
}

#[test]
fn wektory_pokrywaja_galezie_producenta() {
    // Wektory musza rozrozniac kazda galaz; inaczej mutacja galezi przeszlaby niezauwazona.
    let v = vectors();
    let mut owners = Vec::new();
    let mut cities = Vec::new();
    for sc in v["scenarios"].as_array().expect("scenarios") {
        owners.extend(
            sc["expected"]["owners"]
                .as_array()
                .expect("o")
                .iter()
                .cloned(),
        );
        cities.extend(
            sc["expected"]["cities"]
                .as_array()
                .expect("c")
                .iter()
                .cloned(),
        );
    }
    let has = |items: &[Value], f: &dyn Fn(&Value) -> bool| items.iter().any(f);
    for kind in ["player", "war", "ally", "neutral"] {
        assert!(
            has(&owners, &|o| o["mapOutlineKind"] == kind),
            "outline {kind}"
        );
    }
    for rel in ["self", "wojna", "pokoj", "sojusz", "neutralni"] {
        assert!(
            has(&owners, &|o| o["relationToViewer"] == rel),
            "relacja {rel}"
        );
    }
    assert!(has(&owners, &|o| o["isCityState"] == true));
    assert!(has(&owners, &|o| o["ringHex"].is_null()));
    assert!(has(&owners, &|o| o["displayName"].is_null()));
    assert!(has(&owners, &|o| o["era"] == 2));
    for wall in ["none", "palisada", "stone"] {
        assert!(has(&cities, &|c| c["wallKind"] == wall), "mur {wall}");
    }
    assert!(has(&cities, &|c| c["fogVisible"] == false));
    assert!(has(&cities, &|c| c["revolt"] == true));
    assert!(has(&cities, &|c| c["besieged"] == true));
    assert!(has(&cities, &|c| c["unitCountOnHex"] == 2));
    assert!(has(&cities, &|c| c["level"] == 10));
    let badges: Vec<Value> = cities.iter().map(|c| c["badge"].clone()).collect();
    assert!(has(&badges, &|b| b["resourceWarning"] == true));
    assert!(has(&badges, &|b| b["resourceWarning"] == false
        && b["prodActive"] == true));
    assert!(has(&badges, &|b| b["prodPaused"] == true
        && b["prodKind"].is_null()));
    assert!(has(&badges, &|b| b["prodPaused"] == true
        && b["prodKind"] == "jednostka"));
    assert!(has(&badges, &|b| b["growthStarving"] == true));
    assert!(has(&badges, &|b| b["isCapital"] == true));
    assert!(has(&badges, &|b| b["isCapital"] == false
        && b["isCityState"] == true));
    // Wzrost obcego miasta jest w wejsciu, ale pin go nie czyta (`render/cities.ts:904`).
    assert!(has(&badges, &|b| b["growthPercent"].is_null()));
}

#[test]
fn json_round_trip_typow_zwracanych() {
    for sc in vectors()["scenarios"].as_array().expect("scenarios") {
        let built = build(&sc["input"]);
        let owners = built.owners().expect("owners");
        let cities = built.cities().expect("cities");
        let o_json = serde_json::to_string(&owners).expect("json");
        let c_json = serde_json::to_string(&cities).expect("json");
        let o_back: Vec<OwnerViewDto> = serde_json::from_str(&o_json).expect("owners z json");
        let c_back: Vec<CityViewDto> = serde_json::from_str(&c_json).expect("cities z json");
        assert_eq!(o_back, owners);
        assert_eq!(c_back, cities);
    }
}

#[test]
fn brak_faktow_miasta_to_blad_nie_domyslna_wartosc() {
    let sc = scenario("wielu_wlascicieli_mgla");
    let mut built = build(&sc["input"]);
    built.facts.remove(&7);
    assert_eq!(built.cities(), Err(CityViewError::MissingCityFacts(7)));
}

#[test]
fn wlasciciel_spoza_players_to_blad() {
    let sc = scenario("wielu_wlascicieli_mgla");
    let mut built = build(&sc["input"]);
    built.state.players.retain(|p| p.id != PlayerId::new(3));
    assert_eq!(built.cities(), Err(CityViewError::UnknownOwner(3)));
    assert_eq!(built.owners(), Err(CityViewError::UnknownOwner(3)));
}

#[test]
fn widz_spoza_players_to_blad() {
    let sc = scenario("start_jedno_miasto_bez_kolejki");
    let mut built = build(&sc["input"]);
    built.viewer = PlayerId::new(42);
    assert_eq!(built.owners(), Err(CityViewError::UnknownOwner(42)));
}

#[test]
fn id_powyzej_2_do_53_to_blad() {
    let sc = scenario("start_jedno_miasto_bez_kolejki");
    let mut built = build(&sc["input"]);
    let big = 1_u64 << 53;
    built.state.cities[0].id = CityId::new(big);
    let facts = built.facts.remove(&1).expect("fakty");
    built.facts.insert(big, facts);
    assert_eq!(built.cities(), Err(CityViewError::IdOutOfRange(big)));
}

#[test]
fn nieskonczony_wzrost_miasta_widza_to_blad_obcego_ignorowany() {
    let sc = scenario("wielu_wlascicieli_mgla");
    let mut built = build(&sc["input"]);
    // Obce miasto (Ateny, id 2): pin nie czyta wzrostu, wiec NaN nie trafia do DTO.
    built.facts.get_mut(&2).expect("Ateny").growth = Some(CityGrowthLive {
        procent_na_ture: f64::NAN,
        nakarmione: true,
    });
    let cities = built.cities().expect("obcy NaN ignorowany");
    assert_eq!(cities[2].badge.growth_percent, None);
    // Miasto widza (Roma, id 1): NaN nie przejdzie przez JSON -> jawny blad.
    built.facts.get_mut(&1).expect("Roma").growth = Some(CityGrowthLive {
        procent_na_ture: f64::INFINITY,
        nakarmione: true,
    });
    assert!(matches!(
        built.cities(),
        Err(CityViewError::NonFiniteGrowth { city_id: 1, .. })
    ));
}
