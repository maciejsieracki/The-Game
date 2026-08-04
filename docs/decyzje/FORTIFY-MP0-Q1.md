# FORTIFY-MP0-Q1 — Ufortyfikuj bez wymogu punktów ruchu

| Pole | Wartość |
|------|---------|
| **ID** | FORTIFY-MP0-Q1 |
| **Ekran** | Panel akcji jednostki (Ufortyfikuj / garnizon) + fortyfikacja w polu |
| **Status** | 🟢 **WDROŻONE w kodzie** — zamknięta dyskusja (Maciej 2026-08-04) |
| **Decyzja** | **C** |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> Ufortyfikuj / garnizon **bez wymogu punktów ruchu** (miasto i pole).

---

## Reguła gameplay (kanon)

| Obszar | Ustalenie |
|--------|-----------|
| **Garnizon miasta** | Akcja „Ufortyfikuj" na heksie własnego miasta jest **dostępna przy `ruchLeft = 0`** (np. po wejściu z końcówką ruchu lub po zużyciu puli w tej turze). |
| **Fortyfikacja w polu** | Ta sama zasada — „Ufortyfikuj" poza miastem **nie wymaga** pozostałych punktów ruchu. |
| **Koszt wejścia** | Wejście w tryb nadal **zeruje** `ruchLeft` na resztę tury (jak dotąd); brak MP **nie blokuje** przycisku. |
| **Wyjście** | Odfortyfikowanie / zdjęcie fortyfikacji w polu — bez kosztu ruchu (bez zmian; patrz `ODFORT-Q1-Q2.md`). |

---

## Implikacje implementacyjne

- `unitFortifyActionDisabled` — **nie** wyłączać „Ufortyfikuj" z powodu `stackRuch <= 0`.
- Bramka MP dotyczy wyłącznie akcji, które **zużywają** ruch przy wejściu w inny tryb (np. Czuwaj) — nie fortyfikacji.

---

## Powiązane

- `ODFORT-Q1-Q2.md` — odfortyfikowanie, snapshot `ruchLeft`, anti-exploit
- `gra/src/game/armyMerge.ts` — `enterGarnizon`, `enterFieldFortify`
- `gra/src/main.ts` — `unitFortifyActionDisabled`, akcja `fortify`
