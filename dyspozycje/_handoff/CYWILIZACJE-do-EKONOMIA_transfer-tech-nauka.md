# CYWILIZACJE → EKONOMIA (Grupa B): transfer własności tech + nauka

> **Status:** **GOTOWE** (decyzja Macieja 2026-06-28)  
> **Kanon:** `docs/decyzje/ROUTING-tech-nauka-Grupa-B.md`

---

## Co przekazuję (własność lane)

| Zasób | Ścieżka | Uwagi |
|-------|---------|-------|
| Drzewko tech (JSON) | `gra/data/tech.json` | koszty, epoki, prereq, Odblokowuje* |
| Excel źródłowy | `Technologie-drzewko.xlsx` (root projektu) | |
| Export | `gra/tools/export-tech.py` | targeted; NIGDY `export-data.py` |
| Tempo badań | `gra/src/game/tech-tempo.ts` | `applyTempoKoszt` — D1-Q2 / menu nowej gry |
| Test tempo | `gra/tools/tech-tempo-test.cjs` | jeśli istnieje |
| Paczka B1-tech | `docs/decyzje/B1-tech-*.md` | owner lane = **EKONOMIA** |

---

## Otwarte wątki po stronie B (priorytet)

1. **B1-tech Q1–Q5** — czeka litery Macieja → potem sync `tech.json` + `terrain-improvements.json` + batch F.
2. **Parametry miasta** dopisane przez B — wpisać w drzewko / unlocki w **jednym** miejscu (`tech.json` + JSON ulepszeń/budynków).
3. **Żelazo / Rolnictwo / Łowiectwo** — propozycja: `B1-tech-ulepszenia-proposal.md`.

---

## CYW zatrzymuje (tylko odczyt tech.json)

| Moduł | Dlaczego |
|-------|----------|
| `chooseAIResearch` (`ai.ts`) | logika AI — dane z B |
| `victory.ts` — `techIdsInGameScope`, nauka | warunki zwycięstwa — dane z B |
| `diplomacy.ts`, `civs.json`, bonusy | core Grupa D |

**Reguła:** bug w treści tech → ticket do **EKONOMIA**, nie patch w CYW.

---

## DoD (Grupa B potwierdza)

- [ ] Wpis w `EKONOMIA.md` § własność tech + nauka
- [ ] `docs/obieg/B-ekonomia.md` zaktualizowany
- [ ] Pierwsza zmiana drzewka po decyzji Macieja (miasto/map) — **tylko w lane B**
- [ ] Meldunek `→ SILNIK: GOTOWE` po batchu B1-tech (gdy ABC zamknięte)

**Flaga:** **→ EKONOMIA: CZEKA potwierdzenia** (transfer routing zatwierdzony przez Macieja)
