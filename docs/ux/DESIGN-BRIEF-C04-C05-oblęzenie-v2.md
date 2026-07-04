# Design Brief — C-04 + C-05 Oblężenie na mapie v2 (1E)

**Od:** Maciej / Lane UI  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-03  
**Priorytet:** P1 — **następny po C-12 Koniec bitwy v2** ✅  
**Poprzedni:** `docs/ux/claude-design/The Game - C12 Koniec bitwy v2 (1E).dc.html`

---

## Cel

Dwa mockupy **flow oblężenia na mapie świata** (przed wejściem w C-01 pre-bitwę / C-19 mur):

| ID | Deliverable | Flow |
|----|-------------|------|
| **C-04** | `The Game - C04 Atak miasto wybor v2 (1E).dc.html` | Wojsko przy **wrogim mieście z murem** → klik miasta → modal wybór |
| **C-05** | `The Game - C05 Panel oblezenie v2 (1E).dc.html` | Po **Oblężaj** lub klik już obleganego miasta → panel boczny |
| **A-19** | `The Game - A19 Miasto zdobyte v2 (1E).dc.html` | Pusty garnizon → zdobycie bez bitwy → tabliczka OK |

**Folder:** ten sam co C-01 / C-06 / C-12 — `docs/ux/claude-design/`

**Tło mockupu C-05:** mapa świata 1E (pergamin, heksy) **widoczna** — panel nie zasłania całego ekranu (decyzja C3-Q7=A: overlay prawy, mapa żywa).

---

## Kontekst w grze

**Flow oblężenia v1.0:** C-04 → C-05 → (tury na mapie) → C-01 → C-19/C-20 na polu bitwy.

**Kod dziś (baseline do portu po Design):**

| ID | Plik |
|----|------|
| C-04 | `gra/src/ui/cityAttackChoice.ts` |
| C-05 | `gra/src/ui/siegeMapPanel.ts` |
| A-19 | `gra/src/ui/cityCaptureNotice.ts` |

**Playtest baseline (screenshot, nie styl finalny):**

- `Gra-podglad.html` — wojsko przy wrogim mieście z murem → klik miasto
- Po kanonie: `gra-kanon/START.html` (ten sam flow)

---

## Spójność 1E (must)

- Tokeny: `brand-book-1E/eksport/tokens.css` · panel 5C · outline 4C · złoto `#e8d88a`
- Nagłówki Georgia, uppercase, letter-spacing jak C-01 / C-12
- **Zero emoji** — SVG line-art z brand-book (`02-SPEC-IKONY.md`)
- Przyciski primary / outline jak **C-01 Pre-bitwa v2**
- HUD mapy w tle (C-05): spójny z `UI/Makieta-HUD-mapa-swiata.html` (pasek zasobów, minimapa — można uproszczone)

**Kolory akcji (spójne z walką):**

| Akcja | Akcent | Uwaga |
|-------|--------|-------|
| **Oblężaj** (strategia, wolniejsze) | ciepły `#c87840` / obramowanie `#c84040` subtelnie | nie mylić z „wróg = czerwony" na polu bitwy |
| **Szturm** (natychmiastowa bitwa) | `#3a6ad0` (Ty) | prowadzi do C-01 z murem |
| **Anuluj / Odwrót** | neutral slate | outline 4C |

---

## C-04 — Modal „Atak na miasto" (1920×1080)

**Trigger:** jednostka gracza obok wrogiego miasta z 🛡 mur → klik miasta.

### Layout

```
[ mapa przyciemniona blur ]
        ┌──────────────────────────────┐
        │  ── ⚔ ──  ATAK NA MIASTO     │  ← ornament + Georgia
        ├──────────────────────────────┤
        │ [ikona]  Kapua               │
        │          Mur miejski · Garnizon · Pop 12 │
        │ Atakujesz: Legioniści ×1     │
        │ Wybierz sposób działania     │
        │ ┌─────────────┐ ┌─────────────┐
        │ │ OBLĘŻAJ     │ │ SZTURM      │
        │ │ otocz miasto│ │ od razu     │
        │ │ (1)         │ │ bitwa (2)   │
        │ └─────────────┘ └─────────────┘
        │         [ Anuluj ]           │
        └──────────────────────────────┘
```

### Copy (PL, kanoniczne)

- Tytuł: **Atak na miasto**
- Tagi celu: **Mur miejski** · **Garnizon** / **Pusty garnizon** · **Populacja N**
- Oblężaj — opis: *Otocz miasto — osłab z czasem, zbuduj machiny*
- Szturm — opis: *Natychmiastowa bitwa — ryzyko wysokich strat*
- Skróty klawiszowe w mockupie (małym tekstem): `1` Oblężaj · `2` Szturm · `Esc` Anuluj

### Stany (opcjonalnie druga warstwa w pliku)

- Miasto **bez muru** — ten modal się **nie pokazuje** (pominąć lub adnotacja w mockupie)
- Garnizon pusty vs pełny — ten sam layout, inny tag

---

## C-05 — Panel oblężenia (1920×1080, mapa widoczna)

**Trigger:** po C-04 „Oblężaj" lub klik miasta już w stanie oblężenia.

### Pozycja

- Panel **prawy**, `top ~120px`, `right ~10px`, `bottom ~72px` (nad dolnym HUD mapy)
- Szerokość ~360px · scroll wewnętrzny jeśli treść długa
- Animacja: slide-in z prawej (jak dziś w kodzie)

### Layout

```
┌─ OBLĘŻENIE ─────────────────┐
│ Tura oblężenia: 3           │
├─────────────────────────────┤
│ Kapua · Mur · Garnizon 4    │
│ Atakujący: Legioniści (Ty)  │
│                             │
│ Zapasy: 24    Zużycie/t: 16 │
│ Oblegających: 3  Atrycja: −2│
│ Milicja przy szturmie: ~8     │
│                             │
│ ⚠ Kapitulacja za 1 turę!    │  ← stan ostrzeżenia (opcjonalna warstwa)
│                             │
│ MACHINY OBLĘŻNICZE          │
│ Kolejka: Taran · Gotowe: —  │
│ Postęp: ████░░ 60%          │
│ [ + Taran ] [ + Wieża ]     │
│                             │
│ [ Kontynuuj ] [ Szturm ] [ Odwrót ] │
│ Enter = kontynuuj · 2 = szturm      │
└─────────────────────────────┘
```

### Trzy akcje dolne

| Przycisk | Rola | Kolor hover |
|----------|------|-------------|
| **Kontynuuj oblężenie** | zamyka panel, wojsko zostaje | złoto / neutral |
| **Szturm** | C-01 z pełnym składem oblężenia | niebieski `#3a6ad0` |
| **Odwrót** | kończy oblężenie | slate |

**Tylko gracz** widzi aktywny Szturm — w mockupie zakładamy widok gracza (AI można adnotować).

### Sekcja machin

- **Taran** i **Wieża oblężnicza** — ikony SVG, nie emoji
- Kolejka + gotowe + pasek postępu budowy
- Przyciski „Dodaj do kolejki" (outline 4C)

---

## A-19 — „Miasto zdobyte" (1920×1080, modal centrum)

**Trigger:** atak miasta wroga **bez obrońców** — bez pre-bitwy (screenshot Macieja).

- Modal centrum · ten sam styl co C-04 (węższy)
- Tytuł **Miasto zdobyte** · nazwa miasta · opis · **Rozumiem · Enter**
- SVG zamiast 🏛

---

## Definition of Done (Design)

- [ ] **Trzy** pliki `.dc.html` w `docs/ux/claude-design/` (C-04, C-05, A-19)
- [ ] 1920×1080 · tokeny 1E · zero emoji
- [ ] C-04: modal centrum + mapa w tle
- [ ] C-05: mapa + HUD mapy + panel prawy + sekcja machin
- [ ] A-19: modal zdobycia bez bitwy
- [ ] Kolory akcji zgodne z tabelą powyżej
- [ ] Meldunek: C-04 / C-05 / A-19 v2 gotowe + ścieżki

**Po Design:** lane UI portuje `cityAttackChoice.ts` + `siegeMapPanel.ts` + `cityCaptureNotice.ts` (bez `main.ts`).

**Następny w kolejce Grupy C:** **C-19 + C-20** mur na polu bitwy — START po zamknięciu C-04/C-05.

---

## Referencje

- `docs/ux/REJEST-UX-MASTER.md` — C-04, C-05, A-17
- `docs/ux/DECYZJA-C-kolory-stron-bitwa.md`
- `docs/ux/claude-design/The Game - C01 Pre-bitwa v2 (1E).dc.html` — przyciski / panel
- `docs/ux/claude-design/The Game - C12 Koniec bitwy v2 (1E).dc.html` — ornament, karty statystyk
