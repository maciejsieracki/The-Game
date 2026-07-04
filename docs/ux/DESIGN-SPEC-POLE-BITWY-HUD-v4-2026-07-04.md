# DESIGN SPEC — POLE-BITWY HUD v4

**ZLECENIE-ID:** `POLE-BITWY-HUD-v4-2026-07-04`  
**Status:** **ZATWIERDZONE MASTER** (odpowiedzi Grupa C · 2026-07-04 ~20:58)  
**Dla:** Design (Claude Design) · lane UI (port po ZIP) · review Opus

**Źródła:** Maciej werdykt ~20:52 · odpowiedzi Design A–F · `MASTER-DELTA-POLE-BITWY-vs-mockupy.md`

---

## A. Scope i format deliverable

| Element | Decyzja |
|---------|---------|
| **C06 v4** | **Jeden plik**, **3 sekcje/klatki:** Deploy · AUTO · R+roster (scroll pionowy w R) |
| **C09 v4** | **Osobny plik** — lewy panel **w kontekście mapy** (wcięty od lewej, nie neutralne tło) |
| **ZIP MUST** | `DESIGN-do-UI_POLE-BITWY-HUD-v4.md` (region → `battleScene.ts` / `battleHudTheme.ts`) |
| **PNG @1920** | **TAK** → `docs/ux/pipeline/02-po-design/grupa-C/` (3 stany C06 + C09) |
| **ZIP nazwa** | `POLE-BITWY-HUD-v4-2026-07-04.zip` |

**Nazwy plików (potwierdzone):**

- `The Game - C06 Deployment v4 2026-07-04 (1E).dc.html`
- `The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html`

---

## B. Stare briefy — wycofane (paczka 1)

| Brief | Status |
|-------|--------|
| `DESIGN-BRIEF-C06-v4-map-redesign.md` (pionowe morale + dolny dock TW) | **NIE** — obowiązuje DELTA |
| `DESIGN-BRIEF-C09-roster-tw-v3.md` (dolny dock 2 rzędy TW) | **WYCOFANY** — lewy panel 6 kol × max 5 rzędów, scroll pionowy |
| C-07 dolny pasek komend | **NIE** w paczce 1 — komendy = **prawy rail 56px** |

---

## C. C09 v4 — lewy roster

| Parametr | Spec |
|----------|------|
| **Szerokość @1920** | **~368px** stała (6×56px karty + gap 4px + padding); Design może **370px** jeśli ramka 1E wymaga |
| **Karta MUST** | ikona typu (SVG, zero emoji) · nazwa skrócona · badge grupy (numer) · pasek HP · pasek morale · HP tekst · obwódka zaznaczenia (**niebieska Ty**) · martwy/routed = przyciemnienie |
| **Filtry** | aktywny chip = **złoto 1E**; akcent per typ dopuszczony (błękit konnica / złoto piechota / piaskowy łucznicy) — jak kod |
| **◆ Grupuj** | Design może **SVG diament** z brand-book; funkcja ta sama |
| **>30 kart** | **TAK** — osobna mini-klatka ze scrollbarem 1E w C09 v4 |

---

## D. C06 v4 — mapa + HUD

| Parametr | Spec |
|----------|------|
| **Placeholder mapy** | **B** — heksy + sylwetki + ramki grup + złota obwódka + linia podziału nieb/czerw |
| **Minimapa** | **TAK** — lewy dół, obok rosteru (deploy + R) |
| **Pasek mocy** | **zielony (Ty)** \| **czerwony (wróg)** — jak kod · etykieta **„Ostatnie starcia” TAK** pod paskiem |
| **Stan AUTO** | roster ukryty · toolbar ukryty · rail widoczny · **R bez podświetlenia** (normalny stan) |
| **Stan R** | hint **„SPACJA = tura”** — dyskretny label 1E u dołu mapy lub nad toolbar (propozycja Design) |
| **Taktyka/Strategia** | **TAK** — jedna klatka z **otwartym popupem Taktyka** (Deploy lub R) |
| **Chips lewej kolumny toolbara** | Design proponuje wizualnie (chip 1E); treść jak kod |
| **Start walki CTA** | **czerwony gradient** (default mockup) · wariant **złoty 1E** w stopce mockupu jako **wariant B** · Maciej może skorygować przy playteście |

---

## E. Rail + top

| Parametr | Spec |
|----------|------|
| **Rail** | we **wszystkich 3 stanach** C06 (deploy, AUTO, R) · szer. **56px** |
| **Etykiety** | skróty **P / V / R / M / MUZ / H / >> / WYCOF** OK · pełne słowa w tooltipie → `DESIGN-do-UI` |
| **Top deploy** | emblemat cywilizacji + miecz/tarcza **TAK** (jak kod) |
| **Log starć** | **NIE** w paczce 1 (ani deploy, ani AUTO/R) |

---

## F. Workflow po ZIP

```
Design ZIP v4 → lane UI port skin → MASTER review → Opus → F kanon POLE-BITWY
```

**Termin ZIP:** ustalany przez Design — MASTER bez twardego SLA.

**Jedyny otwarty ABC (opcjonalny playtest):** kolor **Start walki** — czerwony (default) vs złoty 1E.

---

## Referencje

- `docs/ux/MASTER-DELTA-POLE-BITWY-vs-mockupy.md`
- `docs/ux/WKLEJKA-DESIGN-START-POLE-BITWY-HUD-v4.md`
- `docs/ux/export/C-POLE-BITWY-review-3stany.html`
- Live: `Gra-podglad-POLE-BITWY.html` (build `manual-polish`)
- Maciej werdykt: `docs/archiwum-czatow/maciej-decyzje/POLE-BITWY-werdykt_2026-07-04.md`

---

## DoD Design (checklist)

- [ ] C06 v4 — 3 klatki: Deploy · AUTO · R+roster
- [ ] C09 v4 — panel w kontekście mapy + mini-klatka scroll >30 kart
- [ ] Popup Taktyka otwarty (1 klatka)
- [ ] Minimapa deploy + R
- [ ] Pasek mocy zielony/czerwony + „Ostatnie starcia”
- [ ] Rail 56px × 3 stany · zero logu
- [ ] `DESIGN-do-UI_POLE-BITWY-HUD-v4.md` + `MANIFEST.txt`
- [ ] PNG @1920 → `pipeline/02-po-design/grupa-C/`
- [ ] Zero emoji · tokeny 1E · Start walki czerwony (+ wariant B złoty w stopce)
