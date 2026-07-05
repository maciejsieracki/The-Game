# Design Brief — Grupa C · Faza 1: Pre-bitwa (C-01)

**Od:** Lane UI / Maciej (decydent)  
**Do:** Design (brand-book 1E)  
**Data:** 2026-07-03  
**Priorytet:** P0 — przed Fazą 2 (pole bitwy C-06…C-21)

---

## Cel

Odświeżyć **ekran przed bitwą** (`preBattle`) tak, aby był spójny z **HUD mapy 1E** (W2/W3), mockupem miasta i tokenami brand-book — nie „programistyczny overlay”, tylko **premium antyczny** (Total War × nasz Design System).

**Deliverable Design:** nowy mockup HTML **`UI/Makieta-preBattle-v2.html`** (+ opcjonalnie strona w hubie 1E) — lane UI portuje potem do `gra/src/ui/preBattle.ts`.

---

## Co to NIE jest (Faza 2 — później)

| Ekran | ID | Plik kodu | Stan |
|-------|-----|-----------|------|
| **Faza deploymentu** (panel na dole pola 3D) | C-06 | `battleScene._buildDeployOverlay` | Ad-hoc CSS inline — **brak mockupu** |
| HUD bitwy (góra, dół, log, minimapa) | C-07…C-21 | `battleScene.ts` | Osobny brief **Faza 2** |

Screenshot Macieja z **FAZA ROZSTAWIANIA** = **C-06**, nie C-01. Najpierw projektujemy **C-01**, potem cały pakiet bitwy.

---

## Jak zobaczyć C-01 dziś

1. `Gra-podglad.html` → Nowa gra  
2. Zaznacz wojsko → atak wroga na sąsiednim heksie  
3. Pojawia się overlay **„Uwarunkowania bitwy”**

**Mockup kanoniczny (2026-06):** `UI/Makieta-preBattle.html`  
**Kod:** `gra/src/ui/preBattle.ts` (~740 linii, inline style)

---

## Struktura ekranu (must keep — logika gry)

```
┌─────────────────────────────────────────────────────────┐
│ TOP: tytuł + lokalizacja (Uwarunkowania bitwy)          │
├─────────────────────────────────────────────────────────┤
│ GENERAŁOWIE: portret ATK (L) · portret DEF (P)          │
│              (+ opcjonalnie pionowy pasek mocy TW)      │
├──────────────┬─────────────────┬────────────────────────┤
│ Wojska ATK   │ ŚRODEK          │ Wojska DEF             │
│ siatka kart  │ pergamin:       │ siatka kart            │
│ jednostek    │ teren, warunki, │ jednostek              │
│              │ bonusy nacji,   │                        │
│              │ szanse auto %   │                        │
├──────────────┴─────────────────┴────────────────────────┤
│ AKCJE: Auto · Bitwa ręczna · Wycofaj · [Zapisz]         │
├─────────────────────────────────────────────────────────┤
│ FOOTER: Atakujący vs Obrońca · tura                     │
└─────────────────────────────────────────────────────────┘
```

**Tło:** mapa świata **przyciemniona + blur** (gracz widzi kontekst, focus na panelu).

---

## Audyt: mockup vs kod vs Design 1E

| Element | Mockup `Makieta-preBattle` | Kod `preBattle.ts` | Design 1E | Uwagi Design |
|---------|---------------------------|-------------------|-----------|--------------|
| Tokeny kolorów | `--gold`, `--panel` | `--pb-*` osobne | `tokens.css` / `--civ-*` | **Ujednolicić** z brand-book |
| Tło mapy | `#map-bg` SVG + blur | `backdrop-filter` na overlay | — | Czy pełnoekranowy dim vs karta? |
| Layout | 3 kolumny + generals | ✅ zgodny | — | OK |
| Pasek mocy TW (pionowy między generałami) | `#power-col` w mockupie | **BRAK** — tylko % w środku | — | **Decyzja:** przywrócić pionowy pasek? |
| Portrety wodzów | 88px, gradient, obwódka atk/def | 72px, prostsze | medaliony cyw | **Propozycja:** medalion + placeholder SVG |
| Karty jednostek | `.u-card` 2× grid | emoji ikony | `unit-*` SVG (Tier 3?) | Zamienić emoji → miniatury line-art |
| Środek (pergamin) | Kemperbad styl | uproszczony panel | panel 5C | Mocniejsza „pergaminowa” tekstura |
| Bonusy nacji | — | ✅ sekcja (D4) | kropki kolorów | Zachować czytelność |
| Przyciski akcji | 4× outline (auto/man/ret/save) | grid 3–4 btn | komponent 4C | **Spójność z menu / HUD** |
| Typografia | Georgia + Segoe | ✅ podobnie | 2C | Doprecyzować rozmiary |
| Animacja wejścia | — | `pb-fadeIn` | motion.css | Subtelny fade + scale |

---

## Wymagania wizualne (Design)

1. **Spójność z 1E:** `--civ-gold-primary`, `--civ-panel-bg`, ramka 2px złota (5C), przyciski outline (4C).
2. **Czytelność:** kontrast atk (czerwień) / def (błękit) **tylko** jako akcent — nie dominuje nad złotem.
3. **Ikony:** bez emoji w finalie — jednostki: placeholder SVG lub tier z brand-book; akcje: line-art (⚡→SVG błyskawica itd.).
4. **Responsywność:** min szerokość ~720px; max ~920px karta; scroll w kolumnach bocznych.
5. **Stany:** Wycofaj disabled (`canRetreat=false`); hover/focus na przyciskach; primary = Bitwa ręczna (domyślny Enter — do potwierdzenia Macieja).

---

## Deliverables Design (checklist)

| # | Plik / artefakt | Opis |
|---|-----------------|------|
| 1 | `UI/Makieta-preBattle-v2.html` | Pełny interaktywny mockup (klik przycisków → toast) |
| 2 | `brand-book-1E/…/Ekran Pre-bitwa (1E).dc.html` | Opcjonalnie strona w hubie Design |
| 3 | `eksport/icons/` | 4 ikony akcji: auto, manual, retreat, save (24+40) |
| 4 | `eksport/tokens` diff | Jeśli nowe tokeny `--pb-*` → wpis do `tokens.css` |
| 5 | Screenshot **before/after** | `docs/ux/baseline/C/C-01_pre-bitwa.png` + `docs/ux/after/C/C-01_pre-bitwa-v2.png` |
| 6 | Notatka HANDOFF | Co lane UI ma przenieść 1:1 |

---

## Po Design → lane UI (nie teraz)

- Port `preBattle.ts` według v2 mockupu  
- Podpięcie `brandTokenVars` + `brandIconSvg` gdzie możliwe  
- **Bez** `main.ts` w batchu UI (callbacks bez zmian)  
- MASTER: build kanon po Opus

---

## Powiązania

- Rejestr: `docs/ux/REJEST-UX-MASTER.md` — C-01…C-03  
- Checklist Macieja (v1): `docs/MACIEJ-C1-CHECKLIST-preBattle-TW.md` (ZAMKNIĘTE 2026-06-26)  
- Handoff implementacji v1: `dyspozycje/_handoff/C1-do-UI_preBattle-TW-layout.md`  
- **Faza 2 brief (draft):** deployment C-06 + HUD C-07… — po akceptacji Fazy 1

---

## Pytania do Macieja (ABC — po mockupie Design)

**Q-PB-1 — forma overlay:**  
A) Karta wyśrodkowana (jak dziś) · B) Pełny ekran jak TW · C) Hybryda (karta + mocniejszy dim mapy)

**Q-PB-2 — pasek mocy:**  
A) Pionowy między portretami (mockup TW) · B) Tylko wiersz % w środku (jak kod dziś)

**Q-PB-3 — domyślny Enter:**  
A) Bitwa ręczna · B) Auto (jak w C1 handoff domyślnie manual — potwierdzić)
