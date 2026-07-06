# ⏰ PRzypomnienie Macieja — 2026-06-30

| Pole | Wartość |
|------|---------|
| **ID** | REMIND-SUROWCE-ULEPSZENIA-START |
| **Data zapisu** | 2026-06-29 |
| **Przypomnij** | **2026-06-30** (jutro) |
| **Status** | 🟠 **U INTEGRATORA** — gate w `improvement-build.ts` + test 41/41 |
| **Decyzja** | **A** — złoże rezerwuje hex; gracz **nie** stawia ulepszenia na hex ze złożem |
| **Lane** | MAPA + EKONOMIA (+ Integrator przy wpięciu) |

---

## Treść (Maciej)

> **Oddzielić surowce od ulepszeń na starcie**, które generuje mapa.  
> Trzeba to **rozdzielić**, bo inaczej będzie generować **konflikty w późniejszej rozgrywce**.

---

## Kontekst techniczny (dla Mastera jutro)

Na heksie dziś mogą współistnieć m.in.:
- **Surowce / złoża** (`deposit`, ruda, glina…) — reguły epoki, widoczność (E1-Q9)
- **Ulepszenia terenu** (pola, pastwiska, plantacje…) — FOOD-HODOWLA, `terrain-improvements.json`
- **Dekor / las** vs gameplay — osobny wątek (las parity)

**Ryzyko konfliktu:** ten sam hex = złoże + ulepszenie + plon + praca miasta → kolizje w ekonomii, okolicy, warstwach renderu.

**Powiązane:** `KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` · FOOD-HODOWLA P2 · `generator.ts` · `map-deposits-era-test`

---

## Następny krok (jutro)

1. Master przypomina Maciejowi na starcie czatu.
2. Przygotować **ABC** (jak rozdzielić: warstwy danych? priorytet? co gracz widzi na starcie?).
3. Dyspozycja do **MAPA** + **EKONOMIA** + handoff Integratora.
