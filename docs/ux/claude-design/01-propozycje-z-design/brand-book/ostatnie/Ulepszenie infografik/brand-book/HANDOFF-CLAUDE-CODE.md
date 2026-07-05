# HANDOFF → Claude Code / Cursor — The Game · Design System 1E

**Cel:** przenieść i utrzymać Design System **1E (Painted Imperial)** w repo `maciejsieracki/The-Game`.
**Wykonawca:** Claude Code / Cursor (ma prawo zapisu na dysk + `git push`).
**Źródło prawdy dla stylu:** ten plik + pliki w `brand-book/`.

---

## 0. Zadanie dla Ciebie (Cursor/Claude Code)
1. Utwórz katalog docelowy: `docs/ux/claude-design/01-propozycje-z-design/brand-book/`.
2. Wgraj tam pliki z paczki `brand-book.zip` (dostarczonej osobno) **1:1**.
3. Skopiuj `WYMIANA-UI-DESIGN.md` do `docs/ux/claude-design/WYMIANA-UI-DESIGN.md`.
4. `git add` → `git commit -m "Design System 1E — brand-book"` → `git push origin main`.
5. Dalsze zmiany UI rób zgodnie z sekcjami 3–6 poniżej (decyzje zamknięte — nie zmieniać bez nowej dyspozycji).

Jeśli nie masz zipa: odtwórz pliki wg specyfikacji (sekcje 3–7) — to wystarcza do wiernej rekonstrukcji.

---

## 1. Struktura docelowa
```
docs/ux/claude-design/
├── WYMIANA-UI-DESIGN.md              # log + dyspozycje (append-only)
└── 01-propozycje-z-design/
    └── brand-book/
        ├── The Game — Przegląd (1E).dc.html          # HUB — wejście
        ├── The Game — Design System v1 (1E).dc.html  # Brand Book
        ├── The Game — Ikony (biblioteka 1E).dc.html  # 50 ikon Tier 1–5
        ├── The Game — Komponenty (1E).dc.html
        ├── The Game — Motion (1E).dc.html
        ├── The Game — Ekran Menu (1E).dc.html
        ├── The Game — Ekran Kreator (1E).dc.html
        ├── The Game — Kreator Kroki (1E).dc.html
        ├── The Game — HUD Kit (1E).dc.html
        ├── The Game — Ekran Miasto (1E).dc.html
        ├── The Game — Ekran Dyplomacja (1E).dc.html
        ├── The Game — Ekran Walka (1E).dc.html
        ├── The Game — Walka Warianty (1E).dc.html
        ├── The Game — Ekran Koniec Gry (1E).dc.html
        ├── The Game — Koniec Porażka (1E).dc.html
        ├── The Game — Design System — Warianty.dc.html
        ├── support.js                                 # runtime .dc.html (nie edytować)
        ├── DYSPOZYCJA.md
        └── eksport/
            ├── tokens.css
            ├── tokens.json
            ├── HANDOFF.md
            └── icons/  (34 × .svg)
```
> Pliki `.dc.html` to samodzielne dokumenty (Design Components) — otwierają się w przeglądarce; `support.js` musi leżeć obok.

## 2. Uruchomienie / podgląd
- Otwórz `The Game — Przegląd (1E).dc.html` w przeglądarce → hub z linkami do wszystkich ekranów.
- Linki między ekranami są względne (działają po skopiowaniu całego folderu).

---

## 3. Kierunek wizualny — 1E „Painted Imperial" (ZAMKNIĘTE)
Premium historyczny, „grywalny" HUD: ciepłe złoto na głębokiej czerni, wytłaczane medaliony z metalicznym rantem, banery, painterly głębia. Nie flat, nie sci-fi. **Zero emoji.**

Decyzje zamknięte: `1B` złoto · `2C` Georgia+Segoe · `3C` ikony line w medalionach · `4C` przycisk bevel/outline · `5C` panel premium · `6C` chip + etykieta PL · `7/8A` bez zmian bez nowej dyspozycji.

## 4. Tokeny (patrz `eksport/tokens.css` / `tokens.json`)
```
bg/deep      #080a12   tło gry / ekrany pełne
gold/primary #e8d88a   tytuły, ranty aktywne, akcenty
gold/dim     #a08030   ornamenty, ranty domyślne
text/primary #e8e0c8   tekst (pergamin)
text/muted   #8a8070   podtytuły
panel/bg     #121820   tło paneli
science/blue #5a9bd4   nauka, info
green        #50b070   sukces, przyrost
red          #c84040   wojna, alert, porażka (E-15b)
orange       #d08030   ostrzeżenia
```
Fonty: **Georgia** (serif — tytuły, nazwy) + **Segoe UI** (sans — UI, liczby, etykiety).
Skala: H1 64–88 / H2 36 / H3 22 · label uppercase letter-spacing .2–.5em.

## 5. Wzorce komponentów (literalne CSS)
- **Medalion:** `radial-gradient(circle at 38% 30%, #1a2230, #0a0d14)` + `border:2px` (`#a08030` domyślny / `#e8d88a` aktywny + glow `0 0 26px rgba(232,216,138,.4)`) + `box-shadow: inset 0 2px 4px rgba(232,216,138,.16), 0 4px 10px rgba(0,0,0,.55)`.
- **Przycisk primary:** `linear-gradient(180deg,#f0dc88,#b99a28)` + `border:1px #6a5212; border-top-color:#f8eea8` + `box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 6px 18px rgba(232,216,138,.2)` + tekst `#2e2708` uppercase 700.
- **Przycisk default:** `linear-gradient(180deg,#161c28,#0a0d14)` + `border:2px rgba(232,216,138,.4)` + tekst `#e8d88a`.
- **Panel (5C):** `border:2px rgba(232,216,138,.45)` + `linear-gradient(180deg,rgba(18,24,32,.96),rgba(8,10,16,.96))` + `box-shadow: 0 16px 44px rgba(0,0,0,.6)` + nagłówek uppercase gold z `linear-gradient(90deg,rgba(232,216,138,.08),transparent)`.
- **Chip (6C):** mini-medalion (30px) + wartość (Segoe 700) + **etykieta PL** + przyrost `#50b070`.

## 6. Ikony — reguły + semantyka (ZAMKNIĘTE)
- Styl: **stroke-only**, `fill:none`, `viewBox 0 0 24`, eksport 40 px (i 24 px w chipach), `stroke-width` 1.5 (24) / 2 (40), `stroke=currentColor`, końce zaokrąglone. Kolor rantu semantyczny (złoto / niebieski=nauka / czerwony=wojna / zielony=sukces).
- Semantyka (NIE zmieniać):
  - Praca = **młotek** · Żywność = **kłos zboża** · Skarbiec = **moneta** · Nauka = **sowa z beretem**
  - **Dyplomacja = uścisk dłoni (handshake)** · Porządek = **waga** · Zdrowie = **kaduceusz** · Bonus = **prezent z gwiazdą** · Pokój = **gołąb z gałązką**
  - Miasto = Partenon · Religia = świątynia · Wpływ = lilia · Wojsko = skrzyżowane miecze
- Instancje współdzielą rysunek: `tb-build`=`res-work`, `cp-labor`=`res-work`, `tb-science`=`res-science` itd.
- Gotowe SVG: `eksport/icons/` (34 szt.). Reszta z biblioteki: patrz `The Game — Ikony (biblioteka 1E).dc.html`.

## 7. Ekrany (kompletne, 1920×1080)
Menu → Kreator (kroki 1–5) → HUD mapy → (Panel miasta / Dyplomacja / Walka: pre-bitwa, HUD bitwy, oblężenie) → Koniec gry (Zwycięstwo / Porażka). Prototyp okablowany linkami względnymi.

## 8. Backlog (do zrobienia — priorytet malejący)
- [ ] Ekran **badań** (drzewko technologii) — spójny z `Makieta-drzewko-technologii.html` w repo
- [ ] Ekran **wojska** (lista armii)
- [ ] Brand Book → **PDF**
- [ ] Integracja tokenów 1E z realnym UI gry (`UI/`, `Gra-podglad*.html`)
- [ ] Pełne stany hover/active wpięte w komponenty

## 9. Protokół pracy
- Log i dyspozycje: `docs/ux/claude-design/WYMIANA-UI-DESIGN.md` (append-only).
- Nowe pliki tylko w `…/brand-book/` (KANON). Bez nowych folderów poza strukturą z §1.
- Po zmianach: commit + push na `main`.

*Autor stylu: sesja UI Design (chmura). Wersja: 1E · 2026-07-01.*
