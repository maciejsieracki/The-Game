# Design Brief — C-21 Koniec bitwy v2 (1E)

**Od:** Maciej / Lane UI  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-03  
**Priorytet:** P0 — **następny po C-09 Karty jednostek v2** ✅  
**Poprzedni:** `docs/ux/claude-design/The Game - C09 Karty jednostek v2 (1E).dc.html`

---

## Cel

Mockup **ekranu końca bitwy** (+ opcjonalnie stany flash i szczegóły) w stylu **1E**, spójny z C-01 / C-06 v3 / C-09.

**Deliverable główny:** `docs/ux/claude-design/The Game - C21 Koniec bitwy v2 (1E).dc.html`

**Zakres ID:**

| ID | Element | W pliku |
|----|---------|---------|
| **C-22** | Baner flash wyniku (1–2 s przed panelem) | stan 1 lub overlay w tym samym `.dc.html` |
| **C-21** | Panel środkowy — statystyki + akcje | **stan główny** |
| **C-23** | Modal **Szczegóły** (po kliknięciu) | stan 2 (drugi ekran / warstwa) |

---

## Kontekst w grze

Bitwa kończy się gdy: morale armii / brak jednostek / gracz **POMIN**.

**Kod:** `gra/src/battle/battleScene.ts` — `_showResultBanner`, `_showEndScreen`, `_showEndDetails`  
**Playtest:** `Gra-podglad-BITWA.html` → **T** → doprowadź do końca lub **POMIN**

---

## Kolory stron (obowiązkowe)

Patrz `docs/ux/DECYZJA-C-kolory-stron-bitwa.md`:

| | Hex | W UI końca bitwy |
|---|-----|------------------|
| **Ty / zwycięzca gracza** | `#3a6ad0` | wiersz statystyk gracza, akcent zwycięstwa gdy Ty wygrałeś |
| **Wróg** | `#c84040` | wiersz przeciwnika |
| Złoto | `#e8d88a` | tytuł panelu, ramka 5C |

Copy może nadal mówić „Atakujący / Obrońca” w statystykach — **kolory** = Ty niebieski / wróg czerwony (zgodnie z rolą gracza w tej bitwie).

---

## C-22 Baner flash (krótki)

- Pełny ekran, pole bitwy przyciemnione w tle (blur / dim)
- Środek: duży napis serif, złoty:
  - **Zwycięstwo atakującego!** lub **Zwycięstwo obrońcy!**
- Bez przycisków · fade · **zero emoji**

---

## C-21 Panel główny (1920×1080)

Tło: przyciemnione pole bitwy (placeholder jak C-09) + overlay `rgba(4,8,18,.55)`.

### Panel 5C (środek, ~480–560px)

```
┌─────────────────────────────────────┐
│         KONIEC BITWY                │
│   Zwycięstwo atakującego!           │  ← Georgia, złoto; kolor zwycięzcy subtelny glow
│                                     │
│   Atakujący (Ty) — padli: 0         │
│   pozostali: 4/4 · HP 297/300     │  ← niebieski akcent jeśli gracz = ATK
│                                     │
│   Obrońca — padli: 2                │
│   pozostali: 2/4 · HP 114/400       │  ← czerwony akcent wróg
│                                     │
│   [ Szczegóły ]  [ Zakończ bitwę ]  │
└─────────────────────────────────────┘
```

**Przyciski (4C jak C-01):**

| Przycisk | Styl |
|----------|------|
| **Szczegóły** | secondary outline złoty |
| **Zakończ bitwę** | **primary** — gradient jak „Atakuj-auto” / „Start walki” |

**Dane z kodu (nie wymyślać nowych pól):** padli/rozbici · pozostali (z total) · suma HP / HP max.

---

## C-23 Modal szczegółów (stan po „Szczegóły”)

- Overlay ciemniejszy · panel szerszy (~640px)
- Nagłówek: **Szczegóły bitwy**
- **Dwie kolumny:** ATAKUJĄCY | OBROŃCA
- W każdej kolumnie 3 sekcje:
  - **Zniszczone** (czerwony akcent)
  - **Zrootowane** (bursztyn / `#e8d88a`)
  - **Ocalali** (zielony stan OK — tu zielony dozwolony jako „żywi”)
- Lista: `Nazwa jednostki` · `×N`
- Przycisk **Zamknij** (secondary) — wraca do C-21

Przykładowe dane: Legionariusz ×2, Łucznik ×1…

---

## Styl (must)

- Tokeny 1E · panel `linear-gradient(180deg,#161c28,#0a0d14)` · ramka 2px złota  
- Spójność z **C-01 Pre-bitwa v2** (przyciski)  
- **Bez emoji** · SVG jeśli ikony przy nagłówku  
- Stopka: `The Game · C-21 Koniec bitwy · 1E`

---

## Referencje

| Plik | Rola |
|------|------|
| `The Game - C01 Pre-bitwa v2 (1E).dc.html` | Przyciski primary/secondary |
| `The Game - C06 Deployment v3 (1E).dc.html` | Tło pola + kolory Ty/wróg |
| `docs/ux/figma/grupa-C/FIGMA-FRAMES-C.html` | Frame C-21 |
| `docs/ux/baseline/C/C-21_ekran-konca-bitwy.png` | PRZED (screenshot gry) |

---

## DoD Design

- [ ] `.dc.html` ze stanem **C-21** (+ opcjonalnie C-22 flash i C-23 modal jako drugi widok)  
- [ ] Kolory Ty `#3a6ad0` / wróg `#c84040` w statystykach  
- [ ] Meldunek: **„C-21 v2 gotowy”** + ścieżka

---

## Po Design

1. Maciej akceptacja  
2. Lane UNITS/UI port `_showEndScreen` / `_showEndDetails` / `_showResultBanner`  
3. Potem: **C-04/C-05 oblężenie** lub **C-19 mur** (wg listy)

---

## Mapowanie ID (info)

W rejestrze lane **C-09** = dolny pasek komend; plik Design **„C09 Karty jednostek”** = rejestr **C-15 + C-16** (roster TW). To zamierzone nazewnictwo Design — nie mylić z paskiem komend.
