# Grupa E — pilot redesignu (krok po kroku)

**Cel pilota:** przetestować **cały tor** Warstwa 1 — Figma → meldunki w repo → **eksport PNG** → review Macieja (z PNG) → kod → gra wygląda inaczej.

**Zakres pilota:** **E-01 Menu główne** pierwszy (pełny sukces), potem E-03…E-15 w tej samej procedurze.

**Plik Figmy:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
**Spec:** [`SPEC-FRAMES.md`](SPEC-FRAMES.md) · **Review:** [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md)

---

## Kto co robi w pilocie

| Faza | Grupa E | Lane UI (Grupa 0) | Maciej | Integrator F |
|------|---------|-------------------|--------|--------------|
| 0 Prep | ✅ GOTOWE 00–02 min. E | sygnał wysłany **2026-07-01** | — | — |
| 1 Figma E-01 | **🟢 w toku** | DS strona 1 ✅ | — (review po PNG) | — |
| 2 Eksport PO | **`export/E-01_po.png` w repo** | — | — | — |
| 3 Review | meldunek GOTOWE E-01 + PNG ✅ | — | checklist E-01 **z PNG** (bez Figmy) | — |
| 4 Tokeny | — | tokeny + SVG → repo | — | — |
| 5 Kod menu | — | `mainMenu.ts` + CSS/tokeny | playtest | kanon po UI |
| 6 After | — | skrypt baseline E | OK / poprawki | md5 |

---

## FAZA 0 — prep E-01 ✅ (domknięte 2026-07-01)

**Grupa E wykonała:** spec + baseline 6/6 · reguła meldunków · czekało na sygnał.

**Sygnał lane UI:** **GOTOWE 00–02 (min. pod E)** → przejście do **FAZA 1** poniżej.

---

## FAZA 1 — layout Figma (**AKTYWNA** · E-01 Menu)

**Sygnał startu od lane UI (Maciej przekazuje jedną linijkę):**

```
GOTOWE 00–02 — strona 1 Design System gotowa (min. pod E).
Start: Grupa E · sekcja E · frame E-01 Menu · SPEC-FRAMES.md
Link: https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu
```

**Grupa E — krok po kroku w Figmie:**

| # | Akcja | Szczegóły |
|---|--------|-----------|
| 1 | Otwórz kanon | strona **3 · sekcja E** (legacy: 07 Screens E) |
| 2 | Nowy frame | `1920×1080` · nazwa **`E-01 · Menu główne`** |
| 3 | Baseline lock | Place image → `export/E-01_menu-glowne.png` · **opacity 35%** · **lock** warstwy |
| 4 | Tło | `#080a12` (+ opcjonalny radial glow — spec) |
| 5 | Komponenty | **Instancje** ze strony 1 DS — **nie** ręczne jednorazówki (Btn 4C, teksty Georgia/Segoe) |
| 6 | Zgodność | [`SPEC-FRAMES.md`](SPEC-FRAMES.md) § E-01 — emblem, ornament, stack przycisków, footer |
| 7 | Export PO | `export/E-01_po.png` (@1x lub 2x — spójnie w całej grupie) |
| 8 | Meldunek | `RAPORT-FIGMA.md` — **POSTĘP E-01** · **export PO ✅** · frame’y **1/6** |

**MCP:** opcjonalnie struktura frame’a; **PNG baseline = ręcznie** Place image.

**DoD FAZY 1 (obowiązkowy przed review Macieja):**

1. **`docs/ux/figma/grupa-E/export/E-01_po.png`** (@1x lub 2x)
2. Wpis **POSTĘP E-01:** **export PO ✅** · frame’y **1/6**

**Bez pliku w repo = POSTĘP niekompletny (oficjalnie 0/6).** Nie meldować „gotowe do review” bez PNG.

**BLOCK review (2026-07-01) — E-01 PO gołym okiem:** ikony menu **3C** · CTA **4C outline** (nie pełne wypełnienie) · **Georgia 2C** · baseline ~35% ledwo widoczny. Samo grubsze złoto = odrzucone.

**Review Macieja:** **tylko czat MASTER** — MASTER wkleja PNG + CHECKLIST § 1 · Maciej **nie** wchodzi do Figmy.

---

## FAZA 2 — eksport PO do repo (obowiązkowe przed review Macieja)

**Grupa E — przed meldunkiem „gotowy do review”:**

1. Export frame **E-01** z Figmy → **`docs/ux/figma/grupa-E/export/E-01_po.png`** (@1x lub 2x — spójnie w całej grupie).
2. W `RAPORT-FIGMA.md`: **export PO ✅** · ścieżka pliku · frame’y **1/6**.

**DoD:** plik `E-01_po.png` **istnieje w repo** — inaczej POSTĘP uznajemy za niekompletny.

---

## FAZA 3 — review Macieja (PNG lokalnie, nie Figma)

**Grupa E:** w `RAPORT-FIGMA.md` — wpis **`E-01 gotowy do review`** · export PO ✅ · frame’y 1/6.

**Maciej:** [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) § **1. Menu główne** — patrzy na **`export/E-01_po.png`**, nie otwiera Figmy.

**Wynik:**
- **OK** → FAZA 4
- **Poprawki** → Grupa E poprawia w Figmie → **nowy `E-01_po.png`** + wpis POSTĘP → Maciej ponownie §1 (bez ABC, chyba że zmiana stylu globalnego)

---

## FAZA 4 — tokeny do repo (lane UI)

**Lane UI wykonuje (jeden batch):**

| Co | Skąd (Figma) | Dokąd (repo) |
|----|--------------|--------------|
| Variables użyte w E-01 | strona 1 DS | `gra/data/design-tokens.json` + CSS `:root` (jeśli jeszcze brak) |
| Ikony menu | strona 2 Icons | `gra/src/ui/icons/` (SVG) |
| Referencja wizualna | `export/E-01_po.png` | zostaje w `figma/grupa-E/export/` |

**Meldunek:** `UI-DO-MASTERA.md` — **→ INTEGRATOR: GOTOWE** (batch E-01 tokeny) · handoff jeśli potrzeba.

**Grupa E:** frame’y nadal **1/6** — Figma GOTOWE per ekran dopiero po review + eksporcie.

---

## FAZA 5 — kod w grze (lane UI → Integrator)

**Lane UI:** styl **`gra/src/ui/mainMenu.ts`** (+ ewent. wspólny CSS paneli) wg Figma E-01 — **bez** zmiany logiki menu.

**Integrator F:** wpięcie jeśli dotyka `main.ts` · build → `Gra-podglad-ROBOCZA.html` · bramka testów.

**Test sukcesu pilota:** otwierasz grę → **menu główne wygląda jak E-01 z Figmy** (złoto, Georgia, outline 4C).

**Maciej:** playtest 2 min — menu tylko: „czy to ten klimat?”

---

## FAZA 6 — after + domknięcie pilota E-01

1. Lane UI / skrypt: zrzut menu **PO** wdrożeniu → `docs/ux/after/E/E-01_menu-glowne.png`
2. Porównaj obok `docs/ux/baseline/E/E-01_menu-glowne.png`
3. **Grupa E:** w raporcie — **E-01 PILOT OK** · gotowość na E-03
4. Powtórz **FAZA 1→5** dla E-03, E-09, E-10, E-11, E-15
5. Gdy **6/6** + export + review → status **GOTOWE** w `RAPORT-FIGMA.md`

---

## Minimalny Design System pod pilot (prośba do lane UI)

Lane UI może ogłosić **GOTOWE 00–02 (min. E)** gdy na stronie 1 jest:

- [ ] Variables: tło, złoto, pergamin, semantic/red
- [ ] Btn Outline: Primary / Default / Disabled (4C)
- [ ] Panel 5C (ramka)
- [ ] Text styles: Georgia title, Segoe UI label
- [ ] Ikony: `ui-menu`, `ui-check`, `ui-close` (3C)

Reszta komponentów DS (Chip 6C, rail Tier 3…) — przed grupami A/B, nie blokuje E-01.

---

## Meldunki (tylko to zadanie Figma)

| Co | Gdzie |
|----|--------|
| POSTĘP / review / GOTOWE | [`RAPORT-FIGMA.md`](RAPORT-FIGMA.md) append |
| Ważne dla lane UI | `dyspozycje/UI-DO-MASTERA.md` OD GRUPY E |
| Czat Maciej | *„Zapisane w RAPORT-FIGMA.md § [data]”* |

---

*Pilot Grupa E · sync WORKFLOW-GRAFIKA-UI-v2 · decyzja 8A*
