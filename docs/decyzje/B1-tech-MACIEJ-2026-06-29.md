# B1 — Drzewko tech ↔ ulepszenia — decyzje Macieja (2026-06-29)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-06-29 (domknięcie ABC 2026-06-29 wieczór) |
| **Status** | **ZAMKNIĘTE** (Q1, FOUND, Q2–Q5 tech + **B1-tech-Q3=C** 2026-06-26) |
| **Źródło** | czat Grupa B / EKONOMIA |

---

## Odpowiedzi Macieja — pełna lista

### B1-Q1 = **B**

**Źródło prawdy bramki ulepszeń:** `terrain-improvements.json` — pole `tech` **1:1** z nazwami z `tech.json` (bez mastera w drzewku).

Lane: `improvement-tech.ts` czyta JSON ulepszeń; aliasy tylko legacy (Irygacja→Gospodarka wodna, Kalendarz→Matematyka).

---

### B1-Q2 = **A**

Rolnictwo + Łowiectwo w `tech.json` · Farma→Rolnictwo · Obóz→Łowiectwo · bez aliasów Rolnictwo→Garncarstwo.

---

### B1-tech-Q3 (posterunek) = **C** (Maciej 2026-06-26)

**Tech posterunku (Strażnica):** **Obróbka drewna AND Murarstwo** (obie wymagane).

→ `terrain-improvements.json` · hover mapy · Panel-A · `improvement-tech.ts`

**B1-Q3 panel** (auto-zarządca) = **A** (2026-06-27) — osobny temat, zamknięte.

---

### B1-Q4 = **Wojskowosc**

Fort na terenie → tech **Wojskowosc**.

---

### B1-Q5 = **A** (potwierdzenie)

Wyrąb FREE → Obróbka drewna → Tartak (dostęp Drewno boolean) · 25P · +3 Pracy.

---

### B1-FOUND-Q1 = **A + B**

| Składnik | Znaczenie |
|----------|-----------|
| **A** | Ludność pobierana z **największego** miasta gracza |
| **B** | Tylko miasto z populacją **≥ 2** (po odjęciu zostaje min. **1** 👤) |

Implementacja: `pickSourceCityForFounding()` w `city-founding.ts`.

Koszt: **20 Pracy + 1 ludność** (jak Osadnik).

---

### B1-FOUND-Q2 = **A**

**Pierwsze** miasto gracza na starcie = **FREE** · od **2.** miasta = 20 P + 1 👤.

---

## Silnik — batch F-B-TECH-SYNC-29

Handoff: `dyspozycje/_handoff/EKONOMIA+MAPA-do-SILNIK_B1-tech-sync-2026-06-29.md`

**Lane GOTOWE** · **Silnik:** `evaluateFoundCityAffordance` + odejmowanie pop z `sourceCityId` w `tryFoundPlayerCityAt`.

---

