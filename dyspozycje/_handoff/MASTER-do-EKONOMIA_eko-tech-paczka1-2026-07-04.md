# MASTER → EKONOMIA: EKO-TECH Paczka 1 — logika

**Data:** 2026-07-04 · **Decyzje:** `docs/decyzje/D-EKO-TECH-PACZKA1-2026-07-04.md`  
**Zależność:** JSON od CYWILIZACJE (można równolegle stub + test po danych)

## Co Odbiorca ma zrobić

### T-TECH-7 (A)
- `canResearch()` / `startResearch()`: **twarda bramka** `wymagany budynek` z tech.json (imperium = dowolne miasto).

### T-TECH-8 (wariant)
- Produkcja miasta: **upgrade** `kamienne_kregi` → `swiatynia` (zastępuje id w `builtIds`, nie duplikat slotu).
- Bonusy Świątyni = suma z JSON (nie runtime add — dane już zsumowane).

### ABC-7 (wariant)
- Konwerter **Odlewnia brązu**: ruda + paliwo → brąz.
- Upgrade **Odlewnia żelaza** — receptura żelaza po danych CYWILIZACJE.

### ABC-8 (A)
- Bramka Pismo ↔ Cegielnia spójna z T-TECH-7.

### ABC-9 (A)
- Mielerz w `availableProduction()` po Obróbce drewna.

## DoD

- [ ] Testy regresji: research gate, upgrade budynku kultu, odlewnia
- [ ] Meldunek `EKONOMIA-DO-MASTERA.md`
- [ ] **NIE** ruszać `main.ts`

## Flaga

**GOTOWE** (logika wdrożona 2026-07-04) · integracja `main.ts` → SILNIK
