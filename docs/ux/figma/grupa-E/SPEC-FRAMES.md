# Specyfikacja frame’ów — Grupa E (07 Screens E)

**Canvas:** 1920×1080 · **Tło:** `color/bg/deep` `#080a12` + opcjonalny gradient/wideo (30% opacity)  
**Decyzje:** 1B · 2C · 4C · 5C · 3C (`ui-menu`, `ui-close`, `ui-check`)  
**Baseline:** import z `export/E-*.png` jako warstwa „PRZED” @ **35% opacity**, **lock**

---

## Kolejność layoutu (po GOTOWE 00–02)

**Grupa E startuje jako pierwsza** w layoutcie Figma · reszta grup czeka.

| Krok | Frame | Uwaga |
|------|-------|--------|
| **1** | **E-01 Menu** | Priorytet wizualny — pierwsze wrażenie |
| 2 | E-03 Ustawienia | |
| 3 | E-09 Epoka | |
| 4 | E-10 Cywilizacja | |
| 5 | E-11 Ustawienia gry | |
| 6 | E-15 Game over | + wariant porażka |

**Cel jakości:** baseline ~35% + instancje **Panel 5C** · **Btn 4C** · **Chip 6C** ze strony 1 DS.  
**Review Macieja:** [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) — gdy frame’y gotowe.

---

## Wspólne komponenty (z 01 Components — instancje)

| Komponent | Użycie w E |
|-----------|------------|
| `Btn/Outline/Primary` | Rozpocznij grę, ROZPOCZNIJ GRĘ, Nowa gra |
| `Btn/Outline/Default` | Ustawienia, Więcej, Wstecz, Dalej |
| `Btn/Outline/Disabled` | Kampania WKRÓTCE, Multiplayer WKRÓTCE |
| `Panel/Frame/5C` | Karta ustawienia (suwak), karta epoki, karta cywilizacji |
| `StepBar/Creator` | Pasek: Intro · Epoka · Cywilizacja · Ustawienia · Start |
| `Icon/ui-check` | Krok ukończony na pasku |
| `Text/Title/Georgia` | THE GAME, NOWA GRA, nagłówki h2 |
| `Text/Label/UI` | Segoe UI, uppercase, letter-spacing 0.2em |

---

## E-01 — Menu główne

**Frame:** `E-01 · Menu główne` · baseline: `E-01_menu-glowne.png`

| Warstwa | Spec |
|---------|------|
| Tło | `#080a12` + radial gold glow center · opcjonalnie placeholder wideo |
| Emblem | 96×96 · okrąg 2px `gold/dim` · gwiazda/kompas line 3C |
| Label | „CYWILIZACJA · THE GAME” · Segoe 10px · `parchment/muted` · tracking 0.5em |
| Tytuł | **THE GAME** · Georgia 58px · `gold/primary` · tracking 0.22em |
| Ornament | linie + romb · `gold/dim` |
| Sub | „Wersja 0.1 · Kamień, Brąz & Żelazo” · Segoe 11px |
| Stack przycisków | max-width 380px · gap 11px |
| CTA | **Rozpocznij grę** · Btn/Outline/Primary · ikona ◆ |
| Secondary | Kampania / Multiplayer · disabled + badge WKRÓTCE |
| | Ustawienia · Btn/Outline/Default |
| | Więcej ▾ · Btn/Outline/Default |
| Footer | „THE GAME · prototyp v0.1” · Segoe 10px · muted |

---

## E-03 — Ustawienia globalne

**Frame:** `E-03 · Ustawienia` · baseline: `E-03_ustawienia.png`

| Element | Spec |
|---------|------|
| Nagłówek | **Ustawienia** · Georgia 28px · centered |
| Siatka | 2×3 · gap 18px · max-width 760px |
| Karta (×6) | Panel/Frame/5C · padding 16–18px |
| Wiersze | Muzyka · Efekty · Jakość grafiki · Język · Skala UI · Mgła wojny |
| Kontrolka | strzałki ‹ › · wartość + opis italic (Segoe 10px muted) |
| Footer | **← Wstecz do menu** · Btn/Outline/Default |

---

## E-09 — Kreator krok 2 · Epoka

**Frame:** `E-09 · Epoka startowa` · baseline: `E-09_kreator-krok2-epoka.png`

| Element | Spec |
|---------|------|
| Header | „Kreator Nowej Gry” · **THE GAME** · StepBar aktywny krok 2 |
| h2 | **Epoka Startowa** · Georgia |
| Grid | 3 karty · Epoka Kamienia / Brązu / Żelazo |
| Karta epoki | Panel/5C · ikona emoji zastąpić line-art 3C · badge „X cyw.” · flavor text |
| Selected | obrys `gold/primary` 2px + glow |
| Nav | Wstecz · „Krok 2 z 5” · Dalej → |

---

## E-10 — Kreator krok 3 · Cywilizacja

**Frame:** `E-10 · Wybór cywilizacji` · baseline: `E-10_kreator-krok3-cywilizacja.png`

| Element | Spec |
|---------|------|
| StepBar | krok 3 active · 1–2 done (ui-check) |
| Layout | grid ikon (lewo) + panel szczegółów 5C (prawo) |
| Karta cyw. | 80–96px ikona · nazwa PL · selected = gold border |
| Detail | bonusy · jednostka specjalna · blok „Start w klastrze typu” |
| Nav | Wstecz · Dalej |

---

## E-11 — Kreator krok 4 · Ustawienia rozgrywki

**Frame:** `E-11 · Ustawienia rozgrywki` · baseline: `E-11_kreator-krok4-ustawienia.png`

| Element | Spec |
|---------|------|
| StepBar | krok 4 active |
| Siatka | Trudność · Rozmiar mapy · Typ świata · Prędkość · Miasta-państwa · Typy cyw. |
| Podgląd startu | Panel/5C · „Twój start (podgląd)” |
| Akcje | **Zaawansowane opcje** (outline) · **◆ ROZPOCZNIJ GRĘ ◆** (primary) |
| Nota | Segoe 11px muted — miasta-państwa vs typy |

---

## E-15 — Game Over

**Frame:** `E-15 · Game over — zwycięstwo` · baseline: `E-15_game-over.png`  
**Wariant 2 (opcjonalny sub-frame):** `E-15b · porażka` — ten sam layout, akcent `semantic/red`

| Element | Spec |
|---------|------|
| Overlay | `#000` 82% · full screen |
| Tytuł | Georgia 2em · **ZWYCIĘSTWO — dominacja typu** · `gold/primary` |
| Sub | „Gratulacje! Zbudowałeś potężne imperium.” · muted |
| CTA | **Nowa gra** · Btn/Primary filled gold · Segoe bold |
| Porażka | tytuł czerwony `#c84040` · sub „Twoje panowanie dobiegło końca.” · btn red fill |

---

## Kolejność rysowania w Figmie

1. Import 6 baseline → lock @ 35%
2. StepBar + Btn + Panel (instancje z 01)
3. E-01 → E-03 → E-09 → E-10 → E-11 → E-15
4. Export PNG @1x → `export/E-01_po.png` … (po redesignie)

---

*Grupa E · 2026-07-01 · do wklejenia na stronie 07 Screens E*
