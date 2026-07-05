# Tokeny kolorów i typografia — skrót (decyzja 1B, 2C)

## Kolory

| Token | Hex | Użycie |
|-------|-----|--------|
| `bg/deep` | `#080a12` | Tło gry, ekrany pełnoekranowe |
| `gold/primary` | `#e8d88a` | Tytuły, obrysy 4C, akcenty |
| `gold/dim` | `#a08030` | Ornamenty, ramki drugorzędne |
| `text/primary` | `#e8e0c8` | Tekst główny (pergamin) |
| `text/muted` | `#8a8070` | Podtytuły, footery |
| `panel/bg` | `#121820` | Tło paneli |
| `science/blue` | `#5a9bd4` | Nauka, linki informacyjne |
| `semantic/green` | `#50b070` | Sukces, potwierdzenie |
| `semantic/red` | `#c84040` | Wojna, porażka, alert |
| `semantic/orange` | `#d08030` | Ostrzeżenia |

**Gradient panelu:** `linear-gradient(180deg, rgba(14,18,28,.98), rgba(8,10,16,.95))`

**Glow menu:** radial gold center ~8% opacity na `#080a12`

## Typografia (2C)

| Rola | Font | Przykład |
|------|------|----------|
| Tytuły, logo, nagłówki h1–h2 | **Georgia** | THE GAME, NOWA GRA, Epoka Startowa |
| UI, liczby, przyciski, chipy | **Segoe UI** | Rozpocznij grę, Żywność, krok 2 z 5 |
| Label uppercase | Segoe UI 10–11px | letter-spacing 0.2–0.5em |

## Komponenty (skrót)

| Decyzja | Komponent | Spec |
|---------|-----------|------|
| **4C** | Przycisk outline | tło transparent · border 2px gold · hover lekkie wypełnienie |
| **4C primary** | CTA | ten sam outline · może mocniejszy glow · **nie** pełne złote wypełnienie domyślnie |
| **5C** | Panel | border 2px gold · cień głęboki · nagłówek uppercase gold |
| **6C** | Chip HUD | ikona line 24px + wartość + **etykieta PL** (np. „Praca”) |
| **3C** | Ikona | stroke 1.5–2px · fill none · patrz 02-SPEC-IKONY.md |

## Spacing / radius (propozycja v1)

- Radius przycisku: 6px
- Radius panelu: 8px
- Gap stack menu: 11px
- Padding panelu: 12–18px
