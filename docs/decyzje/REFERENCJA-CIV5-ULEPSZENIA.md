# Referencja: Civ V „Gdzie i co budować” vs Civ (The Game)

> **Materiał operacyjny Mastera** — nie ABC, nie nowe pytania do Macieja.  
> Źródło: [gry-online.pl — Civ5 poradnik](https://www.gry-online.pl/poradniki/sid-meiers-civilization-v/gdzie-i-co-budowac/z2a59c) (część za paywallem; wycinek z sesji 2026-06-27).

**Skrót w dyspozycjach:** `docs/czaty/OD-MASTERA.md` § A i § B (Kontekst Civ V).

---

## Mapa / UX (Grupa A)

| Civ V | U nas | Decyzja |
|-------|-------|---------|
| Robotnik stawia ulepszenie | Tryb **Budowa na mapie** (2A) | MAPA ghost-preview; **nie w kanonie** |
| Łodzie rybackie w mieście | Ulepszenie **heksu** (+2 żywn.) | Potwierdzić przy B1.1 — nie zmieniać samodzielnie |
| Sąsiednie heksy miasta | Pop-radius + posterunek/fort | Świadomie inne |
| — | 15 ulepszeń + render MAPA | OK |
| — | Linia granicy C | Wizual MAPA; osobno od ekonomii |

**Quick wins (po D4):** tryb Budowa w `main.ts`; bonus drogi → ruch (`ulepszenie_droga_ruch`).

---

## Ekonomia / miasto (Grupa B)

| Civ V | U nas | Uwaga |
|-------|-------|-------|
| 2 żywności / obywatel | 1 żywność / os. (normal) | Świadomie inne |
| Farma +1; Nawóz / Służba cywilna | Farma +1; irygacja +2 przy rzece | Bez tech-stacku Civ |
| Luksus +5 szczęścia | Luksus → **Wealth (W)** (D3=A) | Świadomie inne |
| Kopalnia +1 prod. | Kopalnia +2 Praca | OK |
| Marmur +5 (kamieniołom) | Kamień + Praca | OK |

---

## Luka integracyjna (priorytet techniczny)

1. **`terrain-improvements.json` + render MAPA** ≠ **`tileYield()`** — bonusy ulepszeń **nie wpływają na turę**.
2. **`WorkedTile`** — brak pola `ulepszenie` w ścieżce yield.
3. **`assignWorkedTiles`** — silnik OK; panel miasta czasem używa starego radius → dopiąć przy **B1.4**.

**Kolejność (bez zmian):** D4 Excel → B1.1 → B1.4 → `→ SILNIK: GOTOWE` → Grupa F (TEST).

---

## Świadomie NIE na v1.0

- Specjaliści Civ5 (B2-Q4 odłożone)
- Płaskie +5 luksusów
- Fertilizer / Civil Service 1:1
- Kopiowanie mikro Civ (auto-praca pól — B1.4 ma być prostsze)

---

## Wycofanie tego dokumentu

Usuń plik + sekcje „Kontekst Civ V” w `OD-MASTERA` § A/B — nie wpływa na kod.
