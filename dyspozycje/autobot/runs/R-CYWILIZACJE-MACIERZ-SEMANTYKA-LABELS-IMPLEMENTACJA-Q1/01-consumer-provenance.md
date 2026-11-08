# 01-consumer-provenance — Greece precedent and exact call-sites

Base: f4c89d0081c622c16b207d338b49c8bacafc4553
Źródło macierzy: gra/data/civ-matrix.json (ad67e771608c2ebad8fed5e84e3d8ecd6e2a2b496fbfe42025ddb39ef27a2ea7)

Skan exact parameter-ID w gra/src/**/*.ts, z wyłączeniem civ-matrix.ts i civ-matrix-semantic.ts. Samo pole modul, loader albo adapter bez wywołania nie jest konsumentem.

| # | Parametr | Status | Greece precedent / call-sites | Następny krok |
|---:|---|---|---|---|
| 1 | `meta_epoka_kamien` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 2 | `meta_epoka_braz` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 3 | `meta_epoka_zelazo` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 4 | `meta_mnoznik_waluta` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 5 | `meta_tier_roster` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 6 | `walka_atak_piechota` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 7 | `walka_atak_lukownicy` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 8 | `walka_atak_kawaleria` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 9 | `walka_atak_rydwany` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 10 | `walka_atak_obleczenie` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 11 | `walka_atak_morska` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 12 | `walka_atak_wszystkie` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 13 | `walka_obrona_piechota` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 14 | `walka_obrona_lukownicy` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 15 | `walka_obrona_kawaleria` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 16 | `walka_obrona_rydwany` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 17 | `walka_obrona_obleczenie` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 18 | `walka_obrona_morska` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 19 | `walka_pancerz_piechota` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 20 | `walka_pancerz_lukownicy` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 21 | `walka_pancerz_kawaleria` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 22 | `walka_pancerz_rydwany` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 23 | `walka_uderzenie_piechota` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 24 | `walka_uderzenie_kawaleria` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 25 | `walka_uderzenie_rydwany` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 26 | `walka_dystans_lukownicy` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 27 | `walka_dystans_rydwany` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 28 | `walka_hp_piechota` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 29 | `walka_hp_kawaleria` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 30 | `walka_hp_rydwany` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 31 | `walka_ruch_bitwa_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 32 | `walka_zasieg_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 33 | `walka_oblezenie_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 34 | `walka_koszt_rekrutacji_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 35 | `walka_atak_piechota_teren_las` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 36 | `walka_obrona_piechota_teren_las` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 37 | `walka_atak_piechota_terytorium_wlasne` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 38 | `walka_obrona_piechota_terytorium_wlasne` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 39 | `walka_atak_piechota_w_murze` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 40 | `walka_obrona_piechota_w_murze` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 41 | `walka_atak_piechota_runda_szarzy` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 42 | `walka_obrona_piechota_runda_szarzy` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 43 | `walka_atak_piechota_teren_plytkie_morze` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 44 | `walka_obrona_piechota_teren_plytkie_morze` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 45 | `spec_Atak` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 46 | `spec_Obrazenia` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 47 | `spec_Obrona` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 48 | `spec_Uderzenie` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 49 | `spec_Pancerz` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 50 | `spec_Przebicie` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 51 | `spec_Health` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 52 | `spec_Atak_dystansowy` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 53 | `spec_Zasieg_hex` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 54 | `spec_Pociski` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 55 | `spec_Ruch_bitwa` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 56 | `spec_Ruch_mapa` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 57 | `spec_Widok` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 58 | `spec_Dezercja_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 59 | `spec_Morale` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 60 | `spec_Koszt_pieniadz` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 61 | `spec_Utrzymanie` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 62 | `spec_Zywnosc_ture` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 63 | `eko_praca_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 64 | `eko_pieniadz_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 65 | `eko_pieniadz_port_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 66 | `eko_zywnosc_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 67 | `eko_nauka_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 68 | `eko_kultura_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 69 | `eko_luksus_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 70 | `eko_zadowolenie_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 71 | `eko_handel_brutto_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 72 | `eko_korupcja_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 73 | `prod_koszt_budynku_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 74 | `prod_koszt_jednostki_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 75 | `prod_szybkosc_budynku_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 76 | `prod_szybkosc_jednostki_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 77 | `prod_rush_koszt_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 78 | `lud_wzrost_proc` | REAL_GAMEPLAY | gra/src/game/population-growth-v85.ts:87<br>gra/src/game/population-growth-v85.ts:206<br>gra/src/game/population-growth-v85.ts:230 | utrzymać test zachowania i dokumentację trudności |
| 79 | `lud_spadek_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 80 | `lud_zdrowie_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 81 | `lud_zadowolenie_bazowe` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 82 | `lud_limit_populacji` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 83 | `mp_regen_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 84 | `mp_max_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 85 | `mp_koszt_jednostki_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 86 | `wealth_cap_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 87 | `wealth_mnoznik_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 88 | `kultura_naplyw_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 89 | `religia_spread_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 90 | `porzadek_produkcja_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 91 | `porzadek_pieniadz_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 92 | `porzadek_nauka_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 93 | `porzadek_kultura_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 94 | `porzadek_wzrost_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 95 | `obl_obrona_miasta_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 96 | `obl_mur_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 97 | `obl_machines_proc` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 98 | `dip_sklonnosc_sojusze` | UI_ONLY | gra/src/game/diplomacy-display.ts:55 | utrzymać jako opis UI, bez premii |
| 99 | `dip_lojalnosc` | UI_ONLY | gra/src/game/diplomacy-display.ts:64 | utrzymać jako opis UI, bez premii |
| 100 | `dip_prog_wojny` | UI_ONLY | gra/src/game/diplomacy-display.ts:73 | utrzymać jako opis UI, bez premii |
| 101 | `dip_pamietliwosc` | UI_ONLY | gra/src/game/diplomacy-display.ts:82 | utrzymać jako opis UI, bez premii |
| 102 | `dip_otwartosc_handel` | UI_ONLY | gra/src/game/diplomacy-display.ts:46 | utrzymać jako opis UI, bez premii |
| 103 | `dip_nastawienie_bazowe` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:213 | utrzymać test zachowania i dokumentację trudności |
| 104 | `dip_agresja_archetyp` | UNWIRED | brak potwierdzonego call-site | DECISION_REQUIRED: aktor + warunek + formuła + precedencja + test dwóch cywilizacji |
| 105 | `dip_handlowosc_archetyp` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:192 | utrzymać test zachowania i dokumentację trudności |
| 106 | `ai_agresywnosc` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:49<br>gra/src/game/civ-ai-data.ts:91<br>gra/src/game/civ-ai-data.ts:169 | utrzymać test zachowania i dokumentację trudności |
| 107 | `ai_ekspansywnosc` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:92 | utrzymać test zachowania i dokumentację trudności |
| 108 | `ai_priorytet_militarny` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:93 | utrzymać test zachowania i dokumentację trudności |
| 109 | `ai_priorytet_ekonomia` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:94 | utrzymać test zachowania i dokumentację trudności |
| 110 | `ai_priorytet_nauka` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:95 | utrzymać test zachowania i dokumentację trudności |
| 111 | `ai_tolerancja_ryzyka` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:96 | utrzymać test zachowania i dokumentację trudności |
| 112 | `ai_sklonnosc_podboju` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:97 | utrzymać test zachowania i dokumentację trudności |
| 113 | `ai_profil_obronna` | REAL_GAMEPLAY | gra/src/game/civ-ai-data.ts:66<br>gra/src/game/civ-ai-data.ts:98<br>gra/src/game/civ-ai-data.ts:100 | utrzymać test zachowania i dokumentację trudności |

## Wniosek

Potwierdzone: 11 REAL_GAMEPLAY + 5 UI_ONLY.
97 parametrów pozostaje DECISION_REQUIRED; nie dodano zerowych adapterów ani fikcyjnych efektów.
