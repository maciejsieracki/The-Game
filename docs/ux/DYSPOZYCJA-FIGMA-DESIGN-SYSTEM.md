# Dyspozycja — Figma Design System v1 (Warstwa 1 + ekrany A–E)

**Data:** 2026-06-26  
**Dla:** lane UI / grupy projektowe A–E  
**Decyzje Macieja:** [`DECYZJE-WARSTWA1-MACIEJ.md`](DECYZJE-WARSTWA1-MACIEJ.md) — `1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A`  
**Spec ikon (OBOWIĄZKOWA):** [`FIGMA-SPEC-IKONY.md`](FIGMA-SPEC-IKONY.md)

---

## Cel

Jeden plik Figmy **„The Game — Design System v1”** zawierający:

1. Tokeny (kolory, fonty, odstępy) wg decyzji **1B, 2C**
2. Komponenty (przyciski **4C**, ramka panelu **5C**, chip **6C**)
3. Biblioteka ikon **3C** — **wyłącznie** z listy w `FIGMA-SPEC-IKONY.md`
4. Strony ekranów **A–E** — layout z komponentów + baseline PNG w tle

**Grupy nie wdrażają kodu** — tylko Figma.

---

## Plik Figmy — struktura stron

**Limit Starter (max 3 strony):** patrz [`FIGMA-LIMIT-3-STRONY.md`](FIGMA-LIMIT-3-STRONY.md).

| Strona | Nazwa | Zawartość |
|--------|-------|-----------|
| **1** | Design System | 00 Tokens + 01 Components + 02 Icons (lane UI) |
| **2** | Mapa i miasto | Sekcja A (HUD) + sekcja B (panel miasta) |
| **3** | Walka · dyplo · meta | Sekcja C + D + E |

**Mapowanie legacy (8 stron → 3):**

| Było | Jest |
|------|------|
| 00–02 | strona **1** |
| 03 Screens A | strona **2** · prefiks `A-` |
| 04 Screens B | strona **2** · prefiks `B-` |
| 05 Screens C | strona **3** · prefiks `C-` |
| 06 Screens D | strona **3** · prefiks `D-` |
| 07 Screens E | strona **3** · prefiks `E-` |

**Reguła:** żadnych „własnych kolorów” poza 00 Tokens.

---

## Tokeny (decyzja 1B + 2C)

### Kolory (Variables)

| Token | Wartość startowa | Użycie |
|-------|------------------|--------|
| `color/bg/deep` | `#080a12` | tło gry |
| `color/bg/panel` | `#121820` | panele |
| `color/gold/primary` | `#e8d88a` | akcent ciepłe złoto |
| `color/gold/dim` | `#a08030` | obwódka przygaszona |
| `color/parchment/text` | `#e8e0c8` | tekst główny |
| `color/parchment/muted` | `#8a8070` | drugorzędny |
| `color/semantic/green` | `#50b070` | pozytyw |
| `color/semantic/blue` | `#5a9bd4` | nauka |
| `color/semantic/red` | `#c84040` | wojna / błąd |

### Fonty (2C)

| Token | Font | Użycie |
|-------|------|--------|
| `font/title` | Georgia | nagłówki, nazwy miast, tytuły paneli |
| `font/ui` | Segoe UI | liczby, przyciski, chipy |

---

## Komponenty (decyzje 4C, 5C, 6C)

### Przycisk outline (4C)

- Tło: transparent
- Obrys: 2px `color/gold/primary`
- Tekst: uppercase, letter-spacing, `font/ui`
- Hover: lekkie wypełnienie `gold/10%`

### Ramka panelu premium (5C)

- Obwódka: **2px** gold
- Cień: `0 12px 40px rgba(0,0,0,.65)`
- Nagłówek: Georgia, uppercase, separator dolny

### Chip zasobu (6C)

Układ poziomy: **`[ikona 24px] [liczba] [etykieta PL]`** — etykieta **zawsze widoczna** (nie tylko tooltip).

Przykład: `[chleb] 142  Żywność` · `[młotek] 87  Praca`

---

## Ikony — jak pracować

1. Otwórz [`FIGMA-SPEC-IKONY.md`](FIGMA-SPEC-IKONY.md).
2. Dla każdego **ID** narysuj wariant **24** i **40**.
3. **Praca = młotek** — bez wyjątków tam, gdzie spec tak mówi.
4. **Żywność główna = kromka chleba** (kłos tylko w `chip-grain` / polach).
5. **Nauka = sowa z beretem** — referencja: opis w spec + `gra/src/ui/icons/scienceOwlIcon.ts`.
6. Reużywaj instancje (`res-work` dla build/labor/field-production).

---

## Baseline jako tło

Dla każdego ekranu na stronach 03–07:

1. Import PNG z `docs/ux/baseline/[grupa]/`.
2. Warstwa tła 30–40% opacity + lock.
3. Nowy layout **na wierzchu** — komponenty z 01–02.

Checklist nazw plików: [`baseline/README.md`](baseline/README.md)

---

## § Grupa A — HUD mapy (strona 03)

**Rejestr:** `REJEST-UX-MASTER.md` § Grupa A  
**Baseline:** `docs/ux/baseline/A/`

**Do zaprojektowania w Figmie (min.):**

- Pasek zasobów D1B z chipami 6C (Tier 1)
- Blok Wpływ (środek) — `res-influence` + etykieta
- Osiedla + chipy dyplo (`dip-alliance`, `dip-pact`, `dip-war`)
- Przycisk Menu — `ui-menu`
- Lewy toolbar — Tier 2 (40px)
- Minimapa (ramka + placeholder canvas)

**Melduj:** screenshot strony 03 + lista użytych komponentów.

---

## § Grupa B — Panel miasta (strona 04)

**Rejestr:** `REJEST-UX-MASTER.md` § Grupa B  
**Baseline:** `docs/ux/baseline/B/`

**Do zaprojektowania (min.):**

- Górny pasek zasobów miasta (chipy 6C + Manpower)
- Pionowy rail — Tier 3 (9 zakładek)
- Ramka panelu 5C — layout 3 kolumny
- Zakładki drawer: Plony, Produkcja, Miasto, Okolica (ikony z spec Tier 4/6)

---

## § Grupa C — Walka (strona 05)

**Rejestr:** `REJEST-UX-MASTER.md` § Grupa C  
**Baseline:** `docs/ux/baseline/C/`

Pre-bitwa, HUD 3D, panel jednostek — komponenty z 01, ikony wojska = `tb-army` / `chip-manpower`.

---

## § Grupa D — Dyplomacja (strona 06)

**Rejestr:** `REJEST-UX-MASTER.md` § Grupa D  
**Baseline:** `docs/ux/baseline/D/`

Panele dyplomacji, propozycje, chipy Tier 5, banner akceptacji (`ui-accepted` / `ui-denied`).

---

## § Grupa E — Menu i kreator (strona 07)

**Rejestr:** `REJEST-UX-MASTER.md` § Grupa E  
**Baseline:** `docs/ux/baseline/E/`

Menu główne, nowa gra, ustawienia — przyciski outline 4C, ramki 5C, Georgia w tytułach.

---

## Definition of Done (cały plik Figma)

- [ ] Strony 00–07 istnieją
- [ ] Variables opublikowane (kolory + fonty)
- [ ] Wszystkie ID Tier 1–5 w 02 Icons (24 + 40)
- [ ] Każdy chip HUD ma etykietę PL (6C)
- [ ] Ekrany A–E używają **tylko** instancji z 00–02
- [ ] Baseline PNG podpięte na 03–07
- [ ] Link do pliku dopisany w `WORKFLOW-GRAFIKA-UI-v2.md`
- [ ] Meldunek w `dyspozycje/UI-DO-MASTERA.md` (append)

---

## Po Figmie (lane UI — nie grupy)

1. Export Variables → `gra/data/design-tokens.json`
2. Export SVG ikon → `gra/src/ui/icons/`
3. Wdrożenie paneli kolejno **E → A → B → D → C** (decyzja 8A)
4. Folder `docs/ux/after/` — te same nazwy PNG co baseline

---

*Dyspozycja otwarta · status: CZEKA na plik Figma*
