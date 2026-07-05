# Grupa E — workflow Figma (menu · kreator · game over)

**Dla:** Grupa E · Maciej (review) · lane UI  
**Plik kanon:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · fileKey `COVbTJUV5dx8MzMxfWlYeu`  
**Priorytet wdrożenia w grze:** **pierwszy** (decyzja Macieja **8A**: E → A → B → D → C)

---

## Skąd brać styl (decyzje Macieja — zamknięte)

**Nie decydujesz nic nowego** — tylko stosujesz:

| Decyzja | Efekt w Figmie |
|---------|----------------|
| **1B** | Ciepłe złoto `#e8d88a`, tło ciemne `#080a12`, tekst pergaminowy |
| **2C** | „THE GAME”, „NOWA GRA” = **Georgia**; liczby i przyciski = Segoe UI |
| **4C** | Przyciski **przezroczyste + złoty obrys** 2px |
| **5C** | Panele z **grubą ramką** (karty epoki, cywilizacji, ustawień) |
| **3C** | Ikony line-art z listy: `ui-menu`, `ui-close`, `ui-check` |

Pełna lista: [`DECYZJE-WARSTWA1-MACIEJ.md`](../../DECYZJE-WARSTWA1-MACIEJ.md) · ikony: [`FIGMA-SPEC-IKONY.md`](../../FIGMA-SPEC-IKONY.md)

---

## Po sygnale GOTOWE 00–02 (MASTER · 2026-07-01)

**Startujecie jako pierwsi** w layoutcie Figma · **grupy A–D czekają za Wami.**

| Krok | Frame | Uwaga |
|------|-------|--------|
| **1** | **E-01 Menu** | Priorytet wizualny — pierwsze wrażenie |
| 2 | E-03 | Ustawienia globalne |
| 3 | E-09 | Kreator · epoka |
| 4 | E-10 | Kreator · cywilizacja |
| 5 | E-11 | Kreator · ustawienia gry |
| 6 | E-15 | Game over (+ porażka) |

**Cel:** najlepsza jakość startu — baseline **@ 35% lock** + instancje **Panel 5C / Btn 4C / Chip 6C** z DS (nie jednorazówki).

**Review Macieja:** [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) — dopiero gdy frame’y gotowe.

---

## Jak meldować postęp (OBOWIĄZKOWE)

Pełna reguła: [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § **Reguła meldunków**.

| Co | Gdzie |
|----|--------|
| POSTĘP / STOP / GOTOWE | **Ten plik** — sekcja Meldunki · `[data]` · 5–15 linii · frame’y **X/6** |
| Ważne dla lane UI | `dyspozycje/UI-DO-MASTERA.md` — **OD GRUPY E** |
| W czacie do Macieja | *„Zapisane w RAPORT-FIGMA.md § [data]”* |

**Nie dotyczy** innych raportów projektu (walka, ekonomia, integrator, playtest → własne `*-DO-MASTERA`).

---

## Jak pracować (krok po kroku)

1. **Baseline PRZED** — 6 PNG z `docs/ux/baseline/E/` (kopia w `export/`) → warstwa tła **@ 35% opacity**, **lock**.
2. **Komponenty wspólne** — pasek kroków, przyciski, panele = **instancje** ze strony **1 · Design System** (byłe 00–02: Tokens, Components, Icons).
3. **Frame’y** — rysuj na **stronie 3 · sekcja E** (Starter: max 3 strony — patrz [`FIGMA-LIMIT-3-STRONY.md`](../../FIGMA-LIMIT-3-STRONY.md); legacy nazwa: „07 Screens E”).
4. **Pixel-perfect:** [`SPEC-FRAMES.md`](SPEC-FRAMES.md) — 6 ekranów, canvas 1920×1080.
5. **Eksport PO** — `export/E-*_po.png` (po redesignie).
6. **Raport** — [`RAPORT-FIGMA.md`](RAPORT-FIGMA.md) → wpis **GOTOWE**.

---

## 6 frame’ów obowiązkowych

| Frame | Baseline | Rejestr |
|-------|----------|---------|
| E-01 Menu główne | `export/E-01_menu-glowne.png` | E-01 |
| E-03 Ustawienia | `export/E-03_ustawienia.png` | E-03 |
| E-09 Epoka (kreator k2) | `export/E-09_kreator-krok2-epoka.png` | E-09 |
| E-10 Cywilizacja (k3) | `export/E-10_kreator-krok3-cywilizacja.png` | E-10 |
| E-11 Ustawienia gry (k4) | `export/E-11_kreator-krok4-ustawienia.png` | E-11 |
| E-15 Game over | `export/E-15_game-over.png` | E-15 (+ wariant porażka) |

---

## Blokery (stan 2026-06-26 — skorygowany)

| Bloker | Status | Kto rusza |
|--------|--------|-----------|
| ~~Brak Figma MCP~~ | ❌ **USUNIĘTE** — MCP działa (`plugin-figma-figma`, konto Maciej) | — |
| ~~Brak URL pliku~~ | ❌ **USUNIĘTE** — URL w [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) | — |
| **00–02 / strona 1 DS niegotowe** | 🟡 **ZOSTAJE** — bez tokenów i komponentów ekrany = jednorazówki (reguła projektu) | lane UI |
| **0/6 frame’ów w Figmie** | 🟡 **ZOSTAJE** — spec + baseline ✅, praca do wykonania | Grupa E (po GOTOWE 00–02 **lub** równolegle z lokalnymi stylami → podmiana na instancje) |
| **Limit MCP Starter** | 🟡 **ZOSTAJE** — oszczędnie MCP **lub** Figma w przeglądarce ręcznie | Maciej upgrade **lub** ręczna praca |

**Maciej jako decydent:** na tym etapie **nic nie blokuje** — styl masz zamknięty. Puść lane UI na domknięcie strony 1 DS.

---

## Definition of Done (GOTOWE)

- [ ] 6 frame’ów na stronie 3 · sekcja E
- [ ] Menu + kreator + game over = instancje z DS (nie ręczne jednorazówki)
- [ ] Tytuły Georgia · reszta Segoe UI
- [ ] Export `E-*_po.png` → `export/`
- [ ] Raport: status **GOTOWE**

**Stan dziś:** 6/6 baseline ✅ · 0/6 frame’ów Figma · DoD końcowy ❌

---

## Co potem (po Figmie E)

1. Eksport tokenów / SVG / CSS → lane UI  
2. Kod: `mainMenu.ts`, `newGameFlow.ts`, game over overlay — **pierwszy wizualny batch**  
3. Potem grupy A → B → D → C  
4. Integrator: rebuild `Gra-podglad.html` po batchu UI (nie projekt w Figmie)

---

## Review Macieja (bez technikaliów)

Checklist: [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md)

| Kiedy | Co robisz |
|-------|-----------|
| **Teraz** | Nic pilnego — styl zatwierdzony |
| **Gdy E-01 w Figmie** | Czy to „THE GAME”, które chcesz (złoto + Georgia) |
| **Kreator E-09…E-11** | Czy kroki czytelne · przyciski outline OK |
| **E-15** | Zwycięstwo (złoto) **i** porażka (czerwień) |
| **Po wdrożeniu kodu** | Playtest: menu → kreator → start — pierwsze wrażenie |

---

*Grupa E · sync RAPORT-FIGMA.md · STATUS-FIGMA.md*
