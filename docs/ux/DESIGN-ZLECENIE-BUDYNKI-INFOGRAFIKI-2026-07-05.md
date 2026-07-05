# ZLECENIE Design — Infografiki budynków (1E, 35 ikon + karty)

**Od:** Maciej / Lane UI (MASTER)  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-05  
**ZLECENIE-ID:** `BUDYNKI-INFOGRAFIKI-1E-2026-07-05`  
**Hasło GitHub:** szukaj w repo → **`BUDYNKI-INFOGRAFIKI-1E-2026-07-05`**  
**Priorytet:** **P0** — panel miasta (lista budynków, kolejka „Rozbuduj X→Y”, ↗ upgrade)

**Repo (jedyne źródło dla Design):** https://github.com/maciejsieracki/The-Game  
**Review HTML:** https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/export/BUDYNKI-INFOGRAFIKI-GAP-DLA-DESIGN.html  
**Wklejka START:** https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/WKLEJKA-DESIGN-START-BUDYNKI-INFOGRAFIKI.md

---

## 0. Problem (dla Designera)

W grze jest **35 budynków**, a Design dostarczył tylko **13 ikon kategorii** (`bld-food`, `bld-trade`, `bld-production`…).

| Ikona wspólna dziś | Ile budynków | Przykład problemu |
|--------------------|--------------|-------------------|
| `bld-production` | **10** | Stolarnia = Piec hutniczy = Cegielnia |
| `bld-trade` | **5** | Port = Targowisko = Mennica |
| `bld-health` | **4** | Studnia = Akwedukt = Łaźnia |
| `bld-defense` | **3** | Mury = Cytadela = **Warsztat oblężniczy** (błąd!) |
| `bld-science` | **2** | Biblioteka = Akademia |
| `bld-military` | **2** | Koszary = Akademia wojskowa |
| `bld-culture` | **3** | Kręgi = Świątynia = Teatr |

**Cel:** **35 dedykowanych SVG @24px** + opcjonalnie **karty infografiki** (hover / panel ↗ / mockup B-15).

Analogia: to samo co zlecenie **`JEDNOSTKI-INFOGRAFIKI-1E-2026-07-05`** — jeden kanon, lane podmienia w kodzie.

---

## 1. Playtest PRZED (screenshoty)

1. `gra-kanon/START.html` (lub lokalnie `gra-robocza/START.html`) → Ctrl+F5 → nowa gra  
2. Wejdź w miasto → zakładka **Budowa** — lista budynków (wszystkie te same ikonki produkcji)  
3. Zbuduj Mury → zobacz **Rozbuduj Mury → Cytadela**  
4. Lista **Budynki w mieście** → ikona **↗** (panel składu bonusów)

**Review HTML (czytaj w przeglądarce z GitHub):** `docs/ux/export/BUDYNKI-INFOGRAFIKI-GAP-DLA-DESIGN.html`

---

## 2. Reguły 1E (obowiązkowe)

| Reguła | Wartość |
|--------|---------|
| Format | **SVG** · `stroke="currentColor"` · **zero emoji** |
| Styl | brand-book 1E · linia 1.4–1.6 · zaokrąglone końce |
| Akcent źródłowy | `#e8d88a` → w grze `currentColor` |
| ViewBox | **24×24** (skalowany do 14–40px) |
| Wzór istniejących | `docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/icons/buildings/bld-*.svg` (13 plików kategorii) |
| ZIP | `BUDYNKI-INFOGRAFIKI-1E-2026-07-05.zip` |
| W ZIP | SVG + `building-icon-map.json` + `DESIGN-do-UI_BUDYNKI-INFOGRAFIKI.md` + `MANIFEST.txt` |

**Nazewnictwo plików SVG (MUST):** `bld-{id}.svg` gdzie `{id}` = kolumna id z §4 (np. `bld-port_wielki.svg`, `bld-fort.svg`).

**Oddanie (preferowane):** commit + push do `docs/ux/claude-design/` — patrz [WORKFLOW-GITHUB-SYNC.md](https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/claude-design/WORKFLOW-GITHUB-SYNC.md).

---

## 3. Dwa poziomy deliverables

### Poziom A — ikona 24px (MUST — 35 plików)

Używane w: lista „Budynki w mieście”, kolejka produkcji, katalog budowy.

### Poziom B — karta infografiki ~280px (SHOULD)

Używane w: hover / klik ↗ / mockup `B-15-budowa-dostepne.html`.

**Co na każdej karcie:**
1. Ikona duża (40px) — ten sam motyw co 24px  
2. Nazwa PL  
3. Chip kategorii (Handel / Produkcja / Obrona…)  
4. 2–3 chipy bonusów (praca, pieniądz, nauka, kultura, obrona — ikony z brand-book Tier 2)  
5. Badge epoki (Kamień / Brąz / Żelazo)  
6. Jeśli upgrade: **↗** + „z Murów” / „z Portu”  
7. Opcjonalnie: kłódka + tech (np. „wymaga: Inżynieria”)

**Mockup zbiorczy:** `The Game - Budynki infografiki kanon v1 2026-07-05 (1E).dc.html` — siatka 35 ikon + 3 przykładowe karty (Spichlerz, Port wielki, Cytadela).

---

## 4. Pełna lista 35 budynków (id · nazwa · motyw ikony)

### Produkcja (10) — P0

| id | Nazwa PL | Motyw ikony |
|----|----------|-------------|
| `stolarnia` | Stolarnia | Piła + deski / sterta drewna |
| `mielerz` | Mielerz | Kopiec węgla drzewnego + dym |
| `kamieniarski` | Warsztat kamieniarski | Dłuto + blok kamienia |
| `kuznia` | Kuźnia | Kowadło + młot (brąz) |
| `odlewnia_brazu` | Piec hutniczy | Piec z płomieniem, ruda |
| `odlewnia_zelaza` | Odlewnia żelaza | Większy piec, wlew żelaza |
| `garncarnia` | Garncarnia | Koło garncarskie / amfora |
| `cegielnia` | Cegielnia | Stos cegieł + forma |
| `kuznia_zelaza` | Kuźnia żelaza | Kowadło + iskry |
| `wielka_kuznia` | Wielka Kuźnia | Wielki piec + 2 kowadła (upgrade) |

### Handel (5) — P0

| id | Nazwa PL | Motyw ikony |
|----|----------|-------------|
| `targowisko` | Targowisko (Rynek) | Stragan + waga |
| `port` | Port handlowy | Kotwica + nabrzeże |
| `port_wielki` | Port wielki | Duży port, 2 statki (upgrade Portu) |
| `karawanseraj` | Karawanseraj | Wóz / wielbłąd + brama |
| `mennica` | Mennica | Moneta + stempel |

### Żywność / magazyn (2)

| id | Nazwa PL | Motyw ikony |
|----|----------|-------------|
| `spichlerz` | Spichlerz | Spichlerz + kłos |
| `magazyn` | Magazyn | Skrzynie + drzwi |

### Kultura / religia (5)

| id | Nazwa PL | Motyw ikony |
|----|----------|-------------|
| `kamienne_kregi` | Kamienne kręgi | Kamienie w kręgu |
| `swiatynia` | Świątynia | Kolumny + ogień (upgrade kręgów) |
| `teatr` | Teatr | Maski teatralne *(merge w Akademię — ikona na wypadek save)* |
| `stela` | Stela / Pomnik | Stela / obelisk |
| `palac` | Pałac | Fasada z kolumnami |

### Nauka (2) — P1 upgrade

| id | Nazwa PL | Motyw ikony |
|----|----------|-------------|
| `biblioteka` | Biblioteka | Zwoje + półka |
| `akademia` | Akademia | Akademia + zwoje + maski (merge Bib+Teatr) |

### Zdrowie (4) — P2

| id | Nazwa PL | Motyw ikony |
|----|----------|-------------|
| `studnia` | Studnia | Studnia + wiaderko |
| `akwedukt` | Akwedukt | Łuk akweduktu |
| `laznia_publiczna` | Łaźnia publiczna | Kopuła + para |
| `lazaret` | Lazaret | Namiot + znak medyczny |

### Obrona / wojsko (5) — P0

| id | Nazwa PL | Motyw ikony |
|----|----------|-------------|
| `mury` | Mury | Mur z blankami |
| `fort` | **Cytadela** | Warowna wieża (upgrade Murów) |
| `koszary` | Koszary | Tarcza + włócznie |
| `warsztat_oblezniczy` | Warsztat oblężniczy | **Katapulta** (NIE mur!) |
| `akademia_wojskowa` | Akademia wojskowa | Tarcza + wieniec (upgrade Koszar) |

### Administracja (2) — P2

| id | Nazwa PL | Motyw ikony |
|----|----------|-------------|
| `sad` | Sąd | Waga sprawiedliwości |
| `pretorium` | Pretorium | Fasces / budynek admin. |

---

## 5. Łańcuchy upgrade (wariant wizualny)

| Podstawa | Upgrade | Różnica |
|----------|---------|---------|
| Port handlowy | Port wielki | mały → duży port |
| Mury | Cytadela (`fort`) | mur → cytadela |
| Biblioteka | Akademia | półka → akademia |
| Koszary | Akademia wojskowa | baraki → akademia |
| Kuźnia żelaza | Wielka Kuźnia | 1 → wielki piec |
| Kamienne kręgi | Świątynia | kręgi → świątynia |
| Piec hutniczy | Odlewnia żelaza | piec brąz → odlewnia |

**Preferencja Macieja:** osobna ikona na każdy stopień (nie tylko badge ↗).

---

## 6. Priorytet dostawy

| Faza | Zakres |
|------|--------|
| **P0** | Produkcja (10) + Handel (5) + Obrona/wojsko (5) = **20 ikon** |
| **P1** | 7 par upgrade (warianty powyżej) |
| **P2** | Zdrowie + Admin + Teatr = **8 ikon** |

Można oddać **P0 w pierwszym zipie**, reszta w P0.2.

---

## 7. building-icon-map.json (fragment docelowy)

```json
{
  "note": "id budynku z gry → bld-{id}.svg @24",
  "map": {
    "stolarnia": "bld-stolarnia",
    "port_wielki": "bld-port_wielki",
    "fort": "bld-fort",
    "_default": "bld-default"
  }
}
```

Lane UI zmapuje 1:1 — **nie** heurystyka kategorii.

---

## 8. DoD (Definition of Done)

- [ ] 35× SVG @24, spójny stroke z istniejącymi `bld-*.svg`  
- [ ] `building-icon-map.json` — wszystkie id z §4  
- [ ] Mockup `.dc.html` — siatka + 3 karty przykładowe  
- [ ] `DESIGN-do-UI_BUDYNKI-INFOGRAFIKI.md` — handoff dla lane  
- [ ] `MANIFEST.txt` + push GitHub **lub** jeden ZIP  
- [ ] Zero emoji  

---

## 9. Po dostawie (lane UI — nie Design)

1. SVG → `gra/src/ui/icons/brand/buildings/`  
2. Aktualizacja `building-icon-map.json`  
3. Rebuild ROBOCZA  

---

*The Game · Budynki infografiki · MASTER 2026-07-05*
