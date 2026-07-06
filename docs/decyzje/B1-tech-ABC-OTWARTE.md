# B1 — Drzewko tech ↔ ulepszenia terenu — **OTWARTE (czeka Maciej ABC)**

| Pole | Wartość |
|------|---------|
| **Data analizy** | 2026-06-28 |
| **Status** | **→ `B1-tech-MACIEJ-2026-06-29.md`** — **ZAMKNIĘTE** (Q1B, FOUND A+B / Q2A) |
| **Lane po ABC** | **EKONOMIA** (`tech.json`, Excel, ulepszenia, budynki) + SILNIK (usunięcie aliasów) |

---

## Co już działa (bez tej decyzji)

- Wyrąb / Tartak / tech gate w ROBOCZA (batch F-B-WYRAB-TARTAK)
- Tartak: +3 Pracy, `surowiecOdblokowany: drewno` w JSON
- Tymczasowe aliasy w `improvement-tech.ts` (Farma→Garncarstwo itd.)

---

## Pytania do Macieja (odpowiedz skrótem: Q1A Q2A …)

### Q1 — Źródło prawdy bramki ulepszeń

- **A)** `tech.json` master + pole „Odblokowuje ulepszenie” *(rekomendacja lane)*
- **B)** zostaje `terrain-improvements.json`, nazwy tech 1:1 bez aliasów *(szybciej v1.0)*

### Q2 — Nowe technologie Kamień

- **A)** dodaj **Rolnictwo** + **Łowiectwo** do `tech.json` *(rekomendacja)*
- **B)** Farma→Garncarstwo, Obóz→Wojskowosc (status quo aliasów)

### Q3 — Posterunek (Strażnica)

- **A)** tech **Wojskowosc** (Brąz)
- **B)** tech **Brązownictwo**
- **C)** bez tech, tylko epoka ≥ 2 *(jak dziś w JSON)*

### Q4 — Fort na terenie

- **A)** tech **Inżynieria** *(zgodnie z tech.json + budynkiem)*
- **B)** tech **Budownictwo** *(jak dziś w terrain-improvements.json)*

### Q5 — Łańcuch drewna (potwierdzenie)

- **A)** Wyrąb FREE → Obróbka drewna → Tartak (teren) = dostęp Drewno + Stolarnia (miasto) *(kanon B1)*
- **B)** inna kolejność — dopisz

---

## Po zamknięciu ABC — plan lane

1. **EKONOMIA (Grupa B):** `tech.json` + `Technologie-drzewko.xlsx` (+ Rolnictwo/Łowiectwo jeśli Q2A)
2. **EKONOMIA:** sync `Ulepszenia-terenu.xlsx` + export JSON
3. **EKONOMIA:** usunąć `TECH_CANONICAL` aliasy (jeśli Q1A/B)
4. **→ SILNIK:** batch `F-B-TECH-SYNC` (weryfikacja panelu Budowa + picker badań)

**Handoff po ABC:** `dyspozycje/_handoff/EKONOMIA-do-SILNIK_tech-ulepszenia-sync.md`
