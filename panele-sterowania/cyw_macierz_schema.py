#!/usr/bin/env python3
"""
cyw-macierz-schema.py — definicja kolumn macierzy cywilizacji (kanon v1).

Każda kolumna = param_id do odczytu przez moduły:
  wartosc 0 / 1.0 = brak efektu (mnoznik ×(1+0) lub ×1)
Eksport JSON: gra/data/civ-matrix.json
"""
from __future__ import annotations

# (param_id, domena, jednostka, modul_ts, formula, default)
# jednostka: ulamek | absolut | skala_1_10 | flag_0_1 | epoka_flag
# formula: mul_proc | mul_abs | add | flag

COLUMN_DEFS: list[tuple[str, str, str, str, str, float]] = []

def _add(pid: str, dom: str, unit: str, mod: str, formula: str, default: float = 0.0):
    COLUMN_DEFS.append((pid, dom, unit, mod, formula, default))

# --- META ---
_add("meta_epoka_kamien", "meta", "flag_0_1", "start-preview.ts", "flag", 0)
_add("meta_epoka_braz", "meta", "flag_0_1", "start-preview.ts", "flag", 0)
_add("meta_epoka_zelazo", "meta", "flag_0_1", "start-preview.ts", "flag", 0)
_add("meta_mnoznik_waluta", "meta", "absolut", "economy.ts", "mul_abs", 2.0)
_add("meta_tier_roster", "meta", "absolut", "civ-roster.ts", "mul_abs", 1)

# --- WALKA % (ulamek; wynik = stat * (1+val)) ---
for cel in ("piechota", "lukownicy", "kawaleria", "rydwany", "obleczenie", "morska", "wszystkie"):
    _add(f"walka_atak_{cel}", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
for cel in ("piechota", "lukownicy", "kawaleria", "rydwany", "obleczenie", "morska"):
    _add(f"walka_obrona_{cel}", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
for cel in ("piechota", "lukownicy", "kawaleria", "rydwany"):
    _add(f"walka_pancerz_{cel}", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
for cel in ("piechota", "kawaleria", "rydwany"):
    _add(f"walka_uderzenie_{cel}", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
for cel in ("lukownicy", "rydwany"):
    _add(f"walka_dystans_{cel}", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
for cel in ("piechota", "kawaleria", "rydwany"):
    _add(f"walka_hp_{cel}", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
_add("walka_ruch_bitwa_proc", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
_add("walka_zasieg_proc", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
_add("walka_oblezenie_proc", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
_add("walka_koszt_rekrutacji_proc", "walka", "ulamek", "production.ts", "mul_proc")

# warunki (osobne kolumny — modul sprawdza warunek, mnoznik z kolumny)
for w in ("teren_las", "terytorium_wlasne", "w_murze", "runda_szarzy", "teren_wybrzeze"):
    _add(f"walka_atak_piechota_{w}", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")
    _add(f"walka_obrona_piechota_{w}", "walka", "ulamek", "civ-bonuses.ts", "mul_proc")

# --- JEDNOSTKA SPEC (absolutne staty z units.json) ---
for stat in (
    "Atak", "Obrazenia", "Obrona", "Uderzenie", "Pancerz", "Przebicie", "Health",
    "Atak_dystansowy", "Zasieg_hex", "Pociski", "Ruch_bitwa", "Ruch_mapa", "Widok",
    "Dezercja_proc", "Morale", "Koszt_pieniadz", "Utrzymanie", "Zywnosc_ture",
):
    _add(f"spec_{stat}", "jednostka_spec", "absolut", "units.json+combat.ts", "stat_abs", 0)

# --- EKONOMIA (ulamek lub absolut) ---
_add("eko_praca_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_pieniadz_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_pieniadz_port_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_zywnosc_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_nauka_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_kultura_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_luksus_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_zadowolenie_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_handel_brutto_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")
_add("eko_korupcja_proc", "ekonomia", "ulamek", "economy.ts", "mul_proc")

# --- PRODUKCJA ---
_add("prod_koszt_budynku_proc", "produkcja", "ulamek", "civ-bonuses.ts", "mul_proc")
_add("prod_koszt_jednostki_proc", "produkcja", "ulamek", "production.ts", "mul_proc")
_add("prod_szybkosc_budynku_proc", "produkcja", "ulamek", "production.ts", "mul_proc")
_add("prod_szybkosc_jednostki_proc", "produkcja", "ulamek", "production.ts", "mul_proc")
_add("prod_rush_koszt_proc", "produkcja", "ulamek", "production.ts", "mul_proc")

# --- LUDNOSC ---
_add("lud_wzrost_proc", "ludnosc", "ulamek", "economy.ts", "mul_proc", 0)
_add("lud_spadek_proc", "ludnosc", "ulamek", "economy.ts", "mul_proc")
_add("lud_zdrowie_proc", "ludnosc", "ulamek", "turn-economy.ts", "mul_proc")
_add("lud_zadowolenie_bazowe", "ludnosc", "absolut", "culture-religion.ts", "add")
_add("lud_limit_populacji", "ludnosc", "absolut", "cities.ts", "add", 10)

# --- MANPOWER ---
_add("mp_regen_proc", "manpower", "ulamek", "manpower.ts", "mul_proc")
_add("mp_max_proc", "manpower", "ulamek", "manpower.ts", "mul_proc")
_add("mp_koszt_jednostki_proc", "manpower", "ulamek", "manpower.ts", "mul_proc")

# --- SPOLECZENSTWO ---
_add("wealth_cap_proc", "spoleczenstwo", "ulamek", "wealth.ts", "mul_proc")
_add("wealth_mnoznik_proc", "spoleczenstwo", "ulamek", "wealth.ts", "mul_proc")
_add("kultura_naplyw_proc", "spoleczenstwo", "ulamek", "culture-religion.ts", "mul_proc")
_add("religia_spread_proc", "spoleczenstwo", "ulamek", "culture-religion.ts", "mul_proc")
_add("porzadek_produkcja_proc", "spoleczenstwo", "ulamek", "order.ts", "mul_proc")
_add("porzadek_pieniadz_proc", "spoleczenstwo", "ulamek", "order.ts", "mul_proc")
_add("porzadek_nauka_proc", "spoleczenstwo", "ulamek", "order.ts", "mul_proc")
_add("porzadek_kultura_proc", "spoleczenstwo", "ulamek", "order.ts", "mul_proc")
_add("porzadek_wzrost_proc", "spoleczenstwo", "ulamek", "order.ts", "mul_proc")

# --- OBLEZENIE ---
_add("obl_obrona_miasta_proc", "obleczenie", "ulamek", "siege.ts", "mul_proc")
_add("obl_mur_proc", "obleczenie", "ulamek", "siege.ts", "mul_proc")
_add("obl_machines_proc", "obleczenie", "ulamek", "siegeMachines.ts", "mul_proc")

# --- DYPLOMACJA (1-10 lub 0-1 archetyp) ---
_add("dip_sklonnosc_sojusze", "dyplomacja", "skala_1_10", "diplomacy.ts", "skala", 5)
_add("dip_lojalnosc", "dyplomacja", "skala_1_10", "diplomacy.ts", "skala", 5)
_add("dip_prog_wojny", "dyplomacja", "skala_1_10", "diplomacy.ts", "skala", 5)
_add("dip_pamietliwosc", "dyplomacja", "skala_1_10", "diplomacy.ts", "skala", 5)
_add("dip_otwartosc_handel", "dyplomacja", "skala_1_10", "diplomacy.ts", "skala", 5)
_add("dip_nastawienie_bazowe", "dyplomacja", "absolut", "diplomacy.ts", "add", 50)
_add("dip_agresja_archetyp", "dyplomacja", "ulamek_0_1", "diplomacy.ts", "mul_abs", 0.5)
_add("dip_handlowosc_archetyp", "dyplomacja", "ulamek_0_1", "diplomacy.ts", "mul_abs", 0.5)

# --- AI (1-10) ---
_add("ai_agresywnosc", "ai", "skala_1_10", "civ-ai-data.ts", "skala", 5)
_add("ai_ekspansywnosc", "ai", "skala_1_10", "civ-ai-data.ts", "skala", 5)
_add("ai_priorytet_militarny", "ai", "skala_1_10", "civ-ai-data.ts", "skala", 5)
_add("ai_priorytet_ekonomia", "ai", "skala_1_10", "civ-ai-data.ts", "skala", 5)
_add("ai_priorytet_nauka", "ai", "skala_1_10", "civ-ai-data.ts", "skala", 5)
_add("ai_tolerancja_ryzyka", "ai", "skala_1_10", "civ-ai-data.ts", "skala", 5)
_add("ai_sklonnosc_podboju", "ai", "skala_1_10", "civ-ai-data.ts", "skala", 5)
_add("ai_profil_obronna", "ai", "flag_0_1", "civ-ai-data.ts", "flag", 0)

# Power P-A: wyłącznie globalne współczynniki (Panel-B / power-params.json).
# Wagi per-cyw usunięte — Maciej 2026-06-26: balans w pkt, bez mnożników per nacja.

PARAM_IDS = [c[0] for c in COLUMN_DEFS]
DEFAULTS = {c[0]: c[5] for c in COLUMN_DEFS}
PARAM_META = {
    c[0]: {"domena": c[1], "jednostka": c[2], "modul": c[3], "formula": c[4]}
    for c in COLUMN_DEFS
}

IDENT_COLS = ["Cywilizacja", "typCywilizacji", "ikonaId", "tier"]

# 11 zakladek Excel (kolejnosc = numeracja) — bez Cyw-12-POTEGA (wagi wyłączone)
DOMAIN_SHEETS: list[tuple[str, str]] = [
    ("meta", "Cyw-01-META"),
    ("walka", "Cyw-02-WALKA"),
    ("jednostka_spec", "Cyw-03-JEDNOSTKA"),
    ("ekonomia", "Cyw-04-EKONOMIA"),
    ("produkcja", "Cyw-05-PRODUKCJA"),
    ("ludnosc", "Cyw-06-LUDNOSC"),
    ("manpower", "Cyw-07-MANPOWER"),
    ("spoleczenstwo", "Cyw-08-SPOLECZENSTWO"),
    ("obleczenie", "Cyw-09-OBLEZENIE"),
    ("dyplomacja", "Cyw-10-DYPLOMACJA"),
    ("ai", "Cyw-11-AI"),
]

SHEET_INFO = "Cyw-00-INFO"
SHEET_LEGACY = "Cyw-macierz"  # stara jedna zakladka — usuwac przy regen

PARAMS_BY_DOMAIN: dict[str, list[str]] = {}
RESERVED_DOMAINS = frozenset({"potega"})  # nie wpiac do silnika do czasu modulu Power
for dom, _ in DOMAIN_SHEETS:
    PARAMS_BY_DOMAIN[dom] = [c[0] for c in COLUMN_DEFS if c[1] == dom]

SHEET_TO_DOMAIN = {name: dom for dom, name in DOMAIN_SHEETS}
ALL_CYw_SHEETS = [SHEET_INFO] + [name for _, name in DOMAIN_SHEETS]
