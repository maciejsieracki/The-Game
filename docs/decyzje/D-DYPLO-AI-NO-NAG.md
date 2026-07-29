# D-DYPLO-AI-NO-NAG — AI nie powtarza odrzuconej oferty

**Status:** ZAMKNIĘTE · WDROŻONE (Maciej 2026-07-29)  
**Cytat:** *„Po odrzuceniu propozycji AI niech nie proponuje tego samego w następnej turze (ani 2–3× pod rząd). Raz odrzucone = cooldown / blokada ponowienia tej samej oferty (ten sam partner + ten sam typ umowy/akcji)."*

## Decyzja

| Parametr | Wartość |
|---|---|
| **Cooldown po odrzuceniu** | **3 pełne tury** (`AI_REJECTED_OFFER_COOLDOWN_TURNS`) |
| **Klucz blokady** | `partnerOwnerId` (AI) + `actionId` (typ umowy) |
| **Różne typy** | Dozwolone (np. NAP po odrzuceniu handlu — OK) |
| **Ten sam typ** | Zablokowany do `expiresAtTurn` |

## Zachowanie

1. Gracz klika **Odrzuć** na wpisie stołu, gdy to jego kolej (`awaitingOwnerId === 0`) — zapis `rejectedAtTurn` + `expiresAtTurn = tura + 3`.
2. `enqueueNegotiationFromAiCmd` pomija propozycję, gdy para+akcja jest na cooldownie.
3. Wycofanie własnej propozycji gracza (`awaitingOwnerId !== 0`) **nie** ustawia cooldownu.
4. Stan serializowany w `meta.rejectedOfferCooldowns` (save/load).

## Pliki

- `gra/src/game/diplomacy-rejection-cooldown.ts` — logika + stała cooldownu
- `gra/src/main.ts` — zapis przy Odrzuć, filtr przy kolejce AI, save/load
- `gra/tools/diplomacy-rejection-cooldown-test.cjs` — test jednostkowy
