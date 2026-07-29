# Handel / stół negocjacji — audyt + kierunek redesignu (2026-07-28)

Status: **Faza 1 WDROŻONA** (2026-07-28) — split UI pending + cap produkcji/zapasów. Faza 2–3 czeka.

## Objawy (Maciej)
- Oferty AI „zlepione": w kolumnie „Oni oferują” widać i to co dają, i to czego żądają; „My oferujemy” puste.
- AI oferuje surowce (np. 10 drewna/turę) bez realnej produkcji (tartaki).
- Oczekiwanie: dwie strony stołu, wycena, próg relacji, brak overpromise.

## Stan kodu (po Fazie 1)

| Element | Stan |
|---------|------|
| Kolumny My / Oni | **Split linked** — incoming: lewa = „W ofercie oddajemy”, prawa = „Oferują” + akcje |
| AI pakiet give+receive | Tak (one-shot); UI **nie** zlepia w jednej karcie |
| Wycena PN | Jest (`pnDealAcceptedByAi` / quick-deal bez zmian) |
| Cap produkcji / tartaki | **Tak** — `maxSustainablePakietyPerTura` + stawki terytorium+konwertery |
| Cap żądań od gracza | **Tak** — `clampBasketItemsToAffordable` na receiveItems |
| Twardy reject overpromise w werdykcie | Częściowo (clamp przy składaniu; werdykt Faza 3) |

## Pliki (Faza 1)
- `gra/src/ui/diplomacyAudience.ts` — linked karty pending L/R
- `gra/src/ui/diplomacyDealDisplay.ts` — `renderNegotiationDealSideOnlyHtml`
- `gra/src/game/diplomacy-ai-balance.ts` — produkcja, clamp koszyka
- `gra/src/main.ts` — `mergedResourceRatesForOwner`, `clampAiProposalPayloadToRealResources`

## Fazy wdrożenia
1. ~~UI split + cap produkcji~~ **DONE**
2. AI: składanie pozycji zgodne ze stołem dwustronnym (dalsze dopięcie pick)
3. Werdykty / trust przy accept

Czeka na deploy do `gra-robocza/` (Integrator).
