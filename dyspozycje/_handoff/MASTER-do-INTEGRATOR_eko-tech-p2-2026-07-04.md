# Handoff MASTER → INTEGRATOR (Grupa F) — EKO-TECH Paczka 2

**Data:** 2026-07-04 · **Status:** GOTOWE  
**Decyzje:** `docs/decyzje/PACZKA-2-EKO-TECH-ABC-2026-07-04.md` (ABC-10/11/14 = A)

## Co przesyłam

| Obszar | Pliki | Zmiana |
|--------|-------|--------|
| DANE | `gra/data/buildings.json` | `fort` → nazwa **Cytadela** |
| DANE | `gra/data/terrain-improvements.json` | mapa `fort` → nazwa **Fort** |
| EKONOMIA | `gra/data/econ-params.json` | bufor Spichlerza **70%** (normal) |
| MAPA | `gra/src/map/improvement-build.ts` | `popalnia_brazu` tylko na złożu rudy |

## Co Odbiorca ma zrobić

1. Sync JSON → `gra-robocza/data/` jeśli brakuje.
2. **Build ROBOCZA** — bramka: `node tools/eko-tech-paczka2-test.cjs` (9/9) + `node tools/eko-tech-paczka1-test.cjs` (9/9).
3. Meldunek `→ MASTER: GOTOWE-ROBOCZA` z md5.

## DoD

- [ ] Test paczka2 zielony
- [ ] W grze: panel budowy pokazuje **Cytadela** (nie Fort)
- [ ] Popalnia brązu nie podświetla równiny bez złoża
- [ ] Po wzroście pop ze Spichlerzem zostaje ~70% bufora (normal)

**main.ts:** brak zmian wymaganych.
