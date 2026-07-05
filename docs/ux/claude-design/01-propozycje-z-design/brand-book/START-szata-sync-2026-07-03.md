# ▶ START — szata-sync-2026-07-03 (Design — czytaj TO pierwsze)

**Hasło w czacie:** `START — szata-sync-2026-07-03`  
**Data:** 2026-07-03 · **Sign-off Maciej:** playtest OK · decyzje D16=A, D17=A, Wiki góra-prawo

---

## KROK 0 — Potwierdź start

Napisz Maciejowi:

> szata-sync START · czytam `START-szata-sync-2026-07-03.md` · edytuję HUD Mapy layout (1E) + HUD Kit + Wiki SVG.

---

## KROK 1 — Otwórz pliki (kolejność)

| # | Plik (w `brand-book/`) | Po co |
|---|------------------------|-------|
| 1 | **`START-szata-sync-2026-07-03.md`** | ten plik — procedura |
| 2 | **`The Game - HUD Mapy layout (1E).dc.html`** | **EDYTUJ** — główny deliverable |
| 3 | **`The Game — HUD Kit (1E).dc.html`** | komponenty (chip, Wiki, kontekst, wydarzenie) |
| 4 | **`The Game - Ekran Miasto (1E).dc.html`** | Wiki + ukryty dolny HUD mapy (razem z W3) |
| 5 | **`eksport/tokens.css`** | dodaj `--civ-wiki-accent` jeśli brak |
| 6 | **`START-W3-miasto-1E.md`** | reszta ekranu miasta (9 rail, 6 chipów…) |

**Referencja wizualna (Maciej):** gra robocza `gra-robocza/START.html` — Ctrl+F5 (poza brand-book; opis w §2 poniżej).

---

## KROK 2 — Co zmienić vs stary mockup HUD (1E)

### USUŃ

| Element | Powód |
|---------|--------|
| **Strefa D — 3 banery liderów** (proporczyki) | D16=A — ukryte do v1.0 |
| **Panel kontekstowy** z tekstem „kliknij jednostkę…” **cały czas** | D17=A — domyślnie ukryty |
| Wiki / Pomoc z **lewnego toolbaru** lub **minimapy** | decyzja Macieja 2026-07-03 |

### DODAJ

| Element | Spec |
|---------|------|
| **Przycisk Wiki** | Prawy górny róg: **Epoka/Osiedla → Wiki → Menu** |
| Akcent Wiki | `#a8c878`, stan `.on` gdy panel otwarty |
| **Panel Wiki** (klatka otwarta) | Lewy overlay **340px**, zakładki Poradnik / Encyklopedia, meta: Skrót · Hasło · Pełny artykuł |
| **`eksport/icons/ui-wiki.svg`** | Książka @16/@24, line 3C, `currentColor` |

### PRZESUŃ / ZMIEŃ

| Strefa | Było | Ma być |
|--------|------|--------|
| **H Wydarzenia** | `top:180px` | **Nad stosem tury** — `bottom:172px`, `right:20px`, szer. **300px** |
| **C Kontekst** | zawsze widoczny placeholder | **3 stany** (§3) |
| **F Akcje jednostki** | placeholder cały czas | **Tylko po wyborze** własnej jednostki |
| **B Toolbar** | 5 medalionów (mix) | **Miasto · Nauka · Dyplomacja · Wojsko · Budowa** — bez Kultury/Religii/Cudów |

### BEZ ZMIAN (potwierdź)

- **A** — 5 chipów: Skarbiec · Praca · Nauka · Kultura · Ludność (jeden rząd)
- **A2** — Moc centralna („Moc”, nie Power/Wpływ)
- **E** — minimapa **280×170** + 2 przyciski Kultura/Religia obok
- **G** — Wykonaj + Zakończ turę + etykieta (200px, prawy dół)

---

## KROK 3 — Panel kontekstowy — 3 klatki w mockupie

| Klatka | Co rysujesz |
|--------|-------------|
| **C0 domyślna** | **Nic** — brak panelu C |
| **C1 heks** | Karta 300px, `top:300px` `right:20px`, pełna ramka złota: teren + plony (np. Heks 12,7 · Równina · 🍞2 🔨1) |
| **C2 jednostka** | Ta sama pozycja: typ + heks + Ruch/Atak/Obrona |

---

## KROK 4 — Ekran miasta (razem z W3)

| Na mapie | W trybie miasta |
|----------|-----------------|
| Toolbar, minimapa, wydarzenia, tura, kontekst — **widoczne** | **Ukryte** — nie rysuj w mockupie miasta |
| — | Górny pasek + **Wiki + Menu** — **widoczne** |
| — | Dim **opaque** (pełna maska), nie półprzezroczysty |

---

## KROK 5 — Deliverable

- [ ] `The Game - HUD Mapy layout (1E).dc.html` — stany: start · heks · jednostka · Wiki otwarte
- [ ] `The Game — HUD Kit (1E).dc.html` — komponenty wyciągnięte
- [ ] `The Game - Ekran Miasto (1E).dc.html` — Wiki + brak dolnego chrome mapy
- [ ] `eksport/icons/ui-wiki.svg`
- [ ] `eksport/HANDOFF.md` — sekcja „Szata sync 2026-07-03”
- [ ] **`ostatnie/HUD-map-sync-2026-07-03.zip`** → Maciej

**Nie implementujesz kodu** — Lane UI integruje po zipie.

---

*Maciej · 2026-07-03 · powiązane: `START-W3-miasto-1E.md` (miasto), Wikipedia § w WYMIANA (log Cursor)*
