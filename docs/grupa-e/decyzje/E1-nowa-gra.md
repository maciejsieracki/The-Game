# E1 — Nowa gra (menu + kreator)

> **Grupa E** · Ekran: `[EKRAN: Menu]` · Lane: UI, MAPA, CYWILIZACJE  
> **Status:** ✅ ABC **1–12 ZAMKNIĘTE** · implementacja handoffów TODO · **Grupa D:** cyw startowe

---

## Decyzje Macieja (2026-06-26)

| Pole | Decyzja Macieja | Uwagi |
|------|-----------------|-------|
| Cywilizacja | **Default: Rzymianie**; wszystkie 9 do wyboru | `ikonaId`: `rzymianie` |
| Epoka startowa | **Default: Kamień**; **Brąz wybieralny** | Żelazo „wkrótce" |
| Trudność | Wszystkie 3; **default Normalny** | |
| Rozmiar mapy | **Default: Standardowy** (84×60) | Korekta vs propozycja D13 (Mała) |
| Liczba nacji/rywali | **Skalować do rozmiaru mapy** | Standard → **6 rywali AI** (7 typów aktywnych) |
| Typ świata | **4 opcje**; default **Kontynenty** | + **Ziemia** (preset MAPA) |
| Prędkość gry | Default **Standardowa** | bez zmiany |

### ABC paczka 1–12 (2026-06-27)

| Nr | Temat | Decyzja | Data |
|----|-------|---------|------|
| **1** | Reset przy „Nowa gra" | **A** — pełny reset (skarbiec 0, nauka 0, pusta lista tech) | 2026-06-27 |
| **2** | Start epoki + tech wcześniejsze | **B*** — reguła kaskadowa (patrz niżej) | 2026-06-27 |
| **3** | Kształt mapy Ziemia | **A** — stały preset | 2026-06-27 |
| **4** | Zakres rywali w menu | **A** — ±1 od zalecanej; skala 9 typów → **Grupa D** | 2026-06-27 |
| **5** | Przyciski menu S0 | **C** — hybryda E1 + B (patrz niżej) | 2026-06-27 |
| **6** | Kampania / Multi v1.0 | **A** — widoczne, szare, „Wkrótce" | 2026-06-27 |
| **7** | Tło menu | **A** — wideo w pętli (wyciszone) | 2026-06-27 |
| **8** | Złoża metali (E3) | **B*** — miedź→Brąz, żelazo→Żelazo; tylko **Góry** | 2026-06-27 |
| **9** | Widoczność złoża | **B** — ukryte do epoki | 2026-06-27 |
| **10** | Zwycięstwo v1.0 (E2) | **A*** — Power>50% + rakieta | 2026-06-27 |
| **11** | Barbarzyńcy / buntownicy | **C*** — do przed-Średniowiecza / potem buntownicy | 2026-06-27 |
| **12** | Mockup kreatora | **A** — sync mockupów teraz | 2026-06-27 |

**Uzasadnienie nr 1:** Nowa gra = czysty start. Poprzednia sesja tylko przez **Kontynuuj** / **Wczytaj** w menu głównym.

**Decyzja nr 2 (reguła kaskadowa):**
- Start **Kamień** → brak wcześniejszych epok; tech Kamienia od zera.
- Start **Brąz** → wszystkie tech **Kamienia** już zbadane; Brąz badasz od zera.
- Start **Żelazo** *(przyszłość)* → wszystkie tech **Kamienia + Brązu** zbadane; Żelazo od zera.
- Jednostki/budynki epoki startowej **przez odblokowane tech**, nie przez osobny starter-pack.
- v1.0: tylko epoki z kreatora (Kamień, Brąz; Żelazo po odblokowaniu) — bez skoku do późniejszych etapów.

**Decyzja nr 4 + uwaga:** wybór rywali **±1** (A). Roster **9 typów** skaluje się do mapy (mała ≠ 9 nacji) — domknięcie w **Grupie D**: `handoff/E1-do-GRUPA-D_cywilizacje-startowe.md`.

### Typ świata — 4 opcje

| # | Etykieta menu | Silnik | Generacja |
|---|---------------|--------|-----------|
| 1 | **Kontynenty** (default) | `kontynenty` | proceduralny |
| 2 | Pangea | `pangea` | proceduralny |
| 3 | Wyspy | `wyspy` | proceduralny |
| 4 | **Ziemia** | `ziemia` | preset `ZIEMIA_LAND_CENTERS` (`gen-helpers.ts`) — **E1-Q11** kształt |

**Decyzja nr 5 (menu S0, C — pełna hybryda):**
- **Główny ekran:** hero **wideo (7=A)** · **Rozpocznij grę** · **Kampania** · **Multiplayer** · **Ustawienia**
- **Podmenu „Więcej":** **Kontynuuj** · **Wczytaj grę** · **O grze** · **Wyjdź**
- Kampania/Multi: **6=A** — widoczne, wyszarzone, klik → „Wkrótce"
- Handoff UI: `dyspozycje/_handoff/GRUPA-E-do-UI_menu-S0-5C.md`

**Decyzja nr 8 (E3, szczegóły w `E3-surowce-epoki.md`):** ruda miedzi przy wejściu w Brąz; ruda żelaza przy wejściu w Żelazo; **wyłącznie Góry** (nie Wzgorza).

---

## Wykonanie

| Data | Co | Status |
|------|-----|--------|
| 2026-06-26 | UI+MAPA: kreator, typ Ziemia, skala rywali | **GOTOWE** |
| 2026-06-26 | SILNIK: seed, typSwiata, eraId, generujSwiat | **WPIĘTE** (Grupa F) |
| 2026-06-27 | ABC **1=A** (reset Nowa gra) | **ZAMKNIĘTE** |
| 2026-06-27 | ABC **2=B*** (tech epok wcześniejszych) | **ZAMKNIĘTE** — kod **TODO** SILNIK |
| 2026-06-27 | ABC **3=A**, **4=A** | **ZAMKNIĘTE** — 4 + audyt cyw → Grupa D |
| 2026-06-27 | ABC **5=C**, **6=A**, **7=A** | **ZAMKNIĘTE** — UI **TODO** |
| 2026-06-27 | ABC **8=B***, **9=B** | **ZAMKNIĘTE** — MAPA **TODO** |
| 2026-06-27 | ABC **10=A*** (zwycięstwo E2) | **ZAMKNIĘTE** — CYW/SILNIK **TODO** |
| 2026-06-27 | ABC **11=C***, **12=A** | **ZAMKNIĘTE** — **PACZKA 1–12 komplet** |
| — | Handoffy implementacji | TODO lane'y + SILNIK |
| — | Batch SILNIK E1 1–4 | **GOTOWE-do-wpiecia** (po Grupa D audyt opcjonalnie równolegle) |
| — | Kanon | **CZEKA** bramka TEST + Opus |

---

## → SILNIK

Handoff: `dyspozycje/_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md`  
Pytania: `decyzje/E1-PYTANIA-DO-SILNIKA.md`
