# C-OBCE-JEDN-Q1 — Klik w obcą jednostkę (bez własnej zaznaczonej)

**Status:** 🟢 **ZAMKNIĘTE** — Maciej **A** (2026-07-27)  
**Grupa:** C (walka / mapa) + E (UI panel kontekstowy)  
**Ekran:** [EKRAN: Mapa świata — klik w obcą jednostkę]

## Odpowiedź Macieja

> **C-OBCE-JEDN-Q1: A** — pełny panel podglądu obcej jednostki.

## Doprecyzowanie karty jednostki (2026-07-27, ten sam wątek)

Pełna **karta jednostki** (własna i obca) ma pokazywać wszystkie statusy i odznaki, m.in.:

| Element | W karcie | Na żetonie (mapa) |
|---------|----------|-------------------|
| Poziom weterana (★ do 3) | tak | tak (między symbolami kuźni i koszar — patrz Q2 dop.) |
| Ścieżka **Koszary** (parametry miękkie) | ikona koszar, kolor poziomu | tak — **po lewej** od gwiazdek |
| Ścieżka **Kuźnia** (pancerz) | ikona kuźni, kolor poziomu | tak — **po prawej** od gwiazdek |
| Pozostałe statusy | w karcie | skrót tylko jeśli sensowny |

**Kolory poziomów 1 / 2 / 3** (obie ścieżki): brąz (miedziany) → srebro → złoto.

Źródło danych: `game/unit-building-bonuses.ts` — ścieżka A (kuźnia) i B (koszary).

Szczegóły layoutu mapy + karty: `C-OBCE-JEDN-KARTA.md`.

## Status wdrożenia

| Etap | Stan |
|------|------|
| **Właściciel** | 👷 **subagent (inna sesja)** — ten czat ABC **nie implementuje** |
| **Kod** | ❌ brak — `buildUnitContextPanelMessage()` zwraca `null` dla `ownerId !== 0` |
| **Karta ze statusami** | ❌ częściowo — tooltip własnej jednostki ma weterana i `buildingBonusLabel`; brak osobnych ikon koszar/kuźnia |
| **Deploy** | czeka `działaj` |

## Decyzja

**A** — panel/skrypt: nazwa typu, właściciel, Punkty Życia, atak/obrona, poziom weterana, status relacji + pełna karta ze statusami (doprecyzowanie powyżej).
