# DYSPOZYCJA — WDROŻENIE PACZKI „POLE BITWY — TW v5" (2026-07-23)

## Co to jest
Zatwierdzony redesign HUD pola bitwy (styl Total War:WH3 · 1E). Nowy kanon zastępuje wizualnie:
C06 Deployment v4 · C07 Pole HUD bitwy v2 · C23 Szczegóły v1 · C12 Koniec v3.

## KROK 1 — Wgranie do repo (Maciej)
Rozpakuj ZIP i wgraj zawartość do repo `maciejsieracki/The-Game`, ścieżka docelowa:

```
docs/ux/claude-design/01-propozycje-z-design/brand-book/
```

Mapowanie (struktura w paczce = struktura docelowa):
| Plik w paczce | Dokąd | Uwaga |
|---|---|---|
| `brand-book/KANON/mockupy/The Game - C06 Pole bitwy odswiezenie (1E).dc.html` | `.../brand-book/KANON/mockupy/` | NOWY — makieta, 6 klatek |
| `brand-book/KANON/mockupy/support.js` | `.../brand-book/KANON/mockupy/` | runtime — tylko jeśli brak w repo |
| `brand-book/KANON/CANON.md` | `.../brand-book/KANON/` | NADPISZ (zaktualizowany kanon) |
| `brand-book/KANON/START - KANON aktualny (1E).dc.html` | `.../brand-book/KANON/` | NADPISZ (nowa karta ★ w hubie) |
| `brand-book/KANON/support.js` | `.../brand-book/KANON/` | tylko jeśli brak w repo |
| `brand-book/DESIGN-do-UI_POLE-BITWY-TW-v5.md` | `.../brand-book/` | NOWY — nota dla integratora |
| `WYMIANA-UI-DESIGN.md` | katalog statusu (jak dotychczas) | NADPISZ (wpis w logu 2026-07-23) |

Commit: `POLE BITWY TW v5 — nowy kanon HUD bitwy (makieta + CANON + nota DESIGN-do-UI)`

## KROK 2 — Weryfikacja po wgraniu
Otwórz w przeglądarce `KANON/START - KANON aktualny (1E).dc.html` → karta **„★ POLE BITWY · TW v5"** → makieta musi pokazać 6 klatek (ręczna / AUTO / rozstawianie / C-23 / C-12 / C-09 stany).

## KROK 3 — Zlecenie dla integratora (Cursor/Code)
Przekaż integratorowi:
1. **Źródło prawdy wizualnej:** makieta `The Game - C06 Pole bitwy odswiezenie (1E).dc.html` + nota `DESIGN-do-UI_POLE-BITWY-TW-v5.md` (wartości CSS sekcja po sekcji).
2. **Pliki kodu do zmiany:** `gra/src/battle/battleHudTheme.ts` (style/tokeny), `gra/src/battle/manualBattle.ts` (layout HUD), `gra/src/battle/battleMinimap.ts` (panel tempo+minimapa).
3. **Zakres (7 punktów):**
   - panele HUD ~70% + backdrop-blur (teren widoczny pod HUD-em)
   - dolny toolbar: same ikony, wyśrodkowany, podpis wyłącznie na hover
   - LIKWIDACJA prawego raila 56 px → tempo/pauza/prędkości/AUTO w jednym panelu z minimapą; muzyka/dźwięk/pomoc pod ikoną ustawień obok „Wycofaj się"
   - top-bar v5: portrety dowódców z pierścieniem HP + zegar bitwy + pasek przewagi; cluster liczb NIE lustrzany; **strzałka „↓" przy „Ty" — USUNĄĆ z gry**
   - banery nad oddziałami (chorągiewka + HP/morale + maszt) + bogaty tooltip jednostki (Postawa/Świeżość/Grupa + legenda statów + efekty terenu)
   - roster: medalion generała w nagłówku, filtry i akcje ikonowe z hoverem, stany kart (pusty slot / rout 50% / martwa 40%)
   - nowe ekrany C-23 (Zniszczone #ff7b7b / Rozbite #ffd54a / Ocalałe #7ad0a0) i C-12 (Zwycięstwo/Porażka + hint „ta sama armia · pełne HP")
4. **Tokeny bez zmian** (battleHudTheme). Żelazna zasada: roster = LEWY pionowy panel, bez dolnego docka TW.

## KROK 4 — Po wdrożeniu
Screenshot z gry → do porównania z makietą (odpowiem w `WYMIANA-UI-DESIGN.md`). Pytania integratora dopisujcie w sekcji 5 „Dyspozycje przychodzące".
