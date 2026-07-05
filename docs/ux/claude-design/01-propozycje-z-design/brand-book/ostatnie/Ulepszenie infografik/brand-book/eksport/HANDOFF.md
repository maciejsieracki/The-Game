# The Game — Design System v1 (1E · Painted Imperial) — Handoff

Paczka dla zespołu deweloperskiego. Kierunek zatwierdzony: **1E (Painted Imperial)** — ciepłe złoto na ciemnym tle, medaliony, banery, painterly głębia. Decyzje zamknięte: `1B 2C 3C 4C 5C 6C`.

## Tokeny
- `tokens.css` — zmienne `--tg-*` + gotowe klasy (`.tg-medallion`, `.tg-btn-primary`, `.tg-panel`).
- `tokens.json` — te same wartości dla build/Figmy.

Wiodące: `#e8d88a` gold · `#080a12` bg · `#121820` panel · Georgia (tytuły) + Segoe UI (UI).

## Ikony
- Źródło + semantyka: **The Game — Ikony (biblioteka 1E).dc.html** (50 ikon, Tier 1–5).
- Eksport SVG: folder `icons/` (stroke-only, `viewBox 0 0 24`, 40 px, `stroke=currentColor`/gold; nauka na niebiesko).
- Reguła: line minimal, `fill:none`, stroke 1.5 px (24) / 2 px (40). Instancje współdzielą rysunek (np. `tb-build` = `res-work`).
- Semantyka stała: Praca=młotek · Żywność=kłos zboża · Skarbiec=moneta · Nauka=sowa z beretem · Dyplomacja=pergamin+pióro · Porządek=waga · Zdrowie=kaduceusz · Bonus=prezent z gwiazdą.

## Ekrany (makiety 1920×1080, klikalny przepływ)
Wejście: **The Game — Przegląd (1E).dc.html** (hub z linkami).
1. Menu główne → 2. Kreator (kroki 1–5) → 3. HUD mapy → 4. Panel miasta → 5. Dyplomacja → 6. Walka (pre-bitwa / HUD bitwy / oblężenie) → 7. Koniec gry.
Prototyp okablowany linkami: „Rozpocznij grę" → kreator → HUD → (miasto / walka) → koniec → menu.

## Komponenty
`The Game — Komponenty (1E).dc.html`: toasty (info/alert/sukces), tooltip, suwaki presetów pól, karty jednostki/budynku, pasek produkcji, węzły drzewka technologii.

## Dokument
`The Game — Design System v1 (1E).dc.html` — Brand Book: cover, tokeny, typografia, ikony, przyciski (4 stany), panele, chipy, HUD, step bar, Do/Don't, README.

## Zasady wdrożenia (1E)
- **Medalion**: `radial-gradient(circle at 38% 30%, #1a2230, #0a0d14)` + rant 2 px (`#a08030` domyślny / `#e8d88a` aktywny + glow) + inset highlight.
- **Przycisk primary**: złoty bevel `linear-gradient(180deg,#f0dc88,#b99a28)` + inset white + shadow.
- **Panel (5C)**: ramka 2 px złota + gradient `#121820`→bg + głęboki cień + nagłówek uppercase gold.
- **Chip (6C)**: mini-medalion + wartość + **etykieta PL** + przyrost na zielono.
- Kolory semantyczne wyłącznie do znaczeń: niebieski=nauka, zielony=sukces/przyrost, czerwony=wojna/alert, pomarańczowy=ostrzeżenie.

## Do zrobienia później (świadomie odłożone)
- Brand Book → PDF (eksport do druku).
- Pełna biblioteka SVG Tier 3–5 (obecnie eksport core Tier 1–2 + waga/kaduceusz).
- Animacje/motion (glow menu, wjazdy paneli, hover medalionów, przejście tury).

*Lane UI · The Game · Design System v1 · 1E*
