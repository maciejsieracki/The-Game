# Audyt drzewka technologii — stan 2026-06-26

**Zakres:** `gra/data/tech.json` vs `terrain-improvements.json`, `buildings.json`, `units.json`, kod (`research.ts`, `improvement-tech.ts`, `sciencePicker.ts`).  
**Kontekst:** ostatnie zmiany hodowli (bydło/owce/lama, bez pastwiska), B1-tech Maciej 2026-06-29, kanon żywność/hodowla.

---

## TL;DR dla Macieja

| Ocena | Opis |
|-------|------|
| **Prereq drzewka** | ✅ Spójne — 31 tech, brak złamanych odwołań w kolumnie „Wymaga” |
| **Bramka ulepszeń (gra)** | ✅ Działa z `terrain-improvements.json` + aliasy legacy |
| **Opis w tech.json** | ⚠️ **Przestarzały** — kolumna „Odblokowuje budynek” często nie pasuje do realnych `buildings.json` |
| **UI drzewka** | ⚠️ Tooltip **nie pokazuje** ulepszeń terenu (tylko budynki + surowce z tech.json) |
| **Epoka Żelazo** | ⚠️ 9 tech + 8 budynków, ale **1 jednostka** (Katapulta) — reszta żelaza = luka |
| **Decyzje odłożone** | Posterunek (tech-Q3), tarasy (brak tech), Mennica/Akwedukt (brak budynków) |

**Rekomendacja:** jeden sprint **CYWILIZACJE (dane)** na synchronizację tech.json + sciencePicker; potem **UNITS** na jednostki żelazne. Bez zmian gameplay bez Twoich ABC poniżej.

---

## 1. Co jest aktualne i zsynchronizowane

### 1.1 Ulepszenia terenu ↔ tech (kod — source of truth)

Decyzja **B1-Q1=B**, **B1-Q2=A** (Maciej 2026-06-29): bramka = pole `tech` w `terrain-improvements.json`, nazwy 1:1 z `tech.json` (aliasy tylko legacy).

| Technologia | Ulepszenia (klucz JSON) |
|-------------|-------------------------|
| *(brak)* | wyrab |
| Obróbka drewna | tartak |
| Garncarstwo | glinianka, warzelnia_soli |
| Murarstwo | kopalnia, kamieniolom |
| Rolnictwo | farma |
| Łowiectwo | oboz_lowiecki |
| Oswojenie zwierząt | **bydlo, owce, lama** |
| Gospodarka wodna | irygacja *(alias w kodzie)* |
| Koło | droga |
| Żegluga | lodzie_rybackie |
| Wojskowosc | fort *(teren)* |
| Matematyka | plantacja *(alias Kalendarz→Matematyka)* |

**Hodowla:** pastwisko usunięte; bydło/owce/lama pod **Oswojenie zwierząt** — zgodne z kanonem i JSON.

### 1.2 Budynki ↔ tech (`buildings.json` → `techUnlock`)

22 budynki z `techUnlock` — **wszystkie** wskazują na istniejące nazwy w `tech.json`.  
Mechanizm `research.ts` / panel miasta używa **`techUnlock`**, nie tekstu z kolumny „Odblokowuje budynek”.

### 1.3 Nowe tech kamienia (B1)

**Rolnictwo** (8 PN) i **Łowiectwo** (10 PN) — w drzewku, odblokowują Farma / Obóz łowiecki w polu „Odblokowuje ulepszenie terenu”. ✅

---

## 2. Rozbieżności — tekst tech.json vs gra

Kolumna **„Odblokowuje budynek”** w Excel/JSON to **opis marketingowy**; gra patrzy na `buildings.json` / `units.json` / `terrain-improvements.json`.

### 2.1 Nazwy w tech.json bez odpowiednika w `buildings.json`

| Tech | W tech.json | W grze (faktycznie) |
|------|-------------|---------------------|
| Obróbka drewna | Tartak, Mielerz | **tartak** = ulepszenie terenu; budynek **stolarnia** |
| Garncarstwo | Spichlerz, Cegielnia, Garncarz | **spichlerz** ✅; Cegielnia/Garncz = brak |
| Murarstwo | Mury, Kopalnia | **stela**, **warsztat kamieniarski**; kopalnia = teren |
| Oswojenie zwierząt | Pasterstwo | **bydło/owce/lama** = teren (pastwisko usunięte) |
| Koło | Rydwan, Drogi | **droga** = teren; Rydwan = jednostka |
| Brązownictwo | Huta, brąz, jednostki… | **kuznia** (id), jednostki brązowe |
| Religia | Świątynia | **swiatynia** już od **Mistycyzm** — duplikat koncepcyjny |
| Waluta | Pieniądz, Targowisko, Mennica | **targowisko** ✅; **mennica** = brak budynku |
| Budownictwo / Inżynieria | Akwedukt | **brak** budynku akwedukt |
| Prawo (Kodeks) | Porządek / Sądy | **brak** dedykowanych budynków (sąd dopiero od Kodeks prawa w epoce Żelazo) |
| Drogi żelazne | Drogi brukowane | **brak** wpisu w `terrain-improvements.json` |

**Skutek:** gracz w drzewku nauki widzi inne nazwy niż w panelu budowy miasta / 🔨 na mapie.

### 2.2 Pole „Odblokowuje ulepszenie terenu” — tylko 2 wpisy

W `tech.json` uzupełnione: **Rolnictwo**, **Łowiectwo**.  
Brak wpisów m.in. dla: Oswojenie zwierząt, Obróbka drewna, Murarstwo, Koło, Gospodarka wodna, Wojskowosc, Matematyka, Drogi żelazne — mimo że kod już to gate’uje.

### 2.3 `wymagany budynek` — tylko opis, bez bramki

9 tech ma w JSON „wymagany budynek” (np. Żegluga → Tartak, Pismo → Cegielnia).  
**Kod `availableTechs` tego nie sprawdza** — widać tylko w tooltipie panelu miasta / science.  
Część nazw budynków nie istnieje w `buildings.json` (Tartak, Cegielnia, Huta jako budynek).

---

## 3. Ulepszenia bez tech lub z odłożoną decyzją

| Ulepszenie | Epoka | Tech w JSON | Status |
|------------|-------|-------------|--------|
| **posterunek** | 2 | `-` | **Odłożone** (B1-tech-Q3): propozycja Obróbka drewna + Murarstwo |
| **tarasy** | 2 | `-` | Tylko epoka + cywilizacja (Inkowie/Chińczycy); brak tech |
| **wyrab** | 1 | null | ✅ Zamierzone — free |

### 3.1 Aliasy legacy (B1-Q1)

| W JSON ulepszeń | Mapowane na tech |
|-----------------|------------------|
| Irygacja | Gospodarka wodna |
| Kalendarz | Matematyka |

**Logiczne**, ale w drzewku gracz nie widzi słowa „Irygacja” / „Plantacja wymaga Matematyki” — tylko po hoverze 🔨 na mapie.

### 3.2 Fort — dwa pojęcia

| Typ | Tech | Uwagi |
|-----|------|-------|
| **Fort teren** (`fort` w terrain) | Wojskowosc | Decyzja B1-Q4 ✅ |
| **Fort budynek** (`buildings.json` id `fort`) | Inżynieria | Obrona miasta, inna rola |

To jest **OK gameplay**, ale wymaga jasnego copy w UI („Fort polowy” vs „Fort miejski”).

---

## 4. Jednostki ↔ tech

- **Łucznictwo, Brązownictwo, Koło, Jeździectwo, Żegluga, Oblężnictwo** — jednostki podpięte ✅  
- **Epoka Żelazo w units.json:** tylko **Katapulta** (`Tech: Oblężnictwo`).  
- Brak jednostek z tech: Obróbka żelaza, Hutnictwo żelaza, Sztuka wojenna, Jeździectwo+żelazo itd. (zgodnie z uwagami w tech.json — „do zdefiniowania przez UNITS”).

---

## 5. Logika drzewka — ocena

### Mocne strony

- Kamień: 8 korzeni (Rolnictwo, Łowiectwo, Garncarstwo…) — sensowny start bez jednej „master tech”.
- Ścieżki: Garncarstwo → Wymiana / Gospodarka wodna; Pismo → Matematyka / Handel / Prawo; Brązownictwo → Wojskowosc / Żegluga.
- Koszty rosną z poziomem (8–200 PN); cap v0.1 = **Sztuka wojenna** (epoka Żelazo L8).

### Słabsze / do przemyślenia

1. **10 korzeni w Kamieniu L1** — dużo równoległych badań na starcie (może być OK dla sandboxu, ciężkie dla tutorialu).
2. **Religia vs Mistycyzm** — dwie ścieżki do świątyni; Religia wymaga Cegielni (nie istnieje jako budynek).
3. **Waluta** odblokowuje Mennicę — budynku brak; Targowisko już od Wymiana.
4. **Medycyna → Lazaret** — budynek epoka 5 (Średniowiecze), placeholder tech = Medycyna (świadomie poza cap v0.1).
5. **sciencePicker** — brak sekcji „Odblokowuje ulepszenia terenu” w tooltipie.

---

## 6. Propozycje decyzji ABC (Maciej)

### ✅ Zamknięte 2026-06-26

| ID | Decyzja | Wdrożenie |
|----|---------|-----------|
| **T-TECH-1** | **B** — sync kolumn tech.json z buildings/terrain/units | `gra/data/tech.json` |
| **T-TECH-2** | **A** — tooltip „Odblokowuje na mapie” | `sciencePicker.ts` |
| **T-TECH-3** | **C** — posterunek: AND Obróbka drewna + Murarstwo | `improvement-tech.ts` |

Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-INTEGRATOR_T-TECH-1-2-3.md`

### Otwarte

### T-TECH-4 — Tarasy

**A)** Tech **Matematyka** (z plantacją).  
**B)** Osobna tech **„Inżynieria upraw”** (Brąz).  
**C)** Bez tech — tylko cywilizacja + epoka (status quo).

### T-TECH-5 — Irygacja / Plantacja — aliasy

**A)** Zostawić aliasy (Gospodarka wodna / Matematyka).  
**B)** Dodać osobne tech **Irygacja** i **Kalendarz** do drzewka; usunąć aliasy.

### T-TECH-6 — Brakujące budynki z opisu tech

**A)** Dodać do `buildings.json`: **mennica**, **akwedukt** (minimum pod Waluta/Budownictwo).  
**B)** Wyczyścić z tech.json wzmianki o nich (tylko opis historyczny).  
**C)** Odłożyć na post-v1.0.

### T-TECH-7 — `wymagany budynek` w badaniach

**A)** Wdrożyć twardą bramkę w `availableTechs` (np. Żegluga dopiero po **stolarnia** lub tartaku w imperium).  
**B)** Zostawić jako hint UI only.  
**C)** Usunąć kolumnę z JSON.

### T-TECH-8 — Religia vs Mistycyzm

**A)** **Mistycyzm** = swiatynia kamień; **Religia** = ulepszona świątynia / drugi poziom (nowy budynek).  
**B)** Scalić — jedna tech, jedna świątynia.  
**C)** Religia odblokowuje coś innego (kultura imperium), nie duplikat świątyni.

### T-TECH-9 — Drogi brukowane (Żelazo)

**A)** Dodać `droga_brukowana` do terrain-improvements + render.  
**B)** Ulepszenie istniejącej **drogi** po tech Drogi żelazne.  
**C)** Odłożyć (tech jako placeholder).

---

## 7. Plan wdrożenia (po Twoich ABC)

| Krok | Lane | Zadanie |
|------|------|---------|
| 1 | **CYWILIZACJE** | Patch `tech.json` (opisy, Odblokowuje ulepszenie, ewent. nowe tech) |
| 2 | **UI** | sciencePicker: tooltip ulepszeń + sync z terrain |
| 3 | **SILNIK** | Opcjonalnie: bramka `wymagany budynek` w research |
| 4 | **UNITS** | Jednostki żelazne pod Obróbka żelaza / Sztuka wojenna |
| 5 | **EKONOMIA/MAPA** | Mennica, drogi brukowane, posterunek tech |

**Test regresji:** `node tools/grupa-b-lane-test.cjs` (tech ulepszeń) + istniejące suite’y research/diplo.

---

## 8. Pliki referencyjne

- `gra/data/tech.json` — 31 technologii  
- `gra/data/terrain-improvements.json` — bramki ulepszeń  
- `gra/data/buildings.json` — 22× `techUnlock`  
- `docs/decyzje/B1-tech-MACIEJ-2026-06-29.md` — zamknięte ABC ulepszeń  
- `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` — hodowla/bydło/owce/lama  

---

*Audyt: MASTER / integrator · 2026-06-26 · bez zmian w kodzie — tylko analiza.*
