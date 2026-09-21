# 01-operator — semantyczne etykiety macierzy cywilizacji

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1
GOAL: Normal-only semantic profile with signed labels and proven Greece consumers.
BASE: f4c89d0081c622c16b207d338b49c8bacafc4553
SCOPE: 113 parametrów × 15 cywilizacji = 1695 komórek

## Wykonano
- Dodano czysty, niemutujący classifier Normal median + signed intensity.
- Dodano pełny profil 113 wierszy w wyborze cywilizacji: aktywne domyślnie, reszta w jednym rozwijanym panelu, wyszukiwanie i filtr.
- Brak fallbacku do Grecji dla nieznanej cywilizacji lub brakującej wartości.
- AI/relacje pozostają neutralnym badge z osobnym statusem/opisem.
- Etykiety nie są zapisywane w stanie gry ani w sejwie.

## Bramki konsumentów
- REAL_GAMEPLAY: 11 parametrów / 165 komórek.
- UI_ONLY: 5 parametrów / 75 komórek.
- DECISION_REQUIRED/UNWIRED: 97 parametrów / 1455 komórek.
- Dla każdego UNWIRED w allocation.json zapisano aktora, warunek, formułę, precedencję i test jako nierozstrzygnięte; nie wymyślono konsumenta.

## Status per parametr
| # | Parametr | Status | Polaryzacja | Greece call-site |
|---:|---|---|---|---|
| 1 | `meta_epoka_kamien` | UNWIRED / D_REQUIRED-001 | beneficial | brak |
| 2 | `meta_epoka_braz` | UNWIRED / D_REQUIRED-002 | beneficial | brak |
| 3 | `meta_epoka_zelazo` | UNWIRED / D_REQUIRED-003 | beneficial | brak |
| 4 | `meta_mnoznik_waluta` | UNWIRED / D_REQUIRED-004 | beneficial | brak |
| 5 | `meta_tier_roster` | UNWIRED / D_REQUIRED-005 | beneficial | brak |
| 6 | `walka_atak_piechota` | UNWIRED / D_REQUIRED-006 | beneficial | brak |
| 7 | `walka_atak_lukownicy` | UNWIRED / D_REQUIRED-007 | beneficial | brak |
| 8 | `walka_atak_kawaleria` | UNWIRED / D_REQUIRED-008 | beneficial | brak |
| 9 | `walka_atak_rydwany` | UNWIRED / D_REQUIRED-009 | beneficial | brak |
| 10 | `walka_atak_obleczenie` | UNWIRED / D_REQUIRED-010 | beneficial | brak |
| 11 | `walka_atak_morska` | UNWIRED / D_REQUIRED-011 | beneficial | brak |
| 12 | `walka_atak_wszystkie` | UNWIRED / D_REQUIRED-012 | beneficial | brak |
| 13 | `walka_obrona_piechota` | UNWIRED / D_REQUIRED-013 | beneficial | brak |
| 14 | `walka_obrona_lukownicy` | UNWIRED / D_REQUIRED-014 | beneficial | brak |
| 15 | `walka_obrona_kawaleria` | UNWIRED / D_REQUIRED-015 | beneficial | brak |
| 16 | `walka_obrona_rydwany` | UNWIRED / D_REQUIRED-016 | beneficial | brak |
| 17 | `walka_obrona_obleczenie` | UNWIRED / D_REQUIRED-017 | beneficial | brak |
| 18 | `walka_obrona_morska` | UNWIRED / D_REQUIRED-018 | beneficial | brak |
| 19 | `walka_pancerz_piechota` | UNWIRED / D_REQUIRED-019 | beneficial | brak |
| 20 | `walka_pancerz_lukownicy` | UNWIRED / D_REQUIRED-020 | beneficial | brak |
| 21 | `walka_pancerz_kawaleria` | UNWIRED / D_REQUIRED-021 | beneficial | brak |
| 22 | `walka_pancerz_rydwany` | UNWIRED / D_REQUIRED-022 | beneficial | brak |
| 23 | `walka_uderzenie_piechota` | UNWIRED / D_REQUIRED-023 | beneficial | brak |
| 24 | `walka_uderzenie_kawaleria` | UNWIRED / D_REQUIRED-024 | beneficial | brak |
| 25 | `walka_uderzenie_rydwany` | UNWIRED / D_REQUIRED-025 | beneficial | brak |
| 26 | `walka_dystans_lukownicy` | UNWIRED / D_REQUIRED-026 | beneficial | brak |
| 27 | `walka_dystans_rydwany` | UNWIRED / D_REQUIRED-027 | beneficial | brak |
| 28 | `walka_hp_piechota` | UNWIRED / D_REQUIRED-028 | beneficial | brak |
| 29 | `walka_hp_kawaleria` | UNWIRED / D_REQUIRED-029 | beneficial | brak |
| 30 | `walka_hp_rydwany` | UNWIRED / D_REQUIRED-030 | beneficial | brak |
| 31 | `walka_ruch_bitwa_proc` | UNWIRED / D_REQUIRED-031 | beneficial | brak |
| 32 | `walka_zasieg_proc` | UNWIRED / D_REQUIRED-032 | beneficial | brak |
| 33 | `walka_oblezenie_proc` | UNWIRED / D_REQUIRED-033 | beneficial | brak |
| 34 | `walka_koszt_rekrutacji_proc` | UNWIRED / D_REQUIRED-034 | harmful | brak |
| 35 | `walka_atak_piechota_teren_las` | UNWIRED / D_REQUIRED-035 | beneficial | brak |
| 36 | `walka_obrona_piechota_teren_las` | UNWIRED / D_REQUIRED-036 | beneficial | brak |
| 37 | `walka_atak_piechota_terytorium_wlasne` | UNWIRED / D_REQUIRED-037 | beneficial | brak |
| 38 | `walka_obrona_piechota_terytorium_wlasne` | UNWIRED / D_REQUIRED-038 | beneficial | brak |
| 39 | `walka_atak_piechota_w_murze` | UNWIRED / D_REQUIRED-039 | beneficial | brak |
| 40 | `walka_obrona_piechota_w_murze` | UNWIRED / D_REQUIRED-040 | beneficial | brak |
| 41 | `walka_atak_piechota_runda_szarzy` | UNWIRED / D_REQUIRED-041 | beneficial | brak |
| 42 | `walka_obrona_piechota_runda_szarzy` | UNWIRED / D_REQUIRED-042 | beneficial | brak |
| 43 | `walka_atak_piechota_teren_plytkie_morze` | UNWIRED / D_REQUIRED-043 | beneficial | brak |
| 44 | `walka_obrona_piechota_teren_plytkie_morze` | UNWIRED / D_REQUIRED-044 | beneficial | brak |
| 45 | `spec_Atak` | UNWIRED / D_REQUIRED-045 | beneficial | brak |
| 46 | `spec_Obrazenia` | UNWIRED / D_REQUIRED-046 | beneficial | brak |
| 47 | `spec_Obrona` | UNWIRED / D_REQUIRED-047 | beneficial | brak |
| 48 | `spec_Uderzenie` | UNWIRED / D_REQUIRED-048 | beneficial | brak |
| 49 | `spec_Pancerz` | UNWIRED / D_REQUIRED-049 | beneficial | brak |
| 50 | `spec_Przebicie` | UNWIRED / D_REQUIRED-050 | beneficial | brak |
| 51 | `spec_Health` | UNWIRED / D_REQUIRED-051 | beneficial | brak |
| 52 | `spec_Atak_dystansowy` | UNWIRED / D_REQUIRED-052 | beneficial | brak |
| 53 | `spec_Zasieg_hex` | UNWIRED / D_REQUIRED-053 | beneficial | brak |
| 54 | `spec_Pociski` | UNWIRED / D_REQUIRED-054 | beneficial | brak |
| 55 | `spec_Ruch_bitwa` | UNWIRED / D_REQUIRED-055 | beneficial | brak |
| 56 | `spec_Ruch_mapa` | UNWIRED / D_REQUIRED-056 | beneficial | brak |
| 57 | `spec_Widok` | UNWIRED / D_REQUIRED-057 | beneficial | brak |
| 58 | `spec_Dezercja_proc` | UNWIRED / D_REQUIRED-058 | harmful | brak |
| 59 | `spec_Morale` | UNWIRED / D_REQUIRED-059 | beneficial | brak |
| 60 | `spec_Koszt_pieniadz` | UNWIRED / D_REQUIRED-060 | harmful | brak |
| 61 | `spec_Utrzymanie` | UNWIRED / D_REQUIRED-061 | harmful | brak |
| 62 | `spec_Zywnosc_ture` | UNWIRED / D_REQUIRED-062 | harmful | brak |
| 63 | `eko_praca_proc` | UNWIRED / D_REQUIRED-063 | beneficial | brak |
| 64 | `eko_pieniadz_proc` | UNWIRED / D_REQUIRED-064 | beneficial | brak |
| 65 | `eko_pieniadz_port_proc` | UNWIRED / D_REQUIRED-065 | beneficial | brak |
| 66 | `eko_zywnosc_proc` | UNWIRED / D_REQUIRED-066 | beneficial | brak |
| 67 | `eko_nauka_proc` | UNWIRED / D_REQUIRED-067 | beneficial | brak |
| 68 | `eko_kultura_proc` | UNWIRED / D_REQUIRED-068 | beneficial | brak |
| 69 | `eko_luksus_proc` | UNWIRED / D_REQUIRED-069 | beneficial | brak |
| 70 | `eko_zadowolenie_proc` | UNWIRED / D_REQUIRED-070 | beneficial | brak |
| 71 | `eko_handel_brutto_proc` | UNWIRED / D_REQUIRED-071 | beneficial | brak |
| 72 | `eko_korupcja_proc` | UNWIRED / D_REQUIRED-072 | harmful | brak |
| 73 | `prod_koszt_budynku_proc` | UNWIRED / D_REQUIRED-073 | harmful | brak |
| 74 | `prod_koszt_jednostki_proc` | UNWIRED / D_REQUIRED-074 | harmful | brak |
| 75 | `prod_szybkosc_budynku_proc` | UNWIRED / D_REQUIRED-075 | beneficial | brak |
| 76 | `prod_szybkosc_jednostki_proc` | UNWIRED / D_REQUIRED-076 | beneficial | brak |
| 77 | `prod_rush_koszt_proc` | UNWIRED / D_REQUIRED-077 | harmful | brak |
| 78 | `lud_wzrost_proc` | REAL_GAMEPLAY | beneficial | gra/src/game/population-growth-v85.ts:87<br>gra/src/game/population-growth-v85.ts:206<br>gra/src/game/population-growth-v85.ts:230 |
| 79 | `lud_spadek_proc` | UNWIRED / D_REQUIRED-078 | harmful | brak |
| 80 | `lud_zdrowie_proc` | UNWIRED / D_REQUIRED-079 | beneficial | brak |
| 81 | `lud_zadowolenie_bazowe` | UNWIRED / D_REQUIRED-080 | beneficial | brak |
| 82 | `lud_limit_populacji` | UNWIRED / D_REQUIRED-081 | beneficial | brak |
| 83 | `mp_regen_proc` | UNWIRED / D_REQUIRED-082 | beneficial | brak |
| 84 | `mp_max_proc` | UNWIRED / D_REQUIRED-083 | beneficial | brak |
| 85 | `mp_koszt_jednostki_proc` | UNWIRED / D_REQUIRED-084 | harmful | brak |
| 86 | `wealth_cap_proc` | UNWIRED / D_REQUIRED-085 | beneficial | brak |
| 87 | `wealth_mnoznik_proc` | UNWIRED / D_REQUIRED-086 | beneficial | brak |
| 88 | `kultura_naplyw_proc` | UNWIRED / D_REQUIRED-087 | beneficial | brak |
| 89 | `religia_spread_proc` | UNWIRED / D_REQUIRED-088 | beneficial | brak |
| 90 | `porzadek_produkcja_proc` | UNWIRED / D_REQUIRED-089 | beneficial | brak |
| 91 | `porzadek_pieniadz_proc` | UNWIRED / D_REQUIRED-090 | beneficial | brak |
| 92 | `porzadek_nauka_proc` | UNWIRED / D_REQUIRED-091 | beneficial | brak |
| 93 | `porzadek_kultura_proc` | UNWIRED / D_REQUIRED-092 | beneficial | brak |
| 94 | `porzadek_wzrost_proc` | UNWIRED / D_REQUIRED-093 | beneficial | brak |
| 95 | `obl_obrona_miasta_proc` | UNWIRED / D_REQUIRED-094 | beneficial | brak |
| 96 | `obl_mur_proc` | UNWIRED / D_REQUIRED-095 | beneficial | brak |
| 97 | `obl_machines_proc` | UNWIRED / D_REQUIRED-096 | beneficial | brak |
| 98 | `dip_sklonnosc_sojusze` | UI_ONLY | neutral/not-applicable | gra/src/game/diplomacy-display.ts:55 |
| 99 | `dip_lojalnosc` | UI_ONLY | neutral/not-applicable | gra/src/game/diplomacy-display.ts:64 |
| 100 | `dip_prog_wojny` | UI_ONLY | neutral/not-applicable | gra/src/game/diplomacy-display.ts:73 |
| 101 | `dip_pamietliwosc` | UI_ONLY | neutral/not-applicable | gra/src/game/diplomacy-display.ts:82 |
| 102 | `dip_otwartosc_handel` | UI_ONLY | neutral/not-applicable | gra/src/game/diplomacy-display.ts:46 |
| 103 | `dip_nastawienie_bazowe` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:213 |
| 104 | `dip_agresja_archetyp` | UNWIRED / D_REQUIRED-097 | neutral/not-applicable | brak |
| 105 | `dip_handlowosc_archetyp` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:192 |
| 106 | `ai_agresywnosc` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:49<br>gra/src/game/civ-ai-data.ts:91<br>gra/src/game/civ-ai-data.ts:169 |
| 107 | `ai_ekspansywnosc` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:92 |
| 108 | `ai_priorytet_militarny` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:93 |
| 109 | `ai_priorytet_ekonomia` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:94 |
| 110 | `ai_priorytet_nauka` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:95 |
| 111 | `ai_tolerancja_ryzyka` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:96 |
| 112 | `ai_sklonnosc_podboju` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:97 |
| 113 | `ai_profil_obronna` | REAL_GAMEPLAY | neutral/not-applicable | gra/src/game/civ-ai-data.ts:66<br>gra/src/game/civ-ai-data.ts:98<br>gra/src/game/civ-ai-data.ts:100 |

## Dowód
- `01-allocation.json` zawiera 113 parametrów, 1695 unikalnych komórek oraz statusy.
- `01-semantic-contract.json` zawiera wzór mediany, polaryzacji, intensywności i UI.
- `01-consumer-provenance.md` zawiera skan call-site’ów i następny krok dla każdego pola.

DEPLOY/PUSH: NIE WYKONANO
