# Inwentarz `gra/src/battle/battleScene.ts` @ `edb8fb56` (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1)

Wygenerowane skryptem `dowody/inv2.py`: `python3 dowody/inv2.py <battleScene.ts z git archive edb8fb56> inwentarz-battleScene.md dowody/inv_summary.txt`. Klasyfikacja HEURYSTYCZNA (liczniki wzorców w ciele symbolu):
`three` = wystąpienia `THREE.`, `obj` = dostęp do grafu sceny (`.position.`, `.add(`, `scene`, `camera`, `Mesh`, `buildUnitModel`, …), `dom` = DOM/CSS (`document.`, `.style`, `createElement`, `addEventListener`, …).
Kategorie: **3D** (three>0 lub obj≥3, dom=0), **MIX** (3D i DOM), **UI** (tylko DOM), **LOG** (brak obu), **TYPE** (typ/interfejs).
Status: `PORTOWANY (3D)` / `NIE-DOTYCZY` (dokąd należy) / `RUNDA-n` (planowana runda tego tematu). Przypisanie rundy wg słów kluczowych nazwy — do korekty przez rundę, która symbol przejmuje.

Linie 1–291: importy i stałe modułu przed pierwszą deklaracją objętą tabelą — NIE_ZMIERZONO per symbol (stałe są przenoszone razem z symbolem, który ich używa).

| # | linie | LOC | symbol | rodzaj | three | obj | dom | kat. | status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 292–299 | 8 | `enum` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 2 | 300–302 | 3 | `FacingHit` | type | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 3 | 303–313 | 11 | `DIR_DELTA` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 4 | 314–323 | 10 | `DIRS4` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 5 | 324–335 | 12 | `facingToward` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 6 | 336–346 | 11 | `facingFromTo` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 7 | 347–361 | 15 | `oppositeDir` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 8 | 362–382 | 21 | `relativeHit` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 9 | 383–437 | 55 | `BattleUnit` | interface | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 10 | 438–458 | 21 | `SiegeOpts` | interface | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 11 | 459–554 | 96 | `BattleOpts` | interface | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 12 | 555–569 | 15 | `BattleResult` | interface | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 13 | 570–581 | 12 | `BT_DEBUG_PRESETS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 14 | 582–593 | 12 | `debugWorldTerrainOverride` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 15 | 594–617 | 24 | `cloneBattleUnitsForReplay` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 16 | 618–618 | 1 | `BF_COLS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 17 | 619–621 | 3 | `BF_ROWS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 18 | 622–622 | 1 | `PLAYABLE_COLS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 19 | 623–623 | 1 | `PLAYABLE_ROWS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 20 | 624–624 | 1 | `PLAY_COL0` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 21 | 625–625 | 1 | `PLAY_ROW0` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 22 | 626–626 | 1 | `PLAY_COL1` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 23 | 627–627 | 1 | `PLAY_ROW1` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 24 | 628–628 | 1 | `PLAY_MID_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 25 | 629–630 | 2 | `PLAY_MID_ROW` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 26 | 631–634 | 4 | `inPlayable` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 27 | 635–638 | 4 | `clampPlayCol` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 28 | 639–643 | 5 | `clampPlayRow` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 29 | 644–644 | 1 | `HUD_BG` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 30 | 645–645 | 1 | `HUD_GOLD` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 31 | 646–646 | 1 | `HUD_GOLD_DIM` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 32 | 647–647 | 1 | `HUD_TEXT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 33 | 648–648 | 1 | `HUD_TEXT_DIM` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 34 | 649–649 | 1 | `HUD_FONT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 35 | 650–652 | 3 | `HOVER_TOOLTIP_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 36 | 653–658 | 6 | `CURSOR_BOW` | const | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 37 | 659–664 | 6 | `CURSOR_SWORD` | const | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 38 | 665–665 | 1 | `CURSOR_MOVE` | const | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 39 | 666–666 | 1 | `CURSOR_DEFAULT` | const | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 40 | 667–667 | 1 | `ORDER_LINE_Y` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 41 | 668–668 | 1 | `ORDER_COLOR_MOVE` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 42 | 669–669 | 1 | `ORDER_COLOR_ATTACK` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 43 | 670–670 | 1 | `ORDER_MOVE_OPACITY` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 44 | 671–675 | 5 | `ORDER_ATTACK_OPACITY` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 45 | 676–680 | 5 | `MAX_PER_SIDE` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 46 | 681–684 | 4 | `RANK_WIDTH` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 47 | 685–689 | 5 | `MAX_RANKS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 48 | 690–695 | 6 | `DEPLOY_MARGIN` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 49 | 696–703 | 8 | `TILE_S` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 50 | 704–704 | 1 | `FRONT_GAP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 51 | 705–705 | 1 | `ATK_FRONT_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 52 | 706–706 | 1 | `DEF_FRONT_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 53 | 707–707 | 1 | `ATK_COL_STEP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 54 | 708–733 | 26 | `DEF_COL_STEP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 55 | 734–756 | 23 | `deployClearRanksFor` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 56 | 757–773 | 17 | `battleSafeCols` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 57 | 774–774 | 1 | `DEPLOY_MID_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 58 | 775–775 | 1 | `DEPLOY_MAX_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 59 | 776–776 | 1 | `DEPLOY_MIN_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 60 | 777–777 | 1 | `DEPLOY_ATK_FRONT_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 61 | 778–778 | 1 | `DEPLOY_ATK_COL_STEP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 62 | 779–779 | 1 | `DEPLOY_MIN_ROW` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 63 | 780–781 | 2 | `DEPLOY_MAX_ROW` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 64 | 782–783 | 2 | `DEPLOY_EDGE_MARGIN` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 65 | 784–785 | 2 | `DEPLOY_TOOLBAR_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 66 | 786–787 | 2 | `DEPLOY_TOOLBAR_BOTTOM_GAP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 67 | 788–789 | 2 | `DEPLOY_GROUP_RAIL_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 68 | 790–791 | 2 | `DEPLOY_GROUP_RAIL_GAP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 69 | 792–793 | 2 | `DEPLOY_TOOLBAR_RESERVE` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 70 | 794–795 | 2 | `DEPLOY_GROUP_RAIL_RESERVE` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 71 | 796–797 | 2 | `ROSTER_SCREEN_BOTTOM_GAP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 72 | 798–799 | 2 | `BATTLE_GROUP_BAR_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 73 | 800–801 | 2 | `DEPLOY_POWER_BAR_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 74 | 802–803 | 2 | `BATTLE_TOP_BAR_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 75 | 804–805 | 2 | `BATTLE_HEADER_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 76 | 806–818 | 13 | `ROSTER_COL_W` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 77 | 819–819 | 1 | `DEPLOY_ROSTER_CARD_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 78 | 820–821 | 2 | `BATTLE_ROSTER_CARD_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 79 | 822–824 | 3 | `BATTLE_UI_BUILD` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 80 | 825–841 | 17 | `TEMPO_PANEL_W` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 81 | 842–856 | 15 | `civIconIdFromLabel` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 82 | 857–862 | 6 | `clampEra` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 83 | 863–866 | 4 | `deployFormationCentCol` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 84 | 867–871 | 5 | `inDeployAtkZone` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 85 | 872–872 | 1 | `DEPLOY_DEF_MIN_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 86 | 873–874 | 2 | `DEPLOY_DEF_MAX_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 87 | 875–875 | 1 | `DEPLOY_DEF_FRONT_COL` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 88 | 876–877 | 2 | `DEPLOY_DEF_COL_STEP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 89 | 878–882 | 5 | `inDeployDefZone` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 90 | 883–883 | 1 | `DEFAULT_BATTLE_MOVE` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 91 | 884–892 | 9 | `DEFAULT_RANGED_REACH` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 92 | 893–902 | 10 | `RANGED_MIN_GAP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 93 | 903–904 | 2 | `MELEE_SAFE_GAP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 94 | 905–905 | 1 | `TILE_H` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 95 | 906–916 | 11 | `UNIT_Y` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 96 | 917–917 | 1 | `BROD` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 97 | 918–918 | 1 | `BROD_RUCH_MULT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 98 | 919–919 | 1 | `BROD_KARA_ATAK` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 99 | 920–920 | 1 | `BROD_KARA_OBRONA` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 100 | 921–927 | 7 | `BROD_BONUS_BRZEG` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 101 | 928–932 | 5 | `FORTIFY_OBRONA_PROC_FIELD` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 102 | 933–944 | 12 | `FORD_AI_AVOID_PENALTY` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 103 | 945–945 | 1 | `MOVE_STEP_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 104 | 946–946 | 1 | `STEP_GAP_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 105 | 947–947 | 1 | `RANGED_FLY_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 106 | 948–948 | 1 | `RANGED_GAP_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 107 | 949–949 | 1 | `ACT_GAP_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 108 | 950–954 | 5 | `DEATH_FADE_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 109 | 955–955 | 1 | `BLOW_LUNGE_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 110 | 956–956 | 1 | `BLOW_HIT_T` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 111 | 957–957 | 1 | `BLOW_SETTLE_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 112 | 958–966 | 9 | `TURN_GAP_MS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 113 | 967–967 | 1 | `HPBAR_W` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 114 | 968–977 | 10 | `HPBAR_H` | const | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 115 | 978–991 | 14 | `HPBAR_Y` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 116 | 992–992 | 1 | `BAR_GAP_Y` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 117 | 993–993 | 1 | `MORALEBAR_Y` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 118 | 994–994 | 1 | `AMMOBAR_Y` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 119 | 995–1008 | 14 | `AMMOBAR_COLOR` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 120 | 1009–1013 | 5 | `sideColor` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 121 | 1014–1016 | 3 | `BAR_OUTLINE_PAD` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 122 | 1017–1023 | 7 | `BAR_OUTLINE_Z` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 123 | 1024–1025 | 2 | `CLASH_LOG_MAX` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 124 | 1026–1046 | 21 | `sideTag` | function | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 125 | 1047–1049 | 3 | `MORALE_START` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 126 | 1050–1052 | 3 | `MORALE_HIT_LOSS_SCALE` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 127 | 1053–1053 | 1 | `MORALE_ALLY_DEATH_LOSS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 128 | 1054–1054 | 1 | `STALL_TURN_LIMIT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 129 | 1055–1062 | 8 | `MORALE_DEATH_RADIUS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 130 | 1063–1063 | 1 | `MORALE_FLANK_HIT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 131 | 1064–1064 | 1 | `MORALE_REAR_HIT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 132 | 1065–1065 | 1 | `MORALE_CHARGE_HIT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 133 | 1066–1066 | 1 | `MORALE_KILL_GAIN` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 134 | 1067–1067 | 1 | `MORALE_ENEMY_BREAK_GAIN` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 135 | 1068–1068 | 1 | `MORALE_SURROUND_HIT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 136 | 1069–1069 | 1 | `MORALE_TERRAIN_RESIST` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 137 | 1070–1070 | 1 | `MORALE_ARMY_COLLAPSE_RATIO` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 138 | 1071–1071 | 1 | `MORALE_ARMY_COLLAPSE_MULT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 139 | 1072–1072 | 1 | `MORALE_GENERAL_AURA` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 140 | 1073–1073 | 1 | `MORALE_GATE_BREACH` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 141 | 1074–1082 | 9 | `MORALE_WALL_BREACH` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 142 | 1083–1086 | 4 | `ARMY_MORALE_LOSS_THRESHOLD` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 143 | 1087–1093 | 7 | `FALLBACK_TILES` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 144 | 1094–1099 | 6 | `PHALANX_LEAD_TOLERANCE` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 145 | 1100–1110 | 11 | `TERRAIN_COLORS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 146 | 1111–1129 | 19 | `terrainFloorColor` | function | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 147 | 1130–1143 | 14 | `BT_FLOOR_COLOR` | const | 0 | 3 | 0 | 3D | RUNDA-2 |
| 148 | 1144–1154 | 11 | `BT_FLOOR_COLOR_DESERT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 149 | 1155–1155 | 1 | `FOREST_CONE_COLOR` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 150 | 1156–1156 | 1 | `FOREST_CONE_COLOR2` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 151 | 1157–1157 | 1 | `FOREST_TRUNK_COLOR` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 152 | 1158–1158 | 1 | `HILL_GRASS_COLOR` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 153 | 1159–1159 | 1 | `SHRUB_COLOR` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 154 | 1160–1160 | 1 | `ROCK_COLOR` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 155 | 1161–1163 | 3 | `RIVER_WATER_COLOR` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 156 | 1164–1164 | 1 | `HILL_GRASS_COLOR_DESERT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 157 | 1165–1165 | 1 | `SHRUB_COLOR_DESERT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 158 | 1166–1169 | 4 | `ROCK_COLOR_DESERT` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 159 | 1170–1170 | 1 | `GRASS_TUFT_COLOR_A` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 160 | 1171–1171 | 1 | `GRASS_TUFT_COLOR_B` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 161 | 1172–1172 | 1 | `PEBBLE_COLOR` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 162 | 1173–1175 | 3 | `TINY_BUSH_COLOR` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 163 | 1176–1176 | 1 | `GRASS_TUFT_COLOR_A_DESERT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 164 | 1177–1179 | 3 | `GRASS_TUFT_COLOR_B_DESERT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 165 | 1180–1186 | 7 | `HILL_LIFT` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 166 | 1187–1193 | 7 | `HILL_BUMP_RADIUS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 167 | 1194–1195 | 2 | `HILL_SUMMIT_Y` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 168 | 1196–1202 | 7 | `RIVER_DROP` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 169 | 1203–1203 | 1 | `SIEGE_BLDG_BODY_COLORS` | const | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 170 | 1204–1213 | 10 | `SIEGE_BLDG_ROOF_COLORS` | const | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 171 | 1214–1240 | 27 | `makeGableRoofGeometry` | function | 3 | 0 | 0 | 3D | RUNDA-2 |
| 172 | 1241–1247 | 7 | `norm` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 173 | 1248–1261 | 14 | `statField` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 174 | 1262–1280 | 19 | `normCounters` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 175 | 1281–1306 | 26 | `toCombatUnit` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 176 | 1307–1312 | 6 | `movementPoints` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 177 | 1313–1335 | 23 | `civUnitShapeForBattleUnit` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 178 | 1336–1345 | 10 | `attackRange` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 179 | 1346–1359 | 14 | `isRanged` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 180 | 1360–1382 | 23 | `ammoCount` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 181 | 1383–1399 | 17 | `canShoot` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 182 | 1400–1415 | 16 | `isPrimaryRanged` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 183 | 1416–1433 | 18 | `isMounted` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 184 | 1434–1449 | 16 | `isAntiCavSpear` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 185 | 1450–1463 | 14 | `isPhalanx` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 186 | 1464–1472 | 9 | `isSiegeUnit` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 187 | 1473–1487 | 15 | `isSiegeTower` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 188 | 1488–1517 | 30 | `arrangeFlankCavalry` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 189 | 1518–1538 | 21 | `bracesAgainstCharge` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 190 | 1539–1557 | 19 | `isNeverRout` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 191 | 1558–1570 | 13 | `moraleBaseFor` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 192 | 1571–1588 | 18 | `fleeMoraleFor` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 193 | 1589–1591 | 3 | `ProjectileKind` | type | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 194 | 1592–1604 | 13 | `normName` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 195 | 1605–1627 | 23 | `projectileKind` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 196 | 1628–1723 | 96 | `makeProjectileMesh` | function | 19 | 19 | 0 | 3D | RUNDA-5 |
| 197 | 1724–1728 | 5 | `cellToWorld` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 198 | 1729–1740 | 12 | `cellBoundsXZ` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 199 | 1741–1742 | 2 | `cellKey` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 200 | 1743–1748 | 6 | `clampBattleTile` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 201 | 1749–1760 | 12 | `battlePickMeshUpNormal` | function | 1 | 1 | 0 | 3D | RUNDA-5 |
| 202 | 1761–1785 | 25 | `pickBattleGroundTilePlane` | function | 4 | 0 | 0 | 3D | RUNDA-5 |
| 203 | 1786–1830 | 45 | `pickBattleGroundTileFromMeshes` | function | 3 | 0 | 0 | 3D | RUNDA-5 |
| 204 | 1831–1840 | 10 | `tileTopY` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 205 | 1841–1850 | 10 | `isFordTile` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 206 | 1851–1860 | 10 | `isShoreAdjacentToFord` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 207 | 1861–1870 | 10 | `manhattan` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 208 | 1871–1881 | 11 | `dirYaw` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 209 | 1882–1882 | 1 | `GroupDoctrine` | type | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 210 | 1883–1895 | 13 | `BattleUnitClass` | type | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 211 | 1896–1899 | 4 | `AttackDirection` | type | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 212 | 1900–1905 | 6 | `desiredHitForDirection` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 213 | 1906–1991 | 86 | `RuntimeBattleUnit` | interface | 10 | 8 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 214 | 1992–1994 | 3 | `CavalryDeployMode` | type | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 215 | 1995–1996 | 2 | `DeployLineCount` | type | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 216 | 1997–2018 | 22 | `GroupMeta` | interface | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 217 | 2019–2030 | 12 | `GeneralSettings` | interface | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 218 | 2031–2043 | 13 | `FloatLabel` | interface | 1 | 0 | 1 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 219 | 2044–2045 | 2 | `GroupFormation` | type | 0 | 0 | 0 | TYPE | NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5) |
| 220 | 2046–2615 | 570 | `BattleScene` | class | 24 | 5 | 87 | MIX | RUNDA-2 (tylko część 3D) |
| 221 | 2616–3437 | 822 | `BattleScene.constructor` | method | 14 | 35 | 250 | MIX | RUNDA-2 (tylko część 3D) |
| 222 | 3438–3448 | 11 | `BattleScene.play` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 223 | 3449–3483 | 35 | `BattleScene._startBattle` | method | 0 | 1 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 224 | 3484–3495 | 12 | `BattleScene._executeQueuedOrders` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 225 | 3496–3514 | 19 | `BattleScene._kickoffBattleTurn` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 226 | 3515–3549 | 35 | `BattleScene._updateBattlePhaseBanner` | method | 0 | 0 | 8 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 227 | 3550–3555 | 6 | `BattleScene._syncModeHintPosition` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 228 | 3556–3560 | 5 | `BattleScene._syncManualRailHighlight` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 229 | 3561–3592 | 32 | `BattleScene.skip` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 230 | 3593–3596 | 4 | `BattleScene.getBattleMinimapData` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 231 | 3597–3739 | 143 | `BattleScene.dispose` | method | 0 | 3 | 35 | MIX | RUNDA-2 (tylko część 3D) |
| 232 | 3740–3826 | 87 | `BattleScene._carveBattleBox` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 233 | 3827–3848 | 22 | `BattleScene._fencePlayableZone` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 234 | 3849–3896 | 48 | `BattleScene._carveWallTiles` | method | 0 | 3 | 0 | 3D | RUNDA-2 |
| 235 | 3897–3986 | 90 | `BattleScene._placeSiegeWall` | method | 3 | 13 | 7 | MIX | RUNDA-3 (tylko część 3D) |
| 236 | 3987–4123 | 137 | `BattleScene._buildSiegeInteriorBuildings` | method | 9 | 18 | 0 | 3D | RUNDA-2 |
| 237 | 4124–4138 | 15 | `BattleScene._repositionSiegeAttackers` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 238 | 4139–4445 | 307 | `BattleScene._placeSiegeDefenders` | method | 16 | 29 | 0 | 3D | RUNDA-3 |
| 239 | 4446–4461 | 16 | `BattleScene._debugRecordSiegeColumns` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 240 | 4462–4878 | 417 | `BattleScene._buildBattlefield` | method | 45 | 63 | 0 | 3D | RUNDA-2 |
| 241 | 4879–4968 | 90 | `BattleScene._buildPlayableMarginVisuals` | method | 7 | 8 | 0 | 3D | RUNDA-2 |
| 242 | 4969–5266 | 298 | `BattleScene._placeUnits` | method | 8 | 19 | 0 | 3D | RUNDA-3 |
| 243 | 5267–5295 | 29 | `BattleScene._updateStallWatch` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 244 | 5296–5329 | 34 | `BattleScene._applyStartingMoralePowerPenalty` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 245 | 5330–5391 | 62 | `BattleScene._beginTurn` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 246 | 5392–5402 | 11 | `BattleScene._beginAutoBatchTurnFromCurrentState` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 247 | 5403–5447 | 45 | `BattleScene._beginAutoBatchPhase` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 248 | 5448–5517 | 70 | `BattleScene._snapshotAutoBatchIntents` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 249 | 5518–5542 | 25 | `BattleScene._cloneForAutoBatchPlanning` | method | 6 | 9 | 0 | 3D | RUNDA-3 |
| 250 | 5543–5560 | 18 | `BattleScene._disposeAutoBatchPlanningRoster` | method | 0 | 4 | 0 | 3D | RUNDA-3 |
| 251 | 5561–5602 | 42 | `BattleScene._launchAutoBatchResolution` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 252 | 5603–5619 | 17 | `BattleScene._resolveAutoBatchAttack` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 253 | 5620–5656 | 37 | `BattleScene._resolveAutoBatchMovement` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 254 | 5657–5674 | 18 | `BattleScene._finishAutoBatchPhase` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 255 | 5675–5731 | 57 | `BattleScene._activateNext` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 256 | 5732–6044 | 313 | `BattleScene._activateUnit` | method | 0 | 3 | 0 | 3D | RUNDA-3 |
| 257 | 6045–6057 | 13 | `BattleScene._cavPriority` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 258 | 6058–6082 | 25 | `BattleScene._cavalryTarget` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 259 | 6083–6103 | 21 | `BattleScene._cavAdjacentNonSpear` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 260 | 6104–6157 | 54 | `BattleScene._cavalryAction` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 261 | 6158–6188 | 31 | `BattleScene._cavDirectedManeuverStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 262 | 6189–6250 | 62 | `BattleScene._cavManeuverStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 263 | 6251–6268 | 18 | `BattleScene._phalanxLineFront` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 264 | 6269–6273 | 5 | `BattleScene._advanceCoord` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 265 | 6274–6277 | 4 | `BattleScene._phalanxAdvanceOf` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 266 | 6278–6319 | 42 | `BattleScene._phalanxAction` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 267 | 6320–6387 | 68 | `BattleScene._phalanxStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 268 | 6388–6474 | 87 | `BattleScene._rangedAction` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 269 | 6475–6479 | 5 | `BattleScene._advanceDir` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 270 | 6480–6484 | 5 | `BattleScene._forwardCol` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 271 | 6485–6489 | 5 | `BattleScene._clampColTowardEnemy` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 272 | 6490–6507 | 18 | `BattleScene._groupSide` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 273 | 6508–6545 | 38 | `BattleScene._rangedForwardStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 274 | 6546–6592 | 47 | `BattleScene._bestForwardStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 275 | 6593–6648 | 56 | `BattleScene._bestBackStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 276 | 6649–6699 | 51 | `BattleScene._bestKiteShotStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 277 | 6700–6730 | 31 | `BattleScene._rangedBackStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 278 | 6731–6754 | 24 | `BattleScene._rangedTargetInRange` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 279 | 6755–6802 | 48 | `BattleScene._kiteStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 280 | 6803–6813 | 11 | `BattleScene._kiteGapSatisfied` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 281 | 6814–6875 | 62 | `BattleScene._bestKiteStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 282 | 6876–6917 | 42 | `BattleScene._bestFallBackStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 283 | 6918–6946 | 29 | `BattleScene._fallBackStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 284 | 6947–6999 | 53 | `BattleScene._rangedApproachStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 285 | 7000–7028 | 29 | `BattleScene._attackGate` | method | 1 | 2 | 0 | 3D | RUNDA-4 |
| 286 | 7029–7055 | 27 | `BattleScene._animateRam` | method | 2 | 9 | 0 | 3D | RUNDA-4 |
| 287 | 7056–7091 | 36 | `BattleScene._sfxRamImpact` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 288 | 7092–7097 | 6 | `BattleScene._isRam` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 289 | 7098–7125 | 28 | `BattleScene._isCatapult` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 290 | 7126–7135 | 10 | `BattleScene._moveCostForUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 291 | 7136–7157 | 22 | `BattleScene._passableForUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 292 | 7158–7168 | 11 | `BattleScene._applyTerrainRange` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 293 | 7169–7178 | 10 | `BattleScene._siegeStructureDamage` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 294 | 7179–7185 | 7 | `BattleScene._movementPointsFor` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 295 | 7186–7193 | 8 | `BattleScene._attackRangeFor` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 296 | 7194–7203 | 10 | `BattleScene._siegeMachineRange` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 297 | 7204–7234 | 31 | `BattleScene._attackWallTile` | method | 2 | 0 | 0 | 3D | RUNDA-2 |
| 298 | 7235–7271 | 37 | `BattleScene._spawnCatapultBoulder` | method | 5 | 9 | 0 | 3D | RUNDA-2 |
| 299 | 7272–7301 | 30 | `BattleScene._sfxCatapultImpact` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 300 | 7302–7420 | 119 | `BattleScene._breachWallTile` | method | 5 | 11 | 0 | 3D | RUNDA-4 |
| 301 | 7421–7476 | 56 | `BattleScene._breachGate` | method | 3 | 6 | 0 | 3D | RUNDA-4 |
| 302 | 7477–7495 | 19 | `BattleScene._spawnWallLabel` | method | 1 | 0 | 6 | MIX | RUNDA-3 (tylko część 3D) |
| 303 | 7496–7544 | 49 | `BattleScene._updateSiegeHud` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 304 | 7545–7554 | 10 | `BattleScene._syncSiegeHudChromeVisibility` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 305 | 7555–7580 | 26 | `BattleScene._advanceToward` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 306 | 7581–7658 | 78 | `BattleScene._advanceStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 307 | 7659–7663 | 5 | `BattleScene._enemiesOf` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 308 | 7664–7682 | 19 | `BattleScene._nearestEnemy` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 309 | 7683–7701 | 19 | `BattleScene._nearestEnemyMelee` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 310 | 7702–7722 | 21 | `BattleScene._updateFacing` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 311 | 7723–7761 | 39 | `BattleScene._targetInRange` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 312 | 7762–7784 | 23 | `BattleScene._stepToward` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 313 | 7785–7799 | 15 | `BattleScene._canAttackFrom` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 314 | 7800–7820 | 21 | `BattleScene._canStrikeTargetFrom` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 315 | 7821–7876 | 56 | `BattleScene._firstStepTowardDirectedAttack` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 316 | 7877–7937 | 61 | `BattleScene._firstStepAlongPathToAttack` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 317 | 7938–7988 | 51 | `BattleScene._firstStepTowardMelee` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 318 | 7989–8082 | 94 | `BattleScene._doMove` | method | 0 | 4 | 0 | 3D | RUNDA-4 |
| 319 | 8083–8104 | 22 | `BattleScene._doAttack` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 320 | 8105–8343 | 239 | `BattleScene._singleBlow` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 321 | 8344–8360 | 17 | `BattleScene._defenderCounters` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 322 | 8361–8443 | 83 | `BattleScene._doMeleeAttack` | method | 1 | 7 | 0 | 3D | RUNDA-2 |
| 323 | 8444–8509 | 66 | `BattleScene._doRangedAttack` | method | 5 | 6 | 0 | 3D | RUNDA-2 |
| 324 | 8510–8553 | 44 | `BattleScene._startLoop` | method | 0 | 9 | 0 | 3D | RUNDA-2 |
| 325 | 8554–8566 | 13 | `BattleScene._syncRendererSize` | method | 1 | 4 | 0 | 3D | RUNDA-2 |
| 326 | 8567–8574 | 8 | `BattleScene._canvasNdc` | method | 2 | 0 | 0 | 3D | RUNDA-2 |
| 327 | 8575–8583 | 9 | `BattleScene._raycastFromCanvas` | method | 2 | 2 | 0 | 3D | RUNDA-5 |
| 328 | 8584–8601 | 18 | `BattleScene._tickProjectiles` | method | 0 | 3 | 0 | 3D | RUNDA-5 |
| 329 | 8602–8623 | 22 | `BattleScene._tickFades` | method | 1 | 3 | 0 | 3D | RUNDA-4 |
| 330 | 8624–8660 | 37 | `BattleScene._tickFloatLabels` | method | 0 | 1 | 3 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 331 | 8661–8663 | 3 | `BattleScene._now` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 332 | 8664–8676 | 13 | `BattleScene._advanceVClock` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 333 | 8677–8689 | 13 | `BattleScene._setSpeedIdx` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 334 | 8690–8694 | 5 | `BattleScene._adjustSpeedIdx` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 335 | 8695–8708 | 14 | `BattleScene._cycleSpeed` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 336 | 8709–8727 | 19 | `BattleScene._pushClash` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 337 | 8728–8753 | 26 | `BattleScene._renderClashLog` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 338 | 8754–8774 | 21 | `BattleScene._schedule` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 339 | 8775–8794 | 20 | `BattleScene._drainTimers` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 340 | 8795–8810 | 16 | `BattleScene._updateHpBar` | method | 1 | 3 | 0 | 3D | RUNDA-4 |
| 341 | 8811–8829 | 19 | `BattleScene._updateMoraleBar` | method | 1 | 3 | 0 | 3D | RUNDA-4 |
| 342 | 8830–8853 | 24 | `BattleScene._updateAmmoBar` | method | 0 | 5 | 0 | 3D | RUNDA-4 |
| 343 | 8854–8865 | 12 | `BattleScene._gainMorale` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 344 | 8866–8878 | 13 | `BattleScene._boostEnemiesOnBreak` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 345 | 8879–8880 | 2 | `BattleScene._generalMoraleAura` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 346 | 8881–8901 | 21 | `BattleScene._applyMoraleDamage` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 347 | 8902–8919 | 18 | `BattleScene._shakeAlliesOnLoss` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 348 | 8920–8941 | 22 | `BattleScene._checkMeleeScreenLost` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 349 | 8942–8957 | 16 | `BattleScene._checkRout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 350 | 8958–8999 | 42 | `BattleScene._startRout` | method | 0 | 3 | 0 | 3D | RUNDA-2 |
| 351 | 9000–9064 | 65 | `BattleScene._fleeStep` | method | 0 | 3 | 0 | 3D | RUNDA-4 |
| 352 | 9065–9081 | 17 | `BattleScene._removeUnitFromScene` | method | 0 | 6 | 0 | 3D | RUNDA-4 |
| 353 | 9082–9090 | 9 | `BattleScene._startFade` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 354 | 9091–9134 | 44 | `BattleScene._spawnDamageLabel` | method | 1 | 0 | 6 | MIX | RUNDA-3 (tylko część 3D) |
| 355 | 9135–9153 | 19 | `BattleScene._armyMoraleRatio` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 356 | 9154–9173 | 20 | `BattleScene._armyHpRatio` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 357 | 9174–9180 | 7 | `BattleScene._armyCompositionKind` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 358 | 9181–9203 | 23 | `BattleScene._sideTypeCounts` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 359 | 9204–9213 | 10 | `BattleScene._renderSideRoster` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 360 | 9214–9228 | 15 | `BattleScene._fmtBattleClock` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 361 | 9229–9284 | 56 | `BattleScene._updateArmyMoraleBars` | method | 0 | 0 | 15 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 362 | 9285–9359 | 75 | `BattleScene._checkEnd` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 363 | 9360–9370 | 11 | `BattleScene._battleUnitsForMapExport` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 364 | 9371–9384 | 14 | `BattleScene._sideEndStats` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 365 | 9385–9416 | 32 | `BattleScene._sideDisplayLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 366 | 9417–9427 | 11 | `BattleScene._liveHpLookup` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 367 | 9428–9438 | 11 | `BattleScene._battleSummaryWinner` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 368 | 9439–9467 | 29 | `BattleScene._buildBattleSummaryData` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 369 | 9468–9500 | 33 | `BattleScene._showBattleStatsOverlay` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 370 | 9501–9509 | 9 | `BattleScene._toggleBattleStatsOverlay` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 371 | 9510–9538 | 29 | `BattleScene._buildEndDetailsSide` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 372 | 9539–9567 | 29 | `BattleScene._showEndDetails` | method | 0 | 0 | 3 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 373 | 9568–9585 | 18 | `BattleScene._hideEndDetails` | method | 0 | 1 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 374 | 9586–9599 | 14 | `BattleScene._hideEndScreen` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 375 | 9600–9631 | 32 | `BattleScene._removeAllUnitsFromField` | method | 0 | 4 | 0 | 3D | RUNDA-4 |
| 376 | 9632–9645 | 14 | `BattleScene._resetSiegeForReplay` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 377 | 9646–9682 | 37 | `BattleScene._resetBattleRuntimeState` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 378 | 9683–9741 | 59 | `BattleScene._replayBattle` | method | 0 | 1 | 5 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 379 | 9742–9776 | 35 | `BattleScene._setBattleChromeForEndScreen` | method | 0 | 0 | 6 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 380 | 9777–9844 | 68 | `BattleScene._showEndScreen` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 381 | 9845–9871 | 27 | `BattleScene._showResultBanner` | method | 0 | 2 | 6 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 382 | 9872–9882 | 11 | `BattleScene._applyCamera` | method | 0 | 3 | 0 | 3D | RUNDA-2 |
| 383 | 9883–9887 | 5 | `BattleScene._setZoomTarget` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 384 | 9888–9919 | 32 | `BattleScene._tickZoom` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 385 | 9920–9941 | 22 | `BattleScene._setPanKey` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 386 | 9942–9952 | 11 | `BattleScene._clampCamTarget` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 387 | 9953–10027 | 75 | `BattleScene._tickCameraPanKeys` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 388 | 10028–10056 | 29 | `BattleScene._togglePause` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 389 | 10057–10064 | 8 | `BattleScene._toggleSfx` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 390 | 10065–10073 | 9 | `BattleScene._toggleMusic` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 391 | 10074–10085 | 12 | `BattleScene._applyAudioGains` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 392 | 10086–10091 | 6 | `BattleScene._refreshAudioBtns` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 393 | 10092–10102 | 11 | `BattleScene._updateRightRailLayout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 394 | 10103–10127 | 25 | `BattleScene._ensureAudio` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 395 | 10128–10130 | 3 | `BattleScene._ambBaseGain` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 396 | 10131–10142 | 12 | `BattleScene._noiseBuf` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 397 | 10143–10148 | 6 | `BattleScene._sfxOff` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 398 | 10149–10185 | 37 | `BattleScene._sfxMelee` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 399 | 10186–10221 | 36 | `BattleScene._sfxShot` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 400 | 10222–10239 | 18 | `BattleScene._sfxDeath` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 401 | 10240–10258 | 19 | `BattleScene._sfxRout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 402 | 10259–10281 | 23 | `BattleScene._sfxVictory` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 403 | 10282–10371 | 90 | `BattleScene._startAmbient` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 404 | 10372–10392 | 21 | `BattleScene._teardownAudio` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 405 | 10393–10409 | 17 | `BattleScene._flashSpeedHud` | method | 0 | 0 | 5 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 406 | 10410–10416 | 7 | `BattleScene._isManualInputActive` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 407 | 10417–10424 | 8 | `BattleScene._primarySelectedUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 408 | 10425–10436 | 12 | `BattleScene._unitCanRangedAttack` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 409 | 10437–10455 | 19 | `BattleScene._pickGroundTile` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 410 | 10456–10461 | 6 | `BattleScene._worldAtTile` | method | 2 | 0 | 0 | 3D | RUNDA-5 |
| 411 | 10462–10467 | 6 | `BattleScene._unitWorldPos` | method | 1 | 1 | 0 | 3D | RUNDA-5 |
| 412 | 10468–10479 | 12 | `BattleScene._disposeOrderArrowGroup` | method | 2 | 4 | 0 | 3D | RUNDA-4 |
| 413 | 10480–10523 | 44 | `BattleScene._makeOrderArrow` | method | 13 | 9 | 0 | 3D | RUNDA-4 |
| 414 | 10524–10532 | 9 | `BattleScene._clearOrderPreview` | method | 1 | 1 | 0 | 3D | RUNDA-3 |
| 415 | 10533–10541 | 9 | `BattleScene._disposeQueuedOrderArrows` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 416 | 10542–10547 | 6 | `BattleScene._disposeAllOrderLines` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 417 | 10548–10556 | 9 | `BattleScene._moveTargetForUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 418 | 10557–10597 | 41 | `BattleScene._moveDestinationsForSelection` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 419 | 10598–10625 | 28 | `BattleScene._orderMoveForUnits` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 420 | 10626–10648 | 23 | `BattleScene._refreshQueuedOrderVisuals` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 421 | 10649–10654 | 6 | `BattleScene._addOrderPreviewArrow` | method | 2 | 1 | 0 | 3D | RUNDA-4 |
| 422 | 10655–10682 | 28 | `BattleScene._updateBattleCursor` | method | 0 | 0 | 12 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 423 | 10683–10753 | 71 | `BattleScene._updateOrderPreview` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 424 | 10754–10764 | 11 | `BattleScene._unitsMergeCompatible` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 425 | 10765–10808 | 44 | `BattleScene._tryMergeWounded` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 426 | 10809–10828 | 20 | `BattleScene._mergeSelectedWounded` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 427 | 10829–10861 | 33 | `BattleScene._attachRosterMergeDrag` | method | 0 | 0 | 4 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 428 | 10862–10988 | 127 | `BattleScene._buildMinimapOverlay` | method | 0 | 0 | 43 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 429 | 10989–11016 | 28 | `BattleScene._syncTempoPanelHighlight` | method | 0 | 0 | 4 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 430 | 11017–11022 | 6 | `BattleScene._syncMinimapPhaseChrome` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 431 | 11023–11048 | 26 | `BattleScene._collectMinimapData` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 432 | 11049–11066 | 18 | `BattleScene._computeMinimapViewport` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 433 | 11067–11073 | 7 | `BattleScene._drawMinimap` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 434 | 11074–11083 | 10 | `BattleScene._unitRoleLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 435 | 11084–11109 | 26 | `BattleScene._pickUnitAtScreen` | method | 1 | 0 | 0 | 3D | RUNDA-5 |
| 436 | 11110–11124 | 15 | `BattleScene._clearHoverTooltip` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 437 | 11125–11140 | 16 | `BattleScene._unitPostawaLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 438 | 11141–11216 | 76 | `BattleScene._unitTooltipHtml` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 439 | 11217–11497 | 281 | `BattleScene._showHoverTooltip` | method | 0 | 0 | 17 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 440 | 11498–11501 | 4 | `BattleScene._findUnitById` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 441 | 11502–11506 | 5 | `BattleScene._playerControlSide` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 442 | 11507–11512 | 6 | `BattleScene._playerWonFromBattleWinner` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 443 | 11513–11521 | 9 | `BattleScene._civLabelForSide` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 444 | 11522–11525 | 4 | `BattleScene._civLabelForSideExplicit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 445 | 11526–11529 | 4 | `BattleScene._isPlayerSide` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 446 | 11530–11533 | 4 | `BattleScene._playerRoster` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 447 | 11534–11537 | 4 | `BattleScene._enemyRoster` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 448 | 11538–11541 | 4 | `BattleScene._findPlayerUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 449 | 11542–11548 | 7 | `BattleScene._groupRegistryRoster` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 450 | 11549–11554 | 6 | `BattleScene._inDeployPlayerZone` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 451 | 11555–11567 | 13 | `BattleScene._clampDeployPlayerCol` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 452 | 11568–11682 | 115 | `BattleScene._buildDeployZone` | method | 18 | 22 | 0 | 3D | RUNDA-2 |
| 453 | 11683–11686 | 4 | `BattleScene._buildDeployHalfLabels` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 454 | 11687–11694 | 8 | `BattleScene._removeDeployHalfLabels` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 455 | 11695–11704 | 10 | `BattleScene._setDeployZoneVisible` | method | 0 | 2 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 456 | 11705–11941 | 237 | `BattleScene._buildDeployToolbar` | method | 0 | 0 | 79 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 457 | 11942–11949 | 8 | `BattleScene._mountDeployIconRow` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 458 | 11950–11994 | 45 | `BattleScene._makeDeployToolbarDropdown` | method | 0 | 0 | 19 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 459 | 11995–12011 | 17 | `BattleScene._positionDeployDropdownPopup` | method | 0 | 0 | 6 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 460 | 12012–12032 | 21 | `BattleScene._toggleDeployDropdown` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 461 | 12033–12040 | 8 | `BattleScene._closeDeployDropdowns` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 462 | 12041–12056 | 16 | `BattleScene._paintDeployMainButtons` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 463 | 12057–12062 | 6 | `BattleScene._deployFormationShortLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 464 | 12063–12067 | 5 | `BattleScene._deployCavalryShortLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 465 | 12068–12074 | 7 | `BattleScene._deployAttackDirShortLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 466 | 12075–12134 | 60 | `BattleScene._updateDeployToolbarStatus` | method | 0 | 0 | 21 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 467 | 12135–12149 | 15 | `BattleScene._resolveDeployPopupGroupId` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 468 | 12150–12153 | 4 | `BattleScene._priorityShortLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 469 | 12154–12215 | 62 | `BattleScene._appendDeployPriorityBlock` | method | 0 | 0 | 22 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 470 | 12216–12295 | 80 | `BattleScene._renderDeployTacticsPopup` | method | 0 | 0 | 31 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 471 | 12296–12525 | 230 | `BattleScene._renderDeployStrategyPopup` | method | 0 | 0 | 72 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 472 | 12526–12584 | 59 | `BattleScene._renderDeployLinesPopup` | method | 0 | 0 | 16 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 473 | 12585–12591 | 7 | `BattleScene._selectionTypeCountsHtml` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 474 | 12592–12598 | 7 | `BattleScene._updateDeployRosterCountLine` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 475 | 12599–12654 | 56 | `BattleScene._updateDeployToolbarSelection` | method | 0 | 0 | 9 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 476 | 12655–12709 | 55 | `BattleScene._bindDeployRosterChromeClicks` | method | 0 | 0 | 4 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 477 | 12710–12726 | 17 | `BattleScene._handleDeployGroupTabClick` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 478 | 12727–12746 | 20 | `BattleScene._makeDeployGroupTab` | method | 0 | 0 | 4 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 479 | 12747–12794 | 48 | `BattleScene._updateDeployRosterFooter` | method | 0 | 0 | 15 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 480 | 12795–12819 | 25 | `BattleScene._makeDeployFmtButton` | method | 0 | 0 | 5 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 481 | 12820–12843 | 24 | `BattleScene._makeDeployCavButton` | method | 0 | 0 | 5 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 482 | 12844–12855 | 12 | `BattleScene._showDeployFmtFeedback` | method | 0 | 0 | 5 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 483 | 12856–12927 | 72 | `BattleScene._initDeployUI` | method | 0 | 3 | 9 | MIX | RUNDA-2 (tylko część 3D) |
| 484 | 12928–12932 | 5 | `BattleScene._rosterBottomInsetPx` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 485 | 12933–12942 | 10 | `BattleScene._syncRosterBottomInset` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 486 | 12943–12947 | 5 | `BattleScene._battlePowerStackBottomPx` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 487 | 12948–12967 | 20 | `BattleScene._syncSiegeHudLayout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 488 | 12968–12997 | 30 | `BattleScene._restoreDeployGroupSnapshot` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 489 | 12998–13014 | 17 | `BattleScene._restoreDeployAttackDirSnapshot` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 490 | 13015–13034 | 20 | `BattleScene._autoGroupDeployByKind` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 491 | 13035–13108 | 74 | `BattleScene._ensureDeployC09Chrome` | method | 0 | 1 | 27 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 492 | 13109–13123 | 15 | `BattleScene._normalizeDeployRosterChromeOrder` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 493 | 13124–13127 | 4 | `BattleScene._ensureDeployRosterUnitBar` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 494 | 13128–13284 | 157 | `BattleScene._buildDeployRosterDock` | method | 0 | 0 | 47 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 495 | 13285–13298 | 14 | `BattleScene._rosterScrollAvailH` | method | 0 | 0 | 3 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 496 | 13299–13314 | 16 | `BattleScene._rosterScrollAvailW` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 497 | 13315–13338 | 24 | `BattleScene._layoutRosterCardGrid` | method | 0 | 0 | 3 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 498 | 13339–13354 | 16 | `BattleScene._syncRosterEmptySlots` | method | 0 | 1 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 499 | 13355–13386 | 32 | `BattleScene._applyRosterCardMetrics` | method | 0 | 0 | 20 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 500 | 13387–13419 | 33 | `BattleScene._syncDeployPanelLayout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 501 | 13420–13433 | 14 | `BattleScene._syncRosterColumnLayout` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 502 | 13434–13464 | 31 | `BattleScene._syncRosterGroupLayouts` | method | 0 | 0 | 8 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 503 | 13465–13479 | 15 | `BattleScene._ensureBattleLooseCardsContainer` | method | 0 | 0 | 5 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 504 | 13480–13499 | 20 | `BattleScene._syncBattleRosterPanelLayout` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 505 | 13500–13532 | 33 | `BattleScene._rebindDeployToolbarRefs` | method | 0 | 0 | 6 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 506 | 13533–13580 | 48 | `BattleScene._syncBattleToolbarMode` | method | 0 | 0 | 11 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 507 | 13581–13598 | 18 | `BattleScene._deployRosterRightEdgePx` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 508 | 13599–13608 | 10 | `BattleScene._syncDeployToolbarOffset` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 509 | 13609–13627 | 19 | `BattleScene._syncMinimapPosition` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 510 | 13628–13632 | 5 | `BattleScene._deployRowKind` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 511 | 13633–13645 | 13 | `BattleScene._sortedDeployUnits` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 512 | 13646–13655 | 10 | `BattleScene._rebuildDeployRosterGrid` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 513 | 13656–13721 | 66 | `BattleScene._rebuildDeployRosterGridInner` | method | 0 | 1 | 7 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 514 | 13722–13753 | 32 | `BattleScene._countRosterLayoutSlots` | method | 0 | 1 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 515 | 13754–13845 | 92 | `BattleScene._createRosterGroupBlock` | method | 0 | 0 | 34 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 516 | 13846–13854 | 9 | `BattleScene._refreshDeployGroupHeaderLabels` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 517 | 13855–13881 | 27 | `BattleScene._updateRosterGroupHeaderLabel` | method | 0 | 0 | 7 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 518 | 13882–13892 | 11 | `BattleScene._expandAllDeployGroups` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 519 | 13893–13898 | 6 | `BattleScene._syncDeployRosterGroupVisibility` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 520 | 13899–13904 | 6 | `BattleScene._toggleRosterGroupCollapsed` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 521 | 13905–13921 | 17 | `BattleScene._applyRosterGroupCollapse` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 522 | 13922–13930 | 9 | `BattleScene._createTwGroupTab` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 523 | 13931–13937 | 7 | `BattleScene._paintTwGroupTabs` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 524 | 13938–13944 | 7 | `BattleScene._setDeployActiveFormation` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 525 | 13945–13979 | 35 | `BattleScene._syncDeployToolbarFromSelection` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 526 | 13980–13986 | 7 | `BattleScene._setDeployCavalryMode` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 527 | 13987–13992 | 6 | `BattleScene._setDeployAttackDirection` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 528 | 13993–13998 | 6 | `BattleScene._setDeployMeleeLines` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 529 | 13999–14005 | 7 | `BattleScene._setDeployArcherLines` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 530 | 14006–14012 | 7 | `BattleScene._deployLinesForRole` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 531 | 14013–14024 | 12 | `BattleScene._syncDeployLinesButtons` | method | 0 | 0 | 3 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 532 | 14025–14049 | 25 | `BattleScene._applyDeployLineSettings` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 533 | 14050–14060 | 11 | `BattleScene._syncDeployFormationButtons` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 534 | 14061–14071 | 11 | `BattleScene._syncDeployCavalryButtons` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 535 | 14072–14082 | 11 | `BattleScene._syncDeployAttackDirectionButtons` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 536 | 14083–14121 | 39 | `BattleScene._ensureDeployRowRefs` | method | 0 | 0 | 15 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 537 | 14122–14136 | 15 | `BattleScene._recoverDeployRosterDock` | method | 0 | 1 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 538 | 14137–14154 | 18 | `BattleScene._deploySpreadRank` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 539 | 14155–14159 | 5 | `BattleScene._updateDeployRowCounts` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 540 | 14160–14254 | 95 | `BattleScene._createDeployRosterCard` | method | 0 | 0 | 34 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 541 | 14255–14261 | 7 | `BattleScene._unitStatVal` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 542 | 14262–14266 | 5 | `BattleScene._updateDeployDetailPanel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 543 | 14267–14321 | 55 | `BattleScene._updateDeployRosterHeader` | method | 0 | 0 | 24 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 544 | 14322–14327 | 6 | `BattleScene._selectionInputActive` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 545 | 14328–14336 | 9 | `BattleScene._isShortPointerClick` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 546 | 14337–14347 | 11 | `BattleScene._deselectOnRightClick` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 547 | 14348–14368 | 21 | `BattleScene._clearDeploySelectionState` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 548 | 14369–14412 | 44 | `BattleScene._handleDeployUnitPick` | method | 0 | 4 | 0 | 3D | RUNDA-5 |
| 549 | 14413–14419 | 7 | `BattleScene._groupDisplayNum` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 550 | 14420–14425 | 6 | `BattleScene._groupDisplayLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 551 | 14426–14453 | 28 | `BattleScene._pruneStaleGroups` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 552 | 14454–14465 | 12 | `BattleScene._nextFreeGroupId` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 553 | 14466–14479 | 14 | `BattleScene._sortedGroupIds` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 554 | 14480–14498 | 19 | `BattleScene._liveGroupMemberIds` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 555 | 14499–14508 | 10 | `BattleScene._syncGroupRegistry` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 556 | 14509–14529 | 21 | `BattleScene._selectDeployUnitsByIds` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 557 | 14530–14534 | 5 | `BattleScene._selectDeployGroupById` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 558 | 14535–14542 | 8 | `BattleScene._selectDeployByKind` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 559 | 14543–14554 | 12 | `BattleScene._selectDeployByKindToggle` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 560 | 14555–14560 | 6 | `BattleScene._selectDeployAll` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 561 | 14561–14578 | 18 | `BattleScene._selectDeployAllToggle` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 562 | 14579–14622 | 44 | `BattleScene._selectDeployGroupToggle` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 563 | 14623–14629 | 7 | `BattleScene._isDeploySelectionExactlyGroup` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 564 | 14630–14635 | 6 | `BattleScene._selectableAtkUnits` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 565 | 14636–14644 | 9 | `BattleScene._isDeploySelectionExactlyKind` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 566 | 14645–14655 | 11 | `BattleScene._isDeploySelectionAll` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 567 | 14656–14723 | 68 | `BattleScene._makeDeployQuickBtn` | method | 0 | 0 | 14 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 568 | 14724–14785 | 62 | `BattleScene._updateDeployQuickSelectBar` | method | 0 | 0 | 13 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 569 | 14786–14798 | 13 | `BattleScene._buildDeployGroupManagerRail` | method | 0 | 0 | 6 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 570 | 14799–14814 | 16 | `BattleScene._syncDeployGroupManagerRailLayout` | method | 0 | 0 | 4 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 571 | 14815–14840 | 26 | `BattleScene._updateDeployGroupsBar` | method | 0 | 0 | 6 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 572 | 14841–14855 | 15 | `BattleScene._updateDeployStrategyBar` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 573 | 14856–14875 | 20 | `BattleScene._ensureGroupSelectorBar` | method | 0 | 0 | 9 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 574 | 14876–14888 | 13 | `BattleScene._updateGroupSelectorBarLayout` | method | 0 | 0 | 5 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 575 | 14889–14896 | 8 | `BattleScene._updateGroupSelectorBar` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 576 | 14897–14906 | 10 | `BattleScene._rebuildBattleRosterGrid` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 577 | 14907–14966 | 60 | `BattleScene._rebuildBattleRosterGridInner` | method | 0 | 1 | 7 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 578 | 14967–14994 | 28 | `BattleScene._refreshDeploySelectionVisuals` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 579 | 14995–15062 | 68 | `BattleScene._teardownDeployUI` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 580 | 15063–15152 | 90 | `BattleScene._onDeployClick` | method | 1 | 0 | 0 | 3D | RUNDA-5 |
| 581 | 15153–15212 | 60 | `BattleScene._moveDeploySelection` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 582 | 15213–15223 | 11 | `BattleScene._initDeployGhostLayer` | method | 1 | 5 | 0 | 3D | RUNDA-3 |
| 583 | 15224–15229 | 6 | `BattleScene._getDeploySelectedUnits` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 584 | 15230–15245 | 16 | `BattleScene._clearDeployGhosts` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 585 | 15246–15276 | 31 | `BattleScene._appendDeployCellOutline` | method | 9 | 1 | 0 | 3D | RUNDA-2 |
| 586 | 15277–15297 | 21 | `BattleScene._updateDeployPlacementPreview` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 587 | 15298–15328 | 31 | `BattleScene._computeDeployPlacementLayout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 588 | 15329–15345 | 17 | `BattleScene._inferDefaultFormation` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 589 | 15346–15353 | 8 | `BattleScene._inferDefaultFormationForGroup` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 590 | 15354–15363 | 10 | `BattleScene._formationForDeployUnits` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 591 | 15364–15372 | 9 | `BattleScene._cavalryModeForDeployUnits` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 592 | 15373–15382 | 10 | `BattleScene._deployRoleOf` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 593 | 15383–15441 | 59 | `BattleScene._deployFormationPlan` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 594 | 15442–15446 | 5 | `BattleScene._computeRanksPerBandFromDepthSpan` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 595 | 15447–15459 | 13 | `BattleScene._splitUnitsIntoRanks` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 596 | 15460–15471 | 12 | `BattleScene._deployLateralRow` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 597 | 15472–15475 | 4 | `BattleScene._colOffForFormation` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 598 | 15476–15489 | 14 | `BattleScene._clampDeployCell` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 599 | 15490–15504 | 15 | `BattleScene._clampDeployFormationAnchor` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 600 | 15505–15519 | 15 | `BattleScene._deployDestinationsWithOffsets` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 601 | 15520–15573 | 54 | `BattleScene._formationSlotsForUnits` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 602 | 15574–15588 | 15 | `BattleScene._computeFormationLayoutAt` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 603 | 15589–15598 | 10 | `BattleScene._sortUnitsForDeployStretch` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 604 | 15599–15605 | 7 | `BattleScene._persistFormationOffsets` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 605 | 15606–15642 | 37 | `BattleScene._applyDeployPlacement` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 606 | 15643–15726 | 84 | `BattleScene._computeDeployStretchLayout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 607 | 15727–15736 | 10 | `BattleScene._computeDeployGhostLayout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 608 | 15737–15743 | 7 | `BattleScene._isDeployCellOk` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 609 | 15744–15763 | 20 | `BattleScene._resolveDeployCell` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 610 | 15764–15799 | 36 | `BattleScene._placeDeployLayoutUnits` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 611 | 15800–15810 | 11 | `BattleScene._applyDeployLayout` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 612 | 15811–15906 | 96 | `BattleScene._refreshDeployGhosts` | method | 12 | 13 | 0 | 3D | RUNDA-3 |
| 613 | 15907–15957 | 51 | `BattleScene._refreshDeployGhostsAt` | method | 4 | 4 | 0 | 3D | RUNDA-3 |
| 614 | 15958–15994 | 37 | `BattleScene._applyDeployArmyFormation` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 615 | 15995–16028 | 34 | `BattleScene._applyDeployCavalryMode` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 616 | 16029–16053 | 25 | `BattleScene._applyDeployAttackDirection` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 617 | 16054–16071 | 18 | `BattleScene._resolveDeployFormationTargets` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 618 | 16072–16080 | 9 | `BattleScene._setDeploySelection` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 619 | 16081–16091 | 11 | `BattleScene._clearDeploySelection` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 620 | 16092–16110 | 19 | `BattleScene._moveDeployUnit` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 621 | 16111–16115 | 5 | `BattleScene._resetDeployPlayer` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 622 | 16116–16119 | 4 | `BattleScene._resetDeployAttacker` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 623 | 16120–16142 | 23 | `BattleScene._resetDeploySide` | method | 0 | 4 | 0 | 3D | RUNDA-2 |
| 624 | 16143–16355 | 213 | `BattleScene._placeUnitsOneSide` | method | 8 | 14 | 0 | 3D | RUNDA-3 |
| 625 | 16356–16363 | 8 | `BattleScene._placeUnitsAtkOnly` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 626 | 16364–16394 | 31 | `BattleScene._endDeployPhase` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 627 | 16395–16409 | 15 | `BattleScene._haltAutoBattleTurn` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 628 | 16410–16497 | 88 | `BattleScene._toggleManualMode` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 629 | 16498–16530 | 33 | `BattleScene._doBoxSelect` | method | 0 | 3 | 0 | 3D | RUNDA-3 |
| 630 | 16531–16535 | 5 | `BattleScene._adjacentEnemy` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 631 | 16536–16541 | 6 | `BattleScene._unitBattleClass` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 632 | 16542–16545 | 4 | `BattleScene._battleClassLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 633 | 16546–16561 | 16 | `BattleScene._prefsForUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 634 | 16562–16572 | 11 | `BattleScene._priorityScore` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 635 | 16573–16594 | 22 | `BattleScene._pickTargetByPriority` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 636 | 16595–16620 | 26 | `BattleScene._pickAdjacentTargetByPriority` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 637 | 16621–16635 | 15 | `BattleScene._pickRangedTargetByPriority` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 638 | 16636–16644 | 9 | `BattleScene._ensureGroupMeta` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 639 | 16645–16649 | 5 | `BattleScene._unitDisplayLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 640 | 16650–16661 | 12 | `BattleScene._resolveDeployPopupUnits` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 641 | 16662–16670 | 9 | `BattleScene._getEffectiveDoctrine` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 642 | 16671–16682 | 12 | `BattleScene._isUnitDoctrineAuto` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 643 | 16683–16707 | 25 | `BattleScene._effectiveMetaForUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 644 | 16708–16715 | 8 | `BattleScene._applySkirmishFlagsForUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 645 | 16716–16735 | 20 | `BattleScene._setUnitsDoctrine` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 646 | 16736–16747 | 12 | `BattleScene._groupCentroid` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 647 | 16748–16756 | 9 | `BattleScene._doctrineLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 648 | 16757–16785 | 29 | `BattleScene._attackFormationRallyPoint` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 649 | 16786–16827 | 42 | `BattleScene._bestChargeStepKey` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 650 | 16828–16849 | 22 | `BattleScene._chargeMoveDest` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 651 | 16850–16858 | 9 | `BattleScene._groupHasRanged` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 652 | 16859–16866 | 8 | `BattleScene._destAllowedByBlockade` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 653 | 16867–16878 | 12 | `BattleScene._applySkirmishFlags` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 654 | 16879–16889 | 11 | `BattleScene._setLineBlockade` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 655 | 16890–16913 | 24 | `BattleScene._setLineBlockadeFromSelection` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 656 | 16914–16980 | 67 | `BattleScene._setGroupDoctrine` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 657 | 16981–17015 | 35 | `BattleScene._doctrineMoveDest` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 658 | 17016–17085 | 70 | `BattleScene._executeGroupDoctrineStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 659 | 17086–17124 | 39 | `BattleScene._executeSkirmishDoctrineStep` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 660 | 17125–17129 | 5 | `BattleScene._generalPanelSectionTitle` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 661 | 17130–17136 | 7 | `BattleScene._generalDoctrineBtnHtml` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 662 | 17137–17198 | 62 | `BattleScene._buildGeneralPanelBodyHtml` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 663 | 17199–17230 | 32 | `BattleScene._wireGeneralPanelEvents` | method | 0 | 0 | 8 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 664 | 17231–17239 | 9 | `BattleScene._refreshGeneralPanelBody` | method | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 665 | 17240–17270 | 31 | `BattleScene._toggleGeneralPanel` | method | 0 | 1 | 7 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 666 | 17271–17278 | 8 | `BattleScene._toggleTargetPriorityPanel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 667 | 17279–17365 | 87 | `BattleScene._performPlayerOrder` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 668 | 17366–17404 | 39 | `BattleScene._executeUnitsImmediate` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 669 | 17405–17422 | 18 | `BattleScene._collectOrderUnitIds` | method | 0 | 3 | 0 | 3D | RUNDA-3 |
| 670 | 17423–17441 | 19 | `BattleScene._issueBattleAttack` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 671 | 17442–17470 | 29 | `BattleScene._issueBattleMove` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 672 | 17471–17490 | 20 | `BattleScene._refreshBattleMoveGhosts` | method | 1 | 1 | 0 | 3D | RUNDA-4 |
| 673 | 17491–17509 | 19 | `BattleScene._addBattleGhostDisc` | method | 4 | 3 | 0 | 3D | RUNDA-3 |
| 674 | 17510–17578 | 69 | `BattleScene._onBattleClick` | method | 1 | 0 | 0 | 3D | RUNDA-5 |
| 675 | 17579–17595 | 17 | `BattleScene._toggleSelectUnit` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 676 | 17596–17612 | 17 | `BattleScene._selectGroup` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 677 | 17613–17630 | 18 | `BattleScene._clearAllSelection` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 678 | 17631–17646 | 16 | `BattleScene._addSelectionRing` | method | 3 | 3 | 0 | 3D | RUNDA-3 |
| 679 | 17647–17654 | 8 | `BattleScene._removeSelectionRing` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 680 | 17655–17665 | 11 | `BattleScene._orderHoldSelected` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 681 | 17666–17673 | 8 | `BattleScene._showOrderFeedback` | method | 0 | 0 | 4 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 682 | 17674–17705 | 32 | `BattleScene._showDeployFeedback` | method | 0 | 0 | 13 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 683 | 17706–17719 | 14 | `BattleScene._orderRetreatSelected` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 684 | 17720–17729 | 10 | `BattleScene._updateSelectedPanel` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 685 | 17730–17744 | 15 | `BattleScene._orderLabel` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 686 | 17745–17762 | 18 | `BattleScene._unitTypeIcon` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 687 | 17763–17769 | 7 | `BattleScene._updateBattleRosterCountLine` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 688 | 17770–17848 | 79 | `BattleScene._updateBattleSelectionBar` | method | 0 | 0 | 28 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 689 | 17849–17865 | 17 | `BattleScene._updateBattleRosterHeader` | method | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 690 | 17866–17987 | 122 | `BattleScene._ensureBattleRosterChrome` | method | 0 | 1 | 47 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 691 | 17988–18119 | 132 | `BattleScene._buildRosterBar` | method | 0 | 0 | 40 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 692 | 18120–18129 | 10 | `BattleScene._rebuildRosterBar` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 693 | 18130–18303 | 174 | `BattleScene._createUnitCard` | method | 0 | 0 | 46 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 694 | 18304–18487 | 184 | `BattleScene._updateRosterBar` | method | 0 | 0 | 47 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 695 | 18488–18513 | 26 | `BattleScene._detachUnitsFromGroups` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 696 | 18514–18581 | 68 | `BattleScene._groupSelected` | method | 0 | 2 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 697 | 18582–18599 | 18 | `BattleScene._disbandGroup` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 698 | 18600–18633 | 34 | `BattleScene._ungroupSelected` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 699 | 18634–18646 | 13 | `BattleScene._refreshUnitRingColor` | method | 1 | 2 | 0 | 3D | RUNDA-3 |
| 700 | 18647–18667 | 21 | `BattleScene._makeGroupNumberTexture` | method | 2 | 0 | 3 | MIX | RUNDA-2 (tylko część 3D) |
| 701 | 18668–18683 | 16 | `BattleScene._removeGroupFrameMarker` | method | 3 | 5 | 0 | 3D | RUNDA-4 |
| 702 | 18684–18730 | 47 | `BattleScene._updateGroupFrameMarker` | method | 11 | 5 | 0 | 3D | RUNDA-4 |
| 703 | 18731–18741 | 11 | `BattleScene._syncAllGroupFrameMarkers` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 704 | 18742–18746 | 5 | `BattleScene._battleRosterOrder` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 705 | 18747–18768 | 22 | `BattleScene._selectBattleUnitsByIds` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 706 | 18769–18789 | 21 | `BattleScene._selectBattleGroupToggle` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 707 | 18790–18804 | 15 | `BattleScene._selectBattleGroupReplace` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 708 | 18805–18826 | 22 | `BattleScene._advanceToNextBattleUnit` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 709 | 18827–18852 | 26 | `BattleScene._handleBattleUnitPick` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 710 | 18853–18859 | 7 | `BattleScene._ensureBattleQuickSelectBar` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 711 | 18860–18954 | 95 | `BattleScene._updateBattleQuickSelectBar` | method | 0 | 0 | 14 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 712 | 18955–18974 | 20 | `BattleScene._selectBattleByKindToggle` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 713 | 18975–18995 | 21 | `BattleScene._showBattleRosterFeedback` | method | 0 | 0 | 6 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 714 | 18996–19030 | 35 | `BattleScene._toggleSelectUnitOrGroup` | method | 0 | 1 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 715 | 19031–19044 | 14 | `BattleScene._isWholeGroupSelected` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 716 | 19045–19057 | 13 | `BattleScene._orderGroupMove` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 717 | 19058–19078 | 21 | `BattleScene._applyGroupFormation` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 718 | 19079–19122 | 44 | `BattleScene._applyFormationToUnits` | method | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 719 | 19123–19320 | 198 | `computeInstantResult` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 720 | 19321–19342 | 22 | `makeFallbackAvatar` | function | 7 | 6 | 0 | 3D | RUNDA-3 |
| 721 | 19343–19418 | 76 | `makeUnitBars` | function | 29 | 25 | 0 | 3D | RUNDA-3 |
| 722 | 19419–19437 | 19 | `worldToScreen` | function | 2 | 2 | 1 | MIX | RUNDA-5 (tylko część 3D) |
| 723 | 19438–19438 | 1 | `lerp` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 724 | 19439–19439 | 1 | `easeOut` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 725 | 19440–19441 | 2 | `easeIn` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 726 | 19442–19451 | 10 | `lighten` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 727 | 19452–19460 | 9 | `blend` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 728 | 19461–19467 | 7 | `escapeHtml` | function | 0 | 0 | 0 | LOG | NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2 |
| 729 | 19468–19476 | 9 | `isEditableTarget` | function | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 730 | 19477–19490 | 14 | `styleButton` | function | 0 | 0 | 2 | UI | NIE-DOTYCZY → P5 (UI DOM) |
| 731 | 19491–19494 | 4 | `styleDeployBtn` | function | 0 | 0 | 1 | UI | NIE-DOTYCZY → P5 (UI DOM) |
