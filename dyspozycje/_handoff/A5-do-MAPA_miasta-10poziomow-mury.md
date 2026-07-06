# A5 → MAPA — miasta: 10 poziomów × cywilizacja × mur / bez muru

**Status:** **W TOKU (audit 2026-06-29)** — API gotowe; podgląd grid + sign-off Macieja  
**Decyzja Macieja:** **A5-Q1=custom** (2026-06-27)  
**Powiązane:** D12=A · `gra/src/render/bronzeCity.ts`

---

## Co przesyłam (decyzja produktowa)

Maciej: dla **każdej cywilizacji** — **10 poziomów rozwoju** miasta na mapie świata; każdy poziom w wersji **z murem** i **bez muru**.

Obecny podgląd (4 modele brązu) **niewystarczający** — dopracować **pozostałe cywilizacje** i pełną skalę 1–10.

---

## Co Odbiorca ma zrobić

1. **Audit** `bronzeCity.ts` — które civ / level / withWalls są tylko placeholderem.
2. **Uzupełnić** meshe dla wszystkich typów z `BRONZE_CIVS` (10) × poziomy 1–10 × 2 warianty muru.
3. **Podgląd HTML** — selector: cywilizacja, poziom 1–10, toggle mur; wszystkie kombinacje.
4. **Kontrakt render** w `cities.ts`:
   - `level` z populacji/era (propozycja — uzgodnić z EKONOMIA jeśli brak)
   - `withWalls` z `city.maMur`
5. Meldunek → `MAPA-DO-MASTERA.md` + `docs/decyzje/A5-wyglad-miast-mapa.md` (tabela postępu)

---

## DoD

- [ ] 10 cywilizacji × 10 poziomów × mur ON/OFF — wizualnie odróżnialne w podglądzie
- [ ] Mur ON widoczny po `maMur` (spójne z budynkiem Mury w mieście)
- [ ] Sign-off Macieja na podglądzie (przed wpięciem kanonu)
- [ ] Bez edycji `main.ts` (SILNIK wpina)

**Flaga:** CZEKA MAPA
