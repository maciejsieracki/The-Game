# HANDOFF: EKONOMIA → CYWILIZACJE — kontrakt budżetu AI (produkcja)

**Data:** 2026-06-25. Routing: przez mastera. Powód: master [189] — AI (Wasz pkt 5) potrzebuje budżetu na produkcję.

## Kontrakt (proste accessory)
- `getProductionBudget(player) => player.skarbiec` — bieżący skarbiec gracza/AI (Pieniądz).
- `canAfford(player, koszt) => player.skarbiec >= koszt`.
- Koszt jednostki/budynku (Pieniądz) = `production.itemCost(...)` lub pole kosztu w `units.json`/`buildings.json`.
- **Wyjątek epoki Kamień:** jednostki kupowane za **Produkcję (Praca)**, nie Pieniądz — wtedy budżet = Praca dostępna w mieście, nie skarbiec (model kosztu jednostek: Kamień=Praca, Brąz+=Pieniądz).
- Wydanie: po zakolejkowaniu/zakupie `skarbiec -= koszt`.

## Gdzie skarbiec
`playerState.skarbiec` (per gracz; AI civ = ta sama struktura).

## Użycie po stronie AI (Wasze `chooseAIBuild`)
Przed decyzją build/recruit: `canAfford(player, itemCost)` → jeśli nie stać, wybierz tańsze albo czekaj. Mechanika wyboru = u Was; ja dostarczam tylko źródło budżetu (skarbiec) + koszt (`itemCost`). Mnożnik Handel→Pieniądz (1.7–2.4 per nacja) wpływa na tempo napełniania skarbca — wartości per-cyw wpisujecie Wy.
