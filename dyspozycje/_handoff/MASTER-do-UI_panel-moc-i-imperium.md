# MASTER → UI: Panel Moc + raporty imperium (mockup)

**Status:** CZEKA (decyzja Macieja D16 — miejsce panelu)  
**Data:** 2026-07-03  
**Lane:** UI (+ konsultacja MASTER)

## Problem

1. Klik w **Moc** (środek górnego paska) otwiera **stary modal** (`powerOverlayHud.ts`) — wygląd sprzed design systemu 1E, mało informacji.
2. Klik w **chipy zasobów** (Skarbiec, Praca, Nauka…) — potrzebny spójny **raport imperium** z tabelami per miasto.
3. Do rozstrzygnięcia: czy raport ma być w **panelu imperium (slide-in z prawej)** czy w **panelu zdarzeń** (strefa H mockupu 1E, nad WYKONAJ).

## Co już jest w silniku (do mockupu — nie wymyślać od zera)

Kanon **P-A** — `gra/data/power-params.json`, `power-objective.ts`:

| Składnik | Współczynnik | Surowa ilość (przykład) |
|----------|-------------|-------------------------|
| Armia | ×25 | suma M_pole jednostek |
| Wygrane bitwy | ×1 (model enemy_m) | pkt z pokonanych składów |
| Ludki | ×5 | suma slotów populacji miast |
| Rekruci (ekw. jedn.) | ×5 | floor(rekruci / koszt werbu) |
| Miasta | ×50 | liczba miast |
| Terytorium | ×0.5 | heksy w zasięgu |
| Budynki | ×5 | suma budynków |
| Tech | ×20 | zbadane technologie |
| Ulepszenia terenu | ×5 | ulepszenia w terytorium |

**Moc** = suma (ilość × współczynnik). **Respekt** w dyplomacji = stosunek Mocy gracza do rozmówcy (osobna linia UI).

Tymczasowo w kodzie: panel boczny `empireDetailPanel.ts` — tabela z kolumnami: Składnik | Ilość | × wsp. | = pkt | % | Skąd.

## Zlecenie designera

### Ekrany do zaprojektowania (Figma / HTML mockup 1E)

1. **Moc imperium** — zastępuje stary modal centrum:
   - Nagłówek: ⚜ Moc {N} + podtytuł P-A
   - Tabela 9 składników (jak wyżej) + pasek udziału % per wiersz
   - Opcjonalnie: rozwijany drill-down (np. Armia → lista jednostek / Miasta → lista grodów)
   - Ranking cywilizacji (top N + wyróżnienie gracza)
   - Blok Respekt (przykład wobec znanego AI)
   - **Bez** przycisku „Zamknij” na środku ekranu — spójne z slide-in / panelem bocznym

2. **Raport zasobu** (Skarbiec / Praca / Nauka / Kultura / Ludność / Rekruci):
   - Nagłówek z ikoną brand (`res-treasury`, `res-work`, …)
   - Suma imperium + /t
   - Tabela per miasto (już zaimplementowana logika — patrz `empireDetailPanel.ts`)
   - Dla Rekrutów: pasek puli + „można werbować X jedn.”

3. **Ikony** — podmiana mock-upów: Kultura (`res-culture`), spójność z `icons-manifest.json`.

### Referencje

- Mockup HUD: `The Game - HUD Mapy layout (1E).dc.html` — strefa H (zdarzenia), górny pasek 6C
- Obecny slide-in: `gra/src/ui/empireDetailPanel.ts`
- **Wycofać wizualnie:** `powerOverlayHud.ts`, `empireOverlayHud.ts` (modal centrum) po akceptacji mockupu

## Decyzja Macieja (D16) — miejsce panelu

| | Opcja | Opis |
|---|--------|------|
| **A** | Panel imperium (prawy slide-in) | Wszystkie chipy + Moc → jeden panel, scroll do sekcji (**obecny kierunek kodu**) |
| **B** | Panel zdarzeń (prawy, strefa H) | Chip zasobu **zastępuje** listę wydarzeń raportem; powrót = zamknięcie / Esc |
| **C** | Hybryda | Zasoby ekonomiczne → panel zdarzeń; Moc + parametry cywilizacji → slide-in imperium |

**Rekomendacja MASTER:** **A** na v1.0 (mniej konfliktów z blocking events / WYKONAJ); **B** jako iteracja UX po playteście.

## DoD mockupu

- [ ] Moc: 9 wierszy z formułą, ranking, Respekt — czytelne na 1080p
- [ ] Raport Skarbiec: tabela miast, footnote o utrzymaniu
- [ ] Spójność tokenów `--civ-gold-primary`, medaliony 6C
- [ ] Mobile / wąski viewport: scroll, bez modala centrum
- [ ] Maciej sign-off ABC (D16) przed implementacją Composer

## Po mockupie

UI lane implementuje wybrany wariant → MASTER wpina → Opus review → kanon.
